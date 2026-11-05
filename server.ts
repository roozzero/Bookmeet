import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { mysqlDb, PublicClubMember } from './server/db/mysql.ts';

declare global {
  namespace Express {
    interface Request {
      authUser?: PublicClubMember;
      authToken?: string;
    }
  }
}

function parseCookies(cookieHeader?: string): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const key = parts.shift()?.trim();
    if (key) {
      list[key] = decodeURIComponent(parts.join('=').trim());
    }
  });
  return list;
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }
  const cookies = parseCookies(req.headers.cookie);
  if (cookies.bookmeet_token) {
    return cookies.bookmeet_token;
  }
  return null;
}

function setAuthCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
  const cookieParts = [
    `bookmeet_token=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    `Max-Age=${maxAge}`,
    isProd ? 'SameSite=Lax' : 'SameSite=Lax',
  ];
  res.setHeader('Set-Cookie', cookieParts.join('; '));
}

function clearAuthCookie(res: Response): void {
  res.setHeader(
    'Set-Cookie',
    'bookmeet_token=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax'
  );
}

async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({ error: 'لطفاً ابتدا وارد حساب کاربری خود شوید.' });
      return;
    }
    const member = await mysqlDb.verifyAuthToken(token);
    if (!member) {
      clearAuthCookie(res);
      res.status(401).json({
        error: 'نشست کاربری شما منقضی شده یا نامعتبر است. لطفاً مجدداً وارد شوید.',
      });
      return;
    }
    req.authUser = member;
    req.authToken = token;
    next();
  } catch (error) {
    console.error('Authentication check failed (MySQL error):', error);
    res.status(503).json({
      error: 'خطا در برقراری ارتباط با دیتابیس MySQL هنگام بررسی احراز هویت.',
    });
  }
}

async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await requireAuth(req, res, async () => {
    if (!req.authUser || req.authUser.role !== 'admin') {
      res.status(403).json({
        error: 'دسترسی غیرمجاز: این بخش فقط مخصوص مدیر باشگاه است.',
      });
      return;
    }
    next();
  });
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json({ limit: '10mb' }));

  // ==================== PUBLIC WEBSITE API ROUTES ====================

  app.get('/api/health', async (_req, res) => {
    try {
      await mysqlDb.verifyConnection();
      res.status(200).json({
        status: 'ok',
        database: 'mysql',
        connected: true,
      });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        database: 'mysql',
        connected: false,
        error:
          error instanceof Error
            ? error.message
            : 'MySQL database connection failed',
      });
    }
  });

  app.use('/api', async (_req, res, next) => {
    try {
      await mysqlDb.ensureInitialized();
      next();
    } catch (error) {
      res.status(503).json({
        error:
          'خطا در اتصال به دیتابیس MySQL. لطفاً از روشن بودن سرویس MySQL در XAMPP و صحت تنظیمات فایل .env اطمینان حاصل کنید.',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.get('/api/bootstrap', async (_req, res) => {
    try {
      const [
        navigationLinks,
        heroSettings,
        featuredBooks,
        aboutClub,
        aboutManager,
        libraryBooks,
        blogPosts,
        contactInfo,
        publicSessions,
        publicClasses,
        approvedComments,
      ] = await Promise.all([
        mysqlDb.getNavigationLinks(),
        mysqlDb.getHeroSettings(),
        mysqlDb.getFeaturedBooks(),
        mysqlDb.getAboutClub(),
        mysqlDb.getAboutManager(),
        mysqlDb.getLibraryBooks(),
        mysqlDb.getBlogPosts(),
        mysqlDb.getContactInfo(),
        mysqlDb.getPublicActiveSessions(),
        mysqlDb.getPublicActiveClasses(),
        mysqlDb.getApprovedComments(),
      ]);

      res.json({
        navigationLinks,
        heroSettings,
        featuredBooks,
        aboutClub,
        aboutManager,
        libraryBooks,
        blogPosts,
        contactInfo,
        publicSessions,
        publicClasses,
        approvedComments,
      });
    } catch (error) {
      console.error('Database fetch error (/api/bootstrap):', error);
      res.status(503).json({
        error: 'خطا در اتصال به دیتابیس MySQL. لطفاً از روشن بودن سرویس MySQL اطمینان حاصل کنید.',
      });
    }
  });

  app.post('/api/comments', async (req, res) => {
    try {
      const { author_name, author_phone, target_title, target_type, rating, comment_text } =
        req.body || {};
      if (!author_name || !comment_text || !target_title) {
        res.status(400).json({ error: 'لطفاً نام و متن دیدگاه خود را وارد نمایید.' });
        return;
      }
      const saved = await mysqlDb.saveUserComment({
        author_name: String(author_name).trim(),
        author_phone: String(author_phone || '').trim(),
        target_title: String(target_title).trim(),
        target_type: String(target_type || 'نشست کتاب‌خوانی').trim(),
        rating: Number(rating || 5),
        comment_text: String(comment_text).trim(),
        status: 'در انتظار تایید',
      });
      res.status(201).json({ success: true, comment: saved });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در ثبت دیدگاه در دیتابیس MySQL';
      res.status(400).json({ error: message });
    }
  });

  app.get('/api/about-club', async (_req, res) => {
    try {
      const aboutClub = await mysqlDb.getAboutClub();
      res.json({ aboutClub });
    } catch (error) {
      console.error('Failed to fetch about_club:', error);
      res.status(503).json({ error: 'خطا در دریافت اطلاعات درباره باشگاه از MySQL' });
    }
  });

  app.get('/api/about-manager', async (_req, res) => {
    try {
      const aboutManager = await mysqlDb.getAboutManager();
      res.json({ aboutManager });
    } catch (error) {
      console.error('Failed to fetch about_manager:', error);
      res.status(503).json({ error: 'خطا در دریافت اطلاعات مدیر باشگاه از MySQL' });
    }
  });

  app.get('/api/library', async (_req, res) => {
    try {
      const libraryBooks = await mysqlDb.getLibraryBooks();
      res.json({ libraryBooks });
    } catch (error) {
      console.error('Failed to fetch library_books:', error);
      res.status(503).json({ error: 'خطا در دریافت لیست کتاب‌ها از MySQL' });
    }
  });

  app.get('/api/blog', async (_req, res) => {
    try {
      const blogPosts = await mysqlDb.getBlogPosts();
      res.json({ blogPosts });
    } catch (error) {
      console.error('Failed to fetch blog_posts:', error);
      res.status(503).json({ error: 'خطا در دریافت مقالات وبلاگ از MySQL' });
    }
  });

  app.get('/api/contact', async (_req, res) => {
    try {
      const contactInfo = await mysqlDb.getContactInfo();
      res.json({ contactInfo });
    } catch (error) {
      console.error('Failed to fetch contact_info:', error);
      res.status(503).json({ error: 'خطا در دریافت اطلاعات تماس از MySQL' });
    }
  });

  app.post('/api/contact', async (req, res) => {
    try {
      const { full_name, email, subject, message } = req.body || {};
      if (!full_name || !email || !message) {
        res.status(400).json({ error: 'لطفاً تمامی فیلدهای ضروری را تکمیل نمایید.' });
        return;
      }
      const saved = await mysqlDb.createContactMessage({
        full_name: String(full_name).trim(),
        email: String(email).trim(),
        subject: String(subject || 'پیام از طرف بازدیدکننده سایت').trim(),
        message: String(message).trim(),
      });
      res.status(201).json({ success: true, messageRecord: saved });
    } catch (error) {
      console.error('Failed to store contact_message:', error);
      res.status(503).json({ error: 'خطا در ذخیره پیام در دیتابیس MySQL' });
    }
  });

  app.get('/api/books', async (_req, res) => {
    try {
      const books = await mysqlDb.getFeaturedBooks();
      res.json({ books });
    } catch (error) {
      console.error('Failed to fetch books:', error);
      res.status(503).json({ error: 'خطا در دریافت کتاب‌ها از MySQL' });
    }
  });

  // ==================== AUTHENTICATION API ROUTES ====================

  app.post('/api/auth/register', async (req, res) => {
    try {
      const {
        first_name,
        last_name,
        phone,
        education,
        password,
        confirm_password,
      } = req.body || {};

      if (
        !first_name ||
        !last_name ||
        !phone ||
        !education ||
        !password ||
        !confirm_password
      ) {
        res.status(400).json({ error: 'لطفاً تمامی فیلدهای ثبت‌نام را تکمیل نمایید.' });
        return;
      }

      if (String(password) !== String(confirm_password)) {
        res
          .status(400)
          .json({ error: 'رمز عبور و تکرار رمز عبور با یکدیگر مطابقت ندارند.' });
        return;
      }

      const { member, token } = await mysqlDb.registerClubMember({
        first_name: String(first_name).trim(),
        last_name: String(last_name).trim(),
        phone: String(phone).trim(),
        education: String(education).trim(),
        password_plain: String(password),
      });

      setAuthCookie(res, token);
      res.status(201).json({ success: true, member, token });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در ثبت‌نام عضو جدید در باشگاه';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { phone, password } = req.body || {};
      if (!phone || !password) {
        res
          .status(400)
          .json({ error: 'لطفاً شماره تلفن و رمز عبور خود را وارد نمایید.' });
        return;
      }

      const { member, token } = await mysqlDb.loginClubMember({
        phone: String(phone).trim(),
        password_plain: String(password),
      });

      setAuthCookie(res, token);
      res.json({ success: true, member, token });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'ورود به حساب کاربری انجام نشد.';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/auth/logout', async (req, res) => {
    try {
      const token = extractToken(req);
      if (token) {
        await mysqlDb.revokeAuthToken(token);
      }
      clearAuthCookie(res);
      res.json({ success: true });
    } catch {
      clearAuthCookie(res);
      res.json({ success: true });
    }
  });

  app.get('/api/auth/me', requireAuth, async (req, res) => {
    res.json({ success: true, member: req.authUser });
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { phone } = req.body || {};
      if (!phone) {
        res.status(400).json({ error: 'لطفاً شماره تلفن همراه خود را وارد نمایید.' });
        return;
      }

      res.json({
        success: true,
        message: 'لینک تغییر رمز برای شما پیامک خواهد شد.',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'ارسال پیامک بازیابی رمز عبور انجام نشد.';
      res.status(400).json({ error: message });
    }
  });

  // ==================== MEMBER PANEL API ROUTES (AUTHENTICATED) ====================

  app.get('/api/panel', requireAuth, async (req, res) => {
    try {
      const authenticatedPhone = req.authUser!.phone;
      const panelData = await mysqlDb.getMemberPanelData(authenticatedPhone);
      res.json(panelData);
    } catch (error) {
      console.error('Failed to load member panel data:', error);
      res.status(500).json({ error: 'خطا در دریافت اطلاعات پنل کاربری از دیتابیس MySQL' });
    }
  });

  app.put('/api/panel/profile', requireAuth, async (req, res) => {
    try {
      const {
        first_name,
        last_name,
        education,
        email,
        avatar_url,
        bio,
      } = req.body || {};
      if (!first_name || !last_name) {
        res.status(400).json({ error: 'نام و نام خانوادگی الزامی است.' });
        return;
      }
      const member = await mysqlDb.updateMemberProfile({
        memberId: req.authUser!.id,
        first_name: String(first_name).trim(),
        last_name: String(last_name).trim(),
        education: String(education || req.authUser!.education || 'کارشناسی').trim(),
        email: String(email || '').trim(),
        avatar_url: avatar_url !== undefined ? String(avatar_url) : undefined,
        bio: String(bio || '').trim(),
      });
      res.json({ success: true, member });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در بروزرسانی پروفایل';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/panel/sessions/note', requireAuth, async (req, res) => {
    try {
      const { sessionId, member_note } = req.body || {};
      const updated = await mysqlDb.updateMemberSessionNote({
        sessionId: Number(sessionId),
        member_phone: req.authUser!.phone,
        member_note: String(member_note || '').trim(),
      });
      res.json({ success: true, session: updated });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در ثبت یادداشت جلسه';
      res.status(400).json({ error: message });
    }
  });

  app.patch('/api/panel/library', requireAuth, async (req, res) => {
    try {
      const { bookId, pages_read, progress_percent, reading_status, personal_note } =
        req.body || {};
      const updated = await mysqlDb.updateMemberLibraryItem({
        bookId: Number(bookId),
        member_phone: req.authUser!.phone,
        pages_read: pages_read !== undefined ? Number(pages_read) : undefined,
        progress_percent:
          progress_percent !== undefined ? Number(progress_percent) : undefined,
        reading_status: reading_status || 'در حال مطالعه',
        personal_note: String(personal_note || '').trim(),
      });
      res.json({ success: true, book: updated });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در بروزرسانی کتاب';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/panel/library', requireAuth, async (req, res) => {
    try {
      const {
        book_title,
        author,
        translator,
        reading_status,
        pages_count,
        personal_note,
      } = req.body || {};
      if (!book_title || !author) {
        res.status(400).json({ error: 'عنوان کتاب و نام نویسنده الزامی است.' });
        return;
      }
      const created = await mysqlDb.addMemberLibraryBook({
        member_phone: req.authUser!.phone,
        book_title: String(book_title).trim(),
        author: String(author).trim(),
        translator: String(translator || '—').trim(),
        reading_status: reading_status || 'در نوبت مطالعه',
        pages_count: Number(pages_count || 320),
        personal_note: String(personal_note || '').trim(),
      });
      res.status(201).json({ success: true, book: created });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در افزودن کتاب به کتابخانه من';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/panel/tickets', requireAuth, async (req, res) => {
    try {
      const {
        member_phone,
        subject,
        department,
        priority,
        message,
        attachment_name,
      } = req.body || {};
      if (!subject || !message) {
        res.status(400).json({ error: 'عنوان تیکت و متن پیام الزامی است.' });
        return;
      }
      const targetPhone =
        req.authUser!.role === 'admin' && member_phone
          ? String(member_phone).trim()
          : req.authUser!.phone;

      const created = await mysqlDb.createMemberTicket({
        member_phone: targetPhone,
        subject: String(subject).trim(),
        department: String(department || 'پشتیبانی اعضا').trim(),
        priority: priority || 'عادی',
        message: String(message).trim(),
        attachment_name: String(attachment_name || '').trim(),
      });
      res.status(201).json({ success: true, ticket: created });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در ثبت تیکت پشتیبانی';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/panel/calendar/reserve', requireAuth, async (req, res) => {
    try {
      const { eventId } = req.body || {};
      const updated = await mysqlDb.toggleCalendarReservation(
        Number(eventId),
        req.authUser!.phone
      );
      res.json({ success: true, event: updated });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در تغییر وضعیت رزرو رویداد';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/panel/announcements/read', requireAuth, async (req, res) => {
    try {
      const { announcementId } = req.body || {};
      const updated = await mysqlDb.markAnnouncementRead(Number(announcementId));
      res.json({ success: true, announcement: updated });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در بروزرسانی وضعیت اطلاعیه';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/member/enroll', requireAuth, async (req, res) => {
    try {
      const body = req.body || {};
      const result = await mysqlDb.enrollMemberInItem({
        ...body,
        member_id: req.authUser!.id,
        member_phone: req.authUser!.phone,
        member_name: `${req.authUser!.first_name} ${req.authUser!.last_name}`.trim(),
      });
      res.json({ success: true, ...result });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در ثبت‌نام دوره یا نشست';
      res.status(400).json({ error: message });
    }
  });

  // ==================== ADMIN PANEL API ROUTES (ADMIN ONLY) ====================

  app.get('/api/admin', requireAdmin, async (req, res) => {
    try {
      const adminData = await mysqlDb.getAdminPanelData(req.authUser!);
      res.json(adminData);
    } catch (error) {
      console.error('Failed to load admin panel data:', error);
      res
        .status(500)
        .json({ error: 'خطا در دریافت اطلاعات پنل مدیریت از دیتابیس MySQL' });
    }
  });

  app.post('/api/admin/sessions', requireAdmin, async (req, res) => {
    try {
      const saved = await mysqlDb.saveAdminSession(req.body || {});
      res.json({ success: true, session: saved });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در ذخیره اطلاعات جلسه';
      res.status(400).json({ error: message });
    }
  });

  app.delete('/api/admin/sessions/:id', requireAdmin, async (req, res) => {
    try {
      await mysqlDb.deleteAdminSession(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'خطا در حذف جلسه';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/admin/classes', requireAdmin, async (req, res) => {
    try {
      const saved = await mysqlDb.saveAdminClass(req.body || {});
      res.json({ success: true, classItem: saved });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در ذخیره اطلاعات کلاس';
      res.status(400).json({ error: message });
    }
  });

  app.delete('/api/admin/classes/:id', requireAdmin, async (req, res) => {
    try {
      await mysqlDb.deleteAdminClass(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'خطا در حذف کلاس';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/admin/users', requireAdmin, async (req, res) => {
    try {
      const saved = await mysqlDb.saveAdminUser(req.body || {});
      res.json({ success: true, user: saved });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در ذخیره اطلاعات کاربر';
      res.status(400).json({ error: message });
    }
  });

  app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
    try {
      await mysqlDb.deleteAdminUser(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'خطا در حذف کاربر';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/admin/tickets/reply', requireAdmin, async (req, res) => {
    try {
      const { id, admin_reply, status } = req.body || {};
      const updated = await mysqlDb.replyAdminTicket({
        id: Number(id),
        admin_reply: String(admin_reply || '').trim(),
        status: status || 'پاسخ داده‌شده',
      });
      res.json({ success: true, ticket: updated });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در ثبت پاسخ تیکت';
      res.status(400).json({ error: message });
    }
  });

  app.delete('/api/admin/tickets/:id', requireAdmin, async (req, res) => {
    try {
      await mysqlDb.deleteAdminTicket(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'خطا در حذف تیکت';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/admin/announcements', requireAdmin, async (req, res) => {
    try {
      const saved = await mysqlDb.saveAdminAnnouncement(req.body || {});
      res.json({ success: true, announcement: saved });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در ذخیره اطلاعیه';
      res.status(400).json({ error: message });
    }
  });

  app.delete('/api/admin/announcements/:id', requireAdmin, async (req, res) => {
    try {
      await mysqlDb.deleteAdminAnnouncement(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'خطا در حذف اطلاعیه';
      res.status(400).json({ error: message });
    }
  });

  app.put('/api/admin/profile', requireAdmin, async (req, res) => {
    try {
      const {
        first_name,
        last_name,
        email,
        education,
        bio,
        avatar_url,
        new_password,
      } = req.body || {};
      const admin = await mysqlDb.updateAdminProfile({
        adminId: req.authUser!.id,
        first_name: String(first_name || req.authUser!.first_name).trim(),
        last_name: String(last_name || req.authUser!.last_name).trim(),
        email: String(email || req.authUser!.email || '').trim(),
        education: String(education || req.authUser!.education || 'دکتری').trim(),
        bio: String(bio || '').trim(),
        avatar_url: avatar_url !== undefined ? String(avatar_url) : undefined,
        new_password: new_password ? String(new_password) : undefined,
      });
      res.json({ success: true, admin });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در بروزرسانی پروفایل مدیر';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/admin/blog', requireAdmin, async (req, res) => {
    try {
      const saved = await mysqlDb.saveAdminBlogPost(req.body || {});
      res.json({ success: true, post: saved });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در ذخیره مقاله وبلاگ';
      res.status(400).json({ error: message });
    }
  });

  app.delete('/api/admin/blog/:id', requireAdmin, async (req, res) => {
    try {
      await mysqlDb.deleteAdminBlogPost(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'خطا در حذف مقاله';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/admin/comments', requireAdmin, async (req, res) => {
    try {
      const saved = await mysqlDb.saveUserComment(req.body || {});
      res.json({ success: true, comment: saved });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در بروزرسانی نظر کاربر';
      res.status(400).json({ error: message });
    }
  });

  app.delete('/api/admin/comments/:id', requireAdmin, async (req, res) => {
    try {
      await mysqlDb.deleteUserComment(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'خطا در حذف نظر کاربر';
      res.status(400).json({ error: message });
    }
  });

  app.put('/api/admin/home-settings', requireAdmin, async (req, res) => {
    try {
      const updated = await mysqlDb.updateHomeSettings(req.body || {});
      res.json({ success: true, ...updated });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در ذخیره تنظیمات صفحه اصلی';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/admin/gallery', requireAdmin, async (req, res) => {
    try {
      const saved = await mysqlDb.saveAdminGalleryImage(req.body || {});
      res.json({ success: true, image: saved });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در افزودن تصویر به گالری';
      res.status(400).json({ error: message });
    }
  });

  app.delete('/api/admin/gallery/:id', requireAdmin, async (req, res) => {
    try {
      await mysqlDb.deleteAdminGalleryImage(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در حذف تصویر از گالری';
      res.status(400).json({ error: message });
    }
  });

  app.put('/api/admin/enrollments', requireAdmin, async (req, res) => {
    try {
      const result = await mysqlDb.updateAdminEnrollmentStatus(req.body || {});
      res.json({ success: true, ...result });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در بروزرسانی وضعیت ثبت‌نام کاربر';
      res.status(400).json({ error: message });
    }
  });

  // ==================== STATIC / VITE SERVING ====================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    try {
      await mysqlDb.initializeDatabase();
      console.log('✅ Connected to MySQL database and verified schema.');
    } catch (error) {
      console.warn(
        '⚠️ MySQL connection unavailable at startup (make sure MySQL is running on XAMPP/cPanel):',
        error instanceof Error ? error.message : error
      );
    }
  });
}

startServer().catch((error) => {
  console.error('❌ Fatal Server Startup Error:', error);
  process.exit(1);
});
