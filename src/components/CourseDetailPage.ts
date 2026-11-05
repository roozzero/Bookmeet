import $ from 'jquery';
import { ApiService } from '../services/api.ts';
import { toPersianDigits } from '../utils/persianNumbers.ts';
import {
  RUSSIAN_COURSES_DATA,
  type CourseAudienceComment,
  type RussianCourseCard,
} from './CoursesSection.ts';

export interface CourseDetailPageProps {
  course: RussianCourseCard;
  onBackToHomeCourses: () => void;
  onSelectCourse: (course: RussianCourseCard) => void;
  onRegisterCourse: (course: RussianCourseCard) => void;
}

export function createCourseDetailPageComponent(
  props: CourseDetailPageProps
): JQuery<HTMLElement> {
  const { course } = props;
  let localComments: CourseAudienceComment[] = [...(course.comments || [])];
  let commentSubmittedMsg = '';

  const $page = $(`
    <main
      dir="rtl"
      aria-label="صفحه جزئیات دوره آموزشی"
      class="w-full max-w-[1140px] mx-auto px-6 sm:px-10 pt-28 pb-20 space-y-12"
    ></main>
  `);

  function render(): void {
    const otherCourses = RUSSIAN_COURSES_DATA.filter((c) => c.id !== course.id);

    $page.html(`
      <!-- Top Breadcrumb & Back Action -->
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-[#d8ceba] pb-4">
        <div class="flex items-center gap-2 text-xs font-medium text-[#6e5a47]">
          <button
            type="button"
            class="js-back-to-courses hover:text-[#23180f] cursor-pointer"
          >
            صفحه اصلی
          </button>
          <span>/</span>
          <button
            type="button"
            class="js-back-to-courses hover:text-[#23180f] cursor-pointer"
          >
            دوره‌های آموزش زبان روسی
          </button>
          <span>/</span>
          <span class="text-[#38281b] font-semibold">${toPersianDigits(course.level)}</span>
        </div>

        <button
          type="button"
          class="js-back-to-courses inline-flex items-center gap-1.5 text-xs font-semibold text-[#4e3d2e] hover:text-[#23180f] cursor-pointer"
        >
          <span>→</span>
          <span>بازگشت به بخش دوره‌ها</span>
        </button>
      </div>

      <!-- Hero Banner & Course Overview -->
      <section class="bg-[#e6decb]/65 border border-[#d5cab6] rounded-2xl p-6 sm:p-8 lg:p-10">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <!-- Cover Image -->
          <div class="lg:col-span-5 flex flex-col">
            <div class="relative w-full h-full min-h-[260px] sm:min-h-[320px] rounded-xl overflow-hidden border border-[#d0c3ac] bg-[#dfd6c1]">
              <img
                src="${course.coverUrl}"
                alt="${toPersianDigits(course.title)}"
                referrerpolicy="no-referrer"
                class="w-full h-full object-cover"
              />
            </div>
          </div>

          <!-- Key Specifications & Register CTA -->
          <div class="lg:col-span-7 flex flex-col justify-between space-y-6 text-right">
            <div class="space-y-3">
              <div class="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#755f4b]">
                <span>دوره تخصصی زبان روسی</span>
                <span>·</span>
                <span>سطح ${toPersianDigits(course.level)}</span>
                <span>·</span>
                <span>${toPersianDigits(course.sessionsCount)}</span>
              </div>

              <h1 class="text-[22px] sm:text-[28px] font-bold text-[#38281b] leading-[1.45]">
                ${toPersianDigits(course.title)}
              </h1>

              <p
                class="text-[14px] sm:text-[15px] leading-[2] text-[#4e3e30] text-justify"
                style="text-align: justify; text-justify: inter-word;"
              >
                ${toPersianDigits(course.description)}
              </p>
            </div>

            <!-- Course Specifications Grid (مشخصات دوره، زمان شروع و پایان، مدت دوره) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4 border-t border-[#d6cbb7] text-xs sm:text-[13px]">
              <div class="p-3.5 rounded-xl bg-[#faf6ec]/75 border border-[#dbcfba]">
                <span class="text-[#755f4b] block mb-1">مدرس دوره:</span>
                <strong class="text-[#38281b] font-bold">${toPersianDigits(course.instructor)}</strong>
              </div>
              <div class="p-3.5 rounded-xl bg-[#faf6ec]/75 border border-[#dbcfba]">
                <span class="text-[#755f4b] block mb-1">زمان برگزاری هفتگی:</span>
                <strong class="text-[#38281b] font-bold">${toPersianDigits(course.schedule)}</strong>
              </div>
              <div class="p-3.5 rounded-xl bg-[#faf6ec]/75 border border-[#dbcfba]">
                <span class="text-[#755f4b] block mb-1">زمان شروع و پایان دوره:</span>
                <strong class="text-[#38281b] font-bold">شروع: ${toPersianDigits(course.startDate)} — پایان: ${toPersianDigits(course.endDate)}</strong>
              </div>
              <div class="p-3.5 rounded-xl bg-[#faf6ec]/75 border border-[#dbcfba]">
                <span class="text-[#755f4b] block mb-1">مدت دوره:</span>
                <strong class="text-[#38281b] font-bold">${toPersianDigits(course.duration)}</strong>
              </div>
              <div class="p-3.5 rounded-xl bg-[#faf6ec]/75 border border-[#dbcfba]">
                <span class="text-[#755f4b] block mb-1">منبع و محور آموزشی:</span>
                <strong class="text-[#38281b] font-bold">${toPersianDigits(course.bookTitle)}</strong>
              </div>
              <div class="p-3.5 rounded-xl bg-[#faf6ec]/75 border border-[#dbcfba]">
                <span class="text-[#755f4b] block mb-1">شیوه برگزاری و ظرفیت:</span>
                <strong class="text-[#38281b] font-bold">${toPersianDigits(course.formatLabel)}</strong>
              </div>
            </div>

            <!-- Primary CTA -->
            <div class="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[#d6cbb7]">
              <div class="text-xs text-[#5f4d3d] leading-relaxed">
                پس از ثبت‌نام، دوره در بخش <strong class="text-[#38281b]">«کلاس‌های من»</strong> در پنل کاربری شما ایجاد می‌شود و پس از تایید دبیرخانه فعال خواهد شد.
              </div>
              <button
                type="button"
                class="js-detail-register-course px-7 py-3 rounded-xl bg-[#3e2d1f] hover:bg-[#291d13] text-[#faf6ec] text-sm font-semibold transition-colors cursor-pointer shrink-0"
              >
                ثبت‌نام در این دوره
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Full Course Description (توضیحات کامل دوره) -->
      <section class="bg-[#e6decb]/45 border border-[#d5cab6] rounded-2xl p-6 sm:p-8 space-y-4">
        <h2 class="text-lg sm:text-xl font-bold text-[#38281b] border-b border-[#d8ceba] pb-3">
          توضیحات کامل و اهداف آموزشی دوره
        </h2>
        <div class="space-y-4 text-[14px] sm:text-[15px] leading-[2.05] text-[#4e3e30] text-justify">
          ${course.fullDescription
            .map(
              (para) => `
            <p style="text-align: justify; text-justify: inter-word;">
              ${toPersianDigits(para)}
            </p>
          `
            )
            .join('')}
        </div>
      </section>

      <!-- Course Syllabus (سرفصل‌های دوره) -->
      <section class="space-y-5">
        <div class="border-b border-[#d8ceba] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 class="text-lg sm:text-xl font-bold text-[#38281b]">
              سرفصل‌ها و برنامه آموزشی جلسات دوره
            </h2>
            <p class="text-xs sm:text-sm text-[#695645] mt-1">
              روند گام‌به‌گام مباحث آموزشی در طول ${toPersianDigits(course.sessionsCount)}
            </p>
          </div>
          <span class="text-xs font-semibold text-[#5a3a22]">
            شروع از ${toPersianDigits(course.startDate)} تا ${toPersianDigits(course.endDate)}
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          ${course.syllabus
            .map(
              (item) => `
            <article class="bg-[#e6decb]/55 border border-[#d5cab6] rounded-xl p-5 space-y-3">
              <div class="flex items-center justify-between gap-2 border-b border-[#d8ceba] pb-2.5 text-xs font-semibold text-[#6e5641]">
                <span>${toPersianDigits(item.moduleNumber)}</span>
                <span>${toPersianDigits(item.sessionsRange)}</span>
              </div>
              <h3 class="text-base font-bold text-[#38281b]">
                ${toPersianDigits(item.title)}
              </h3>
              <ul class="space-y-2 text-[13px] text-[#4e3e30] leading-[1.85]">
                ${item.topics
                  .map(
                    (topic) => `
                  <li class="flex items-start gap-2">
                    <span class="text-[#755f4b] font-bold mt-0.5">•</span>
                    <span>${toPersianDigits(topic)}</span>
                  </li>
                `
                  )
                  .join('')}
              </ul>
            </article>
          `
            )
            .join('')}
        </div>
      </section>

      <!-- Audience Comments Section (نظرات مخاطبان) -->
      <section class="bg-[#e6decb]/55 border border-[#d5cab6] rounded-2xl p-6 sm:p-8 space-y-6">
        <div class="border-b border-[#d8ceba] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 class="text-lg sm:text-xl font-bold text-[#38281b]">
              نظرات مخاطبان و شرکت‌کنندگان دوره
            </h2>
            <p class="text-xs sm:text-sm text-[#695645] mt-1">
              تجربه زبان‌آموزان و اعضای باشگاه کتابخوانی بوک‌میت از شرکت در این دوره
            </p>
          </div>
          <span class="text-xs font-semibold text-[#5a3a22]">
            ${toPersianDigits(localComments.length)} دیدگاه ثبت‌شده
          </span>
        </div>

        <!-- Existing Comments List -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${localComments
            .map(
              (c) => `
            <article class="p-4 sm:p-5 rounded-xl bg-[#faf6ec]/80 border border-[#dbcfba] space-y-2.5">
              <div class="flex items-center justify-between gap-2">
                <div>
                  <strong class="text-sm font-bold text-[#38281b] block">${toPersianDigits(c.authorName)}</strong>
                  <span class="text-[11px] text-[#755f4b]">${toPersianDigits(c.roleLabel)}</span>
                </div>
                <div class="text-left">
                  <div class="text-xs text-[#8c5a2b] font-bold">${'★'.repeat(c.rating)}</div>
                  <span class="text-[11px] text-[#755f4b]">${toPersianDigits(c.dateLabel)}</span>
                </div>
              </div>
              <p class="text-[13px] leading-[1.9] text-[#4e3e30] text-justify" style="text-align: justify; text-justify: inter-word;">
                ${toPersianDigits(c.commentText)}
              </p>
            </article>
          `
            )
            .join('')}
        </div>

        <!-- Add Comment Form -->
        <form class="js-course-comment-form pt-4 border-t border-[#d8ceba] space-y-4">
          <h3 class="text-sm sm:text-base font-bold text-[#38281b]">
            ثبت دیدگاه یا پرسش درباره این دوره
          </h3>
          ${
            commentSubmittedMsg
              ? `<div class="p-3 rounded-xl bg-[#e4f2e7] border border-[#bbd9c2] text-[#235332] text-xs font-semibold">${toPersianDigits(commentSubmittedMsg)}</div>`
              : ''
          }
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-[#4e3e30] mb-1">نام و نام خانوادگی *</label>
              <input
                type="text"
                name="author_name"
                required
                placeholder="نام خود را وارد کنید..."
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#faf6ec] border border-[#d5cab6] text-xs text-[#231912] focus:outline-none focus:border-[#755f4b]"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-[#4e3e30] mb-1">امتیاز شما به دوره</label>
              <select
                name="rating"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#faf6ec] border border-[#d5cab6] text-xs text-[#231912] focus:outline-none focus:border-[#755f4b]"
              >
                <option value="5">۵ ستاره (عالی)</option>
                <option value="4">۴ ستاره (خوب)</option>
                <option value="3">۳ ستاره (متوسط)</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-[#4e3e30] mb-1">متن دیدگاه یا پرسش *</label>
            <textarea
              name="comment_text"
              rows="3"
              required
              placeholder="دیدگاه یا تجربه خود را درباره این دوره بنویسید..."
              class="w-full px-3.5 py-2.5 rounded-xl bg-[#faf6ec] border border-[#d5cab6] text-xs text-[#231912] focus:outline-none focus:border-[#755f4b]"
            ></textarea>
          </div>
          <div class="flex justify-end">
            <button
              type="submit"
              class="px-5 py-2.5 rounded-xl bg-[#3e2d1f] hover:bg-[#2a1d13] text-[#faf6ec] text-xs font-semibold cursor-pointer"
            >
              ثبت دیدگاه
            </button>
          </div>
        </form>
      </section>

      <!-- Other Courses -->
      <section class="space-y-4 pt-4 border-t border-[#d8ceba]">
        <h3 class="text-base sm:text-lg font-bold text-[#38281b]">
          سایر دوره‌های آموزش زبان روسی در باشگاه بوک‌میت
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          ${otherCourses
            .map(
              (oc) => `
            <div class="p-4 rounded-xl bg-[#e6decb]/45 border border-[#d5cab6] flex items-center justify-between gap-4">
              <div class="min-w-0">
                <div class="text-xs text-[#755f4b]">سطح ${toPersianDigits(oc.level)}</div>
                <h4 class="text-sm font-bold text-[#38281b] truncate mt-0.5">${toPersianDigits(oc.title)}</h4>
              </div>
              <button
                type="button"
                data-other-course-id="${oc.id}"
                class="js-switch-other-course px-3.5 py-2 rounded-lg border border-[#7c624a] text-xs font-semibold text-[#38281b] hover:bg-[#dfd5c0] shrink-0 cursor-pointer"
              >
                مشاهده جزئیات ←
              </button>
            </div>
          `
            )
            .join('')}
        </div>
      </section>
    `);
  }

  $page.on('click', '.js-back-to-courses', () => {
    props.onBackToHomeCourses();
  });

  $page.on('click', '.js-detail-register-course', () => {
    props.onRegisterCourse(course);
  });

  $page.on('click', '.js-switch-other-course', function () {
    const id = Number($(this).attr('data-other-course-id'));
    const nextCourse = RUSSIAN_COURSES_DATA.find((c) => c.id === id);
    if (nextCourse) {
      props.onSelectCourse(nextCourse);
    }
  });

  $page.on('submit', '.js-course-comment-form', function (e) {
    e.preventDefault();
    const $f = $(this);
    const authorName = String($f.find('[name="author_name"]').val() || '').trim();
    const commentText = String($f.find('[name="comment_text"]').val() || '').trim();
    const rating = Number($f.find('[name="rating"]').val() || 5);
    if (!authorName || !commentText) return;

    const newComment: CourseAudienceComment = {
      id: Date.now(),
      authorName,
      roleLabel: 'مخاطب دوره',
      dateLabel: '۱۴ آبان ۱۴۰۵',
      rating,
      commentText,
    };
    localComments = [newComment, ...localComments];
    commentSubmittedMsg = 'دیدگاه شما با موفقیت ثبت شد و در لیست نظرات قرار گرفت.';

    ApiService.saveAdminComment({
      author_name: authorName,
      target_title: course.title,
      target_type: 'دوره آموزشی',
      rating,
      comment_text: commentText,
      status: 'تایید شده',
    }).catch(() => {
      // already added locally
    });

    render();
  });

  render();
  return $page;
}
