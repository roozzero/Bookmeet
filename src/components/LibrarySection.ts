import $ from 'jquery';
import type { LibraryBook } from '../types/models.ts';
import { toPersianDigits } from '../utils/persianNumbers.ts';

export interface EventSessionPlanItem {
  sessionNumber: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  pagesToRead: string;
  status: 'برگزار شده' | 'نشست پیش رو';
}

export interface EventAudienceComment {
  id: number;
  authorName: string;
  roleLabel: string;
  dateLabel: string;
  rating: number;
  commentText: string;
}

export interface ClubEventDetailItem {
  id: number;
  title: string;
  bookTitle: string;
  bookAuthor: string;
  bookTranslator: string;
  publisher: string;
  pagesCount: number;
  publicationYear: number;
  coverUrl: string;
  dateLabel: string;
  timeLabel: string;
  mentor: string;
  location: string;
  shortDescription: string;
  bookIntroduction: string;
  fullDescription: string[];
  sessionsList: EventSessionPlanItem[];
  comments: EventAudienceComment[];
}

export const UPCOMING_EVENTS_DATA: ClubEventDetailItem[] = [
  {
    id: 1,
    title: 'نشست هم‌خوانی و تحلیل «صد سال تنهایی» (فصل‌های ۱۲ تا ۱۵)',
    bookTitle: 'صد سال تنهایی',
    bookAuthor: 'گابریل گارسیا مارکز',
    bookTranslator: 'بهمن فرزانه',
    publisher: 'نشر نیلوفر',
    pagesCount: 468,
    publicationYear: 1967,
    coverUrl: '/assets/book-current.png',
    dateLabel: 'چهارشنبه ۲۴ آبان ۱۴۰۵',
    timeLabel: 'ساعت ۱۸:۰۰ تا ۲۰:۰۰',
    mentor: 'دکتر سهراب رستگار',
    location: 'نشست حضوری · سالن اصلی خانه کتاب بوک‌میت',
    shortDescription:
      'واکاوی ساختار دایره‌ای زمان، استعاره‌های تنهایی خاندان بوئندیا و گفت‌وگوی گروهی اعضا درباره فصل‌های میانی رمان.',
    bookIntroduction:
      '«صد سال تنهایی» شاهکار بی‌بدیل گابریل گارسیا مارکز و یکی از ستون‌های اصلی ادبیات قرن بیستم است که سرگذشت هفت نسل از خاندان بوئندیا را در دهکده خیالی ماکوندو روایت می‌کند؛ جایی که اسطوره، تاریخ و واقعیت روزمره در بافتی شاعرانه به هم گره می‌خورند.',
    fullDescription: [
      'در این حلقه هم‌خوانی، فصل‌به‌فصل همراه با ساکنان ماکوندو پیش می‌رویم تا ببینیم چگونه مارکز با بهره‌گیری از شگردهای رئالیسم جادویی، مفهوم زمان خطی را می‌شکند و تاریخ آمریکای لاتین را در آیینه یک خانواده بازتاب می‌دهد.',
      'نشست پیش رو به بررسی فصل‌های ۱۲ تا ۱۵ اختصاص دارد؛ بخش‌هایی که در آن ورود شرکت موز، دگرگونی ناگهانی دهکده و آغاز باران‌های چهارساله، نقطه اوج دراماتیک رمان را رقم می‌زند.',
    ],
    sessionsList: [
      {
        sessionNumber: 'جلسه اول',
        title: 'پیدایش ماکوندو، کولی‌ها و کیمیاگری ملکیادس',
        dateLabel: '۲۵ مهر ۱۴۰۵',
        timeLabel: '۱۸:۰۰ تا ۲۰:۰۰',
        pagesToRead: 'صفحات ۱ تا ۱۱۵ (فصل‌های ۱ تا ۳)',
        status: 'برگزار شده',
      },
      {
        sessionNumber: 'جلسه دوم',
        title: 'طاعون بی‌خوابی و فراموشی جمعی در ماکوندو',
        dateLabel: '۲ آبان ۱۴۰۵',
        timeLabel: '۱۸:۰۰ تا ۲۰:۰۰',
        pagesToRead: 'صفحات ۱۱۶ تا ۲۲۵ (فصل‌های ۴ تا ۷)',
        status: 'برگزار شده',
      },
      {
        sessionNumber: 'جلسه سوم',
        title: 'جنگ‌های داخلی سرهنگ اورلیانو بوئندیا و ماهی‌های طلایی',
        dateLabel: '۹ آبان ۱۴۰۵',
        timeLabel: '۱۸:۰۰ تا ۲۰:۰۰',
        pagesToRead: 'صفحات ۲۲۶ تا ۳۱۸ (فصل‌های ۸ تا ۱۱)',
        status: 'برگزار شده',
      },
      {
        sessionNumber: 'جلسه چهارم',
        title: 'ورود شرکت موز و باران‌های چهارساله ماکوندو',
        dateLabel: '۲۴ آبان ۱۴۰۵',
        timeLabel: '۱۸:۰۰ تا ۲۰:۰۰',
        pagesToRead: 'صفحات ۳۱۹ تا ۳۹۵ (فصل‌های ۱۲ تا ۱۵)',
        status: 'نشست پیش رو',
      },
      {
        sessionNumber: 'جلسه پنجم',
        title: 'رمزگشایی از دست‌نوشته‌های ملکیادس و جمع‌بندی نهایی رمان',
        dateLabel: '۱ آذر ۱۴۰۵',
        timeLabel: '۱۸:۰۰ تا ۲۰:۳۰',
        pagesToRead: 'صفحات ۳۹۶ تا ۴۶۸ (فصل‌های ۱۶ تا پایان کتاب)',
        status: 'نشست پیش رو',
      },
    ],
    comments: [
      {
        id: 501,
        authorName: 'پرنیا فرهمند',
        roleLabel: 'عضو حلقه هم‌خوانی',
        dateLabel: '۱۲ آبان ۱۴۰۵',
        rating: 5,
        commentText:
          'تحلیل شجره‌نامه خاندان بوئندیا و بررسی تکرار نام‌ها در جلسات دکتر رستگار، خوانش این رمان را برایم به تجربه‌ای فراموش‌نشدنی تبدیل کرده است.',
      },
      {
        id: 502,
        authorName: 'کیانوش معتمدی',
        roleLabel: 'عضو فعال باشگاه',
        dateLabel: '۱۳ آبان ۱۴۰۵',
        rating: 5,
        commentText:
          'گفت‌وگوهای گروهی درباره مفهوم فراموشی تاریخی در ماکوندو بسیار عمیق و روشنگر بود.',
      },
    ],
  },
  {
    id: 2,
    title: 'شب ادبیات کلاسیک؛ کالبدشکافی رمان «مرشد و مارگاریتا»',
    bookTitle: 'مرشد و مارگاریتا',
    bookAuthor: 'میخائیل بولگاکف',
    bookTranslator: 'عباس میلانی',
    publisher: 'نشر فرهنگ نشر نو',
    pagesCount: 512,
    publicationYear: 1967,
    coverUrl: '/assets/book-recent-1.png',
    dateLabel: 'جمعه ۲۶ آبان ۱۴۰۵',
    timeLabel: 'ساعت ۱۹:۰۰ تا ۲۱:۰۰',
    mentor: 'دکتر سهراب رستگار و نیلوفر فرهادی',
    location: 'نشست برخط (آنلاین) · تالار گفت‌وگوی بوک‌میت',
    shortDescription:
      'بررسی طنز فلسفی میخائیل بولگاکف، تقابل خیر و شر در مسکوی دهه ۱۹۳۰ و تحلیل شخصیت‌پردازی پروفسور ولاند.',
    bookIntroduction:
      '«مرشد و مارگاریتا» اثر درخشان میخائیل بولگاکف، ترکیبی شگفت‌انگیز از طنز گروتسک، فلسفه اخلاق، تاریخ و عاشقانه‌ای جاودان است که در دو بستر موازی مسکوی دهه ۱۹۳۰ و اورشلیم عصر پونتیوس پیلاتوس جریان می‌یابد.',
    fullDescription: [
      'در این نشست تخصصی، ساختار «رمان در رمان» اثر بولگاکف را کالبدشکافی می‌کنیم و به این پرسش بنیادین می‌پردازیم که چرا ورود پروفسور ولاند و دستیارانش به مسکو، نقاب از چهره جامعه بوروکراتیک و ریاکار آن دوران برمی‌دارد.',
      'همچنین مفهوم جمله مشهور «دست‌نوشته‌ها نمی‌سوزند» و جایگاه آزادی هنر و شجاعت اخلاقی در شخصیت‌های مرشد، مارگاریتا و پونتیوس پیلاتوس با مشارکت اعضا بررسی خواهد شد.',
    ],
    sessionsList: [
      {
        sessionNumber: 'جلسه اول',
        title: 'مباحثه در پارک پاتریارخ و آغاز روایت پونتیوس پیلاتوس',
        dateLabel: '۱۹ آبان ۱۴۰۵',
        timeLabel: '۱۹:۰۰ تا ۲۱:۰۰',
        pagesToRead: 'صفحات ۱ تا ۱۷۰ (بخش اول رمان)',
        status: 'برگزار شده',
      },
      {
        sessionNumber: 'جلسه دوم',
        title: 'تئاتر واریته، ورود مارگاریتا و دست‌نوشته‌هایی که نمی‌سوزند',
        dateLabel: '۲۶ آبان ۱۴۰۵',
        timeLabel: '۱۹:۰۰ تا ۲۱:۰۰',
        pagesToRead: 'صفحات ۱۷۱ تا ۳۴۰',
        status: 'نشست پیش رو',
      },
      {
        sessionNumber: 'جلسه سوم',
        title: 'جشن بزرگ بهار، پرواز مارگاریتا و رستگاری ابدی مرشد',
        dateLabel: '۳ آذر ۱۴۰۵',
        timeLabel: '۱۹:۰۰ تا ۲۱:۰۰',
        pagesToRead: 'صفحات ۳۴۱ تا ۵۱۲ (تا پایان کتاب)',
        status: 'نشست پیش رو',
      },
    ],
    comments: [
      {
        id: 503,
        authorName: 'مهسا تاجیک',
        roleLabel: 'عضو باشگاه بوک‌میت',
        dateLabel: '۱۱ آبان ۱۴۰۵',
        rating: 5,
        commentText:
          'بررسی موازی فصل‌های مسکو و اورشلیم در این نشست باعث شد لایه‌های فلسفی و تاریخی کتاب را بسیار دقیق‌تر درک کنم.',
      },
    ],
  },
  {
    id: 3,
    title: 'کارگاه عملی حاشیه‌نویسی و خوانش خلاق متون داستانی',
    bookTitle: 'هنر داستان‌نویسی و روایت‌شناسی کاربردی',
    bookAuthor: 'ای. ام. فورستر',
    bookTranslator: 'ابراهیم یونسی',
    publisher: 'نشر چشمه',
    pagesCount: 250,
    publicationYear: 1927,
    coverUrl: '/assets/blog-3.png',
    dateLabel: 'دوشنبه ۲۹ آبان ۱۴۰۵',
    timeLabel: 'ساعت ۱۷:۳۰ تا ۱۹:۳۰',
    mentor: 'آرمان کاظمی',
    location: 'نشست حضوری · اتاق مطالعه باشگاه بوک‌میت',
    shortDescription:
      'آموزش شیوه‌های یادداشت‌برداری تحلیلی، ثبت تداعی‌های فردی هنگام مطالعه رمان و آماده‌سازی جستارهای نقد ادبی.',
    bookIntroduction:
      'این کارگاه بر پایه کتاب کلاسیک «جنبه‌های رمان» اثر ای. ام. فورستر و گزیده‌ای از متون روایت‌شناسی مدرن طراحی شده است تا خوانندگان را از مطالعه منفعل به خوانشگرانی خلاق و منتقد تبدیل کند.',
    fullDescription: [
      'بسیاری از دوستداران کتاب پس از پایان مطالعه یک رمان، دغدغه ثبت برداشت‌ها و تبدیل تجربیات خوانش خود به یک یادداشت تحلیلی منسجم را دارند. در این کارگاه عملی، روش‌های حرفه‌ای حاشیه‌نویسی، کدگذاری موتیف‌ها و ترسیم نقشه روابط شخصیت‌ها را تمرین می‌کنیم.',
      'در پایان هر نشست، شرکت‌کنندگان یک جستار کوتاه ۵۰۰ کلمه‌ای درباره فصل مورد بررسی می‌نویسند و بازخورد تخصصی دریافت می‌کنند.',
    ],
    sessionsList: [
      {
        sessionNumber: 'جلسه اول',
        title: 'تفاوت داستان و پیرنگ؛ چگونه گره‌های روایت را علامت‌گذاری کنیم؟',
        dateLabel: '۱۵ آبان ۱۴۰۵',
        timeLabel: '۱۷:۳۰ تا ۱۹:۳۰',
        pagesToRead: 'فصل اول و دوم کتاب جنبه‌های رمان (صفحات ۱ تا ۸۵)',
        status: 'برگزار شده',
      },
      {
        sessionNumber: 'جلسه دوم',
        title: 'شخصیت‌های مسطح و جامع و تکنیک ثبت دیالوگ‌های کلیدی',
        dateLabel: '۲۲ آبان ۱۴۰۵',
        timeLabel: '۱۷:۳۰ تا ۱۹:۳۰',
        pagesToRead: 'فصل سوم و چهارم (صفحات ۸۶ تا ۱۷۵)',
        status: 'برگزار شده',
      },
      {
        sessionNumber: 'جلسه سوم',
        title: 'کارگاه عملی نگارش جستار نقد ادبی بر پایه یادداشت‌های حاشیه‌ای',
        dateLabel: '۲۹ آبان ۱۴۰۵',
        timeLabel: '۱۷:۳۰ تا ۱۹:۳۰',
        pagesToRead: 'فصل پنجم تا پایان کتاب (صفحات ۱۷۶ تا ۲۵۰)',
        status: 'نشست پیش رو',
      },
    ],
    comments: [
      {
        id: 504,
        authorName: 'سروش کاوه',
        roleLabel: 'شرکت‌کننده کارگاه',
        dateLabel: '۱۳ آبان ۱۴۰۵',
        rating: 5,
        commentText:
          'روش سه محور کلیدی که آقای کاظمی در جلسه اول آموزش دادند، شیوه کتاب خواندن من را به کل متحول کرد.',
      },
    ],
  },
];

