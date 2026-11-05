import $ from 'jquery';
import { toPersianDigits } from '../utils/persianNumbers.ts';

export interface CourseSyllabusItem {
  moduleNumber: string;
  title: string;
  sessionsRange: string;
  topics: string[];
}

export interface CourseAudienceComment {
  id: number;
  authorName: string;
  roleLabel: string;
  dateLabel: string;
  rating: number;
  commentText: string;
}

export interface RussianCourseCard {
  id: number;
  title: string;
  level: string;
  levelLabelForPanel: 'مبتدی' | 'پیشرفته' | 'تخصصی';
  bookTitle: string;
  instructor: string;
  schedule: string;
  startDate: string;
  endDate: string;
  duration: string;
  sessionsCount: string;
  formatLabel: string;
  capacityLabel: string;
  coverUrl: string;
  description: string;
  fullDescription: string[];
  syllabus: CourseSyllabusItem[];
  comments: CourseAudienceComment[];
}

export const RUSSIAN_COURSES_DATA: RussianCourseCard[] = [
  {
    id: 1,
    title: 'دوره آموزش زبان روسی — سطح پایه و مقدماتی (A1–A2)',
    level: 'مقدماتی (A1–A2)',
    levelLabelForPanel: 'مبتدی',
    bookTitle: 'کتاب راه روسیه (Дорога в Россию) + جزوه آواشناسی سیریلیک',
    instructor: 'دکتر آناستازیا رادین و سهراب رستگار',
    schedule: 'یکشنبه‌ها و سه‌شنبه‌ها · ساعت ۱۷:۳۰ تا ۱۹:۰۰',
    startDate: '۲۰ آبان ۱۴۰۵',
    endDate: '۲۸ دی ۱۴۰۵',
    duration: '۱۰ هفته آموزشی (۱۲ جلسه ۹۰ دقیقه‌ای · مجموعاً ۱۸ ساعت)',
    sessionsCount: '۱۲ جلسه آموزشی',
    formatLabel: 'حضوری در خانه بوک‌میت و هم‌زمان برخط (آنلاین)',
    capacityLabel: 'ظرفیت محدود (حداکثر ۱۴ نفر در هر گروه)',
    coverUrl: '/assets/blog-1.png',
    description:
      'آشنایی گام‌به‌گام با الفبای سیریلیک، اصول آواشناسی و تلفظ معیار روسی، ساخت جملات پایه، مکالمات روزمره و درک ساختارهای بنیادین دستور زبان روسی برای علاقه‌مندان به فرهنگ و ادبیات روسیه.',
    fullDescription: [
      'دوره سطح پایه و مقدماتی زبان روسی (A1–A2) در باشگاه کتابخوانی بوک‌میت، با رویکردی فرهنگی و ادبی برای علاقه‌مندانی طراحی شده است که می‌خواهند از نقطه صفر، خواندن، نوشتن و گفت‌وگو به زبان روسی را با تلفظ استاندارد مسکو آغاز کنند.',
      'در طول این دوره ده هفته‌ای، علاوه بر تسلط کامل بر الفبای سیریلیک و خط تحریری روسی (Курсив)، ساختارهای بنیادین دستور زبان شامل جنسیت اسم‌ها، ضمایر، صرف افعال گروه اول و دوم و آشنایی اولیه با نظام حالت‌های اسمی (پادِژها) را در قالب موقعیت‌های واقعی و متون ساده فرهنگی تمرین خواهید کرد.',
    ],
    syllabus: [
      {
        moduleNumber: 'بخش اول',
        title: 'الفبای سیریلیک، آواشناسی و خط تحریری روسی',
        sessionsRange: 'جلسات ۱ تا ۳',
        topics: [
          'آموزش کامل ۳۳ حرف الفبای سیریلیک و رسم‌الخط استاندارد و تحریری',
          'قوانین تکیه‌گذاری (Ударение)، تقلیل واکه‌ها و تلفظ صامت‌های سخت و نرم',
          'عبارات پایه احوال‌پرسی، معرفی خود و خوانش نخستین جملات ساده روسی',
        ],
      },
      {
        moduleNumber: 'بخش دوم',
        title: 'ساختار جمله، جنسیت اسم‌ها و صرف افعال پایه',
        sessionsRange: 'جلسات ۴ تا ۶',
        topics: [
          'تشخیص جنسیت اسم‌ها (مذکر، مؤنث، خنثی) و جمع‌بستن واژگان',
          'ضمایر شخصی و ملکی و ساخت جملات پرسشی و منفی در زبان روسی',
          'صرف افعال پرکاربرد گروه اول و دوم در زمان حال و گذشته',
        ],
      },
      {
        moduleNumber: 'بخش سوم',
        title: 'ورود به نظام حالت‌های اسمی (پادِژها) و مکالمات روزمره',
        sessionsRange: 'جلسات ۷ تا ۹',
        topics: [
          'آشنایی کاربردی با حالت نهادی (Именительный) و حالت مفعولی (Винительный)',
          'حالت دری/مکانی (Предложный падеж) برای بیان مکان و موضوع گفت‌وگو',
          'مکالمه در کتاب‌فروشی، کافه، دانشگاه و توصیف برنامه روزانه',
        ],
      },
      {
        moduleNumber: 'بخش چهارم',
        title: 'خوانش متون ساده ادبی و کارگاه گفت‌وگوی پایانی',
        sessionsRange: 'جلسات ۱۰ تا ۱۲',
        topics: [
          'خوانش گروهی قطعات کوتاه و ساده‌سازی‌شده از ادبیات کلاسیک روسی',
          'آشنایی با اصطلاحات فرهنگی روسیه و آداب خطاب قرار دادن با نام و نام پدری',
          'ارزیابی پایانی، گفت‌وگوی آزاد به زبان روسی و آمادگی ورود به سطح متوسطه',
        ],
      },
    ],
    comments: [
      {
        id: 101,
        authorName: 'پرنیا فرهمند',
        roleLabel: 'عضو حلقه‌های مطالعاتی بوک‌میت',
        dateLabel: '۱۰ آبان ۱۴۰۵',
        rating: 5,
        commentText:
          'آموزش الفبای سیریلیک و تلفظ واژگان توسط دکتر رادین فوق‌العاده دقیق و دلنشین بود. از همان جلسه سوم توانستم نام نویسندگان و عنوان کتاب‌های روسی را به راحتی بخوانم.',
      },
      {
        id: 102,
        authorName: 'امیرحسین نادری',
        roleLabel: 'شرکت‌کننده دوره پاییز',
        dateLabel: '۱۲ آبان ۱۴۰۵',
        rating: 5,
        commentText:
          'ترکیب آموزش زبان با مثال‌هایی از فرهنگ و ادبیات روسیه باعث می‌شود یادگیری گرامر اصلاً خشک و خسته‌کننده نباشد. جزوه‌های دوره بسیار منظم است.',
      },
    ],
  },
  {
    id: 2,
    title: 'دوره مکالمه و دستور زبان روسی — سطح متوسطه (B1–B2)',
    level: 'متوسطه (B1–B2)',
    levelLabelForPanel: 'پیشرفته',
    bookTitle: 'حالت‌های شش‌گانه اسمی (پادِژها)، افعال حرکتی و داستان‌های کوتاه معاصر',
    instructor: 'دکتر آناستازیا رادین',
    schedule: 'دوشنبه‌ها و چهارشنبه‌ها · ساعت ۱۸:۰۰ تا ۱۹:۳۰',
    startDate: '۲۱ آبان ۱۴۰۵',
    endDate: '۶ بهمن ۱۴۰۵',
    duration: '۱۱ هفته آموزشی (۱۴ جلسه ۹۰ دقیقه‌ای · مجموعاً ۲۱ ساعت)',
    sessionsCount: '۱۴ جلسه آموزشی',
    formatLabel: 'حضوری و آنلاین (همراه با کارگاه مکالمه گروهی)',
    capacityLabel: 'ظرفیت محدود (حداکثر ۱۲ نفر)',
    coverUrl: '/assets/blog-2.png',
    description:
      'گسترش دایره واژگان کاربردی و فرهنگی، تسلط بر حالت‌های اسمی (پادِژها) و افعال حرکتی زبان روسی، تقویت مهارت گفت‌وگوی روان و خوانش داستان‌های کوتاه معاصر به زبان اصلی.',
    fullDescription: [
      'این دوره ویژه زبان‌آموزانی است که با الفبای سیریلیک و ساختارهای مقدماتی آشنایی دارند و می‌خواهند بر پیچیدگی‌های شیرین دستور زبان روسی، به‌ویژه شش حالت اسمی (Падежи)، نمود افعال (Виды глагола) و افعال حرکتی (Глаголы движения) مسلط شوند.',
      'در کنار مباحث دستوری، نیمی از زمان هر جلسه به گفت‌وگوی موضوعی، تحلیل شنیداری و خوانش داستان‌های کوتاه از نویسندگان معاصر و کلاسیک روسیه اختصاص دارد تا زبان‌آموزان بتوانند دیدگاه‌های خود را به صورت روان و ساختاریافته بیان کنند.',
    ],
    syllabus: [
      {
        moduleNumber: 'بخش اول',
        title: 'تسلط کامل بر شش حالت اسمی (پادِژها) و صفت‌ها',
        sessionsRange: 'جلسات ۱ تا ۴',
        topics: [
          'مرور جامع و کاربردی حالت‌های اضافی (Родительный)، رایی (Дательный) و ابزاری (Творительный)',
          'صرف صفت‌ها و ضمایر اشاره در تمامی حالت‌های مفرد و جمع',
          'تمرین‌های کاربردی در قالب نگارش پاراگراف‌های توصیفی و تحلیلی',
        ],
      },
      {
        moduleNumber: 'بخش دوم',
        title: 'نمود افعال (کامل و ناکامل) و افعال حرکتی',
        sessionsRange: 'جلسات ۵ تا ۸',
        topics: [
          'درک عمیق تفاوت افعال НСВ و СВ در روایت وقایع گذشته و آینده',
          'افعال حرکتی بدون پیشوند و با پیشوند (идти/ходить, ехать/ездить)',
          'کاربرد افعال حرکتی در اصطلاحات استعاری و روزمره زبان روسی',
        ],
      },
      {
        moduleNumber: 'بخش سوم',
        title: 'جملات مرکب، وجوه شرطی و بیان دیدگاه انتقادی',
        sessionsRange: 'جلسات ۹ تا ۱۱',
        topics: [
          'ساخت جملات پیرو با ضمایر موصولی который و حروف ربط чтобы و если бы',
          'بیان موافقت، مخالفت، تردید و تحلیل شخصیت‌های داستانی به زبان روسی',
          'شنیدن و تحلیل پادکست‌ها و گفتگوهای فرهنگی رادیو فرهنگ روسیه',
        ],
      },
      {
        moduleNumber: 'بخش چهارم',
        title: 'خوانش داستان‌های کوتاه به زبان اصلی و ارائه شفاهی',
        sessionsRange: 'جلسات ۱۲ تا ۱۴',
        topics: [
          'خوانش و بررسی واژگانی دو داستان کوتاه از آنتون چخوف و سرگئی دولاتوف',
          'ارائه شفاهی هر شرکت‌کننده درباره یک اثر ادبی یا موضوع فرهنگی به زبان روسی',
          'جمع‌بندی ساختارهای پیشرفته و آمادگی ورود به دوره تخصصی متون کلاسیک',
        ],
      },
    ],
    comments: [
      {
        id: 201,
        authorName: 'کیانوش معتمدی',
        roleLabel: 'پژوهشگر و عضو باشگاه',
        dateLabel: '۸ آبان ۱۴۰۵',
        rating: 5,
        commentText:
          'مبحث افعال حرکتی و نمود افعال در زبان روسی همیشه برایم چالش‌برانگیز بود، اما با جدول‌های تحلیلی و تمرین‌های مکالمه این دوره کاملاً ملکه ذهنم شد.',
      },
      {
        id: 202,
        authorName: 'سارا احمدی',
        roleLabel: 'مترجم و زبان‌آموز دوره',
        dateLabel: '۱۱ آبان ۱۴۰۵',
        rating: 5,
        commentText:
          'بخش خوانش داستان‌های کوتاه چخوف در جلسات پایانی بی‌نظیر است و اعتمادبه‌نفس فوق‌العاده‌ای برای روبه‌رو شدن با متون اصلی به آدم می‌دهد.',
      },
    ],
  },
  {
    id: 3,
    title: 'دوره تخصصی خوانش متون ادبی به زبان روسی (ویژه آثار کلاسیک)',
    level: 'پیشرفته و تخصصی (C1)',
    levelLabelForPanel: 'تخصصی',
    bookTitle: 'گزیده متون اصلی داستایفسکی، چخوف، تولستوی و بولگاکف',
    instructor: 'دکتر سهراب رستگار',
    schedule: 'پنج‌شنبه‌ها · ساعت ۱۶:۳۰ تا ۱۸:۳۰',
    startDate: '۲۴ آبان ۱۴۰۵',
    endDate: '۲۷ دی ۱۴۰۵',
    duration: '۱۰ هفته تخصصی (۱۰ جلسه ۱۲۰ دقیقه‌ای · مجموعاً ۲۰ ساعت)',
    sessionsCount: '۱۰ جلسه تخصصی',
    formatLabel: 'نشست کارگاهی حضوری و آنلاین',
    capacityLabel: 'ظرفیت ویژه (حداکثر ۱۰ نفر)',
    coverUrl: '/assets/blog-3.png',
    description:
      'خوانش دقیق و تحلیل زبانی و زیبایی‌شناختی گزیده‌ای از شاهکارهای داستایفسکی، چخوف، تولستوی و بولگاکف به زبان روسی همراه با کارگاه عملی ترجمه ادبی و بررسی ظرایف سبک‌شناختی.',
    fullDescription: [
      'این دوره منحصربه‌فرد در باشگاه کتابخوانی بوک‌میت، پلی میان زبان‌آموزی پیشرفته، نقد ادبی و هنر ترجمه است. در این کارگاه ده جلسه‌ای، شرکت‌کنندگان با هدایت دکتر سهراب رستگار، فصول و قطعات برگزیده‌ای از شاهکارهای قرن نوزدهم و بیستم روسیه را مستقیماً به زبان روسی می‌خوانند و کالبدشکافی می‌کنند.',
      'هدف اصلی دوره، درک موسیقی جملات، وجوه بلاغی، واژگان تاریخی و ظرایف سبک‌شناختی نویسندگانی چون داستایفسکی، تولستوی، چخوف و بولگاکف است که در ترجمه به زبان‌های دیگر ناگزیر بخشی از طنین اصلی خود را از دست می‌دهند.',
    ],
    syllabus: [
      {
        moduleNumber: 'بخش اول',
        title: 'نثر نمایشی و ایجاز در داستان‌های آنتون چخوف',
        sessionsRange: 'جلسات ۱ و ۲',
        topics: [
          'خوانش متن اصلی داستان «بانو با سگ ملوس» (Дама с собачкой)',
          'بررسی وجوه وصفی و قیدی (Причастие и Деепричастие) در نثر چخوف',
          'مقایسه تطبیقی متن روسی با ترجمه‌های فارسی موجود',
        ],
      },
      {
        moduleNumber: 'بخش دوم',
        title: 'چندصدایی و نحو پرتلاطم در آثار فئودور داستایفسکی',
        sessionsRange: 'جلسات ۳ تا ۵',
        topics: [
          'خوانش بخش‌هایی از «یادداشت‌های زیرزمینی» و «جنایت و مکافات» به زبان اصلی',
          'تحلیل ذرات تاکیدی (Частицы: ведь, же, уж, -то) در دیالوگ‌های درونی داستایفسکی',
          'کارگاه عملی ترجمه و بازآفرینی لحن عصبی و فلسفی راوی در زبان فارسی',
        ],
      },
      {
        moduleNumber: 'بخش سوم',
        title: 'معماری جملات بلند در نثر حماسی لئو تولستوی',
        sessionsRange: 'جلسات ۶ و ۷',
        topics: [
          'خوانش فصول برگزیده از «آنا کارنینا» و «مرگ ایوان ایلیچ» به زبان روسی',
          'کالبدشکافی ساختار جملات چندلایه و تکرارهای آگاهانه واژگانی در سبک تولستوی',
          'بررسی واژگان اشرافی، تاریخی و اصطلاحات دوره تزاری قرن نوزدهم',
        ],
      },
      {
        moduleNumber: 'بخش چهارم',
        title: 'طنز فلسفی و گروتسک در «مرشد و مارگاریتا» اثر بولگاکف',
        sessionsRange: 'جلسات ۸ تا ۱۰',
        topics: [
          'خوانش فصل اول (پاتریارشی пруды) و فصل گفت‌وگوی پیلاتوس از متن روسی Мастер и Маргарита',
          'بررسی تفاوت لحن مسکوی دهه ۱۹۳۰ با نثر فاخر و باستانی روایت اورشلیم',
          'ارائه پروژه پایانی ترجمه و تحلیل سبک‌شناختی توسط اعضای کارگاه',
        ],
      },
    ],
    comments: [
      {
        id: 301,
        authorName: 'مهسا تاجیک',
        roleLabel: 'پژوهشگر ادبیات تطبیقی',
        dateLabel: '۹ آبان ۱۴۰۵',
        rating: 5,
        commentText:
          'خواندن فصل اول مرشد و مارگاریتا به زبان اصلی روسی و بررسی معادل‌های فارسی آن در کنار دکتر رستگار، یکی از غنی‌ترین تجربه‌های مطالعاتی من در بوک‌میت بود.',
      },
      {
        id: 302,
        authorName: 'فرهاد روزبهانی',
        roleLabel: 'مترجم ادبیات روسی',
        dateLabel: '۱۳ آبان ۱۴۰۵',
        rating: 5,
        commentText:
          'تحلیل ذرات تاکیدی و ضرباهنگ جملات داستایفسکی در این دوره، دید کاملاً تازه‌ای به من برای ترجمه متون کلاسیک روسی داد.',
      },
    ],
  },
];

