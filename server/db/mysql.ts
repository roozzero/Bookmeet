import 'dotenv/config';
import mysql, { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface NavigationLinkRow {
  id: number;
  label: string;
  href: string;
  sort_order: number;
  is_active: number;
}

export interface HeroSettingsRow {
  id: number;
  headline: string;
  subtitle_line_1: string;
  subtitle_line_2: string;
  nav_cta_text: string;
  nav_cta_target: string;
  hero_image_url: string;
  audio_progress_percent: number;
}

export interface FeaturedBookRow {
  id: number;
  title: string;
  persian_title: string;
  author: string;
  publication_year: number;
  synopsis: string;
}

export interface AboutClubRow {
  id: number;
  section_kicker: string;
  title: string;
  paragraph_1: string;
  paragraph_2: string;
  image_url: string;
  image_caption: string;
  stat_1_value: string;
  stat_1_label: string;
  stat_2_value: string;
  stat_2_label: string;
  stat_3_value: string;
  stat_3_label: string;
}

export interface AboutManagerRow {
  id: number;
  section_kicker: string;
  full_name: string;
  role_title: string;
  bio_paragraph_1: string;
  bio_paragraph_2: string;
  quote_text: string;
  image_url: string;
  credentials_line: string;
}

export interface LibraryBookRow {
  id: number;
  is_current: number;
  title: string;
  original_title: string;
  author: string;
  translator: string;
  category: string;
  publication_year: number;
  pages_count: number;
  reading_progress_percent: number;
  session_schedule: string;
  cover_url: string;
  short_description: string;
  sort_order: number;
}

export interface BlogPostRow {
  id: number;
  title: string;
  slug?: string;
  category: string;
  author: string;
  published_date: string;
  reading_time: string;
  tags?: string;
  status?: 'منتشر شده' | 'پیش‌نویس';
  cover_url: string;
  excerpt: string;
  full_content: string;
  sort_order: number;
}

export interface ContactInfoRow {
  id: number;
  section_kicker: string;
  title: string;
  description: string;
  address: string;
  meeting_hours: string;
  email: string;
  phone: string;
  telegram_handle: string;
}

export interface ContactMessageRow {
  id: number;
  full_name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
}

export interface ClubMemberRow {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  role: 'member' | 'admin';
  status: 'فعال' | 'غیرفعال';
  education: string;
  email: string;
  avatar_url?: string;
  bio: string;
  membership_code: string;
  joined_date: string;
  password_hash: string;
  created_at: string;
}

export type PublicClubMember = Omit<ClubMemberRow, 'password_hash'>;

export interface UserCommentRow {
  id: number;
  author_name: string;
  author_phone: string;
  target_title: string;
  target_type: string;
  rating: number;
  comment_text: string;
  admin_reply: string;
  status: 'تایید شده' | 'در انتظار تایید' | 'رد شده';
  created_date: string;
  sort_order: number;
}

export interface SessionSubItemRow {
  id: number;
  session_number: number | string;
  title: string;
  status: 'برگزار شده' | 'تعریف شده' | 'جلسه آتی';
  session_date: string;
  session_time: string;
  cover_url?: string;
  pages_read: string | number;
  pages_to_read: string;
  reviewed_topics: string;
  session_notes: string;
  meeting_link: string;
}

export interface EnrollmentRecordRow {
  id: number;
  member_phone: string;
  member_name: string;
  registered_at: string;
  status: 'غیرفعال' | 'فعال' | 'لغو شده';
  attendance_status?: string;
}

export interface MemberSessionRow {
  id: number;
  member_phone: string;
  title: string;
  book_title: string;
  book_author?: string;
  translator?: string;
  category?: string;
  publication_year?: number;
  pages_count?: number;
  publisher?: string;
  mentor_name: string;
  session_date: string;
  session_time: string;
  cover_url: string;
  short_description?: string;
  full_description?: string;
  location_type: string;
  meeting_link_or_room: string;
  status: 'ثبت‌نام‌شده' | 'برگزارشده' | 'ظرفیت باز' | 'فعال' | 'غیرفعال';
  member_note: string;
  sub_sessions: SessionSubItemRow[];
  enrolled_members?: EnrollmentRecordRow[];
  sort_order: number;
}

export interface MemberClassRow {
  id: number;
  member_phone: string;
  title: string;
  book_title: string;
  instructor_name: string;
  schedule_summary: string;
  level_label: string;
  cover_url: string;
  status: 'ثبت‌نام‌شده' | 'برگزارشده' | 'فعال' | 'غیرفعال';
  description: string;
  sub_sessions: SessionSubItemRow[];
  enrolled_members?: EnrollmentRecordRow[];
  sort_order: number;
}

export interface MemberLibraryRow {
  id: number;
  member_phone: string;
  book_title: string;
  author: string;
  translator: string;
  cover_url: string;
  reading_status: 'در حال مطالعه' | 'خوانده‌شده' | 'در نوبت مطالعه';
  progress_percent: number;
  pages_read: number;
  pages_count: number;
  personal_note: string;
  updated_at: string;
}

export interface MemberTicketRow {
  id: number;
  member_phone: string;
  ticket_code: string;
  subject: string;
  department: string;
  priority: 'عادی' | 'مهم' | 'فوری';
  status: 'پاسخ داده‌شده' | 'در انتظار بررسی' | 'بسته‌شده';
  message: string;
  attachment_name?: string;
  admin_reply: string;
  admin_replies?: { text: string; created_at: string }[];
  created_at: string;
}

export interface ClubCalendarEventRow {
  id: number;
  title: string;
  event_type: string;
  day_of_month: string;
  month_name: string;
  weekday_name: string;
  time_range: string;
  host_name: string;
  location_label: string;
  capacity_info: string;
  description: string;
  is_reserved: number;
  sort_order: number;
}

export interface ClubAnnouncementRow {
  id: number;
  title: string;
  category: string;
  published_date: string;
  summary: string;
  content: string;
  is_important: number;
  is_read: number;
  target_user_phone?: string;
  target_user_name?: string;
  sort_order: number;
}

export interface GalleryImageRow {
  id: number;
  title: string;
  url: string;
  category: string;
  created_at: string;
}

const DEFAULT_NAVIGATION_LINKS: NavigationLinkRow[] = [
  { id: 1, label: 'صفحه اصلی', href: '#home', sort_order: 1, is_active: 1 },
  { id: 2, label: 'درباره باشگاه', href: '#about-club', sort_order: 2, is_active: 1 },
  { id: 3, label: 'درباره من', href: '#about-me', sort_order: 3, is_active: 1 },
  { id: 4, label: 'رویدادها', href: '#events', sort_order: 4, is_active: 1 },
  { id: 5, label: 'کتابخانه', href: '#library', sort_order: 5, is_active: 1 },
  { id: 6, label: 'دوره ها', href: '#courses', sort_order: 6, is_active: 1 },
  { id: 7, label: 'وبلاگ', href: '#blog', sort_order: 7, is_active: 1 },
  { id: 8, label: 'ارتباط با ما', href: '#contact', sort_order: 8, is_active: 1 },
];

const EMPTY_HERO_SETTINGS: HeroSettingsRow = {
  id: 1,
  headline: 'به باشگاه کتابخوانی بوک میت خوش آمدید',
  subtitle_line_1:
    'بعضی جهان‌ها تنها زمانی جان می‌گیرند که از خواندن دست بکشید و به تماشا بنشینید.',
  subtitle_line_2:
    'این روایت‌ها برگرفته از کتاب‌هایی هستند که هرگز ما را رها نکرده‌اند.',
  nav_cta_text: 'ورود به باشگاه',
  nav_cta_target: '#login-club',
  hero_image_url: '/assets/hero-bookshelf.png',
  audio_progress_percent: 100,
};

const EMPTY_ABOUT_CLUB: AboutClubRow = {
  id: 1,
  section_kicker: '۰۱ · درباره باشگاه کتابخوانی بوک‌میت',
  title: 'جایی برای زیستن در جهانِ کتاب‌هایی که فراموش نمی‌شوند',
  paragraph_1:
    'باشگاه کتابخوانی بوک‌میت با هدف شکل‌دادن به فضایی صمیمی، عمیق و اندیشه‌ورز برای علاقه‌مندان به ادبیات داستانی و آثار ماندگار جهان راه‌اندازی شده است.',
  paragraph_2:
    'در نشست‌های دوره‌ای و حلقه‌های مطالعاتی بوک‌میت، اعضا گرد هم می‌آیند تا ضمن واکاوی ساختار، شخصیت‌پردازی و درون‌مایه‌های فلسفی آثار برگزیده، تجربه‌های زیسته خود را به اشتراک بگذارند.',
  image_url: '/assets/about-club.png',
  image_caption: 'نشست‌های هم‌خوانی و بررسی نسخه‌های ماندگار ادبی در باشگاه بوک‌میت',
  stat_1_value: '۰',
  stat_1_label: 'نشست نقد و هم‌خوانی',
  stat_2_value: '۰',
  stat_2_label: 'عضو فعال باشگاه',
  stat_3_value: '۰',
  stat_3_label: 'شاهکار ادبی بررسی‌شده',
};

const EMPTY_ABOUT_MANAGER: AboutManagerRow = {
  id: 1,
  section_kicker: '۰۲ · معرفی مدیر و بنیان‌گذار باشگاه',
  full_name: 'سهراب رستگار',
  role_title: 'پژوهشگر ادبیات تطبیقی، منتقد ادبی و بنیان‌گذار باشگاه کتابخوانی بوک‌میت',
  bio_paragraph_1:
    'سهراب رستگار در حوزه نقد ادبی، روایت‌شناسی و برگزاری کارگاه‌های تخصصی خوانش خلاق فعالیت می‌کند.',
  bio_paragraph_2:
    'دغدغه اصلی او در بوک‌میت، احیای فرهنگ خواندنِ دقیق و آهسته و ایجاد پیوندی پایدار میان دوستداران کتاب است.',
  quote_text:
    '«کتاب‌ها زمانی به راستی آغاز می‌شوند که آخرین صفحه‌شان را می‌بندیم و درباره آنچه در ما دگرگون کرده‌اند با یکدیگر سخن می‌گوییم.»',
  image_url: '/assets/manager-portrait.png',
  credentials_line: 'دکتری ادبیات تطبیقی · تسهیل‌گر نشست‌های کتاب · پژوهشگر روایت',
};

const EMPTY_CONTACT_INFO: ContactInfoRow = {
  id: 1,
  section_kicker: '۰۵ · ارتباط با ما و عضویت در حلقه‌های مطالعاتی',
  title: 'صدای شما، آغازگر گفت‌وگوهای تازه در باشگاه بوک‌میت است',
  description:
    'اگر درباره شیوه برگزاری نشست‌های هفتگی، پیشنهاد کتاب برای دوره‌های آینده یا عضویت در حلقه‌های مطالعاتی بوک‌میت پرسشی دارید، پیام خود را برای ما ارسال کنید.',
  address: 'تهران، خیابان کریم‌خان زند، خیابان ایرانشهر، خانه فرهنگ و ادبیات بوک‌میت',
  meeting_hours: 'نشست‌های حضوری: چهارشنبه‌ها ساعت ۱۸ تا ۲۰ · نشست‌های برخط: جمعه‌ها ساعت ۱۹',
  email: 'hello@bookmeet.ir',
  phone: '۰۲۱-۸۸۹۴۳۲۱۰',
  telegram_handle: '@BookmeetClub',
};

export function normalizeIdentifierDigits(input: string): string {
  return String(input || '')
    .trim()
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

export function toPersianDigitsServer(input: string | number): string {
  const persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(input ?? '').replace(/\d/g, (d) => persian[Number(d)] || d);
}

function safeJsonParse<T>(raw: unknown, fallback: T): T {
  if (!raw) return fallback;
  if (typeof raw === 'object') return raw as T;
  try {
    return JSON.parse(String(raw)) as T;
  } catch {
    return fallback;
  }
}

function stripPassword(row: ClubMemberRow): PublicClubMember {
  const { password_hash: _removed, ...rest } = row;
  return {
    ...rest,
    role: row.role === 'admin' ? 'admin' : 'member',
    status: row.status || 'فعال',
  };
}

class MySQLDatabaseManager {
  private pool: Pool;
  private initialized = false;

  constructor() {
    this.pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'bookmeet_db',
      charset: 'utf8mb4',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 5000,
    });
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async verifyConnection(): Promise<void> {
    const conn = await this.pool.getConnection();
    try {
      await conn.ping();
    } finally {
      conn.release();
    }
  }

  /**
   * Ensures all required MySQL tables exist (without inserting any demo or seed data).
   * If ADMIN_PASSWORD is provided in .env and no admin exists yet, creates the single initial admin.
   */
  public async initializeDatabase(): Promise<void> {
    await this.verifyConnection();

    const tableStatements = [
      `CREATE TABLE IF NOT EXISTS navigation_links (
        id INT AUTO_INCREMENT PRIMARY KEY,
        label VARCHAR(100) NOT NULL,
        href VARCHAR(255) NOT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS hero_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        headline VARCHAR(255) NOT NULL,
        subtitle_line_1 VARCHAR(255) NOT NULL,
        subtitle_line_2 VARCHAR(255) NOT NULL,
        nav_cta_text VARCHAR(100) NOT NULL,
        nav_cta_target VARCHAR(255) NOT NULL,
        hero_image_url VARCHAR(255) NOT NULL,
        audio_progress_percent INT NOT NULL DEFAULT 100,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS featured_books (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        persian_title VARCHAR(150) NOT NULL,
        author VARCHAR(150) NOT NULL,
        publication_year INT NOT NULL DEFAULT 2000,
        synopsis TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS about_club (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS about_manager (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS library_books (
        id INT AUTO_INCREMENT PRIMARY KEY,
        is_current TINYINT(1) NOT NULL DEFAULT 0,
        title VARCHAR(180) NOT NULL,
        original_title VARCHAR(180) NOT NULL DEFAULT '',
        author VARCHAR(150) NOT NULL,
        translator VARCHAR(150) NOT NULL DEFAULT '',
        category VARCHAR(80) NOT NULL DEFAULT 'کلاسیک',
        publication_year INT NOT NULL DEFAULT 1400,
        pages_count INT NOT NULL DEFAULT 300,
        reading_progress_percent INT NOT NULL DEFAULT 0,
        session_schedule VARCHAR(180) NOT NULL DEFAULT '',
        cover_url LONGTEXT NOT NULL,
        short_description TEXT NOT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS blog_posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(220) NOT NULL,
        slug VARCHAR(220) NOT NULL DEFAULT '',
        category VARCHAR(100) NOT NULL DEFAULT 'یادداشت ادبی',
        author VARCHAR(150) NOT NULL,
        published_date VARCHAR(80) NOT NULL,
        reading_time VARCHAR(60) NOT NULL DEFAULT '۵ دقیقه مطالعه',
        cover_url LONGTEXT NOT NULL,
        excerpt TEXT NOT NULL,
        full_content LONGTEXT NOT NULL,
        tags VARCHAR(255) NOT NULL DEFAULT '',
        status VARCHAR(40) NOT NULL DEFAULT 'منتشر شده',
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS gallery_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(180) NOT NULL,
        url LONGTEXT NOT NULL,
        category VARCHAR(80) NOT NULL DEFAULT 'عمومی',
        created_at VARCHAR(80) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS contact_info (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS contact_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL,
        subject VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS club_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(60) NOT NULL,
        role ENUM('member', 'admin') NOT NULL DEFAULT 'member',
        status VARCHAR(40) NOT NULL DEFAULT 'فعال',
        education VARCHAR(120) NOT NULL DEFAULT '',
        email VARCHAR(150) NOT NULL DEFAULT '',
        avatar_url LONGTEXT,
        bio TEXT NOT NULL,
        membership_code VARCHAR(60) NOT NULL DEFAULT '',
        joined_date VARCHAR(60) NOT NULL DEFAULT '',
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_club_members_phone (phone)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS auth_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        token VARCHAR(128) NOT NULL,
        member_id INT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_auth_tokens_token (token),
        INDEX idx_auth_tokens_member (member_id),
        CONSTRAINT fk_auth_tokens_member
          FOREIGN KEY (member_id) REFERENCES club_members (id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS user_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        author_name VARCHAR(150) NOT NULL,
        author_phone VARCHAR(60) NOT NULL DEFAULT '',
        target_title VARCHAR(220) NOT NULL,
        target_type VARCHAR(60) NOT NULL DEFAULT 'مقاله وبلاگ',
        rating INT NOT NULL DEFAULT 5,
        comment_text TEXT NOT NULL,
        admin_reply TEXT NOT NULL,
        status VARCHAR(40) NOT NULL DEFAULT 'در انتظار تایید',
        created_date VARCHAR(80) NOT NULL,
        sort_order INT NOT NULL DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS member_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        member_phone VARCHAR(60) NOT NULL DEFAULT 'all',
        title VARCHAR(220) NOT NULL,
        book_title VARCHAR(180) NOT NULL,
        book_author VARCHAR(150) NOT NULL DEFAULT '',
        translator VARCHAR(150) NOT NULL DEFAULT '',
        category VARCHAR(100) NOT NULL DEFAULT '',
        publication_year INT NOT NULL DEFAULT 1405,
        pages_count INT NOT NULL DEFAULT 0,
        publisher VARCHAR(150) NOT NULL DEFAULT '',
        mentor_name VARCHAR(150) NOT NULL DEFAULT '',
        session_date VARCHAR(100) NOT NULL DEFAULT '',
        session_time VARCHAR(100) NOT NULL DEFAULT '',
        cover_url LONGTEXT NOT NULL,
        short_description TEXT NOT NULL,
        full_description LONGTEXT NOT NULL,
        location_type VARCHAR(80) NOT NULL DEFAULT 'حضوری و آنلاین',
        meeting_link_or_room VARCHAR(255) NOT NULL DEFAULT '',
        status VARCHAR(60) NOT NULL DEFAULT 'فعال',
        member_note TEXT NOT NULL,
        sub_sessions_json LONGTEXT NOT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS member_classes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        member_phone VARCHAR(60) NOT NULL DEFAULT 'all',
        title VARCHAR(220) NOT NULL,
        book_title VARCHAR(180) NOT NULL DEFAULT '',
        instructor_name VARCHAR(150) NOT NULL,
        schedule_summary VARCHAR(150) NOT NULL,
        level_label VARCHAR(80) NOT NULL DEFAULT 'مبتدی',
        cover_url LONGTEXT NOT NULL,
        status VARCHAR(60) NOT NULL DEFAULT 'فعال',
        description TEXT NOT NULL,
        sub_sessions_json LONGTEXT NOT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS session_enrollments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        target_type ENUM('session', 'class') NOT NULL DEFAULT 'session',
        target_id INT NOT NULL,
        member_id INT DEFAULT NULL,
        member_phone VARCHAR(60) NOT NULL,
        member_name VARCHAR(150) NOT NULL,
        status VARCHAR(40) NOT NULL DEFAULT 'غیرفعال',
        attendance_status VARCHAR(40) NOT NULL DEFAULT 'ثبت‌نام‌شده',
        member_note TEXT,
        registered_at VARCHAR(80) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_enrollment_target_member (target_type, target_id, member_phone),
        INDEX idx_enrollment_member_phone (member_phone),
        INDEX idx_enrollment_target (target_type, target_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS member_library (
        id INT AUTO_INCREMENT PRIMARY KEY,
        member_phone VARCHAR(60) NOT NULL,
        book_title VARCHAR(180) NOT NULL,
        author VARCHAR(150) NOT NULL,
        translator VARCHAR(150) NOT NULL DEFAULT '',
        cover_url LONGTEXT NOT NULL,
        reading_status VARCHAR(60) NOT NULL DEFAULT 'در حال مطالعه',
        progress_percent INT NOT NULL DEFAULT 0,
        pages_read INT NOT NULL DEFAULT 0,
        pages_count INT NOT NULL DEFAULT 300,
        personal_note TEXT NOT NULL,
        updated_at VARCHAR(80) NOT NULL,
        INDEX idx_member_library_phone (member_phone)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS member_tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        member_phone VARCHAR(60) NOT NULL,
        ticket_code VARCHAR(40) NOT NULL,
        subject VARCHAR(220) NOT NULL,
        department VARCHAR(100) NOT NULL,
        priority VARCHAR(40) NOT NULL DEFAULT 'عادی',
        status VARCHAR(60) NOT NULL DEFAULT 'در انتظار بررسی',
        message TEXT NOT NULL,
        attachment_name VARCHAR(255) NOT NULL DEFAULT '',
        admin_reply TEXT NOT NULL,
        admin_replies_json LONGTEXT,
        created_at VARCHAR(80) NOT NULL,
        INDEX idx_member_tickets_phone (member_phone, status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS club_calendar_events (
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
        reserved_by_phones_json LONGTEXT,
        sort_order INT NOT NULL DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS club_announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(220) NOT NULL,
        category VARCHAR(80) NOT NULL,
        published_date VARCHAR(80) NOT NULL,
        summary TEXT NOT NULL,
        content TEXT NOT NULL,
        is_important TINYINT(1) NOT NULL DEFAULT 0,
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        target_user_phone VARCHAR(60) DEFAULT NULL,
        target_user_name VARCHAR(150) DEFAULT NULL,
        sort_order INT NOT NULL DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    ];

    for (const stmt of tableStatements) {
      await this.pool.execute(stmt);
    }

    await this.ensureSchemaMigrations();
    await this.ensureInitialAdminFromEnv();
    this.initialized = true;
  }

  private async ensureSchemaMigrations(): Promise<void> {
    const dbName = process.env.MYSQL_DATABASE || 'bookmeet_db';

    // 1. Safely drop legacy city and favorite_genre columns from club_members if present
    for (const legacyCol of ['city', 'favorite_genre']) {
      const [colRows] = await this.pool.execute<RowDataPacket[]>(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'club_members' AND COLUMN_NAME = ?`,
        [dbName, legacyCol]
      );
      if (colRows.length > 0) {
        await this.pool.execute(
          `ALTER TABLE club_members DROP COLUMN \`${legacyCol}\``
        );
      }
    }

    // 2. Safely add new session columns to member_sessions if missing
    const sessionColumnsToEnsure: Array<{ name: string; definition: string }> = [
      { name: 'translator', definition: "VARCHAR(150) NOT NULL DEFAULT ''" },
      { name: 'category', definition: "VARCHAR(100) NOT NULL DEFAULT ''" },
      { name: 'publication_year', definition: 'INT NOT NULL DEFAULT 1405' },
      { name: 'short_description', definition: 'TEXT NULL' },
      { name: 'full_description', definition: 'LONGTEXT NULL' },
    ];

    for (const col of sessionColumnsToEnsure) {
      const [colRows] = await this.pool.execute<RowDataPacket[]>(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'member_sessions' AND COLUMN_NAME = ?`,
        [dbName, col.name]
      );
      if (colRows.length === 0) {
        await this.pool.execute(
          `ALTER TABLE member_sessions ADD COLUMN \`${col.name}\` ${col.definition}`
        );
      }
    }
  }

  public async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initializeDatabase();
    } else {
      await this.verifyConnection();
    }
  }

  /**
   * Creates the single initial administrator account ONLY if no admin exists yet
   * and a strong ADMIN_PASSWORD is provided in environment variables.
   */
  public async ensureInitialAdminFromEnv(): Promise<void> {
    const rawPassword = String(process.env.ADMIN_PASSWORD || '').trim();
    const forbiddenPasswords = new Set([
      '',
      'CHANGE_THIS_TO_A_STRONG_PASSWORD',
      'admin1234',
      '1234',
      'admin',
      'password',
      '123456',
      '12345678',
    ]);

    if (forbiddenPasswords.has(rawPassword) || rawPassword.length < 8) {
      return;
    }

    const [existingAdmins] = await this.pool.execute<RowDataPacket[]>(
      'SELECT id FROM club_members WHERE role = ? LIMIT 1',
      ['admin']
    );

    if (existingAdmins.length > 0) {
      return;
    }

    const fullName = String(process.env.ADMIN_NAME || 'سهراب رستگار').trim();
    const nameParts = fullName.split(/\s+/);
    const firstName = nameParts[0] || 'مدیر';
    const lastName = nameParts.slice(1).join(' ') || 'باشگاه';
    const username = normalizeIdentifierDigits(
      String(process.env.ADMIN_USERNAME || 'admin').trim()
    );
    const email = String(process.env.ADMIN_EMAIL || 'admin@bookmeet.ir').trim();
    const passwordHash = await bcrypt.hash(rawPassword, 12);

    await this.pool.execute(
      `INSERT INTO club_members
        (first_name, last_name, phone, role, status, education, email, avatar_url, bio, membership_code, joined_date, password_hash)
       VALUES (?, ?, ?, 'admin', 'فعال', 'دکتری', ?, '/assets/manager-portrait.png', 'مدیر باشگاه کتابخوانی بوک‌میت', 'BM-ADMIN-۰۰۱', '۱۴۰۵', ?)`,
      [firstName, lastName, username, email, passwordHash]
    );
  }

  /**
   * Used by `npm run init-admin` CLI script to securely initialize the single administrator.
   */
  public async initializeSingleAdminAccount(input: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    passwordPlain: string;
  }): Promise<PublicClubMember> {
    const cleanPass = String(input.passwordPlain || '').trim();
    if (
      cleanPass.length < 8 ||
      ['admin1234', '1234', 'admin', 'password', 'CHANGE_THIS_TO_A_STRONG_PASSWORD'].includes(
        cleanPass
      )
    ) {
      throw new Error(
        'رمز عبور مدیر باید حداقل ۸ کاراکتر باشد و از رمزهای پیش‌فرض و ضعیف استفاده نشود.'
      );
    }

    const [existingAdmins] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM club_members WHERE role = ? LIMIT 1',
      ['admin']
    );

    if (existingAdmins.length > 0) {
      throw new Error(
        'حساب مدیر اولیه قبلاً در دیتابیس ایجاد شده است. سیستم فقط یک مدیر می‌تواند داشته باشد.'
      );
    }

    const username = normalizeIdentifierDigits(input.username || 'admin');
    const passwordHash = await bcrypt.hash(cleanPass, 12);

    const [result] = await this.pool.execute<ResultSetHeader>(
      `INSERT INTO club_members
        (first_name, last_name, phone, role, status, education, email, avatar_url, bio, membership_code, joined_date, password_hash)
       VALUES (?, ?, ?, 'admin', 'فعال', 'دکتری', ?, '/assets/manager-portrait.png', 'مدیر باشگاه کتابخوانی بوک‌میت', 'BM-ADMIN-۰۰۱', '۱۴۰۵', ?)`,
      [
        input.firstName.trim(),
        input.lastName.trim(),
        username,
        input.email.trim(),
        passwordHash,
      ]
    );

    const [rows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM club_members WHERE id = ? LIMIT 1',
      [result.insertId]
    );
    return stripPassword(rows[0] as ClubMemberRow);
  }

  // ==================== AUTH SESSION TOKENS ====================

  public async createAuthSession(memberId: number): Promise<string> {
    const token = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await this.pool.execute(
      'INSERT INTO auth_tokens (token, member_id, expires_at) VALUES (?, ?, ?)',
      [token, memberId, expiresAt]
    );
    return token;
  }

  public async verifyAuthToken(token: string): Promise<PublicClubMember | null> {
    if (!token || typeof token !== 'string') return null;
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      `SELECT m.*
       FROM auth_tokens t
       INNER JOIN club_members m ON m.id = t.member_id
       WHERE t.token = ? AND t.expires_at > NOW()
       LIMIT 1`,
      [token.trim()]
    );
    if (rows.length === 0) return null;
    const member = rows[0] as ClubMemberRow;
    if (member.status === 'غیرفعال') return null;
    return stripPassword(member);
  }

  public async revokeAuthToken(token: string): Promise<void> {
    if (!token) return;
    await this.pool.execute('DELETE FROM auth_tokens WHERE token = ?', [token.trim()]);
  }

  // ==================== PUBLIC WEBSITE QUERIES ====================

  public async getNavigationLinks(): Promise<NavigationLinkRow[]> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT id, label, href, sort_order, is_active FROM navigation_links WHERE is_active = 1 ORDER BY sort_order ASC'
    );
    if (rows.length === 0) {
      return DEFAULT_NAVIGATION_LINKS;
    }
    return rows as NavigationLinkRow[];
  }

  public async getHeroSettings(): Promise<HeroSettingsRow> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM hero_settings ORDER BY id ASC LIMIT 1'
    );
    if (rows.length === 0) {
      return EMPTY_HERO_SETTINGS;
    }
    return rows[0] as HeroSettingsRow;
  }

  public async getFeaturedBooks(): Promise<FeaturedBookRow[]> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM featured_books ORDER BY id ASC'
    );
    return rows as FeaturedBookRow[];
  }

  public async getAboutClub(): Promise<AboutClubRow> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM about_club ORDER BY id ASC LIMIT 1'
    );
    if (rows.length === 0) {
      return EMPTY_ABOUT_CLUB;
    }
    return rows[0] as AboutClubRow;
  }

  public async getAboutManager(): Promise<AboutManagerRow> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM about_manager ORDER BY id ASC LIMIT 1'
    );
    if (rows.length === 0) {
      return EMPTY_ABOUT_MANAGER;
    }
    return rows[0] as AboutManagerRow;
  }

  public async getLibraryBooks(): Promise<LibraryBookRow[]> {
    const [rows, inactiveSessions] = await Promise.all([
      this.pool.execute<RowDataPacket[]>(
        'SELECT * FROM library_books ORDER BY sort_order ASC, id DESC'
      ),
      this.pool.execute<RowDataPacket[]>(
        "SELECT book_title, title FROM member_sessions WHERE status = 'غیرفعال'"
      ),
    ]);
    const inactiveTitles = new Set<string>();
    for (const s of inactiveSessions[0]) {
      if (s.book_title) inactiveTitles.add(String(s.book_title).trim());
      if (s.title) inactiveTitles.add(String(s.title).trim());
    }
    return (rows[0] as LibraryBookRow[]).filter(
      (b) => !inactiveTitles.has(String(b.title || '').trim())
    );
  }

  public async getPublicActiveSessions(): Promise<MemberSessionRow[]> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      "SELECT * FROM member_sessions WHERE status != 'غیرفعال' ORDER BY sort_order ASC, id DESC"
    );
    return this.mapSessionRowsWithEnrollments(rows);
  }

  public async getPublicActiveClasses(): Promise<MemberClassRow[]> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      "SELECT * FROM member_classes WHERE status != 'غیرفعال' ORDER BY sort_order ASC, id DESC"
    );
    return this.mapClassRowsWithEnrollments(rows);
  }

  public async getApprovedComments(): Promise<UserCommentRow[]> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      "SELECT * FROM user_comments WHERE status = 'تایید شده' ORDER BY sort_order ASC, id DESC"
    );
    return rows as UserCommentRow[];
  }

  public async getBlogPosts(): Promise<BlogPostRow[]> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM blog_posts ORDER BY sort_order ASC, id DESC'
    );
    return rows as BlogPostRow[];
  }

  public async getContactInfo(): Promise<ContactInfoRow> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM contact_info ORDER BY id ASC LIMIT 1'
    );
    if (rows.length === 0) {
      return EMPTY_CONTACT_INFO;
    }
    return rows[0] as ContactInfoRow;
  }

  public async createContactMessage(input: {
    full_name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<ContactMessageRow> {
    const [result] = await this.pool.execute<ResultSetHeader>(
      'INSERT INTO contact_messages (full_name, email, subject, message) VALUES (?, ?, ?, ?)',
      [input.full_name, input.email, input.subject, input.message]
    );
    return {
      id: result.insertId,
      full_name: input.full_name,
      email: input.email,
      subject: input.subject,
      message: input.message,
      created_at: new Date().toISOString(),
    };
  }

  // ==================== REGISTRATION & LOGIN ====================

  public async registerClubMember(input: {
    first_name: string;
    last_name: string;
    phone: string;
    education: string;
    password_plain: string;
  }): Promise<{ member: PublicClubMember; token: string }> {
    const normalizedPhone = normalizeIdentifierDigits(input.phone);
    if (!normalizedPhone || normalizedPhone.length < 4) {
      throw new Error('شماره تلفن واردشده معتبر نیست.');
    }

    const lowerPhone = normalizedPhone.toLowerCase();
    if (lowerPhone === 'admin' || lowerPhone === 'مدیر' || lowerPhone === 'root') {
      throw new Error('استفاده از این شناسه برای ثبت‌نام کاربران مجاز نیست.');
    }

    if (!input.password_plain || input.password_plain.length < 4) {
      throw new Error('رمز عبور باید حداقل ۴ کاراکتر باشد.');
    }

    const persianPhone = toPersianDigitsServer(normalizedPhone);

    const [existing] = await this.pool.execute<RowDataPacket[]>(
      'SELECT id FROM club_members WHERE phone = ? OR phone = ? LIMIT 1',
      [normalizedPhone, persianPhone]
    );

    if (existing.length > 0) {
      throw new Error('این شماره تلفن پیش‌تر در باشگاه ثبت‌نام شده است.');
    }

    const passwordHash = await bcrypt.hash(input.password_plain, 12);
    const joinedDate = '۱۴۰۵';
    const tempCode = `BM-۱۴۰۵-${toPersianDigitsServer(Math.floor(100 + Math.random() * 900))}`;

    const [result] = await this.pool.execute<ResultSetHeader>(
      `INSERT INTO club_members
        (first_name, last_name, phone, role, status, education, email, avatar_url, bio, membership_code, joined_date, password_hash)
       VALUES (?, ?, ?, 'member', 'فعال', ?, '', '', 'عضو باشگاه کتابخوانی بوک‌میت', ?, ?, ?)`,
      [
        input.first_name.trim(),
        input.last_name.trim(),
        persianPhone,
        input.education.trim(),
        tempCode,
        joinedDate,
        passwordHash,
      ]
    );

    const finalCode = `BM-۱۴۰۵-${toPersianDigitsServer(100 + result.insertId)}`;
    await this.pool.execute(
      'UPDATE club_members SET membership_code = ? WHERE id = ?',
      [finalCode, result.insertId]
    );

    const [rows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM club_members WHERE id = ? LIMIT 1',
      [result.insertId]
    );

    const memberRow = rows[0] as ClubMemberRow;
    const token = await this.createAuthSession(memberRow.id);

    return {
      member: stripPassword(memberRow),
      token,
    };
  }

  public async loginClubMember(input: {
    phone: string;
    password_plain: string;
  }): Promise<{ member: PublicClubMember; token: string }> {
    const rawIdentifier = String(input.phone || '').trim();
    const normalizedIdentifier = normalizeIdentifierDigits(rawIdentifier);
    const persianIdentifier = toPersianDigitsServer(normalizedIdentifier);

    const [rows] = await this.pool.execute<RowDataPacket[]>(
      `SELECT * FROM club_members
       WHERE phone = ? OR phone = ? OR email = ? OR (role = 'admin' AND ? IN ('admin', 'مدیر'))
       LIMIT 1`,
      [rawIdentifier, normalizedIdentifier, normalizedIdentifier, normalizedIdentifier.toLowerCase()]
    );

    let foundRow: ClubMemberRow | undefined = rows[0] as ClubMemberRow | undefined;

    if (!foundRow && persianIdentifier !== rawIdentifier) {
      const [persianRows] = await this.pool.execute<RowDataPacket[]>(
        'SELECT * FROM club_members WHERE phone = ? LIMIT 1',
        [persianIdentifier]
      );
      foundRow = persianRows[0] as ClubMemberRow | undefined;
    }

    if (!foundRow) {
      throw new Error('کاربری با این مشخصات یافت نشد.');
    }

    if (foundRow.status === 'غیرفعال') {
      throw new Error('حساب کاربری شما غیرفعال شده است. لطفاً با مدیریت باشگاه تماس بگیرید.');
    }

    const isPasswordValid = await bcrypt.compare(
      String(input.password_plain || ''),
      foundRow.password_hash
    );

    if (!isPasswordValid) {
      throw new Error('شماره تلفن/نام کاربری یا رمز عبور اشتباه است.');
    }

    const token = await this.createAuthSession(foundRow.id);

    return {
      member: stripPassword(foundRow),
      token,
    };
  }

  // ==================== HELPERS FOR SESSIONS & CLASSES ====================

  private async mapSessionRowsWithEnrollments(
    rawSessions: RowDataPacket[]
  ): Promise<MemberSessionRow[]> {
    if (rawSessions.length === 0) return [];
    const sessionIds = rawSessions.map((r) => Number(r.id));
    const placeholders = sessionIds.map(() => '?').join(',');

    const [enrollmentRows] = await this.pool.execute<RowDataPacket[]>(
      `SELECT * FROM session_enrollments
       WHERE target_type = 'session' AND target_id IN (${placeholders})
       ORDER BY id DESC`,
      sessionIds
    );

    const bySessionId = new Map<number, EnrollmentRecordRow[]>();
    for (const er of enrollmentRows) {
      const tid = Number(er.target_id);
      const list = bySessionId.get(tid) || [];
      list.push({
        id: Number(er.id),
        member_phone: String(er.member_phone),
        member_name: String(er.member_name),
        registered_at: String(er.registered_at),
        status: (er.status as EnrollmentRecordRow['status']) || 'غیرفعال',
        attendance_status: String(er.attendance_status || 'ثبت‌نام‌شده'),
      });
      bySessionId.set(tid, list);
    }

    return rawSessions.map((r) => {
      const translatorVal = String(r.translator || r.mentor_name || '');
      return {
        id: Number(r.id),
        member_phone: String(r.member_phone || 'all'),
        title: String(r.title || ''),
        book_title: String(r.book_title || ''),
        book_author: String(r.book_author || ''),
        translator: translatorVal,
        category: String(r.category || ''),
        publication_year: Number(r.publication_year || 0),
        pages_count: Number(r.pages_count || 0),
        publisher: String(r.publisher || ''),
        mentor_name: String(r.mentor_name || translatorVal),
        session_date: String(r.session_date || ''),
        session_time: String(r.session_time || ''),
        cover_url: String(r.cover_url || '/assets/book-current.png'),
        short_description: String(r.short_description || ''),
        full_description: String(r.full_description || ''),
        location_type: String(r.location_type || 'حضوری و آنلاین'),
        meeting_link_or_room: String(r.meeting_link_or_room || ''),
        status: (r.status as MemberSessionRow['status']) || 'فعال',
        member_note: String(r.member_note || ''),
        sub_sessions: safeJsonParse<SessionSubItemRow[]>(r.sub_sessions_json, []),
        enrolled_members: bySessionId.get(Number(r.id)) || [],
        sort_order: Number(r.sort_order || 0),
      };
    });
  }

  private async mapClassRowsWithEnrollments(
    rawClasses: RowDataPacket[]
  ): Promise<MemberClassRow[]> {
    if (rawClasses.length === 0) return [];
    const classIds = rawClasses.map((r) => Number(r.id));
    const placeholders = classIds.map(() => '?').join(',');

    const [enrollmentRows] = await this.pool.execute<RowDataPacket[]>(
      `SELECT * FROM session_enrollments
       WHERE target_type = 'class' AND target_id IN (${placeholders})
       ORDER BY id DESC`,
      classIds
    );

    const byClassId = new Map<number, EnrollmentRecordRow[]>();
    for (const er of enrollmentRows) {
      const tid = Number(er.target_id);
      const list = byClassId.get(tid) || [];
      list.push({
        id: Number(er.id),
        member_phone: String(er.member_phone),
        member_name: String(er.member_name),
        registered_at: String(er.registered_at),
        status: (er.status as EnrollmentRecordRow['status']) || 'غیرفعال',
        attendance_status: String(er.attendance_status || 'ثبت‌نام‌شده'),
      });
      byClassId.set(tid, list);
    }

    return rawClasses.map((r) => ({
      id: Number(r.id),
      member_phone: String(r.member_phone || 'all'),
      title: String(r.title || ''),
      book_title: String(r.book_title || ''),
      instructor_name: String(r.instructor_name || ''),
      schedule_summary: String(r.schedule_summary || ''),
      level_label: String(r.level_label || 'مبتدی'),
      cover_url: String(r.cover_url || '/assets/blog-1.png'),
      status: (r.status as MemberClassRow['status']) || 'فعال',
      description: String(r.description || ''),
      sub_sessions: safeJsonParse<SessionSubItemRow[]>(r.sub_sessions_json, []),
      enrolled_members: byClassId.get(Number(r.id)) || [],
      sort_order: Number(r.sort_order || 0),
    }));
  }

  // ==================== MEMBER PANEL QUERIES & MUTATIONS ====================

  public async getMemberPanelData(memberPhone: string): Promise<{
    member: PublicClubMember;
    sessions: MemberSessionRow[];
    classes: MemberClassRow[];
    library: MemberLibraryRow[];
    tickets: MemberTicketRow[];
    calendarEvents: ClubCalendarEventRow[];
    announcements: ClubAnnouncementRow[];
  }> {
    const normalizedPhone = normalizeIdentifierDigits(memberPhone);
    const persianPhone = toPersianDigitsServer(normalizedPhone);

    const [memberRows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM club_members WHERE phone = ? OR phone = ? LIMIT 1',
      [memberPhone, persianPhone]
    );

    if (memberRows.length === 0) {
      throw new Error('کاربر مورد نظر در دیتابیس یافت نشد.');
    }

    const publicMember = stripPassword(memberRows[0] as ClubMemberRow);
    const canonicalPhone = publicMember.phone;

    const [
      rawSessions,
      rawClasses,
      rawLibrary,
      rawTickets,
      rawEvents,
      rawAnnouncements,
    ] = await Promise.all([
      this.pool.execute<RowDataPacket[]>(
        'SELECT * FROM member_sessions ORDER BY sort_order ASC, id DESC'
      ),
      this.pool.execute<RowDataPacket[]>(
        'SELECT * FROM member_classes ORDER BY sort_order ASC, id DESC'
      ),
      this.pool.execute<RowDataPacket[]>(
        'SELECT * FROM member_library WHERE member_phone = ? OR member_phone = ? ORDER BY id DESC',
        [canonicalPhone, normalizedPhone]
      ),
      this.pool.execute<RowDataPacket[]>(
        'SELECT * FROM member_tickets WHERE member_phone = ? OR member_phone = ? ORDER BY id DESC',
        [canonicalPhone, normalizedPhone]
      ),
      this.pool.execute<RowDataPacket[]>(
        'SELECT * FROM club_calendar_events ORDER BY sort_order ASC, id DESC'
      ),
      this.pool.execute<RowDataPacket[]>(
        `SELECT * FROM club_announcements
         WHERE target_user_phone IS NULL OR target_user_phone = '' OR target_user_phone = 'all' OR target_user_phone = ? OR target_user_phone = ?
         ORDER BY sort_order ASC, id DESC`,
        [canonicalPhone, normalizedPhone]
      ),
    ]);

    const allSessions = await this.mapSessionRowsWithEnrollments(rawSessions[0]);
    const allClasses = await this.mapClassRowsWithEnrollments(rawClasses[0]);

    const userSessions = allSessions
      .filter((s) => {
        const rec = (s.enrolled_members || []).find(
          (e) =>
            e.member_phone === canonicalPhone ||
            normalizeIdentifierDigits(e.member_phone) === normalizedPhone
        );
        if (rec) {
          return rec.status !== 'لغو شده';
        }
        return (
          s.member_phone === canonicalPhone ||
          normalizeIdentifierDigits(s.member_phone) === normalizedPhone
        );
      })
      .map((s) => {
        const rec = (s.enrolled_members || []).find(
          (e) =>
            e.member_phone === canonicalPhone ||
            normalizeIdentifierDigits(e.member_phone) === normalizedPhone
        );
        if (rec) {
          return {
            ...s,
            status: rec.status === 'فعال' ? ('فعال' as const) : ('غیرفعال' as const),
          };
        }
        return s;
      });

    const userClasses = allClasses
      .filter((c) => {
        const rec = (c.enrolled_members || []).find(
          (e) =>
            e.member_phone === canonicalPhone ||
            normalizeIdentifierDigits(e.member_phone) === normalizedPhone
        );
        if (rec) {
          return rec.status !== 'لغو شده';
        }
        return (
          c.member_phone === canonicalPhone ||
          normalizeIdentifierDigits(c.member_phone) === normalizedPhone
        );
      })
      .map((c) => {
        const rec = (c.enrolled_members || []).find(
          (e) =>
            e.member_phone === canonicalPhone ||
            normalizeIdentifierDigits(e.member_phone) === normalizedPhone
        );
        if (rec) {
          return {
            ...c,
            status: rec.status === 'فعال' ? ('فعال' as const) : ('غیرفعال' as const),
          };
        }
        return c;
      });

    const tickets: MemberTicketRow[] = rawTickets[0].map((t) => ({
      id: Number(t.id),
      member_phone: String(t.member_phone),
      ticket_code: String(t.ticket_code),
      subject: String(t.subject),
      department: String(t.department),
      priority: (t.priority as MemberTicketRow['priority']) || 'عادی',
      status: (t.status as MemberTicketRow['status']) || 'در انتظار بررسی',
      message: String(t.message),
      attachment_name: String(t.attachment_name || ''),
      admin_reply: String(t.admin_reply || ''),
      admin_replies: safeJsonParse<{ text: string; created_at: string }[]>(
        t.admin_replies_json,
        t.admin_reply ? [{ text: String(t.admin_reply), created_at: String(t.created_at) }] : []
      ),
      created_at: String(t.created_at),
    }));

    const calendarEvents: ClubCalendarEventRow[] = rawEvents[0].map((ev) => {
      const reservedList = safeJsonParse<string[]>(ev.reserved_by_phones_json, []);
      const isReservedByMember =
        reservedList.includes(canonicalPhone) ||
        reservedList.includes(normalizedPhone) ||
        Number(ev.is_reserved) === 1;
      return {
        id: Number(ev.id),
        title: String(ev.title),
        event_type: String(ev.event_type),
        day_of_month: String(ev.day_of_month),
        month_name: String(ev.month_name),
        weekday_name: String(ev.weekday_name),
        time_range: String(ev.time_range),
        host_name: String(ev.host_name),
        location_label: String(ev.location_label),
        capacity_info: String(ev.capacity_info),
        description: String(ev.description),
        is_reserved: isReservedByMember ? 1 : 0,
        sort_order: Number(ev.sort_order || 0),
      };
    });

    return {
      member: publicMember,
      sessions: userSessions,
      classes: userClasses,
      library: rawLibrary[0] as MemberLibraryRow[],
      tickets,
      calendarEvents,
      announcements: rawAnnouncements[0] as ClubAnnouncementRow[],
    };
  }

  public async updateMemberProfile(input: {
    memberId: number;
    first_name: string;
    last_name: string;
    education: string;
    email: string;
    avatar_url?: string;
    bio: string;
  }): Promise<PublicClubMember> {
    const [existingRows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM club_members WHERE id = ? LIMIT 1',
      [input.memberId]
    );

    if (existingRows.length === 0) {
      throw new Error('حساب کاربری یافت نشد.');
    }

    const current = existingRows[0] as ClubMemberRow;
    const nextAvatar = input.avatar_url !== undefined ? input.avatar_url : current.avatar_url;

    await this.pool.execute(
      `UPDATE club_members
       SET first_name = ?, last_name = ?, education = ?, email = ?, avatar_url = ?, bio = ?
       WHERE id = ?`,
      [
        input.first_name.trim(),
        input.last_name.trim(),
        input.education.trim(),
        input.email.trim(),
        nextAvatar || '',
        input.bio.trim(),
        input.memberId,
      ]
    );

    const [updatedRows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM club_members WHERE id = ? LIMIT 1',
      [input.memberId]
    );
    return stripPassword(updatedRows[0] as ClubMemberRow);
  }

  public async updateMemberSessionNote(input: {
    sessionId: number;
    member_phone: string;
    member_note: string;
  }): Promise<MemberSessionRow> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM member_sessions WHERE id = ? LIMIT 1',
      [input.sessionId]
    );
    if (rows.length === 0) {
      throw new Error('نشست مورد نظر یافت نشد.');
    }

    await this.pool.execute(
      'UPDATE member_sessions SET member_note = ? WHERE id = ?',
      [input.member_note, input.sessionId]
    );

    await this.pool.execute(
      `UPDATE session_enrollments
       SET member_note = ?
       WHERE target_type = 'session' AND target_id = ? AND member_phone = ?`,
      [input.member_note, input.sessionId, input.member_phone]
    );

    const [updatedRows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM member_sessions WHERE id = ? LIMIT 1',
      [input.sessionId]
    );
    const mapped = await this.mapSessionRowsWithEnrollments(updatedRows);
    return mapped[0];
  }

  public async updateMemberLibraryItem(input: {
    bookId: number;
    member_phone: string;
    pages_read?: number;
    progress_percent?: number;
    reading_status: 'در حال مطالعه' | 'خوانده‌شده' | 'در نوبت مطالعه';
    personal_note: string;
  }): Promise<MemberLibraryRow> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM member_library WHERE id = ? AND member_phone = ? LIMIT 1',
      [input.bookId, input.member_phone]
    );

    if (rows.length === 0) {
      throw new Error('کتاب مورد نظر در کتابخانه شخصی شما یافت نشد.');
    }

    const item = rows[0] as MemberLibraryRow;
    const totalPages = Math.max(1, Number(item.pages_count || 300));
    let nextPagesRead = Number(item.pages_read || 0);
    let nextProgress = Number(item.progress_percent || 0);

    if (typeof input.pages_read === 'number' && !Number.isNaN(input.pages_read)) {
      nextPagesRead = Math.max(0, Math.min(totalPages, Math.round(input.pages_read)));
      nextProgress = Math.min(100, Math.round((nextPagesRead / totalPages) * 100));
    } else if (typeof input.progress_percent === 'number') {
      nextProgress = Math.max(0, Math.min(100, Number(input.progress_percent)));
      nextPagesRead = Math.round((nextProgress / 100) * totalPages);
    }

    let nextStatus = input.reading_status;
    if (nextPagesRead >= totalPages || input.reading_status === 'خوانده‌شده') {
      nextStatus = 'خوانده‌شده';
      nextPagesRead = totalPages;
      nextProgress = 100;
    }

    const updatedAt = 'هم‌اکنون';

    await this.pool.execute(
      `UPDATE member_library
       SET pages_read = ?, progress_percent = ?, reading_status = ?, personal_note = ?, updated_at = ?
       WHERE id = ? AND member_phone = ?`,
      [
        nextPagesRead,
        nextProgress,
        nextStatus,
        input.personal_note,
        updatedAt,
        input.bookId,
        input.member_phone,
      ]
    );

    const [updated] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM member_library WHERE id = ? LIMIT 1',
      [input.bookId]
    );
    return updated[0] as MemberLibraryRow;
  }

  public async addMemberLibraryBook(input: {
    member_phone: string;
    book_title: string;
    author: string;
    translator: string;
    reading_status: 'در حال مطالعه' | 'خوانده‌شده' | 'در نوبت مطالعه';
    pages_count: number;
    personal_note: string;
  }): Promise<MemberLibraryRow> {
    const covers = [
      '/assets/book-recent-3.png',
      '/assets/book-current.png',
      '/assets/book-recent-1.png',
      '/assets/book-recent-2.png',
      '/assets/book-recent-4.png',
    ];
    const totalPages = Math.max(1, Number(input.pages_count || 320));
    const initialProgress =
      input.reading_status === 'خوانده‌شده'
        ? 100
        : input.reading_status === 'در حال مطالعه'
        ? 20
        : 0;
    const pagesRead = Math.round((initialProgress / 100) * totalPages);
    const coverUrl = covers[Math.floor(Math.random() * covers.length)];

    const [result] = await this.pool.execute<ResultSetHeader>(
      `INSERT INTO member_library
        (member_phone, book_title, author, translator, cover_url, reading_status, progress_percent, pages_read, pages_count, personal_note, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'امروز')`,
      [
        input.member_phone,
        input.book_title,
        input.author,
        input.translator || '—',
        coverUrl,
        input.reading_status,
        initialProgress,
        pagesRead,
        totalPages,
        input.personal_note || '',
      ]
    );

    const [rows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM member_library WHERE id = ? LIMIT 1',
      [result.insertId]
    );
    return rows[0] as MemberLibraryRow;
  }

  public async createMemberTicket(input: {
    member_phone: string;
    subject: string;
    department: string;
    priority: 'عادی' | 'مهم' | 'فوری';
    message: string;
    attachment_name?: string;
  }): Promise<MemberTicketRow> {
    const tempCode = `TK-۱۴۰۵-${toPersianDigitsServer(Math.floor(100 + Math.random() * 900))}`;
    const createdAt = 'امروز';

    const [result] = await this.pool.execute<ResultSetHeader>(
      `INSERT INTO member_tickets
        (member_phone, ticket_code, subject, department, priority, status, message, attachment_name, admin_reply, admin_replies_json, created_at)
       VALUES (?, ?, ?, ?, ?, 'در انتظار بررسی', ?, ?, '', '[]', ?)`,
      [
        input.member_phone,
        tempCode,
        input.subject,
        input.department,
        input.priority,
        input.message,
        input.attachment_name || '',
        createdAt,
      ]
    );

    const ticketCode = `TK-۱۴۰۵-${toPersianDigitsServer(450 + result.insertId)}`;
    await this.pool.execute(
      'UPDATE member_tickets SET ticket_code = ? WHERE id = ?',
      [ticketCode, result.insertId]
    );

    const [rows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM member_tickets WHERE id = ? LIMIT 1',
      [result.insertId]
    );
    const t = rows[0];
    return {
      id: Number(t.id),
      member_phone: String(t.member_phone),
      ticket_code: String(t.ticket_code),
      subject: String(t.subject),
      department: String(t.department),
      priority: (t.priority as MemberTicketRow['priority']) || 'عادی',
      status: (t.status as MemberTicketRow['status']) || 'در انتظار بررسی',
      message: String(t.message),
      attachment_name: String(t.attachment_name || ''),
      admin_reply: String(t.admin_reply || ''),
      admin_replies: [],
      created_at: String(t.created_at),
    };
  }

  public async toggleCalendarReservation(
    eventId: number,
    memberPhone: string
  ): Promise<ClubCalendarEventRow> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM club_calendar_events WHERE id = ? LIMIT 1',
      [eventId]
    );
    if (rows.length === 0) {
      throw new Error('رویداد مورد نظر یافت نشد.');
    }

    const ev = rows[0];
    const dayNum = parseInt(
      normalizeIdentifierDigits(String(ev.day_of_month || '0')).replace(/[^\d]/g, ''),
      10
    );
    const isPast =
      String(ev.capacity_info || '').includes('برگزار شده') ||
      String(ev.capacity_info || '').includes('گذشته') ||
      (ev.month_name === 'آبان ۱۴۰۵' && !Number.isNaN(dayNum) && dayNum < 14);

    if (isPast) {
      throw new Error(
        'مهلت رزرو یا لغو این رویداد به پایان رسیده است و رویداد برگزار شده است.'
      );
    }

    const reservedPhones = safeJsonParse<string[]>(ev.reserved_by_phones_json, []);
    const idx = reservedPhones.indexOf(memberPhone);
    let isReservedNow = 0;
    if (idx >= 0) {
      reservedPhones.splice(idx, 1);
      isReservedNow = 0;
    } else {
      reservedPhones.push(memberPhone);
      isReservedNow = 1;
    }

    await this.pool.execute(
      'UPDATE club_calendar_events SET is_reserved = ?, reserved_by_phones_json = ? WHERE id = ?',
      [isReservedNow, JSON.stringify(reservedPhones), eventId]
    );

    return {
      id: Number(ev.id),
      title: String(ev.title),
      event_type: String(ev.event_type),
      day_of_month: String(ev.day_of_month),
      month_name: String(ev.month_name),
      weekday_name: String(ev.weekday_name),
      time_range: String(ev.time_range),
      host_name: String(ev.host_name),
      location_label: String(ev.location_label),
      capacity_info: String(ev.capacity_info),
      description: String(ev.description),
      is_reserved: isReservedNow,
      sort_order: Number(ev.sort_order || 0),
    };
  }

  public async markAnnouncementRead(
    announcementId: number
  ): Promise<ClubAnnouncementRow> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM club_announcements WHERE id = ? LIMIT 1',
      [announcementId]
    );
    if (rows.length === 0) {
      throw new Error('اطلاعیه مورد نظر یافت نشد.');
    }

    await this.pool.execute(
      'UPDATE club_announcements SET is_read = 1 WHERE id = ?',
      [announcementId]
    );

    const [updated] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM club_announcements WHERE id = ? LIMIT 1',
      [announcementId]
    );
    return updated[0] as ClubAnnouncementRow;
  }

  public async enrollMemberInItem(input: {
    member_id?: number;
    member_phone: string;
    member_name?: string;
    target_type: 'session' | 'class';
    target_id?: number;
    title: string;
    book_title?: string;
    book_author?: string;
    pages_count?: number;
    publisher?: string;
    mentor_or_instructor?: string;
    schedule_text?: string;
    time_text?: string;
    level_label?: string;
    cover_url?: string;
    description?: string;
    sub_sessions?: SessionSubItemRow[];
  }): Promise<{
    target_type: 'session' | 'class';
    session?: MemberSessionRow;
    classItem?: MemberClassRow;
  }> {
    const resolvedName = String(input.member_name || 'عضو باشگاه').trim();

    if (input.target_type === 'class') {
      const [existingClasses] = input.target_id
        ? await this.pool.execute<RowDataPacket[]>(
            'SELECT * FROM member_classes WHERE id = ? LIMIT 1',
            [Number(input.target_id)]
          )
        : await this.pool.execute<RowDataPacket[]>(
            'SELECT * FROM member_classes WHERE title = ? LIMIT 1',
            [input.title.trim()]
          );

      if (existingClasses.length === 0) {
        throw new Error('کلاس یا دوره مورد نظر در سیستم یافت نشد.');
      }

      if (String(existingClasses[0].status) === 'غیرفعال') {
        throw new Error(
          'این دوره در حال حاضر غیرفعال است و امکان ثبت‌نام جدید در آن وجود ندارد.'
        );
      }

      const classId = Number(existingClasses[0].id);

      await this.pool.execute(
        `INSERT INTO session_enrollments
          (target_type, target_id, member_id, member_phone, member_name, status, attendance_status, registered_at)
         VALUES ('class', ?, ?, ?, ?, 'غیرفعال', 'ثبت‌نام‌شده', 'ثبت‌نام جدید')
         ON DUPLICATE KEY UPDATE status = 'غیرفعال', member_name = VALUES(member_name), registered_at = 'ثبت‌نام مجدد'`,
        [classId, input.member_id || null, input.member_phone, resolvedName]
      );

      const [classRows] = await this.pool.execute<RowDataPacket[]>(
        'SELECT * FROM member_classes WHERE id = ? LIMIT 1',
        [classId]
      );
      const mapped = await this.mapClassRowsWithEnrollments(classRows);
      return {
        target_type: 'class',
        classItem: { ...mapped[0], status: 'غیرفعال' },
      };
    }

    // target_type === 'session'
    const [existingSessions] = input.target_id
      ? await this.pool.execute<RowDataPacket[]>(
          'SELECT * FROM member_sessions WHERE id = ? LIMIT 1',
          [Number(input.target_id)]
        )
      : await this.pool.execute<RowDataPacket[]>(
          'SELECT * FROM member_sessions WHERE title = ? OR (book_title = ? AND book_title != "") LIMIT 1',
          [input.title.trim(), String(input.book_title || '').trim()]
        );

    if (existingSessions.length === 0) {
      throw new Error('نشست یا دوره هم‌خوانی مورد نظر در سیستم یافت نشد.');
    }

    if (String(existingSessions[0].status) === 'غیرفعال') {
      throw new Error(
        'این دوره هم‌خوانی در حال حاضر غیرفعال است و امکان ثبت‌نام جدید در آن وجود ندارد.'
      );
    }

    const sessionId = Number(existingSessions[0].id);

    await this.pool.execute(
      `INSERT INTO session_enrollments
        (target_type, target_id, member_id, member_phone, member_name, status, attendance_status, registered_at)
       VALUES ('session', ?, ?, ?, ?, 'غیرفعال', 'ثبت‌نام‌شده', 'ثبت‌نام جدید')
       ON DUPLICATE KEY UPDATE status = 'غیرفعال', member_name = VALUES(member_name), registered_at = 'ثبت‌نام مجدد'`,
      [sessionId, input.member_id || null, input.member_phone, resolvedName]
    );

    const [sessionRows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM member_sessions WHERE id = ? LIMIT 1',
      [sessionId]
    );
    const mapped = await this.mapSessionRowsWithEnrollments(sessionRows);
    return {
      target_type: 'session',
      session: { ...mapped[0], status: 'غیرفعال' },
    };
  }

  // ==================== ADMIN PANEL QUERIES & MUTATIONS ====================

  public async getAdminPanelData(adminMember: PublicClubMember): Promise<{
    admin: PublicClubMember;
    sessions: MemberSessionRow[];
    classes: MemberClassRow[];
    users: PublicClubMember[];
    tickets: MemberTicketRow[];
    announcements: ClubAnnouncementRow[];
    blogPosts: BlogPostRow[];
    comments: UserCommentRow[];
    gallery: GalleryImageRow[];
    heroSettings: HeroSettingsRow;
    aboutClub: AboutClubRow;
    aboutManager: AboutManagerRow;
    contactInfo: ContactInfoRow;
    libraryBooks: LibraryBookRow[];
  }> {
    const [
      rawSessions,
      rawClasses,
      rawUsers,
      rawTickets,
      rawAnnouncements,
      rawBlogPosts,
      rawComments,
      rawGallery,
      heroSettings,
      aboutClub,
      aboutManager,
      contactInfo,
      libraryBooks,
    ] = await Promise.all([
      this.pool.execute<RowDataPacket[]>(
        'SELECT * FROM member_sessions ORDER BY sort_order ASC, id DESC'
      ),
      this.pool.execute<RowDataPacket[]>(
        'SELECT * FROM member_classes ORDER BY sort_order ASC, id DESC'
      ),
      this.pool.execute<RowDataPacket[]>(
        "SELECT * FROM club_members WHERE role != 'admin' ORDER BY id DESC"
      ),
      this.pool.execute<RowDataPacket[]>(
        'SELECT * FROM member_tickets ORDER BY id DESC'
      ),
      this.pool.execute<RowDataPacket[]>(
        'SELECT * FROM club_announcements ORDER BY sort_order ASC, id DESC'
      ),
      this.pool.execute<RowDataPacket[]>(
        'SELECT * FROM blog_posts ORDER BY sort_order ASC, id DESC'
      ),
      this.pool.execute<RowDataPacket[]>(
        'SELECT * FROM user_comments ORDER BY sort_order ASC, id DESC'
      ),
      this.pool.execute<RowDataPacket[]>(
        'SELECT * FROM gallery_images ORDER BY id DESC'
      ),
      this.getHeroSettings(),
      this.getAboutClub(),
      this.getAboutManager(),
      this.getContactInfo(),
      this.getLibraryBooks(),
    ]);

    const sessions = await this.mapSessionRowsWithEnrollments(rawSessions[0]);
    const classes = await this.mapClassRowsWithEnrollments(rawClasses[0]);
    const users = rawUsers[0].map((u) => stripPassword(u as ClubMemberRow));

    const tickets: MemberTicketRow[] = rawTickets[0].map((t) => ({
      id: Number(t.id),
      member_phone: String(t.member_phone),
      ticket_code: String(t.ticket_code),
      subject: String(t.subject),
      department: String(t.department),
      priority: (t.priority as MemberTicketRow['priority']) || 'عادی',
      status: (t.status as MemberTicketRow['status']) || 'در انتظار بررسی',
      message: String(t.message),
      attachment_name: String(t.attachment_name || ''),
      admin_reply: String(t.admin_reply || ''),
      admin_replies: safeJsonParse<{ text: string; created_at: string }[]>(
        t.admin_replies_json,
        t.admin_reply ? [{ text: String(t.admin_reply), created_at: String(t.created_at) }] : []
      ),
      created_at: String(t.created_at),
    }));

    return {
      admin: { ...adminMember, role: 'admin' },
      sessions,
      classes,
      users,
      tickets,
      announcements: rawAnnouncements[0] as ClubAnnouncementRow[],
      blogPosts: rawBlogPosts[0] as BlogPostRow[],
      comments: rawComments[0] as UserCommentRow[],
      gallery: rawGallery[0] as GalleryImageRow[],
      heroSettings,
      aboutClub,
      aboutManager,
      contactInfo,
      libraryBooks,
    };
  }

  public async updateAdminEnrollmentStatus(input: {
    target_type: 'session' | 'class';
    target_id: number;
    member_phone: string;
    status: 'فعال' | 'غیرفعال' | 'لغو شده';
  }): Promise<{ session?: MemberSessionRow; classItem?: MemberClassRow }> {
    await this.pool.execute(
      `UPDATE session_enrollments
       SET status = ?
       WHERE target_type = ? AND target_id = ? AND member_phone = ?`,
      [input.status, input.target_type, Number(input.target_id), input.member_phone]
    );

    if (input.target_type === 'session') {
      if (input.status === 'فعال') {
        await this.pool.execute(
          "UPDATE member_sessions SET status = 'فعال' WHERE id = ?",
          [Number(input.target_id)]
        );
      }
      const [rows] = await this.pool.execute<RowDataPacket[]>(
        'SELECT * FROM member_sessions WHERE id = ? LIMIT 1',
        [Number(input.target_id)]
      );
      if (rows.length === 0) {
        throw new Error('نشست مورد نظر یافت نشد.');
      }
      const mapped = await this.mapSessionRowsWithEnrollments(rows);
      return { session: mapped[0] };
    }

    if (input.status === 'فعال') {
      await this.pool.execute(
        "UPDATE member_classes SET status = 'فعال' WHERE id = ?",
        [Number(input.target_id)]
      );
    }
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM member_classes WHERE id = ? LIMIT 1',
      [Number(input.target_id)]
    );
    if (rows.length === 0) {
      throw new Error('کلاس یا دوره مورد نظر یافت نشد.');
    }
    const mapped = await this.mapClassRowsWithEnrollments(rows);
    return { classItem: mapped[0] };
  }

  public async saveAdminGalleryImage(input: {
    title: string;
    url: string;
    category?: string;
  }): Promise<GalleryImageRow> {
    const title = String(input.title || 'تصویر گالری').trim();
    const url = String(input.url || '/assets/book-current.png').trim();
    const category = String(input.category || 'عمومی').trim();
    const createdAt = '۱۴۰۵';

    const [result] = await this.pool.execute<ResultSetHeader>(
      'INSERT INTO gallery_images (title, url, category, created_at) VALUES (?, ?, ?, ?)',
      [title, url, category, createdAt]
    );

    return {
      id: result.insertId,
      title,
      url,
      category,
      created_at: createdAt,
    };
  }

  public async deleteAdminGalleryImage(id: number): Promise<void> {
    await this.pool.execute('DELETE FROM gallery_images WHERE id = ?', [id]);
  }

  public async saveAdminSession(
    input: Partial<MemberSessionRow> & { id?: number }
  ): Promise<MemberSessionRow> {
    if (input.id) {
      const [rows] = await this.pool.execute<RowDataPacket[]>(
        'SELECT * FROM member_sessions WHERE id = ? LIMIT 1',
        [Number(input.id)]
      );
      if (rows.length === 0) {
        throw new Error('جلسه مورد نظر یافت نشد.');
      }
      const current = rows[0];
      const nextTitle = input.title ?? current.title;
      const nextBookTitle = input.book_title ?? current.book_title;
      const nextBookAuthor = input.book_author ?? current.book_author;
      const nextTranslator =
        input.translator !== undefined
          ? input.translator
          : input.mentor_name !== undefined
          ? input.mentor_name
          : current.translator || current.mentor_name || '';
      const nextCategory = input.category ?? current.category ?? '';
      const nextPublicationYear =
        input.publication_year !== undefined
          ? Number(input.publication_year)
          : Number(current.publication_year || 0);
      const nextPagesCount =
        input.pages_count !== undefined
          ? Number(input.pages_count)
          : Number(current.pages_count || 0);
      const nextPublisher = input.publisher ?? current.publisher;
      const nextMentor =
        input.mentor_name !== undefined
          ? input.mentor_name
          : nextTranslator || current.mentor_name || '';
      const nextDate = input.session_date ?? current.session_date;
      const nextTime = input.session_time ?? current.session_time;
      const nextCover = input.cover_url || current.cover_url || '/assets/book-current.png';
      const nextShortDesc = input.short_description ?? current.short_description ?? '';
      const nextFullDesc = input.full_description ?? current.full_description ?? '';
      const nextStatus = input.status || current.status || 'فعال';
      const nextRoom = input.meeting_link_or_room ?? current.meeting_link_or_room;
      const nextSubs = Array.isArray(input.sub_sessions)
        ? JSON.stringify(input.sub_sessions)
        : String(current.sub_sessions_json || '[]');

      await this.pool.execute(
        `UPDATE member_sessions
         SET title = ?, book_title = ?, book_author = ?, translator = ?, category = ?,
             publication_year = ?, pages_count = ?, publisher = ?,
             mentor_name = ?, session_date = ?, session_time = ?, cover_url = ?,
             short_description = ?, full_description = ?,
             status = ?, meeting_link_or_room = ?, sub_sessions_json = ?
         WHERE id = ?`,
        [
          nextTitle,
          nextBookTitle,
          nextBookAuthor,
          nextTranslator,
          nextCategory,
          nextPublicationYear,
          nextPagesCount,
          nextPublisher,
          nextMentor,
          nextDate,
          nextTime,
          nextCover,
          nextShortDesc,
          nextFullDesc,
          nextStatus,
          nextRoom,
          nextSubs,
          Number(input.id),
        ]
      );

      await this.syncSessionBookToLibrary({
        book_title: String(nextBookTitle),
        author: String(nextBookAuthor || ''),
        translator: String(nextTranslator || ''),
        category: String(nextCategory || ''),
        publication_year: nextPublicationYear,
        pages_count: nextPagesCount,
        cover_url: String(nextCover),
        session_schedule: [nextDate, nextTime].filter(Boolean).join(' · '),
        short_description: String(nextShortDesc || ''),
      });

      const [updatedRows] = await this.pool.execute<RowDataPacket[]>(
        'SELECT * FROM member_sessions WHERE id = ? LIMIT 1',
        [Number(input.id)]
      );
      const mapped = await this.mapSessionRowsWithEnrollments(updatedRows);
      return mapped[0];
    }

    const title = String(input.title || '').trim();
    const bookTitle = String(input.book_title || title).trim();
    const bookAuthor = String(input.book_author || '').trim();
    const translator = String(input.translator ?? input.mentor_name ?? '').trim();
    const category = String(input.category || '').trim();
    const publicationYear = Number(input.publication_year || 0);
    const pagesCount = Number(input.pages_count || 0);
    const publisher = String(input.publisher || '').trim();
    const mentorName = String(input.mentor_name ?? translator).trim();
    const sessionDate = String(input.session_date || '').trim();
    const sessionTime = String(input.session_time || '').trim();
    const coverUrl = String(input.cover_url || '/assets/book-current.png').trim();
    const shortDescription = String(input.short_description || '').trim();
    const fullDescription = String(input.full_description || '').trim();
    const room = String(input.meeting_link_or_room || '').trim();
    const status = String(input.status || 'فعال').trim();
    const memberNote = String(input.member_note || '').trim();
    const subSessionsJson = JSON.stringify(
      Array.isArray(input.sub_sessions) ? input.sub_sessions : []
    );

    const [result] = await this.pool.execute<ResultSetHeader>(
      `INSERT INTO member_sessions
        (member_phone, title, book_title, book_author, translator, category, publication_year, pages_count, publisher, mentor_name, session_date, session_time, cover_url, short_description, full_description, location_type, meeting_link_or_room, status, member_note, sub_sessions_json, sort_order)
       VALUES ('all', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'حضوری و آنلاین', ?, ?, ?, ?, 0)`,
      [
        title,
        bookTitle,
        bookAuthor,
        translator,
        category,
        publicationYear,
        pagesCount,
        publisher,
        mentorName,
        sessionDate,
        sessionTime,
        coverUrl,
        shortDescription,
        fullDescription,
        room,
        status,
        memberNote,
        subSessionsJson,
      ]
    );

    await this.syncSessionBookToLibrary({
      book_title: bookTitle,
      author: bookAuthor,
      translator,
      category,
      publication_year: publicationYear,
      pages_count: pagesCount,
      cover_url: coverUrl,
      session_schedule: [sessionDate, sessionTime].filter(Boolean).join(' · '),
      short_description: shortDescription,
    });

    const [createdRows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM member_sessions WHERE id = ? LIMIT 1',
      [result.insertId]
    );
    const mapped = await this.mapSessionRowsWithEnrollments(createdRows);
    return mapped[0];
  }

  private async syncSessionBookToLibrary(input: {
    book_title: string;
    author: string;
    translator: string;
    category: string;
    publication_year: number;
    pages_count: number;
    cover_url: string;
    session_schedule: string;
    short_description: string;
  }): Promise<void> {
    if (!input.book_title) return;
    const [existing] = await this.pool.execute<RowDataPacket[]>(
      'SELECT id FROM library_books WHERE title = ? LIMIT 1',
      [input.book_title]
    );
    if (existing.length > 0) {
      await this.pool.execute(
        `UPDATE library_books
         SET author = ?, translator = ?, category = ?, publication_year = ?, pages_count = ?, cover_url = ?, session_schedule = ?, short_description = ?
         WHERE id = ?`,
        [
          input.author || '',
          input.translator || '',
          input.category || '',
          input.publication_year || 0,
          input.pages_count || 0,
          input.cover_url || '/assets/book-current.png',
          input.session_schedule,
          input.short_description || '',
          existing[0].id,
        ]
      );
      return;
    }

    const [countRows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) AS cnt FROM library_books WHERE is_current = 1'
    );
    const isCurrent = Number(countRows[0]?.cnt || 0) === 0 ? 1 : 0;

    await this.pool.execute(
      `INSERT INTO library_books
        (is_current, title, original_title, author, translator, category, publication_year, pages_count, reading_progress_percent, session_schedule, cover_url, short_description, sort_order)
       VALUES (?, ?, '', ?, ?, ?, ?, ?, 0, ?, ?, ?, 1)`,
      [
        isCurrent,
        input.book_title,
        input.author || '',
        input.translator || '',
        input.category || '',
        input.publication_year || 0,
        input.pages_count || 0,
        input.session_schedule,
        input.cover_url || '/assets/book-current.png',
        input.short_description || '',
      ]
    );
  }

  public async deleteAdminSession(id: number): Promise<void> {
    await this.pool.execute(
      "DELETE FROM session_enrollments WHERE target_type = 'session' AND target_id = ?",
      [id]
    );
    await this.pool.execute('DELETE FROM member_sessions WHERE id = ?', [id]);
  }

  public async saveAdminClass(
    input: Partial<MemberClassRow> & { id?: number }
  ): Promise<MemberClassRow> {
    if (input.id) {
      const [rows] = await this.pool.execute<RowDataPacket[]>(
        'SELECT * FROM member_classes WHERE id = ? LIMIT 1',
        [Number(input.id)]
      );
      if (rows.length === 0) {
        throw new Error('کلاس مورد نظر یافت نشد.');
      }
      const current = rows[0];
      const nextTitle = input.title ?? current.title;
      const nextBookTitle = input.book_title ?? current.book_title;
      const nextInstructor = input.instructor_name ?? current.instructor_name;
      const nextSchedule = input.schedule_summary ?? current.schedule_summary;
      const nextLevel = input.level_label ?? current.level_label;
      const nextCover = input.cover_url || current.cover_url || '/assets/blog-1.png';
      const nextDesc = input.description ?? current.description;
      const nextStatus = input.status || current.status || 'فعال';
      const nextSubs = Array.isArray(input.sub_sessions)
        ? JSON.stringify(input.sub_sessions)
        : String(current.sub_sessions_json || '[]');

      await this.pool.execute(
        `UPDATE member_classes
         SET title = ?, book_title = ?, instructor_name = ?, schedule_summary = ?,
             level_label = ?, cover_url = ?, description = ?, status = ?, sub_sessions_json = ?
         WHERE id = ?`,
        [
          nextTitle,
          nextBookTitle,
          nextInstructor,
          nextSchedule,
          nextLevel,
          nextCover,
          nextDesc,
          nextStatus,
          nextSubs,
          Number(input.id),
        ]
      );

      const [updatedRows] = await this.pool.execute<RowDataPacket[]>(
        'SELECT * FROM member_classes WHERE id = ? LIMIT 1',
        [Number(input.id)]
      );
      const mapped = await this.mapClassRowsWithEnrollments(updatedRows);
      return mapped[0];
    }

    const title = String(input.title || 'کلاس آموزشی جدید').trim();
    const bookTitle = String(input.book_title || 'سرفصل تخصصی ادبیات').trim();
    const instructorName = String(input.instructor_name || 'دکتر سهراب رستگار').trim();
    const scheduleSummary = String(input.schedule_summary || '').trim();
    const levelLabel = String(input.level_label || 'پیشرفته').trim();
    const coverUrl = String(input.cover_url || '/assets/blog-1.png').trim();
    const status = String(input.status || 'فعال').trim();
    const description = String(input.description || '').trim();
    const subSessionsJson = JSON.stringify(
      Array.isArray(input.sub_sessions) ? input.sub_sessions : []
    );

    const [result] = await this.pool.execute<ResultSetHeader>(
      `INSERT INTO member_classes
        (member_phone, title, book_title, instructor_name, schedule_summary, level_label, cover_url, status, description, sub_sessions_json, sort_order)
       VALUES ('all', ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        title,
        bookTitle,
        instructorName,
        scheduleSummary,
        levelLabel,
        coverUrl,
        status,
        description,
        subSessionsJson,
      ]
    );

    const [createdRows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM member_classes WHERE id = ? LIMIT 1',
      [result.insertId]
    );
    const mapped = await this.mapClassRowsWithEnrollments(createdRows);
    return mapped[0];
  }

  public async deleteAdminClass(id: number): Promise<void> {
    await this.pool.execute(
      "DELETE FROM session_enrollments WHERE target_type = 'class' AND target_id = ?",
      [id]
    );
    await this.pool.execute('DELETE FROM member_classes WHERE id = ?', [id]);
  }

  public async saveAdminUser(
    input: Partial<ClubMemberRow> & { id?: number; password?: string }
  ): Promise<PublicClubMember> {
    if (input.id) {
      const [rows] = await this.pool.execute<RowDataPacket[]>(
        'SELECT * FROM club_members WHERE id = ? LIMIT 1',
        [Number(input.id)]
      );
      if (rows.length === 0) {
        throw new Error('کاربر مورد نظر یافت نشد.');
      }
      const existing = rows[0] as ClubMemberRow;

      const nextFirstName = input.first_name ?? existing.first_name;
      const nextLastName = input.last_name ?? existing.last_name;
      const nextPhone = input.phone ?? existing.phone;
      const nextEdu = input.education ?? existing.education;
      const nextEmail = input.email ?? existing.email;
      const nextBio = input.bio ?? existing.bio;
      const nextCode = input.membership_code ?? existing.membership_code;
      const nextStatus = input.status ?? existing.status;

      let nextPasswordHash = existing.password_hash;
      if (input.password && String(input.password).trim().length >= 4) {
        nextPasswordHash = await bcrypt.hash(String(input.password).trim(), 12);
      }

      await this.pool.execute(
        `UPDATE club_members
         SET first_name = ?, last_name = ?, phone = ?, education = ?,
             email = ?, bio = ?, membership_code = ?, status = ?, password_hash = ?
         WHERE id = ?`,
        [
          nextFirstName,
          nextLastName,
          nextPhone,
          nextEdu,
          nextEmail,
          nextBio,
          nextCode,
          nextStatus,
          nextPasswordHash,
          Number(input.id),
        ]
      );

      if (nextStatus === 'غیرفعال') {
        await this.pool.execute('DELETE FROM auth_tokens WHERE member_id = ?', [
          Number(input.id),
        ]);
      }

      const [updated] = await this.pool.execute<RowDataPacket[]>(
        'SELECT * FROM club_members WHERE id = ? LIMIT 1',
        [Number(input.id)]
      );
      return stripPassword(updated[0] as ClubMemberRow);
    }

    if (!input.phone || !input.password || String(input.password).trim().length < 4) {
      throw new Error('شماره تلفن و رمز عبور معتبر (حداقل ۴ کاراکتر) الزامی است.');
    }

    const passwordHash = await bcrypt.hash(String(input.password).trim(), 12);
    const persianPhone = toPersianDigitsServer(normalizeIdentifierDigits(input.phone));

    const [result] = await this.pool.execute<ResultSetHeader>(
      `INSERT INTO club_members
        (first_name, last_name, phone, role, status, education, email, avatar_url, bio, membership_code, joined_date, password_hash)
       VALUES (?, ?, ?, 'member', ?, ?, ?, '', ?, ?, '۱۴۰۵', ?)`,
      [
        String(input.first_name || 'کاربر').trim(),
        String(input.last_name || 'جدید').trim(),
        persianPhone,
        input.status || 'فعال',
        String(input.education || 'کارشناسی').trim(),
        String(input.email || '').trim(),
        String(input.bio || 'عضو باشگاه کتابخوانی بوک‌میت').trim(),
        String(input.membership_code || 'BM-۱۴۰۵-۱۰۰').trim(),
        passwordHash,
      ]
    );

    const [created] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM club_members WHERE id = ? LIMIT 1',
      [result.insertId]
    );
    return stripPassword(created[0] as ClubMemberRow);
  }

  public async deleteAdminUser(id: number): Promise<void> {
    await this.pool.execute(
      "DELETE FROM club_members WHERE id = ? AND role != 'admin'",
      [id]
    );
  }

  public async replyAdminTicket(input: {
    id: number;
    admin_reply: string;
    status: 'پاسخ داده‌شده' | 'در انتظار بررسی' | 'بسته‌شده';
  }): Promise<MemberTicketRow> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM member_tickets WHERE id = ? LIMIT 1',
      [Number(input.id)]
    );
    if (rows.length === 0) {
      throw new Error('تیکت مورد نظر یافت نشد.');
    }

    const ticket = rows[0];
    const trimmedReply = String(input.admin_reply || '').trim();
    const replies = safeJsonParse<{ text: string; created_at: string }[]>(
      ticket.admin_replies_json,
      ticket.admin_reply
        ? [{ text: String(ticket.admin_reply), created_at: String(ticket.created_at) }]
        : []
    );

    let nextReplyText = String(ticket.admin_reply || '');
    if (trimmedReply) {
      replies.push({
        text: trimmedReply,
        created_at: 'هم‌اکنون',
      });
      nextReplyText = trimmedReply;
    }

    await this.pool.execute(
      `UPDATE member_tickets
       SET admin_reply = ?, admin_replies_json = ?, status = ?
       WHERE id = ?`,
      [nextReplyText, JSON.stringify(replies), input.status, Number(input.id)]
    );

    return {
      id: Number(ticket.id),
      member_phone: String(ticket.member_phone),
      ticket_code: String(ticket.ticket_code),
      subject: String(ticket.subject),
      department: String(ticket.department),
      priority: (ticket.priority as MemberTicketRow['priority']) || 'عادی',
      status: input.status,
      message: String(ticket.message),
      attachment_name: String(ticket.attachment_name || ''),
      admin_reply: nextReplyText,
      admin_replies: replies,
      created_at: String(ticket.created_at),
    };
  }

  public async deleteAdminTicket(id: number): Promise<void> {
    await this.pool.execute('DELETE FROM member_tickets WHERE id = ?', [id]);
  }

  public async saveAdminAnnouncement(
    input: Partial<ClubAnnouncementRow> & { id?: number }
  ): Promise<ClubAnnouncementRow> {
    if (input.id) {
      const [rows] = await this.pool.execute<RowDataPacket[]>(
        'SELECT * FROM club_announcements WHERE id = ? LIMIT 1',
        [Number(input.id)]
      );
      if (rows.length === 0) {
        throw new Error('اطلاعیه مورد نظر یافت نشد.');
      }
      const existing = rows[0];
      const nextTitle = input.title ?? existing.title;
      const nextCategory = input.category ?? existing.category;
      const nextDate = input.published_date ?? existing.published_date;
      const nextSummary = input.summary ?? existing.summary;
      const nextContent = input.content ?? existing.content;
      const nextImportant =
        input.is_important !== undefined
          ? Number(input.is_important)
          : Number(existing.is_important || 0);
      const nextTargetPhone =
        input.target_user_phone !== undefined
          ? input.target_user_phone
          : existing.target_user_phone;
      const nextTargetName =
        input.target_user_name !== undefined
          ? input.target_user_name
          : existing.target_user_name;

      await this.pool.execute(
        `UPDATE club_announcements
         SET title = ?, category = ?, published_date = ?, summary = ?, content = ?,
             is_important = ?, target_user_phone = ?, target_user_name = ?
         WHERE id = ?`,
        [
          nextTitle,
          nextCategory,
          nextDate,
          nextSummary,
          nextContent,
          nextImportant,
          nextTargetPhone || null,
          nextTargetName || null,
          Number(input.id),
        ]
      );

      const [updated] = await this.pool.execute<RowDataPacket[]>(
        'SELECT * FROM club_announcements WHERE id = ? LIMIT 1',
        [Number(input.id)]
      );
      return updated[0] as ClubAnnouncementRow;
    }

    const title = String(input.title || 'اطلاعیه جدید باشگاه').trim();
    const category = String(input.category || 'جلسات کتابخوانی').trim();
    const publishedDate = String(input.published_date || 'امروز').trim();
    const content = String(input.content || '').trim();
    const summary = String(input.summary || content).trim();
    const isImportant = Number(input.is_important || 0);
    const targetPhone = input.target_user_phone ? String(input.target_user_phone) : null;
    const targetName = input.target_user_name ? String(input.target_user_name) : null;

    const [result] = await this.pool.execute<ResultSetHeader>(
      `INSERT INTO club_announcements
        (title, category, published_date, summary, content, is_important, is_read, target_user_phone, target_user_name, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, 1)`,
      [title, category, publishedDate, summary, content, isImportant, targetPhone, targetName]
    );

    const [created] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM club_announcements WHERE id = ? LIMIT 1',
      [result.insertId]
    );
    return created[0] as ClubAnnouncementRow;
  }

  public async deleteAdminAnnouncement(id: number): Promise<void> {
    await this.pool.execute('DELETE FROM club_announcements WHERE id = ?', [id]);
  }

  public async updateAdminProfile(input: {
    adminId: number;
    first_name: string;
    last_name: string;
    email: string;
    education: string;
    bio: string;
    avatar_url?: string;
    new_password?: string;
  }): Promise<PublicClubMember> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      "SELECT * FROM club_members WHERE id = ? AND role = 'admin' LIMIT 1",
      [input.adminId]
    );
    if (rows.length === 0) {
      throw new Error('حساب مدیر یافت نشد.');
    }

    const admin = rows[0] as ClubMemberRow;
    const nextAvatar =
      input.avatar_url !== undefined ? input.avatar_url : admin.avatar_url;
    let nextPasswordHash = admin.password_hash;

    if (input.new_password && input.new_password.trim().length >= 4) {
      nextPasswordHash = await bcrypt.hash(input.new_password.trim(), 12);
    }

    await this.pool.execute(
      `UPDATE club_members
       SET first_name = ?, last_name = ?, email = ?, education = ?,
           bio = ?, avatar_url = ?, password_hash = ?
       WHERE id = ?`,
      [
        input.first_name.trim(),
        input.last_name.trim(),
        input.email.trim(),
        input.education.trim(),
        input.bio.trim(),
        nextAvatar || '/assets/manager-portrait.png',
        nextPasswordHash,
        input.adminId,
      ]
    );

    const [updated] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM club_members WHERE id = ? LIMIT 1',
      [input.adminId]
    );
    return stripPassword(updated[0] as ClubMemberRow);
  }

  public async saveAdminBlogPost(
    input: Partial<BlogPostRow> & { id?: number }
  ): Promise<BlogPostRow> {
    const autoSlug = (rawTitle: string, fallbackId: number) => {
      const cleaned = String(rawTitle || '')
        .trim()
        .replace(/[؟?!.,،؛:«»"']/g, '')
        .replace(/\s+/g, '-');
      return cleaned || `blog-post-${fallbackId}`;
    };

    if (input.id) {
      const [rows] = await this.pool.execute<RowDataPacket[]>(
        'SELECT * FROM blog_posts WHERE id = ? LIMIT 1',
        [Number(input.id)]
      );
      if (rows.length === 0) {
        throw new Error('مقاله مورد نظر یافت نشد.');
      }
      const existing = rows[0] as BlogPostRow;
      const nextTitle = input.title ?? existing.title;
      const nextSlug =
        input.slug && String(input.slug).trim()
          ? String(input.slug).trim()
          : existing.slug || autoSlug(nextTitle, existing.id);
      const nextCategory = input.category ?? existing.category;
      const nextAuthor = input.author ?? existing.author;
      const nextDate = input.published_date ?? existing.published_date;
      const nextReadingTime = input.reading_time ?? existing.reading_time;
      const nextTags = input.tags ?? existing.tags ?? '';
      const nextStatus = input.status ?? existing.status ?? 'منتشر شده';
      const nextCover = input.cover_url || existing.cover_url || '/assets/blog-1.png';
      const nextExcerpt = input.excerpt ?? existing.excerpt;
      const nextContent = input.full_content ?? existing.full_content;

      await this.pool.execute(
        `UPDATE blog_posts
         SET title = ?, slug = ?, category = ?, author = ?, published_date = ?,
             reading_time = ?, tags = ?, status = ?, cover_url = ?, excerpt = ?, full_content = ?
         WHERE id = ?`,
        [
          nextTitle,
          nextSlug,
          nextCategory,
          nextAuthor,
          nextDate,
          nextReadingTime,
          nextTags,
          nextStatus,
          nextCover,
          nextExcerpt,
          nextContent,
          Number(input.id),
        ]
      );

      const [updated] = await this.pool.execute<RowDataPacket[]>(
        'SELECT * FROM blog_posts WHERE id = ? LIMIT 1',
        [Number(input.id)]
      );
      return updated[0] as BlogPostRow;
    }

    const finalTitle = String(input.title || 'مقاله جدید باشگاه').trim();
    const finalSlug =
      input.slug && String(input.slug).trim()
        ? String(input.slug).trim()
        : autoSlug(finalTitle, Date.now());
    const category = String(input.category || 'یادداشت ادبی').trim();
    const author = String(input.author || 'سهراب رستگار').trim();
    const publishedDate = String(input.published_date || 'امروز').trim();
    const readingTime = String(input.reading_time || '۶ دقیقه مطالعه').trim();
    const tags = String(input.tags || '').trim();
    const status = String(input.status || 'منتشر شده').trim();
    const coverUrl = String(input.cover_url || '/assets/blog-1.png').trim();
    const excerpt = String(input.excerpt || '').trim();
    const fullContent = String(input.full_content || '').trim();

    const [result] = await this.pool.execute<ResultSetHeader>(
      `INSERT INTO blog_posts
        (title, slug, category, author, published_date, reading_time, cover_url, excerpt, full_content, tags, status, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        finalTitle,
        finalSlug,
        category,
        author,
        publishedDate,
        readingTime,
        coverUrl,
        excerpt,
        fullContent,
        tags,
        status,
      ]
    );

    const [created] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM blog_posts WHERE id = ? LIMIT 1',
      [result.insertId]
    );
    return created[0] as BlogPostRow;
  }

  public async deleteAdminBlogPost(id: number): Promise<void> {
    await this.pool.execute('DELETE FROM blog_posts WHERE id = ?', [id]);
  }

  public async saveUserComment(input: {
    id?: number;
    author_name?: string;
    author_phone?: string;
    target_title?: string;
    target_type?: string;
    rating?: number;
    comment_text?: string;
    admin_reply?: string;
    status?: 'تایید شده' | 'در انتظار تایید' | 'رد شده';
  }): Promise<UserCommentRow> {
    if (input.id) {
      const [rows] = await this.pool.execute<RowDataPacket[]>(
        'SELECT * FROM user_comments WHERE id = ? LIMIT 1',
        [Number(input.id)]
      );
      if (rows.length === 0) {
        throw new Error('نظر مورد نظر یافت نشد.');
      }
      const existing = rows[0] as UserCommentRow;
      const nextReply =
        input.admin_reply !== undefined ? input.admin_reply : existing.admin_reply;
      const nextStatus = input.status !== undefined ? input.status : existing.status;
      const nextText =
        input.comment_text !== undefined ? input.comment_text : existing.comment_text;

      await this.pool.execute(
        'UPDATE user_comments SET admin_reply = ?, status = ?, comment_text = ? WHERE id = ?',
        [nextReply, nextStatus, nextText, Number(input.id)]
      );

      const [updated] = await this.pool.execute<RowDataPacket[]>(
        'SELECT * FROM user_comments WHERE id = ? LIMIT 1',
        [Number(input.id)]
      );
      return updated[0] as UserCommentRow;
    }

    const [result] = await this.pool.execute<ResultSetHeader>(
      `INSERT INTO user_comments
        (author_name, author_phone, target_title, target_type, rating, comment_text, admin_reply, status, created_date, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'امروز', 0)`,
      [
        String(input.author_name || 'کاربر باشگاه').trim(),
        String(input.author_phone || '').trim(),
        String(input.target_title || 'عمومی').trim(),
        String(input.target_type || 'مقاله وبلاگ').trim(),
        Number(input.rating || 5),
        String(input.comment_text || '').trim(),
        String(input.admin_reply || '').trim(),
        input.status || 'در انتظار تایید',
      ]
    );

    const [created] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM user_comments WHERE id = ? LIMIT 1',
      [result.insertId]
    );
    return created[0] as UserCommentRow;
  }

  public async deleteUserComment(id: number): Promise<void> {
    await this.pool.execute('DELETE FROM user_comments WHERE id = ?', [id]);
  }

  public async updateHomeSettings(input: {
    heroSettings?: Partial<HeroSettingsRow>;
    aboutClub?: Partial<AboutClubRow>;
    aboutManager?: Partial<AboutManagerRow>;
    contactInfo?: Partial<ContactInfoRow>;
  }): Promise<{
    heroSettings: HeroSettingsRow;
    aboutClub: AboutClubRow;
    aboutManager: AboutManagerRow;
    contactInfo: ContactInfoRow;
  }> {
    if (input.heroSettings) {
      const current = await this.getHeroSettings();
      const merged = { ...current, ...input.heroSettings };
      const [rows] = await this.pool.execute<RowDataPacket[]>(
        'SELECT id FROM hero_settings ORDER BY id ASC LIMIT 1'
      );
      if (rows.length > 0) {
        await this.pool.execute(
          `UPDATE hero_settings
           SET headline = ?, subtitle_line_1 = ?, subtitle_line_2 = ?, nav_cta_text = ?,
               nav_cta_target = ?, hero_image_url = ?, audio_progress_percent = ?
           WHERE id = ?`,
          [
            merged.headline,
            merged.subtitle_line_1,
            merged.subtitle_line_2,
            merged.nav_cta_text,
            merged.nav_cta_target,
            merged.hero_image_url,
            Number(merged.audio_progress_percent || 100),
            rows[0].id,
          ]
        );
      } else {
        await this.pool.execute(
          `INSERT INTO hero_settings
            (headline, subtitle_line_1, subtitle_line_2, nav_cta_text, nav_cta_target, hero_image_url, audio_progress_percent)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            merged.headline,
            merged.subtitle_line_1,
            merged.subtitle_line_2,
            merged.nav_cta_text,
            merged.nav_cta_target,
            merged.hero_image_url,
            Number(merged.audio_progress_percent || 100),
          ]
        );
      }
    }

    if (input.aboutClub) {
      const current = await this.getAboutClub();
      const merged = { ...current, ...input.aboutClub };
      const [rows] = await this.pool.execute<RowDataPacket[]>(
        'SELECT id FROM about_club ORDER BY id ASC LIMIT 1'
      );
      if (rows.length > 0) {
        await this.pool.execute(
          `UPDATE about_club
           SET section_kicker = ?, title = ?, paragraph_1 = ?, paragraph_2 = ?,
               image_url = ?, image_caption = ?, stat_1_value = ?, stat_1_label = ?,
               stat_2_value = ?, stat_2_label = ?, stat_3_value = ?, stat_3_label = ?
           WHERE id = ?`,
          [
            merged.section_kicker,
            merged.title,
            merged.paragraph_1,
            merged.paragraph_2,
            merged.image_url,
            merged.image_caption,
            merged.stat_1_value,
            merged.stat_1_label,
            merged.stat_2_value,
            merged.stat_2_label,
            merged.stat_3_value,
            merged.stat_3_label,
            rows[0].id,
          ]
        );
      } else {
        await this.pool.execute(
          `INSERT INTO about_club
            (section_kicker, title, paragraph_1, paragraph_2, image_url, image_caption, stat_1_value, stat_1_label, stat_2_value, stat_2_label, stat_3_value, stat_3_label)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            merged.section_kicker,
            merged.title,
            merged.paragraph_1,
            merged.paragraph_2,
            merged.image_url,
            merged.image_caption,
            merged.stat_1_value,
            merged.stat_1_label,
            merged.stat_2_value,
            merged.stat_2_label,
            merged.stat_3_value,
            merged.stat_3_label,
          ]
        );
      }
    }

    if (input.aboutManager) {
      const current = await this.getAboutManager();
      const merged = { ...current, ...input.aboutManager };
      const [rows] = await this.pool.execute<RowDataPacket[]>(
        'SELECT id FROM about_manager ORDER BY id ASC LIMIT 1'
      );
      if (rows.length > 0) {
        await this.pool.execute(
          `UPDATE about_manager
           SET section_kicker = ?, full_name = ?, role_title = ?, bio_paragraph_1 = ?,
               bio_paragraph_2 = ?, quote_text = ?, image_url = ?, credentials_line = ?
           WHERE id = ?`,
          [
            merged.section_kicker,
            merged.full_name,
            merged.role_title,
            merged.bio_paragraph_1,
            merged.bio_paragraph_2,
            merged.quote_text,
            merged.image_url,
            merged.credentials_line,
            rows[0].id,
          ]
        );
      } else {
        await this.pool.execute(
          `INSERT INTO about_manager
            (section_kicker, full_name, role_title, bio_paragraph_1, bio_paragraph_2, quote_text, image_url, credentials_line)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            merged.section_kicker,
            merged.full_name,
            merged.role_title,
            merged.bio_paragraph_1,
            merged.bio_paragraph_2,
            merged.quote_text,
            merged.image_url,
            merged.credentials_line,
          ]
        );
      }
    }

    if (input.contactInfo) {
      const current = await this.getContactInfo();
      const merged = { ...current, ...input.contactInfo };
      const [rows] = await this.pool.execute<RowDataPacket[]>(
        'SELECT id FROM contact_info ORDER BY id ASC LIMIT 1'
      );
      if (rows.length > 0) {
        await this.pool.execute(
          `UPDATE contact_info
           SET section_kicker = ?, title = ?, description = ?, address = ?,
               meeting_hours = ?, email = ?, phone = ?, telegram_handle = ?
           WHERE id = ?`,
          [
            merged.section_kicker,
            merged.title,
            merged.description,
            merged.address,
            merged.meeting_hours,
            merged.email,
            merged.phone,
            merged.telegram_handle,
            rows[0].id,
          ]
        );
      } else {
        await this.pool.execute(
          `INSERT INTO contact_info
            (section_kicker, title, description, address, meeting_hours, email, phone, telegram_handle)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            merged.section_kicker,
            merged.title,
            merged.description,
            merged.address,
            merged.meeting_hours,
            merged.email,
            merged.phone,
            merged.telegram_handle,
          ]
        );
      }
    }

    const [heroSettings, aboutClub, aboutManager, contactInfo] = await Promise.all([
      this.getHeroSettings(),
      this.getAboutClub(),
      this.getAboutManager(),
      this.getContactInfo(),
    ]);

    return {
      heroSettings,
      aboutClub,
      aboutManager,
      contactInfo,
    };
  }
}

export const mysqlDb = new MySQLDatabaseManager();