export function buildBookEventDetail(book: LibraryBook): ClubEventDetailItem {
  const matchedPreset = UPCOMING_EVENTS_DATA.find(
    (ev) => ev.bookTitle.trim() === book.title.trim()
  );
  if (matchedPreset) {
    return {
      ...matchedPreset,
      coverUrl: book.cover_url || matchedPreset.coverUrl,
      shortDescription: book.short_description || matchedPreset.shortDescription,
    };
  }

  return {
    id: 100 + book.id,
    title: `حلقه هم‌خوانی و نقد و بررسی رمان «${book.title}»`,
    bookTitle: book.title,
    bookAuthor: book.author,
    bookTranslator: book.translator,
    publisher: 'انتشارات منتخب باشگاه بوک‌میت',
    pagesCount: book.pages_count,
    publicationYear: book.publication_year,
    coverUrl: book.cover_url,
    dateLabel: book.session_schedule || 'چهارشنبه‌ها · آبان و آذر ۱۴۰۵',
    timeLabel: 'ساعت ۱۸:۰۰ تا ۲۰:۰۰',
    mentor: 'دکتر سهراب رستگار',
    location: 'نشست حضوری و برخط · تالار فردوسی خانه بوک‌میت',
    shortDescription: book.short_description,
    bookIntroduction: `${book.short_description} این اثر ارزشمند نوشته ${book.author} و با ترجمه ${book.translator} در قالب ${toPersianDigits(book.pages_count)} صفحه، یکی از آثار برجسته ادبیات ${book.category} در برنامه مطالعاتی باشگاه کتابخوانی بوک‌میت است.`,
    fullDescription: [
      `در سلسله نشست‌های هم‌خوانی کتاب «${book.title}»، اعضای باشگاه بوک‌میت به صورت هفتگی گرد هم می‌آیند تا ساختار روایی، شخصیت‌پردازی، درون‌مایه‌های فلسفی و زمینه تاریخی شکل‌گیری این اثر را مورد بحث و تبادل نظر قرار دهند.`,
      'تمامی اعضای ثبت‌نام‌شده در این دوره به برنامه مطالعه هفتگی، خلاصه مباحث مطرح‌شده در جلسات گذشته و تالار گفت‌وگوی اختصاصی دوره دسترسی خواهند داشت.',
    ],
    sessionsList: [
      {
        sessionNumber: 'جلسه اول',
        title: `معرفی جهان فکری ${book.author} و خوانش فصول آغازین «${book.title}»`,
        dateLabel: '۱۶ آبان ۱۴۰۵',
        timeLabel: '۱۸:۰۰ تا ۲۰:۰۰',
        pagesToRead: `صفحات ۱ تا ${toPersianDigits(Math.round(book.pages_count / 3))}`,
        status: 'برگزار شده',
      },
      {
        sessionNumber: 'جلسه دوم',
        title: `کالبدشکافی پیرنگ، گره‌افکنی و تحول شخصیت‌ها در «${book.title}»`,
        dateLabel: '۲۳ آبان ۱۴۰۵',
        timeLabel: '۱۸:۰۰ تا ۲۰:۰۰',
        pagesToRead: `صفحات ${toPersianDigits(Math.round(book.pages_count / 3) + 1)} تا ${toPersianDigits(Math.round((book.pages_count * 2) / 3))}`,
        status: 'نشست پیش رو',
      },
      {
        sessionNumber: 'جلسه سوم',
        title: `جمع‌بندی نهایی، نقد تطبیقی و گفت‌وگوی آزاد اعضا درباره «${book.title}»`,
        dateLabel: '۳۰ آبان ۱۴۰۵',
        timeLabel: '۱۸:۰۰ تا ۲۰:۰۰',
        pagesToRead: `صفحات ${toPersianDigits(Math.round((book.pages_count * 2) / 3) + 1)} تا ${toPersianDigits(book.pages_count)} (پایان کتاب)`,
        status: 'نشست پیش رو',
      },
    ],
    comments: [
      {
        id: 600 + book.id,
        authorName: 'پرنیا فرهمند',
        roleLabel: 'عضو باشگاه بوک‌میت',
        dateLabel: '۱۱ آبان ۱۴۰۵',
        rating: 5,
        commentText: `انتخاب کتاب «${book.title}» با ترجمه روان ${book.translator} برای هم‌خوانی گروهی بسیار هوشمندانه بود و مباحث جلسات زاویه دید جدیدی به من بخشید.`,
      },
    ],
  };
}