export interface CoursesSectionProps {
  onOpenCourseDetail?: (course: RussianCourseCard) => void;
  onRegisterCourse?: (course: RussianCourseCard) => void;
}

export function createCoursesSectionComponent(
  props: CoursesSectionProps = {}
): JQuery<HTMLElement> {
  const $section = $(`
    <section
      id="courses"
      dir="rtl"
      aria-labelledby="courses-section-heading"
      class="w-full max-w-[1140px] mx-auto px-6 sm:px-10 py-16 sm:py-24 border-t border-[#ddd4c0] space-y-10 scroll-mt-24"
    >
      <!-- Section Header -->
      <div class="space-y-3 text-right">
        <div class="text-xs font-medium text-[#755f4b]">
          ۰۴ · دوره‌ها و کلاس‌های آموزش زبان روسی باشگاه بوک‌میت
        </div>
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <h2
            id="courses-section-heading"
            class="text-[24px] sm:text-[32px] font-bold text-[#38281b] leading-[1.38]"
          >
            دوره‌های تخصصی آموزش زبان روسی و خوانش متون
          </h2>
          <p class="text-xs sm:text-sm text-[#695645] max-w-md text-justify" style="text-align: justify; text-justify: inter-word;">
            کلاس‌های ترمیک آموزش زبان روسی از سطح پایه تا خوانش شاهکارهای ادبیات کلاسیک روسیه به زبان اصلی در باشگاه کتابخوانی بوک‌میت.
          </p>
        </div>
      </div>

      <!-- 3 Cards per Row Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        ${RUSSIAN_COURSES_DATA.map(
          (course) => `
          <article class="bg-[#e6decb]/55 border border-[#d5cab6] hover:border-[#8a725a] rounded-xl overflow-hidden flex flex-col justify-between transition-colors">
            <div>
              <div class="relative w-full h-48 bg-[#dfd6c1] border-b border-[#d2c5ae] overflow-hidden">
                <img
                  src="${course.coverUrl}"
                  alt="${toPersianDigits(course.title)}"
                  referrerpolicy="no-referrer"
                  class="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                />
              </div>
              <div class="p-5 space-y-3 text-right">
                <div class="flex items-center justify-between gap-2 text-xs font-medium text-[#755f4b]">
                  <span>سطح: ${toPersianDigits(course.level)}</span>
                  <span>${toPersianDigits(course.sessionsCount)}</span>
                </div>
                <h3 class="text-base sm:text-[17px] font-bold text-[#38281b] leading-[1.6] text-justify">
                  ${toPersianDigits(course.title)}
                </h3>
                <p
                  class="text-[13px] leading-[1.9] text-[#4e3e30] font-normal text-justify"
                  style="text-align: justify; text-justify: inter-word;"
                >
                  ${toPersianDigits(course.description)}
                </p>
              </div>
            </div>

            <div class="px-5 pb-5 pt-3 border-t border-[#d8ceba] space-y-3.5 text-xs text-[#5f4d3d]">
              <div class="space-y-1.5">
                <div>مدرس دوره: <strong class="text-[#38281b]">${toPersianDigits(course.instructor)}</strong></div>
                <div>زمان برگزاری: <span class="text-[#4e3e30]">${toPersianDigits(course.schedule)}</span></div>
              </div>

              <!-- Action Buttons: مشاهده جزئیات & ثبت‌نام -->
              <div class="pt-2 border-t border-[#ded4c1] grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  data-course-id="${course.id}"
                  class="js-course-detail-btn px-3 py-2.5 rounded-lg border border-[#7c624a] text-[#38281b] hover:bg-[#dfd5c0] text-xs font-semibold text-center transition-colors cursor-pointer"
                >
                  مشاهده جزئیات
                </button>
                <button
                  type="button"
                  data-course-id="${course.id}"
                  class="js-course-register-btn px-3 py-2.5 rounded-lg bg-[#3e2d1f] hover:bg-[#2b1e14] text-[#faf6ec] text-xs font-semibold text-center transition-colors cursor-pointer"
                >
                  ثبت‌نام در دوره
                </button>
              </div>
            </div>
          </article>
        `
        ).join('')}
      </div>
    </section>
  `);

  $section.on('click', '.js-course-detail-btn', function () {
    const id = Number($(this).attr('data-course-id'));
    const found = RUSSIAN_COURSES_DATA.find((c) => c.id === id);
    if (found && props.onOpenCourseDetail) {
      props.onOpenCourseDetail(found);
    }
  });

  $section.on('click', '.js-course-register-btn', function () {
    const id = Number($(this).attr('data-course-id'));
    const found = RUSSIAN_COURSES_DATA.find((c) => c.id === id);
    if (found && props.onRegisterCourse) {
      props.onRegisterCourse(found);
    }
  });

  return $section;
}
