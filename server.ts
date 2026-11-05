import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { mysqlDb } from './server/db/mysql.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // MySQL-backed API endpoint for Navigation + Hero + About Club + Manager + Library + Blog + Contact
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
      ] = await Promise.all([
        mysqlDb.getNavigationLinks(),
        mysqlDb.getHeroSettings(),
        mysqlDb.getFeaturedBooks(),
        mysqlDb.getAboutClub(),
        mysqlDb.getAboutManager(),
        mysqlDb.getLibraryBooks(),
        mysqlDb.getBlogPosts(),
        mysqlDb.getContactInfo(),
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
      });
    } catch (error) {
      console.error('Database fetch error:', error);
      res.status(500).json({ error: 'Failed to load data from MySQL database' });
    }
  });

  app.get('/api/about-club', async (_req, res) => {
    try {
      const aboutClub = await mysqlDb.getAboutClub();
      res.json({ aboutClub });
    } catch (error) {
      console.error('Failed to fetch about_club:', error);
      res.status(500).json({ error: 'Failed to fetch about_club data' });
    }
  });

  app.get('/api/about-manager', async (_req, res) => {
    try {
      const aboutManager = await mysqlDb.getAboutManager();
      res.json({ aboutManager });
    } catch (error) {
      console.error('Failed to fetch about_manager:', error);
      res.status(500).json({ error: 'Failed to fetch about_manager data' });
    }
  });

  app.get('/api/library', async (_req, res) => {
    try {
      const libraryBooks = await mysqlDb.getLibraryBooks();
      res.json({ libraryBooks });
    } catch (error) {
      console.error('Failed to fetch library_books:', error);
      res.status(500).json({ error: 'Failed to fetch library_books data' });
    }
  });

  app.get('/api/blog', async (_req, res) => {
    try {
      const blogPosts = await mysqlDb.getBlogPosts();
      res.json({ blogPosts });
    } catch (error) {
      console.error('Failed to fetch blog_posts:', error);
      res.status(500).json({ error: 'Failed to fetch blog_posts data' });
    }
  });

  app.get('/api/contact', async (_req, res) => {
    try {
      const contactInfo = await mysqlDb.getContactInfo();
      res.json({ contactInfo });
    } catch (error) {
      console.error('Failed to fetch contact_info:', error);
      res.status(500).json({ error: 'Failed to fetch contact_info data' });
    }
  });

  app.post('/api/contact', async (req, res) => {
    try {
      const { full_name, email, subject, message } = req.body || {};
      if (!full_name || !email || !message) {
        res.status(400).json({ error: 'لطفا تمامی فیلدهای ضروری را تکمیل نمایید.' });
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
      res.status(500).json({ error: 'Failed to store contact message in MySQL' });
    }
  });

  app.get('/api/books', async (_req, res) => {
    try {
      const books = await mysqlDb.getFeaturedBooks();
      res.json({ books });
    } catch (error) {
      console.error('Failed to fetch books:', error);
      res.status(500).json({ error: 'Failed to fetch books' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const {
        first_name,
        last_name,
        phone,
        education,
        favorite_genre,
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
        res.status(400).json({ error: 'رمز عبور و تکرار رمز عبور با یکدیگر مطابقت ندارند.' });
        return;
      }

      const member = await mysqlDb.registerClubMember({
        first_name: String(first_name).trim(),
        last_name: String(last_name).trim(),
        phone: String(phone).trim(),
        education: String(education).trim(),
        favorite_genre: String(favorite_genre || 'عمومی').trim(),
        password_hash: String(password),
      });

      res.status(201).json({ success: true, member });
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
        res.status(400).json({ error: 'لطفاً شماره تلفن و رمز عبور خود را وارد نمایید.' });
        return;
      }

      const member = await mysqlDb.loginClubMember({
        phone: String(phone).trim(),
        password_hash: String(password),
      });

      res.json({ success: true, member });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'ورود به حساب کاربری انجام نشد.';
      res.status(400).json({ error: message });
    }
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

  app.get('/api/panel', async (req, res) => {
    try {
      const phone = req.query.phone ? String(req.query.phone) : undefined;
      const panelData = await mysqlDb.getMemberPanelData(phone);
      res.json(panelData);
    } catch (error) {
      console.error('Failed to load member panel data:', error);
      res.status(500).json({ error: 'خطا در دریافت اطلاعات پنل کاربری از دیتابیس' });
    }
  });

  app.put('/api/panel/profile', async (req, res) => {
    try {
      const {
        phone,
        first_name,
        last_name,
        education,
        favorite_genre,
        email,
        city,
        avatar_url,
        bio,
      } = req.body || {};
      if (!first_name || !last_name) {
        res.status(400).json({ error: 'نام و نام خانوادگی الزامی است.' });
        return;
      }
      const member = await mysqlDb.updateMemberProfile({
        phone: String(phone || '۰۹۱۲۳۴۵۶۷۸۹').trim(),
        first_name: String(first_name).trim(),
        last_name: String(last_name).trim(),
        education: String(education || 'کارشناسی ارشد').trim(),
        favorite_genre: String(favorite_genre || 'ادبیات داستانی و رمان کلاسیک').trim(),
        email: String(email || '').trim(),
        city: city !== undefined ? String(city).trim() : undefined,
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

  app.post('/api/panel/sessions/note', async (req, res) => {
    try {
      const { sessionId, member_note } = req.body || {};
      const updated = await mysqlDb.updateMemberSessionNote({
        sessionId: Number(sessionId),
        member_note: String(member_note || '').trim(),
      });
      res.json({ success: true, session: updated });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در ثبت یادداشت جلسه';
      res.status(400).json({ error: message });
    }
  });

  app.patch('/api/panel/library', async (req, res) => {
    try {
      const { bookId, pages_read, progress_percent, reading_status, personal_note } =
        req.body || {};
      const updated = await mysqlDb.updateMemberLibraryItem({
        bookId: Number(bookId),
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

  app.post('/api/panel/library', async (req, res) => {
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

  app.post('/api/panel/tickets', async (req, res) => {
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
      const created = await mysqlDb.createMemberTicket({
        member_phone: String(member_phone || 'all').trim(),
        subject: String(subject).trim(),
        department: String(department || 'پیشنهاد کتاب').trim(),
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

  app.post('/api/panel/calendar/reserve', async (req, res) => {
    try {
      const { eventId } = req.body || {};
      const updated = await mysqlDb.toggleCalendarReservation(Number(eventId));
      res.json({ success: true, event: updated });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در تغییر وضعیت رزرو رویداد';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/panel/announcements/read', async (req, res) => {
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

  // ==================== ADMIN PANEL API ROUTES ====================
  app.get('/api/admin', async (_req, res) => {
    try {
      const adminData = await mysqlDb.getAdminPanelData();
      res.json(adminData);
    } catch (error) {
      console.error('Failed to load admin panel data:', error);
      res.status(500).json({ error: 'خطا در دریافت اطلاعات پنل مدیریت از دیتابیس' });
    }
  });

  app.post('/api/admin/sessions', async (req, res) => {
    try {
      const saved = await mysqlDb.saveAdminSession(req.body || {});
      res.json({ success: true, session: saved });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در ذخیره اطلاعات جلسه';
      res.status(400).json({ error: message });
    }
  });

  app.delete('/api/admin/sessions/:id', async (req, res) => {
    try {
      await mysqlDb.deleteAdminSession(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'خطا در حذف جلسه';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/admin/classes', async (req, res) => {
    try {
      const saved = await mysqlDb.saveAdminClass(req.body || {});
      res.json({ success: true, classItem: saved });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در ذخیره اطلاعات کلاس';
      res.status(400).json({ error: message });
    }
  });

  app.delete('/api/admin/classes/:id', async (req, res) => {
    try {
      await mysqlDb.deleteAdminClass(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'خطا در حذف کلاس';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/admin/users', async (req, res) => {
    try {
      const saved = await mysqlDb.saveAdminUser(req.body || {});
      res.json({ success: true, user: saved });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در ذخیره اطلاعات کاربر';
      res.status(400).json({ error: message });
    }
  });

  app.delete('/api/admin/users/:id', async (req, res) => {
    try {
      await mysqlDb.deleteAdminUser(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'خطا در حذف کاربر';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/admin/tickets/reply', async (req, res) => {
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

  app.delete('/api/admin/tickets/:id', async (req, res) => {
    try {
      await mysqlDb.deleteAdminTicket(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'خطا در حذف تیکت';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/admin/announcements', async (req, res) => {
    try {
      const saved = await mysqlDb.saveAdminAnnouncement(req.body || {});
      res.json({ success: true, announcement: saved });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در ذخیره اطلاعیه';
      res.status(400).json({ error: message });
    }
  });

  app.delete('/api/admin/announcements/:id', async (req, res) => {
    try {
      await mysqlDb.deleteAdminAnnouncement(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'خطا در حذف اطلاعیه';
      res.status(400).json({ error: message });
    }
  });

  app.put('/api/admin/profile', async (req, res) => {
    try {
      const {
        first_name,
        last_name,
        email,
        education,
        favorite_genre,
        bio,
        avatar_url,
        new_password,
      } = req.body || {};
      const admin = await mysqlDb.updateAdminProfile({
        first_name: String(first_name || 'سهراب').trim(),
        last_name: String(last_name || 'رستگار').trim(),
        email: String(email || 'admin@bookmeet.ir').trim(),
        education: String(education || 'دکتری').trim(),
        favorite_genre: String(favorite_genre || 'ادبیات تطبیقی و نقد ادبی').trim(),
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

  app.post('/api/admin/blog', async (req, res) => {
    try {
      const saved = await mysqlDb.saveAdminBlogPost(req.body || {});
      res.json({ success: true, post: saved });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در ذخیره مقاله وبلاگ';
      res.status(400).json({ error: message });
    }
  });

  app.delete('/api/admin/blog/:id', async (req, res) => {
    try {
      await mysqlDb.deleteAdminBlogPost(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'خطا در حذف مقاله';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/admin/comments', async (req, res) => {
    try {
      const saved = await mysqlDb.saveUserComment(req.body || {});
      res.json({ success: true, comment: saved });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در بروزرسانی نظر کاربر';
      res.status(400).json({ error: message });
    }
  });

  app.delete('/api/admin/comments/:id', async (req, res) => {
    try {
      await mysqlDb.deleteUserComment(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'خطا در حذف نظر کاربر';
      res.status(400).json({ error: message });
    }
  });

  app.put('/api/admin/home-settings', async (req, res) => {
    try {
      const updated = await mysqlDb.updateHomeSettings(req.body || {});
      res.json({ success: true, ...updated });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در ذخیره تنظیمات صفحه اصلی';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/admin/gallery', async (req, res) => {
    try {
      const saved = await mysqlDb.saveAdminGalleryImage(req.body || {});
      res.json({ success: true, image: saved });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در افزودن تصویر به گالری';
      res.status(400).json({ error: message });
    }
  });

  app.delete('/api/admin/gallery/:id', async (req, res) => {
    try {
      await mysqlDb.deleteAdminGalleryImage(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در حذف تصویر از گالری';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/member/enroll', async (req, res) => {
    try {
      const result = await mysqlDb.enrollMemberInItem(req.body || {});
      res.json({ success: true, ...result });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در ثبت‌نام دوره یا نشست';
      res.status(400).json({ error: message });
    }
  });

  app.put('/api/admin/enrollments', async (req, res) => {
    try {
      const result = await mysqlDb.updateAdminEnrollmentStatus(req.body || {});
      res.json({ success: true, ...result });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در بروزرسانی وضعیت ثبت‌نام کاربر';
      res.status(400).json({ error: message });
    }
  });



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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
