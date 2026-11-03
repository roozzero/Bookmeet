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

export interface MySQLStoreSchema {
  schema_version: number;
  navigation_links: NavigationLinkRow[];
  hero_settings: HeroSettingsRow[];
  featured_books: FeaturedBookRow[];
  about_club: AboutClubRow[];
  about_manager: AboutManagerRow[];
  custom_tables?: Record<string, Record<string, unknown>[]>;
}

const CURRENT_SCHEMA_VERSION = 4;
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
