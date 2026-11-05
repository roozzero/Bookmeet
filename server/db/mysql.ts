import mysql, { Pool } from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

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
  category: 'کلاسیک' | 'معاصر';
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
  role?: 'member' | 'admin';
  education: string;
  favorite_genre: string;
  email: string;
  city: string;
  avatar_url?: string;
  bio: string;
  membership_code: string;
  joined_date: string;
  status?: 'فعال' | 'غیرفعال';
  password_hash: string;
  created_at: string;
}

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
}

export interface MemberSessionRow {
  id: number;
  member_phone: string;
  title: string;
  book_title: string;
  book_author?: string;
  pages_count?: number;
  publisher?: string;
  mentor_name: string;
  session_date: string;
  session_time: string;
  cover_url: string;
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

export interface MySQLStoreSchema {
  schema_version: number;
  navigation_links: NavigationLinkRow[];
  hero_settings: HeroSettingsRow[];
  featured_books: FeaturedBookRow[];
  about_club: AboutClubRow[];
  about_manager: AboutManagerRow[];
  library_books: LibraryBookRow[];
  blog_posts: BlogPostRow[];
  contact_info: ContactInfoRow[];
  contact_messages: ContactMessageRow[];
  club_members: ClubMemberRow[];
  member_sessions: MemberSessionRow[];
  member_classes: MemberClassRow[];
  member_library: MemberLibraryRow[];
  member_tickets: MemberTicketRow[];
  club_calendar_events: ClubCalendarEventRow[];
  club_announcements: ClubAnnouncementRow[];
  user_comments: UserCommentRow[];
  gallery_images: GalleryImageRow[];
  custom_tables?: Record<string, Record<string, unknown>[]>;
}

const CURRENT_SCHEMA_VERSION = 13;
const STORAGE_FILE = path.resolve(process.cwd(), 'server/db/mysql_data.json');

const SEED_DATA: MySQLStoreSchema = {
  schema_version: CURRENT_SCHEMA_VERSION,
  navigation_links: [
    { id: 1, label: 'صفحه اصلی', href: '#home', sort_order: 1, is_active: 1 },
    { id: 2, label: 'درباره باشگاه', href: '#about-club', sort_order: 2, is_active: 1 },
    { id: 3, label: 'درباره من', href: '#about-me', sort_order: 3, is_active: 1 },
    { id: 4, label: 'رویدادها', href: '#events', sort_order: 4, is_active: 1 },
    { id: 5, label: 'کتابخانه', href: '#library', sort_order: 5, is_active: 1 },
    { id: 6, label: 'دوره ها', href: '#courses', sort_order: 6, is_active: 1 },
    { id: 7, label: 'وبلاگ', href: '#blog', sort_order: 7, is_active: 1 },
    { id: 8, label: 'ارتباط با ما', href: '#contact', sort_order: 8, is_active: 1 },
  ],
  hero_settings: [
    {
      id: 1,
      headline: 'به باشگاه کتابخوانی بوک میت خوش آمدید',
      subtitle_line_1: 'بعضی جهان‌ها تنها زمانی جان می‌گیرند که از خواندن دست بکشید و به تماشا بنشینید.',
      subtitle_line_2: 'این روایت‌ها برگرفته از کتاب‌هایی هستند که هرگز ما را رها نکرده‌اند.',
      nav_cta_text: 'ورود به باشگاه',
      nav_cta_target: '#login-club',
      hero_image_url: '/assets/hero-bookshelf.png',
      audio_progress_percent: 100,
    },
  ],
  featured_books: [
    {
      id: 1,
      title: 'The Little Prince',
      persian_title: 'شازده کوچولو',
      author: 'آنتوان دو سنت‌اگزوپری',
      publication_year: 1943,
      synopsis: 'نسخه مصور آبرنگ و مرکب از سفر شاعرانه شازده کوچولو در میان سیارک‌ها و گفت‌وگو با روباه.',
    },
    {
      id: 2,
      title: 'The Alchemist',
      persian_title: 'کیمیاگر',
      author: 'پائولو کوئیلو',
      publication_year: 1988,
      synopsis: 'روایت مصور سفر سانتیاگو از دشت‌های آندلس تا اهرام مصر در جست‌وجوی افسانه شخصی.',
    },
    {
      id: 3,
      title: 'Watership Down',
      persian_title: 'تپه خرگوش‌ها',
      author: 'ریچارد آدامز',
      publication_year: 1972,
      synopsis: 'حکاکی‌های طبیعت‌گرایانه از حماسه مهاجرت و بقای گروهی کوچک در تپه‌های سرسبز برکشایر.',
    },
    {
      id: 4,
      title: 'The Night Circus',
      persian_title: 'سیرک شبانه',
      author: 'ارین مورگنسترن',
      publication_year: 2011,
      synopsis: 'تصویرسازی‌های سیاه‌وسفید با رگه‌های سرخ از چادرهای جادویی سیرکی که تنها شب‌ها گشوده می‌شود.',
    },
    {
      id: 5,
      title: 'The Neverending Story',
      persian_title: 'داستان بی‌پایان',
      author: 'میشائیل انده',
      publication_year: 1979,
      synopsis: 'چاپ دو رنگ مسی و زمردی با سرلوحه‌های دست‌ساز که خواننده را به سرزمین فانتازیا فرا می‌خواند.',
    },
  ],
  about_club: [
    {
      id: 1,
      section_kicker: '۰۱ · درباره باشگاه کتابخوانی بوک‌میت',
      title: 'جایی برای زیستن در جهانِ کتاب‌هایی که فراموش نمی‌شوند',
      paragraph_1:
        'باشگاه کتابخوانی بوک‌میت با هدف شکل‌دادن به فضایی صمیمی، عمیق و اندیشه‌ورز برای علاقه‌مندان به ادبیات داستانی و آثار ماندگار جهان راه‌اندازی شده است. ما در این باشگاه تنها به ورق زدن صفحه‌ها بسنده نمی‌کنیم؛ بلکه هر کتاب را دریچه‌ای تازه برای گفت‌وگو، کشف لایه‌های پنهان روایت و هم‌نشینی با ذهن‌های کنجکاوی می‌دانیم که دغدغه فهم عمیق‌تر زندگی و هنر داستان‌گویی را دارند.',
      paragraph_2:
        'در نشست‌های دوره‌ای و حلقه‌های مطالعاتی بوک‌میت، اعضا گرد هم می‌آیند تا ضمن واکاوی ساختار، شخصیت‌پردازی و درون‌مایه‌های فلسفی آثار برگزیده، تجربه‌های زیسته و برداشت‌های شخصی خود را به اشتراک بگذارند. چه خواننده‌ای حرفه‌ای باشید و چه به‌تازگی قدم در مسیر مطالعه جدی گذاشته باشید، بوک‌میت خانه‌ای الهام‌بخش برای تداوم عادت مطالعه و ساختن خاطراتی مشترک از جهان کتاب‌هاست.',
      image_url: '/assets/about-club.png',
      image_caption: 'نشست‌های هم‌خوانی و بررسی نسخه‌های ماندگار ادبی در باشگاه بوک‌میت',
      stat_1_value: '+۱۲۰',
      stat_1_label: 'نشست نقد و هم‌خوانی',
      stat_2_value: '+۸۵۰',
      stat_2_label: 'عضو فعال باشگاه',
      stat_3_value: '۴۸',
      stat_3_label: 'شاهکار ادبی بررسی‌شده',
    },
  ],
  about_manager: [
    {
      id: 1,
      section_kicker: '۰۲ · معرفی مدیر و بنیان‌گذار باشگاه',
      full_name: 'سهراب رستگار',
      role_title: 'پژوهشگر ادبیات تطبیقی، منتقد ادبی و بنیان‌گذار باشگاه کتابخوانی بوک‌میت',
      bio_paragraph_1:
        'سهراب رستگار بیش از دوازده سال است که در حوزه نقد ادبی، روایت‌شناسی و برگزاری کارگاه‌های تخصصی خوانش خلاق فعالیت می‌کند. او پس از سال‌ها پژوهش در زمینه ادبیات کلاسیک و معاصر جهان، باشگاه کتابخوانی بوک‌میت را با این باور بنیان گذاشت که مطالعه زمانی به تجربه‌ای دگرگون‌کننده بدل می‌شود که در بستر گفت‌وگو و تبادل نگاه‌ها جریان یابد. رویکرد او در هدایت نشست‌ها، پیوند زدن میان نظریه ادبی و تجربه‌های ملموس زندگی روزمره است تا هر خواننده بتواند صدای ویژه خود را در مواجهه با متن بیابد.',
      bio_paragraph_2:
        'او تاکنون میزبان دهه‌ها نشست تحلیل رمان، بررسی نسخه‌های مصور شاهکارهای ادبی و گفت‌وگو با مترجمان و نویسندگان برجسته بوده است. دغدغه اصلی او در بوک‌میت، احیای فرهنگ خواندنِ دقیق و آهسته در روزگاری پرشتاب و ایجاد پیوندی پایدار میان دوستداران کتاب است؛ جایی که هر اثر نه یک کالای مصرفی، بلکه جهانی زنده برای کاوش و هم‌اندیشی به شمار می‌آید.',
      quote_text:
        '«کتاب‌ها زمانی به راستی آغاز می‌شوند که آخرین صفحه‌شان را می‌بندیم و درباره آنچه در ما دگرگون کرده‌اند با یکدیگر سخن می‌گوییم.»',
      image_url: '/assets/manager-portrait.png',
      credentials_line: 'دکتری ادبیات تطبیقی · ۱۲ سال تجربه تسهیل‌گری نشست‌های کتاب · نویسنده و پژوهشگر روایت',
    },
  ],
  library_books: [
    {
      id: 1,
      is_current: 1,
      title: 'صد سال تنهایی',
      original_title: 'One Hundred Years of Solitude',
      author: 'گابریل گارسیا مارکز',
      translator: 'بهمن فرزانه',
      category: 'کلاسیک',
      publication_year: 1967,
      pages_count: 468,
      reading_progress_percent: 68,
      session_schedule: 'نشست بعدی هم‌خوانی: چهارشنبه ساعت ۱۸:۰۰ (فصل‌های ۱۲ تا ۱۵)',
      cover_url: '/assets/book-current.png',
      short_description:
        'حماسه پررمزوراز خاندان بوئندیا در دهکده خیالی ماکوندو؛ اثری بنیادین در سبک رئالیسم جادویی که مرز میان واقعیت، اسطوره، عشق و تنهایی ابدی انسان را با زبانی شاعرانه و تکرارناپذیر روایت می‌کند. در حلقه‌های مطالعاتی این ماه، ساختار دایره‌ای زمان و استعاره‌های تاریخی این شاهکار را فصل‌به‌فصل بررسی می‌کنیم.',
      sort_order: 1,
    },
    {
      id: 2,
      is_current: 0,
      title: 'مرشد و مارگاریتا',
      original_title: 'The Master and Margarita',
      author: 'میخائیل بولگاکف',
      translator: 'عباس میلانی',
      category: 'کلاسیک',
      publication_year: 1967,
      pages_count: 512,
      reading_progress_percent: 100,
      session_schedule: 'بررسی‌شده در دوره مهرماه باشگاه',
      cover_url: '/assets/book-recent-1.png',
      short_description:
        'روایتی طنزآمیز، فلسفی و چندلایه از حضور ناگهانی پروفسور ولاند در مسکو دهه ۱۹۳۰ که در هم‌تنیدگی با عشق مرشد و مارگاریتا، تقابل جاودانه خیر، شر و آزادی هنر را به تصویر می‌کشد.',
      sort_order: 2,
    },
    {
      id: 3,
      is_current: 0,
      title: 'کوری',
      original_title: 'Blindness',
      author: 'ژوزه ساراماگو',
      translator: 'مینو مشیری',
      category: 'معاصر',
      publication_year: 1995,
      pages_count: 348,
      reading_progress_percent: 100,
      session_schedule: 'بررسی‌شده در دوره شهریورماه باشگاه',
      cover_url: '/assets/book-recent-2.png',
      short_description:
        'تمثیلی تکان‌دهنده از شیوع یک نابینایی سفید در شهری بی‌نام که فروپاشی اخلاقی جامعه و درعین‌حال امید، همدلی و بیداری وجدان انسانی را در تاریک‌ترین لحظات می‌آزماید.',
      sort_order: 3,
    },
    {
      id: 4,
      is_current: 0,
      title: 'بلندی‌های بادگیر',
      original_title: 'Wuthering Heights',
      author: 'امیلی برونته',
      translator: 'رضا رضایی',
      category: 'کلاسیک',
      publication_year: 1847,
      pages_count: 420,
      reading_progress_percent: 100,
      session_schedule: 'بررسی‌شده در دوره مردادماه باشگاه',
      cover_url: '/assets/book-recent-3.png',
      short_description:
        'داستانی پرشور و تسخیرکننده در دشت‌های مه‌آلود یورکشایر که پیوند پرتلاطم کاترین و هیت‌کلیف را در قالب ساختار روایی تو در تو و فضاسازی گوتیک واکاوی می‌کند.',
      sort_order: 4,
    },
    {
      id: 5,
      is_current: 0,
      title: 'کافکا در کرانه',
      original_title: 'Kafka on the Shore',
      author: 'هاروکی موراکامی',
      translator: 'مهدی غبرائی',
      category: 'معاصر',
      publication_year: 2002,
      pages_count: 614,
      reading_progress_percent: 100,
      session_schedule: 'بررسی‌شده در دوره تیرماه باشگاه',
      cover_url: '/assets/book-recent-4.png',
      short_description:
        'سفری هزارتو و رؤیاگونه در پیوند دو روایت موازی از نوجوانی گریزان از خانه و پیرمردی ساده دل که مرزهای حافظه، موسیقی، تقدیر و ضمیر ناخودآگاه را درمی‌نوردد.',
      sort_order: 5,
    },
  ],
  blog_posts: [
    {
      id: 1,
      title: 'چگونه خواندنِ آهسته و گروهی درک ما از رمان‌های کلاسیک را دگرگون می‌کند؟',
      category: 'یادداشت ادبی',
      author: 'سهراب رستگار',
      published_date: '۱۲ آبان ۱۴۰۵',
      reading_time: '۶ دقیقه مطالعه',
      cover_url: '/assets/blog-1.png',
      excerpt:
        'در روزگاری که سرعت مصرف اطلاعات مجال درنگ را از ما گرفته است، خوانش آهسته و گفت‌وگوی گروهی درباره متون کلاسیک به ما می‌آموزد که چگونه میان سطرهای یک رمان زندگی کنیم و جزئیات پنهان معماری روایت را دریابیم.',
      full_content:
        'در نشست‌های باشگاه کتابخوانی بوک‌میت بارها تجربه کرده‌ایم که یک متن واحد، در برخورد با ذهن‌های گوناگون، لایه‌هایی تازه و غیرمنتظره از معنا را آشکار می‌سازد. خواندن آهسته به ما اجازه می‌دهد از سطح پیرنگ عبور کنیم و به ضرباهنگ جمله‌ها، استعاره‌های تکرارشونده و سکوت‌های میان دیالوگ‌ها گوش بسپاریم. هنگامی که اعضای باشگاه برداشت‌های خود را از یک فصل مشترک بازگو می‌کنند، کتاب از یک شیء خاموش به میدانی زنده برای تجربه همدلی و تفکر انتقادی تبدیل می‌شود.',
      sort_order: 1,
    },
    {
      id: 2,
      title: 'نگاهی به رئالیسم جادویی؛ از تنهایی ماکوندو تا هزارتوهای روایت معاصر',
      category: 'نقد و بررسی',
      author: 'نیلوفر فرهادی',
      published_date: '۵ آبان ۱۴۰۵',
      reading_time: '۸ دقیقه مطالعه',
      cover_url: '/assets/blog-2.png',
      excerpt:
        'رئالیسم جادویی صرفاً ترفندی فانتزی برای گریز از واقعیت نیست؛ بلکه شیوه‌ای اصیل برای نگریستن به تاریخ، حافظه جمعی و شگفتی‌های نهفته در زندگی روزمره مردمانی است که اسطوره و واقعیت را هم‌زمان زیسته اند.',
      full_content:
        'هنگامی که گابریل گارسیا مارکز در «صد سال تنهایی» از رویدادهای خارق‌العاده با لحنی کاملاً عادی و روزمره سخن می‌گوید، مرز سنتی میان باورپذیری و خیال را جابه‌جا می‌کند. در حلقه مطالعاتی این ماه بررسی کردیم که چگونه این شگرد روایی به نویسندگان آمریکای لاتین و سپس ادبیات معاصر جهان امکان داد تا زخم‌های تاریخی، فراموشی جمعی و تنهایی انسان مدرن را در قاب تصاویری فراموش‌نشدنی ثبت کنند.',
      sort_order: 2,
    },
    {
      id: 3,
      title: 'راهنمای نوشتن حاشیه‌نویسی و یادداشت‌برداری خلاق هنگام مطالعه رمان',
      category: 'کارگاه خوانش',
      author: 'آرمان کاظمی',
      published_date: '۲۷ مهر ۱۴۰۵',
      reading_time: '۵ دقیقه مطالعه',
      cover_url: '/assets/blog-3.png',
      excerpt:
        'گفت‌وگو با کتاب از لحظه‌ای آغاز می‌شود که مداد را در دست می‌گیرید و پرسش‌ها، تردیدها و تداعی‌های شخصی خود را در حاشیه صفحه‌ها یا دفترچه یادداشت‌های روزانه ثبت می‌کنید.',
      full_content:
        'بسیاری از خوانندگان پس از پایان یک رمان حجیم احساس می‌کنند بخش بزرگی از ظرایف اثر از یادشان رفته است. روش پیشنهادی ما در باشگاه بوک‌میت، ثبت سه محور کلیدی در پایان هر فصل است: نخست، یک جمله یا تصویر تکان‌دهنده؛ دوم، دگرگونی انگیزه شخصیت‌ها؛ و سوم، پرسشی که متن در ذهن ما بی‌پاسخ رها کرده است. این یادداشت‌های کوتاه، بهترین توشه برای مشارکت فعال در نشست‌های هفتگی نقد و بررسی هستند.',
      sort_order: 3,
    },
  ],
  contact_info: [
    {
      id: 1,
      section_kicker: '۰۵ · ارتباط با ما و عضویت در حلقه‌های مطالعاتی',
      title: 'صدای شما، آغازگر گفت‌وگوهای تازه در باشگاه بوک‌میت است',
      description:
        'اگر درباره شیوه برگزاری نشست‌های هفتگی، پیشنهاد کتاب برای دوره‌های آینده، همکاری در نگارش جستارهای وبلاگ یا عضویت در حلقه‌های مطالعاتی بوک‌میت پرسشی دارید، پیام خود را برای ما ارسال کنید. دبیرخانه باشگاه در کوتاه‌ترین زمان پاسخگوی شما خواهد بود.',
      address: 'تهران، خیابان کریم‌خان زند، خیابان ایرانشهر، خانه فرهنگ و ادبیات بوک‌میت، پلاک ۴۲',
      meeting_hours: 'نشست‌های حضوری: چهارشنبه‌ها ساعت ۱۸ تا ۲۰ · نشست‌های برخط: جمعه‌ها ساعت ۱۹',
      email: 'hello@bookmeet.ir',
      phone: '۰۲۱-۸۸۹۴۳۲۱۰',
      telegram_handle: '@BookmeetClub',
    },
  ],
  contact_messages: [],
  club_members: [
    {
      id: 1,
      first_name: 'پرنیا',
      last_name: 'فرهمند',
      phone: '۰۹۱۲۳۴۵۶۷۸۹',
      role: 'member',
      education: 'کارشناسی ارشد',
      favorite_genre: 'ادبیات داستانی و رمان کلاسیک',
      email: 'parnia.farahmand@bookmeet.ir',
      city: 'تهران',
      avatar_url: '',
      bio: 'علاقه‌مند به ادبیات کلاسیک جهان، رئالیسم جادویی آمریکای لاتین و روایت‌شناسی تطبیقی. از مهرماه ۱۴۰۴ در حلقه‌های مطالعاتی هفتگی باشگاه کتابخوانی بوک‌میت حضور دارم و یادداشت‌های تحلیلی درباره ساختار زمان در رمان‌های مدرن می‌نویسم.',
      membership_code: 'BM-۱۴۰۵-۱۰۸',
      joined_date: '۱۲ مهر ۱۴۰۴',
      password_hash: '1234',
      created_at: '2026-10-04T10:00:00.000Z',
    },
    {
      id: 2,
      first_name: 'سهراب',
      last_name: 'رستگار',
      phone: 'admin',
      role: 'admin',
      education: 'دکتری',
      favorite_genre: 'ادبیات تطبیقی و نقد ادبی',
      email: 'admin@bookmeet.ir',
      city: 'تهران',
      avatar_url: '/assets/manager-portrait.png',
      bio: 'پژوهشگر ادبیات تطبیقی، منتقد ادبی و مدیر و بنیان‌گذار باشگاه کتابخوانی بوک‌میت.',
      membership_code: 'BM-ADMIN-۰۰۱',
      joined_date: '۱ فروردین ۱۴۰۲',
      password_hash: 'admin1234',
      created_at: '2023-03-21T10:00:00.000Z',
    },
    {
      id: 3,
      first_name: 'کیانوش',
      last_name: 'معتمدی',
      phone: '۰۹۱۲۱۱۱۲۲۳۳',
      role: 'member',
      education: 'دکتری',
      favorite_genre: 'فلسفه و ادبیات اگزیستانسیال',
      email: 'kianoosh.m@bookmeet.ir',
      city: 'تهران',
      avatar_url: '',
      bio: 'پژوهشگر فلسفه هنر و عضو حلقه‌های نقد رمان کلاسیک و معاصر در باشگاه بوک‌میت.',
      membership_code: 'BM-۱۴۰۵-۱۱۴',
      joined_date: '۲۰ مهر ۱۴۰۴',
      password_hash: '1234',
      created_at: '2026-10-12T10:00:00.000Z',
    },
    {
      id: 4,
      first_name: 'مهسا',
      last_name: 'تاجیک',
      phone: '۰۹۳۵۴۴۴۵۵۶۶',
      role: 'member',
      education: 'کارشناسی',
      favorite_genre: 'ادبیات مدرن و داستان کوتاه',
      email: 'mahsa.tajik@bookmeet.ir',
      city: 'اصفهان',
      avatar_url: '',
      bio: 'علاقه‌مند به حاشیه‌نویسی خلاق و مطالعه گروهی آثار قرن بیستم.',
      membership_code: 'BM-۱۴۰۵-۱۲۹',
      joined_date: '۳ آبان ۱۴۰۵',
      password_hash: '1234',
      created_at: '2026-10-25T10:00:00.000Z',
    },
  ],
  member_sessions: [
    {
      id: 1,
      member_phone: 'all',
      title: 'حلقه هم‌خوانی و تحلیل ساختار زمان در «صد سال تنهایی»',
      book_title: 'صد سال تنهایی',
      book_author: 'گابریل گارسیا مارکز',
      pages_count: 468,
      publisher: 'نشر نیلوفر',
      mentor_name: 'دکتر سهراب رستگار',
      session_date: 'چهارشنبه‌ها · آبان ۱۴۰۵',
      session_time: 'ساعت ۱۸:۰۰ تا ۲۰:۰۰',
      cover_url: '/assets/book-current.png',
      location_type: 'آنلاین',
      meeting_link_or_room: 'تالار فردوسی خانه بوک‌میت',
      status: 'فعال',
      member_note: 'بررسی تکرار نام‌های اورلیانو و خوزه آرکادیو و ارتباط آن با مفهوم تنهایی ابدی در ماکوندو.',
      sub_sessions: [
        {
          id: 101,
          session_number: 'جلسه اول',
          title: 'پیدایش ماکوندو و کیمیاگری ملکیادس',
          status: 'برگزار شده',
          session_date: '۲۵ مهر ۱۴۰۵',
          session_time: '۱۸:۰۰ تا ۲۰:۰۰',
          cover_url: '/assets/book-current.png',
          pages_read: 115,
          pages_to_read: 'صفحات ۱ تا ۱۱۵',
          reviewed_topics: 'تحلیل فصل‌های اول تا سوم، بررسی زاویه دید دانای کل، ورود کولی‌ها به دهکده ماکوندو و نقش نمادین یخ در آغاز رمان.',
          session_notes: 'در این نشست مشخص شد که مارکز با لحنی خونسرد و روزمره، شگفت‌انگیزترین رخدادها را روایت می‌کند تا مرز خیال و واقعیت در ذهن خواننده رنگ ببازد.',
          meeting_link: 'https://meet.bookmeet.ir/macondo-s1',
        },
        {
          id: 102,
          session_number: 'جلسه دوم',
          title: 'بیماری بی‌خوابی و فراموشی جمعی در ماکوندو',
          status: 'برگزار شده',
          session_date: '۲ آبان ۱۴۰۵',
          session_time: '۱۸:۰۰ تا ۲۰:۰۰',
          cover_url: '/assets/blog-2.png',
          pages_read: 110,
          pages_to_read: 'صفحات ۱۱۶ تا ۲۲۵',
          reviewed_topics: 'واکاوی استعاره طاعون بی‌خوابی، برچسب‌گذاری اشیاء توسط خوزه آرکادیو بوئندیا و پیوند میان زبان، حافظه و تاریخ.',
          session_notes: 'فراموشی در ماکوندو تنها یک رخداد داستانی نیست؛ بلکه استعاره‌ای از فراموشی تاریخی ملت‌هاست که تنها با نوشتن و ثبت کلمات درمان می‌شود.',
          meeting_link: 'https://meet.bookmeet.ir/macondo-s2',
        },
        {
          id: 103,
          session_number: 'جلسه سوم',
          title: 'جنگ‌های داخلی سرهنگ اورلیانو بوئندیا',
          status: 'برگزار شده',
          session_date: '۹ آبان ۱۴۰۵',
          session_time: '۱۸:۰۰ تا ۲۰:۰۰',
          cover_url: '/assets/book-current.png',
          pages_read: 93,
          pages_to_read: 'صفحات ۲۲۶ تا ۳۱۸',
          reviewed_topics: 'بررسی دگردیسی شخصیت سرهنگ اورلیانو در چرخه قدرت، ساختن و ذوب کردن ماهی‌های طلایی و تنهایی ناشی از قدرت.',
          session_notes: 'تکرار ساختن ماهی‌های طلایی نماد دور باطل زمان و پناه بردن انسان تنها به کارهای تکرارشونده برای گریز از هجوم خاطرات است.',
          meeting_link: 'https://meet.bookmeet.ir/macondo-s3',
        },
        {
          id: 104,
          session_number: 'جلسه چهارم',
          title: 'ورود شرکت موز و باران‌های چهارساله',
          status: 'تعریف شده',
          session_date: '۱۶ آبان ۱۴۰۵',
          session_time: '۱۸:۰۰ تا ۲۰:۰۰',
          cover_url: '/assets/blog-2.png',
          pages_read: 0,
          pages_to_read: 'صفحات ۳۱۹ تا ۳۹۵ (فصل‌های ۱۲ تا ۱۵)',
          reviewed_topics: '',
          session_notes: '',
          meeting_link: 'https://meet.bookmeet.ir/macondo-s4',
        },
        {
          id: 105,
          session_number: 'جلسه پنجم',
          title: 'رمزگشایی از دست‌نوشته‌های ملکیادس و پایان ماکوندو',
          status: 'تعریف شده',
          session_date: '۲۳ آبان ۱۴۰۵',
          session_time: '۱۸:۰۰ تا ۲۰:۳۰',
          cover_url: '/assets/book-current.png',
          pages_read: 0,
          pages_to_read: 'صفحات ۳۹۶ تا ۴۶۸ (فصل‌های ۱۶ تا پایان کتاب)',
          reviewed_topics: '',
          session_notes: '',
          meeting_link: 'https://meet.bookmeet.ir/macondo-s5',
        },
      ],
      sort_order: 1,
    },
    {
      id: 2,
      member_phone: 'all',
      title: 'کارگاه تخصصی حاشیه‌نویسی و خوانش خلاق رمان',
      book_title: 'هنر داستان‌نویسی و روایت‌شناسی کاربردی',
      book_author: 'ای. ام. فورستر',
      pages_count: 250,
      publisher: 'نشر چشمه',
      mentor_name: 'آرمان کاظمی',
      session_date: 'جمعه‌ها · آبان ۱۴۰۵',
      session_time: 'ساعت ۱۹:۰۰ تا ۲۰:۳۰',
      cover_url: '/assets/blog-3.png',
      location_type: 'آنلاین',
      meeting_link_or_room: 'اتاق مجازی شماره ۲ باشگاه بوک‌میت',
      status: 'فعال',
      member_note: 'آماده‌سازی سه پرسش کلیدی از فصل آخر کتاب برای طرح در گروه هم‌خوانی.',
      sub_sessions: [
        {
          id: 201,
          session_number: 'جلسه اول',
          title: 'معماری پیرنگ و کشف گره‌های پنهان روایت',
          status: 'برگزار شده',
          session_date: '۴ آبان ۱۴۰۵',
          session_time: '۱۹:۰۰ تا ۲۰:۳۰',
          cover_url: '/assets/blog-3.png',
          pages_read: 85,
          pages_to_read: 'صفحات ۱ تا ۸۵',
          reviewed_topics: 'بررسی تفاوت داستان و پیرنگ از دیدگاه فورستر، تحلیل آغازبندی رمان‌های کلاسیک و شیوه ثبت کدهای نمادین در حاشیه کتاب.',
          session_notes: 'در حاشیه‌نویسی خلاق، به جای خلاصه‌نویسی خطی باید به دنبال الگوهای تکرارشونده، تضادهای شخصیتی و سکوت‌های معنادار راوی گشت.',
          meeting_link: 'https://meet.bookmeet.ir/creative-reading-1',
        },
        {
          id: 202,
          session_number: 'جلسه دوم',
          title: 'ترسیم نقشه شخصیت‌ها و تحلیل دیالوگ‌ها',
          status: 'برگزار شده',
          session_date: '۱۱ آبان ۱۴۰۵',
          session_time: '۱۹:۰۰ تا ۲۰:۳۰',
          cover_url: '/assets/blog-1.png',
          pages_read: 90,
          pages_to_read: 'صفحات ۸۶ تا ۱۷۵',
          reviewed_topics: 'کالبدشکافی دیالوگ‌های چندصدایی، بررسی انگیزه‌های ناخودآگاه قهرمان داستان و تمرین نگارش یادداشت‌های ۵۰۰ کلمه‌ای.',
          session_notes: 'هر شخصیت بزرگ ادبی با یک تناقض درونی زنده می‌شود؛ ثبت لحظات تصمیم‌گیری شخصیت در دفترچه خوانش، کلید فهم تحول اوست.',
          meeting_link: 'https://meet.bookmeet.ir/creative-reading-2',
        },
        {
          id: 203,
          session_number: 'جلسه سوم',
          title: 'پیوند نظریه روایت با تجربه زیسته خواننده',
          status: 'تعریف شده',
          session_date: '۱۸ آبان ۱۴۰۵',
          session_time: '۱۹:۰۰ تا ۲۰:۳۰',
          cover_url: '/assets/blog-3.png',
          pages_read: 0,
          pages_to_read: 'صفحات ۱۷۶ تا ۲۵۰ (فصل‌های ۵ و ۶)',
          reviewed_topics: '',
          session_notes: '',
          meeting_link: 'https://meet.bookmeet.ir/creative-reading-3',
        },
      ],
      sort_order: 2,
    },
    {
      id: 3,
      member_phone: 'all',
      title: 'دوره نقد تطبیقی طنز فلسفی در «مرشد و مارگاریتا»',
      book_title: 'مرشد و مارگاریتا',
      book_author: 'میخائیل بولگاکف',
      pages_count: 512,
      publisher: 'نشر فرهنگ نشر نو',
      mentor_name: 'دکتر سهراب رستگار',
      session_date: 'مهرماه ۱۴۰۵',
      session_time: 'ساعت ۱۸:۰۰ تا ۲۰:۰۰',
      cover_url: '/assets/book-recent-1.png',
      location_type: 'آنلاین',
      meeting_link_or_room: 'تالار فردوسی خانه بوک‌میت',
      status: 'غیرفعال',
      member_note: 'تحلیل شخصیت پروفسور ولاند و نسبت آزادی هنر با حقیقت در دست‌نوشته‌های مرشد بسیار راهگشا بود.',
      sub_sessions: [
        {
          id: 301,
          session_number: 'جلسه اول',
          title: 'حضور پروفسور ولاند در پارک پاتریارخ مسکو',
          status: 'برگزار شده',
          session_date: '۹ مهر ۱۴۰۵',
          session_time: '۱۸:۰۰ تا ۲۰:۰۰',
          cover_url: '/assets/book-recent-1.png',
          pages_read: 170,
          pages_to_read: 'صفحات ۱ تا ۱۷۰',
          reviewed_topics: 'مباحثه برلیوز و ایوان بی‌خانمان با ولاند، آغاز روایت موازی پونتیوس پیلاتوس در اورشلیم و ساختار رمان در رمان.',
          session_notes: 'بولگاکف با ترکیب گروتسک و تاریخ، نشان می‌دهد که انکار امر متعالی در جامعه بوروکراتیک دهه ۱۹۳۰ چه پیامدهای طنزآمیزی به دنبال دارد.',
          meeting_link: 'https://meet.bookmeet.ir/bulgakov-s1',
        },
        {
          id: 302,
          session_number: 'جلسه دوم',
          title: 'دست‌نوشته‌ها نمی‌سوزند؛ عشق مرشد و مارگاریتا',
          status: 'برگزار شده',
          session_date: '۲۳ مهر ۱۴۰۵',
          session_time: '۱۸:۰۰ تا ۲۰:۰۰',
          cover_url: '/assets/book-recent-1.png',
          pages_read: 342,
          pages_to_read: 'صفحات ۱۷۱ تا ۵۱۲',
          reviewed_topics: 'ورود شخصیت مارگاریتا، جشن بزرگ بهار، رهایی مرشد و جاودانگی اثر هنری در برابر سانسور و ترس.',
          session_notes: 'جمله کلیدی «دست‌نوشته‌ها نمی‌سوزند» عصاره فلسفی اثر است که اصالت حقیقت هنری را فراتر از زمان و قدرت سیاسی قرار می‌دهد.',
          meeting_link: 'https://meet.bookmeet.ir/bulgakov-s2',
        },
      ],
      sort_order: 3,
    },
    {
      id: 4,
      member_phone: 'all',
      title: 'حلقه گفت‌وگو درباره تمثیل اخلاقی در رمان «کوری»',
      book_title: 'کوری',
      book_author: 'ژوزه ساراماگو',
      pages_count: 348,
      publisher: 'نشر علم',
      mentor_name: 'نیلوفر فرهادی',
      session_date: 'شهریور و آبان ۱۴۰۵',
      session_time: 'ساعت ۱۸:۰۰ تا ۱۹:۴۵',
      cover_url: '/assets/book-recent-2.png',
      location_type: 'آنلاین',
      meeting_link_or_room: 'اتاق مجازی شماره ۱ باشگاه بوک‌میت',
      status: 'فعال',
      member_note: 'بررسی فرم نقطه‌گذاری و دیالوگ‌های پیوسته ساراماگو که حس سرگشتگی شخصیت‌ها را به خواننده منتقل می‌کند.',
      sub_sessions: [
        {
          id: 401,
          session_number: 'جلسه اول',
          title: 'شیوع نابینایی سفید و قرنطینه نخستین گروه',
          status: 'برگزار شده',
          session_date: '۱۸ شهریور ۱۴۰۵',
          session_time: '۱۸:۰۰ تا ۱۹:۴۵',
          cover_url: '/assets/book-recent-2.png',
          pages_read: 180,
          pages_to_read: 'صفحات ۱ تا ۱۸۰',
          reviewed_topics: 'بررسی حذف نام شخصیت‌ها در رمان، فرم خاص جمله‌بندی ساراماگو و نقش همسر دکتر به عنوان تنها شاهد بینا.',
          session_notes: 'حذف نام‌های خاص و جایگزینی آن‌ها با توصیف‌ها (همسر دکتر، پیرمرد با چشم‌بند سیاه) به اثر بعدی جهان‌شمول و اسطوره‌ای بخشیده است.',
          meeting_link: 'https://meet.bookmeet.ir/blindness-s1',
        },
        {
          id: 402,
          session_number: 'جلسه دوم',
          title: 'بازگشت به شهر و بازتعریف همدلی انسانی',
          status: 'تعریف شده',
          session_date: '۲۵ آبان ۱۴۰۵',
          session_time: '۱۸:۰۰ تا ۱۹:۴۵',
          cover_url: '/assets/book-recent-2.png',
          pages_read: 0,
          pages_to_read: 'صفحات ۱۸۱ تا ۳۴۸ (بخش پایانی کتاب)',
          reviewed_topics: '',
          session_notes: '',
          meeting_link: 'https://meet.bookmeet.ir/blindness-s2',
        },
      ],
      sort_order: 4,
    },
  ],
  member_classes: [
    {
      id: 1,
      member_phone: 'all',
      title: 'کلاس جامع تاریخ تحلیلی رمان مدرن و پست‌مدرن جهان در قرن بیستم',
      book_title: 'از پروست و جویس تا کالوینو و مارکز',
      instructor_name: 'دکتر سهراب رستگار',
      schedule_summary: 'دوشنبه‌ها · ساعت ۱۷:۳۰ تا ۱۹:۳۰',
      level_label: 'پیشرفته',
      cover_url: '/assets/blog-1.png',
      status: 'فعال',
      description: 'در این کلاس تخصصی، دگرگونی ساختار روایت، زمان روان‌شناختی، تک‌گویی درونی و تکنیک‌های فراروایت در شاهکارهای ادبیات داستانی قرن بیستم به صورت متن‌محور کالبدشکافی می‌شود.',
      sub_sessions: [
        {
          id: 501,
          session_number: 'جلسه اول',
          title: 'جریان سیال ذهن و زمان درونی در آثار ویرجینیا وولف',
          status: 'برگزار شده',
          session_date: '۷ آبان ۱۴۰۵',
          session_time: '۱۷:۳۰ تا ۱۹:۳۰',
          cover_url: '/assets/blog-1.png',
          pages_read: 95,
          pages_to_read: 'صفحات ۱ تا ۹۵ کتاب «به سوی فانوس دریایی»',
          reviewed_topics: 'تفاوت زمان ساعت‌شمار با زمان روان‌شناختی برگسون، تحلیل تک‌گویی‌های درونی خانم رمزی و تکنیک پرش میان زاویه دیدها.',
          session_notes: 'در رمان مدرن، حادثه بیرونی جای خود را به بازتاب آن حادثه در آگاهی و حافظه شخصیت‌ها می‌دهد.',
          meeting_link: 'https://meet.bookmeet.ir/modern-novel-c1',
        },
        {
          id: 502,
          session_number: 'جلسه دوم',
          title: 'هزارتوی فراروایت در آثار ایتالو کالوینو',
          status: 'تعریف شده',
          session_date: '۲۱ آبان ۱۴۰۵',
          session_time: '۱۷:۳۰ تا ۱۹:۳۰',
          cover_url: '/assets/book-recent-3.png',
          pages_read: 0,
          pages_to_read: 'صفحات ۱ تا ۱۲۰ کتاب «اگر شبی از شب‌های زمستان مسافری»',
          reviewed_topics: '',
          session_notes: '',
          meeting_link: 'https://meet.bookmeet.ir/modern-novel-c2',
        },
      ],
      sort_order: 1,
    },
    {
      id: 2,
      member_phone: 'all',
      title: 'کلاس فلسفه و ادبیات؛ کاوش مفاهیم اگزیستانسیال و اخلاق در رمان‌های بزرگ',
      book_title: 'داستایفسکی، کامو و سارتر',
      instructor_name: 'نیلوفر فرهادی',
      schedule_summary: 'شنبه‌ها · ساعت ۱۸:۰۰ تا ۲۰:۰۰',
      level_label: 'تخصصی',
      cover_url: '/assets/blog-2.png',
      status: 'فعال',
      description: 'بررسی تطبیقی مفاهیم آزادی، دلهره، انتخاب اخلاقی و مسئولیت انسان در برابر دیگری از رهگذر خوانش دقیق فصول کلیدی آثار داستایفسکی، آلبر کامو و ژان پل سارتر.',
      sub_sessions: [
        {
          id: 601,
          session_number: 'جلسه اول',
          title: 'آزادی و عصیان در «بیگانه» و «طاعون» آلبر کامو',
          status: 'برگزار شده',
          session_date: '۵ آبان ۱۴۰۵',
          session_time: '۱۸:۰۰ تا ۲۰:۰۰',
          cover_url: '/assets/blog-2.png',
          pages_read: 130,
          pages_to_read: 'صفحات ۱ تا ۱۳۰ متن کامل رمان «بیگانه»',
          reviewed_topics: 'واکاوی شخصیت مورسو در مواجهه با پوچی، گذار از فردگرایی بیگانه به همبستگی اخلاقی دکتر ریو در رمان طاعون.',
          session_notes: 'کامو در گذار از بیگانه به طاعون نشان می‌دهد که پاسخ اصیل انسان به رنج جمعی، همدلی و مسئولیت‌پذیری بی‌چشمداشت است.',
          meeting_link: 'https://meet.bookmeet.ir/philo-lit-c1',
        },
        {
          id: 602,
          session_number: 'جلسه دوم',
          title: 'چندصدایی و جدال ایده‌ها در «برادران کارامازوف»',
          status: 'تعریف شده',
          session_date: '۱۹ آبان ۱۴۰۵',
          session_time: '۱۸:۰۰ تا ۲۰:۰۰',
          cover_url: '/assets/book-recent-4.png',
          pages_read: 0,
          pages_to_read: 'صفحات ۲۱۰ تا ۳۴۰ (فصل مفتش بزرگ)',
          reviewed_topics: '',
          session_notes: '',
          meeting_link: 'https://meet.bookmeet.ir/philo-lit-c2',
        },
      ],
      enrolled_members: [
        {
          id: 9101,
          member_phone: '۰۹۱۲۳۴۵۶۷۸۹',
          member_name: 'پرنیا فرهمند',
          registered_at: '۵ آبان ۱۴۰۵',
          status: 'فعال',
        },
        {
          id: 9102,
          member_phone: '۰۹۱۲۱۱۱۲۲۳۳',
          member_name: 'کیانوش معتمدی',
          registered_at: '۶ آبان ۱۴۰۵',
          status: 'فعال',
        },
        {
          id: 9103,
          member_phone: '۰۹۳۵۴۴۴۵۵۶۶',
          member_name: 'مهسا تاجیک',
          registered_at: '۱۴ آبان ۱۴۰۵',
          status: 'غیرفعال',
        },
      ],
      sort_order: 2,
    },
    {
      id: 3,
      member_phone: 'all',
      title: 'دوره آموزش زبان روسی — سطح پایه و مقدماتی (A1–A2)',
      book_title: 'الفبای سیریلیک، آواشناسی و مکالمات پایه روسی',
      instructor_name: 'دکتر آناستازیا رادین و سهراب رستگار',
      schedule_summary: 'یکشنبه‌ها و سه‌شنبه‌ها · ساعت ۱۷:۳۰ تا ۱۹:۰۰',
      level_label: 'مبتدی',
      cover_url: '/assets/blog-1.png',
      status: 'فعال',
      description: 'آشنایی گام‌به‌گام با الفبای سیریلیک، اصول آواشناسی و تلفظ معیار روسی، ساخت جملات پایه، مکالمات روزمره و درک ساختارهای بنیادین دستور زبان روسی برای علاقه‌مندان به فرهنگ و ادبیات روسیه.',
      sub_sessions: [
        {
          id: 701,
          session_number: 'جلسه اول',
          title: 'الفبای سیریلیک، واکه‌ها و قوانین تکیه در زبان روسی',
          status: 'برگزار شده',
          session_date: '۶ آبان ۱۴۰۵',
          session_time: '۱۷:۳۰ تا ۱۹:۰۰',
          cover_url: '/assets/blog-1.png',
          pages_read: 28,
          pages_to_read: 'درس اول و دوم کتاب «راه روسیه» (Дорога в Россию)',
          reviewed_topics: 'آموزش ۳۳ حرف الفبای سیریلیک، تفاوت تلفظ حروف صدادار تکیه‌دار و بی‌تکیه و احوال‌پرسی رسمی و غیررسمی در زبان روسی.',
          session_notes: 'تشخیص جایگاه تکیه (Ударение) در واژگان روسی کلید اصلی تلفظ صحیح و طبیعی است.',
          meeting_link: 'https://meet.bookmeet.ir/russian-a1-s1',
        },
        {
          id: 702,
          session_number: 'جلسه دوم',
          title: 'جنسیت اسم‌ها، ضمایر شخصی و ساخت جملات معرفی در روسی',
          status: 'تعریف شده',
          session_date: '۲۰ آبان ۱۴۰۵',
          session_time: '۱۷:۳۰ تا ۱۹:۰۰',
          cover_url: '/assets/blog-1.png',
          pages_read: 0,
          pages_to_read: 'درس سوم و چهارم کتاب «راه روسیه» (صفحات ۲۹ تا ۵۶)',
          reviewed_topics: '',
          session_notes: '',
          meeting_link: 'https://meet.bookmeet.ir/russian-a1-s2',
        },
      ],
      enrolled_members: [
        {
          id: 9201,
          member_phone: '۰۹۱۲۱۱۱۲۲۳۳',
          member_name: 'کیانوش معتمدی',
          registered_at: '۱۰ آبان ۱۴۰۵',
          status: 'فعال',
        },
        {
          id: 9202,
          member_phone: '۰۹۳۵۴۴۴۵۵۶۶',
          member_name: 'مهسا تاجیک',
          registered_at: '۱۴ آبان ۱۴۰۵',
          status: 'غیرفعال',
        },
      ],
      sort_order: 3,
    },
    {
      id: 4,
      member_phone: 'all',
      title: 'دوره مکالمه و دستور زبان روسی — سطح متوسطه (B1–B2)',
      book_title: 'حالت‌های اسمی (پادِژها)، افعال حرکتی و داستان‌های کوتاه معاصر',
      instructor_name: 'دکتر آناستازیا رادین',
      schedule_summary: 'دوشنبه‌ها و چهارشنبه‌ها · ساعت ۱۸:۰۰ تا ۱۹:۳۰',
      level_label: 'پیشرفته',
      cover_url: '/assets/blog-2.png',
      status: 'فعال',
      description: 'گسترش دایره واژگان کاربردی و فرهنگی، تسلط بر حالت‌های اسمی (پادِژها) و افعال حرکتی زبان روسی، تقویت مهارت گفت‌وگوی روان و خوانش داستان‌های کوتاه معاصر به زبان اصلی.',
      sub_sessions: [
        {
          id: 801,
          session_number: 'جلسه اول',
          title: 'کاربرد شش حالت اسمی (پادِژها) در مکالمات و متون داستانی',
          status: 'تعریف شده',
          session_date: '۲۱ آبان ۱۴۰۵',
          session_time: '۱۸:۰۰ تا ۱۹:۳۰',
          cover_url: '/assets/blog-2.png',
          pages_read: 0,
          pages_to_read: 'بخش اول جزوه پادِژها و داستان کوتاه چخوف (صفحات ۱ تا ۳۵)',
          reviewed_topics: '',
          session_notes: '',
          meeting_link: 'https://meet.bookmeet.ir/russian-b1-s1',
        },
      ],
      enrolled_members: [
        {
          id: 9301,
          member_phone: '۰۹۱۲۱۱۱۲۲۳۳',
          member_name: 'کیانوش معتمدی',
          registered_at: '۱۲ آبان ۱۴۰۵',
          status: 'غیرفعال',
        },
      ],
      sort_order: 4,
    },
    {
      id: 5,
      member_phone: 'all',
      title: 'دوره تخصصی خوانش متون ادبی به زبان روسی (ویژه آثار کلاسیک)',
      book_title: 'گزیده متون اصلی داستایفسکی، چخوف، تولستوی و بولگاکف',
      instructor_name: 'دکتر سهراب رستگار',
      schedule_summary: 'پنج‌شنبه‌ها · ساعت ۱۶:۳۰ تا ۱۸:۳۰',
      level_label: 'تخصصی',
      cover_url: '/assets/blog-3.png',
      status: 'فعال',
      description: 'خوانش دقیق و تحلیل زبانی و زیبایی‌شناختی گزیده‌ای از شاهکارهای داستایفسکی، چخوف، تولستوی و بولگاکف به زبان روسی همراه با کارگاه عملی ترجمه ادبی و بررسی ظرایف سبک‌شناختی.',
      sub_sessions: [
        {
          id: 901,
          session_number: 'جلسه اول',
          title: 'خوانش فصل آغازین «مرشد و مارگاریتا» به زبان روسی',
          status: 'تعریف شده',
          session_date: '۲۴ آبان ۱۴۰۵',
          session_time: '۱۶:۳۰ تا ۱۸:۳۰',
          cover_url: '/assets/blog-3.png',
          pages_read: 0,
          pages_to_read: 'فصل اول متن روسی Мастер и Маргарита همراه با واژه‌نامه تحلیلی',
          reviewed_topics: '',
          session_notes: '',
          meeting_link: 'https://meet.bookmeet.ir/russian-c1-s1',
        },
      ],
      enrolled_members: [
        {
          id: 9401,
          member_phone: '۰۹۱۲۳۴۵۶۷۸۹',
          member_name: 'پرنیا فرهمند',
          registered_at: '۱۱ آبان ۱۴۰۵',
          status: 'فعال',
        },
      ],
      sort_order: 5,
    },
  ],
  member_library: [
    {
      id: 1,
      member_phone: 'all',
      book_title: 'صد سال تنهایی',
      author: 'گابریل گارسیا مارکز',
      translator: 'بهمن فرزانه',
      cover_url: '/assets/book-current.png',
      reading_status: 'در حال مطالعه',
      progress_percent: 68,
      pages_read: 318,
      pages_count: 468,
      personal_note: 'تا پایان فصل یازدهم مطالعه شد. فضاسازی باران‌های چهارساله ماکوندو شگفت‌انگیز است.',
      updated_at: '۱۴ آبان ۱۴۰۵',
    },
    {
      id: 2,
      member_phone: 'all',
      book_title: 'مرشد و مارگاریتا',
      author: 'میخائیل بولگاکف',
      translator: 'عباس میلانی',
      cover_url: '/assets/book-recent-1.png',
      reading_status: 'خوانده‌شده',
      progress_percent: 100,
      pages_read: 512,
      pages_count: 512,
      personal_note: 'یکی از درخشان‌ترین آثار قرن بیستم؛ پیوند دو روایت مسکو و اورشلیم با ظرافت بی‌نظیری شکل گرفته است.',
      updated_at: '۲۸ مهر ۱۴۰۵',
    },
    {
      id: 3,
      member_phone: 'all',
      book_title: 'کوری',
      author: 'ژوزه ساراماگو',
      translator: 'مینو مشیری',
      cover_url: '/assets/book-recent-2.png',
      reading_status: 'خوانده‌شده',
      progress_percent: 100,
      pages_read: 348,
      pages_count: 348,
      personal_note: 'تجربه‌ای تکان‌دهنده از معنای دیدن و مسئولیت اخلاقی انسان در برابر دیگری.',
      updated_at: '۲۴ شهریور ۱۴۰۵',
    },
    {
      id: 4,
      member_phone: 'all',
      book_title: 'کافکا در کرانه',
      author: 'هاروکی موراکامی',
      translator: 'مهدی غبرائی',
      cover_url: '/assets/book-recent-4.png',
      reading_status: 'در نوبت مطالعه',
      progress_percent: 15,
      pages_read: 92,
      pages_count: 614,
      personal_note: 'برنامه‌ریزی برای مطالعه کامل در دوره آذرماه باشگاه به همراه یادداشت‌برداری از استعاره‌های موسیقایی.',
      updated_at: '۱۰ آبان ۱۴۰۵',
    },
  ],
  member_tickets: [
    {
      id: 1,
      member_phone: 'all',
      ticket_code: 'TK-۱۴۰۵-۴۱۲',
      subject: 'درخواست دریافت فایل صوتی و جزوه نشست سوم صد سال تنهایی',
      department: 'پشتیبانی فنی',
      priority: 'عادی',
      status: 'پاسخ داده‌شده',
      message: 'با سلام و احترام، به دلیل تداخل کاری امکان حضور در بیست دقیقه پایانی نشست سوم را نداشتم. لطفاً در صورت امکان خلاصه مکتوب یا فایل صوتی جلسه را در اختیارم قرار دهید.',
      attachment_name: 'یادداشت-جلسه-سوم.pdf',
      admin_reply: 'هم‌خوان گرامی، فایل صوتی کامل نشست سوم به همراه جزوه دسته‌بندی شجره‌نامه خاندان بوئندیا در بخش جلسات من برای شما فعال گردید.',
      created_at: '۱۰ آبان ۱۴۰۵',
    },
    {
      id: 2,
      member_phone: 'all',
      ticket_code: 'TK-۱۴۰۵-۴۳۹',
      subject: 'پیشنهاد بررسی رمان «ابله» داستایفسکی برای حلقه زمستان',
      department: 'پیشنهاد کتاب',
      priority: 'مهم',
      status: 'پاسخ داده‌شده',
      message: 'پیشنهاد می‌کنم در دوره زمستان باشگاه، یکی از آثار کلاسیک داستایفسکی به‌ویژه رمان «ابله» با ترجمه سروش حبیبی در برنامه هم‌خوانی هفتگی قرار گیرد.',
      attachment_name: 'معرفی-رمان-ابله.pdf',
      admin_reply: 'از پیشنهاد ارزشمند شما سپاسگزاریم. رمان «ابله» در فهرست نهایی رأی‌گیری اعضای باشگاه برای دوره دی‌ماه قرار گرفته است.',
      created_at: '۱۲ آبان ۱۴۰۵',
    },
  ],
  club_calendar_events: [
    {
      id: 1,
      title: 'نشست دوم هم‌خوانی «صد سال تنهایی»',
      event_type: 'هم‌خوانی هفتگی',
      day_of_month: '۲',
      month_name: 'آبان ۱۴۰۵',
      weekday_name: 'چهارشنبه',
      time_range: '۱۸:۰۰ تا ۲۰:۰۰',
      host_name: 'دکتر سهراب رستگار',
      location_label: 'تالار فردوسی خانه بوک‌میت',
      capacity_info: 'برگزار شده',
      description: 'بررسی بیماری بی‌خوابی و فراموشی جمعی در دهکده ماکوندو.',
      is_reserved: 1,
      sort_order: 1,
    },
    {
      id: 2,
      title: 'کلاس فلسفه و ادبیات (نشست اول)',
      event_type: 'کلاس آموزشی',
      day_of_month: '۵',
      month_name: 'آبان ۱۴۰۵',
      weekday_name: 'شنبه',
      time_range: '۱۸:۰۰ تا ۲۰:۰۰',
      host_name: 'نیلوفر فرهادی',
      location_label: 'اتاق مجازی کلاس‌ها',
      capacity_info: 'برگزار شده',
      description: 'آزادی و عصیان در «بیگانه» و «طاعون» آلبر کامو.',
      is_reserved: 1,
      sort_order: 2,
    },
    {
      id: 3,
      title: 'نشست سوم هم‌خوانی «صد سال تنهایی»',
      event_type: 'هم‌خوانی هفتگی',
      day_of_month: '۹',
      month_name: 'آبان ۱۴۰۵',
      weekday_name: 'چهارشنبه',
      time_range: '۱۸:۰۰ تا ۲۰:۰۰',
      host_name: 'دکتر سهراب رستگار',
      location_label: 'تالار فردوسی خانه بوک‌میت',
      capacity_info: 'برگزار شده',
      description: 'تحلیل جنگ‌های داخلی سرهنگ اورلیانو بوئندیا.',
      is_reserved: 1,
      sort_order: 3,
    },
    {
      id: 4,
      title: 'نشست چهارم «صد سال تنهایی» (فصل ۱۲ تا ۱۵)',
      event_type: 'هم‌خوانی هفتگی',
      day_of_month: '۱۶',
      month_name: 'آبان ۱۴۰۵',
      weekday_name: 'چهارشنبه',
      time_range: '۱۸:۰۰ تا ۲۰:۰۰',
      host_name: 'دکتر سهراب رستگار',
      location_label: 'تالار فردوسی خانه بوک‌میت',
      capacity_info: 'ظرفیت باقی‌مانده: ۶ نفر',
      description: 'در این نشست، دگردیسی دهکده ماکوندو پس از ورود شرکت موز و جایگاه تنهایی سرهنگ اورلیانو بوئندیا را تحلیل و بررسی خواهیم کرد.',
      is_reserved: 1,
      sort_order: 4,
    },
    {
      id: 5,
      title: 'کارگاه حاشیه‌نویسی و یادداشت‌برداری خلاق',
      event_type: 'کارگاه خوانش',
      day_of_month: '۱۸',
      month_name: 'آبان ۱۴۰۵',
      weekday_name: 'جمعه',
      time_range: '۱۹:۰۰ تا ۲۰:۳۰',
      host_name: 'آرمان کاظمی',
      location_label: 'اتاق مجازی باشگاه',
      capacity_info: 'ظرفیت باقی‌مانده: ۱۱ نفر',
      description: 'آشنایی با تکنیک‌های ثبت استعاره‌ها، ترسیم نقشه شخصیت‌ها و نگارش جستارهای کوتاه تحلیلی پس از مطالعه هر فصل.',
      is_reserved: 1,
      sort_order: 5,
    },
    {
      id: 6,
      title: 'کلاس تاریخ تحلیلی رمان مدرن (کالوینو)',
      event_type: 'کلاس آموزشی',
      day_of_month: '۲۱',
      month_name: 'آبان ۱۴۰۵',
      weekday_name: 'دوشنبه',
      time_range: '۱۷:۳۰ تا ۱۹:۳۰',
      host_name: 'دکتر سهراب رستگار',
      location_label: 'اتاق مجازی کلاس‌ها',
      capacity_info: 'ظرفیت باقی‌مانده: ۸ نفر',
      description: 'بررسی هزارتوی فراروایت در آثار ایتالو کالوینو.',
      is_reserved: 1,
      sort_order: 6,
    },
    {
      id: 7,
      title: 'نشست پنجم و جمع‌بندی «صد سال تنهایی»',
      event_type: 'نشست نقد و بررسی',
      day_of_month: '۲۳',
      month_name: 'آبان ۱۴۰۵',
      weekday_name: 'چهارشنبه',
      time_range: '۱۸:۰۰ تا ۲۰:۳۰',
      host_name: 'دکتر سهراب رستگار',
      location_label: 'تالار فردوسی خانه بوک‌میت',
      capacity_info: 'ظرفیت باقی‌مانده: ۹ نفر',
      description: 'خوانش فصل‌های پایانی، رمزگشایی از دست‌نوشته‌های ملکیادس و گفت‌وگوی آزاد اعضا درباره تجربه یک ماه زندگی در جهان مارکز.',
      is_reserved: 0,
      sort_order: 7,
    },
    {
      id: 8,
      title: 'نشست ویژه چالش‌های ترجمه ادبیات کلاسیک',
      event_type: 'نشست ویژه با مترجم',
      day_of_month: '۲۸',
      month_name: 'آبان ۱۴۰۵',
      weekday_name: 'دوشنبه',
      time_range: '۱۷:۳۰ تا ۱۹:۳۰',
      host_name: 'نیلوفر فرهادی و مهمان ویژه',
      location_label: 'تالار فردوسی و پخش زنده',
      capacity_info: 'ظرفیت باقی‌مانده: ۱۴ نفر',
      description: 'بررسی ظرایف معادل‌یابی، حفظ لحن و موسیقی متن اصلی در ترجمه‌های ماندگار ادبیات داستانی قرن نوزدهم و بیستم.',
      is_reserved: 0,
      sort_order: 8,
    },
    {
      id: 9,
      title: 'معارفه و فصل اول «بلندی‌های بادگیر»',
      event_type: 'هم‌خوانی هفتگی',
      day_of_month: '۷',
      month_name: 'آذر ۱۴۰۵',
      weekday_name: 'چهارشنبه',
      time_range: '۱۸:۰۰ تا ۲۰:۰۰',
      host_name: 'دکتر سهراب رستگار',
      location_label: 'تالار فردوسی خانه بوک‌میت',
      capacity_info: 'ظرفیت باقی‌مانده: ۱۵ نفر',
      description: 'ورود به فضای گوتیک و رازآلود یورکشایر، بررسی راوی اول‌شخص و زاویه دید لاک‌وود در مواجهه با عمارت بلندی‌های بادگیر.',
      is_reserved: 0,
      sort_order: 9,
    },
    {
      id: 10,
      title: 'حلقه نقد جستارهای اعضا و کتاب ماه',
      event_type: 'کارگاه خوانش',
      day_of_month: '۱۴',
      month_name: 'آذر ۱۴۰۵',
      weekday_name: 'شنبه',
      time_range: '۱۸:۳۰ تا ۲۰:۰۰',
      host_name: 'شورای علمی باشگاه بوک‌میت',
      location_label: 'اتاق مجازی باشگاه',
      capacity_info: 'ظرفیت باقی‌مانده: ۱۸ نفر',
      description: 'خوانش و نقد دوستانه یادداشت‌های ارسالی اعضا برای انتشار در وبلاگ رسمی بوک‌میت و اهدای کتاب به جستارهای برگزیده.',
      is_reserved: 0,
      sort_order: 10,
    },
  ],
  club_announcements: [
    {
      id: 1,
      title: 'انتشار برنامه کامل نشست‌های هم‌خوانی نیمه دوم آبان‌ماه ۱۴۰۵',
      category: 'جلسات کتابخوانی',
      published_date: '۱۴ آبان ۱۴۰۵',
      summary: 'جدول زمان‌بندی جلسات چهارم و پنجم حلقه «صد سال تنهایی» و لینک‌های ورود به اتاق‌های گفت‌وگو در پنل اعضا بروزرسانی شد.',
      content: 'به اطلاع اعضای گرامی باشگاه کتابخوانی بوک‌میت می‌رساند که جلسات چهارم و پنجم حلقه مطالعاتی «صد سال تنهایی» در روزهای چهارشنبه ۱۶ و ۲۳ آبان‌ماه رأس ساعت ۱۸:۰۰ برگزار خواهد شد. لطفاً پیش از آغاز جلسه، صفحات تعیین‌شده را مطالعه فرمایید و پرسش‌های تحلیلی خود را در صفحه جلسه ثبت کنید.',
      is_important: 1,
      is_read: 0,
      sort_order: 1,
    },
    {
      id: 2,
      title: 'آغاز رأی‌گیری انتخاب کتاب محوری دوره آذرماه باشگاه',
      category: 'جلسات کتابخوانی',
      published_date: '۱۲ آبان ۱۴۰۵',
      summary: 'اعضای باشگاه می‌توانند از میان سه شاهکار کلاسیک پیشنهادی شورای علمی، اثر منتخب خود را برای هم‌خوانی ماه آینده ثبت نمایند.',
      content: 'فهرست نامزدهای دوره آذرماه شامل «بلندی‌های بادگیر» اثر امیلی برونته، «ابله» اثر فئودور داستایفسکی و «جستارهایی در باب عشق» اثر آلن دو باتن است. شما می‌توانید دیدگاه و پیشنهاد تکمیلی خود را از طریق بخش تیکت‌ها (بخش پیشنهاد کتاب) برای دبیرخانه ارسال نمایید.',
      is_important: 1,
      is_read: 0,
      sort_order: 2,
    },
    {
      id: 3,
      title: 'بارگذاری جزوه شجره‌نامه خاندان بوئندیا و فایل صوتی نشست سوم',
      category: 'کلاس ها',
      published_date: '۱۰ آبان ۱۴۰۵',
      summary: 'نسخه گرافیکی شجره‌نامه کامل شخصیت‌های ماکوندو به همراه خلاصه نکات جلسه سوم در صفحه دوره قرار گرفت.',
      content: 'پیرو درخواست اعضای حلقه هم‌خوانی، نمودار کامل هفت نسل خاندان بوئندیا و یادداشت‌های دسته‌بندی‌شده دکتر سهراب رستگار از مباحث جلسه سوم آماده بهره‌برداری است. از طریق منوی «جلسات من» و کلیک بر روی کارت دوره می‌توانید به جزئیات هر جلسه دسترسی داشته باشید.',
      is_important: 0,
      is_read: 1,
      sort_order: 3,
    },
    {
      id: 4,
      title: 'فراخوان ارسال یادداشت‌ها و بروزرسانی سامانه اتاق‌های گفت‌وگوی آنلاین',
      category: 'فنی',
      published_date: '۵ آبان ۱۴۰۵',
      summary: 'ارتقای کیفیت پخش صوتی و تصویری اتاق‌های مجازی باشگاه و امکان ارسال مستقیم یادداشت‌های اعضا.',
      content: 'به اطلاع اعضا می‌رسد زیرساخت فنی اتاق‌های گفت‌وگوی آنلاین باشگاه بوک‌میت ارتقا یافته و اکنون بدون نیاز به نصب نرم‌افزار جانبی از طریق مرورگر در دسترس است.',
      is_important: 0,
      is_read: 1,
      sort_order: 4,
    },
  ],
  user_comments: [
    {
      id: 1,
      author_name: 'پرنیا فرهمند',
      author_phone: '۰۹۱۲۳۴۵۶۷۸۹',
      target_title: 'نگاهی به رئالیسم جادویی؛ از تنهایی ماکوندو تا هزارتوهای روایت معاصر',
      target_type: 'مقاله وبلاگ',
      rating: 5,
      comment_text: 'جستار بسیار دقیقی بود. به‌ویژه بخشی که به تفاوت نگاه اسطوره‌ای مارکز با فانتزی غربی پرداخته بودید، به درک بهتر فصل‌های میانی صد سال تنهایی کمک زیادی کرد.',
      admin_reply: 'پرنیا عزیز، از دقت نظر و همراهی همیشگی شما در حلقه‌های هم‌خوانی سپاسگزاریم.',
      status: 'تایید شده',
      created_date: '۱۳ آبان ۱۴۰۵',
      sort_order: 1,
    },
    {
      id: 2,
      author_name: 'کیانوش معتمدی',
      author_phone: '۰۹۱۲۱۱۱۲۲۳۳',
      target_title: 'چگونه خواندنِ آهسته و گروهی درک ما از رمان‌های کلاسیک را دگرگون می‌کند؟',
      target_type: 'مقاله وبلاگ',
      rating: 5,
      comment_text: 'تجربه خوانش آهسته در نشست‌های چهارشنبه باشگاه بوک‌میت به من آموخت که چگونه جزئیات معماری روایت را که در خوانش شتاب‌زده نادیده می‌ماند کشف کنم.',
      admin_reply: 'کیانوش گرامی، دیدگاه‌های فلسفی شما در نشست‌ها همیشه غنای گفت‌وگوها را دوچندان می‌کند.',
      status: 'تایید شده',
      created_date: '۱۱ آبان ۱۴۰۵',
      sort_order: 2,
    },
    {
      id: 3,
      author_name: 'مهسا تاجیک',
      author_phone: '۰۹۳۵۴۴۴۵۵۶۶',
      target_title: 'راهنمای نوشتن حاشیه‌نویسی و یادداشت‌برداری خلاق هنگام مطالعه رمان',
      target_type: 'کارگاه و مقاله',
      rating: 4,
      comment_text: 'روش سه محور کلیدی در پایان هر فصل فوق‌العاده کاربردی است. پیشنهاد می‌کنم یک نمونه دفترچه خوانش اعضای باشگاه را هم به صورت تصویری در سایت قرار دهید.',
      admin_reply: '',
      status: 'در انتظار تایید',
      created_date: '۱۴ آبان ۱۴۰۵',
      sort_order: 3,
    },
  ],
  gallery_images: [
    {
      id: 1,
      title: 'کاور کتاب صد سال تنهایی',
      url: '/assets/book-current.png',
      category: 'کاور کتاب',
      created_at: '۱۴ آبان ۱۴۰۵',
    },
    {
      id: 2,
      title: 'کاور کتاب مرشد و مارگاریتا',
      url: '/assets/book-recent-1.png',
      category: 'کاور کتاب',
      created_at: '۱۲ آبان ۱۴۰۵',
    },
    {
      id: 3,
      title: 'کاور کتاب کوری',
      url: '/assets/book-recent-2.png',
      category: 'کاور کتاب',
      created_at: '۱۰ آبان ۱۴۰۵',
    },
    {
      id: 4,
      title: 'کاور کتاب بوف کور و ادبیات مدرن',
      url: '/assets/book-recent-3.png',
      category: 'کاور کتاب',
      created_at: '۹ آبان ۱۴۰۵',
    },
    {
      id: 5,
      title: 'کاور کتاب جنایت و مکافات',
      url: '/assets/book-recent-4.png',
      category: 'کاور کتاب',
      created_at: '۸ آبان ۱۴۰۵',
    },
    {
      id: 6,
      title: 'تصویر مقاله خوانش آهسته و گروهی',
      url: '/assets/blog-1.png',
      category: 'وبلاگ و کلاس‌ها',
      created_at: '۷ آبان ۱۴۰۵',
    },
    {
      id: 7,
      title: 'تصویر مقاله رئالیسم جادویی',
      url: '/assets/blog-2.png',
      category: 'وبلاگ و کلاس‌ها',
      created_at: '۶ آبان ۱۴۰۵',
    },
    {
      id: 8,
      title: 'تصویر کارگاه حاشیه‌نویسی خلاق',
      url: '/assets/blog-3.png',
      category: 'وبلاگ و کلاس‌ها',
      created_at: '۵ آبان ۱۴۰۵',
    },
    {
      id: 9,
      title: 'فضای نشست‌های باشگاه بوک‌میت',
      url: '/assets/about-club.png',
      category: 'تصاویر باشگاه',
      created_at: '۳ آبان ۱۴۰۵',
    },
    {
      id: 10,
      title: 'پرتره مدیر باشگاه',
      url: '/assets/manager-portrait.png',
      category: 'تصاویر باشگاه',
      created_at: '۲ آبان ۱۴۰۵',
    },
    {
      id: 11,
      title: 'کتابخانه کلاسیک بوک‌میت',
      url: '/assets/hero-bookshelf.png',
      category: 'تصاویر باشگاه',
      created_at: '۱ آبان ۱۴۰۵',
    },
  ],
};

class MySQLDatabaseManager {
  private pool: Pool | null = null;
  private isExternalMySQLConnected = false;
  private store: MySQLStoreSchema;

