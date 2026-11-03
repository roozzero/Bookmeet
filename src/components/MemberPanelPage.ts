import $ from 'jquery';
import { ApiService } from '../services/api.ts';
import { toPersianDigits } from '../utils/persianNumbers.ts';
import type {
  ClubCalendarEvent,
  ClubMember,
  MemberLibraryItem,
  MemberPanelPayload,
  MemberSession,
  MemberTicket,
} from '../types/models.ts';

export type MemberPanelTabId =
  | 'dashboard'
  | 'sessions'
  | 'library'
  | 'tickets'
  | 'profile'
  | 'calendar';

export interface MemberPanelPageProps {
  initialData: MemberPanelPayload;
  initialTab?: MemberPanelTabId;
  onBackToSite: () => void;
  onLogout: () => void;
  onMemberUpdated?: (member: ClubMember) => void;
}

const EDUCATION_OPTIONS = [
  'دیپلم',
  'کاردانی',
  'کارشناسی',
  'کارشناسی ارشد',
  'دکتری',
  'سایر',
];

export function createMemberPanelPageComponent(
  props: MemberPanelPageProps
): JQuery<HTMLElement> {
  const state: MemberPanelPayload = JSON.parse(JSON.stringify(props.initialData));
  let activeTab: MemberPanelTabId = props.initialTab || 'dashboard';
  let sessionFilter: 'all' | 'ثبت‌نام‌شده' | 'برگزارشده' = 'all';
  let libraryFilter: 'all' | 'در حال مطالعه' | 'خوانده‌شده' | 'در نوبت مطالعه' = 'all';
  let calendarFilter = 'all';

  const navItems: { id: MemberPanelTabId; label: string; iconSvg: string }[] = [
    {
      id: 'dashboard',
      label: 'داشبورد',
      iconSvg:
        '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
    },
    {
      id: 'sessions',
      label: 'جلسات من',
      iconSvg:
        '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    },
    {
      id: 'library',
      label: 'کتابخانه من',
      iconSvg:
        '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    },
    {
      id: 'tickets',
      label: 'تیکت',
      iconSvg:
        '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    },
    {
      id: 'profile',
      label: 'پروفایل',
      iconSvg:
        '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    },
    {
      id: 'calendar',
      label: 'تقویم باشگاه',
      iconSvg:
        '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    },
  ];

  const $wrapper = $(`
    <section
      dir="rtl"
      aria-label="پنل کاربری اعضای باشگاه کتابخوانی بوک‌میت"
      class="w-full min-h-screen py-8 md:py-12 px-4 sm:px-8 md:px-14"
    >
      <div class="max-w-6xl mx-auto space-y-6">
        <!-- Top Member Panel Header Bar -->
        <div class="bg-[#f8f4ea] border border-[#dcd0bb] rounded-2xl p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4 shadow-[0_14px_34px_-18px_rgba(48,31,17,0.14)]">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-[#382315] text-[#faf6ec] flex items-center justify-center font-bold text-base shrink-0 shadow-sm js-member-avatar">
              ${toPersianDigits((state.member.first_name || 'ع').charAt(0))}
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-base sm:text-lg font-bold text-[#2c1b0e] js-header-member-name">
                  پنل کاربری ${toPersianDigits(state.member.first_name)} ${toPersianDigits(state.member.last_name)}
                </h1>
                <span class="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-[#ebe2cf] text-[#5a422e] border border-[#d8cbb4]">
                  کد عضویت: ${toPersianDigits(state.member.membership_code || 'BM-۱۴۰۵-۱۰۸')}
                </span>
              </div>
              <p class="text-xs text-[#6f5a48] mt-0.5 text-justify">
                مدیریت جلسات هم‌خوانی، قفسه کتاب‌های شخصی، تیکت‌های دبیرخانه و تقویم نشست‌های باشگاه بوک‌میت
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2.5">
            <button
              type="button"
              class="js-back-to-site-btn px-3.5 py-2 text-xs font-semibold text-[#382315] bg-[#efe7d6] hover:bg-[#e4d9c3] border border-[#d5c8b2] rounded-xl transition-colors cursor-pointer"
            >
              صفحه اصلی سایت
            </button>
            <button
              type="button"
              class="js-logout-btn px-3.5 py-2 text-xs font-semibold text-[#7a3126] hover:text-[#4f1b13] bg-transparent border border-[#d9b8b2] hover:border-[#7a3126] rounded-xl transition-colors cursor-pointer"
            >
              خروج از حساب
            </button>
          </div>
        </div>

        <!-- Main Layout: Sidebar Navigation + Content Area -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <!-- Sidebar Navigation (6 Sections) -->
          <aside class="lg:col-span-3 bg-[#f8f4ea] border border-[#dcd0bb] rounded-2xl p-3 shadow-[0_14px_34px_-18px_rgba(48,31,17,0.12)]">
            <div class="px-3 py-2 mb-1 border-b border-[#e6dccb]">
              <span class="text-[11px] font-bold text-[#7a6451]">بخش‌های پنل کاربری</span>
            </div>
            <nav class="js-panel-sidebar-nav flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0" aria-label="منوی پنل کاربری"></nav>
          </aside>

          <!-- Dynamic Section Content Container -->
          <div class="js-panel-content lg:col-span-9 space-y-6"></div>
        </div>
      </div>
    </section>
  `);

  const $sidebarNav = $wrapper.find('.js-panel-sidebar-nav');
  const $content = $wrapper.find('.js-panel-content');

  function renderSidebar(): void {
    $sidebarNav.empty();
    navItems.forEach((item) => {
      const isActive = item.id === activeTab;
      const badgeCount =
        item.id === 'sessions'
          ? toPersianDigits(state.sessions.length)
          : item.id === 'library'
          ? toPersianDigits(state.library.length)
          : item.id === 'tickets'
          ? toPersianDigits(state.tickets.length)
          : item.id === 'calendar'
          ? toPersianDigits(
              state.calendarEvents.filter((e) => e.is_reserved === 1).length
            )
          : '';

      const $btn = $(`
        <button
          type="button"
          data-tab="${item.id}"
          class="js-panel-tab-btn w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
            isActive
              ? 'bg-[#382315] text-[#faf6ec] shadow-sm'
              : 'text-[#4e3d2f] hover:bg-[#efe7d6] hover:text-[#23180f]'
          }"
        >
          <span class="inline-flex items-center gap-2.5">
            ${item.iconSvg}
            <span>${item.label}</span>
          </span>
          ${
            badgeCount
              ? `<span class="text-[11px] px-2 py-0.5 rounded-md ${
                  isActive
                    ? 'bg-[#543824] text-[#f7f2e6]'
                    : 'bg-[#e9e0ce] text-[#5c4838]'
                }">${badgeCount}</span>`
              : ''
          }
        </button>
      `);

      $btn.on('click', () => {
        activeTab = item.id;
        renderSidebar();
        renderActiveSection();
      });

      $sidebarNav.append($btn);
    });
  }

  // =========================================================================
  // 1. DASHBOARD VIEW
  // =========================================================================
  function renderDashboardSection(): void {
    const activeBook =
      state.library.find((b) => b.reading_status === 'در حال مطالعه') ||
      state.library[0];
    const upcomingSessions = state.sessions.filter(
      (s) => s.status === 'ثبت‌نام‌شده'
    );
    const completedBooksCount = state.library.filter(
      (b) => b.reading_status === 'خوانده‌شده'
    ).length;
    const totalPagesRead = state.library.reduce(
      (acc, b) => acc + Math.round((b.pages_count * b.progress_percent) / 100),
      0
    );
    const reservedEventsCount = state.calendarEvents.filter(
      (e) => e.is_reserved === 1
    ).length;

    const $view = $(`
      <div class="space-y-6">
        <!-- Welcome Overview Card -->
        <div class="bg-[#f8f4ea] border border-[#dcd0bb] rounded-2xl p-5 sm:p-6 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-base sm:text-lg font-bold text-[#382315]">
              خوش آمدید، ${toPersianDigits(state.member.first_name)} ${toPersianDigits(state.member.last_name)} عزیز
            </h2>
            <span class="text-xs text-[#7a6451]">
              عضویت از: ${toPersianDigits(state.member.joined_date || 'مهر ۱۴۰۵')} · مقطع: ${toPersianDigits(state.member.education)}
            </span>
          </div>
          <p class="text-xs sm:text-[13.5px] text-[#4e3d2f] leading-[2.05] text-justify" style="text-align: justify; text-justify: inter-word;">
            ${toPersianDigits(
              state.member.bio ||
                'در داشبورد اختصاصی باشگاه کتابخوانی بوک‌میت می‌توانید وضعیت پیشرفت مطالعه هفتگی، یادداشت‌های نشست‌های هم‌خوانی، پاسخ دبیرخانه به تیکت‌ها و برنامه تقویم ماهانه باشگاه را مدیریت و پیگیری کنید.'
            )}
          </p>
        </div>

        <!-- 4 KPI Stat Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="bg-[#f8f4ea] border border-[#ded3be] rounded-2xl p-4 space-y-1">
            <div class="text-2xl font-bold text-[#382315]">
              ${toPersianDigits(state.sessions.length)}
            </div>
            <div class="text-xs font-semibold text-[#645140]">جلسات ثبت‌شده من</div>
            <div class="text-[11px] text-[#8a7562]">
              ${toPersianDigits(upcomingSessions.length)} نشست پیش‌رو
            </div>
          </div>

          <div class="bg-[#f8f4ea] border border-[#ded3be] rounded-2xl p-4 space-y-1">
            <div class="text-2xl font-bold text-[#382315]">
              ${toPersianDigits(state.library.length)}
            </div>
            <div class="text-xs font-semibold text-[#645140]">کتاب‌های قفسه من</div>
            <div class="text-[11px] text-[#8a7562]">
              ${toPersianDigits(completedBooksCount)} اثر خوانده‌شده
            </div>
          </div>

          <div class="bg-[#f8f4ea] border border-[#ded3be] rounded-2xl p-4 space-y-1">
            <div class="text-2xl font-bold text-[#382315]">
              ${toPersianDigits(totalPagesRead)}
            </div>
            <div class="text-xs font-semibold text-[#645140]">صفحات مطالعه‌شده</div>
            <div class="text-[11px] text-[#8a7562]">در دوره‌های هم‌خوانی</div>
          </div>

          <div class="bg-[#f8f4ea] border border-[#ded3be] rounded-2xl p-4 space-y-1">
            <div class="text-2xl font-bold text-[#382315]">
              ${toPersianDigits(reservedEventsCount)}
            </div>
            <div class="text-xs font-semibold text-[#645140]">رویدادهای رزروشده</div>
            <div class="text-[11px] text-[#8a7562]">
              ${toPersianDigits(state.tickets.length)} تیکت ثبت‌شده
            </div>
          </div>
        </div>

        <!-- Current Reading + Upcoming Sessions Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Current Reading Book Card -->
          <div class="bg-[#f8f4ea] border border-[#dcd0bb] rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div class="space-y-3">
              <div class="flex items-center justify-between border-b border-[#e6dccb] pb-2.5">
                <h3 class="text-sm font-bold text-[#382315]">کتاب در حال مطالعه من</h3>
                <button
                  type="button"
                  data-goto="library"
                  class="js-quick-nav text-xs font-semibold text-[#7a5436] hover:text-[#23180f] cursor-pointer"
                >
                  مشاهده کتابخانه من ←
                </button>
              </div>

              ${
                activeBook
                  ? `
                <div class="flex items-start gap-4 pt-1">
                  <img
                    src="${activeBook.cover_url}"
                    alt="${toPersianDigits(activeBook.book_title)}"
                    class="w-20 h-28 object-cover rounded-xl border border-[#d8cbb4] shrink-0 shadow-sm"
                  />
                  <div class="space-y-1.5 flex-1">
                    <div class="inline-block text-[10.5px] font-semibold px-2 py-0.5 rounded bg-[#ebe2cf] text-[#5a422e]">
                      ${toPersianDigits(activeBook.reading_status)}
                    </div>
                    <h4 class="text-sm sm:text-base font-bold text-[#2c1b0e]">
                      ${toPersianDigits(activeBook.book_title)}
                    </h4>
                    <div class="text-xs text-[#6e5947]">
                      نویسنده: ${toPersianDigits(activeBook.author)} · ترجمه: ${toPersianDigits(activeBook.translator)}
                    </div>
                    <p class="text-xs text-[#594636] leading-6 text-justify" style="text-align: justify; text-justify: inter-word;">
                      ${toPersianDigits(activeBook.personal_note)}
                    </p>
                  </div>
                </div>
              `
                  : ''
              }
            </div>

            ${
              activeBook
                ? `
              <div class="space-y-1.5 pt-2 border-t border-[#e8dfd0]">
                <div class="flex items-center justify-between text-xs font-semibold text-[#473425]">
                  <span>میزان پیشرفت مطالعه</span>
                  <span>٪${toPersianDigits(activeBook.progress_percent)} (${toPersianDigits(activeBook.pages_count)} صفحه)</span>
                </div>
                <div class="w-full h-2.5 bg-[#e5dac6] rounded-full overflow-hidden">
                  <div
                    class="h-full bg-[#4a321f] rounded-full transition-all duration-500"
                    style="width: ${activeBook.progress_percent}%"
                  ></div>
                </div>
              </div>
            `
                : ''
            }
          </div>

          <!-- Next Session Card -->
          <div class="bg-[#f8f4ea] border border-[#dcd0bb] rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div class="space-y-3">
              <div class="flex items-center justify-between border-b border-[#e6dccb] pb-2.5">
                <h3 class="text-sm font-bold text-[#382315]">نشست‌های پیش‌روی من</h3>
                <button
                  type="button"
                  data-goto="sessions"
                  class="js-quick-nav text-xs font-semibold text-[#7a5436] hover:text-[#23180f] cursor-pointer"
                >
                  همه جلسات من ←
                </button>
              </div>

              <div class="space-y-2.5">
                ${upcomingSessions
                  .slice(0, 2)
                  .map(
                    (s) => `
                  <div class="p-3 rounded-xl bg-[#f2ecde] border border-[#e2d6c1] space-y-1">
                    <div class="flex items-center justify-between text-[11px] text-[#7a5c43] font-semibold">
                      <span>${toPersianDigits(s.session_date)} · ${toPersianDigits(s.session_time)}</span>
                      <span class="px-2 py-0.5 rounded bg-[#382315] text-[#faf6ec]">${toPersianDigits(s.location_type)}</span>
                    </div>
                    <div class="text-xs sm:text-[13px] font-bold text-[#2c1b0e]">
                      ${toPersianDigits(s.title)}
                    </div>
                    <div class="text-[11px] text-[#5e4b3b]">
                      کتاب: ${toPersianDigits(s.book_title)} · منتور: ${toPersianDigits(s.mentor_name)}
                    </div>
                  </div>
                `
                  )
                  .join('')}
              </div>
            </div>

            <div class="pt-2 border-t border-[#e8dfd0] flex items-center justify-between">
              <span class="text-xs text-[#6e5947]">برای رزرو جلسات جدید به تقویم مراجعه کنید</span>
              <button
                type="button"
                data-goto="calendar"
                class="js-quick-nav text-xs font-bold text-[#382315] underline underline-offset-4 cursor-pointer"
              >
                تقویم باشگاه
              </button>
            </div>
          </div>
        </div>
      </div>
    `);

    $view.find('.js-quick-nav').on('click', function () {
      const target = $(this).attr('data-goto') as MemberPanelTabId;
      if (target) {
        activeTab = target;
        renderSidebar();
        renderActiveSection();
      }
    });

    $content.empty().append($view);
  }

  // =========================================================================
  // 2. MY SESSIONS VIEW (جلسات من)
  // =========================================================================
  function renderSessionsSection(): void {
    const filteredSessions =
      sessionFilter === 'all'
        ? state.sessions
        : state.sessions.filter((s) => s.status === sessionFilter);

    const $view = $(`
      <div class="space-y-5">
        <div class="bg-[#f8f4ea] border border-[#dcd0bb] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 class="text-base sm:text-lg font-bold text-[#382315]">جلسات من در باشگاه بوک‌میت</h2>
            <p class="text-xs text-[#645140] mt-1 text-justify">
              فهرست نشست‌های هم‌خوانی و کارگاه‌های ثبت‌نام‌شده شما به همراه قابلیت ثبت یادداشت‌های تحلیلی هر جلسه.
            </p>
          </div>

          <div class="flex items-center gap-1.5 bg-[#efe7d6] p-1 rounded-xl border border-[#dfd3be]">
            <button type="button" data-filter="all" class="js-session-filter px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              sessionFilter === 'all'
                ? 'bg-[#382315] text-[#faf6ec]'
                : 'text-[#5c4838]'
            }">همه (${toPersianDigits(state.sessions.length)})</button>
            <button type="button" data-filter="ثبت‌نام‌شده" class="js-session-filter px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              sessionFilter === 'ثبت‌نام‌شده'
                ? 'bg-[#382315] text-[#faf6ec]'
                : 'text-[#5c4838]'
            }">پیش‌رو</button>
            <button type="button" data-filter="برگزارشده" class="js-session-filter px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              sessionFilter === 'برگزارشده'
                ? 'bg-[#382315] text-[#faf6ec]'
                : 'text-[#5c4838]'
            }">برگزارشده</button>
          </div>
        </div>

        <div class="js-sessions-list space-y-4"></div>
      </div>
    `);

    $view.find('.js-session-filter').on('click', function () {
      sessionFilter = $(this).attr('data-filter') as
        | 'all'
        | 'ثبت‌نام‌شده'
        | 'برگزارشده';
      renderSessionsSection();
    });

    const $list = $view.find('.js-sessions-list');
    filteredSessions.forEach((session: MemberSession) => {
      const isUpcoming = session.status === 'ثبت‌نام‌شده';
      const $card = $(`
        <div class="bg-[#f8f4ea] border border-[#dcd0bb] rounded-2xl p-5 space-y-3.5">
          <div class="flex flex-wrap items-start justify-between gap-3 border-b border-[#e6dccb] pb-3">
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-md ${
                  isUpcoming
                    ? 'bg-emerald-900/15 text-emerald-900 border border-emerald-800/25'
                    : 'bg-[#e6dccb] text-[#5c4838]'
                }">
                  ${toPersianDigits(session.status)}
                </span>
                <span class="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-[#efe7d6] text-[#5a422e]">
                  ${toPersianDigits(session.location_type)}
                </span>
                <span class="text-xs text-[#7a6451]">
                  ${toPersianDigits(session.session_date)} · ${toPersianDigits(session.session_time)}
                </span>
              </div>
              <h3 class="text-sm sm:text-base font-bold text-[#2c1b0e] pt-1">
                ${toPersianDigits(session.title)}
              </h3>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#4e3d2f] bg-[#f2ecde] p-3.5 rounded-xl border border-[#e3d7c3]">
            <div><strong class="text-[#2c1b0e]">محور نشست:</strong> ${toPersianDigits(session.book_title)}</div>
            <div><strong class="text-[#2c1b0e]">تسهیل‌گر و منتور:</strong> ${toPersianDigits(session.mentor_name)}</div>
            <div><strong class="text-[#2c1b0e]">محل برگزاری:</strong> ${toPersianDigits(session.meeting_link_or_room)}</div>
          </div>

          <div class="space-y-2">
            <label class="block text-xs font-semibold text-[#473425]">
              یادداشت و پرسش‌های من برای این نشست:
            </label>
            <textarea
              rows="2"
              class="js-session-note-input w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#6e492d] text-justify"
            >${toPersianDigits(session.member_note)}</textarea>
            <div class="flex items-center justify-between">
              <span class="js-session-save-msg text-xs text-emerald-800 hidden">یادداشت شما در دیتابیس ذخیره شد ✓</span>
              <button
                type="button"
                class="js-save-session-note mr-auto px-4 py-1.5 text-xs font-bold text-[#382315] border border-[#8c6f56] hover:border-[#23180f] rounded-xl transition-colors cursor-pointer bg-transparent"
              >
                ذخیره یادداشت جلسه
              </button>
            </div>
          </div>
        </div>
      `);

      $card.find('.js-save-session-note').on('click', function () {
        const $btn = $(this);
        const noteVal = toPersianDigits(
          String($card.find('.js-session-note-input').val() || '').trim()
        );
        $btn.prop('disabled', true).text('در حال ذخیره...');
        ApiService.saveMemberSessionNote({
          sessionId: session.id,
          member_note: noteVal,
        })
          .then((res) => {
            session.member_note = res.session.member_note;
            $card.find('.js-session-save-msg').removeClass('hidden');
            window.setTimeout(() => {
              $card.find('.js-session-save-msg').addClass('hidden');
            }, 2200);
          })
          .finally(() => {
            $btn.prop('disabled', false).text('ذخیره یادداشت جلسه');
          });
      });

      $list.append($card);
    });

    $content.empty().append($view);
  }

  // =========================================================================
  // 3. MY LIBRARY VIEW (کتابخانه من)
  // =========================================================================
  function renderLibrarySection(): void {
    const filteredBooks =
      libraryFilter === 'all'
        ? state.library
        : state.library.filter((b) => b.reading_status === libraryFilter);

    const $view = $(`
      <div class="space-y-5">
        <div class="bg-[#f8f4ea] border border-[#dcd0bb] rounded-2xl p-5 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 class="text-base sm:text-lg font-bold text-[#382315]">کتابخانه شخصی من</h2>
              <p class="text-xs text-[#645140] mt-1 text-justify">
                مدیریت کتاب‌های در حال مطالعه، ثبت درصد پیشرفت خوانش و افزودن آثار جدید به قفسه مطالعاتی شما.
              </p>
            </div>

            <button
              type="button"
              class="js-toggle-add-book px-4 py-2 text-xs font-bold text-[#faf6ec] bg-[#382315] hover:bg-[#27180e] rounded-xl transition-colors cursor-pointer"
            >
              + افزودن کتاب به قفسه من
            </button>
          </div>

          <!-- Filter Bar -->
          <div class="flex flex-wrap items-center gap-1.5 bg-[#efe7d6] p-1 rounded-xl border border-[#dfd3be] w-fit">
            ${(['all', 'در حال مطالعه', 'خوانده‌شده', 'در نوبت مطالعه'] as const)
              .map(
                (st) => `
              <button
                type="button"
                data-status="${st}"
                class="js-lib-filter px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  libraryFilter === st
                    ? 'bg-[#382315] text-[#faf6ec]'
                    : 'text-[#5c4838]'
                }"
              >
                ${st === 'all' ? `همه (${toPersianDigits(state.library.length)})` : st}
              </button>
            `
              )
              .join('')}
          </div>

          <!-- Collapsible Add New Book Form -->
          <form class="js-add-book-form hidden pt-3 border-t border-[#e5dccb] space-y-3">
            <h3 class="text-xs font-bold text-[#382315]">افزودن کتاب جدید به کتابخانه من</h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                name="book_title"
                required
                placeholder="عنوان کتاب (مثلاً: ابله)"
                class="px-3 py-2 text-xs bg-white border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#6e492d]"
              />
              <input
                type="text"
                name="author"
                required
                placeholder="نام نویسنده (مثلاً: داستایفسکی)"
                class="px-3 py-2 text-xs bg-white border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#6e492d]"
              />
              <input
                type="text"
                name="translator"
                placeholder="نام مترجم (مثلاً: سروش حبیبی)"
                class="px-3 py-2 text-xs bg-white border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#6e492d]"
              />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                name="reading_status"
                class="px-3 py-2 text-xs bg-white border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#6e492d]"
              >
                <option value="در حال مطالعه">در حال مطالعه</option>
                <option value="در نوبت مطالعه">در نوبت مطالعه</option>
                <option value="خوانده‌شده">خوانده‌شده</option>
              </select>
              <input
                type="text"
                name="pages_count"
                placeholder="تعداد صفحات (مثلاً: ۴۵۰)"
                class="px-3 py-2 text-xs bg-white border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#6e492d]"
              />
              <input
                type="text"
                name="personal_note"
                placeholder="یادداشت کوتاه درباره کتاب..."
                class="px-3 py-2 text-xs bg-white border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#6e492d]"
              />
            </div>
            <div class="flex justify-end gap-2">
              <button
                type="submit"
                class="px-4 py-2 text-xs font-bold text-[#382315] border border-[#8c6f56] hover:border-[#23180f] rounded-xl cursor-pointer bg-transparent"
              >
                ثبت کتاب در قفسه من
              </button>
            </div>
          </form>
        </div>

        <div class="js-member-books-grid grid grid-cols-1 md:grid-cols-2 gap-5"></div>
      </div>
    `);

    $view.find('.js-toggle-add-book').on('click', () => {
      $view.find('.js-add-book-form').toggleClass('hidden');
    });

    $view.find('.js-lib-filter').on('click', function () {
      libraryFilter = $(this).attr('data-status') as typeof libraryFilter;
      renderLibrarySection();
    });

    $view.find('.js-add-book-form').on('submit', function (e) {
      e.preventDefault();
      const $f = $(this);
      const book_title = String($f.find('input[name="book_title"]').val() || '').trim();
      const author = String($f.find('input[name="author"]').val() || '').trim();
      const translator = String($f.find('input[name="translator"]').val() || '').trim();
      const reading_status = String(
        $f.find('select[name="reading_status"]').val() || 'در حال مطالعه'
      ) as MemberLibraryItem['reading_status'];
      const pages_count =
        parseInt(
          String($f.find('input[name="pages_count"]').val() || '320').replace(
            /[۰-۹]/g,
            (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
          ),
          10
        ) || 320;
      const personal_note = String(
        $f.find('input[name="personal_note"]').val() || ''
      ).trim();

      ApiService.addMemberLibraryBook({
        book_title,
        author,
        translator,
        reading_status,
        pages_count,
        personal_note,
      }).then((res) => {
        state.library.unshift(res.book);
        renderSidebar();
        renderLibrarySection();
      });
    });

    const $grid = $view.find('.js-member-books-grid');
    filteredBooks.forEach((book: MemberLibraryItem) => {
      const $card = $(`
        <div class="bg-[#f8f4ea] border border-[#dcd0bb] rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div class="flex items-start gap-4">
            <img
              src="${book.cover_url}"
              alt="${toPersianDigits(book.book_title)}"
              class="w-20 h-28 object-cover rounded-xl border border-[#d8cbb4] shrink-0 shadow-sm"
            />
            <div class="space-y-1.5 flex-1">
              <div class="flex items-center justify-between gap-2">
                <span class="text-[10.5px] font-bold px-2.5 py-0.5 rounded-md bg-[#ebe2cf] text-[#5a422e]">
                  ${toPersianDigits(book.reading_status)}
                </span>
                <span class="text-[11px] text-[#8a7562]">
                  ${toPersianDigits(book.pages_count)} صفحه
                </span>
              </div>
              <h3 class="text-base font-bold text-[#2c1b0e]">
                ${toPersianDigits(book.book_title)}
              </h3>
              <div class="text-xs text-[#6e5947]">
                ${toPersianDigits(book.author)} · ترجمه ${toPersianDigits(book.translator)}
              </div>
              <p class="text-xs text-[#4e3d2f] leading-6 text-justify pt-1" style="text-align: justify; text-justify: inter-word;">
                ${toPersianDigits(book.personal_note)}
              </p>
            </div>
          </div>

          <div class="space-y-2.5 pt-3 border-t border-[#e8dfd0]">
            <div class="flex items-center justify-between text-xs font-semibold text-[#382315]">
              <span>پیشرفت مطالعه من:</span>
              <span class="js-book-prog-label">٪${toPersianDigits(book.progress_percent)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value="${book.progress_percent}"
              class="js-book-prog-range w-full accent-[#382315] cursor-pointer"
            />
            <div class="flex items-center justify-between gap-2 pt-1">
              <select class="js-book-status-select px-2.5 py-1 text-xs bg-white border border-[#d5c8b2] rounded-lg text-[#2c1f14]">
                <option value="در حال مطالعه" ${book.reading_status === 'در حال مطالعه' ? 'selected' : ''}>در حال مطالعه</option>
                <option value="خوانده‌شده" ${book.reading_status === 'خوانده‌شده' ? 'selected' : ''}>خوانده‌شده</option>
                <option value="در نوبت مطالعه" ${book.reading_status === 'در نوبت مطالعه' ? 'selected' : ''}>در نوبت مطالعه</option>
              </select>
              <button
                type="button"
                class="js-save-book-prog px-3.5 py-1.5 text-xs font-bold text-[#382315] border border-[#8c6f56] hover:border-[#23180f] rounded-xl cursor-pointer bg-transparent"
              >
                ثبت تغییرات
              </button>
            </div>
          </div>
        </div>
      `);

      $card.find('.js-book-prog-range').on('input', function () {
        const val = Number($(this).val() || 0);
        $card.find('.js-book-prog-label').text(`٪${toPersianDigits(val)}`);
      });

      $card.find('.js-save-book-prog').on('click', function () {
        const $btn = $(this);
        const progress_percent = Number(
          $card.find('.js-book-prog-range').val() || 0
        );
        const reading_status = String(
          $card.find('.js-book-status-select').val() || book.reading_status
        ) as MemberLibraryItem['reading_status'];

        $btn.prop('disabled', true).text('در حال ثبت...');
        ApiService.updateMemberLibraryBook({
          bookId: book.id,
          progress_percent: reading_status === 'خوانده‌شده' ? 100 : progress_percent,
          reading_status,
          personal_note: book.personal_note,
        })
          .then((res) => {
            book.progress_percent = res.book.progress_percent;
            book.reading_status = res.book.reading_status;
            renderLibrarySection();
          })
          .finally(() => {
            $btn.prop('disabled', false).text('ثبت تغییرات');
          });
      });

      $grid.append($card);
    });

    $content.empty().append($view);
  }

  // =========================================================================
  // 4. TICKETS VIEW (تیکت)
  // =========================================================================
  function renderTicketsSection(): void {
    const $view = $(`
      <div class="space-y-6">
        <!-- Submit New Ticket Card -->
        <div class="bg-[#f8f4ea] border border-[#dcd0bb] rounded-2xl p-5 sm:p-6 space-y-4">
          <div>
            <h2 class="text-base sm:text-lg font-bold text-[#382315]">ارسال تیکت جدید به دبیرخانه باشگاه</h2>
            <p class="text-xs text-[#645140] mt-1 text-justify">
              پرسش‌ها، درخواست‌های مربوط به حلقه‌های مطالعاتی یا پیشنهاد کتاب برای دوره‌های آینده را از طریق تیکت ثبت نمایید.
            </p>
          </div>

          <form class="js-ticket-form space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="sm:col-span-1">
                <label class="block text-xs font-semibold text-[#4f3f31] mb-1">عنوان تیکت</label>
                <input
                  type="text"
                  name="subject"
                  required
                  placeholder="موضوع درخواست..."
                  class="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#6e492d]"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-[#4f3f31] mb-1">بخش مربوطه</label>
                <select
                  name="department"
                  class="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#6e492d]"
                >
                  <option value="حلقه‌های مطالعاتی">حلقه‌های مطالعاتی</option>
                  <option value="دبیرخانه باشگاه">دبیرخانه باشگاه</option>
                  <option value="پیشنهاد کتاب">پیشنهاد کتاب</option>
                  <option value="پشتیبانی فنی">پشتیبانی فنی</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-[#4f3f31] mb-1">اولویت</label>
                <select
                  name="priority"
                  class="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#6e492d]"
                >
                  <option value="عادی">عادی</option>
                  <option value="مهم">مهم</option>
                  <option value="فوری">فوری</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-[#4f3f31] mb-1">متن پیام تیکت</label>
              <textarea
                name="message"
                rows="3"
                required
                placeholder="شرح کامل پیام یا درخواست خود را بنویسید..."
                class="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#6e492d] text-justify"
              ></textarea>
            </div>

            <div class="flex items-center justify-between">
              <span class="js-ticket-feedback hidden text-xs text-emerald-800">تیکت شما با موفقیت ثبت شد ✓</span>
              <button
                type="submit"
                class="js-submit-ticket mr-auto px-5 py-2 text-xs font-bold text-[#382315] border border-[#8c6f56] hover:border-[#23180f] rounded-xl cursor-pointer bg-transparent"
              >
                ثبت و ارسال تیکت
              </button>
            </div>
          </form>
        </div>

        <!-- Tickets History List -->
        <div class="space-y-4">
          <h3 class="text-sm sm:text-base font-bold text-[#382315]">
            تیکت‌های ثبت‌شده من (${toPersianDigits(state.tickets.length)})
          </h3>
          <div class="js-tickets-list space-y-4"></div>
        </div>
      </div>
    `);

    const $list = $view.find('.js-tickets-list');
    state.tickets.forEach((ticket: MemberTicket) => {
      const isAnswered = ticket.status === 'پاسخ داده‌شده';
      $list.append(`
        <div class="bg-[#f8f4ea] border border-[#dcd0bb] rounded-2xl p-5 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[#e6dccb] pb-2.5">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs font-bold text-[#2c1b0e]">${toPersianDigits(ticket.subject)}</span>
              <span class="text-[11px] px-2 py-0.5 rounded bg-[#efe7d6] text-[#5c4838]">
                ${toPersianDigits(ticket.ticket_code)}
              </span>
            </div>
            <div class="flex items-center gap-2 text-[11px]">
              <span class="px-2.5 py-0.5 rounded-md font-semibold ${
                isAnswered
                  ? 'bg-emerald-900/15 text-emerald-900'
                  : 'bg-amber-900/15 text-amber-900'
              }">${toPersianDigits(ticket.status)}</span>
              <span class="text-[#7a6451]">${toPersianDigits(ticket.department)} · ${toPersianDigits(ticket.created_at)}</span>
            </div>
          </div>

          <p class="text-xs sm:text-[13px] text-[#4e3d2f] leading-6 text-justify" style="text-align: justify; text-justify: inter-word;">
            ${toPersianDigits(ticket.message)}
          </p>

          <div class="bg-[#f2ecde] border-r-4 border-[#6b4c32] rounded-l-xl p-3.5 space-y-1">
            <div class="text-[11px] font-bold text-[#382315]">پاسخ دبیرخانه باشگاه بوک‌میت:</div>
            <p class="text-xs text-[#4a392b] leading-6 text-justify" style="text-align: justify; text-justify: inter-word;">
              ${toPersianDigits(ticket.admin_reply)}
            </p>
          </div>
        </div>
      `);
    });

    $view.find('.js-ticket-form').on('submit', function (e) {
      e.preventDefault();
      const $f = $(this);
      const subject = String($f.find('input[name="subject"]').val() || '').trim();
      const department = String(
        $f.find('select[name="department"]').val() || 'دبیرخانه باشگاه'
      );
      const priority = String(
        $f.find('select[name="priority"]').val() || 'عادی'
      ) as MemberTicket['priority'];
      const message = String($f.find('textarea[name="message"]').val() || '').trim();

      const $btn = $f.find('.js-submit-ticket');
      $btn.prop('disabled', true).text('در حال ارسال...');

      ApiService.createMemberTicket({
        member_phone: state.member.phone,
        subject,
        department,
        priority,
        message,
      })
        .then((res) => {
          state.tickets.unshift(res.ticket);
          renderSidebar();
          renderTicketsSection();
        })
        .finally(() => {
          $btn.prop('disabled', false).text('ثبت و ارسال تیکت');
        });
    });

    $content.empty().append($view);
  }

  // =========================================================================
  // 5. PROFILE VIEW (پروفایل)
  // =========================================================================
  function renderProfileSection(): void {
    const m = state.member;
    const $view = $(`
      <div class="bg-[#f8f4ea] border border-[#dcd0bb] rounded-2xl p-5 sm:p-6 space-y-5">
        <div class="border-b border-[#e6dccb] pb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 class="text-base sm:text-lg font-bold text-[#382315]">اطلاعات پروفایل کاربری</h2>
            <p class="text-xs text-[#645140] mt-0.5 text-justify">
              مشخصات فردی، مقطع تحصیلی و معرفی کوتاه خود در باشگاه کتابخوانی بوک‌میت را ویرایش و ذخیره نمایید.
            </p>
          </div>
          <span class="text-xs font-semibold text-[#6e5947] bg-[#efe7d6] px-3 py-1 rounded-lg">
            کد عضویت: ${toPersianDigits(m.membership_code || 'BM-۱۴۰۵-۱۰۸')}
          </span>
        </div>

        <form class="js-profile-form space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-[#4f3f31] mb-1">نام</label>
              <input
                type="text"
                name="first_name"
                required
                value="${toPersianDigits(m.first_name)}"
                class="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#6e492d]"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-[#4f3f31] mb-1">نام خانوادگی</label>
              <input
                type="text"
                name="last_name"
                required
                value="${toPersianDigits(m.last_name)}"
                class="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#6e492d]"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-[#4f3f31] mb-1">شماره تلفن همراه</label>
              <input
                type="tel"
                name="phone"
                required
                value="${toPersianDigits(m.phone)}"
                class="js-persian-phone w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#6e492d]"
              />
            </div>

            <!-- Custom Styled Education Dropdown in Profile -->
            <div class="js-profile-edu-dropdown relative">
              <label class="block text-xs font-semibold text-[#4f3f31] mb-1">تحصیلات</label>
              <input type="hidden" name="education" value="${m.education}" />
              <button
                type="button"
                class="js-profile-edu-trigger w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#d5c8b2] rounded-xl text-[#2c1f14] flex items-center justify-between cursor-pointer"
              >
                <span class="js-profile-edu-label font-medium">${toPersianDigits(m.education)}</span>
                <svg class="w-3.5 h-3.5 text-[#7a6451]" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="5 7.5 10 12.5 15 7.5"></polyline>
                </svg>
              </button>
              <div class="js-profile-edu-menu hidden absolute right-0 left-0 top-full mt-1 z-30 bg-[#faf6ec] border border-[#cfc0a9] rounded-xl shadow-lg py-1">
                ${EDUCATION_OPTIONS.map(
                  (opt) => `
                  <button
                    type="button"
                    data-val="${opt}"
                    class="js-profile-edu-opt w-full text-right px-3.5 py-1.5 text-xs font-medium text-[#3d2c1e] hover:bg-[#ece2cf] flex items-center justify-between cursor-pointer"
                  >
                    <span>${opt}</span>
                    <span class="${m.education === opt ? 'opacity-100' : 'opacity-0'} text-[#6e492d]">✓</span>
                  </button>
                `
                ).join('')}
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-[#4f3f31] mb-1">پست الکترونیک</label>
              <input
                type="email"
                name="email"
                value="${m.email || 'member@bookmeet.ir'}"
                class="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#6e492d]"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-[#4f3f31] mb-1">شهر محل سکونت</label>
              <input
                type="text"
                name="city"
                value="${toPersianDigits(m.city || 'تهران')}"
                class="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#6e492d]"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-[#4f3f31] mb-1">درباره من و دغدغه‌های مطالعاتی</label>
            <textarea
              name="bio"
              rows="3"
              class="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#6e492d] text-justify"
            >${toPersianDigits(m.bio || '')}</textarea>
          </div>

          <div class="pt-2 border-t border-[#e8dfd0] flex items-center justify-between">
            <span class="js-profile-saved hidden text-xs text-emerald-800 font-semibold">
              اطلاعات پروفایل شما با موفقیت در دیتابیس بروزرسانی شد ✓
            </span>
            <button
              type="submit"
              class="js-save-profile mr-auto px-5 py-2 text-xs font-bold text-[#382315] border border-[#8c6f56] hover:border-[#23180f] rounded-xl cursor-pointer bg-transparent"
            >
              ذخیره تغییرات پروفایل
            </button>
          </div>
        </form>
      </div>
    `);

    const $eduTrigger = $view.find('.js-profile-edu-trigger');
    const $eduMenu = $view.find('.js-profile-edu-menu');
    const $eduInput = $view.find('input[name="education"]');
    const $eduLabel = $view.find('.js-profile-edu-label');

    $eduTrigger.on('click', (e) => {
      e.stopPropagation();
      $eduMenu.toggleClass('hidden');
    });

    $view.find('.js-profile-edu-opt').on('click', function (e) {
      e.stopPropagation();
      const val = String($(this).attr('data-val') || '');
      $eduInput.val(val);
      $eduLabel.text(val);
      $eduMenu.addClass('hidden');
    });

    $view.find('.js-persian-phone').on('input', function () {
      const v = String($(this).val() || '');
      $(this).val(toPersianDigits(v));
    });

    $view.find('.js-profile-form').on('submit', function (e) {
      e.preventDefault();
      const $f = $(this);
      const first_name = String($f.find('input[name="first_name"]').val() || '').trim();
      const last_name = String($f.find('input[name="last_name"]').val() || '').trim();
      const phone = toPersianDigits(
        String($f.find('input[name="phone"]').val() || '').trim()
      );
      const education = String($eduInput.val() || 'کارشناسی ارشد');
      const email = String($f.find('input[name="email"]').val() || '').trim();
      const city = String($f.find('input[name="city"]').val() || '').trim();
      const bio = String($f.find('textarea[name="bio"]').val() || '').trim();

      const $btn = $f.find('.js-save-profile');
      $btn.prop('disabled', true).text('در حال ذخیره...');

      ApiService.updateMemberProfile({
        phone,
        first_name,
        last_name,
        education,
        favorite_genre: m.favorite_genre || 'ادبیات داستانی و رمان کلاسیک',
        email,
        city,
        bio,
      })
        .then((res) => {
          state.member = res.member;
          $wrapper
            .find('.js-header-member-name')
            .text(
              `پنل کاربری ${toPersianDigits(res.member.first_name)} ${toPersianDigits(res.member.last_name)}`
            );
          $wrapper
            .find('.js-member-avatar')
            .text(toPersianDigits((res.member.first_name || 'ع').charAt(0)));
          if (props.onMemberUpdated) {
            props.onMemberUpdated(res.member);
          }
          $view.find('.js-profile-saved').removeClass('hidden');
          window.setTimeout(() => {
            $view.find('.js-profile-saved').addClass('hidden');
          }, 2500);
        })
        .finally(() => {
          $btn.prop('disabled', false).text('ذخیره تغییرات پروفایل');
        });
    });

    $content.empty().append($view);
  }

  // =========================================================================
  // 6. CLUB CALENDAR VIEW (تقویم باشگاه)
  // =========================================================================
  function renderCalendarSection(): void {
    const filteredEvents =
      calendarFilter === 'all'
        ? state.calendarEvents
        : state.calendarEvents.filter((ev) => ev.event_type === calendarFilter);

    const $view = $(`
      <div class="space-y-5">
        <div class="bg-[#f8f4ea] border border-[#dcd0bb] rounded-2xl p-5 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 class="text-base sm:text-lg font-bold text-[#382315]">تقویم نشست‌ها و رویدادهای باشگاه بوک‌میت</h2>
              <p class="text-xs text-[#645140] mt-1 text-justify">
                برنامه زمان‌بندی نشست‌های هم‌خوانی هفتگی، کارگاه‌های خوانش خلاق و جلسات نقد و بررسی در آبان و آذر ۱۴۰۵ به همراه رزرو آنلاین حضور.
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-1.5 bg-[#efe7d6] p-1 rounded-xl border border-[#dfd3be] w-fit">
            ${[
              'all',
              'هم‌خوانی هفتگی',
              'نشست نقد و بررسی',
              'کارگاه خوانش',
              'نشست ویژه با مترجم',
            ]
              .map(
                (type) => `
              <button
                type="button"
                data-type="${type}"
                class="js-cal-filter px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  calendarFilter === type
                    ? 'bg-[#382315] text-[#faf6ec]'
                    : 'text-[#5c4838]'
                }"
              >
                ${type === 'all' ? 'همه رویدادها' : type}
              </button>
            `
              )
              .join('')}
          </div>
        </div>

        <div class="js-calendar-grid space-y-4"></div>
      </div>
    `);

    $view.find('.js-cal-filter').on('click', function () {
      calendarFilter = String($(this).attr('data-type') || 'all');
      renderCalendarSection();
    });

    const $grid = $view.find('.js-calendar-grid');
    filteredEvents.forEach((ev: ClubCalendarEvent) => {
      const reserved = ev.is_reserved === 1;
      const $card = $(`
        <div class="bg-[#f8f4ea] border border-[#dcd0bb] rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div class="flex items-start gap-4 flex-1">
            <!-- Date Badge Box -->
            <div class="w-16 h-18 rounded-2xl bg-[#382315] text-[#faf6ec] flex flex-col items-center justify-center shrink-0 p-2 text-center shadow-sm">
              <span class="text-lg font-extrabold leading-none">${toPersianDigits(ev.day_of_month)}</span>
              <span class="text-[10.5px] font-medium text-[#e4d8c4] mt-1">${toPersianDigits(ev.month_name)}</span>
            </div>

            <div class="space-y-1.5 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#ebe2cf] text-[#5a422e]">
                  ${toPersianDigits(ev.event_type)}
                </span>
                <span class="text-xs text-[#7a6451]">
                  ${toPersianDigits(ev.weekday_name)} · ساعت ${toPersianDigits(ev.time_range)}
                </span>
                <span class="text-[11px] text-[#8a6a4a] font-medium">
                  (${toPersianDigits(ev.capacity_info)})
                </span>
              </div>

              <h3 class="text-sm sm:text-base font-bold text-[#2c1b0e]">
                ${toPersianDigits(ev.title)}
              </h3>

              <p class="text-xs text-[#4e3d2f] leading-6 text-justify" style="text-align: justify; text-justify: inter-word;">
                ${toPersianDigits(ev.description)}
              </p>

              <div class="text-[11px] text-[#6e5947] pt-0.5">
                <strong>میزبان نشست:</strong> ${toPersianDigits(ev.host_name)} · <strong>مکان:</strong> ${toPersianDigits(ev.location_label)}
              </div>
            </div>
          </div>

          <div class="shrink-0 w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#e6dccb]">
            <button
              type="button"
              class="js-reserve-event px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                reserved
                  ? 'bg-emerald-900/15 text-emerald-900 border border-emerald-800/30 hover:bg-emerald-900/25'
                  : 'bg-transparent text-[#382315] border border-[#8c6f56] hover:border-[#23180f]'
              }"
            >
              ${reserved ? 'رزرو شده ✓ (لغو رزرو)' : 'رزرو حضور در نشست'}
            </button>
          </div>
        </div>
      `);

      $card.find('.js-reserve-event').on('click', function () {
        const $btn = $(this);
        $btn.prop('disabled', true);
        ApiService.toggleCalendarReservation(ev.id).then((res) => {
          ev.is_reserved = res.event.is_reserved;
          renderSidebar();
          renderCalendarSection();
        });
      });

      $grid.append($card);
    });

    $content.empty().append($view);
  }

  function renderActiveSection(): void {
    switch (activeTab) {
      case 'dashboard':
        renderDashboardSection();
        break;
      case 'sessions':
        renderSessionsSection();
        break;
      case 'library':
        renderLibrarySection();
        break;
      case 'tickets':
        renderTicketsSection();
        break;
      case 'profile':
        renderProfileSection();
        break;
      case 'calendar':
        renderCalendarSection();
        break;
    }
  }

  $wrapper.find('.js-back-to-site-btn').on('click', () => {
    props.onBackToSite();
  });

  $wrapper.find('.js-logout-btn').on('click', () => {
    props.onLogout();
  });

  renderSidebar();
  renderActiveSection();

  return $wrapper;
}
