import $ from 'jquery';
import type { MemberClassItem, UserComment } from '../types/models.ts';
import { toPersianDigits } from '../utils/persianNumbers.ts';

export interface CourseSyllabusModule {
  moduleNumber: string;
  title: string;
  sessionsRange: string;
  topics: string[];
}

export interface CourseAudienceComment {
  id: number;
  authorName: string;
  authorRole: string;
  createdDate: string;
  rating: number;
  commentText: string;
  adminReply?: string;
}

export interface RussianCourseCard {
  id: number;
  levelBadge: string;
  level?: string;
  title: string;
  subtitle: string;
  instructor: string;
  schedule: string;
  startDate: string;
  endDate: string;
  durationLabel: string;
  sessionsCount: string;
  capacityLabel: string;
  coverUrl: string;
  description: string;
  fullDescription: string[];
  syllabus: CourseSyllabusModule[];
  comments: CourseAudienceComment[];
}

export function mapClassToCourseCard(
  classItem: MemberClassItem,
  approvedComments: UserComment[] = []
): RussianCourseCard {
  const subs = classItem.sub_sessions || [];
  const firstSubDate = subs[0]?.session_date || classItem.schedule_summary || '—';
  const lastSubDate =
    subs.length > 1 ? subs[subs.length - 1]?.session_date || '—' : firstSubDate;

  const syllabus: CourseSyllabusModule[] = subs.map((sub, idx) => ({
    moduleNumber: String(sub.session_number || `جلسه ${toPersianDigits(idx + 1)}`),
    title: String(sub.title || ''),
    sessionsRange: [sub.session_date, sub.session_time].filter(Boolean).join(' · ') || '—',
    topics: sub.pages_to_read
      ? String(sub.pages_to_read)
          .split(/\n|،|-/)
          .map((t) => t.trim())
          .filter(Boolean)
      : [],
  }));

  const matchingComments: CourseAudienceComment[] = approvedComments
    .filter((c) => c.status === 'تایید شده' && c.target_title === classItem.title)
    .map((c) => ({
      id: c.id,
      authorName: c.author_name,
      authorRole: 'دانش‌پذیر دوره',
      createdDate: c.created_date,
      rating: c.rating || 5,
      commentText: c.comment_text,
      adminReply: c.admin_reply || undefined,
    }));

  const descParagraphs = (classItem.description || '')
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return {
    id: classItem.id,
    levelBadge: `سطح ${classItem.level_label || 'مبتدی'}`,
    level: classItem.level_label || 'مبتدی',
    title: classItem.title || '',
    subtitle: classItem.book_title || '',
    instructor: classItem.instructor_name || '',
    schedule: classItem.schedule_summary || '',
    startDate: firstSubDate,
    endDate: lastSubDate,
    durationLabel: `${toPersianDigits(subs.length)} جلسه آموزشی`,
    sessionsCount: `${toPersianDigits(subs.length)} جلسه آموزشی`,
    capacityLabel: classItem.status === 'فعال' ? 'ظرفیت باز' : classItem.status,
    coverUrl: classItem.cover_url || '/assets/blog-1.png',
    description: classItem.description || '',
    fullDescription: descParagraphs,
    syllabus,
    comments: matchingComments,
  };
}

export interface CoursesSectionCallbacks {
  onOpenCourseDetail?: (course: RussianCourseCard) => void;
  onRegisterCourse?: (course: RussianCourseCard) => void;
}

export function createCoursesSectionComponent(props: {
  publicClasses?: MemberClassItem[];
  approvedComments?: UserComment[];
  onOpenCourseDetail?: (course: RussianCourseCard) => void;
  onRegisterCourse?: (course: RussianCourseCard) => void;
}): JQuery {
  return createCoursesSection(
    {
      onOpenCourseDetail: props.onOpenCourseDetail,
      onRegisterCourse: props.onRegisterCourse,
    },
    props.publicClasses || [],
    props.approvedComments || []
  );
}

