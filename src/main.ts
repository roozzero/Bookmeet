import $ from 'jquery';
import './styles/main.css';
import { ApiService } from './services/api.ts';
import { createNavbarComponent } from './components/Navbar.ts';
import { createHeroSectionComponent } from './components/HeroSection.ts';
import { createAboutClubSectionComponent } from './components/AboutClubSection.ts';
import { createAboutManagerSectionComponent } from './components/AboutManagerSection.ts';
import { createLibrarySectionComponent } from './components/LibrarySection.ts';
import { createBlogSectionComponent } from './components/BlogSection.ts';
import { createBlogPostPageComponent } from './components/BlogPostPage.ts';
import { createContactSectionComponent } from './components/ContactSection.ts';
import type { BlogPost, BootstrapPayload } from './types/models.ts';

const FALLBACK_BOOTSTRAP: BootstrapPayload = {
  navigationLinks: [
    { id: 1, label: 'صفحه اصلی', href: '#home', sort_order: 1, is_active: 1 },
    { id: 2, label: 'درباره باشگاه', href: '#about-club', sort_order: 2, is_active: 1 },
    { id: 3, label: 'درباره من', href: '#about-me', sort_order: 3, is_active: 1 },
    { id: 4, label: 'کتابخانه', href: '#library', sort_order: 4, is_active: 1 },
    { id: 5, label: 'وبلاگ', href: '#blog', sort_order: 5, is_active: 1 },
    { id: 6, label: 'ارتباط با ما', href: '#contact', sort_order: 6, is_active: 1 },
  ],
  heroSettings: {
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
  },
  featuredBooks: [
    {
      id: 1,
      title: 'The Little Prince',
      persian_title: 'شازده کوچولو',
      author: 'آنتوان دو سنت‌اگزوپری',
      publication_year: 1943,
      synopsis:
        'نسخه مصور آبرنگ و مرکب از سفر شاعرانه شازده کوچولو در میان سیارک‌ها و گفت‌وگو با روباه.',
    },
    {
      id: 2,
      title: 'The Alchemist',
      persian_title: 'کیمیاگر',
      author: 'پائولو کوئیلو',
      publication_year: 1988,
      synopsis:
        'روایت مصور سفر سانتیاگو از دشت‌های آندلس تا اهرام مصر در جست‌وجوی افسانه شخصی.',
    },
    {
      id: 3,
      title: 'Watership Down',
      persian_title: 'تپه خرگوش‌ها',
      author: 'ریچارد آدامز',
      publication_year: 1972,
      synopsis:
        'حکاکی‌های طبیعت‌گرایانه از حماسه مهاجرت و بقای گروهی کوچک در تپه‌های سرسبز برکشایر.',
    },
    {
      id: 4,
      title: 'The Night Circus',
      persian_title: 'سیرک شبانه',
      author: 'ارین مورگنسترن',
      publication_year: 2011,
      synopsis:
        'تصویرسازی‌های سیاه‌وسفید با رگه‌های سرخ از چادرهای جادویی سیرکی که تنها شب‌ها گشوده می‌شود.',
    },
    {
      id: 5,
      title: 'The Neverending Story',
      persian_title: 'داستان بی‌پایان',
      author: 'میشائیل انده',
      publication_year: 1979,
      synopsis:
        'چاپ دو رنگ مسی و زمردی با سرلوحه‌های دست‌ساز که خواننده را به سرزمین فانتازیا فرا می‌خواند.',
    },
  ],
  aboutClub: {
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
  aboutManager: {
    id: 1,
    section_kicker: '۰۲ · معرفی مدیر و بنیان‌گذار باشگاه',
    full_name: 'سهراب رستگار',
    role_title:
      'پژوهشگر ادبیات تطبیقی، منتقد ادبی و بنیان‌گذار باشگاه کتابخوانی بوک‌میت',
    bio_paragraph_1:
      'سهراب رستگار بیش از دوازده سال است که در حوزه نقد ادبی، روایت‌شناسی و برگزاری کارگاه‌های تخصصی خوانش خلاق فعالیت می‌کند. او پس از سال‌ها پژوهش در زمینه ادبیات کلاسیک و معاصر جهان، باشگاه کتابخوانی بوک‌میت را با این باور بنیان گذاشت که مطالعه زمانی به تجربه‌ای دگرگون‌کننده بدل می‌شود که در بستر گفت‌وگو و تبادل نگاه‌ها جریان یابد. رویکرد او در هدایت نشست‌ها، پیوند زدن میان نظریه ادبی و تجربه‌های ملموس زندگی روزمره است تا هر خواننده بتواند صدای ویژه خود را در مواجهه با متن بیابد.',
    bio_paragraph_2:
      'او تاکنون میزبان دهه‌ها نشست تحلیل رمان، بررسی نسخه‌های مصور شاهکارهای ادبی و گفت‌وگو با مترجمان و نویسندگان برجسته بوده است. دغدغه اصلی او در بوک‌میت، احیای فرهنگ خواندنِ دقیق و آهسته در روزگاری پرشتاب و ایجاد پیوندی پایدار میان دوستداران کتاب است؛ جایی که هر اثر نه یک کالای مصرفی، بلکه جهانی زنده برای کاوش و هم‌اندیشی به شمار می‌آید.',
    quote_text:
      '«کتاب‌ها زمانی به راستی آغاز می‌شوند که آخرین صفحه‌شان را می‌بندیم و درباره آنچه در ما دگرگون کرده‌اند با یکدیگر سخن می‌گوییم.»',
    image_url: '/assets/manager-portrait.png',
    credentials_line:
      'دکتری ادبیات تطبیقی · ۱۲ سال تجربه تسهیل‌گری نشست‌های کتاب · نویسنده و پژوهشگر روایت',
  },
  libraryBooks: [
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
  blogPosts: [
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
  contactInfo: {
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
};

function createClubLoginModal(): JQuery<HTMLElement> {
  const $modal = $(`
    <div dir="rtl" class="js-login-modal hidden fixed inset-0 z-50 bg-[#23180f]/45 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div class="bg-[#faf6ec] border border-[#dcd0bc] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 text-right">
        <div class="flex items-center justify-between border-b border-[#e5dccb] pb-3">
          <h2 class="text-base font-bold text-[#38281b]">ورود به باشگاه کتابخوانی بوک میت</h2>
          <button type="button" class="js-close-login text-xs text-[#735e4c] hover:text-[#23180f] px-2 py-1 rounded cursor-pointer">
            بستن
          </button>
        </div>
        <form class="js-login-form space-y-3.5">
          <div>
            <label class="block text-xs font-medium text-[#4f3f31] mb-1">پست الکترونیک یا شماره همراه</label>
            <input
              type="text"
              required
              placeholder="example@bookmeet.ir"
              class="w-full px-3.5 py-2 text-sm bg-white border border-[#d5c8b2] rounded-lg text-[#2c1f14] focus:outline-none focus:border-[#3d2c1e]"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-[#4f3f31] mb-1">کلمه عبور</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              class="w-full px-3.5 py-2 text-sm bg-white border border-[#d5c8b2] rounded-lg text-[#2c1f14] focus:outline-none focus:border-[#3d2c1e]"
            />
          </div>
          <div class="js-login-feedback hidden text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            درخواست ورود شما با موفقیت ثبت شد. خوش آمدید!
          </div>
          <div class="pt-2 flex items-center justify-end gap-2">
            <button type="button" class="js-close-login px-4 py-2 text-xs font-medium text-[#5c4b3c] hover:text-[#23180f] cursor-pointer">
              انصراف
            </button>
            <button type="submit" class="club-login-btn px-5 py-2 text-xs font-medium cursor-pointer">
              ورود به حساب
            </button>
          </div>
        </form>
      </div>
    </div>
  `);

  $modal.find('.js-close-login').on('click', () => {
    $modal.addClass('hidden');
    $modal.find('.js-login-feedback').addClass('hidden');
  });

  $modal.find('.js-login-form').on('submit', (e) => {
    e.preventDefault();
    $modal.find('.js-login-feedback').removeClass('hidden');
    setTimeout(() => {
      $modal.addClass('hidden');
      $modal.find('.js-login-feedback').addClass('hidden');
    }, 1100);
  });

  return $modal;
}

function mountApplication(payload: BootstrapPayload): void {
  const $app = $('#app');
  const allPosts = payload.blogPosts || FALLBACK_BOOTSTRAP.blogPosts;

  function renderMainHomeView(scrollToSelector?: string): void {
    $app.empty();

    const $shell = $(
      '<div id="home" dir="rtl" class="min-h-screen flex flex-col justify-between relative"></div>'
    );

    const $loginModal = createClubLoginModal();

    const $navbar = createNavbarComponent({
      navigationLinks: payload.navigationLinks,
      ctaText: payload.heroSettings.nav_cta_text || 'ورود به باشگاه',
      onNavigate: (href) => {
        if (href.startsWith('#')) {
          const $target = $(href);
          if ($target.length) {
            $('html, body').animate(
              { scrollTop: ($target.offset()?.top || 0) - 20 },
              450
            );
          }
        }
      },
      onLoginClick: () => {
        $loginModal.removeClass('hidden');
      },
    });

    const $hero = createHeroSectionComponent({
      heroSettings: payload.heroSettings,
      featuredBooks: payload.featuredBooks,
    });

    const $aboutClub = createAboutClubSectionComponent({
      aboutClub: payload.aboutClub || FALLBACK_BOOTSTRAP.aboutClub,
    });

    const $aboutManager = createAboutManagerSectionComponent({
      aboutManager: payload.aboutManager || FALLBACK_BOOTSTRAP.aboutManager,
    });

    const $library = createLibrarySectionComponent({
      libraryBooks: payload.libraryBooks || FALLBACK_BOOTSTRAP.libraryBooks,
    });

    const $blog = createBlogSectionComponent({
      blogPosts: allPosts,
      onOpenPost: (post: BlogPost) => {
        window.location.hash = `#/blog/${post.id}`;
        renderBlogPostPageView(post);
      },
    });

    const $contact = createContactSectionComponent({
      contactInfo: payload.contactInfo || FALLBACK_BOOTSTRAP.contactInfo,
    });

    $shell.append(
      $navbar,
      $hero,
      $aboutClub,
      $aboutManager,
      $library,
      $blog,
      $contact,
      $loginModal
    );
    $app.append($shell);

    if (scrollToSelector) {
      window.setTimeout(() => {
        const $target = $(scrollToSelector);
        if ($target.length) {
          $('html, body').animate(
            { scrollTop: ($target.offset()?.top || 0) - 20 },
            400
          );
        }
      }, 60);
    }
  }

  function renderBlogPostPageView(post: BlogPost): void {
    $app.empty();

    const $shell = $(
      '<div dir="rtl" class="min-h-screen flex flex-col justify-between relative"></div>'
    );

    const $loginModal = createClubLoginModal();

    const $navbar = createNavbarComponent({
      navigationLinks: payload.navigationLinks,
      ctaText: payload.heroSettings.nav_cta_text || 'ورود به باشگاه',
      activeHref: '#blog',
      onNavigate: (href) => {
        if (window.location.hash.startsWith('#/blog/')) {
          history.pushState('', document.title, window.location.pathname + window.location.search);
        }
        renderMainHomeView(href);
      },
      onLoginClick: () => {
        $loginModal.removeClass('hidden');
      },
    });

    const $postPage = createBlogPostPageComponent({
      post,
      allPosts,
      onBackToHome: () => {
        if (window.location.hash.startsWith('#/blog/')) {
          history.pushState('', document.title, window.location.pathname + window.location.search);
        }
        renderMainHomeView('#blog');
      },
      onSelectPost: (nextPost: BlogPost) => {
        window.location.hash = `#/blog/${nextPost.id}`;
        renderBlogPostPageView(nextPost);
      },
    });

    const $contact = createContactSectionComponent({
      contactInfo: payload.contactInfo || FALLBACK_BOOTSTRAP.contactInfo,
    });

    $shell.append($navbar, $postPage, $contact, $loginModal);
    $app.append($shell);

    $('html, body').stop(true).animate({ scrollTop: 0 }, 250);
  }

  // Handle initial route or hash navigation
  function checkHashRoute(): boolean {
    const hash = window.location.hash || '';
    const match = hash.match(/^#\/blog\/(\d+)$/);
    if (match) {
      const postId = Number(match[1]);
      const found = allPosts.find((p) => p.id === postId);
      if (found) {
        renderBlogPostPageView(found);
        return true;
      }
    }
    return false;
  }

  $(window)
    .off('hashchange.bookmeet')
    .on('hashchange.bookmeet', () => {
      if (!checkHashRoute() && !window.location.hash.startsWith('#/blog/')) {
        // Already on home or returning to home via browser back button
        if ($('#home').length === 0) {
          renderMainHomeView('#blog');
        }
      }
    });

  if (!checkHashRoute()) {
    renderMainHomeView();
  }
}

$(function () {
  ApiService.fetchBootstrapData()
    .then((data) => {
      mountApplication(data);
    })
    .catch(() => {
      mountApplication(FALLBACK_BOOTSTRAP);
    });
});
