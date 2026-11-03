import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { mysqlDb } from './server/db/mysql.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // MySQL-backed API endpoint for Navigation + Hero + About Club + Manager + Library
  app.get('/api/bootstrap', async (_req, res) => {
    try {
      const [
        navigationLinks,
        heroSettings,
        featuredBooks,
        aboutClub,
        aboutManager,
        libraryBooks,
      ] = await Promise.all([
        mysqlDb.getNavigationLinks(),
        mysqlDb.getHeroSettings(),
        mysqlDb.getFeaturedBooks(),
        mysqlDb.getAboutClub(),
        mysqlDb.getAboutManager(),
        mysqlDb.getLibraryBooks(),
      ]);

      res.json({
        navigationLinks,
        heroSettings,
        featuredBooks,
        aboutClub,
        aboutManager,
        libraryBooks,
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

  app.get('/api/books', async (_req, res) => {
    try {
      const books = await mysqlDb.getFeaturedBooks();
      res.json({ books });
    } catch (error) {
      console.error('Failed to fetch books:', error);
      res.status(500).json({ error: 'Failed to fetch books' });
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
