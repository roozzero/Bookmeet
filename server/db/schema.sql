-- Bookmeet MySQL Schema (Persian RTL Edition)
CREATE DATABASE IF NOT EXISTS bookmeet_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bookmeet_db;

CREATE TABLE IF NOT EXISTS navigation_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(100) NOT NULL,
  href VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hero_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  headline VARCHAR(255) NOT NULL,
  subtitle_line_1 VARCHAR(255) NOT NULL,
  subtitle_line_2 VARCHAR(255) NOT NULL,
  nav_cta_text VARCHAR(100) NOT NULL,
  nav_cta_target VARCHAR(255) NOT NULL,
  hero_image_url VARCHAR(255) NOT NULL,
  audio_progress_percent INT NOT NULL DEFAULT 100,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS featured_books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  persian_title VARCHAR(150) NOT NULL,
  author VARCHAR(150) NOT NULL,
  publication_year INT NOT NULL,
  synopsis TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS about_club (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section_kicker VARCHAR(120) NOT NULL,
  title VARCHAR(255) NOT NULL,
  paragraph_1 TEXT NOT NULL,
  paragraph_2 TEXT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  image_caption VARCHAR(255) NOT NULL,
  stat_1_value VARCHAR(50) NOT NULL,
  stat_1_label VARCHAR(120) NOT NULL,
  stat_2_value VARCHAR(50) NOT NULL,
  stat_2_label VARCHAR(120) NOT NULL,
  stat_3_value VARCHAR(50) NOT NULL,
  stat_3_label VARCHAR(120) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS about_manager (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section_kicker VARCHAR(120) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  role_title VARCHAR(200) NOT NULL,
  bio_paragraph_1 TEXT NOT NULL,
  bio_paragraph_2 TEXT NOT NULL,
  quote_text TEXT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  credentials_line VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS library_books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  is_current TINYINT(1) NOT NULL DEFAULT 0,
  title VARCHAR(150) NOT NULL,
  original_title VARCHAR(150) NOT NULL,
  author VARCHAR(150) NOT NULL,
  translator VARCHAR(150) NOT NULL,
  category VARCHAR(80) NOT NULL,
  publication_year INT NOT NULL,
  pages_count INT NOT NULL,
  reading_progress_percent INT NOT NULL DEFAULT 0,
  session_schedule VARCHAR(180) NOT NULL,
  cover_url VARCHAR(255) NOT NULL,
  short_description TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(220) NOT NULL,
  slug VARCHAR(220) NOT NULL DEFAULT '',
  category VARCHAR(100) NOT NULL,
  author VARCHAR(150) NOT NULL,
  published_date VARCHAR(80) NOT NULL,
  reading_time VARCHAR(60) NOT NULL,
  cover_url LONGTEXT NOT NULL,
  excerpt TEXT NOT NULL,
  full_content LONGTEXT NOT NULL,
  tags VARCHAR(255) NOT NULL DEFAULT '',
  status VARCHAR(40) NOT NULL DEFAULT 'منتشر شده',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gallery_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  url LONGTEXT NOT NULL,
  category VARCHAR(80) NOT NULL DEFAULT 'عمومی',
  created_at VARCHAR(80) NOT NULL
);

CREATE TABLE IF NOT EXISTS contact_info (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section_kicker VARCHAR(120) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  address VARCHAR(255) NOT NULL,
  meeting_hours VARCHAR(180) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(80) NOT NULL,
  telegram_handle VARCHAR(100) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS club_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(40) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  education VARCHAR(120) NOT NULL,
  favorite_genre VARCHAR(120) NOT NULL DEFAULT 'ادبیات داستانی و رمان کلاسیک',
  email VARCHAR(150) NOT NULL DEFAULT '',
  avatar_url LONGTEXT,
  bio TEXT NOT NULL,
  membership_code VARCHAR(40) NOT NULL DEFAULT 'BM-۱۴۰۵-۱۰۸',
  joined_date VARCHAR(60) NOT NULL DEFAULT 'مهر ۱۴۰۵',
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  author_name VARCHAR(150) NOT NULL,
  author_phone VARCHAR(40) NOT NULL DEFAULT '',
  target_title VARCHAR(220) NOT NULL,
  target_type VARCHAR(60) NOT NULL DEFAULT 'مقاله وبلاگ',
  rating INT NOT NULL DEFAULT 5,
  comment_text TEXT NOT NULL,
  admin_reply TEXT NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'تایید شده',
  created_date VARCHAR(80) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS member_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_phone VARCHAR(40) NOT NULL DEFAULT 'all',
  title VARCHAR(220) NOT NULL,
  book_title VARCHAR(180) NOT NULL,
  book_author VARCHAR(150) NOT NULL DEFAULT '',
  pages_count INT NOT NULL DEFAULT 350,
  publisher VARCHAR(150) NOT NULL DEFAULT '',
  mentor_name VARCHAR(150) NOT NULL,
  session_date VARCHAR(80) NOT NULL,
  session_time VARCHAR(80) NOT NULL,
  cover_url LONGTEXT NOT NULL,
  status VARCHAR(60) NOT NULL DEFAULT 'فعال',
  member_note TEXT NOT NULL,
  sub_sessions_json LONGTEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS member_classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_phone VARCHAR(40) NOT NULL DEFAULT 'all',
  title VARCHAR(220) NOT NULL,
  book_title VARCHAR(180) NOT NULL,
  instructor_name VARCHAR(150) NOT NULL,
  schedule_summary VARCHAR(120) NOT NULL,
  level_label VARCHAR(80) NOT NULL DEFAULT 'پیشرفته',
  cover_url VARCHAR(255) NOT NULL DEFAULT '/assets/blog-1.png',
  status VARCHAR(60) NOT NULL,
  description TEXT NOT NULL,
  sub_sessions_json LONGTEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS member_library (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_phone VARCHAR(40) NOT NULL DEFAULT 'all',
  book_title VARCHAR(180) NOT NULL,
  author VARCHAR(150) NOT NULL,
  translator VARCHAR(150) NOT NULL,
  cover_url VARCHAR(255) NOT NULL,
  reading_status VARCHAR(60) NOT NULL,
  progress_percent INT NOT NULL DEFAULT 0,
  pages_read INT NOT NULL DEFAULT 0,
  pages_count INT NOT NULL DEFAULT 300,
  personal_note TEXT NOT NULL,
  updated_at VARCHAR(80) NOT NULL
);

CREATE TABLE IF NOT EXISTS member_tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_phone VARCHAR(40) NOT NULL DEFAULT 'all',
  ticket_code VARCHAR(40) NOT NULL,
  subject VARCHAR(220) NOT NULL,
  department VARCHAR(100) NOT NULL,
  priority VARCHAR(40) NOT NULL,
  status VARCHAR(60) NOT NULL,
  message TEXT NOT NULL,
  attachment_name VARCHAR(255) NOT NULL DEFAULT '',
  admin_reply TEXT NOT NULL,
  created_at VARCHAR(80) NOT NULL
);

CREATE TABLE IF NOT EXISTS club_calendar_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(220) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  day_of_month VARCHAR(20) NOT NULL,
  month_name VARCHAR(60) NOT NULL,
  weekday_name VARCHAR(60) NOT NULL,
  time_range VARCHAR(80) NOT NULL,
  host_name VARCHAR(150) NOT NULL,
  location_label VARCHAR(180) NOT NULL,
  capacity_info VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  is_reserved TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS club_announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(220) NOT NULL,
  category VARCHAR(80) NOT NULL,
  published_date VARCHAR(80) NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  is_important TINYINT(1) NOT NULL DEFAULT 0,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0
);




