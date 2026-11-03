import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { mysqlDb } from './server/db/mysql.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
      const { phone, new_password, confirm_new_password } = req.body || {};
      if (!phone || !new_password || !confirm_new_password) {
        res.status(400).json({ error: 'لطفاً شماره تلفن و رمز عبور جدید را وارد نمایید.' });
        return;
      }
      if (String(new_password) !== String(confirm_new_password)) {
        res.status(400).json({ error: 'رمز عبور جدید و تایید آن یکسان نیستند.' });
        return;
      }

      await mysqlDb.resetClubMemberPassword({
        phone: String(phone).trim(),
        new_password_hash: String(new_password),
      });

      res.json({
        success: true,
        message: 'رمز عبور حساب شما با موفقیت بازنشانی شد. اکنون می‌توانید وارد شوید.',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'بازنشانی رمز عبور انجام نشد.';
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
