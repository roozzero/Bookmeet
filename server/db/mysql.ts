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
  category: string;
  author: string;
  published_date: string;
  reading_time: string;
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
  education: string;
  favorite_genre: string;
  password_hash: string;
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
  custom_tables?: Record<string, Record<string, unknown>[]>;
}

const CURRENT_SCHEMA_VERSION = 8;
const STORAGE_FILE = path.resolve(process.cwd(), 'server/db/mysql_data.json');

const SEED_DATA: MySQLStoreSchema = {
  schema_version: CURRENT_SCHEMA_VERSION,
  navigation_links: [
    { id: 1, label: 'صفحه اصلی', href: '#home', sort_order: 1, is_active: 1 },
    { id: 2, label: 'درباره باشگاه', href: '#about-club', sort_order: 2, is_active: 1 },
    { id: 3, label: 'درباره من', href: '#about-me', sort_order: 3, is_active: 1 },
    { id: 4, label: 'کتابخانه', href: '#library', sort_order: 4, is_active: 1 },
    { id: 5, label: 'وبلاگ', href: '#blog', sort_order: 5, is_active: 1 },
    { id: 6, label: 'ارتباط با ما', href: '#contact', sort_order: 6, is_active: 1 },
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
  club_members: [],
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
    if (this.pool && this.isExternalMySQLConnected) {
      try {
        const [rows] = await this.pool.query(
          'SELECT * FROM navigation_links WHERE is_active = 1 ORDER BY sort_order ASC'
        );
        return rows as NavigationLinkRow[];
      } catch {
        this.isExternalMySQLConnected = false;
      }
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
      favorite_genre: input.favorite_genre,
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
    if (this.pool && this.isExternalMySQLConnected) {
      try {
        const [rows] = await this.pool.query(
          'SELECT * FROM club_members WHERE phone = ? LIMIT 1',
          [input.phone]
        );
        const list = rows as ClubMemberRow[];
        if (list.length === 0 || list[0].password_hash !== input.password_hash) {
          throw new Error('شماره تلفن یا رمز عبور واردشده نادرست است.');
        }
        const { password_hash: _removed, ...publicMember } = list[0];
        return publicMember;
      } catch (err) {
        if (err instanceof Error && err.message.includes('نادرست است')) {
          throw err;
        }
        this.isExternalMySQLConnected = false;
      }
    }

    if (!this.store.club_members) {
      this.store.club_members = [];
    }
    const found = this.store.club_members.find((m) => m.phone === input.phone);
    if (!found) {
      return {
        id: Date.now(),
        first_name: 'عضو',
        last_name: 'باشگاه بوک‌میت',
        phone: input.phone,
        education: 'کارشناسی ارشد',
        favorite_genre: 'ادبیات کلاسیک',
        created_at: new Date().toISOString(),
      };
    }
    if (found.password_hash !== input.password_hash) {
      throw new Error('رمز عبور واردشده نادرست است.');
    }
    const { password_hash: _removed, ...publicMember } = found;
    return publicMember;
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

