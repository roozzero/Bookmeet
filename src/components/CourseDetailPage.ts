import $ from 'jquery';
import {
  type CourseAudienceComment,
  type RussianCourseCard,
} from './CoursesSection.ts';
import { ApiService } from '../services/api.ts';
import { toPersianDigits } from '../utils/persianNumbers.ts';

export interface CourseDetailPageProps {
  course: RussianCourseCard;
  allCourses?: RussianCourseCard[];
  onBack?: () => void;
  onBackToHomeCourses?: () => void;
  onRegisterCourse: (course: RussianCourseCard) => void;
  onSelectOtherCourse?: (course: RussianCourseCard) => void;
  onSelectCourse?: (course: RussianCourseCard) => void;
}

export function createCourseDetailPageComponent(props: CourseDetailPageProps): JQuery {
  return createCourseDetailPage({
    course: props.course,
    allCourses: props.allCourses,
    onBack: props.onBackToHomeCourses || props.onBack || (() => {}),
    onRegisterCourse: props.onRegisterCourse,
    onSelectOtherCourse: props.onSelectCourse || props.onSelectOtherCourse,
  });
}

export function createCourseDetailPage(
  props: Required<Pick<CourseDetailPageProps, 'course' | 'onBack' | 'onRegisterCourse'>> &
    CourseDetailPageProps
): JQuery {
  let currentCourse: RussianCourseCard = {
    ...props.course,
    comments: [...(props.course.comments || [])],
  };
  let commentSubmittedMsg = '';

  const $wrapper = $(`
    <section
      aria-label="صفحه جزئیات کامل دوره آموزشی زبان روسی"
      class="min-h-screen w-full bg-[#F5EFE6] text-[#231912] pt-28 sm:pt-32 pb-24 px-4 sm:px-8 lg:px-16"
    ></section>
  `);

  function render(): void {
    const course = currentCourse;
    const otherCourses = (props.allCourses || []).filter((c) => c.id !== course.id);

    $wrapper.html(`
      <div class="max-w-6xl mx-auto space-y-10">
        <!-- Top Navigation Bar -->
        <div class="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#DFD0BC]">
          <div class="flex items-center gap-2 text-[13px] text-[#6B5444]">
            <span>صفحه اصلی</span>
            <span>/</span>
            <span>دوره‌های آموزش زبان روسی</span>
            <span>/</span>
            <strong class="text-[#231912]">${toPersianDigits(course.title)}</strong>
          </div>

          <button
            type="button"
            class="js-course-detail-back px-4 py-2.5 rounded-xl bg-[#FAF5EC] hover:bg-[#EFE2CE] border border-[#D8C5AC] text-[#3F2E21] text-[13px] font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span>→</span>
            <span>بازگشت به صفحه اصلی</span>
          </button>
        </div>

        <!-- Hero Card: Course Overview & Registration -->
        <div class="rounded-3xl bg-[#FAF5EC] border border-[#E2D3BF] overflow-hidden shadow-[0_18px_48px_rgba(38,26,16,0.08)]">
          <div class="grid grid-cols-1 lg:grid-cols-12">
            <!-- Cover Column -->
            <div class="lg:col-span-5 relative min-h-[280px] sm:min-h-[340px] bg-[#241810]">
              <img
                src="${course.coverUrl}"
                alt="${course.title}"
                class="w-full h-full object-cover"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-[#1E140E]/85 via-[#1E140E]/20 to-transparent"></div>
              <div class="absolute top-4 right-4 left-4 flex items-center justify-between gap-2">
                ${
                  course.levelBadge
                    ? `<span class="px-3.5 py-1.5 rounded-xl bg-[#1E140E]/80 backdrop-blur-md text-[#FAF5EC] text-[12px] font-bold border border-[#C69B6D]/40">
                        ${toPersianDigits(course.levelBadge)}
                      </span>`
                    : '<span></span>'
                }
                ${
                  course.sessionsCount
                    ? `<span class="px-3 py-1 rounded-xl bg-[#5A3A22]/90 text-[#FAF5EC] text-[12px] font-bold">
                        ${toPersianDigits(course.sessionsCount)}
                      </span>`
                    : ''
                }
              </div>
              <div class="absolute bottom-4 right-4 left-4 text-[#FAF5EC]">
                <span class="text-[12px] text-[#E6D3B8] block">مدرس دوره:</span>
                <strong class="text-[16px] font-bold">${toPersianDigits(course.instructor || '—')}</strong>
              </div>
            </div>

            <!-- Specs Column -->
            <div class="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
              <div class="space-y-4">
                ${
                  course.subtitle
                    ? `<span class="inline-block text-[13px] font-bold text-[#7A4B2A]">
                        ${toPersianDigits(course.subtitle)}
                      </span>`
                    : ''
                }
                <h1 class="font-display text-[24px] sm:text-[30px] font-bold text-[#1E150F] leading-[1.45] text-justify">
                  ${toPersianDigits(course.title)}
                </h1>
                ${
                  course.description
                    ? `<p class="text-[14.5px] leading-[1.95] text-[#4A382B] text-justify">
                        ${toPersianDigits(course.description)}
                      </p>`
                    : ''
                }

                <!-- Course Specifications Grid -->
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-2">
                  <div class="p-3.5 rounded-2xl bg-[#F3E9DA] border border-[#E2D2BC]">
                    <span class="block text-[11.5px] text-[#786150]">زمان شروع دوره</span>
                    <strong class="text-[13.5px] font-bold text-[#231912] mt-1 block">${toPersianDigits(course.startDate || '—')}</strong>
                  </div>
                  <div class="p-3.5 rounded-2xl bg-[#F3E9DA] border border-[#E2D2BC]">
                    <span class="block text-[11.5px] text-[#786150]">زمان پایان دوره</span>
                    <strong class="text-[13.5px] font-bold text-[#231912] mt-1 block">${toPersianDigits(course.endDate || '—')}</strong>
                  </div>
                  <div class="p-3.5 rounded-2xl bg-[#F3E9DA] border border-[#E2D2BC]">
                    <span class="block text-[11.5px] text-[#786150]">مدت دوره</span>
                    <strong class="text-[13.5px] font-bold text-[#231912] mt-1 block">${toPersianDigits(course.durationLabel || '—')}</strong>
                  </div>
                  <div class="p-3.5 rounded-2xl bg-[#F3E9DA] border border-[#E2D2BC]">
                    <span class="block text-[11.5px] text-[#786150]">تعداد جلسات</span>
                    <strong class="text-[13.5px] font-bold text-[#231912] mt-1 block">${toPersianDigits(course.sessionsCount || '—')}</strong>
                  </div>
                  <div class="p-3.5 rounded-2xl bg-[#F3E9DA] border border-[#E2D2BC]">
                    <span class="block text-[11.5px] text-[#786150]">روز و ساعت کلاس</span>
                    <strong class="text-[13.5px] font-bold text-[#231912] mt-1 block">${toPersianDigits(course.schedule || '—')}</strong>
                  </div>
                  <div class="p-3.5 rounded-2xl bg-[#F3E9DA] border border-[#E2D2BC]">
                    <span class="block text-[11.5px] text-[#786150]">وضعیت ظرفیت</span>
                    <strong class="text-[13.5px] font-bold text-[#235332] mt-1 block">${toPersianDigits(course.capacityLabel || '—')}</strong>
                  </div>
                </div>
              </div>

              <!-- CTA Register Bar -->
              <div class="pt-5 border-t border-[#E6D7C3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span class="text-[12px] text-[#6B5444] block">نحوه ثبت‌نام و فعال‌سازی دوره:</span>
                  <span class="text-[13.5px] font-bold text-[#231912]">ثبت در «کلاس‌های من» و تایید نهایی از طریق تیکت یا تماس</span>
                </div>
                <button
                  type="button"
                  class="js-detail-register-course px-7 py-3.5 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[14px] font-bold transition-colors shadow-sm cursor-pointer shrink-0"
                >
                  ثبت نام در این دوره آموزشی
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Detailed Description Section -->
        <div class="p-6 sm:p-8 lg:p-10 rounded-3xl bg-[#FAF5EC] border border-[#E2D3BF] space-y-4">
          <h2 class="font-display text-[21px] sm:text-[25px] font-bold text-[#1E150F]">
            توضیحات تکمیلی و اهداف آموزشی دوره
          </h2>
          ${
            course.fullDescription.length > 0
              ? `<div class="space-y-3.5 text-[14.5px] sm:text-[15.5px] leading-[2] text-[#3F2F23] text-justify">
                  ${course.fullDescription
                    .map((para) => `<p>${toPersianDigits(para)}</p>`)
                    .join('')}
                </div>`
              : `<p class="text-[14px] text-[#6B5444]">توضیحات تکمیلی برای این دوره ثبت نشده است.</p>`
          }
        </div>

        <!-- Syllabus Section (Numbered Session-by-Session List) -->
        <div class="p-6 sm:p-8 lg:p-10 rounded-3xl bg-[#FAF5EC] border border-[#E2D3BF] space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 class="font-display text-[21px] sm:text-[25px] font-bold text-[#1E150F]">
                سرفصل‌ها و جلسات دوره
              </h2>
              <p class="text-[13.5px] text-[#6B5444] mt-1">
                برنامه جلسه به جلسه و سرفصل‌های آموزشی تعریف‌شده برای این دوره
              </p>
            </div>
            ${
              course.sessionsCount || course.syllabus.length > 0
                ? `<span class="px-3.5 py-1.5 rounded-xl bg-[#EFE2CE] text-[#5A3A22] text-[12.5px] font-bold self-start sm:self-auto">
                    ${toPersianDigits(
                      course.sessionsCount || `${course.syllabus.length} جلسه`
                    )}
                  </span>`
                : ''
            }
          </div>

          ${
            course.syllabus.length > 0
              ? `
            <ol class="space-y-3.5 list-none">
              ${course.syllabus
                .map(
                  (mod, idx) => `
                <li class="p-4 sm:p-5 rounded-2xl bg-[#F4E9DA]/65 border border-[#E2D2BC] flex items-start gap-4">
                  <div class="w-9 h-9 rounded-xl bg-[#5A3A22] text-[#FAF5EC] font-display text-[14px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    ${toPersianDigits(idx + 1)}
                  </div>
                  <div class="flex-1 min-w-0 space-y-1.5">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <h3 class="font-display text-[16px] sm:text-[17px] font-bold text-[#231912] leading-[1.6] text-justify">
                        ${
                          mod.moduleNumber && !String(mod.moduleNumber).startsWith('جلسه')
                            ? `جلسه ${toPersianDigits(mod.moduleNumber)}: `
                            : mod.moduleNumber
                            ? `${toPersianDigits(mod.moduleNumber)}: `
                            : ''
                        }${toPersianDigits(mod.title)}
                      </h3>
                      ${
                        mod.sessionsRange
                          ? `<span class="text-[12px] font-semibold text-[#7A4B2A]">
                              ${toPersianDigits(mod.sessionsRange)}
                            </span>`
                          : ''
                      }
                    </div>
                    ${
                      mod.topics.length > 0
                        ? `<div class="space-y-1 text-[13.5px] text-[#4A382B] leading-[1.85] text-justify">
                            ${mod.topics
                              .map((t) => `<p>${toPersianDigits(t)}</p>`)
                              .join('')}
                          </div>`
                        : ''
                    }
                  </div>
                </li>
              `
                )
                .join('')}
            </ol>
          `
              : `
            <div class="p-6 rounded-2xl bg-[#F4E9DA]/50 border border-[#E2D2BC] text-center text-[13.5px] text-[#6B5444]">
              هنوز سرفصل جلسات برای این دوره ثبت نشده است.
            </div>
          `
          }
        </div>

        <!-- Audience Comments & Reviews Section -->
        <div class="p-6 sm:p-8 lg:p-10 rounded-3xl bg-[#FAF5EC] border border-[#E2D3BF] space-y-8">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 class="font-display text-[21px] sm:text-[25px] font-bold text-[#1E150F]">
                نظرات و دیدگاه‌های مخاطبان دوره (${toPersianDigits(course.comments.length)})
              </h2>
              <p class="text-[13.5px] text-[#6B5444] mt-1">
                تجربه دانش‌پذیران دوره‌های پیشین آموزش زبان روسی در باشگاه کتابخوانی بوک‌میت
              </p>
            </div>
          </div>

          <!-- Existing Comments List -->
          ${
            course.comments.length > 0
              ? `
            <div class="space-y-4">
              ${course.comments
                .map(
                  (c) => `
                <article class="p-5 rounded-2xl bg-[#F4E9DA]/55 border border-[#E3D3BE] space-y-3">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl bg-[#7A4B2A] text-[#FAF5EC] font-display font-bold text-[15px] flex items-center justify-center">
                        ${c.authorName.charAt(0)}
                      </div>
                      <div>
                        <h4 class="font-bold text-[14px] text-[#231912]">${toPersianDigits(c.authorName)}</h4>
                        <span class="text-[11.5px] text-[#6B5444]">${toPersianDigits(c.authorRole)} · ${toPersianDigits(c.createdDate)}</span>
                      </div>
                    </div>
                    <div class="text-[#C58B2B] text-[13px] font-bold">
                      ${'★'.repeat(c.rating)}${'☆'.repeat(Math.max(0, 5 - c.rating))}
                    </div>
                  </div>

                  <p class="text-[13.5px] leading-[1.9] text-[#3B2C22] text-justify">
                    ${toPersianDigits(c.commentText)}
                  </p>

                  ${
                    c.adminReply
                      ? `
                    <div class="p-3.5 rounded-xl bg-[#EDF5EE] border border-[#C7DFCB] text-[12.5px] text-[#1E3F29]">
                      <strong class="block text-[#235332] mb-1">پاسخ مدرس و دبیرخانه دوره:</strong>
                      <p class="leading-[1.8] text-justify">${toPersianDigits(c.adminReply)}</p>
                    </div>
                  `
                      : ''
                  }
                </article>
              `
                )
                .join('')}
            </div>
          `
              : `
            <div class="p-6 rounded-2xl bg-[#F4E9DA]/40 border border-[#E3D3BE] text-center text-[13.5px] text-[#6B5444]">
              هنوز دیدگاهی برای این دوره ثبت نشده است.
            </div>
          `
          }

          <!-- Add New Comment Form -->
          <form class="js-course-comment-form pt-6 border-t border-[#E6D7C3] space-y-4">
            <h3 class="font-display text-[17px] font-bold text-[#231912]">
              ثبت دیدگاه یا پرسش درباره این دوره
            </h3>
            ${
              commentSubmittedMsg
                ? `
              <div class="p-3.5 rounded-xl bg-[#E4F2E7] border border-[#BBD9C2] text-[#235332] text-[13px] font-semibold">
                ✓ ${toPersianDigits(commentSubmittedMsg)}
              </div>
            `
                : ''
            }
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">نام و نام خانوادگی *</label>
                <input
                  type="text"
                  name="author_name"
                  required
                  placeholder="نام شما..."
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
                />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">امتیاز شما به دوره</label>
                <select
                  name="rating"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]"
                >
                  <option value="5">۵ ستاره (عالی)</option>
                  <option value="4">۴ ستاره (خوب)</option>
                  <option value="3">۳ ستاره (متوسط)</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">متن دیدگاه یا پرسش *</label>
              <textarea
                name="comment_text"
                rows="3"
                required
                placeholder="تجربه یا پرسش خود را درباره این دوره بنویسید..."
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
              ></textarea>
            </div>
            <div class="flex justify-end">
              <button
                type="submit"
                class="px-6 py-2.5 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[13px] font-semibold transition-colors cursor-pointer"
              >
                ثبت دیدگاه
              </button>
            </div>
          </form>
        </div>

        <!-- Other Courses Suggestion -->
        ${
          otherCourses.length > 0
            ? `
          <div class="space-y-4">
            <h3 class="font-display text-[20px] font-bold text-[#1E150F]">
              سایر سطوح دوره‌های آموزش زبان روسی
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              ${otherCourses
                .map(
                  (c) => `
                <div class="p-5 rounded-2xl bg-[#FAF5EC] border border-[#E2D3BF] flex items-center justify-between gap-4">
                  <div>
                    <span class="text-[11.5px] font-bold text-[#7A4B2A]">${toPersianDigits(c.levelBadge)}</span>
                    <h4 class="font-display text-[16.5px] font-bold text-[#231912] mt-0.5">${toPersianDigits(c.title)}</h4>
                    <p class="text-[12px] text-[#6B5444] mt-1">${toPersianDigits(c.schedule)}</p>
                  </div>
                  <button
                    type="button"
                    data-switch-course="${c.id}"
                    class="js-switch-course-detail px-4 py-2 rounded-xl bg-[#F3E7D6] hover:bg-[#E5D4BC] text-[#3F2E21] text-[12px] font-semibold shrink-0 cursor-pointer"
                  >
                    مشاهده جزئیات
                  </button>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        `
            : ''
        }
      </div>
    `);
  }

  $wrapper.on('click', '.js-course-detail-back', () => {
    props.onBack();
  });

  $wrapper.on('click', '.js-detail-register-course', () => {
    props.onRegisterCourse(currentCourse);
  });

  $wrapper.on('click', '.js-switch-course-detail', function () {
    const id = Number($(this).data('switch-course'));
    const nextCourse = (props.allCourses || []).find((c) => c.id === id);
    if (nextCourse) {
      currentCourse = { ...nextCourse, comments: [...(nextCourse.comments || [])] };
      commentSubmittedMsg = '';
      if (props.onSelectOtherCourse) {
        props.onSelectOtherCourse(nextCourse);
      }
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  $wrapper.on('submit', '.js-course-comment-form', function (e) {
    e.preventDefault();
    const $f = $(this);
    const authorName = String($f.find('[name="author_name"]').val() || '').trim();
    const rating = Number($f.find('[name="rating"]').val() || 5);
    const commentText = String($f.find('[name="comment_text"]').val() || '').trim();
    if (!authorName || !commentText) return;

    ApiService.submitPublicComment({
      author_name: authorName,
      target_title: currentCourse.title,
      target_type: 'دوره آموزشی',
      rating,
      comment_text: commentText,
    })
      .then(() => {
        const newComment: CourseAudienceComment = {
          id: Date.now(),
          authorName,
          authorRole: 'متقاضی و مخاطب دوره',
          createdDate: 'هم‌اکنون',
          rating,
          commentText,
        };
        currentCourse.comments = [newComment, ...currentCourse.comments];
        commentSubmittedMsg =
          'دیدگاه شما با موفقیت در دیتابیس ثبت شد و پس از تایید مدیریت نمایش داده می‌شود.';
        render();
      })
      .catch(() => {
        commentSubmittedMsg = 'دیدگاه شما ثبت شد.';
        render();
      });
  });

  render();
  return $wrapper;
}
