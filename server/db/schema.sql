-- ============================================================================
-- Bookmeet MySQL Database Schema (XAMPP & cPanel Compatible, UTF-8 / Persian)
-- ============================================================================
-- Note: In XAMPP phpMyAdmin, you can either run this file directly or first
-- select your database (e.g. `bookmeet_db`) and import this file.
-- ============================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE DATABASE IF NOT EXISTS `bookmeet_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `bookmeet_db`;

-- 1. Navigation Links
CREATE TABLE IF NOT EXISTS `navigation_links` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `label` VARCHAR(100) NOT NULL,
  `href` VARCHAR(255) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_nav_sort` (`sort_order`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Homepage Hero Settings
CREATE TABLE IF NOT EXISTS `hero_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `headline` VARCHAR(255) NOT NULL,
  `subtitle_line_1` VARCHAR(255) NOT NULL,
  `subtitle_line_2` VARCHAR(255) NOT NULL,
  `nav_cta_text` VARCHAR(100) NOT NULL,
  `nav_cta_target` VARCHAR(255) NOT NULL,
  `hero_image_url` VARCHAR(255) NOT NULL,
  `audio_progress_percent` INT NOT NULL DEFAULT 100,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Featured Books (Hero Showcase)
CREATE TABLE IF NOT EXISTS `featured_books` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(150) NOT NULL,
  `persian_title` VARCHAR(150) NOT NULL,
  `author` VARCHAR(150) NOT NULL,
  `publication_year` INT NOT NULL DEFAULT 2000,
  `synopsis` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. About Club Section Settings
CREATE TABLE IF NOT EXISTS `about_club` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `section_kicker` VARCHAR(120) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `paragraph_1` TEXT NOT NULL,
  `paragraph_2` TEXT NOT NULL,
  `image_url` VARCHAR(255) NOT NULL,
  `image_caption` VARCHAR(255) NOT NULL,
  `stat_1_value` VARCHAR(50) NOT NULL,
  `stat_1_label` VARCHAR(120) NOT NULL,
  `stat_2_value` VARCHAR(50) NOT NULL,
  `stat_2_label` VARCHAR(120) NOT NULL,
  `stat_3_value` VARCHAR(50) NOT NULL,
  `stat_3_label` VARCHAR(120) NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. About Manager Section Settings
CREATE TABLE IF NOT EXISTS `about_manager` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `section_kicker` VARCHAR(120) NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `role_title` VARCHAR(200) NOT NULL,
  `bio_paragraph_1` TEXT NOT NULL,
  `bio_paragraph_2` TEXT NOT NULL,
  `quote_text` TEXT NOT NULL,
  `image_url` VARCHAR(255) NOT NULL,
  `credentials_line` VARCHAR(255) NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Club Library Books
CREATE TABLE IF NOT EXISTS `library_books` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `is_current` TINYINT(1) NOT NULL DEFAULT 0,
  `title` VARCHAR(180) NOT NULL,
  `original_title` VARCHAR(180) NOT NULL DEFAULT '',
  `author` VARCHAR(150) NOT NULL DEFAULT '',
  `translator` VARCHAR(150) NOT NULL DEFAULT '',
  `category` VARCHAR(80) NOT NULL DEFAULT '',
  `publication_year` INT NOT NULL DEFAULT 0,
  `edition_number` VARCHAR(80) NOT NULL DEFAULT '',
  `pages_count` INT NOT NULL DEFAULT 0,
  `publisher` VARCHAR(150) NOT NULL DEFAULT '',
  `reading_progress_percent` INT NOT NULL DEFAULT 0,
  `session_schedule` VARCHAR(180) NOT NULL DEFAULT '',
  `cover_url` LONGTEXT NOT NULL,
  `short_description` TEXT NOT NULL,
  `description` LONGTEXT NULL,
  `memorable_quote` TEXT NULL,
  `recommended_for` TEXT NULL,
  `tags` TEXT NULL,
  `notes` LONGTEXT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_library_books_sort` (`sort_order`, `is_current`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6.5. Library Categories
CREATE TABLE IF NOT EXISTS `library_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(120) NOT NULL UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Blog Posts
CREATE TABLE IF NOT EXISTS `blog_posts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(220) NOT NULL,
  `slug` VARCHAR(220) NOT NULL DEFAULT '',
  `category` VARCHAR(100) NOT NULL DEFAULT 'یادداشت ادبی',
  `author` VARCHAR(150) NOT NULL,
  `published_date` VARCHAR(80) NOT NULL,
  `reading_time` VARCHAR(60) NOT NULL DEFAULT '۵ دقیقه مطالعه',
  `cover_url` LONGTEXT NOT NULL,
  `excerpt` TEXT NOT NULL,
  `full_content` LONGTEXT NOT NULL,
  `tags` VARCHAR(255) NOT NULL DEFAULT '',
  `status` VARCHAR(40) NOT NULL DEFAULT 'منتشر شده',
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_blog_sort` (`sort_order`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Gallery Images
CREATE TABLE IF NOT EXISTS `gallery_images` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(180) NOT NULL,
  `url` LONGTEXT NOT NULL,
  `category` VARCHAR(80) NOT NULL DEFAULT 'عمومی',
  `created_at` VARCHAR(80) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Contact Info Settings
CREATE TABLE IF NOT EXISTS `contact_info` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `section_kicker` VARCHAR(120) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `meeting_hours` VARCHAR(180) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(80) NOT NULL,
  `telegram_handle` VARCHAR(100) NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9.5. Footer Settings
CREATE TABLE IF NOT EXISTS `footer_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(220) NOT NULL DEFAULT 'باشگاه کتابخوانی بوک‌میت',
  `description` TEXT NOT NULL,
  `phone` VARCHAR(80) NOT NULL DEFAULT '',
  `email` VARCHAR(150) NOT NULL DEFAULT '',
  `address` VARCHAR(255) NOT NULL DEFAULT '',
  `links_json` LONGTEXT NULL,
  `instagram_url` VARCHAR(255) NOT NULL DEFAULT 'https://instagram.com/bookmeet.club',
  `telegram_url` VARCHAR(255) NOT NULL DEFAULT 'https://t.me/BookmeetClub',
  `twitter_url` VARCHAR(255) NOT NULL DEFAULT 'https://x.com/bookmeetclub',
  `youtube_url` VARCHAR(255) NOT NULL DEFAULT 'https://youtube.com/@bookmeetclub',
  `linkedin_url` VARCHAR(255) NOT NULL DEFAULT 'https://linkedin.com/company/bookmeet-club',
  `copyright_text` VARCHAR(255) NOT NULL DEFAULT '© ۱۴۰۵ باشگاه کتابخوانی بوک‌میت (Bookmeet) · تمامی حقوق برای اعضای باشگاه محفوظ است.',
  `tagline_text` VARCHAR(255) NOT NULL DEFAULT 'طراحی‌شده با الهام از کتابخانه‌های کلاسیک و اشتیاق بی‌پایان به روایت‌های ماندگار',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Contact Messages (Submitted via Contact Form)
CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `subject` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Club Members & Single Administrator Account
CREATE TABLE IF NOT EXISTS `club_members` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(60) NOT NULL,
  `role` ENUM('member', 'admin') NOT NULL DEFAULT 'member',
  `status` VARCHAR(40) NOT NULL DEFAULT 'فعال',
  `education` VARCHAR(120) NOT NULL DEFAULT '',
  `email` VARCHAR(150) NOT NULL DEFAULT '',
  `avatar_url` LONGTEXT,
  `bio` TEXT NOT NULL,
  `membership_code` VARCHAR(60) NOT NULL DEFAULT '',
  `joined_date` VARCHAR(60) NOT NULL DEFAULT '',
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_club_members_phone` (`phone`),
  INDEX `idx_club_members_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Authentication Sessions (Server-Side Verified Tokens)
CREATE TABLE IF NOT EXISTS `auth_tokens` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `token` VARCHAR(128) NOT NULL,
  `member_id` INT NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_auth_tokens_token` (`token`),
  INDEX `idx_auth_tokens_member` (`member_id`),
  CONSTRAINT `fk_auth_tokens_member`
    FOREIGN KEY (`member_id`) REFERENCES `club_members` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. User Comments (Blog, Courses & Reading Sessions)
CREATE TABLE IF NOT EXISTS `user_comments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `author_name` VARCHAR(150) NOT NULL,
  `author_phone` VARCHAR(60) NOT NULL DEFAULT '',
  `target_title` VARCHAR(220) NOT NULL,
  `target_type` VARCHAR(60) NOT NULL DEFAULT 'مقاله وبلاگ',
  `rating` INT NOT NULL DEFAULT 5,
  `comment_text` TEXT NOT NULL,
  `admin_reply` TEXT NOT NULL,
  `status` VARCHAR(40) NOT NULL DEFAULT 'در انتظار تایید',
  `created_date` VARCHAR(80) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  INDEX `idx_user_comments_status` (`status`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Reading Sessions (دوره‌های هم‌خوانی و نشست‌ها)
CREATE TABLE IF NOT EXISTS `member_sessions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `member_phone` VARCHAR(60) NOT NULL DEFAULT 'all',
  `title` VARCHAR(220) NOT NULL,
  `book_title` VARCHAR(180) NOT NULL,
  `book_author` VARCHAR(150) NOT NULL DEFAULT '',
  `translator` VARCHAR(150) NOT NULL DEFAULT '',
  `category` VARCHAR(120) NOT NULL DEFAULT 'ادبیات داستانی',
  `publication_year` INT NOT NULL DEFAULT 1405,
  `pages_count` INT NOT NULL DEFAULT 300,
  `publisher` VARCHAR(150) NOT NULL DEFAULT '',
  `mentor_name` VARCHAR(150) NOT NULL DEFAULT '',
  `session_date` VARCHAR(100) NOT NULL DEFAULT '',
  `session_time` VARCHAR(100) NOT NULL DEFAULT '',
  `cover_url` LONGTEXT NOT NULL,
  `location_type` VARCHAR(80) NOT NULL DEFAULT 'حضوری و آنلاین',
  `meeting_link_or_room` VARCHAR(255) NOT NULL DEFAULT '',
  `status` VARCHAR(60) NOT NULL DEFAULT 'فعال',
  `short_description` TEXT NOT NULL,
  `full_description` LONGTEXT NOT NULL,
  `member_note` TEXT NOT NULL,
  `sub_sessions_json` LONGTEXT NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_member_sessions_sort` (`sort_order`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Educational Classes & Courses (کلاس‌ها و دوره‌های آموزشی)
CREATE TABLE IF NOT EXISTS `member_classes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `member_phone` VARCHAR(60) NOT NULL DEFAULT 'all',
  `title` VARCHAR(220) NOT NULL,
  `book_title` VARCHAR(180) NOT NULL DEFAULT '',
  `instructor_name` VARCHAR(150) NOT NULL DEFAULT '',
  `schedule_summary` VARCHAR(150) NOT NULL DEFAULT '',
  `level_label` VARCHAR(80) NOT NULL DEFAULT 'مبتدی',
  `start_date` VARCHAR(100) NOT NULL DEFAULT '',
  `end_date` VARCHAR(100) NOT NULL DEFAULT '',
  `duration_label` VARCHAR(100) NOT NULL DEFAULT '',
  `sessions_count` VARCHAR(100) NOT NULL DEFAULT '',
  `capacity_label` VARCHAR(100) NOT NULL DEFAULT '',
  `syllabus_json` LONGTEXT NOT NULL,
  `cover_url` LONGTEXT NOT NULL,
  `status` VARCHAR(60) NOT NULL DEFAULT 'فعال',
  `description` TEXT NOT NULL,
  `sub_sessions_json` LONGTEXT NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_member_classes_sort` (`sort_order`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Session & Course Enrollments + Attendance Tracking
CREATE TABLE IF NOT EXISTS `session_enrollments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `target_type` ENUM('session', 'class') NOT NULL DEFAULT 'session',
  `target_id` INT NOT NULL,
  `member_id` INT DEFAULT NULL,
  `member_phone` VARCHAR(60) NOT NULL,
  `member_name` VARCHAR(150) NOT NULL,
  `status` VARCHAR(40) NOT NULL DEFAULT 'غیرفعال',
  `attendance_status` VARCHAR(40) NOT NULL DEFAULT 'ثبت‌نام‌شده',
  `member_note` TEXT,
  `registered_at` VARCHAR(80) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_enrollment_target_member` (`target_type`, `target_id`, `member_phone`),
  INDEX `idx_enrollment_member_phone` (`member_phone`),
  INDEX `idx_enrollment_target` (`target_type`, `target_id`),
  CONSTRAINT `fk_enrollment_member`
    FOREIGN KEY (`member_id`) REFERENCES `club_members` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Member Personal Library Books
CREATE TABLE IF NOT EXISTS `member_library` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `member_phone` VARCHAR(60) NOT NULL,
  `book_title` VARCHAR(180) NOT NULL,
  `author` VARCHAR(150) NOT NULL,
  `translator` VARCHAR(150) NOT NULL DEFAULT '',
  `cover_url` LONGTEXT NOT NULL,
  `reading_status` VARCHAR(60) NOT NULL DEFAULT 'در حال مطالعه',
  `progress_percent` INT NOT NULL DEFAULT 0,
  `pages_read` INT NOT NULL DEFAULT 0,
  `pages_count` INT NOT NULL DEFAULT 300,
  `personal_note` TEXT NOT NULL,
  `updated_at` VARCHAR(80) NOT NULL,
  INDEX `idx_member_library_phone` (`member_phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Support Tickets
CREATE TABLE IF NOT EXISTS `member_tickets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `member_phone` VARCHAR(60) NOT NULL,
  `ticket_code` VARCHAR(40) NOT NULL,
  `subject` VARCHAR(220) NOT NULL,
  `department` VARCHAR(100) NOT NULL,
  `priority` VARCHAR(40) NOT NULL DEFAULT 'عادی',
  `status` VARCHAR(60) NOT NULL DEFAULT 'در انتظار بررسی',
  `message` TEXT NOT NULL,
  `attachment_name` VARCHAR(255) NOT NULL DEFAULT '',
  `admin_reply` TEXT NOT NULL,
  `admin_replies_json` LONGTEXT,
  `messages_json` LONGTEXT,
  `created_at` VARCHAR(80) NOT NULL,
  `updated_at` VARCHAR(80) NOT NULL DEFAULT '',
  INDEX `idx_member_tickets_phone` (`member_phone`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18b. Support Ticket Attachments
CREATE TABLE IF NOT EXISTS `ticket_attachments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ticket_id` INT NOT NULL,
  `sender_role` ENUM('member', 'admin') NOT NULL DEFAULT 'member',
  `file_name` VARCHAR(255) NOT NULL,
  `mime_type` VARCHAR(120) NOT NULL,
  `file_size` INT NOT NULL DEFAULT 0,
  `file_data` LONGTEXT NOT NULL,
  `created_at` VARCHAR(80) NOT NULL,
  INDEX `idx_ticket_attachments_ticket` (`ticket_id`),
  CONSTRAINT `fk_ticket_attachments_ticket`
    FOREIGN KEY (`ticket_id`) REFERENCES `member_tickets` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Club Calendar Events & Reservations
CREATE TABLE IF NOT EXISTS `club_calendar_events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(220) NOT NULL,
  `event_type` VARCHAR(100) NOT NULL,
  `day_of_month` VARCHAR(20) NOT NULL,
  `month_name` VARCHAR(60) NOT NULL,
  `weekday_name` VARCHAR(60) NOT NULL,
  `time_range` VARCHAR(80) NOT NULL,
  `host_name` VARCHAR(150) NOT NULL,
  `location_label` VARCHAR(180) NOT NULL,
  `capacity_info` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `is_reserved` TINYINT(1) NOT NULL DEFAULT 0,
  `reserved_by_phones_json` LONGTEXT,
  `sort_order` INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. Club Announcements
CREATE TABLE IF NOT EXISTS `club_announcements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(220) NOT NULL,
  `category` VARCHAR(80) NOT NULL,
  `published_date` VARCHAR(80) NOT NULL,
  `summary` TEXT NOT NULL,
  `content` TEXT NOT NULL,
  `is_important` TINYINT(1) NOT NULL DEFAULT 0,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `read_by_phones_json` LONGTEXT,
  `target_user_phone` VARCHAR(60) DEFAULT NULL,
  `target_user_name` VARCHAR(150) DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  INDEX `idx_announcements_target` (`target_user_phone`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