export interface LibrarySectionProps {
  libraryBooks: LibraryBook[];
  onOpenEventDetail?: (eventItem: ClubEventDetailItem) => void;
  onRegisterEvent?: (eventItem: ClubEventDetailItem) => void;
}

export function createLibrarySectionComponent(
  props: LibrarySectionProps
): JQuery<HTMLElement> {
  const initialCurrent =
    props.libraryBooks.find((b) => b.is_current === 1) || props.libraryBooks[0];
  let activeBook = initialCurrent;
  let selectedCategory: 'همه' | 'کلاسیک' | 'معاصر' = 'همه';
  let hasEnteredViewport = false;

  const $section = $(`
    <section
      dir="rtl"
      aria-labelledby="library-section-heading"
      class="w-full max-w-[1140px] mx-auto px-6 sm:px-10 py-16 sm:py-24 border-t border-[#ddd4c0] space-y-16"
    >
      <!-- PART 1: رویدادها و کتاب در حال مطالعه (Connected to #events in Navbar) -->
      <div id="events" class="space-y-10 scroll-mt-24">
        <!-- Section Header -->
        <div class="space-y-3 text-right">
          <div class="text-xs font-medium text-[#755f4b]">
            ۰۳ · رویدادها و کتاب در حال مطالعه باشگاه بوک‌میت
          </div>
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <h2
              id="library-section-heading"
              class="text-[24px] sm:text-[32px] font-bold text-[#38281b] leading-[1.38]"
            >
              کتاب در حال مطالعه و رویدادهای پیش رو
            </h2>
            <p class="text-xs sm:text-sm text-[#695645] max-w-md text-justify" style="text-align: justify; text-justify: inter-word;">
              مروری بر کتاب منتخب این ماه در حلقه‌های هم‌خوانی و نشست‌های پیش روی باشگاه کتابخوانی بوک‌میت.
            </p>
          </div>
        </div>

        <!-- نمایش کتاب در حال مطالعه (Currently Reading Book Showcase) -->
        <div class="js-current-book-container bg-[#e6decb]/65 border border-[#d5cab6] rounded-2xl p-6 sm:p-8 lg:p-10">
        </div>

        <!-- رویدادهای پیش رو (۳ کارت زیر کتاب در حال مطالعه) -->
        <div class="space-y-5">
          <div class="border-b border-[#dbd1bd] pb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 class="text-lg sm:text-xl font-bold text-[#38281b]">
                رویدادهای پیش رو در باشگاه
              </h3>
              <p class="text-xs sm:text-sm text-[#695645] mt-1">
                برنامه سه نشست و کارگاه آتی حلقه‌های مطالعاتی بوک‌میت
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            ${UPCOMING_EVENTS_DATA.slice(0, 3)
              .map(
                (ev) => `
              <article class="bg-[#e6decb]/55 border border-[#d5cab6] hover:border-[#8a725a] rounded-xl p-5 flex flex-col justify-between space-y-4 transition-colors">
                <div class="space-y-3 text-right">
                  <div class="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-[#755f4b] border-b border-[#d8ceba] pb-2.5">
                    <span>${toPersianDigits(ev.dateLabel)}</span>
                    <span>${toPersianDigits(ev.timeLabel)}</span>
                  </div>
                  <h4 class="text-base sm:text-[17px] font-bold text-[#38281b] leading-[1.55] text-justify">
                    ${toPersianDigits(ev.title)}
                  </h4>
                  <p class="text-[13px] leading-[1.9] text-[#4e3e30] font-normal text-justify" style="text-align: justify; text-justify: inter-word;">
                    ${toPersianDigits(ev.shortDescription)}
                  </p>
                </div>
                <div class="pt-3 border-t border-[#d8ceba] space-y-3 text-xs text-[#5f4d3d]">
                  <div class="space-y-1.5">
                    <div>تسهیل‌گر: <strong class="text-[#38281b]">${toPersianDigits(ev.mentor)}</strong></div>
                    <div>محل برگزاری: <span class="text-[#4e3e30]">${toPersianDigits(ev.location)}</span></div>
                  </div>
                  <!-- Action Buttons: مشاهده جزئیات & ثبت‌نام -->
                  <div class="pt-2 border-t border-[#ded4c1] grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      data-event-id="${ev.id}"
                      class="js-event-detail-btn px-3 py-2.5 rounded-lg border border-[#7c624a] text-[#38281b] hover:bg-[#dfd5c0] text-xs font-semibold text-center transition-colors cursor-pointer"
                    >
                      مشاهده جزئیات
                    </button>
                    <button
                      type="button"
                      data-event-id="${ev.id}"
                      class="js-event-register-btn px-3 py-2.5 rounded-lg bg-[#3e2d1f] hover:bg-[#2b1e14] text-[#faf6ec] text-xs font-semibold text-center transition-colors cursor-pointer"
                    >
                      ثبت‌نام در نشست
                    </button>
                  </div>
                </div>
              </article>
            `
              )
              .join('')}
          </div>
        </div>
      </div>

      <!-- PART 2: کتابخانه و نمایش کتاب‌های اخیر معرفی‌شده (Connected to #library in Navbar) -->
      <div id="library" class="space-y-6 pt-6 border-t border-[#ddd4c0] scroll-mt-24">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#dbd1bd] pb-4">
          <div>
            <h3 class="text-lg sm:text-xl font-bold text-[#38281b]">
              کتابخانه و کتاب‌های اخیر معرفی‌شده در باشگاه
            </h3>
            <p class="text-xs sm:text-sm text-[#695645] mt-1 text-justify" style="text-align: justify; text-justify: inter-word;">
              آثاری که در دوره‌های گذشته توسط اعضای باشگاه مطالعه و تحلیل شده‌اند.
            </p>
          </div>

          <!-- Interactive Category Filter Tabs -->
          <div class="flex items-center gap-1 p-1 bg-[#dfd6c2] rounded-lg self-start sm:self-auto">
            <button
              type="button"
              data-cat="همه"
              class="js-lib-filter px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer bg-[#faf6ec] text-[#23180f] shadow-xs"
            >
              همه آثار
            </button>
            <button
              type="button"
              data-cat="کلاسیک"
              class="js-lib-filter px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer text-[#5c4b3c] hover:text-[#23180f]"
            >
              ادبیات کلاسیک
            </button>
            <button
              type="button"
              data-cat="معاصر"
              class="js-lib-filter px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer text-[#5c4b3c] hover:text-[#23180f]"
            >
              ادبیات معاصر
            </button>
          </div>
        </div>

        <div class="js-recent-books-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        </div>
      </div>
    </section>
  `);

  const $currentContainer = $section.find('.js-current-book-container');
  const $recentGrid = $section.find('.js-recent-books-grid');

  function animateProgressBar(targetPercent: number) {
    const $bar = $currentContainer.find('.js-reading-progress-bar');
    const $label = $currentContainer.find('.js-reading-progress-text');

    $bar.stop(true, true).css('width', '0%');
    $label.text(`پیشرفت هم‌خوانی: ${toPersianDigits(0)}٪`);

    $({ pct: 0 })
      .stop(true, true)
      .animate(
        { pct: targetPercent },
        {
          duration: 1450,
          easing: 'swing',
          step(now) {
            const current = Math.round(now);
            $bar.css('width', `${current}%`);
            $label.text(`پیشرفت هم‌خوانی: ${toPersianDigits(current)}٪`);
          },
          complete() {
            $bar.css('width', `${targetPercent}%`);
            $label.text(`پیشرفت هم‌خوانی: ${toPersianDigits(targetPercent)}٪`);
          },
        }
      );
  }

  function renderCurrentBook(book: LibraryBook | undefined, shouldAnimateNow = false) {
    $currentContainer.empty();
    if (!book) {
      $currentContainer.append(`
        <div class="py-10 px-6 text-center text-sm text-[#6b5643]">
          هنوز کتابی برای دوره هم‌خوانی جاری در دیتابیس ثبت نشده است.
        </div>
      `);
      return;
    }

    const statusLabel =
      book.is_current === 1
        ? 'کتاب در حال مطالعه این ماه'
        : 'مرور شناسنامه و چکیده کتاب';

    const $card = $(`
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
        <!-- Right Column in RTL: Book Cover Showcase -->
        <div class="lg:col-span-4 flex flex-col">
          <div class="relative w-full h-full min-h-[290px] sm:min-h-[340px] rounded-xl overflow-hidden border border-[#d0c3ac] bg-[#dfd6c1] flex items-center justify-center group">
            <img
              src="${book.cover_url}"
              alt="${toPersianDigits(book.title)} — ${toPersianDigits(book.author)}"
              referrerpolicy="no-referrer"
              class="js-current-cover-img w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
        </div>

        <!-- Left Column in RTL: Book Details, Justified Short Description, Animated Progress & Action Buttons -->
        <div class="lg:col-span-8 flex flex-col justify-between text-right space-y-6">
          <div class="space-y-3">
            <!-- Unboxed Metadata Kicker -->
            <div class="flex flex-wrap items-center gap-2 text-xs font-medium text-[#755f4b]">
              <span>${statusLabel}</span>
              <span aria-hidden="true">·</span>
              <span>ادبیات ${toPersianDigits(book.category)}</span>
              <span aria-hidden="true">·</span>
              <span class="tabular-nums">سال انتشار ${toPersianDigits(book.publication_year)}</span>
            </div>

            <div>
              <h3 class="text-[22px] sm:text-[28px] font-bold text-[#38281b] leading-[1.35]">
                ${toPersianDigits(book.title)}
              </h3>
              <div class="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#5f4d3d] mt-1">
                <span>نویسنده: ${toPersianDigits(book.author)}</span>
                <span aria-hidden="true">·</span>
                <span>ترجمه: ${toPersianDigits(book.translator)}</span>
                <span aria-hidden="true">·</span>
                <span class="tabular-nums">${toPersianDigits(book.pages_count)} صفحه</span>
              </div>
            </div>

            <p
              class="pt-2 text-[14.5px] sm:text-[15.5px] leading-[2.05] text-[#4e3e30] font-normal text-justify"
              style="text-align: justify; text-justify: inter-word;"
            >
              ${toPersianDigits(book.short_description)}
            </p>
          </div>

          <!-- Group Reading Progress & Action Buttons -->
          <div class="pt-5 border-t border-[#d6cbb7] space-y-4">
            <div class="space-y-2.5">
              <div class="flex items-center justify-between text-xs font-medium text-[#4a392b]">
                <span>${toPersianDigits(book.session_schedule)}</span>
                <span class="js-reading-progress-text tabular-nums font-bold text-[#38281b]">
                  پیشرفت هم‌خوانی: ۰٪
                </span>
              </div>

              <div class="w-full h-2.5 bg-[#d5cab6] rounded-full overflow-hidden">
                <div
                  class="js-reading-progress-bar h-full bg-[#3e2d1f] rounded-full"
                  style="width: 0%;"
                ></div>
              </div>
            </div>

            <!-- Action Buttons on Currently Reading Book: مشاهده جزئیات & ثبت‌نام -->
            <div class="pt-2 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                class="js-current-book-detail-btn px-5 py-2.5 rounded-xl border border-[#7c624a] text-[#38281b] hover:bg-[#dfd5c0] text-xs sm:text-[13px] font-semibold transition-colors cursor-pointer"
              >
                مشاهده جزئیات نشست و معرفی کتاب
              </button>
              <button
                type="button"
                class="js-current-book-register-btn px-6 py-2.5 rounded-xl bg-[#3e2d1f] hover:bg-[#2b1e14] text-[#faf6ec] text-xs sm:text-[13px] font-semibold transition-colors cursor-pointer"
              >
                ثبت‌نام در دوره هم‌خوانی این کتاب
              </button>
            </div>
          </div>
        </div>
      </div>
    `);

    $card.find('.js-current-book-detail-btn').on('click', () => {
      if (props.onOpenEventDetail) {
        props.onOpenEventDetail(buildBookEventDetail(book));
      }
    });

    $card.find('.js-current-book-register-btn').on('click', () => {
      if (props.onRegisterEvent) {
        props.onRegisterEvent(buildBookEventDetail(book));
      }
    });

    $currentContainer.append($card);

    if (shouldAnimateNow || hasEnteredViewport) {
      animateProgressBar(book.reading_progress_percent);
    }
  }

  function renderRecentBooksGrid() {
    $recentGrid.empty();

    const recentBooks = props.libraryBooks.filter((b) => {
      const isRecent = b.is_current === 0;
      const matchesCat =
        selectedCategory === 'همه' || b.category === selectedCategory;
      return isRecent && matchesCat;
    });

    if (recentBooks.length === 0) {
      $recentGrid.append(`
        <div class="col-span-full bg-[#e6decb]/45 border border-[#d5cab6] rounded-xl p-8 text-center text-sm text-[#6b5643]">
          هنوز کتابی در آرشیو کتابخانه باشگاه ثبت نشده است.
        </div>
      `);
      return;
    }

    recentBooks.forEach((book) => {
      const isInspecting = activeBook?.id === book.id;
      const $item = $(`
        <article
          class="bg-[#e6decb]/55 border ${
            isInspecting ? 'border-[#3e2d1f]' : 'border-[#d5cab6]'
          } rounded-xl p-4 flex flex-col justify-between space-y-4 transition-colors hover:border-[#8a725a]"
        >
          <div class="space-y-3.5">
            <!-- Cover Thumbnail -->
            <div class="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-[#dfd6c1] border border-[#d2c5ae]">
              <img
                src="${book.cover_url}"
                alt="${toPersianDigits(book.title)} — ${toPersianDigits(book.author)}"
                referrerpolicy="no-referrer"
                class="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.03]"
              />
            </div>

            <!-- Unboxed Metadata -->
            <div class="space-y-1 text-right">
              <div class="flex items-center gap-1.5 text-[11.5px] text-[#755f4b]">
                <span>${toPersianDigits(book.author)}</span>
                <span aria-hidden="true">·</span>
                <span>ترجمه ${toPersianDigits(book.translator)}</span>
              </div>

              <h4 class="text-base font-bold text-[#38281b] leading-snug">
                ${toPersianDigits(book.title)}
              </h4>
            </div>

            <!-- Justified Short Description -->
            <p
              class="text-[13px] leading-[1.9] text-[#4e3e30] font-normal text-justify"
              style="text-align: justify; text-justify: inter-word;"
            >
              ${toPersianDigits(book.short_description)}
            </p>
          </div>

          <div class="pt-3 border-t border-[#d8ceba] flex items-center justify-between gap-2 text-xs">
            <span class="text-[#695645] tabular-nums">
              ${toPersianDigits(book.pages_count)} صفحه · چاپ ${toPersianDigits(book.publication_year)}
            </span>
            <button
              type="button"
              class="js-inspect-book text-xs font-semibold text-[#3d2c1e] hover:text-[#23180f] underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
            >
              نمایش در قاب اصلی
            </button>
          </div>
        </article>
      `);

      $item.find('.js-inspect-book').on('click', () => {
        activeBook = book;
        renderCurrentBook(activeBook, true);
        renderRecentBooksGrid();
      });

      $recentGrid.append($item);
    });
  }

  // Wire Upcoming Events Action Buttons
  $section.on('click', '.js-event-detail-btn', function () {
    const id = Number($(this).attr('data-event-id'));
    const found = UPCOMING_EVENTS_DATA.find((e) => e.id === id);
    if (found && props.onOpenEventDetail) {
      props.onOpenEventDetail(found);
    }
  });

  $section.on('click', '.js-event-register-btn', function () {
    const id = Number($(this).attr('data-event-id'));
    const found = UPCOMING_EVENTS_DATA.find((e) => e.id === id);
    if (found && props.onRegisterEvent) {
      props.onRegisterEvent(found);
    }
  });

  // Wire Category Filter Buttons
  $section.find('.js-lib-filter').on('click', function () {
    const cat = $(this).attr('data-cat') as 'همه' | 'کلاسیک' | 'معاصر';
    selectedCategory = cat;

    $section
      .find('.js-lib-filter')
      .removeClass('bg-[#faf6ec] text-[#23180f] shadow-xs')
      .addClass('text-[#5c4b3c]');

    $(this)
      .removeClass('text-[#5c4b3c]')
      .addClass('bg-[#faf6ec] text-[#23180f] shadow-xs');

    renderRecentBooksGrid();
  });

  renderCurrentBook(activeBook, false);
  renderRecentBooksGrid();

  // Trigger progress bar motion graphic when section enters viewport
  const sectionEl = $section[0];
  if (sectionEl && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasEnteredViewport) {
            hasEnteredViewport = true;
            if (activeBook) {
              animateProgressBar(activeBook.reading_progress_percent);
            }
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(sectionEl);
  } else {
    hasEnteredViewport = true;
    window.setTimeout(() => {
      if (activeBook) {
        animateProgressBar(activeBook.reading_progress_percent);
      }
    }, 350);
  }

  return $section;
}
