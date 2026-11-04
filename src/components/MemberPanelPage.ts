import $ from 'jquery';
import { ApiService } from '../services/api.ts';
import type {
  ClubCalendarEvent,
  ClubMember,
  MemberClassItem,
  MemberLibraryItem,
  MemberPanelPayload,
  MemberSession,
  MemberTicket,
  SessionSubItem,
} from '../types/models.ts';
import { toPersianDigits } from '../utils/persianNumbers.ts';

export type PanelTabKey =
  | 'dashboard'
  | 'sessions'
  | 'classes'
  | 'library'
  | 'tickets'
  | 'profile'
  | 'calendar';

export interface MemberPanelPageProps {
  initialData: MemberPanelPayload;
  onBackToSite: () => void;
  onLogout: () => void;
  onMemberUpdated: (member: ClubMember) => void;
}

function parseLocalizedInt(raw: string, fallback = 0): number {
  const normalized = String(raw || '')
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[^\d]/g, '');
  const parsed = parseInt(normalized, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function createMemberPanelPageComponent(props: MemberPanelPageProps): JQuery {
  let state: MemberPanelPayload = {
    member: { ...props.initialData.member },
    sessions: [...(props.initialData.sessions || [])],
    classes: [...(props.initialData.classes || [])],
    library: [...(props.initialData.library || [])],
    tickets: [...(props.initialData.tickets || [])],
    calendarEvents: [...(props.initialData.calendarEvents || [])],
  };

  let activeTab: PanelTabKey = 'dashboard';
  let selectedSessionId: number | null = null;
  let selectedClassId: number | null = null;
  let activeSubSessionModal: {
    subItem: SessionSubItem;
    parentTitle: string;
    bookTitle: string;
    mentorName: string;
  } | null = null;

  const $wrapper = $(`
    <section
      aria-label="پنل کاربری اعضای باشگاه کتابخوانی بوک‌میت"
      class="w-full max-w-[1440px] mx-auto px-5 sm:px-10 md:px-16 lg:px-20 pt-6 pb-20"
    ></section>
  `);

  function showToast(message: string, isError = false): void {
    const $existing = $wrapper.find('.js-panel-toast');
    $existing.remove();
    const $toast = $(`
      <div class="js-panel-toast fixed bottom-6 left-6 z-50 px-5 py-3.5 rounded-xl border shadow-[0_16px_36px_rgba(44,30,22,0.18)] text-[13.5px] font-medium flex items-center gap-2.5 transition-all duration-300 ${
        isError
          ? 'bg-[#FDF3F2] border-[#E6B8B3] text-[#8E2A22]'
          : 'bg-[#F4F9F5] border-[#BBD9C2] text-[#235332]'
      }">
        <span class="w-2 h-2 rounded-full ${isError ? 'bg-[#B43E34]' : 'bg-[#2E6F40]'}"></span>
        <span>${toPersianDigits(message)}</span>
      </div>
    `);
    $wrapper.append($toast);
    window.setTimeout(() => {
      $toast.fadeOut(250, () => $toast.remove());
    }, 3400);
  }

  function renderSubSessionModal(): string {
    if (!activeSubSessionModal) return '';
    const { subItem, parentTitle, bookTitle, mentorName } = activeSubSessionModal;
    const isHeld = subItem.status === 'برگزار شده';

    if (isHeld) {
      return `
        <div
          class="js-subsession-modal-backdrop fixed inset-0 z-50 bg-[#1E140E]/60 backdrop-blur-[3px] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div class="js-subsession-modal-dialog w-full max-w-[620px] rounded-2xl bg-[#FAF5EC] border border-[#DECBB3] shadow-[0_24px_64px_rgba(28,18,12,0.32)] overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            <div class="px-6 py-4 bg-[#F2E6D5] border-b border-[#E2D2BC] flex items-center justify-between gap-3">
              <div class="flex items-center gap-2.5">
                <span class="px-2.5 py-1 rounded-md text-[11.5px] font-semibold bg-[#E4F2E7] text-[#235332]">
                  ${toPersianDigits(subItem.session_number)} · برگزار شده
                </span>
                <h4 class="font-display text-[17px] font-bold text-[#231912]">
                  ${toPersianDigits(subItem.title)}
                </h4>
              </div>
              <button
                type="button"
                class="js-close-subsession-modal text-[#6B5444] hover:text-[#231912] p-1.5 transition-colors cursor-pointer"
                aria-label="بستن مودال"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div class="p-6 space-y-4">
              <div class="text-[12.5px] text-[#6B5444] flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>دوره: <strong class="text-[#2B1E16]">${toPersianDigits(parentTitle)}</strong></span>
                <span>کتاب: <strong class="text-[#2B1E16]">${toPersianDigits(bookTitle)}</strong></span>
                <span>تسهیل‌گر: <strong class="text-[#2B1E16]">${toPersianDigits(mentorName)}</strong></span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="p-3.5 rounded-xl bg-[#F4E9DA]/85 border border-[#E5D6C3]">
                  <span class="block text-[11.5px] text-[#7D6452] mb-1">تاریخ برگزاری</span>
                  <strong class="text-[13.5px] font-bold text-[#231912]">
                    ${toPersianDigits(subItem.session_date)}
                  </strong>
                </div>
                <div class="p-3.5 rounded-xl bg-[#F4E9DA]/85 border border-[#E5D6C3]">
                  <span class="block text-[11.5px] text-[#7D6452] mb-1">زمان برگزاری</span>
                  <strong class="text-[13.5px] font-bold text-[#231912]">
                    ${toPersianDigits(subItem.session_time)}
                  </strong>
                </div>
                <div class="p-3.5 rounded-xl bg-[#F4E9DA]/85 border border-[#E5D6C3]">
                  <span class="block text-[11.5px] text-[#7D6452] mb-1">تعداد صفحات خوانده شده</span>
                  <strong class="text-[13.5px] font-bold text-[#235332]">
                    ${toPersianDigits(subItem.pages_read || 0)} صفحه
                  </strong>
                </div>
              </div>

              <div class="p-4 rounded-xl bg-[#FDFBF7] border border-[#E6D7C3]">
                <h5 class="text-[13px] font-bold text-[#6E4526] mb-1.5 flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#7A4B2A]"></span>
                  <span>مواردی که در جلسه قبل بررسی شده است</span>
                </h5>
                <p class="text-[13px] text-[#3F2F23] leading-[1.9] text-justify">
                  ${toPersianDigits(subItem.reviewed_topics || 'مرور سرفصل‌های آغازین کتاب و تحلیل ساختار کلی اثر.')}
                </p>
              </div>

              <div class="p-4 rounded-xl bg-[#FDFBF7] border border-[#E6D7C3]">
                <h5 class="text-[13px] font-bold text-[#6E4526] mb-1.5 flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#2E6F40]"></span>
                  <span>نکات آن جلسه</span>
                </h5>
                <p class="text-[13px] text-[#3F2F23] leading-[1.9] text-justify">
                  ${toPersianDigits(subItem.session_notes || 'تحلیل شخصیت‌پردازی و بررسی یادداشت‌های اعضای حلقه مطالعاتی.')}
                </p>
              </div>

              <div class="pt-2 flex justify-end">
                <button
                  type="button"
                  class="js-close-subsession-modal px-5 py-2.5 rounded-xl border border-[#C5B198] text-[13px] font-semibold text-[#3D2E22] hover:bg-[#EFE2CE] transition-colors cursor-pointer"
                >
                  بستن پنجره
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div
        class="js-subsession-modal-backdrop fixed inset-0 z-50 bg-[#1E140E]/60 backdrop-blur-[3px] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
      >
        <div class="js-subsession-modal-dialog w-full max-w-[580px] rounded-2xl bg-[#FAF5EC] border border-[#DECBB3] shadow-[0_24px_64px_rgba(28,18,12,0.32)] overflow-hidden animate-[fadeIn_0.2s_ease-out]">
          <div class="px-6 py-4 bg-[#F2E6D5] border-b border-[#E2D2BC] flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5">
              <span class="px-2.5 py-1 rounded-md text-[11.5px] font-semibold bg-[#EFE0CC] text-[#6E4526]">
                ${toPersianDigits(subItem.session_number)} · جلسه تعریف شده
              </span>
              <h4 class="font-display text-[17px] font-bold text-[#231912]">
                ${toPersianDigits(subItem.title)}
              </h4>
            </div>
            <button
              type="button"
              class="js-close-subsession-modal text-[#6B5444] hover:text-[#231912] p-1.5 transition-colors cursor-pointer"
              aria-label="بستن مودال"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="p-6 space-y-4">
            <div class="text-[12.5px] text-[#6B5444] flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>دوره: <strong class="text-[#2B1E16]">${toPersianDigits(parentTitle)}</strong></span>
              <span>کتاب: <strong class="text-[#2B1E16]">${toPersianDigits(bookTitle)}</strong></span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="p-3.5 rounded-xl bg-[#F4E9DA]/85 border border-[#E5D6C3]">
                <span class="block text-[11.5px] text-[#7D6452] mb-1">تاریخ برگزاری</span>
                <strong class="text-[14px] font-bold text-[#231912]">
                  ${toPersianDigits(subItem.session_date)}
                </strong>
              </div>
              <div class="p-3.5 rounded-xl bg-[#F4E9DA]/85 border border-[#E5D6C3]">
                <span class="block text-[11.5px] text-[#7D6452] mb-1">زمان برگزاری</span>
                <strong class="text-[14px] font-bold text-[#231912]">
                  ${toPersianDigits(subItem.session_time)}
                </strong>
              </div>
            </div>

            <div class="p-4 rounded-xl bg-[#FDFBF7] border border-[#E6D7C3]">
              <h5 class="text-[13px] font-bold text-[#6E4526] mb-1.5 flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-[#7A4B2A]"></span>
                <span>صفحاتی که باید خوانده شود</span>
              </h5>
              <p class="text-[13.5px] font-semibold text-[#231912] leading-[1.85]">
                ${toPersianDigits(subItem.pages_to_read || 'طبق برنامه اعلام‌شده در سرفصل جلسه')}
              </p>
            </div>

            <div class="p-4 rounded-xl bg-[#F3E7D6] border border-[#DEC8AC]">
              <span class="block text-[12px] font-bold text-[#5A4332] mb-2">
                لینک ورود به جلسه:
              </span>
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span dir="ltr" class="text-[12.5px] font-mono text-[#3F2E21] bg-[#FAF5EC] px-3 py-2 rounded-lg border border-[#E2D2BC] select-all truncate">
                  ${subItem.meeting_link || 'https://meet.bookmeet.ir/live-session'}
                </span>
                <a
                  href="${subItem.meeting_link || 'https://meet.bookmeet.ir/live-session'}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="px-4 py-2 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[12.5px] font-semibold text-center transition-colors shrink-0"
                >
                  ورود مستقیم به جلسه
                </a>
              </div>
            </div>

            <div class="pt-2 flex justify-end">
              <button
                type="button"
                class="js-close-subsession-modal px-5 py-2.5 rounded-xl border border-[#C5B198] text-[13px] font-semibold text-[#3D2E22] hover:bg-[#EFE2CE] transition-colors cursor-pointer"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderDashboardTab(): string {
    const activeBooksCount = state.library.filter(
      (b) => b.reading_status === 'در حال مطالعه'
    ).length;
    const completedBooksCount = state.library.filter(
      (b) => b.reading_status === 'خوانده‌شده'
    ).length;
    const upcomingSessionsCount = state.sessions.length;
    const openTicketsCount = state.tickets.filter(
      (t) => t.status !== 'بسته‌شده'
    ).length;

    const nextSession = state.sessions[0];
    const currentReadingBook =
      state.library.find((b) => b.reading_status === 'در حال مطالعه') || state.library[0];

    return `
      <div class="space-y-7">
        <!-- Welcome Banner -->
        <div class="p-6 sm:p-7 rounded-2xl bg-gradient-to-l from-[#EFE3D1] via-[#F5ECDE] to-[#FAF5EC] border border-[#E2D3BF] flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <span class="inline-block text-[12px] font-semibold text-[#7A4B2A] mb-1.5">
              خوش آمدید به میز مطالعه شخصی شما
            </span>
            <h2 class="font-display text-[22px] sm:text-[26px] font-bold text-[#231912] mb-2">
              ${state.member.first_name} ${state.member.last_name} عزیز، هم‌خوانی این هفته در جریان است
            </h2>
            <p class="text-[13.5px] text-[#5B4739] leading-[1.85] text-justify max-w-[680px]">
              از طریق این پنل می‌توانید به کارت جلسات ثبت‌نام شده و کلاس‌های خود وارد شوید، جزئیات جلسات برگزار شده و تعریف شده را مشاهده کنید و با ثبت صفحات خوانده‌شده، پیشرفت مطالعه خود را دنبال نمایید.
            </p>
          </div>
          <div class="shrink-0 flex flex-col items-start md:items-end gap-2 bg-[#FAF5EC]/90 px-4 py-3.5 rounded-xl border border-[#DFCWB7]">
            <span class="text-[11.5px] text-[#7A6352]">کد عضویت باشگاه:</span>
            <strong class="text-[14.5px] font-bold text-[#2C1E16] tracking-wide">
              ${toPersianDigits(state.member.membership_code || 'BM-۱۴۰۵-۱۰۸')}
            </strong>
            <span class="text-[11.5px] text-[#6E5644]">
              عضویت از ${toPersianDigits(state.member.joined_date || 'مهر ۱۴۰۴')}
            </span>
          </div>
        </div>

        <!-- 4 KPI Cards (Item 4: جلسات ثبت‌نام شده من) -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="p-5 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] shadow-[0_6px_20px_rgba(61,46,34,0.04)]">
            <span class="text-[12px] text-[#7A6250] block mb-1.5">جلسات ثبت‌نام شده من</span>
            <div class="font-display text-[28px] font-bold text-[#231912]">
              ${toPersianDigits(upcomingSessionsCount)}
            </div>
            <span class="text-[11.5px] text-[#5E7A65] mt-1 inline-block">حلقه مطالعاتی فعال</span>
          </div>

          <div class="p-5 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] shadow-[0_6px_20px_rgba(61,46,34,0.04)]">
            <span class="text-[12px] text-[#7A6250] block mb-1.5">کتاب‌های در حال مطالعه</span>
            <div class="font-display text-[28px] font-bold text-[#231912]">
              ${toPersianDigits(activeBooksCount)}
            </div>
            <span class="text-[11.5px] text-[#7A4B2A] mt-1 inline-block">در قفسه شخصی شما</span>
          </div>

          <div class="p-5 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] shadow-[0_6px_20px_rgba(61,46,34,0.04)]">
            <span class="text-[12px] text-[#7A6250] block mb-1.5">آثار خوانده‌شده</span>
            <div class="font-display text-[28px] font-bold text-[#231912]">
              ${toPersianDigits(completedBooksCount)}
            </div>
            <span class="text-[11.5px] text-[#6B5444] mt-1 inline-block">ثبت‌شده در کارنامه</span>
          </div>

          <div class="p-5 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] shadow-[0_6px_20px_rgba(61,46,34,0.04)]">
            <span class="text-[12px] text-[#7A6250] block mb-1.5">تیکت‌های پشتیبانی</span>
            <div class="font-display text-[28px] font-bold text-[#231912]">
              ${toPersianDigits(openTicketsCount)}
            </div>
            <span class="text-[11.5px] text-[#6B5444] mt-1 inline-block">پاسخگویی دبیرخانه</span>
          </div>
        </div>

        <!-- Two Column Overview -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Next Session Card -->
          <div class="p-6 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-display text-[17px] font-bold text-[#231912]">
                  نشست پیشِ روی شما
                </h3>
                <button
                  type="button"
                  data-switch-tab="sessions"
                  class="js-switch-tab-btn text-[12px] font-semibold text-[#7A4B2A] hover:text-[#231912] cursor-pointer"
                >
                  مشاهده همه جلسات ←
                </button>
              </div>
              ${
                nextSession
                  ? `
                <div
                  data-open-session-id="${nextSession.id}"
                  class="js-open-session-card p-4 rounded-xl bg-[#F3E9DA]/80 border border-[#E2D2BC] space-y-2.5 cursor-pointer hover:border-[#8B5A36] transition-all"
                >
                  <div class="flex items-center justify-between gap-2">
                    <span class="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#E4F0E6] text-[#265934]">
                      ${toPersianDigits(nextSession.status)}
                    </span>
                    <span class="text-[11.5px] font-semibold text-[#7A4B2A]">
                      ${toPersianDigits((nextSession.sub_sessions || []).length)} جلسه در این دوره
                    </span>
                  </div>
                  <h4 class="font-bold text-[15px] text-[#231912]">
                    ${toPersianDigits(nextSession.title)}
                  </h4>
                  <p class="text-[12.5px] text-[#5E493A]">
                    کتاب محور نشست: <strong>${toPersianDigits(nextSession.book_title)}</strong> · با حضور ${toPersianDigits(nextSession.mentor_name)}
                  </p>
                  <div class="pt-2 border-t border-[#E2D2BC]/70 flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#4E3B2D]">
                    <span>زمان: ${toPersianDigits(nextSession.session_date)}</span>
                    <span>ساعت ${toPersianDigits(nextSession.session_time)}</span>
                  </div>
                </div>
              `
                  : `<p class="text-[13px] text-[#6B5444]">هنوز جلسه‌ای ثبت نشده است.</p>`
              }
            </div>
          </div>

          <!-- Current Reading Progress Card -->
          <div class="p-6 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-display text-[17px] font-bold text-[#231912]">
                  کتاب در دست مطالعه من
                </h3>
                <button
                  type="button"
                  data-switch-tab="library"
                  class="js-switch-tab-btn text-[12px] font-semibold text-[#7A4B2A] hover:text-[#231912] cursor-pointer"
                >
                  مدیریت کتابخانه من ←
                </button>
              </div>
              ${
                currentReadingBook
                  ? `
                <div class="flex items-start gap-4 p-4 rounded-xl bg-[#F3E9DA]/80 border border-[#E2D2BC]">
                  <img
                    src="${currentReadingBook.cover_url}"
                    alt="${currentReadingBook.book_title}"
                    class="w-16 h-24 object-cover rounded-lg border border-[#D8C5AC] shrink-0"
                  />
                  <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-[15px] text-[#231912] truncate">
                      ${toPersianDigits(currentReadingBook.book_title)}
                    </h4>
                    <p class="text-[12px] text-[#6B5444] mt-0.5">
                      ${toPersianDigits(currentReadingBook.author)} · ترجمه ${toPersianDigits(currentReadingBook.translator)}
                    </p>
                    <div class="mt-3">
                      <div class="flex items-center justify-between text-[11.5px] text-[#4E3B2D] mb-1">
                        <span>پیشرفت مطالعه (${toPersianDigits(currentReadingBook.pages_read || 0)} از ${toPersianDigits(currentReadingBook.pages_count)} صفحه)</span>
                        <strong class="font-bold">${toPersianDigits(currentReadingBook.progress_percent)}٪</strong>
                      </div>
                      <div class="w-full h-2 rounded-full bg-[#E3D3BE] overflow-hidden">
                        <div
                          class="h-full rounded-full bg-[#7A4B2A] transition-all duration-700"
                          style="width: ${currentReadingBook.progress_percent}%"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              `
                  : `<p class="text-[13px] text-[#6B5444]">کتابی در قفسه شما ثبت نشده است.</p>`
              }
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderSubSessionsDetailSection(params: {
    parentTitle: string;
    bookTitle: string;
    mentorLabel: string;
    mentorName: string;
    scheduleText: string;
    subSessions: SessionSubItem[];
    backButtonClass: string;
    backButtonLabel: string;
    extraFooterHtml?: string;
  }): string {
    const heldList = (params.subSessions || []).filter(
      (item) => item.status === 'برگزار شده'
    );
    const definedList = (params.subSessions || []).filter(
      (item) => item.status === 'تعریف شده'
    );

    return `
      <div class="space-y-7">
        <!-- Top Header & Back Button -->
        <div class="p-6 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <button
              type="button"
              class="${params.backButtonClass} inline-flex items-center gap-2 text-[12.5px] font-semibold text-[#7A4B2A] hover:text-[#231912] mb-2.5 cursor-pointer"
            >
              <span>→</span>
              <span>${params.backButtonLabel}</span>
            </button>
            <h2 class="font-display text-[21px] sm:text-[24px] font-bold text-[#231912]">
              ${toPersianDigits(params.parentTitle)}
            </h2>
            <div class="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-[#5B4739]">
              <span>اثر مورد بررسی: <strong class="text-[#231912]">${toPersianDigits(params.bookTitle)}</strong></span>
              <span>${params.mentorLabel}: <strong class="text-[#231912]">${toPersianDigits(params.mentorName)}</strong></span>
              <span>برنامه: <strong class="text-[#231912]">${toPersianDigits(params.scheduleText)}</strong></span>
            </div>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <div class="px-4 py-2.5 rounded-xl bg-[#E4F2E7] text-[#235332] text-[12.5px] font-semibold">
              ${toPersianDigits(heldList.length)} جلسه برگزار شده
            </div>
            <div class="px-4 py-2.5 rounded-xl bg-[#EFE0CC] text-[#6E4526] text-[12.5px] font-semibold">
              ${toPersianDigits(definedList.length)} جلسه تعریف شده
            </div>
          </div>
        </div>

        <!-- Held Sessions Cards (جلسات برگزار شده) -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-display text-[18px] font-bold text-[#231912] flex items-center gap-2.5">
              <span class="w-2.5 h-2.5 rounded-full bg-[#2E6F40]"></span>
              <span>جلسات برگزار شده</span>
            </h3>
            <span class="text-[12px] text-[#6B5444]">
              برای مشاهده موارد بررسی‌شده، نکات جلسه و صفحات خوانده‌شده روی هر کارت کلیک کنید
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${heldList
              .map(
                (sub) => `
              <div
                data-subsession-id="${sub.id}"
                class="js-open-subsession-modal group p-5 rounded-2xl bg-[#FAF5EC] border border-[#E2D3BF] hover:border-[#2E6F40] hover:shadow-[0_12px_28px_rgba(46,111,64,0.1)] transition-all cursor-pointer flex flex-col justify-between gap-4"
              >
                <div>
                  <div class="flex items-center justify-between gap-2 mb-3">
                    <span class="px-2.5 py-1 rounded-md text-[11.5px] font-semibold bg-[#E4F2E7] text-[#235332]">
                      ${toPersianDigits(sub.session_number)} · برگزار شده
                    </span>
                    <span class="text-[12px] font-semibold text-[#235332]">
                      ${toPersianDigits(sub.pages_read || 0)} صفحه خوانده شده
                    </span>
                  </div>
                  <h4 class="font-display text-[16.5px] font-bold text-[#231912] group-hover:text-[#235332] transition-colors mb-2">
                    ${toPersianDigits(sub.title)}
                  </h4>
                  <p class="text-[12.5px] text-[#5B4739] line-clamp-2 leading-[1.8] text-justify">
                    ${toPersianDigits(sub.session_notes || sub.reviewed_topics || '')}
                  </p>
                </div>

                <div class="pt-3 border-t border-[#E6D8C5] flex items-center justify-between text-[12px] text-[#6B5444]">
                  <span>تاریخ: <strong class="text-[#231912]">${toPersianDigits(sub.session_date)}</strong> · ساعت <strong class="text-[#231912]">${toPersianDigits(sub.session_time)}</strong></span>
                  <span class="text-[#235332] font-semibold group-hover:translate-x-[-3px] transition-transform">
                    مشاهده جزئیات جلسه ←
                  </span>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Defined / Upcoming Sessions Cards (جلسات تعریف شده / برگزار نشده) -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-display text-[18px] font-bold text-[#231912] flex items-center gap-2.5">
              <span class="w-2.5 h-2.5 rounded-full bg-[#7A4B2A]"></span>
              <span>جلسات تعریف شده (برگزار نشده)</span>
            </h3>
            <span class="text-[12px] text-[#6B5444]">
              برای مشاهده زمان، صفحات مورد نیاز برای مطالعه و لینک ورود روی کارت کلیک کنید
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${definedList
              .map(
                (sub) => `
              <div
                data-subsession-id="${sub.id}"
                class="js-open-subsession-modal group p-5 rounded-2xl bg-[#FAF5EC] border border-[#E2D3BF] hover:border-[#7A4B2A] hover:shadow-[0_12px_28px_rgba(122,75,42,0.12)] transition-all cursor-pointer flex flex-col justify-between gap-4"
              >
                <div>
                  <div class="flex items-center justify-between gap-2 mb-3">
                    <span class="px-2.5 py-1 rounded-md text-[11.5px] font-semibold bg-[#EFE0CC] text-[#6E4526]">
                      ${toPersianDigits(sub.session_number)} · تعریف شده
                    </span>
                    <span class="text-[12px] font-semibold text-[#7A4B2A]">
                      آماده برگزاری
                    </span>
                  </div>
                  <h4 class="font-display text-[16.5px] font-bold text-[#231912] group-hover:text-[#7A4B2A] transition-colors mb-2">
                    ${toPersianDigits(sub.title)}
                  </h4>
                  <p class="text-[12.5px] text-[#5B4739] leading-[1.8] text-justify">
                    صفحات مورد مطالعه: <strong class="text-[#231912]">${toPersianDigits(sub.pages_to_read || 'اعلام در سرفصل')}</strong>
                  </p>
                </div>

                <div class="pt-3 border-t border-[#E6D8C5] flex items-center justify-between text-[12px] text-[#6B5444]">
                  <span>تاریخ: <strong class="text-[#231912]">${toPersianDigits(sub.session_date)}</strong> · ساعت <strong class="text-[#231912]">${toPersianDigits(sub.session_time)}</strong></span>
                  <span class="text-[#7A4B2A] font-semibold group-hover:translate-x-[-3px] transition-transform">
                    مشاهده و لینک ورود ←
                  </span>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        ${params.extraFooterHtml || ''}
      </div>
    `;
  }

  function renderSessionsTab(): string {
    if (selectedSessionId !== null) {
      const session = state.sessions.find((s) => s.id === selectedSessionId);
      if (session) {
        const noteSectionHtml = `
          <div class="p-6 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5]">
            <label class="block text-[13px] font-bold text-[#231912] mb-2">
              یادداشت و پرسش شخصی شما برای این دوره هم‌خوانی:
            </label>
            <div class="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                data-session-id="${session.id}"
                value="${toPersianDigits(session.member_note || '')}"
                placeholder="یادداشت یا محور مدنظر خود برای طرح در جلسه را بنویسید..."
                class="js-session-note-input flex-1 px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
              />
              <button
                type="button"
                data-session-id="${session.id}"
                class="js-save-session-note px-5 py-2.5 rounded-xl border border-[#7A4B2A] text-[#7A4B2A] hover:bg-[#7A4B2A] hover:text-[#FAF5EC] text-[12.5px] font-semibold transition-colors cursor-pointer shrink-0"
              >
                ذخیره یادداشت
              </button>
            </div>
          </div>
        `;

        return renderSubSessionsDetailSection({
          parentTitle: session.title,
          bookTitle: session.book_title,
          mentorLabel: 'تسهیل‌گر',
          mentorName: session.mentor_name,
          scheduleText: `${session.session_date} · ساعت ${session.session_time}`,
          subSessions: session.sub_sessions || [],
          backButtonClass: 'js-back-to-sessions-list',
          backButtonLabel: 'بازگشت به کارت‌های جلسات ثبت‌نام شده',
          extraFooterHtml: noteSectionHtml,
        });
      }
    }

    // Card Grid View for Registered Sessions (Items 5 & 6: No حضوری badge, Card layout, Clickable to enter session detail)
    return `
      <div class="space-y-6">
        <div>
          <h2 class="font-display text-[20px] sm:text-[23px] font-bold text-[#231912]">
            جلسات ثبت‌نام شده من
          </h2>
          <p class="text-[13.5px] text-[#6B5444] mt-1 text-justify">
            در این بخش کارت جلسات و حلقه‌های هم‌خوانی که در آن‌ها ثبت‌نام کرده‌اید نمایش داده می‌شود. برای مشاهده جلسات برگزار شده و جلسات تعریف شده روی کارت مورد نظر کلیک کنید.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          ${state.sessions
            .map((session) => {
              const heldCount = (session.sub_sessions || []).filter(
                (s) => s.status === 'برگزار شده'
              ).length;
              const definedCount = (session.sub_sessions || []).filter(
                (s) => s.status === 'تعریف شده'
              ).length;

              return `
                <article
                  data-open-session-id="${session.id}"
                  class="js-open-session-card group p-6 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] hover:border-[#8B5A36] hover:shadow-[0_14px_34px_rgba(61,46,34,0.1)] transition-all cursor-pointer flex flex-col justify-between gap-5"
                >
                  <div>
                    <div class="flex items-center justify-between gap-2 mb-3.5">
                      <span class="px-3 py-1 rounded-md text-[11.5px] font-semibold bg-[#E4F2E7] text-[#235332]">
                        ${toPersianDigits(session.status)}
                      </span>
                      <span class="text-[12px] font-semibold text-[#7A4B2A]">
                        ${toPersianDigits(heldCount + definedCount)} نشست تخصصی
                      </span>
                    </div>

                    <h3 class="font-display text-[17.5px] font-bold text-[#231912] group-hover:text-[#7A4B2A] transition-colors leading-[1.6] mb-2.5">
                      ${toPersianDigits(session.title)}
                    </h3>

                    <div class="space-y-1.5 text-[12.5px] text-[#5B4739]">
                      <div>اثر محور جلسه: <strong class="text-[#231912]">${toPersianDigits(session.book_title)}</strong></div>
                      <div>تسهیل‌گر: <strong class="text-[#231912]">${toPersianDigits(session.mentor_name)}</strong></div>
                      <div>نشست پیش رو: <strong class="text-[#231912]">${toPersianDigits(session.session_date)} · ساعت ${toPersianDigits(session.session_time)}</strong></div>
                    </div>
                  </div>

                  <div class="pt-4 border-t border-[#E6D8C5] space-y-3">
                    <div class="flex items-center justify-between text-[11.5px]">
                      <span class="px-2.5 py-1 rounded-md bg-[#E4F2E7]/80 text-[#235332] font-medium">
                        ${toPersianDigits(heldCount)} جلسه برگزار شده
                      </span>
                      <span class="px-2.5 py-1 rounded-md bg-[#EFE0CC]/80 text-[#6E4526] font-medium">
                        ${toPersianDigits(definedCount)} جلسه تعریف شده
                      </span>
                    </div>

                    <div class="w-full py-2.5 rounded-xl bg-[#F3E7D6] group-hover:bg-[#5A3A22] text-[#3F2E21] group-hover:text-[#FAF5EC] text-[12.5px] font-semibold text-center transition-colors">
                      ورود به صفحه جلسه و مشاهده جزئیات ←
                    </div>
                  </div>
                </article>
              `;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  function renderClassesTab(): string {
    if (selectedClassId !== null) {
      const cls = state.classes.find((c) => c.id === selectedClassId);
      if (cls) {
        return renderSubSessionsDetailSection({
          parentTitle: cls.title,
          bookTitle: cls.book_title,
          mentorLabel: 'مدرس دوره',
          mentorName: cls.instructor_name,
          scheduleText: cls.schedule_summary,
          subSessions: cls.sub_sessions || [],
          backButtonClass: 'js-back-to-classes-list',
          backButtonLabel: 'بازگشت به لیست کلاس‌های من',
        });
      }
    }

    return `
      <div class="space-y-6">
        <div>
          <h2 class="font-display text-[20px] sm:text-[23px] font-bold text-[#231912]">
            کلاس‌های من
          </h2>
          <p class="text-[13.5px] text-[#6B5444] mt-1 text-justify">
            کارگاه‌ها و کلاس‌های آموزشی ثبت‌نام شده شما در باشگاه کتابخوانی بوک‌میت. با کلیک بر روی هر کارت می‌توانید وارد صفحه کلاس شده و جلسات برگزار شده و تعریف شده را بررسی نمایید.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          ${state.classes
            .map((cls) => {
              const heldCount = (cls.sub_sessions || []).filter(
                (s) => s.status === 'برگزار شده'
              ).length;
              const definedCount = (cls.sub_sessions || []).filter(
                (s) => s.status === 'تعریف شده'
              ).length;

              return `
                <article
                  data-open-class-id="${cls.id}"
                  class="js-open-class-card group p-6 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] hover:border-[#8B5A36] hover:shadow-[0_14px_34px_rgba(61,46,34,0.1)] transition-all cursor-pointer flex flex-col justify-between gap-5"
                >
                  <div>
                    <div class="flex items-center justify-between gap-2 mb-3">
                      <span class="px-3 py-1 rounded-md text-[11.5px] font-semibold bg-[#E4F2E7] text-[#235332]">
                        ${toPersianDigits(cls.status)}
                      </span>
                      <span class="px-2.5 py-1 rounded-md text-[11.5px] font-semibold bg-[#F3E7D6] text-[#6E4526]">
                        سطح ${toPersianDigits(cls.level_label)}
                      </span>
                    </div>

                    <h3 class="font-display text-[18px] font-bold text-[#231912] group-hover:text-[#7A4B2A] transition-colors mb-2">
                      ${toPersianDigits(cls.title)}
                    </h3>

                    <p class="text-[13px] text-[#5B4739] leading-[1.85] text-justify mb-3">
                      ${toPersianDigits(cls.description)}
                    </p>

                    <div class="space-y-1 text-[12.5px] text-[#5B4739]">
                      <div>متن آموزشی: <strong class="text-[#231912]">${toPersianDigits(cls.book_title)}</strong></div>
                      <div>مدرس دوره: <strong class="text-[#231912]">${toPersianDigits(cls.instructor_name)}</strong></div>
                      <div>زمان‌بندی: <strong class="text-[#231912]">${toPersianDigits(cls.schedule_summary)}</strong></div>
                    </div>
                  </div>

                  <div class="pt-4 border-t border-[#E6D8C5] space-y-3">
                    <div class="flex items-center justify-between text-[11.5px]">
                      <span class="px-2.5 py-1 rounded-md bg-[#E4F2E7]/80 text-[#235332] font-medium">
                        ${toPersianDigits(heldCount)} جلسه برگزار شده
                      </span>
                      <span class="px-2.5 py-1 rounded-md bg-[#EFE0CC]/80 text-[#6E4526] font-medium">
                        ${toPersianDigits(definedCount)} جلسه تعریف شده
                      </span>
                    </div>

                    <div class="w-full py-2.5 rounded-xl bg-[#F3E7D6] group-hover:bg-[#5A3A22] text-[#3F2E21] group-hover:text-[#FAF5EC] text-[12.5px] font-semibold text-center transition-colors">
                      ورود به کلاس و مشاهده جلسات ←
                    </div>
                  </div>
                </article>
              `;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  function renderLibraryTab(): string {
    return `
      <div class="space-y-8">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="font-display text-[20px] sm:text-[23px] font-bold text-[#231912]">
              کتابخانه شخصی من
            </h2>
            <p class="text-[13.5px] text-[#6B5444] mt-1 text-justify">
              با وارد کردن تعداد صفحات خوانده شده هر کتاب و کلیک بر روی دکمه «ثبت تغییرات»، نوار پیشرفت مطالعه (پروگرس بار) به صورت خودکار محاسبه و بروزرسانی می‌شود.
            </p>
          </div>
        </div>

        <!-- Books Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          ${state.library
            .map((book) => {
              const totalPages = Math.max(1, book.pages_count || 320);
              const pagesRead = Math.min(
                totalPages,
                Math.max(
                  0,
                  book.pages_read !== undefined
                    ? book.pages_read
                    : Math.round(((book.progress_percent || 0) * totalPages) / 100)
                )
              );
              const percent = Math.min(
                100,
                Math.round((pagesRead / totalPages) * 100)
              );

              return `
            <div
              data-book-card-id="${book.id}"
              class="p-5 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] flex flex-col justify-between gap-4 shadow-[0_6px_20px_rgba(61,46,34,0.04)]"
            >
              <div class="flex items-start gap-4">
                <img
                  src="${book.cover_url}"
                  alt="${book.book_title}"
                  class="w-20 h-28 object-cover rounded-xl border border-[#D8C5AC] shrink-0"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <h3 class="font-display text-[17px] font-bold text-[#231912] truncate">
                      ${toPersianDigits(book.book_title)}
                    </h3>
                    <span class="text-[11px] px-2.5 py-0.5 rounded-md bg-[#EFE3D2] text-[#5C4330] shrink-0">
                      ${toPersianDigits(totalPages)} صفحه
                    </span>
                  </div>
                  <p class="text-[12.5px] text-[#6B5444]">
                    ${toPersianDigits(book.author)} · ترجمه ${toPersianDigits(book.translator)}
                  </p>

                  <!-- Animated Progress Bar -->
                  <div class="mt-3.5">
                    <div class="flex items-center justify-between text-[12px] text-[#4E3B2D] mb-1.5">
                      <span>
                        صفحات خوانده شده:
                        <strong class="js-book-pages-read-label text-[#231912]">${toPersianDigits(pagesRead)}</strong>
                        از ${toPersianDigits(totalPages)} صفحه
                      </span>
                      <strong
                        data-book-id="${book.id}"
                        class="js-book-progress-label text-[13px] font-bold text-[#7A4B2A]"
                      >${toPersianDigits(percent)}٪</strong>
                    </div>
                    <div class="w-full h-2.5 rounded-full bg-[#E5D5C0] overflow-hidden p-0.5">
                      <div
                        data-book-id="${book.id}"
                        data-total-pages="${totalPages}"
                        class="js-book-progress-bar h-full rounded-full bg-gradient-to-l from-[#8B5A36] to-[#5A3A22] transition-all duration-700 ease-out"
                        style="width: ${percent}%"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Controls: Pages Read Input + Status + Note -->
              <div class="pt-3.5 border-t border-[#E6D8C5] space-y-3">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-[11.5px] font-semibold text-[#5E493A] mb-1">
                      تعداد صفحات خوانده شده (از ${toPersianDigits(totalPages)}):
                    </label>
                    <input
                      type="text"
                      inputmode="numeric"
                      data-book-id="${book.id}"
                      data-total-pages="${totalPages}"
                      value="${toPersianDigits(pagesRead)}"
                      placeholder="مثلاً ${toPersianDigits(Math.min(120, totalPages))}"
                      class="js-book-pages-read-input w-full px-3 py-2 rounded-xl bg-[#F4E9DA]/70 border border-[#DFCEB9] text-[13px] font-bold text-[#231912] focus:outline-none focus:border-[#8B5A36]"
                    />
                  </div>
                  <div>
                    <label class="block text-[11.5px] font-semibold text-[#5E493A] mb-1">
                      وضعیت مطالعه:
                    </label>
                    <select
                      data-book-id="${book.id}"
                      class="js-book-status-select w-full px-3 py-2 rounded-xl bg-[#F4E9DA]/70 border border-[#DFCEB9] text-[12.5px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
                    >
                      <option value="در حال مطالعه" ${book.reading_status === 'در حال مطالعه' ? 'selected' : ''}>در حال مطالعه</option>
                      <option value="خوانده‌شده" ${book.reading_status === 'خوانده‌شده' ? 'selected' : ''}>خوانده‌شده</option>
                      <option value="در نوبت مطالعه" ${book.reading_status === 'در نوبت مطالعه' ? 'selected' : ''}>در نوبت مطالعه</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label class="block text-[11.5px] font-semibold text-[#5E493A] mb-1">
                    یادداشت و برداشت شخصی:
                  </label>
                  <input
                    type="text"
                    data-book-id="${book.id}"
                    value="${toPersianDigits(book.personal_note || '')}"
                    placeholder="برداشت شخصی یا نکته کلیدی کتاب..."
                    class="js-book-note-input w-full px-3 py-2 rounded-xl bg-[#F4E9DA]/70 border border-[#DFCEB9] text-[12.5px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
                  />
                </div>

                <div class="flex justify-end">
                  <button
                    type="button"
                    data-book-id="${book.id}"
                    data-total-pages="${totalPages}"
                    class="js-save-book-btn px-5 py-2 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[12.5px] font-semibold transition-colors cursor-pointer"
                  >
                    ثبت تغییرات
                  </button>
                </div>
              </div>
            </div>
          `;
            })
            .join('')}
        </div>

        <!-- Add New Book Form -->
        <div class="p-6 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5]">
          <h3 class="font-display text-[17px] font-bold text-[#231912] mb-4">
            افزودن کتاب جدید به کتابخانه شخصی
          </h3>
          <form class="js-add-book-form grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">عنوان کتاب *</label>
              <input
                type="text"
                name="book_title"
                required
                placeholder="مثلاً: جنایت و مکافات"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
              />
            </div>
            <div>
              <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">نویسنده *</label>
              <input
                type="text"
                name="author"
                required
                placeholder="مثلاً: فئودور داستایفسکی"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
              />
            </div>
            <div>
              <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">مترجم</label>
              <input
                type="text"
                name="translator"
                placeholder="مثلاً: مهری آهی"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
              />
            </div>
            <div>
              <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">تعداد صفحات</label>
              <input
                type="number"
                name="pages_count"
                value="350"
                min="20"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
              />
            </div>
            <div>
              <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">وضعیت مطالعه</label>
              <select
                name="reading_status"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
              >
                <option value="در نوبت مطالعه">در نوبت مطالعه</option>
                <option value="در حال مطالعه">در حال مطالعه</option>
                <option value="خوانده‌شده">خوانده‌شده</option>
              </select>
            </div>
            <div>
              <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">یادداشت کوتاه</label>
              <input
                type="text"
                name="personal_note"
                placeholder="هدف از مطالعه یا یادداشت..."
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
              />
            </div>
            <div class="sm:col-span-2 lg:col-span-3 flex justify-end pt-1">
              <button
                type="submit"
                class="px-5 py-2.5 rounded-xl border border-[#7A4B2A] text-[#7A4B2A] hover:bg-[#7A4B2A] hover:text-[#FAF5EC] text-[13px] font-semibold transition-colors cursor-pointer"
              >
                + افزودن کتاب به قفسه من
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function renderTicketsTab(): string {
    return `
      <div class="space-y-8">
        <div>
          <h2 class="font-display text-[20px] sm:text-[23px] font-bold text-[#231912]">
            تیکت‌ها و پشتیبانی اعضا
          </h2>
          <p class="text-[13.5px] text-[#6B5444] mt-1 text-justify">
            پرسش‌ها، درخواست جابه‌جایی حلقه مطالعاتی یا پیشنهاد کتاب برای دوره‌های آینده را از طریق ارسال تیکت مستقیم با دبیرخانه باشگاه در میان بگذارید.
          </p>
        </div>

        <!-- New Ticket Form -->
        <div class="p-6 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5]">
          <h3 class="font-display text-[17px] font-bold text-[#231912] mb-4">
            ارسال تیکت جدید به دبیرخانه
          </h3>
          <form class="js-create-ticket-form space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">موضوع تیکت *</label>
                <input
                  type="text"
                  name="subject"
                  required
                  placeholder="عنوان درخواست یا پرسش..."
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
                />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">بخش مربوطه</label>
                <select
                  name="department"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
                >
                  <option value="امور اعضا و نشست‌ها">امور اعضا و نشست‌ها</option>
                  <option value="شورای انتخاب کتاب">شورای انتخاب کتاب</option>
                  <option value="پشتیبانی فنی و پنل">پشتیبانی فنی و پنل</option>
                </select>
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">سطح اولویت</label>
                <select
                  name="priority"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
                >
                  <option value="عادی">عادی</option>
                  <option value="مهم">مهم</option>
                  <option value="فوری">فوری</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">متن پیام *</label>
              <textarea
                name="message"
                rows="3"
                required
                placeholder="شرح کامل پیام یا درخواست خود را بنویسید..."
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
              ></textarea>
            </div>
            <div class="flex justify-end">
              <button
                type="submit"
                class="px-5 py-2.5 rounded-xl border border-[#7A4B2A] text-[#7A4B2A] hover:bg-[#7A4B2A] hover:text-[#FAF5EC] text-[13px] font-semibold transition-colors cursor-pointer"
              >
                ثبت و ارسال تیکت
              </button>
            </div>
          </form>
        </div>

        <!-- Tickets History -->
        <div class="space-y-4">
          ${state.tickets
            .map(
              (ticket) => `
            <div class="p-5 sm:p-6 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] space-y-4">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2.5">
                  <span class="font-mono text-[12px] font-bold px-2.5 py-1 rounded-md bg-[#EFE3D2] text-[#4E3B2D]">
                    #${toPersianDigits(ticket.ticket_code)}
                  </span>
                  <h4 class="font-display text-[16px] font-bold text-[#231912]">
                    ${toPersianDigits(ticket.subject)}
                  </h4>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-[11.5px] px-2.5 py-0.5 rounded-md bg-[#F3E9DA] text-[#6B5444]">
                    ${toPersianDigits(ticket.department)}
                  </span>
                  <span class="text-[11.5px] px-2.5 py-0.5 rounded-md font-semibold ${
                    ticket.status === 'پاسخ داده‌شده'
                      ? 'bg-[#E4F2E7] text-[#235332]'
                      : 'bg-[#FFF3CD] text-[#7A5A10]'
                  }">
                    ${toPersianDigits(ticket.status)}
                  </span>
                </div>
              </div>

              <p class="text-[13.5px] text-[#3D2E22] leading-[1.85] text-justify bg-[#F4E9DA]/45 p-3.5 rounded-xl border border-[#E8DAC6]">
                ${toPersianDigits(ticket.message)}
              </p>

              ${
                ticket.admin_reply
                  ? `
                <div class="p-4 rounded-xl bg-[#EDF5EE] border border-[#C7DFCB]">
                  <span class="block text-[11.5px] font-bold text-[#235332] mb-1">
                    پاسخ دبیرخانه باشگاه بوک‌میت:
                  </span>
                  <p class="text-[13px] text-[#2B4732] leading-[1.85] text-justify">
                    ${toPersianDigits(ticket.admin_reply)}
                  </p>
                </div>
              `
                  : ''
              }
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  function renderProfileTab(): string {
    return `
      <div class="space-y-6">
        <div>
          <h2 class="font-display text-[20px] sm:text-[23px] font-bold text-[#231912]">
            پرونده و پروفایل کاربری
          </h2>
          <p class="text-[13.5px] text-[#6B5444] mt-1 text-justify">
            اطلاعات فردی، سوابق تحصیلی و ژانرهای مورد علاقه خود را در این بخش مشاهده و ویرایش کنید.
          </p>
        </div>

        <form class="js-profile-form p-6 sm:p-8 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">نام *</label>
              <input
                type="text"
                name="first_name"
                required
                value="${state.member.first_name}"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13.5px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
              />
            </div>
            <div>
              <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">نام خانوادگی *</label>
              <input
                type="text"
                name="last_name"
                required
                value="${state.member.last_name}"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13.5px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
              />
            </div>
            <div>
              <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">شماره همراه (شناسه کاربری)</label>
              <input
                type="text"
                name="phone"
                readonly
                value="${toPersianDigits(state.member.phone)}"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#EAE0D2] border border-[#D8C7B1] text-[13.5px] text-[#6B5444] cursor-not-allowed"
              />
            </div>
            <div>
              <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">مقطع تحصیلی</label>
              <select
                name="education"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13.5px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
              >
                ${['دیپلم', 'کاردانی', 'کارشناسی', 'کارشناسی ارشد', 'دکتری', 'حوزوی / پژوهشی آزاد']
                  .map(
                    (lvl) =>
                      `<option value="${lvl}" ${state.member.education === lvl ? 'selected' : ''}>${lvl}</option>`
                  )
                  .join('')}
              </select>
            </div>
            <div>
              <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">حوزه مورد علاقه کتاب</label>
              <input
                type="text"
                name="favorite_genre"
                value="${state.member.favorite_genre || ''}"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13.5px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
              />
            </div>
            <div>
              <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">شهر محل سکونت</label>
              <input
                type="text"
                name="city"
                value="${state.member.city || 'تهران'}"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13.5px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
              />
            </div>
            <div class="sm:col-span-2 lg:col-span-3">
              <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">پست الکترونیک</label>
              <input
                type="email"
                name="email"
                value="${state.member.email || ''}"
                placeholder="name@example.com"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13.5px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
              />
            </div>
            <div class="sm:col-span-2 lg:col-span-3">
              <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">درباره من و دغدغه‌های مطالعاتی</label>
              <textarea
                name="bio"
                rows="3"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13.5px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
              >${state.member.bio || ''}</textarea>
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <button
              type="submit"
              class="px-6 py-2.5 rounded-xl border border-[#7A4B2A] text-[#7A4B2A] hover:bg-[#7A4B2A] hover:text-[#FAF5EC] text-[13.5px] font-semibold transition-colors cursor-pointer"
            >
              ذخیره تغییرات پروفایل
            </button>
          </div>
        </form>
      </div>
    `;
  }

  function renderCalendarTab(): string {
    return `
      <div class="space-y-6">
        <div>
          <h2 class="font-display text-[20px] sm:text-[23px] font-bold text-[#231912]">
            تقویم رویدادها و نشست‌های باشگاه بوک‌میت
          </h2>
          <p class="text-[13.5px] text-[#6B5444] mt-1 text-justify">
            برنامه ماهانه نشست‌های نقد، کارگاه‌های نویسندگی و هم‌خوانی‌های گروهی باشگاه. می‌توانید صندلی خود را در هر رویداد رزرو یا لغو رزرو نمایید.
          </p>
        </div>

        <div class="space-y-4">
          ${state.calendarEvents
            .map(
              (ev) => `
            <div class="p-5 sm:p-6 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div class="flex items-start gap-4">
                <div class="w-16 h-18 rounded-2xl bg-[#EFE1CE] border border-[#DEC9AF] flex flex-col items-center justify-center shrink-0 py-2.5 px-2 text-center">
                  <span class="text-[11px] text-[#7A5C44] font-medium">${toPersianDigits(ev.weekday_name)}</span>
                  <strong class="font-display text-[22px] font-bold text-[#231912] leading-tight">${toPersianDigits(ev.day_of_month)}</strong>
                  <span class="text-[11px] text-[#6E4526] font-semibold">${toPersianDigits(ev.month_name)}</span>
                </div>
                <div class="space-y-1.5">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-[#F2E5D4] text-[#7A4B2A]">
                      ${toPersianDigits(ev.event_type)}
                    </span>
                    <span class="text-[12px] text-[#6B5444]">
                      ساعت ${toPersianDigits(ev.time_range)}
                    </span>
                  </div>
                  <h3 class="font-display text-[17px] font-bold text-[#231912]">
                    ${toPersianDigits(ev.title)}
                  </h3>
                  <p class="text-[13px] text-[#4E3B2D] leading-[1.85] text-justify">
                    ${toPersianDigits(ev.description)}
                  </p>
                  <div class="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-[#6B5444] pt-1">
                    <span>میزبان: <strong class="text-[#2B1E16]">${toPersianDigits(ev.host_name)}</strong></span>
                    <span>مکان: <strong class="text-[#2B1E16]">${toPersianDigits(ev.location_label)}</strong></span>
                    <span>وضعیت ظرفیت: <strong class="text-[#7A4B2A]">${toPersianDigits(ev.capacity_info)}</strong></span>
                  </div>
                </div>
              </div>

              <div class="shrink-0 w-full md:w-auto flex justify-end">
                <button
                  type="button"
                  data-event-id="${ev.id}"
                  class="js-toggle-calendar-reserve px-4 py-2.5 rounded-xl border text-[12.5px] font-semibold transition-colors cursor-pointer ${
                    ev.is_reserved
                      ? 'border-[#2E6F40] bg-[#E6F3E9] text-[#235332] hover:bg-[#D7ECD9]'
                      : 'border-[#7A4B2A] text-[#7A4B2A] hover:bg-[#7A4B2A] hover:text-[#FAF5EC]'
                  }"
                >
                  ${ev.is_reserved ? '✓ رزرو شده (لغو رزرو)' : 'رزرو حضور در رویداد'}
                </button>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  function getActiveTabContent(): string {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboardTab();
      case 'sessions':
        return renderSessionsTab();
      case 'classes':
        return renderClassesTab();
      case 'library':
        return renderLibraryTab();
      case 'tickets':
        return renderTicketsTab();
      case 'profile':
        return renderProfileTab();
      case 'calendar':
        return renderCalendarTab();
      default:
        return renderDashboardTab();
    }
  }

  function render(): void {
    const navItems: Array<{ key: PanelTabKey; label: string; badge?: string }> = [
      { key: 'dashboard', label: 'داشبورد' },
      {
        key: 'sessions',
        label: 'جلسات من',
        badge: toPersianDigits(state.sessions.length),
      },
      {
        key: 'classes',
        label: 'کلاس‌های من',
        badge: toPersianDigits(state.classes.length),
      },
      {
        key: 'library',
        label: 'کتابخانه من',
        badge: toPersianDigits(state.library.length),
      },
      {
        key: 'tickets',
        label: 'تیکت',
        badge: toPersianDigits(state.tickets.length),
      },
      { key: 'profile', label: 'پروفایل' },
      {
        key: 'calendar',
        label: 'تقویم باشگاه',
        badge: toPersianDigits(state.calendarEvents.length),
      },
    ];

    $wrapper.html(`
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        <!-- Sidebar Navigation -->
        <aside class="lg:col-span-3 p-5 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] shadow-[0_12px_32px_rgba(61,46,34,0.05)] lg:sticky lg:top-24">
          <div class="pb-4 mb-4 border-b border-[#E6D8C5] flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-[#7A4B2A] text-[#FAF5EC] font-display text-[18px] font-bold flex items-center justify-center shrink-0">
              ${state.member.first_name.charAt(0)}
            </div>
            <div class="min-w-0">
              <h3 class="font-bold text-[15px] text-[#231912] truncate">
                ${state.member.first_name} ${state.member.last_name}
              </h3>
              <span class="text-[12px] text-[#6B5444] block">
                ${toPersianDigits(state.member.phone)}
              </span>
            </div>
          </div>

          <nav class="space-y-1.5" aria-label="منوی پنل کاربری">
            ${navItems
              .map((item) => {
                const isActive = activeTab === item.key;
                return `
                  <button
                    type="button"
                    data-tab="${item.key}"
                    class="js-panel-tab-btn w-full px-4 py-3 rounded-xl text-right text-[13.5px] font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#5A3A22] text-[#FAF5EC] shadow-sm'
                        : 'text-[#3F2E21] hover:bg-[#EFE3D2]'
                    }"
                  >
                    <span>${item.label}</span>
                    ${
                      item.badge
                        ? `<span class="text-[11px] px-2 py-0.5 rounded-md ${
                            isActive
                              ? 'bg-[#FAF5EC]/20 text-[#FAF5EC]'
                              : 'bg-[#E8DAC7] text-[#5C4432]'
                          }">${item.badge}</span>`
                        : ''
                    }
                  </button>
                `;
              })
              .join('')}
          </nav>

          <div class="pt-4 mt-4 border-t border-[#E6D8C5] space-y-2">
            <button
              type="button"
              class="js-back-to-home w-full px-4 py-2.5 rounded-xl text-[12.5px] font-semibold text-[#5B4636] hover:bg-[#EFE3D2] text-right transition-colors cursor-pointer"
            >
              ← بازگشت به صفحه اصلی سایت
            </button>
            <button
              type="button"
              class="js-logout-panel w-full px-4 py-2.5 rounded-xl text-[12.5px] font-semibold text-[#9E3329] hover:bg-[#FBEAE8] text-right transition-colors cursor-pointer"
            >
              خروج از حساب کاربری
            </button>
          </div>
        </aside>

        <!-- Main Content Area -->
        <main class="lg:col-span-9 min-w-0">
          ${getActiveTabContent()}
        </main>
      </div>
      ${renderSubSessionModal()}
    `);
  }

  // Event Delegations
  $wrapper.on('click', '.js-panel-tab-btn', function () {
    const nextTab = $(this).data('tab') as PanelTabKey;
    if (nextTab) {
      activeTab = nextTab;
      selectedSessionId = null;
      selectedClassId = null;
      activeSubSessionModal = null;
      render();
    }
  });

  $wrapper.on('click', '.js-switch-tab-btn', function () {
    const nextTab = $(this).data('switch-tab') as PanelTabKey;
    if (nextTab) {
      activeTab = nextTab;
      selectedSessionId = null;
      selectedClassId = null;
      activeSubSessionModal = null;
      render();
    }
  });

  // Open a Session card into Session Detail View (Item 6)
  $wrapper.on('click', '.js-open-session-card', function () {
    const sessionId = Number($(this).data('open-session-id'));
    if (sessionId) {
      activeTab = 'sessions';
      selectedSessionId = sessionId;
      activeSubSessionModal = null;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  $wrapper.on('click', '.js-back-to-sessions-list', () => {
    selectedSessionId = null;
    activeSubSessionModal = null;
    render();
  });

  // Open a Class card into Class Detail View (Item 3 & 6)
  $wrapper.on('click', '.js-open-class-card', function () {
    const classId = Number($(this).data('open-class-id'));
    if (classId) {
      activeTab = 'classes';
      selectedClassId = classId;
      activeSubSessionModal = null;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  $wrapper.on('click', '.js-back-to-classes-list', () => {
    selectedClassId = null;
    activeSubSessionModal = null;
    render();
  });

  // Open Held / Defined Sub-Session Modal (Items 7 & 8)
  $wrapper.on('click', '.js-open-subsession-modal', function () {
    const subId = Number($(this).data('subsession-id'));
    if (activeTab === 'sessions' && selectedSessionId !== null) {
      const parent = state.sessions.find((s) => s.id === selectedSessionId);
      const subItem = parent?.sub_sessions?.find((sub) => sub.id === subId);
      if (parent && subItem) {
        activeSubSessionModal = {
          subItem,
          parentTitle: parent.title,
          bookTitle: parent.book_title,
          mentorName: parent.mentor_name,
        };
        render();
      }
    } else if (activeTab === 'classes' && selectedClassId !== null) {
      const parent = state.classes.find((c) => c.id === selectedClassId);
      const subItem = parent?.sub_sessions?.find((sub) => sub.id === subId);
      if (parent && subItem) {
        activeSubSessionModal = {
          subItem,
          parentTitle: parent.title,
          bookTitle: parent.book_title,
          mentorName: parent.instructor_name,
        };
        render();
      }
    }
  });

  // Close Sub-Session Modal on close button or backdrop click
  $wrapper.on('click', '.js-close-subsession-modal', () => {
    activeSubSessionModal = null;
    render();
  });

  $wrapper.on('click', '.js-subsession-modal-backdrop', function (event) {
    if ($(event.target).hasClass('js-subsession-modal-backdrop')) {
      activeSubSessionModal = null;
      render();
    }
  });

  $wrapper.on('click', '.js-back-to-home', () => {
    props.onBackToSite();
  });

  $wrapper.on('click', '.js-logout-panel', () => {
    props.onLogout();
  });

  // Save session note
  $wrapper.on('click', '.js-save-session-note', function () {
    const sessionId = Number($(this).data('session-id'));
    const noteVal = String(
      $wrapper.find(`.js-session-note-input[data-session-id="${sessionId}"]`).val() || ''
    );
    ApiService.saveMemberSessionNote({ sessionId, member_note: noteVal })
      .then((res) => {
        state.sessions = state.sessions.map((s) =>
          s.id === sessionId ? res.session : s
        );
        showToast('یادداشت شما برای این دوره با موفقیت ذخیره شد.');
      })
      .catch((err) => {
        showToast(err.message || 'خطا در ذخیره یادداشت', true);
      });
  });

  // Save book changes and automatically advance progress bar based on pages_read (Item 9)
  $wrapper.on('click', '.js-save-book-btn', function () {
    const bookId = Number($(this).data('book-id'));
    const totalPages = Math.max(1, Number($(this).data('total-pages') || 320));
    const $card = $wrapper.find(`[data-book-card-id="${bookId}"]`);

    const rawPagesInput = String(
      $card.find(`.js-book-pages-read-input[data-book-id="${bookId}"]`).val() || '0'
    );
    const clampedPagesRead = Math.min(
      totalPages,
      Math.max(0, parseLocalizedInt(rawPagesInput, 0))
    );
    const calculatedPercent = Math.min(
      100,
      Math.round((clampedPagesRead / totalPages) * 100)
    );

    let status = String(
      $card.find(`.js-book-status-select[data-book-id="${bookId}"]`).val() ||
        'در حال مطالعه'
    ) as 'در حال مطالعه' | 'خوانده‌شده' | 'در نوبت مطالعه';

    if (calculatedPercent >= 100) {
      status = 'خوانده‌شده';
      $card.find(`.js-book-status-select[data-book-id="${bookId}"]`).val('خوانده‌شده');
    } else if (calculatedPercent > 0 && status === 'در نوبت مطالعه') {
      status = 'در حال مطالعه';
      $card.find(`.js-book-status-select[data-book-id="${bookId}"]`).val('در حال مطالعه');
    }

    const note = String(
      $card.find(`.js-book-note-input[data-book-id="${bookId}"]`).val() || ''
    );

    // Normalize input field to Persian digits and animate progress bar immediately
    $card
      .find(`.js-book-pages-read-input[data-book-id="${bookId}"]`)
      .val(toPersianDigits(clampedPagesRead));
    $card.find('.js-book-pages-read-label').text(toPersianDigits(clampedPagesRead));
    $card
      .find(`.js-book-progress-label[data-book-id="${bookId}"]`)
      .text(`${toPersianDigits(calculatedPercent)}٪`);
    $card
      .find(`.js-book-progress-bar[data-book-id="${bookId}"]`)
      .css('width', `${calculatedPercent}%`);

    ApiService.updateMemberLibraryBook({
      bookId,
      pages_read: clampedPagesRead,
      progress_percent: calculatedPercent,
      reading_status: status,
      personal_note: note,
    })
      .then((res) => {
        state.library = state.library.map((b) => (b.id === bookId ? res.book : b));
        showToast(
          `تغییرات ثبت شد؛ پیشرفت مطالعه به ${toPersianDigits(res.book.progress_percent)}٪ رسید.`
        );
      })
      .catch((err) => {
        showToast(err.message || 'خطا در بروزرسانی کتاب', true);
      });
  });

  // Add new book
  $wrapper.on('submit', '.js-add-book-form', function (event) {
    event.preventDefault();
    const $form = $(this);
    const book_title = String($form.find('[name="book_title"]').val() || '').trim();
    const author = String($form.find('[name="author"]').val() || '').trim();
    const translator = String($form.find('[name="translator"]').val() || '—').trim();
    const pages_count = Number($form.find('[name="pages_count"]').val() || 320);
    const reading_status = String(
      $form.find('[name="reading_status"]').val() || 'در نوبت مطالعه'
    ) as 'در حال مطالعه' | 'خوانده‌شده' | 'در نوبت مطالعه';
    const personal_note = String($form.find('[name="personal_note"]').val() || '').trim();

    if (!book_title || !author) {
      showToast('لطفاً عنوان کتاب و نام نویسنده را وارد کنید.', true);
      return;
    }

    ApiService.addMemberLibraryBook({
      book_title,
      author,
      translator,
      pages_count,
      reading_status,
      personal_note,
    })
      .then((res) => {
        state.library = [...state.library, res.book];
        render();
        showToast('کتاب جدید به کتابخانه شخصی شما اضافه شد.');
      })
      .catch((err) => {
        showToast(err.message || 'خطا در افزودن کتاب', true);
      });
  });

  // Create ticket
  $wrapper.on('submit', '.js-create-ticket-form', function (event) {
    event.preventDefault();
    const $form = $(this);
    const subject = String($form.find('[name="subject"]').val() || '').trim();
    const department = String(
      $form.find('[name="department"]').val() || 'امور اعضا و نشست‌ها'
    );
    const priority = String($form.find('[name="priority"]').val() || 'عادی') as
      | 'عادی'
      | 'مهم'
      | 'فوری';
    const message = String($form.find('[name="message"]').val() || '').trim();

    if (!subject || !message) {
      showToast('لطفاً موضوع و متن تیکت را تکمیل کنید.', true);
      return;
    }

    ApiService.createMemberTicket({
      member_phone: state.member.phone,
      subject,
      department,
      priority,
      message,
    })
      .then((res) => {
        state.tickets = [res.ticket, ...state.tickets];
        render();
        showToast('تیکت شما با موفقیت ثبت و برای دبیرخانه ارسال شد.');
      })
      .catch((err) => {
        showToast(err.message || 'خطا در ارسال تیکت', true);
      });
  });

  // Update profile
  $wrapper.on('submit', '.js-profile-form', function (event) {
    event.preventDefault();
    const $form = $(this);
    const first_name = String($form.find('[name="first_name"]').val() || '').trim();
    const last_name = String($form.find('[name="last_name"]').val() || '').trim();
    const education = String($form.find('[name="education"]').val() || '').trim();
    const favorite_genre = String(
      $form.find('[name="favorite_genre"]').val() || ''
    ).trim();
    const city = String($form.find('[name="city"]').val() || 'تهران').trim();
    const email = String($form.find('[name="email"]').val() || '').trim();
    const bio = String($form.find('[name="bio"]').val() || '').trim();

    ApiService.updateMemberProfile({
      phone: state.member.phone,
      first_name,
      last_name,
      education,
      favorite_genre,
      city,
      email,
      bio,
    })
      .then((res) => {
        state.member = res.member;
        props.onMemberUpdated(res.member);
        render();
        showToast('اطلاعات پروفایل شما با موفقیت بروزرسانی شد.');
      })
      .catch((err) => {
        showToast(err.message || 'خطا در بروزرسانی پروفایل', true);
      });
  });

  // Toggle calendar reservation
  $wrapper.on('click', '.js-toggle-calendar-reserve', function () {
    const eventId = Number($(this).data('event-id'));
    ApiService.toggleCalendarReservation(eventId)
      .then((res) => {
        state.calendarEvents = state.calendarEvents.map((ev) =>
          ev.id === eventId ? res.event : ev
        );
        render();
        showToast(
          res.event.is_reserved
            ? 'رزرو حضور شما در این رویداد ثبت شد.'
            : 'رزرو رویداد لغو شد.'
        );
      })
      .catch((err) => {
        showToast(err.message || 'خطا در تغییر وضعیت رزرو', true);
      });
  });

  render();
  return $wrapper;
}