export function createCoursesSection(
  callbacks?: CoursesSectionCallbacks,
  activeClasses: MemberClassItem[] = [],
  approvedComments: UserComment[] = []
): JQuery {
  const validClasses = (activeClasses || []).filter((c) => c.status !== 'غیرفعال');
  const dynamicCourses: RussianCourseCard[] = validClasses.map((c) =>
    mapClassToCourseCard(c, approvedComments)
  );

  const $section = $(`
    <section
      id="courses"
      aria-label="دوره‌های تخصصی آموزش زبان روسی و ادبیات کلاسیک"
      class="relative w-full bg-[#EFE5D5] text-[#221811] py-20 sm:py-28 lg:py-32 px-5 sm:px-10 lg:px-20 border-t border-[#E0D1BC] scroll-mt-20"
    >
      <div class="max-w-7xl mx-auto">
        <!-- Section Header -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div class="max-w-3xl">
            <div class="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[#F8F1E5] border border-[#DECAB0] mb-4">
              <span class="w-2 h-2 rounded-full bg-[#7A4B2A]"></span>
              <span class="text-[12px] sm:text-[13px] font-semibold text-[#5E3D24]">
                دپارتمان زبان و ادبیات روسی باشگاه بوک‌میت
              </span>
            </div>
            <h2 class="font-display text-[28px] sm:text-[36px] lg:text-[42px] font-bold leading-[1.3] text-[#1E150F] text-justify">
              دوره‌های تخصصی آموزش زبان روسی و خوانش متون اصلی
            </h2>
          </div>

          <p class="text-[14px] sm:text-[15px] leading-[1.9] text-[#554233] max-w-md text-justify">
            برای خواندن آثار داستایوفسکی، تولستوی، چخوف و بولگاکف به زبان مادریِ نویسندگانشان، دوره‌های آموزش زبان روسی بوک‌میت از سطح پایه تا خوانش تخصصی متون ادبی برگزار می‌شوند.
          </p>
        </div>

        <!-- Courses Grid -->
        ${
          dynamicCourses.length > 0
            ? `
          <div class="grid grid-cols-1 md:grid-cols-3 gap-7 lg:gap-8">
            ${dynamicCourses
              .map(
                (course) => `
              <article
                class="group rounded-3xl bg-[#FAF5EC] border border-[#E2D3BF] overflow-hidden shadow-[0_14px_34px_rgba(45,30,18,0.06)] hover:shadow-[0_22px_46px_rgba(45,30,18,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <!-- Course Cover -->
                  <div class="relative h-52 overflow-hidden bg-[#2C1E14]">
                    <img
                      src="${course.coverUrl}"
                      alt="${course.title}"
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div class="absolute inset-0 bg-gradient-to-t from-[#1E140E]/85 via-[#1E140E]/25 to-transparent"></div>
                    <div class="absolute top-3.5 right-3.5 left-3.5 flex items-center justify-between gap-2">
                      <span class="px-3 py-1 rounded-lg bg-[#1E140E]/85 backdrop-blur-xs text-[#F7E9D7] text-[11.5px] font-bold border border-[#C69B6D]/35">
                        ${toPersianDigits(course.levelBadge)}
                      </span>
                      <span class="px-2.5 py-1 rounded-lg bg-[#5A3A22]/90 text-[#FAF5EC] text-[11px] font-semibold">
                        ${toPersianDigits(course.sessionsCount)}
                      </span>
                    </div>
                    ${
                      course.subtitle
                        ? `<div class="absolute bottom-3.5 right-4 left-4">
                            <span class="text-[12px] text-[#E8D6BE] font-medium block">
                              ${toPersianDigits(course.subtitle)}
                            </span>
                          </div>`
                        : ''
                    }
                  </div>

                  <!-- Course Body -->
                  <div class="p-6 space-y-3.5">
                    <h3 class="font-display text-[19px] sm:text-[20px] font-bold text-[#1F1610] leading-[1.55] text-justify">
                      ${toPersianDigits(course.title)}
                    </h3>
                    ${
                      course.description
                        ? `<p class="text-[13.5px] leading-[1.9] text-[#4C3A2C] text-justify">
                            ${toPersianDigits(course.description)}
                          </p>`
                        : ''
                    }
                  </div>
                </div>

                <!-- Course Footer Details + Action Buttons -->
                <div class="px-6 py-4 bg-[#F3E9DA]/80 border-t border-[#E5D6C2] space-y-3.5">
                  <div class="space-y-1.5 text-[12.5px] text-[#4E3B2D]">
                    <div class="flex items-center justify-between">
                      <span class="text-[#786150]">مدرس دوره:</span>
                      <strong class="text-[#231912]">${toPersianDigits(course.instructor || '—')}</strong>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-[#786150]">برنامه کلاس:</span>
                      <strong class="text-[#7A4B2A]">${toPersianDigits(course.schedule || '—')}</strong>
                    </div>
                  </div>

                  <!-- Action Buttons: Register & View Details -->
                  <div class="pt-3 border-t border-[#E2D2BC] grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      data-course-details="${course.id}"
                      class="js-course-view-details py-2.5 px-3 rounded-xl bg-[#FAF5EC] hover:bg-[#EFE2CE] text-[#3F2E21] border border-[#D8C5AC] text-[12px] font-semibold transition-colors text-center cursor-pointer"
                    >
                      مشاهده جزئیات
                    </button>
                    <button
                      type="button"
                      data-course-register="${course.id}"
                      class="js-course-register-btn py-2.5 px-3 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[12px] font-semibold transition-colors text-center shadow-xs cursor-pointer"
                    >
                      ثبت نام
                    </button>
                  </div>
                </div>
              </article>
            `
              )
              .join('')}
          </div>
        `
            : `
          <div class="rounded-3xl bg-[#FAF5EC] border border-[#E2D3BF] p-10 text-center">
            <h3 class="font-display text-[20px] font-bold text-[#1E150F]">
              در حال حاضر دوره آموزشی فعالی ثبت نشده است
            </h3>
            <p class="text-[14px] text-[#554233] mt-2">
              به محض تعریف دوره آموزشی جدید در پنل مدیریت، فهرست دوره‌ها در این بخش نمایش داده خواهد شد.
            </p>
          </div>
        `
        }
      </div>
    </section>
  `);

  $section.on('click', '.js-course-view-details', function () {
    const id = Number($(this).data('course-details'));
    const found = dynamicCourses.find((c) => c.id === id);
    if (found && callbacks?.onOpenCourseDetail) {
      callbacks.onOpenCourseDetail(found);
    }
  });

  $section.on('click', '.js-course-register-btn', function () {
    const id = Number($(this).data('course-register'));
    const found = dynamicCourses.find((c) => c.id === id);
    if (found && callbacks?.onRegisterCourse) {
      callbacks.onRegisterCourse(found);
    }
  });

  return $section;
}
