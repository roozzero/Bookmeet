import $ from 'jquery';
import { toPersianDigits } from '../utils/persianNumbers.ts';

export interface RussianCourseCard {
  id: number;
  title: string;
  level: string;
  instructor: string;
  schedule: string;
  sessionsCount: string;
  coverUrl: string;
  description: string;
}

export function createCoursesSectionComponent(): JQuery<HTMLElement> {
  const russianCourses: RussianCourseCard[] = [
    {
      id: 1,
      title: 'دوره آموزش زبان روسی — سطح پایه و مقدماتی (A1–A2)',
      level: 'مقدماتی (A1–A2)',
      instructor: 'دکتر آناستازیا رادین و سهراب رستگار',
      schedule: 'یکشنبه‌ها و سه‌شنبه‌ها · ساعت ۱۷:۳۰ تا ۱۹:۰۰',
      sessionsCount: '۱۲ جلسه آموزشی',
      coverUrl: '/assets/blog-1.png',
      description:
        'آشنایی گام‌به‌گام با الفبای سیریلیک، اصول آواشناسی و تلفظ معیار روسی، ساخت جملات پایه، مکالمات روزمره و درک ساختارهای بنیادین دستور زبان روسی برای علاقه‌مندان به فرهنگ و ادبیات روسیه.',
    },
    {
      id: 2,
      title: 'دوره مکالمه و دستور زبان روسی — سطح متوسطه (B1–B2)',
      level: 'متوسطه (B1–B2)',
      instructor: 'دکتر آناستازیا رادین',
      schedule: 'دوشنبه‌ها و چهارشنبه‌ها · ساعت ۱۸:۰۰ تا ۱۹:۳۰',
      sessionsCount: '۱۴ جلسه آموزشی',
      coverUrl: '/assets/blog-2.png',
      description:
        'گسترش دایره واژگان کاربردی و فرهنگی، تسلط بر حالت‌های اسمی (پادِژها) و افعال حرکتی زبان روسی، تقویت مهارت گفت‌وگوی روان و خوانش داستان‌های کوتاه معاصر به زبان اصلی.',
    },
    {
      id: 3,
      title: 'دوره تخصصی خوانش متون ادبی به زبان روسی (ویژه آثار کلاسیک)',
      level: 'پیشرفته و تخصصی (C1)',
      instructor: 'دکتر سهراب رستگار',
      schedule: 'پنج‌شنبه‌ها · ساعت ۱۶:۳۰ تا ۱۸:۳۰',
      sessionsCount: '۱۰ جلسه تخصصی',
      coverUrl: '/assets/blog-3.png',
      description:
        'خوانش دقیق و تحلیل زبانی و زیبایی‌شناختی گزیده‌ای از شاهکارهای داستایفسکی، چخوف، تولستوی و بولگاکف به زبان روسی همراه با کارگاه عملی ترجمه ادبی و بررسی ظرایف سبک‌شناختی.',
    },
  ];

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
        ${russianCourses
          .map(
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

            <div class="px-5 pb-5 pt-3 border-t border-[#d8ceba] space-y-1.5 text-xs text-[#5f4d3d]">
              <div>مدرس دوره: <strong class="text-[#38281b]">${toPersianDigits(course.instructor)}</strong></div>
              <div>زمان برگزاری: <span class="text-[#4e3e30]">${toPersianDigits(course.schedule)}</span></div>
            </div>
          </article>
        `
          )
          .join('')}
      </div>
    </section>
  `);

  return $section;
}