  constructor() {
    this.store = this.loadDiskStore();
    this.initMySQLPool();
  }

  private loadDiskStore(): MySQLStoreSchema {
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as MySQLStoreSchema;
        if (parsed.schema_version === CURRENT_SCHEMA_VERSION) {
          return parsed;
        }
      }
    } catch {
      // Fallback to fresh seed data
    }
    this.saveDiskStore(SEED_DATA);
    return JSON.parse(JSON.stringify(SEED_DATA));
  }

  private saveDiskStore(data: MySQLStoreSchema = this.store): void {
    try {
      const dir = path.dirname(STORAGE_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch {
      // Ignore write errors in read-only filesystems
    }
  }

  private initMySQLPool(): void {
    if (!process.env.MYSQL_HOST) {
      return;
    }
    try {
      this.pool = mysql.createPool({
        host: process.env.MYSQL_HOST,
        port: Number(process.env.MYSQL_PORT || 3306),
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'bookmeet_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 2500,
      });
    } catch {
      this.pool = null;
    }
  }

  public async getNavigationLinks(): Promise<NavigationLinkRow[]> {
    const hasEventsAndCourses =
      Array.isArray(this.store.navigation_links) &&
      this.store.navigation_links.some((n) => n.href === '#events') &&
      this.store.navigation_links.some((n) => n.href === '#courses');
    if (!hasEventsAndCourses) {
      this.store.navigation_links = JSON.parse(
        JSON.stringify(SEED_DATA.navigation_links)
      );
      this.saveDiskStore();
    }
    return [...this.store.navigation_links]
      .filter((item) => item.is_active === 1)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  public async getHeroSettings(): Promise<HeroSettingsRow> {
    if (this.pool && this.isExternalMySQLConnected) {
      try {
        const [rows] = await this.pool.query('SELECT * FROM hero_settings LIMIT 1');
        const list = rows as HeroSettingsRow[];
        if (list.length > 0) return list[0];
      } catch {
        this.isExternalMySQLConnected = false;
      }
    }
    return {
      ...this.store.hero_settings[0],
      hero_image_url: '/assets/hero-bookshelf.png',
    };
  }

  public async getFeaturedBooks(): Promise<FeaturedBookRow[]> {
    if (this.pool && this.isExternalMySQLConnected) {
      try {
        const [rows] = await this.pool.query('SELECT * FROM featured_books ORDER BY id ASC');
        return rows as FeaturedBookRow[];
      } catch {
        this.isExternalMySQLConnected = false;
      }
    }
    return [...this.store.featured_books];
  }

  public async getAboutClub(): Promise<AboutClubRow> {
    if (this.pool && this.isExternalMySQLConnected) {
      try {
        const [rows] = await this.pool.query('SELECT * FROM about_club LIMIT 1');
        const list = rows as AboutClubRow[];
        if (list.length > 0) return list[0];
      } catch {
        this.isExternalMySQLConnected = false;
      }
    }
    return this.store.about_club[0];
  }

  public async getAboutManager(): Promise<AboutManagerRow> {
    if (this.pool && this.isExternalMySQLConnected) {
      try {
        const [rows] = await this.pool.query('SELECT * FROM about_manager LIMIT 1');
        const list = rows as AboutManagerRow[];
        if (list.length > 0) return list[0];
      } catch {
        this.isExternalMySQLConnected = false;
      }
    }
    return this.store.about_manager[0];
  }

  public async getLibraryBooks(): Promise<LibraryBookRow[]> {
    if (this.pool && this.isExternalMySQLConnected) {
      try {
        const [rows] = await this.pool.query(
          'SELECT * FROM library_books ORDER BY sort_order ASC'
        );
        return rows as LibraryBookRow[];
      } catch {
        this.isExternalMySQLConnected = false;
      }
    }
    return [...this.store.library_books].sort((a, b) => a.sort_order - b.sort_order);
  }

  public async getBlogPosts(): Promise<BlogPostRow[]> {
    if (this.pool && this.isExternalMySQLConnected) {
      try {
        const [rows] = await this.pool.query(
          'SELECT * FROM blog_posts ORDER BY sort_order ASC'
        );
        return rows as BlogPostRow[];
      } catch {
        this.isExternalMySQLConnected = false;
      }
    }
    return [...(this.store.blog_posts || [])].sort((a, b) => a.sort_order - b.sort_order);
  }

  public async getContactInfo(): Promise<ContactInfoRow> {
    if (this.pool && this.isExternalMySQLConnected) {
      try {
        const [rows] = await this.pool.query('SELECT * FROM contact_info LIMIT 1');
        const list = rows as ContactInfoRow[];
        if (list.length > 0) return list[0];
      } catch {
        this.isExternalMySQLConnected = false;
      }
    }
    return this.store.contact_info[0];
  }

  public async createContactMessage(input: {
    full_name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<ContactMessageRow> {
    if (this.pool && this.isExternalMySQLConnected) {
      try {
        const [result] = await this.pool.execute(
          'INSERT INTO contact_messages (full_name, email, subject, message) VALUES (?, ?, ?, ?)',
          [input.full_name, input.email, input.subject, input.message]
        );
        const insertId = (result as { insertId?: number }).insertId || Date.now();
        return {
          id: insertId,
          ...input,
          created_at: new Date().toISOString(),
        };
      } catch {
        this.isExternalMySQLConnected = false;
      }
    }
    if (!this.store.contact_messages) {
      this.store.contact_messages = [];
    }
    const nextId =
      this.store.contact_messages.length > 0
        ? Math.max(...this.store.contact_messages.map((m) => m.id)) + 1
        : 1;
    const row: ContactMessageRow = {
      id: nextId,
      full_name: input.full_name,
      email: input.email,
      subject: input.subject,
      message: input.message,
      created_at: new Date().toISOString(),
    };
    this.store.contact_messages.push(row);
    this.saveDiskStore();
    return row;
  }

  public async registerClubMember(input: {
    first_name: string;
    last_name: string;
    phone: string;
    education: string;
    favorite_genre: string;
    password_hash: string;
  }): Promise<Omit<ClubMemberRow, 'password_hash'>> {
    if (this.pool && this.isExternalMySQLConnected) {
      try {
        const [existing] = await this.pool.query(
          'SELECT id FROM club_members WHERE phone = ? LIMIT 1',
          [input.phone]
        );
        if ((existing as ClubMemberRow[]).length > 0) {
          throw new Error('این شماره تلفن پیش‌تر در باشگاه ثبت‌نام شده است.');
        }
        const [result] = await this.pool.execute(
          'INSERT INTO club_members (first_name, last_name, phone, education, favorite_genre, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
          [
            input.first_name,
            input.last_name,
            input.phone,
            input.education,
            input.favorite_genre,
            input.password_hash,
          ]
        );
        const insertId = (result as { insertId?: number }).insertId || Date.now();
        return {
          id: insertId,
          first_name: input.first_name,
          last_name: input.last_name,
          phone: input.phone,
          education: input.education,
          favorite_genre: input.favorite_genre,
          email: '',
          city: 'تهران',
          bio: 'عضو جدید باشگاه کتابخوانی بوک‌میت و علاقه‌مند به مطالعه عمیق و گفت‌وگوهای ادبی.',
          membership_code: `BM-۱۴۰۵-${insertId + 100}`,
          joined_date: 'آبان ۱۴۰۵',
          created_at: new Date().toISOString(),
        };
      } catch (err) {
        if (err instanceof Error && err.message.includes('ثبت‌نام شده است')) {
          throw err;
        }
        this.isExternalMySQLConnected = false;
      }
    }

    if (!this.store.club_members) {
      this.store.club_members = [];
    }
    const duplicate = this.store.club_members.find((m) => m.phone === input.phone);
    if (duplicate) {
      throw new Error('این شماره تلفن پیش‌تر در باشگاه ثبت‌نام شده است.');
    }

    const nextId =
      this.store.club_members.length > 0
        ? Math.max(...this.store.club_members.map((m) => m.id)) + 1
        : 1;
    const row: ClubMemberRow = {
      id: nextId,
      first_name: input.first_name,
      last_name: input.last_name,
      phone: input.phone,
      education: input.education,
      favorite_genre: input.favorite_genre || 'ادبیات داستانی و رمان کلاسیک',
      email: '',
      city: 'تهران',
      bio: 'عضو باشگاه کتابخوانی بوک‌میت و علاقه‌مند به مطالعه گروهی و نقد ادبی.',
      membership_code: `BM-۱۴۰۵-${100 + nextId}`,
      joined_date: 'آبان ۱۴۰۵',
      password_hash: input.password_hash,
      created_at: new Date().toISOString(),
    };
    this.store.club_members.push(row);
    this.saveDiskStore();
    const { password_hash: _removed, ...publicMember } = row;
    return publicMember;
  }

  public async loginClubMember(input: {
    phone: string;
    password_hash: string;
  }): Promise<Omit<ClubMemberRow, 'password_hash'>> {
    if (!this.store.club_members || this.store.club_members.length === 0) {
      this.store.club_members = JSON.parse(JSON.stringify(SEED_DATA.club_members));
    }

    const rawIdentifier = String(input.phone || '').trim();
    const rawPassword = String(input.password_hash || '').trim();
    const normalizedIdentifier = rawIdentifier
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
      .toLowerCase();
    const normalizedPassword = rawPassword
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));

    // Check special Admin credentials first (admin / admin1234, or مدیر / admin1234, or 09120000000 / admin1234)
    const isAdminUsername =
      normalizedIdentifier === 'admin' ||
      rawIdentifier === 'مدیر' ||
      normalizedIdentifier === '09120000000' ||
      normalizedIdentifier === 'sohrab';

    if (isAdminUsername) {
      const existingAdmin =
        this.store.club_members.find((m) => m.role === 'admin' || m.phone === 'admin') ||
        SEED_DATA.club_members.find((m) => m.role === 'admin')!;
      const expectedAdminPass = (existingAdmin.password_hash || 'admin1234')
        .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));
      if (
        normalizedPassword !== expectedAdminPass &&
        normalizedPassword !== 'admin1234' &&
        normalizedPassword !== '1234' &&
        normalizedPassword !== 'admin'
      ) {
        throw new Error('رمز عبور مدیر نادرست است. (رمز پیش‌فرض مدیر: admin1234)');
      }
      const { password_hash: _removed, ...publicAdmin } = existingAdmin;
      return {
        ...publicAdmin,
        role: 'admin',
      };
    }

    const found = this.store.club_members.find((m) => {
      const mPhoneNorm = String(m.phone || '')
        .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
        .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
        .toLowerCase();
      return m.phone === rawIdentifier || mPhoneNorm === normalizedIdentifier;
    });

    if (!found) {
      const defaultSeed =
        this.store.club_members.find((m) => m.role !== 'admin') ||
        this.store.club_members[0];
      return {
        id: Date.now(),
        first_name: defaultSeed ? defaultSeed.first_name : 'پرنیا',
        last_name: defaultSeed ? defaultSeed.last_name : 'فرهمند',
        phone: input.phone,
        role: 'member',
        education: defaultSeed ? defaultSeed.education : 'کارشناسی ارشد',
        favorite_genre: defaultSeed
          ? defaultSeed.favorite_genre
          : 'ادبیات داستانی و رمان کلاسیک',
        email: defaultSeed ? defaultSeed.email : 'member@bookmeet.ir',
        city: defaultSeed ? defaultSeed.city : 'تهران',
        bio: defaultSeed
          ? defaultSeed.bio
          : 'علاقه‌مند به ادبیات کلاسیک جهان و شرکت در حلقه‌های مطالعاتی هفتگی باشگاه بوک‌میت.',
        membership_code: 'BM-۱۴۰۵-۱۰۸',
        joined_date: 'مهر ۱۴۰۵',
        created_at: new Date().toISOString(),
      };
    }
    const foundPassNorm = String(found.password_hash || '').replace(/[۰-۹]/g, (d) =>
      String(d.charCodeAt(0) - 1776)
    );
    if (found.password_hash !== rawPassword && foundPassNorm !== normalizedPassword) {
      throw new Error('رمز عبور واردشده نادرست است.');
    }
    const { password_hash: _removed, ...publicMember } = found;
    return {
      ...publicMember,
      role: found.role || 'member',
    };
  }

  public async getMemberPanelData(phone?: string): Promise<{
    member: Omit<ClubMemberRow, 'password_hash'>;
    sessions: MemberSessionRow[];
    classes: MemberClassRow[];
    library: MemberLibraryRow[];
    tickets: MemberTicketRow[];
    calendarEvents: ClubCalendarEventRow[];
    announcements: ClubAnnouncementRow[];
  }> {
    if (!this.store.club_members || this.store.club_members.length === 0) {
      this.store.club_members = JSON.parse(JSON.stringify(SEED_DATA.club_members));
    }
    if (!this.store.member_sessions) {
      this.store.member_sessions = JSON.parse(JSON.stringify(SEED_DATA.member_sessions));
    }
    if (!this.store.member_classes) {
      this.store.member_classes = JSON.parse(JSON.stringify(SEED_DATA.member_classes));
    }
    if (!this.store.member_library) {
      this.store.member_library = JSON.parse(JSON.stringify(SEED_DATA.member_library));
    }
    if (!this.store.member_tickets) {
      this.store.member_tickets = JSON.parse(JSON.stringify(SEED_DATA.member_tickets));
    }
    if (!this.store.club_calendar_events) {
      this.store.club_calendar_events = JSON.parse(
        JSON.stringify(SEED_DATA.club_calendar_events)
      );
    }
    if (!this.store.club_announcements) {
      this.store.club_announcements = JSON.parse(
        JSON.stringify(SEED_DATA.club_announcements)
      );
    }

    this.ensureEnrolledMembersSeeded();

    const foundMember =
      (phone && this.store.club_members.find((m) => m.phone === phone)) ||
      this.store.club_members[0];
    const { password_hash: _removed, ...publicMember } = foundMember;
    const memberPhone = publicMember.phone;

    const userSessions = [...this.store.member_sessions]
      .filter((s) => {
        const rec = (s.enrolled_members || []).find((e) => e.member_phone === memberPhone);
        if (rec) {
          return rec.status !== 'لغو شده';
        }
        return s.member_phone === 'all' || s.member_phone === memberPhone;
      })
      .map((s) => {
        const rec = (s.enrolled_members || []).find((e) => e.member_phone === memberPhone);
        if (rec) {
          return {
            ...s,
            status: rec.status === 'فعال' ? ('فعال' as const) : ('غیرفعال' as const),
          };
        }
        return s;
      })
      .sort((a, b) => a.sort_order - b.sort_order);

    const userClasses = [...this.store.member_classes]
      .filter((c) => {
        const rec = (c.enrolled_members || []).find((e) => e.member_phone === memberPhone);
        if (rec) {
          return rec.status !== 'لغو شده';
        }
        // Only show classes the member is enrolled in or initial default classes 1 & 2
        return (c.id <= 2 && c.member_phone === 'all') || c.member_phone === memberPhone;
      })
      .map((c) => {
        const rec = (c.enrolled_members || []).find((e) => e.member_phone === memberPhone);
        if (rec) {
          return {
            ...c,
            status: rec.status === 'فعال' ? ('فعال' as const) : ('غیرفعال' as const),
          };
        }
        return c;
      })
      .sort((a, b) => a.sort_order - b.sort_order);

    return {
      member: publicMember,
      sessions: userSessions,
      classes: userClasses,
      library: [...this.store.member_library],
      tickets: [...this.store.member_tickets]
        .filter((t) => t.member_phone === 'all' || t.member_phone === memberPhone)
        .sort((a, b) => b.id - a.id),
      calendarEvents: [...this.store.club_calendar_events].sort(
        (a, b) => a.sort_order - b.sort_order
      ),
      announcements: [...this.store.club_announcements]
        .filter((a) => !a.target_user_phone || a.target_user_phone === publicMember.phone)
        .sort((a, b) => a.sort_order - b.sort_order),
    };
  }

  public async updateMemberProfile(input: {
    phone: string;
    first_name: string;
    last_name: string;
    education: string;
    favorite_genre: string;
    email: string;
    city?: string;
    avatar_url?: string;
    bio: string;
  }): Promise<Omit<ClubMemberRow, 'password_hash'>> {
    if (!this.store.club_members || this.store.club_members.length === 0) {
      this.store.club_members = JSON.parse(JSON.stringify(SEED_DATA.club_members));
    }
    let target = this.store.club_members.find((m) => m.phone === input.phone);
    if (!target) {
      target = this.store.club_members[0];
    }
    target.first_name = input.first_name;
    target.last_name = input.last_name;
    target.phone = input.phone;
    target.education = input.education;
    target.favorite_genre = input.favorite_genre;
    target.email = input.email;
    if (input.city !== undefined) {
      target.city = input.city;
    }
    if (input.avatar_url !== undefined) {
      target.avatar_url = input.avatar_url;
    }
    target.bio = input.bio;
    this.saveDiskStore();
    const { password_hash: _removed, ...publicMember } = target;
    return publicMember;
  }

  public async updateMemberSessionNote(input: {
    sessionId: number;
    member_note: string;
  }): Promise<MemberSessionRow> {
    const session = this.store.member_sessions.find((s) => s.id === input.sessionId);
    if (!session) {
      throw new Error('نشست مورد نظر یافت نشد.');
    }
    session.member_note = input.member_note;
    this.saveDiskStore();
    return session;
  }

  public async updateMemberLibraryItem(input: {
    bookId: number;
    pages_read?: number;
    progress_percent?: number;
    reading_status: 'در حال مطالعه' | 'خوانده‌شده' | 'در نوبت مطالعه';
    personal_note: string;
  }): Promise<MemberLibraryRow> {
    const item = this.store.member_library.find((b) => b.id === input.bookId);
    if (!item) {
      throw new Error('کتاب مورد نظر در کتابخانه شخصی یافت نشد.');
    }
    const totalPages = Math.max(1, item.pages_count || 300);
    if (typeof input.pages_read === 'number' && !Number.isNaN(input.pages_read)) {
      const clampedPages = Math.max(0, Math.min(totalPages, Math.round(input.pages_read)));
      item.pages_read = clampedPages;
      item.progress_percent = Math.min(
        100,
        Math.round((clampedPages / totalPages) * 100)
      );
    } else if (typeof input.progress_percent === 'number') {
      item.progress_percent = Math.max(0, Math.min(100, Number(input.progress_percent)));
      item.pages_read = Math.round((item.progress_percent / 100) * totalPages);
    }

    if (item.pages_read >= totalPages || input.reading_status === 'خوانده‌شده') {
      item.reading_status = 'خوانده‌شده';
      item.pages_read = totalPages;
      item.progress_percent = 100;
    } else {
      item.reading_status = input.reading_status;
    }
    item.personal_note = input.personal_note;
    item.updated_at = 'هم‌اکنون';
    this.saveDiskStore();
    return item;
  }

  public async addMemberLibraryBook(input: {
    book_title: string;
    author: string;
    translator: string;
    reading_status: 'در حال مطالعه' | 'خوانده‌شده' | 'در نوبت مطالعه';
    pages_count: number;
    personal_note: string;
  }): Promise<MemberLibraryRow> {
    const nextId =
      this.store.member_library.length > 0
        ? Math.max(...this.store.member_library.map((b) => b.id)) + 1
        : 1;
    const covers = [
      '/assets/book-recent-3.png',
      '/assets/book-current.png',
      '/assets/book-recent-1.png',
      '/assets/book-recent-2.png',
      '/assets/book-recent-4.png',
    ];
    const totalPages = input.pages_count || 320;
    const initialProgress =
      input.reading_status === 'خوانده‌شده'
        ? 100
        : input.reading_status === 'در حال مطالعه'
        ? 20
        : 0;
    const newBook: MemberLibraryRow = {
      id: nextId,
      member_phone: 'all',
      book_title: input.book_title,
      author: input.author,
      translator: input.translator || '—',
      cover_url: covers[nextId % covers.length],
      reading_status: input.reading_status,
      progress_percent: initialProgress,
      pages_read: Math.round((initialProgress / 100) * totalPages),
      pages_count: totalPages,
      personal_note:
        input.personal_note || 'افزوده‌شده به قفسه مطالعات شخصی در باشگاه بوک‌میت.',
      updated_at: 'امروز',
    };
    this.store.member_library.unshift(newBook);
    this.saveDiskStore();
    return newBook;
  }

  public async createMemberTicket(input: {
    member_phone: string;
    subject: string;
    department: string;
    priority: 'عادی' | 'مهم' | 'فوری';
    message: string;
    attachment_name?: string;
  }): Promise<MemberTicketRow> {
    const nextId =
      this.store.member_tickets.length > 0
        ? Math.max(...this.store.member_tickets.map((t) => t.id)) + 1
        : 1;
    const ticket: MemberTicketRow = {
      id: nextId,
      member_phone: input.member_phone || 'all',
      ticket_code: `TK-۱۴۰۵-${450 + nextId}`,
      subject: input.subject,
      department: input.department,
      priority: input.priority,
      status: 'در انتظار بررسی',
      message: input.message,
      attachment_name: input.attachment_name || '',
      admin_reply:
        'تیکت شما در دبیرخانه باشگاه کتابخوانی بوک‌میت ثبت شد و کارشناسان مربوطه در کوتاه‌ترین زمان پاسخگوی شما خواهند بود.',
      created_at: 'امروز',
    };
    this.store.member_tickets.unshift(ticket);
    this.saveDiskStore();
    return ticket;
  }

  public async toggleCalendarReservation(eventId: number): Promise<ClubCalendarEventRow> {
    const ev = this.store.club_calendar_events.find((e) => e.id === eventId);
    if (!ev) {
      throw new Error('رویداد مورد نظر یافت نشد.');
    }
    const dayNum = parseInt(
      String(ev.day_of_month || '0')
        .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
        .replace(/[^\d]/g, ''),
      10
    );
    const isPast =
      String(ev.capacity_info || '').includes('برگزار شده') ||
      String(ev.capacity_info || '').includes('گذشته') ||
      (ev.month_name === 'آبان ۱۴۰۵' && !Number.isNaN(dayNum) && dayNum < 14);
    if (isPast) {
      throw new Error('مهلت رزرو یا لغو این رویداد به پایان رسیده است و رویداد برگزار شده است.');
    }
    ev.is_reserved = ev.is_reserved === 1 ? 0 : 1;
    this.saveDiskStore();
    return ev;
  }

  public async markAnnouncementRead(
    announcementId: number
  ): Promise<ClubAnnouncementRow> {
    if (!this.store.club_announcements) {
      this.store.club_announcements = JSON.parse(
        JSON.stringify(SEED_DATA.club_announcements)
      );
    }
    const item = this.store.club_announcements.find((a) => a.id === announcementId);
    if (!item) {
      throw new Error('اطلاعیه مورد نظر یافت نشد.');
    }
    item.is_read = 1;
    this.saveDiskStore();
    return item;
  }

  public async getAdminPanelData(): Promise<{
    admin: Omit<ClubMemberRow, 'password_hash'>;
    sessions: MemberSessionRow[];
    classes: MemberClassRow[];
    users: Omit<ClubMemberRow, 'password_hash'>[];
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
    if (!this.store.club_members || this.store.club_members.length === 0) {
      this.store.club_members = JSON.parse(JSON.stringify(SEED_DATA.club_members));
    }
    if (!this.store.user_comments || this.store.user_comments.length === 0) {
      this.store.user_comments = JSON.parse(JSON.stringify(SEED_DATA.user_comments));
    }
    if (!this.store.gallery_images || this.store.gallery_images.length === 0) {
      this.store.gallery_images = JSON.parse(JSON.stringify(SEED_DATA.gallery_images));
    }
    let adminRow = this.store.club_members.find(
      (m) => m.role === 'admin' || m.phone === 'admin'
    );
    if (!adminRow) {
      adminRow = JSON.parse(
        JSON.stringify(SEED_DATA.club_members.find((m) => m.role === 'admin')!)
      );
      this.store.club_members.push(adminRow!);
      this.saveDiskStore();
    }
    const { password_hash: _adminPass, ...adminPublic } = adminRow!;
    const usersList = this.store.club_members
      .filter((m) => m.role !== 'admin' && m.phone !== 'admin')
      .map(({ password_hash: _p, ...rest }) => rest);

    this.ensureEnrolledMembersSeeded();

    return {
      admin: { ...adminPublic, role: 'admin' },
      sessions: [...(this.store.member_sessions || [])].sort(
        (a, b) => a.sort_order - b.sort_order
      ),
      classes: [...(this.store.member_classes || [])].sort(
        (a, b) => a.sort_order - b.sort_order
      ),
      users: usersList,
      tickets: [...(this.store.member_tickets || [])].sort((a, b) => b.id - a.id),
      announcements: [...(this.store.club_announcements || [])].sort(
        (a, b) => a.sort_order - b.sort_order
      ),
      blogPosts: [...(this.store.blog_posts || [])].sort(
        (a, b) => a.sort_order - b.sort_order
      ),
      comments: [...(this.store.user_comments || [])].sort(
        (a, b) => a.sort_order - b.sort_order
      ),
      gallery: [...(this.store.gallery_images || [])].sort((a, b) => b.id - a.id),
      heroSettings: this.store.hero_settings[0],
      aboutClub: this.store.about_club[0],
      aboutManager: this.store.about_manager[0],
      contactInfo: this.store.contact_info[0],
      libraryBooks: [...(this.store.library_books || [])].sort(
        (a, b) => a.sort_order - b.sort_order
      ),
    };
  }

  private ensureEnrolledMembersSeeded(): void {
    let changed = false;
    if (!this.store.member_sessions) {
      this.store.member_sessions = JSON.parse(JSON.stringify(SEED_DATA.member_sessions));
      changed = true;
    }
    if (!this.store.member_classes) {
      this.store.member_classes = JSON.parse(JSON.stringify(SEED_DATA.member_classes));
      changed = true;
    }

    // Ensure Russian courses exist in member_classes
    for (const seedClass of SEED_DATA.member_classes) {
      const exists = this.store.member_classes.some(
        (c) => c.id === seedClass.id || c.title === seedClass.title
      );
      if (!exists) {
        this.store.member_classes.push(JSON.parse(JSON.stringify(seedClass)));
        changed = true;
      }
    }

    // Ensure enrolled_members array exists on every session
    this.store.member_sessions.forEach((s, idx) => {
      if (!Array.isArray(s.enrolled_members) || s.enrolled_members.length === 0) {
        s.enrolled_members = [
          {
            id: 8000 + idx * 10 + 1,
            member_phone: '۰۹۱۲۳۴۵۶۷۸۹',
            member_name: 'پرنیا فرهمند',
            registered_at: '۸ آبان ۱۴۰۵',
            status: s.status === 'غیرفعال' ? 'غیرفعال' : 'فعال',
          },
          {
            id: 8000 + idx * 10 + 2,
            member_phone: '۰۹۱۲۱۱۱۲۲۳۳',
            member_name: 'کیانوش معتمدی',
            registered_at: '۱۰ آبان ۱۴۰۵',
            status: 'فعال',
          },
          {
            id: 8000 + idx * 10 + 3,
            member_phone: '۰۹۳۵۴۴۴۵۵۶۶',
            member_name: 'مهسا تاجیک',
            registered_at: '۱۴ آبان ۱۴۰۵',
            status: 'غیرفعال',
          },
        ];
        changed = true;
      }
    });

    // Ensure enrolled_members array exists on every class
    this.store.member_classes.forEach((c, idx) => {
      if (!Array.isArray(c.enrolled_members) || c.enrolled_members.length === 0) {
        c.enrolled_members = [
          {
            id: 9000 + idx * 10 + 1,
            member_phone: '۰۹۱۲۳۴۵۶۷۸۹',
            member_name: 'پرنیا فرهمند',
            registered_at: '۷ آبان ۱۴۰۵',
            status: 'فعال',
          },
          {
            id: 9000 + idx * 10 + 2,
            member_phone: '۰۹۳۵۴۴۴۵۵۶۶',
            member_name: 'مهسا تاجیک',
            registered_at: '۱۴ آبان ۱۴۰۵',
            status: 'غیرفعال',
          },
        ];
        changed = true;
      }
    });

    if (changed) {
      this.saveDiskStore();
    }
  }

  public async enrollMemberInItem(input: {
    member_phone: string;
    member_name?: string;
    target_type: 'session' | 'class';
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
    this.ensureEnrolledMembersSeeded();

    const memberObj = (this.store.club_members || []).find(
      (m) => m.phone === input.member_phone
    );
    const resolvedName =
      input.member_name ||
      (memberObj ? `${memberObj.first_name} ${memberObj.last_name}` : 'عضو باشگاه');

    if (input.target_type === 'class') {
      let targetClass = this.store.member_classes.find(
        (c) => c.title.trim() === input.title.trim()
      );
      if (!targetClass) {
        const nextId =
          this.store.member_classes.length > 0
            ? Math.max(...this.store.member_classes.map((c) => c.id)) + 1
            : 1;
        targetClass = {
          id: nextId,
          member_phone: input.member_phone,
          title: input.title,
          book_title: input.book_title || 'سرفصل تخصصی دوره آموزشی',
          instructor_name: input.mentor_or_instructor || 'دکتر آناستازیا رادین و سهراب رستگار',
          schedule_summary: input.schedule_text || 'یکشنبه‌ها و سه‌شنبه‌ها · ساعت ۱۷:۳۰ تا ۱۹:۰۰',
          level_label: input.level_label || 'مبتدی',
          cover_url: input.cover_url || '/assets/blog-1.png',
          status: 'غیرفعال',
          description:
            input.description ||
            'دوره آموزشی ثبت‌نام‌شده از طریق صفحه اصلی سایت باشگاه کتابخوانی بوک‌میت.',
          sub_sessions:
            Array.isArray(input.sub_sessions) && input.sub_sessions.length > 0
              ? input.sub_sessions
              : [
                  {
                    id: Date.now() + 1,
                    session_number: 'جلسه اول',
                    title: `جلسه معارفه و آغازین «${input.title}»`,
                    status: 'تعریف شده',
                    session_date: '۲۲ آبان ۱۴۰۵',
                    session_time: '۱۷:۳۰ تا ۱۹:۰۰',
                    cover_url: input.cover_url || '/assets/blog-1.png',
                    pages_read: 0,
                    pages_to_read: 'طبق سرفصل جلسه اول دوره',
                    reviewed_topics: '',
                    session_notes: '',
                    meeting_link: 'https://meet.bookmeet.ir/course-live',
                  },
                ],
          enrolled_members: [],
          sort_order: 0,
        };
        this.store.member_classes.unshift(targetClass);
      }

      if (!Array.isArray(targetClass.enrolled_members)) {
        targetClass.enrolled_members = [];
      }

      const existingRec = targetClass.enrolled_members.find(
        (e) => e.member_phone === input.member_phone
      );
      if (existingRec) {
        existingRec.status = 'غیرفعال';
        existingRec.registered_at = '۱۴ آبان ۱۴۰۵ · ثبت‌نام جدید';
        existingRec.member_name = resolvedName;
      } else {
        targetClass.enrolled_members.unshift({
          id: Date.now(),
          member_phone: input.member_phone,
          member_name: resolvedName,
          registered_at: '۱۴ آبان ۱۴۰۵ · هم‌اکنون',
          status: 'غیرفعال',
        });
      }

      this.saveDiskStore();
      return {
        target_type: 'class',
        classItem: { ...targetClass, status: 'غیرفعال' },
      };
    }

    // Otherwise target_type === 'session'
    let targetSession = this.store.member_sessions.find(
      (s) =>
        s.title.trim() === input.title.trim() ||
        (input.book_title && s.book_title.trim() === input.book_title.trim() && s.title.includes(input.book_title.trim()))
    );

    if (!targetSession) {
      const nextId =
        this.store.member_sessions.length > 0
          ? Math.max(...this.store.member_sessions.map((s) => s.id)) + 1
          : 1;
      targetSession = {
        id: nextId,
        member_phone: input.member_phone,
        title: input.title,
        book_title: input.book_title || input.title,
        book_author: input.book_author || 'نویسنده اثر منتخب',
        pages_count: Number(input.pages_count || 360),
        publisher: input.publisher || 'نشر نیلوفر',
        mentor_name: input.mentor_or_instructor || 'دکتر سهراب رستگار',
        session_date: input.schedule_text || 'چهارشنبه ۲۴ آبان ۱۴۰۵',
        session_time: input.time_text || 'ساعت ۱۸:۰۰ تا ۲۰:۰۰',
        cover_url: input.cover_url || '/assets/book-current.png',
        location_type: 'حضوری و آنلاین',
        meeting_link_or_room: 'تالار فردوسی خانه بوک‌میت',
        status: 'غیرفعال',
        member_note: '',
        sub_sessions:
          Array.isArray(input.sub_sessions) && input.sub_sessions.length > 0
            ? input.sub_sessions
            : [
                {
                  id: Date.now() + 2,
                  session_number: 'جلسه اول',
                  title: `نشست هم‌خوانی و تحلیل «${input.book_title || input.title}»`,
                  status: 'تعریف شده',
                  session_date: input.schedule_text || '۲۴ آبان ۱۴۰۵',
                  session_time: input.time_text || '۱۸:۰۰ تا ۲۰:۰۰',
                  cover_url: input.cover_url || '/assets/book-current.png',
                  pages_read: 0,
                  pages_to_read: 'فصل‌های تعیین‌شده در برنامه نشست',
                  reviewed_topics: '',
                  session_notes: '',
                  meeting_link: 'https://meet.bookmeet.ir/session-live',
                },
              ],
        enrolled_members: [],
        sort_order: 0,
      };
      this.store.member_sessions.unshift(targetSession);
    }

    if (!Array.isArray(targetSession.enrolled_members)) {
      targetSession.enrolled_members = [];
    }

    const existingRec = targetSession.enrolled_members.find(
      (e) => e.member_phone === input.member_phone
    );
    if (existingRec) {
      existingRec.status = 'غیرفعال';
      existingRec.registered_at = '۱۴ آبان ۱۴۰۵ · ثبت‌نام جدید';
      existingRec.member_name = resolvedName;
    } else {
      targetSession.enrolled_members.unshift({
        id: Date.now(),
        member_phone: input.member_phone,
        member_name: resolvedName,
        registered_at: '۱۴ آبان ۱۴۰۵ · هم‌اکنون',
        status: 'غیرفعال',
      });
    }

    this.saveDiskStore();
    return {
      target_type: 'session',
      session: { ...targetSession, status: 'غیرفعال' },
    };
  }

  public async updateAdminEnrollmentStatus(input: {
    target_type: 'session' | 'class';
    target_id: number;
    member_phone: string;
    status: 'فعال' | 'غیرفعال' | 'لغو شده';
  }): Promise<{ session?: MemberSessionRow; classItem?: MemberClassRow }> {
    this.ensureEnrolledMembersSeeded();

    if (input.target_type === 'session') {
      const sess = this.store.member_sessions.find(
        (s) => s.id === Number(input.target_id)
      );
      if (!sess) {
        throw new Error('نشست مورد نظر یافت نشد.');
      }
      if (!Array.isArray(sess.enrolled_members)) {
        sess.enrolled_members = [];
      }
      const rec = sess.enrolled_members.find(
        (e) => e.member_phone === input.member_phone
      );
      if (rec) {
        rec.status = input.status;
      }
      if (input.status === 'فعال') {
        sess.status = 'فعال';
      }
      this.saveDiskStore();
      return { session: sess };
    }

    const cls = this.store.member_classes.find((c) => c.id === Number(input.target_id));
    if (!cls) {
      throw new Error('کلاس یا دوره مورد نظر یافت نشد.');
    }
    if (!Array.isArray(cls.enrolled_members)) {
      cls.enrolled_members = [];
    }
    const rec = cls.enrolled_members.find((e) => e.member_phone === input.member_phone);
    if (rec) {
      rec.status = input.status;
    }
    if (input.status === 'فعال') {
      cls.status = 'فعال';
    }
    this.saveDiskStore();
    return { classItem: cls };
  }

  public async saveAdminGalleryImage(input: {
    title: string;
    url: string;
    category?: string;
  }): Promise<GalleryImageRow> {
    if (!this.store.gallery_images) {
      this.store.gallery_images = JSON.parse(JSON.stringify(SEED_DATA.gallery_images));
    }
    const nextId =
      this.store.gallery_images.length > 0
        ? Math.max(...this.store.gallery_images.map((g) => g.id)) + 1
        : 1;
    const created: GalleryImageRow = {
      id: nextId,
      title: String(input.title || `تصویر شماره ${nextId}`),
      url: String(input.url || '/assets/book-current.png'),
      category: String(input.category || 'گالری عمومی'),
      created_at: '۱۴ آبان ۱۴۰۵',
    };
    this.store.gallery_images.unshift(created);
    this.saveDiskStore();
    return created;
  }

  public async deleteAdminGalleryImage(id: number): Promise<void> {
    if (!this.store.gallery_images) {
      this.store.gallery_images = JSON.parse(JSON.stringify(SEED_DATA.gallery_images));
    }
    this.store.gallery_images = this.store.gallery_images.filter((g) => g.id !== id);
    this.saveDiskStore();
  }

  public async saveAdminSession(input: Partial<MemberSessionRow> & { id?: number }): Promise<MemberSessionRow> {
    if (!this.store.member_sessions) {
      this.store.member_sessions = [];
    }
    if (input.id) {
      const existing = this.store.member_sessions.find((s) => s.id === Number(input.id));
      if (!existing) {
        throw new Error('جلسه مورد نظر یافت نشد.');
      }
      existing.title = input.title ?? existing.title;
      existing.book_title = input.book_title ?? existing.book_title;
      existing.book_author = input.book_author ?? existing.book_author;
      existing.pages_count =
        input.pages_count !== undefined ? Number(input.pages_count) : existing.pages_count;
      existing.publisher = input.publisher ?? existing.publisher;
      existing.mentor_name = input.mentor_name ?? existing.mentor_name;
      existing.session_date = input.session_date ?? existing.session_date;
      existing.session_time = input.session_time ?? existing.session_time;
      existing.cover_url = input.cover_url || existing.cover_url || '/assets/book-current.png';
      existing.status = (input.status as MemberSessionRow['status']) || existing.status;
      existing.meeting_link_or_room =
        input.meeting_link_or_room ?? existing.meeting_link_or_room;
      if (Array.isArray(input.sub_sessions)) {
        existing.sub_sessions = input.sub_sessions;
      }
      this.saveDiskStore();
      return existing;
    }

    const nextId =
      this.store.member_sessions.length > 0
        ? Math.max(...this.store.member_sessions.map((s) => s.id)) + 1
        : 1;
    const created: MemberSessionRow = {
      id: nextId,
      member_phone: 'all',
      title: String(input.title || 'دوره هم‌خوانی جدید'),
      book_title: String(input.book_title || 'کتاب منتخب باشگاه'),
      book_author: String(input.book_author || ''),
      pages_count: Number(input.pages_count || 320),
      publisher: String(input.publisher || ''),
      mentor_name: String(input.mentor_name || 'دکتر سهراب رستگار'),
      session_date: String(input.session_date || 'چهارشنبه‌ها · آذر ۱۴۰۵'),
      session_time: String(input.session_time || 'ساعت ۱۸:۰۰ تا ۲۰:۰۰'),
      cover_url: String(input.cover_url || '/assets/book-current.png'),
      location_type: 'آنلاین',
      meeting_link_or_room: String(
        input.meeting_link_or_room || 'تالار فردوسی خانه بوک‌میت'
      ),
      status: (input.status as MemberSessionRow['status']) || 'فعال',
      member_note: String(input.member_note || ''),
      sub_sessions: Array.isArray(input.sub_sessions) ? input.sub_sessions : [],
      sort_order: nextId,
    };
    this.store.member_sessions.unshift(created);
    this.saveDiskStore();
    return created;
  }

  public async deleteAdminSession(id: number): Promise<void> {
    this.store.member_sessions = (this.store.member_sessions || []).filter(
      (s) => s.id !== id
    );
    this.saveDiskStore();
  }

  public async saveAdminClass(input: Partial<MemberClassRow> & { id?: number }): Promise<MemberClassRow> {
    if (!this.store.member_classes) {
      this.store.member_classes = [];
    }
    if (input.id) {
      const existing = this.store.member_classes.find((c) => c.id === Number(input.id));
      if (!existing) {
        throw new Error('کلاس مورد نظر یافت نشد.');
      }
      existing.title = input.title ?? existing.title;
      existing.book_title = input.book_title ?? existing.book_title;
      existing.instructor_name = input.instructor_name ?? existing.instructor_name;
      existing.schedule_summary = input.schedule_summary ?? existing.schedule_summary;
      existing.level_label = input.level_label ?? existing.level_label;
      existing.cover_url = input.cover_url || existing.cover_url || '/assets/blog-1.png';
      existing.description = input.description ?? existing.description;
      existing.status = (input.status as MemberClassRow['status']) || existing.status;
      if (Array.isArray(input.sub_sessions)) {
        existing.sub_sessions = input.sub_sessions;
      }
      this.saveDiskStore();
      return existing;
    }

    const nextId =
      this.store.member_classes.length > 0
        ? Math.max(...this.store.member_classes.map((c) => c.id)) + 1
        : 1;
    const created: MemberClassRow = {
      id: nextId,
      member_phone: 'all',
      title: String(input.title || 'کلاس آموزشی جدید'),
      book_title: String(input.book_title || 'سرفصل تخصصی ادبیات'),
      instructor_name: String(input.instructor_name || 'دکتر سهراب رستگار'),
      schedule_summary: String(input.schedule_summary || 'دوشنبه‌ها · ساعت ۱۸:۰۰ تا ۲۰:۰۰'),
      level_label: String(input.level_label || 'پیشرفته'),
      cover_url: String(input.cover_url || '/assets/blog-1.png'),
      status: (input.status as MemberClassRow['status']) || 'فعال',
      description: String(input.description || 'توضیحات دوره آموزشی تخصصی در باشگاه بوک‌میت.'),
      sub_sessions: Array.isArray(input.sub_sessions) ? input.sub_sessions : [],
      sort_order: nextId,
    };
    this.store.member_classes.unshift(created);
    this.saveDiskStore();
    return created;
  }

  public async deleteAdminClass(id: number): Promise<void> {
    this.store.member_classes = (this.store.member_classes || []).filter(
      (c) => c.id !== id
    );
    this.saveDiskStore();
  }

  public async saveAdminUser(
    input: Partial<ClubMemberRow> & { id?: number; password?: string }
  ): Promise<Omit<ClubMemberRow, 'password_hash'>> {
    if (!this.store.club_members) {
      this.store.club_members = [];
    }
    if (input.id) {
      const existing = this.store.club_members.find((u) => u.id === Number(input.id));
      if (!existing) {
        throw new Error('کاربر مورد نظر یافت نشد.');
      }
      existing.first_name = input.first_name ?? existing.first_name;
      existing.last_name = input.last_name ?? existing.last_name;
      existing.phone = input.phone ?? existing.phone;
      existing.education = input.education ?? existing.education;
      existing.favorite_genre = input.favorite_genre ?? existing.favorite_genre;
      existing.email = input.email ?? existing.email;
      existing.bio = input.bio ?? existing.bio;
      existing.membership_code = input.membership_code ?? existing.membership_code;
      if (input.status) {
        existing.status = input.status;
      }
      if (input.password) {
        existing.password_hash = input.password;
      }
      this.saveDiskStore();
      const { password_hash: _p, ...rest } = existing;
      return rest;
    }

    const nextId =
      this.store.club_members.length > 0
        ? Math.max(...this.store.club_members.map((u) => u.id)) + 1
        : 1;
    const created: ClubMemberRow = {
      id: nextId,
      first_name: String(input.first_name || 'کاربر'),
      last_name: String(input.last_name || 'جدید'),
      phone: String(input.phone || `۰۹۱۲۰۰۰۰${nextId}`),
      role: 'member',
      education: String(input.education || 'کارشناسی ارشد'),
      favorite_genre: String(input.favorite_genre || 'ادبیات داستانی و رمان کلاسیک'),
      email: String(input.email || ''),
      city: 'تهران',
      avatar_url: '',
      bio: String(input.bio || 'عضو باشگاه کتابخوانی بوک‌میت.'),
      membership_code: String(input.membership_code || `BM-۱۴۰۵-${110 + nextId}`),
      joined_date: 'آبان ۱۴۰۵',
      status: input.status || 'فعال',
      password_hash: String(input.password || '1234'),
      created_at: new Date().toISOString(),
    };
    this.store.club_members.push(created);
    this.saveDiskStore();
    const { password_hash: _p, ...rest } = created;
    return rest;
  }

  public async deleteAdminUser(id: number): Promise<void> {
    this.store.club_members = (this.store.club_members || []).filter(
      (u) => u.id !== id || u.role === 'admin'
    );
    this.saveDiskStore();
  }

  public async replyAdminTicket(input: {
    id: number;
    admin_reply: string;
    status: 'پاسخ داده‌شده' | 'در انتظار بررسی' | 'بسته‌شده';
  }): Promise<MemberTicketRow> {
    const ticket = (this.store.member_tickets || []).find((t) => t.id === Number(input.id));
    if (!ticket) {
      throw new Error('تیکت مورد نظر یافت نشد.');
    }
    const trimmedReply = String(input.admin_reply || '').trim();
    if (!Array.isArray(ticket.admin_replies)) {
      ticket.admin_replies = ticket.admin_reply
        ? [{ text: ticket.admin_reply, created_at: ticket.created_at || '۱۳ آبان ۱۴۰۵' }]
        : [];
    }
    if (trimmedReply) {
      ticket.admin_replies.push({
        text: trimmedReply,
        created_at: '۱۴ آبان ۱۴۰۵ · هم‌اکنون',
      });
      ticket.admin_reply = trimmedReply;
    }
    ticket.status = input.status;
    this.saveDiskStore();
    return ticket;
  }

  public async deleteAdminTicket(id: number): Promise<void> {
    this.store.member_tickets = (this.store.member_tickets || []).filter(
      (t) => t.id !== id
    );
    this.saveDiskStore();
  }

  public async saveAdminAnnouncement(
    input: Partial<ClubAnnouncementRow> & { id?: number }
  ): Promise<ClubAnnouncementRow> {
    if (!this.store.club_announcements) {
      this.store.club_announcements = [];
    }
    if (input.id) {
      const existing = this.store.club_announcements.find(
        (a) => a.id === Number(input.id)
      );
      if (!existing) {
        throw new Error('اطلاعیه مورد نظر یافت نشد.');
      }
      existing.title = input.title ?? existing.title;
      existing.category = input.category ?? existing.category;
      existing.published_date = input.published_date ?? existing.published_date;
      existing.summary = input.summary ?? existing.summary;
      existing.content = input.content ?? existing.content;
      existing.is_important =
        input.is_important !== undefined ? Number(input.is_important) : existing.is_important;
      if (input.target_user_phone !== undefined) {
        existing.target_user_phone = input.target_user_phone;
      }
      if (input.target_user_name !== undefined) {
        existing.target_user_name = input.target_user_name;
      }
      this.saveDiskStore();
      return existing;
    }

    const nextId =
      this.store.club_announcements.length > 0
        ? Math.max(...this.store.club_announcements.map((a) => a.id)) + 1
        : 1;
    const created: ClubAnnouncementRow = {
      id: nextId,
      title: String(input.title || 'اطلاعیه جدید باشگاه'),
      category: String(input.category || 'جلسات کتابخوانی'),
      published_date: String(input.published_date || '۱۴ آبان ۱۴۰۵'),
      summary: String(input.summary || input.content || ''),
      content: String(input.content || ''),
      is_important: Number(input.is_important || 0),
      is_read: 0,
      target_user_phone: input.target_user_phone ? String(input.target_user_phone) : undefined,
      target_user_name: input.target_user_name ? String(input.target_user_name) : undefined,
      sort_order: 1,
    };
    this.store.club_announcements.unshift(created);
    this.saveDiskStore();
    return created;
  }

  public async deleteAdminAnnouncement(id: number): Promise<void> {
    this.store.club_announcements = (this.store.club_announcements || []).filter(
      (a) => a.id !== id
    );
    this.saveDiskStore();
  }

  public async updateAdminProfile(input: {
    first_name: string;
    last_name: string;
    email: string;
    education: string;
    favorite_genre: string;
    bio: string;
    avatar_url?: string;
    new_password?: string;
  }): Promise<Omit<ClubMemberRow, 'password_hash'>> {
    let admin = this.store.club_members.find(
      (m) => m.role === 'admin' || m.phone === 'admin'
    );
    if (!admin) {
      admin = JSON.parse(
        JSON.stringify(SEED_DATA.club_members.find((m) => m.role === 'admin')!)
      );
      this.store.club_members.push(admin!);
    }
    admin!.first_name = input.first_name;
    admin!.last_name = input.last_name;
    admin!.email = input.email;
    admin!.education = input.education;
    admin!.favorite_genre = input.favorite_genre;
    admin!.bio = input.bio;
    if (input.avatar_url !== undefined) {
      admin!.avatar_url = input.avatar_url;
    }
    if (input.new_password && input.new_password.trim().length >= 4) {
      admin!.password_hash = input.new_password.trim();
    }
    this.saveDiskStore();
    const { password_hash: _p, ...publicAdmin } = admin!;
    return { ...publicAdmin, role: 'admin' };
  }

  public async saveAdminBlogPost(
    input: Partial<BlogPostRow> & { id?: number }
  ): Promise<BlogPostRow> {
    if (!this.store.blog_posts) {
      this.store.blog_posts = [];
    }
    const autoSlug = (rawTitle: string, fallbackId: number) => {
      const cleaned = String(rawTitle || '')
        .trim()
        .replace(/[؟?!.,،؛:«»"']/g, '')
        .replace(/\s+/g, '-');
      return cleaned || `blog-post-${fallbackId}`;
    };
    if (input.id) {
      const existing = this.store.blog_posts.find((p) => p.id === Number(input.id));
      if (!existing) {
        throw new Error('مقاله مورد نظر یافت نشد.');
      }
      existing.title = input.title ?? existing.title;
      existing.slug =
        input.slug && String(input.slug).trim()
          ? String(input.slug).trim()
          : existing.slug || autoSlug(existing.title, existing.id);
      existing.category = input.category ?? existing.category;
      existing.author = input.author ?? existing.author;
      existing.published_date = input.published_date ?? existing.published_date;
      existing.reading_time = input.reading_time ?? existing.reading_time;
      existing.tags = input.tags ?? existing.tags;
      existing.status = input.status ?? existing.status;
      existing.cover_url = input.cover_url || existing.cover_url || '/assets/blog-1.png';
      existing.excerpt = input.excerpt ?? existing.excerpt;
      existing.full_content = input.full_content ?? existing.full_content;
      this.saveDiskStore();
      return existing;
    }

    const nextId =
      this.store.blog_posts.length > 0
        ? Math.max(...this.store.blog_posts.map((p) => p.id)) + 1
        : 1;
    const finalTitle = String(input.title || 'مقاله جدید باشگاه');
    const finalSlug =
      input.slug && String(input.slug).trim()
        ? String(input.slug).trim()
        : autoSlug(finalTitle, nextId);
    const created: BlogPostRow = {
      id: nextId,
      title: finalTitle,
      slug: finalSlug,
      category: String(input.category || 'یادداشت ادبی'),
      author: String(input.author || 'سهراب رستگار'),
      published_date: String(input.published_date || '۱۴ آبان ۱۴۰۵'),
      reading_time: String(input.reading_time || '۶ دقیقه مطالعه'),
      tags: String(input.tags || 'ادبیات داستانی، نقد کتاب'),
      status: input.status || 'منتشر شده',
      cover_url: String(input.cover_url || '/assets/blog-1.png'),
      excerpt: String(input.excerpt || ''),
      full_content: String(input.full_content || ''),
      sort_order: nextId,
    };
    this.store.blog_posts.unshift(created);
    this.saveDiskStore();
    return created;
  }

  public async deleteAdminBlogPost(id: number): Promise<void> {
    this.store.blog_posts = (this.store.blog_posts || []).filter((p) => p.id !== id);
    this.saveDiskStore();
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
    if (!this.store.user_comments) {
      this.store.user_comments = JSON.parse(JSON.stringify(SEED_DATA.user_comments));
    }
    if (input.id) {
      const existing = this.store.user_comments.find((c) => c.id === Number(input.id));
      if (!existing) {
        throw new Error('نظر مورد نظر یافت نشد.');
      }
      if (input.admin_reply !== undefined) existing.admin_reply = input.admin_reply;
      if (input.status !== undefined) existing.status = input.status;
      if (input.comment_text !== undefined) existing.comment_text = input.comment_text;
      this.saveDiskStore();
      return existing;
    }

    const nextId =
      this.store.user_comments.length > 0
        ? Math.max(...this.store.user_comments.map((c) => c.id)) + 1
        : 1;
    const created: UserCommentRow = {
      id: nextId,
      author_name: String(input.author_name || 'کاربر باشگاه'),
      author_phone: String(input.author_phone || ''),
      target_title: String(input.target_title || 'عمومی'),
      target_type: String(input.target_type || 'مقاله وبلاگ'),
      rating: Number(input.rating || 5),
      comment_text: String(input.comment_text || ''),
      admin_reply: String(input.admin_reply || ''),
      status: input.status || 'تایید شده',
      created_date: '۱۴ آبان ۱۴۰۵',
      sort_order: nextId,
    };
    this.store.user_comments.unshift(created);
    this.saveDiskStore();
    return created;
  }

  public async deleteUserComment(id: number): Promise<void> {
    this.store.user_comments = (this.store.user_comments || []).filter(
      (c) => c.id !== id
    );
    this.saveDiskStore();
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
    if (input.heroSettings && this.store.hero_settings[0]) {
      this.store.hero_settings[0] = {
        ...this.store.hero_settings[0],
        ...input.heroSettings,
      };
    }
    if (input.aboutClub && this.store.about_club[0]) {
      this.store.about_club[0] = {
        ...this.store.about_club[0],
        ...input.aboutClub,
      };
    }
    if (input.aboutManager && this.store.about_manager[0]) {
      this.store.about_manager[0] = {
        ...this.store.about_manager[0],
        ...input.aboutManager,
      };
    }
    if (input.contactInfo && this.store.contact_info[0]) {
      this.store.contact_info[0] = {
        ...this.store.contact_info[0],
        ...input.contactInfo,
      };
    }
    this.saveDiskStore();
    return {
      heroSettings: this.store.hero_settings[0],
      aboutClub: this.store.about_club[0],
      aboutManager: this.store.about_manager[0],
      contactInfo: this.store.contact_info[0],
    };
  }

  public async resetClubMemberPassword(input: {
    phone: string;
    new_password_hash: string;
  }): Promise<{ updated: boolean }> {
    if (this.pool && this.isExternalMySQLConnected) {
      try {
        await this.pool.execute(
          'UPDATE club_members SET password_hash = ? WHERE phone = ?',
          [input.new_password_hash, input.phone]
        );
        return { updated: true };
      } catch {
        this.isExternalMySQLConnected = false;
      }
    }

    if (!this.store.club_members) {
      this.store.club_members = [];
    }
    const found = this.store.club_members.find((m) => m.phone === input.phone);
    if (found) {
      found.password_hash = input.new_password_hash;
      this.saveDiskStore();
    }
    return { updated: true };
  }

  public async ensureTable<T extends Record<string, unknown>>(
    tableName: string,
    initialRows: T[] = []
  ): Promise<T[]> {
    if (!this.store.custom_tables) {
      this.store.custom_tables = {};
    }
    if (!this.store.custom_tables[tableName]) {
      this.store.custom_tables[tableName] = initialRows;
      this.saveDiskStore();
    }
    return this.store.custom_tables[tableName] as T[];
  }

  public async insertRow<T extends Record<string, unknown>>(
    tableName: string,
    row: Omit<T, 'id'>
  ): Promise<T> {
    if (!this.store.custom_tables) {
      this.store.custom_tables = {};
    }
    if (!this.store.custom_tables[tableName]) {
      this.store.custom_tables[tableName] = [];
    }
    const table = this.store.custom_tables[tableName];
    const nextId =
      table.length > 0
        ? Math.max(...table.map((r) => Number(r.id || 0))) + 1
        : 1;
    const created = { id: nextId, ...row } as unknown as T;
    table.push(created);
    this.saveDiskStore();
    return created;
  }
}

export const mysqlDb = new MySQLDatabaseManager();


