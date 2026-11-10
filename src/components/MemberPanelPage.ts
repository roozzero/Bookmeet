import $ from 'jquery';
import { ApiService } from '../services/api.ts';
import type {
  ClubAnnouncement,
  ClubCalendarEvent,
  ClubMember,
  MemberClassItem,
  MemberLibraryItem,
  MemberPanelPayload,
  MemberSession,
  MemberTicket,
  SessionSubItem,
  TicketAttachmentMeta,
  TicketAttachmentUploadInput,
} from '../types/models.ts';
import { formatPersianDateDisplay, toPersianDigits } from '../utils/persianNumbers.ts';

export type PanelTabKey =
  | 'dashboard'
  | 'sessions'
  | 'classes'
  | 'library'
  | 'announcements'
  | 'tickets'
  | 'profile'
  | 'calendar';

export interface MemberPanelPageProps {
  initialData: MemberPanelPayload;
  initialTab?: PanelTabKey;
  initialSubPath?: string;
  initialEnrollmentNotice?: string;
  onRouteChange?: (path: string) => void;
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

function resizeImageToDataUrl(file: File, maxDim = 320): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = typeof reader.result === 'string' ? reader.result : '';
      if (!resultStr) {
        reject(new Error('خطا در خواندن فایل تصویر'));
        return;
      }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(resultStr);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(resultStr);
      img.src = resultStr;
    };
    reader.onerror = () => reject(new Error('خطا در بارگذاری تصویر'));
    return reader.readAsDataURL(file);
  });
}

const ALLOWED_TICKET_MIME_SET = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'application/x-zip-compressed',
]);

function readSingleFileAsAttachment(file: File): Promise<TicketAttachmentUploadInput> {
  return new Promise((resolve, reject) => {
    const mime = (file.type || '').toLowerCase().trim();
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const inferredMime =
      mime ||
      (ext === 'jpg' || ext === 'jpeg'
        ? 'image/jpeg'
        : ext === 'png'
        ? 'image/png'
        : ext === 'webp'
        ? 'image/webp'
        : ext === 'gif'
        ? 'image/gif'
        : ext === 'pdf'
        ? 'application/pdf'
        : ext === 'txt'
        ? 'text/plain'
        : ext === 'doc'
        ? 'application/msword'
        : ext === 'docx'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : ext === 'zip'
        ? 'application/zip'
        : '');

    if (!ALLOWED_TICKET_MIME_SET.has(inferredMime)) {
      reject(
        new Error(
          `فرمت فایل «${file.name}» مجاز نیست. فرمت‌های مجاز: تصویر (JPG, PNG, WEBP, GIF)، PDF، Word، TXT و ZIP.`
        )
      );
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error(`حجم فایل «${file.name}» بیش از حد مجاز (۵ مگابایت) است.`));
      return;
    }

    if (inferredMime.startsWith('image/') && inferredMime !== 'image/gif' && file.size > 600 * 1024) {
      resizeImageToDataUrl(file, 1280)
        .then((dataUrl) => {
          resolve({
            file_name: file.name,
            mime_type: 'image/jpeg',
            file_size: Math.round((dataUrl.length * 3) / 4),
            data_url: dataUrl,
          });
        })
        .catch(() => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve({
              file_name: file.name,
              mime_type: inferredMime,
              file_size: file.size,
              data_url: String(reader.result || ''),
            });
          reader.onerror = () => reject(new Error(`خطا در خواندن فایل «${file.name}»`));
          reader.readAsDataURL(file);
        });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        file_name: file.name,
        mime_type: inferredMime,
        file_size: file.size,
        data_url: String(reader.result || ''),
      });
    };
    reader.onerror = () => reject(new Error(`خطا در خواندن فایل «${file.name}»`));
    reader.readAsDataURL(file);
  });
}

async function readFilesForTicketAttachments(
  fileList: FileList | null | undefined
): Promise<TicketAttachmentUploadInput[]> {
  if (!fileList || fileList.length === 0) return [];
  const files = Array.from(fileList).slice(0, 5);
  const results: TicketAttachmentUploadInput[] = [];
  for (const f of files) {
    const item = await readSingleFileAsAttachment(f);
    results.push(item);
  }
  return results;
}

function formatFileSizeFa(bytes: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${toPersianDigits(bytes)} بایت`;
  if (bytes < 1024 * 1024) return `${toPersianDigits(Math.round(bytes / 1024))} کیلوبایت`;
  return `${toPersianDigits((bytes / (1024 * 1024)).toFixed(1))} مگابایت`;
}

function renderTicketAttachmentsHtml(
  ticketId: number,
  attachments?: TicketAttachmentMeta[],
  legacyAttachmentName?: string
): string {
  const list = Array.isArray(attachments) ? attachments : [];
  if (list.length === 0 && !legacyAttachmentName) return '';

  if (list.length === 0 && legacyAttachmentName) {
    return `
      <div class="pt-1.5 flex flex-wrap gap-2">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F2E6D5] border border-[#DFCEB9] text-[11.5px] text-[#4E3B2D]">
          <span>📎 فایل پیوست:</span>
          <strong>${toPersianDigits(legacyAttachmentName)}</strong>
        </span>
      </div>
    `;
  }

  return `
    <div class="pt-2 space-y-2">
      <div class="flex flex-wrap items-center gap-2">
        ${list
          .map((att) => {
            const url = ApiService.getTicketAttachmentUrl(ticketId, att.id);
            const isImage = (att.mime_type || '').startsWith('image/');
            const sizeLabel = formatFileSizeFa(att.file_size);
            return `
              <div class="inline-flex flex-col gap-1.5 p-2.5 rounded-xl bg-[#FAF5EC] border border-[#D8C4AA] max-w-full">
                ${
                  isImage
                    ? `
                      <a href="${url}" target="_blank" rel="noopener noreferrer" class="block overflow-hidden rounded-lg border border-[#E5D7C5] bg-[#F4E9DA]">
                        <img src="${url}" alt="${att.file_name}" class="max-h-40 w-auto object-contain mx-auto" loading="lazy" />
                      </a>
                    `
                    : ''
                }
                <div class="flex items-center justify-between gap-2 text-[11.5px]">
                  <a
                    href="${url}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1.5 font-semibold text-[#5A3A22] hover:text-[#231912] underline truncate max-w-[220px]"
                  >
                    <span>${isImage ? '🖼️' : '📎'}</span>
                    <span class="truncate">${toPersianDigits(att.file_name)}</span>
                  </a>
                  ${sizeLabel ? `<span class="text-[10.5px] text-[#7A6352] shrink-0">(${sizeLabel})</span>` : ''}
                  <a
                    href="${url}${url.includes('?') ? '&' : '?'}download=1"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="px-2 py-0.5 rounded-md bg-[#EFE3D2] hover:bg-[#E2D0B7] text-[#3F2E21] text-[10.5px] font-semibold shrink-0"
                  >
                    دانلود
                  </a>
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    </div>
  `;
}

function isSessionApprovedForAccess(session?: MemberSession): boolean {
  if (!session) return false;
  return session.status !== 'غیرفعال';
}

function isClassApprovedForAccess(cls?: MemberClassItem): boolean {
  if (!cls) return false;
  return cls.status !== 'غیرفعال';
}

export function createMemberPanelPageComponent(props: MemberPanelPageProps): JQuery {
  let state: MemberPanelPayload = {
    member: { ...props.initialData.member },
    sessions: [...(props.initialData.sessions || [])],
    classes: [...(props.initialData.classes || [])],
    library: [...(props.initialData.library || [])],
    tickets: [...(props.initialData.tickets || [])],
    calendarEvents: [...(props.initialData.calendarEvents || [])],
    announcements: [...(props.initialData.announcements || [])],
  };

  let activeTab: PanelTabKey = props.initialTab || 'dashboard';
  let isMobileSidebarOpen = false;
  let selectedSessionId: number | null = null;
  let selectedClassId: number | null = null;
  let selectedTicketId: number | null = null;

  if (props.initialSubPath) {
    const subId = Number(props.initialSubPath.split('/').filter(Boolean)[0]);
    if (!Number.isNaN(subId)) {
      if (activeTab === 'sessions') {
        const targetSession = state.sessions.find((s) => Number(s.id) === subId);
        if (isSessionApprovedForAccess(targetSession)) {
          selectedSessionId = subId;
        }
      }
      if (activeTab === 'classes') {
        const targetClass = state.classes.find((c) => Number(c.id) === subId);
        if (isClassApprovedForAccess(targetClass)) {
          selectedClassId = subId;
        }
      }
      if (activeTab === 'tickets') {
        const targetTicket = state.tickets.find((t) => Number(t.id) === subId);
        if (targetTicket) {
          selectedTicketId = subId;
        }
      }
    }
  }

  function notifyRoute(): void {
    if (!props.onRouteChange) return;
    if (activeTab === 'sessions' && selectedSessionId !== null) {
      props.onRouteChange(`/panel/sessions/${selectedSessionId}`);
      return;
    }
    if (activeTab === 'classes' && selectedClassId !== null) {
      props.onRouteChange(`/panel/classes/${selectedClassId}`);
      return;
    }
    if (activeTab === 'tickets' && selectedTicketId !== null) {
      props.onRouteChange(`/panel/tickets/${selectedTicketId}`);
      return;
    }
    props.onRouteChange(`/panel/${activeTab}`);
  }

  // Main Sessions list search & filter state (Item 1)
  let sessionsListFilter: 'all' | 'فعال' | 'غیرفعال' | 'ثبت‌نام‌شده' | 'برگزارشده' = 'all';
  let sessionsListSearchQuery = '';

  // Main Classes list search & filter state (Item 3)
  let classesListFilter: 'all' | 'مبتدی' | 'پیشرفته' | 'تخصصی' = 'all';
  let classesListSearchQuery = '';

  let enrollmentNoticeBanner: string = String(props.initialEnrollmentNotice || '')
    .replace(/جهت تایید ثبت[‌\s]*نام تیکت بزنید یا با شماره[^.]*\.?/g, '')
    .trim();

  // Sub-session filter & search state (inside a Session or Class detail page)
  let subSessionFilter: 'all' | 'تعریف شده' | 'برگزار شده' = 'all';
  let subSessionSearchQuery = '';

  // Library filter, search & add-form toggle state
  let libraryFilter: 'all' | 'در حال مطالعه' | 'خوانده‌شده' | 'در نوبت مطالعه' = 'all';
  let librarySearchQuery = '';
  let isAddBookFormOpen = false;

  // Profile state (Item 5)
  let pendingAvatarUrl: string = state.member.avatar_url || '';
  let isSavingProfile = false;
  let profileSavedBannerMessage = '';

  // Ticket attachment state
  let selectedTicketFileName = '';
  let selectedReplyFileNames = '';

  // Calendar month & selected event modal state
  let activeCalendarMonth: string =
    state.calendarEvents[0]?.month_name || 'آبان ۱۴۰۵';
  let activeCalendarEventModal: ClubCalendarEvent | null = null;

  let activeSubSessionModal: {
    subItem: SessionSubItem;
    parentTitle: string;
    bookTitle: string;
    mentorName: string;
  } | null = null;

  const $wrapper = $(`
    <section
      aria-label="پنل کاربری اعضای باشگاه کتابخوانی کتابوشکا"
      class="w-full max-w-[1440px] mx-auto px-4 sm:px-10 md:px-16 lg:px-20 pt-6 pb-20 overflow-x-hidden"
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
    }, 3600);
  }

  function renderSubSessionModal(): string {
    if (!activeSubSessionModal) return '';
    const { subItem, parentTitle, bookTitle, mentorName } = activeSubSessionModal;
    const isHeld = subItem.status === 'برگزار شده';
    const pagesReadNumber = parseLocalizedInt(String(subItem.pages_read || 0), 0);

    if (isHeld) {
      return `
        <div
          class="js-subsession-modal-backdrop fixed inset-0 z-50 bg-[#1E140E]/60 backdrop-blur-[3px] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div class="js-subsession-modal-dialog w-full max-w-[650px] rounded-2xl bg-[#FAF5EC] border border-[#DECBB3] shadow-[0_24px_64px_rgba(28,18,12,0.32)] overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            <div class="px-6 py-4 bg-[#F2E6D5] border-b border-[#E2D2BC] flex items-center justify-between gap-3">
              <div class="flex items-center gap-2.5">
                <span class="px-2.5 py-1 rounded-lg text-[12px] font-bold bg-[#E4F2E7] text-[#235332]">
                  ${toPersianDigits(subItem.session_number)}
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
              <!-- Course on top, Book & Mentor on one line below -->
              <div class="p-3.5 rounded-xl bg-[#F4E9DA]/60 border border-[#E5D6C3] space-y-2 text-[12.5px] text-[#5B4739]">
                <div class="w-full">
                  <span>دوره: </span>
                  <strong class="text-[#231912] font-bold">${toPersianDigits(parentTitle)}</strong>
                </div>
                <div class="pt-2 border-t border-[#E2D2BC]/80 flex flex-wrap items-center justify-between gap-4">
                  <span>کتاب: <strong class="text-[#231912] font-bold">${toPersianDigits(bookTitle)}</strong></span>
                  <span>تسهیل‌گر: <strong class="text-[#231912] font-bold">${toPersianDigits(mentorName)}</strong></span>
                </div>
              </div>

              <!-- 3 Info Cards in a single horizontal row -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div class="px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/90 border border-[#E5D6C3] flex items-center justify-between gap-2 whitespace-nowrap">
                  <span class="text-[11.5px] text-[#7D6452]">تاریخ:</span>
                  <strong class="text-[12.5px] font-bold text-[#231912]">
                    ${formatPersianDateDisplay(subItem.session_date)}
                  </strong>
                </div>
                <div class="px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/90 border border-[#E5D6C3] flex items-center justify-between gap-2 whitespace-nowrap">
                  <span class="text-[11.5px] text-[#7D6452]">زمان:</span>
                  <strong class="text-[12.5px] font-bold text-[#231912]">
                    ${toPersianDigits(subItem.session_time)}
                  </strong>
                </div>
                <div class="px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/90 border border-[#E5D6C3] flex items-center justify-between gap-2 whitespace-nowrap">
                  <span class="text-[11.5px] text-[#7D6452]">صفحات خوانده‌شده:</span>
                  <strong class="text-[12.5px] font-bold text-[#235332]">
                    ${toPersianDigits(pagesReadNumber)} صفحه
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

              <div class="pt-1 flex justify-end">
                <button
                  type="button"
                  class="js-close-subsession-modal px-5 py-2 rounded-xl border border-[#C5B198] text-[13px] font-semibold text-[#3D2E22] hover:bg-[#EFE2CE] transition-colors cursor-pointer"
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
        <div class="js-subsession-modal-dialog w-full max-w-[600px] rounded-2xl bg-[#FAF5EC] border border-[#DECBB3] shadow-[0_24px_64px_rgba(28,18,12,0.32)] overflow-hidden animate-[fadeIn_0.2s_ease-out]">
          <div class="px-6 py-4 bg-[#F2E6D5] border-b border-[#E2D2BC] flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5">
              <span class="px-2.5 py-1 rounded-lg text-[12px] font-bold bg-[#EFE0CC] text-[#6E4526]">
                ${toPersianDigits(subItem.session_number)}
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
            <div class="p-3.5 rounded-xl bg-[#F4E9DA]/60 border border-[#E5D6C3] space-y-2 text-[12.5px] text-[#5B4739]">
              <div class="w-full">
                <span>دوره: </span>
                <strong class="text-[#231912] font-bold">${toPersianDigits(parentTitle)}</strong>
              </div>
              <div class="pt-2 border-t border-[#E2D2BC]/80 flex flex-wrap items-center justify-between gap-4">
                <span>کتاب: <strong class="text-[#231912] font-bold">${toPersianDigits(bookTitle)}</strong></span>
                <span>تسهیل‌گر: <strong class="text-[#231912] font-bold">${toPersianDigits(mentorName)}</strong></span>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="px-4 py-3 rounded-xl bg-[#F4E9DA]/85 border border-[#E5D6C3] flex items-center justify-between">
                <span class="text-[12px] text-[#7D6452]">تاریخ برگزاری:</span>
                <strong class="text-[13.5px] font-bold text-[#231912]">
                  ${formatPersianDateDisplay(subItem.session_date)}
                </strong>
              </div>
              <div class="px-4 py-3 rounded-xl bg-[#F4E9DA]/85 border border-[#E5D6C3] flex items-center justify-between">
                <span class="text-[12px] text-[#7D6452]">زمان برگزاری:</span>
                <strong class="text-[13.5px] font-bold text-[#231912]">
                  ${toPersianDigits(subItem.session_time)}
                </strong>
              </div>
            </div>

            <div class="p-4 rounded-xl bg-[#FDFBF7] border border-[#E6D7C3]">
              <h5 class="text-[13px] font-bold text-[#6E4526] mb-1.5 flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-[#7A4B2A]"></span>
                <span>سر فصل جلسه</span>
              </h5>
              <p class="text-[13.5px] font-semibold text-[#231912] leading-[1.85]">
                ${toPersianDigits(subItem.pages_to_read || 'طبق برنامه اعلام‌شده در سر فصل جلسه')}
              </p>
            </div>

            <div class="p-4 rounded-xl bg-[#F3E7D6] border border-[#DEC8AC]">
              <span class="block text-[12px] font-bold text-[#5A4332] mb-2">
                لینک ورود به جلسه:
              </span>
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span dir="ltr" class="text-[12.5px] font-mono text-[#3F2E21] bg-[#FAF5EC] px-3 py-2 rounded-lg border border-[#E2D2BC] select-all truncate">
                  ${subItem.meeting_link || 'https://meet.ketboshka.ir/live-session'}
                </span>
                <a
                  href="${subItem.meeting_link || 'https://meet.ketboshka.ir/live-session'}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="px-4 py-2 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[12.5px] font-semibold text-center transition-colors shrink-0"
                >
                  ورود مستقیم به جلسه
                </a>
              </div>
            </div>

            <div class="pt-1 flex justify-end">
              <button
                type="button"
                class="js-close-subsession-modal px-5 py-2 rounded-xl border border-[#C5B198] text-[13px] font-semibold text-[#3D2E22] hover:bg-[#EFE2CE] transition-colors cursor-pointer"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function isCalendarEventPast(ev: ClubCalendarEvent): boolean {
    const cap = String(ev.capacity_info || '');
    if (cap.includes('برگزار شده') || cap.includes('گذشته') || cap.includes('پایان')) {
      return true;
    }
    const dayNum = parseLocalizedInt(ev.day_of_month, 99);
    if (ev.month_name === 'آبان ۱۴۰۵' && dayNum < 14) {
      return true;
    }
    return false;
  }

  function renderCalendarEventModal(): string {
    if (!activeCalendarEventModal) return '';
    const ev = activeCalendarEventModal;
    const isPast = isCalendarEventPast(ev);
    const hasLinkedTarget = Boolean(ev.target_type && ev.target_id);
    const targetBadgeText =
      ev.target_type === 'class'
        ? 'کلاس آموزشی باشگاه'
        : ev.target_type === 'session'
        ? 'نشست کتاب‌خوانی'
        : 'رویداد باشگاه';

    return `
      <div
        class="js-calendar-modal-backdrop fixed inset-0 z-50 bg-[#1E140E]/60 backdrop-blur-[3px] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
      >
        <div class="w-full max-w-[540px] rounded-2xl bg-[#FAF5EC] border border-[#DECBB3] shadow-[0_24px_64px_rgba(28,18,12,0.32)] overflow-hidden">
          <div class="px-6 py-4 bg-[#F2E6D5] border-b border-[#E2D2BC] flex items-center justify-between gap-3">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2.5 py-1 rounded-md text-[11.5px] font-semibold bg-[#EFE0CC] text-[#7A4B2A]">
                ${toPersianDigits(ev.weekday_name)} ${toPersianDigits(ev.day_of_month)} ${toPersianDigits(ev.month_name)}
              </span>
              <span class="text-[12px] text-[#6B5444] font-semibold">
                ساعت ${toPersianDigits(ev.time_range)}
              </span>
              <span class="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-[#5A3A22]/15 text-[#5A3A22]">
                ${targetBadgeText}
              </span>
            </div>
            <button
              type="button"
              class="js-close-calendar-modal text-[#6B5444] hover:text-[#231912] p-1 transition-colors cursor-pointer"
              aria-label="بستن"
            >
              ✕
            </button>
          </div>
          <div class="p-6 space-y-4">
            <h4 class="font-display text-[18px] font-bold text-[#231912]">
              ${toPersianDigits(ev.title)}
            </h4>
            <p class="text-[13.5px] text-[#4E3B2D] leading-[1.9] text-justify">
              ${toPersianDigits(ev.description)}
            </p>
            <div class="p-3.5 rounded-xl bg-[#F4E9DA]/70 border border-[#E5D6C3] space-y-1.5 text-[12.5px] text-[#5B4739]">
              <div>میزبان / مدرس: <strong class="text-[#231912]">${toPersianDigits(ev.host_name)}</strong></div>
              <div>مکان / نحوه برگزاری: <strong class="text-[#231912]">${toPersianDigits(ev.location_label)}</strong></div>
              <div>وضعیت برگزاری: <strong class="${isPast ? 'text-[#6B5444]' : 'text-[#7A4B2A]'}">${toPersianDigits(ev.capacity_info)}</strong></div>
              ${
                ev.enrollment_status && ev.enrollment_status !== 'ثبت‌نام نشده'
                  ? `<div>وضعیت ثبت‌نام شما: <strong class="${
                      ev.enrollment_status === 'فعال' ? 'text-[#235332]' : 'text-[#8A5A10]'
                    }">${
                      ev.enrollment_status === 'غیرفعال'
                        ? 'غیرفعال (در انتظار تایید مدیر)'
                        : toPersianDigits(ev.enrollment_status)
                    }</strong></div>`
                  : ''
              }
            </div>
            <div class="pt-2 flex flex-wrap items-center justify-between gap-2.5">
              <div class="flex flex-wrap items-center gap-2">
                ${
                  isPast
                    ? `
                  <span class="px-4 py-2.5 rounded-xl bg-[#EAE0D2] border border-[#D5C4AE] text-[#6B5444] text-[12px] font-semibold select-none">
                    این رویداد برگزار شده است
                  </span>
                `
                    : `
                  <button
                    type="button"
                    data-event-id="${ev.id}"
                    class="js-toggle-calendar-reserve px-4 py-2.5 rounded-xl border text-[12.5px] font-semibold transition-colors cursor-pointer ${
                      ev.is_reserved
                        ? 'border-[#2E6F40] bg-[#E6F3E9] text-[#235332] hover:bg-[#D7ECD9]'
                        : 'border-[#5A3A22] bg-[#5A3A22] text-[#FAF5EC] hover:bg-[#432A18]'
                    }"
                  >
                    ${ev.is_reserved ? '✓ رزرو شده (لغو رزرو)' : 'رزرو یادآوری حضور'}
                  </button>
                `
                }
                ${
                  hasLinkedTarget
                    ? `
                  <button
                    type="button"
                    data-cal-target-type="${ev.target_type}"
                    data-cal-target-id="${ev.target_id}"
                    class="js-calendar-open-target px-4 py-2.5 rounded-xl bg-[#F3E7D6] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[#3F2E21] text-[12.5px] font-semibold cursor-pointer"
                  >
                    ${ev.target_type === 'class' ? 'مشاهده در کلاس‌های من ←' : 'مشاهده در جلسات من ←'}
                  </button>
                `
                    : ''
                }
              </div>
              <button
                type="button"
                class="js-close-calendar-modal px-4 py-2.5 rounded-xl border border-[#C5B198] text-[12.5px] font-semibold text-[#3D2E22] hover:bg-[#EFE2CE] cursor-pointer"
              >
                بستن
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
    const upcomingSessionsCount = state.sessions.filter(
      (s) => s.status !== 'برگزارشده' && s.status !== 'برگزار شده'
    ).length;
    const openTicketsCount = state.tickets.filter(
      (t) => t.status !== 'بسته‌شده'
    ).length;

    const nextSession = state.sessions.find(
      (s) => s.status !== 'برگزارشده' && s.status !== 'برگزار شده'
    );
    const currentReadingBook =
      state.library.find((b) => b.reading_status === 'در حال مطالعه') || state.library[0];

    return `
      <div class="space-y-6">
        <!-- Slim Welcome Banner -->
        <div class="px-5 py-3.5 rounded-2xl bg-gradient-to-l from-[#EFE3D1] via-[#F5ECDE] to-[#FAF5EC] border border-[#E2D3BF] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
          <h2 class="font-display text-[18px] sm:text-[20px] font-bold text-[#231912]">
            ${state.member.first_name} ${state.member.last_name} عزیز، خوش آمدید
          </h2>
          <div class="inline-flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 bg-[#FAF5EC] px-3.5 py-1.5 rounded-xl border border-[#DFCEB9] text-[12px] shrink-0 self-center sm:self-auto text-center">
            <span class="text-[#7A6352]">کد عضویت: <strong class="font-bold text-[#231912]">${toPersianDigits(state.member.membership_code || 'BM-۱۴۰۵-۱۰۸')}</strong></span>
            <span class="text-[#D5C3AE]">|</span>
            <span class="text-[#6E5644]">عضویت از ${toPersianDigits(state.member.joined_date || 'مهر ۱۴۰۴')}</span>
          </div>
        </div>

        <!-- 4 KPI Cards -->
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
                  <h4 class="font-bold text-[15px] text-[#231912] truncate">
                    ${toPersianDigits(nextSession.title)}
                  </h4>
                  <p class="text-[12.5px] text-[#5E493A]">
                    کتاب محور نشست: <strong>${toPersianDigits(nextSession.book_title)}</strong> · با حضور ${toPersianDigits(nextSession.mentor_name)}
                  </p>
                  <div class="pt-2 border-t border-[#E2D2BC]/70 flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#4E3B2D]">
                    <span>زمان: ${formatPersianDateDisplay(nextSession.session_date)}</span>
                    <span>${toPersianDigits(nextSession.session_time)}</span>
                  </div>
                </div>
              `
                  : `<p class="text-[13px] text-[#6B5444]">هنوز جلسه‌ای ثبت نشده است.</p>`
              }
            </div>
          </div>

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

  // Shared detail view for both Session Detail (Item 2) and Class Detail (Item 3):
  // Renders each sub-session as a visual Card in a 2-column grid (grid-cols-1 md:grid-cols-2 gap-5)
  function renderSubSessionsDetailSection(params: {
    parentTitle: string;
    bookTitle: string;
    mentorLabel: string;
    mentorName: string;
    scheduleText: string;
    parentCoverUrl: string;
    subSessions: SessionSubItem[];
    backButtonClass: string;
    backButtonLabel: string;
    extraFooterHtml?: string;
  }): string {
    const query = subSessionSearchQuery.trim().toLowerCase();

    const matchesSearch = (item: SessionSubItem): boolean => {
      if (!query) return true;
      const haystack = `${item.session_number} ${item.title} ${item.session_date} ${
        item.pages_to_read || ''
      } ${item.reviewed_topics || ''} ${item.session_notes || ''}`.toLowerCase();
      return haystack.includes(query);
    };

    // Defined sessions first (supporting both 'تعریف شده' and 'جلسه آتی'), then Held sessions
    const definedList = (params.subSessions || []).filter(
      (item) =>
        item.status !== 'برگزار شده' &&
        String(item.status) !== 'برگزارشده' &&
        (subSessionFilter === 'all' || subSessionFilter === 'تعریف شده') &&
        matchesSearch(item)
    );
    const heldList = (params.subSessions || []).filter(
      (item) =>
        (item.status === 'برگزار شده' || String(item.status) === 'برگزارشده') &&
        (subSessionFilter === 'all' || subSessionFilter === 'برگزار شده') &&
        matchesSearch(item)
    );

    const renderSubSessionCard = (sub: SessionSubItem, isHeld: boolean): string => {
      const thumbUrl = sub.cover_url || params.parentCoverUrl || '/assets/book-current.png';
      const pagesReadNum = parseLocalizedInt(String(sub.pages_read || 0), 0);

      return `
        <article
          data-subsession-id="${sub.id}"
          class="js-open-subsession-modal group rounded-2xl bg-[#FAF5EC] border border-[#E2D3BF] hover:border-[#8B5A36] hover:shadow-[0_14px_34px_rgba(61,46,34,0.1)] transition-all cursor-pointer overflow-hidden flex flex-col justify-between"
        >
          <div>
            <!-- Card Image Header (No Held/Defined status badges per rule) -->
            <div class="relative h-36 w-full overflow-hidden bg-[#EFE3D2]">
              <img
                src="${thumbUrl}"
                alt="${sub.title}"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-[#1E140E]/75 via-[#1E140E]/15 to-transparent"></div>
              <div class="absolute bottom-3 right-4 left-4 flex items-center justify-between text-[#FAF5EC] text-[12px]">
                <span class="font-bold bg-[#1E140E]/70 px-2.5 py-1 rounded-lg">
                  ${toPersianDigits(sub.session_number)}
                </span>
                <span class="font-semibold bg-[#1E140E]/70 px-2.5 py-1 rounded-lg">
                  ${formatPersianDateDisplay(sub.session_date)}${
                    sub.session_time ? ` · ساعت ${toPersianDigits(sub.session_time)}` : ''
                  }
                </span>
              </div>
            </div>

            <!-- Card Content -->
            <div class="p-4 sm:p-5 space-y-3">
              <h4
                title="${toPersianDigits(sub.title)}"
                class="font-display text-[16px] font-bold text-[#231912] group-hover:text-[#7A4B2A] transition-colors truncate whitespace-nowrap overflow-hidden text-ellipsis block"
              >
                ${toPersianDigits(sub.title)}
              </h4>

              <div class="pt-2.5 border-t border-[#E6D8C5] flex items-center justify-between gap-2 text-[12px] text-[#5B4739]">
                <span class="text-[#7A6352] shrink-0">
                  ${isHeld ? 'صفحات خوانده‌شده:' : 'سر فصل جلسه:'}
                </span>
                <strong class="font-bold ${
                  isHeld ? 'text-[#235332]' : 'text-[#231912]'
                } truncate">
                  ${
                    isHeld
                      ? `${toPersianDigits(pagesReadNum)} صفحه`
                      : toPersianDigits(sub.pages_to_read || 'طبق سر فصل جلسه')
                  }
                </strong>
              </div>
            </div>
          </div>

          <div class="px-4 sm:px-5 pb-4 sm:pb-5">
            <div class="w-full py-2.5 rounded-xl ${
              isHeld
                ? 'bg-[#E4F2E7] text-[#235332] group-hover:bg-[#235332] group-hover:text-[#FAF5EC]'
                : 'bg-[#F3E7D6] text-[#3F2E21] group-hover:bg-[#5A3A22] group-hover:text-[#FAF5EC]'
            } text-[12.5px] font-semibold text-center transition-colors">
              ${
                isHeld
                  ? 'مشاهده جزئیات و نکات جلسه ←'
                  : 'مشاهده جزئیات و لینک ورود ←'
              }
            </div>
          </div>
        </article>
      `;
    };

    return `
      <div class="space-y-6">
        <!-- Top Header -->
        <div class="p-4 sm:p-6 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-start gap-4 w-full">
            <img
              src="${params.parentCoverUrl}"
              alt="${params.parentTitle}"
              class="w-16 h-20 rounded-xl object-cover border border-[#D8C5AC] shrink-0 hidden sm:block"
            />
            <div class="w-full min-w-0">
              <button
                type="button"
                class="${params.backButtonClass} inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#7A4B2A] hover:text-[#231912] mb-2 cursor-pointer"
              >
                <span>→</span>
                <span>${params.backButtonLabel}</span>
              </button>
              <h2 class="font-display text-[18px] sm:text-[22px] font-bold text-[#231912] leading-[1.6]">
                ${toPersianDigits(params.parentTitle)}
              </h2>
              <div class="mt-3 sm:mt-2 grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2 sm:gap-x-5 sm:gap-y-1.5 p-3 sm:p-0 rounded-xl bg-[#F4E9DA]/60 sm:bg-transparent border border-[#E5D7C5] sm:border-0 text-[12.5px] text-[#5B4739]">
                <div class="flex items-center justify-between sm:justify-start gap-2">
                  <span class="text-[#7A6352]">اثر:</span>
                  <strong class="text-[#231912] truncate">${toPersianDigits(params.bookTitle)}</strong>
                </div>
                <div class="flex items-center justify-between sm:justify-start gap-2 border-t border-[#E6D8C5]/70 pt-1.5 sm:border-0 sm:pt-0">
                  <span class="text-[#7A6352]">${params.mentorLabel}:</span>
                  <strong class="text-[#231912] truncate">${toPersianDigits(params.mentorName)}</strong>
                </div>
                <div class="flex items-center justify-between sm:justify-start gap-2 border-t border-[#E6D8C5]/70 pt-1.5 sm:border-0 sm:pt-0">
                  <span class="text-[#7A6352]">برنامه:</span>
                  <strong class="text-[#231912] truncate">${formatPersianDateDisplay(params.scheduleText)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Search and Filter Bar -->
        <div class="p-4 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div class="relative flex-1">
            <input
              type="text"
              value="${toPersianDigits(subSessionSearchQuery)}"
              placeholder="جستجو در عنوان جلسه، تاریخ یا موضوعات..."
              class="js-subsession-search-input w-full px-4 py-2.5 rounded-xl bg-[#F4E9DA]/65 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
            />
          </div>
          <div class="grid grid-cols-3 sm:flex items-center gap-2 shrink-0">
            ${(
              [
                { key: 'all', label: 'همه جلسات' },
                { key: 'تعریف شده', label: 'جلسات تعریف شده' },
                { key: 'برگزار شده', label: 'جلسات برگزار شده' },
              ] as const
            )
              .map(
                (tab) => `
              <button
                type="button"
                data-subfilter="${tab.key}"
                class="js-subsession-filter-btn px-2.5 sm:px-3.5 py-2 rounded-xl text-[11.5px] sm:text-[12px] font-semibold text-center transition-colors cursor-pointer ${
                  subSessionFilter === tab.key
                    ? 'bg-[#5A3A22] text-[#FAF5EC]'
                    : 'bg-[#F3E7D6] text-[#4E3B2D] hover:bg-[#E6D5BE]'
                }"
              >
                ${tab.label}
              </button>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- 1. FIRST: Defined / Upcoming Sessions Cards -->
        ${
          subSessionFilter === 'all' || subSessionFilter === 'تعریف شده'
            ? `
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-display text-[17px] font-bold text-[#231912] flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-[#7A4B2A]"></span>
                <span>جلسات تعریف شده (پیشِ رو)</span>
              </h3>
              <span class="text-[11.5px] text-[#6B5444]">
                برای مشاهده سر فصل جلسه و لینک ورود روی کارت جلسه کلیک کنید
              </span>
            </div>

            ${
              definedList.length > 0
                ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-5">${definedList
                    .map((sub) => renderSubSessionCard(sub, false))
                    .join('')}</div>`
                : `<div class="p-4 rounded-xl bg-[#FAF5EC] border border-[#E5D7C5] text-[12.5px] text-[#6B5444]">جلسه تعریف‌شده‌ای مطابق جستجوی شما یافت نشد.</div>`
            }
          </div>
        `
            : ''
        }

        <!-- 2. SECOND: Held Sessions Cards -->
        ${
          subSessionFilter === 'all' || subSessionFilter === 'برگزار شده'
            ? `
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-display text-[17px] font-bold text-[#231912] flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-[#2E6F40]"></span>
                <span>جلسات برگزار شده</span>
              </h3>
              <span class="text-[11.5px] text-[#6B5444]">
                برای مشاهده خلاصه مباحث، نکات جلسه و صفحات خوانده‌شده روی کارت کلیک کنید
              </span>
            </div>

            ${
              heldList.length > 0
                ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-5">${heldList
                    .map((sub) => renderSubSessionCard(sub, true))
                    .join('')}</div>`
                : `<div class="p-4 rounded-xl bg-[#FAF5EC] border border-[#E5D7C5] text-[12.5px] text-[#6B5444]">جلسه برگزارشده‌ای مطابق جستجوی شما یافت نشد.</div>`
            }
          </div>
        `
            : ''
        }

        ${params.extraFooterHtml || ''}
      </div>
    `;
  }

  function renderSessionsTab(): string {
    if (selectedSessionId !== null) {
      const session = state.sessions.find((s) => Number(s.id) === Number(selectedSessionId));
      if (session && isSessionApprovedForAccess(session)) {
        const noteSectionHtml = `
          <div class="p-5 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5]">
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
          scheduleText: `${session.session_date} · ${session.session_time}`,
          parentCoverUrl: session.cover_url || '/assets/book-current.png',
          subSessions: session.sub_sessions || [],
          backButtonClass: 'js-back-to-sessions-list',
          backButtonLabel: 'بازگشت به لیست جلسات من',
          extraFooterHtml: noteSectionHtml,
        });
      }
      selectedSessionId = null;
    }

    const query = sessionsListSearchQuery.trim().toLowerCase();
    const matchesSessionQuery = (session: MemberSession): boolean => {
      if (!query) return true;
      const haystack =
        `${session.title} ${session.book_title} ${session.mentor_name} ${session.session_date}`.toLowerCase();
      return haystack.includes(query);
    };

    const isHeldSessionStatus = (session: MemberSession): boolean => {
      if (session.status === 'برگزارشده' || session.status === 'برگزار شده') {
        return true;
      }
      const subs = session.sub_sessions || [];
      if (
        subs.length > 0 &&
        subs.every(
          (sub) => sub.status === 'برگزار شده' || String(sub.status) === 'برگزارشده'
        )
      ) {
        return true;
      }
      return false;
    };

    const upcomingSessions = state.sessions.filter((session) => {
      if (isHeldSessionStatus(session)) return false;
      if (sessionsListFilter === 'برگزارشده') return false;
      if (sessionsListFilter === 'فعال') {
        if (session.status !== 'فعال' && session.status !== 'ثبت‌نام‌شده') return false;
      } else if (sessionsListFilter === 'غیرفعال') {
        if (session.status !== 'غیرفعال') return false;
      }
      return matchesSessionQuery(session);
    });

    const heldSessions = state.sessions.filter((session) => {
      if (!isHeldSessionStatus(session)) return false;
      if (sessionsListFilter !== 'all' && sessionsListFilter !== 'برگزارشده') return false;
      return matchesSessionQuery(session);
    });

    const hasPendingSessions = state.sessions.some(
      (s) => !isHeldSessionStatus(s) && s.status === 'غیرفعال'
    );

    const renderSessionEnrollmentCard = (session: MemberSession): string => {
      const totalCount = (session.sub_sessions || []).length;
      const coverImg = session.cover_url || '/assets/book-current.png';
      const isHeld = isHeldSessionStatus(session);
      const isInactive = !isHeld && session.status === 'غیرفعال';

      return `
        <article
          data-open-session-id="${session.id}"
          class="js-open-session-card group rounded-2xl bg-[#FAF5EC] border ${
            isInactive
              ? 'border-[#DFBA6F]'
              : isHeld
              ? 'border-[#BBD9C2]'
              : 'border-[#E5D7C5]'
          } hover:border-[#8B5A36] hover:shadow-[0_16px_36px_rgba(61,46,34,0.1)] transition-all cursor-pointer overflow-hidden flex flex-col justify-between min-w-0"
        >
          <div class="min-w-0">
            <!-- Card Image Header -->
            <div class="relative h-44 w-full overflow-hidden bg-[#EFE3D2]">
              <img
                src="${coverImg}"
                alt="${session.title}"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-[#1E140E]/70 via-transparent to-transparent"></div>
              <div class="absolute bottom-3 right-4 left-4 flex items-center justify-between text-[#FAF5EC]">
                <span class="px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                  isInactive
                    ? 'bg-[#8A5A10]/95 text-[#FFF8E7]'
                    : isHeld
                    ? 'bg-[#1D5430]/95 text-[#FAF5EC]'
                    : 'bg-[#235332]/90'
                } backdrop-blur-xs">
                  ${
                    isInactive
                      ? 'غیرفعال (در انتظار تایید)'
                      : isHeld
                      ? 'برگزار شده'
                      : toPersianDigits(session.status)
                  }
                </span>
                <span class="text-[11.5px] font-semibold bg-[#1E140E]/65 px-2.5 py-1 rounded-lg">
                  ${toPersianDigits(totalCount)} نشست در این دوره
                </span>
              </div>
            </div>

            <!-- Card Body with strictly single-line truncated title -->
            <div class="p-5 space-y-3 min-w-0">
              <h3
                title="${toPersianDigits(session.title)}"
                class="font-display text-[16.5px] font-bold text-[#231912] group-hover:text-[#7A4B2A] transition-colors truncate whitespace-nowrap overflow-hidden text-ellipsis block"
              >
                ${toPersianDigits(session.title)}
              </h3>

              <div class="pt-2 border-t border-[#E6D8C5] space-y-1.5 text-[12.5px] text-[#5B4739]">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[#7A6352] shrink-0">اثر محور جلسه:</span>
                  <strong class="text-[#231912] truncate">${toPersianDigits(session.book_title)}</strong>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[#7A6352] shrink-0">تسهیل‌گر دوره:</span>
                  <strong class="text-[#231912] truncate">${toPersianDigits(session.mentor_name)}</strong>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[#7A6352] shrink-0">زمان برگزاری:</span>
                  <strong class="text-[#231912] truncate">${formatPersianDateDisplay(session.session_date)}${
                    session.session_time ? ` · ${toPersianDigits(session.session_time)}` : ''
                  }</strong>
                </div>
              </div>

              ${
                isInactive
                  ? `
                <div class="p-3 rounded-xl bg-[#FFF6E0] border border-[#E3C178] text-[12px] text-[#6E4B0C] leading-[1.75]">
                  <strong>وضعیت: غیرفعال</strong> — جهت تایید ثبت‌نام تیکت بزنید <span class="font-bold text-[#235332]">✓</span>
                </div>
              `
                  : ''
              }
            </div>
          </div>

          <div class="px-5 pb-5">
            <div class="w-full py-2.5 rounded-xl ${
              isInactive
                ? 'bg-[#EFE5D4] text-[#7A5A10] border border-[#DFBA6F]'
                : isHeld
                ? 'bg-[#E4F2E7] group-hover:bg-[#235332] text-[#235332] group-hover:text-[#FAF5EC]'
                : 'bg-[#F3E7D6] group-hover:bg-[#5A3A22] text-[#3F2E21] group-hover:text-[#FAF5EC]'
            } text-[12.5px] font-semibold text-center transition-colors">
              ${
                isInactive
                  ? '🔒 در انتظار تایید مدیر (دسترسی پس از تایید فعال می‌شود)'
                  : 'ورود به صفحه جلسه و مشاهده جزئیات ←'
              }
            </div>
          </div>
        </article>
      `;
    };

    return `
      <div class="space-y-6">
        <div>
          <h2 class="font-display text-[20px] sm:text-[23px] font-bold text-[#231912]">
            جلسات ثبت‌نام شده من
          </h2>
          <p class="text-[13.5px] text-[#6B5444] mt-1 text-justify">
            حلقه‌های مطالعاتی و نشست‌های ثبت‌نام شده شما. برای ورود به صفحه هر دوره و مشاهده کارت‌های جلسات تعریف شده و برگزار شده روی کارت کلیک کنید.
          </p>
        </div>

        ${
          enrollmentNoticeBanner || hasPendingSessions
            ? `
          <div class="p-4 sm:p-5 rounded-2xl bg-[#FFF6E0] border-2 border-[#E3C178] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="space-y-1">
              <div class="text-[13.5px] font-bold text-[#6E4B0C]">
                ${toPersianDigits(
                  enrollmentNoticeBanner ||
                    'شما دارای نشست ثبت‌نام‌شده در وضعیت «غیرفعال» (در انتظار تایید مدیر) هستید.'
                )}
              </div>
              <p class="text-[12.5px] text-[#5C4110] font-medium">
                جهت تایید ثبت‌نام تیکت بزنید <strong class="font-bold text-[#235332]">✓</strong>
              </p>
            </div>
            <button
              type="button"
              data-switch-tab="tickets"
              class="js-switch-tab-btn px-4 py-2 rounded-xl bg-[#7A5411] hover:bg-[#5E3F0A] text-[#FAF5EC] text-[12px] font-semibold shrink-0 cursor-pointer self-start sm:self-auto"
            >
              ارسال تیکت تایید ثبت‌نام ←
            </button>
          </div>
        `
            : ''
        }

        <!-- Search & Filter Bar for Sessions List -->
        <div class="p-4 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div class="flex-1">
            <input
              type="text"
              value="${toPersianDigits(sessionsListSearchQuery)}"
              placeholder="جستجو در عنوان جلسه، نام کتاب یا تسهیل‌گر..."
              class="js-sessions-main-search-input w-full px-4 py-2.5 rounded-xl bg-[#F4E9DA]/65 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
            />
          </div>
          <div class="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 shrink-0">
            ${(
              [
                { key: 'all', label: 'همه جلسات' },
                { key: 'فعال', label: 'فعال' },
                { key: 'غیرفعال', label: 'غیرفعال' },
                { key: 'برگزارشده', label: 'جلسات برگزار شده' },
              ] as const
            )
              .map(
                (f) => `
              <button
                type="button"
                data-sessions-filter="${f.key}"
                class="js-sessions-main-filter-btn px-3.5 py-2 rounded-xl text-[12px] font-semibold text-center transition-colors cursor-pointer ${
                  sessionsListFilter === f.key
                    ? 'bg-[#5A3A22] text-[#FAF5EC]'
                    : 'bg-[#F3E7D6] text-[#4E3B2D] hover:bg-[#E6D5BE]'
                }"
              >
                ${f.label}
              </button>
            `
              )
              .join('')}
          </div>
        </div>

        ${
          sessionsListFilter !== 'برگزارشده'
            ? `
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-display text-[17px] font-bold text-[#231912] flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-[#7A4B2A]"></span>
                <span>جلسات فعال و پیشِ رو</span>
              </h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              ${
                upcomingSessions.length > 0
                  ? upcomingSessions.map((s) => renderSessionEnrollmentCard(s)).join('')
                  : `<div class="md:col-span-2 p-6 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] text-center text-[13.5px] text-[#6B5444]">جلسه پیشِ رویی مطابق با فیلتر یا جستجوی شما یافت نشد.</div>`
              }
            </div>
          </div>
        `
            : ''
        }

        ${
          sessionsListFilter === 'all' || sessionsListFilter === 'برگزارشده'
            ? `
          <div class="space-y-4 pt-2">
            <div class="flex items-center justify-between">
              <h3 class="font-display text-[17px] font-bold text-[#231912] flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-[#2E6F40]"></span>
                <span>جلسات برگزار شده</span>
              </h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              ${
                heldSessions.length > 0
                  ? heldSessions.map((s) => renderSessionEnrollmentCard(s)).join('')
                  : `<div class="md:col-span-2 p-6 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] text-center text-[13.5px] text-[#6B5444]">هنوز جلسه برگزارشده‌ای در این بخش ثبت نشده است.</div>`
              }
            </div>
          </div>
        `
            : ''
        }
      </div>
    `;
  }

  function renderClassesTab(): string {
    // Item 3:
    // در منوی کلاسها من:
    // - جستجو و فیلتر را قرار بده
    // - صفحه هر کلاس هم باید بصورت کارت باشد
    if (selectedClassId !== null) {
      const cls = state.classes.find((c) => Number(c.id) === Number(selectedClassId));
      if (cls && isClassApprovedForAccess(cls)) {
        return renderSubSessionsDetailSection({
          parentTitle: cls.title,
          bookTitle: cls.book_title,
          mentorLabel: 'مدرس دوره',
          mentorName: cls.instructor_name,
          scheduleText: cls.schedule_summary,
          parentCoverUrl: cls.cover_url || '/assets/blog-1.png',
          subSessions: cls.sub_sessions || [],
          backButtonClass: 'js-back-to-classes-list',
          backButtonLabel: 'بازگشت به لیست کلاس‌های من',
        });
      }
      selectedClassId = null;
    }

    const query = classesListSearchQuery.trim().toLowerCase();
    const filteredClasses = state.classes.filter((cls) => {
      if (classesListFilter !== 'all' && cls.level_label !== classesListFilter) {
        return false;
      }
      if (!query) return true;
      const haystack =
        `${cls.title} ${cls.book_title} ${cls.instructor_name} ${cls.description}`.toLowerCase();
      return haystack.includes(query);
    });

    const hasPendingClasses = state.classes.some((c) => c.status === 'غیرفعال');

    return `
      <div class="space-y-6">
        <div>
          <h2 class="font-display text-[20px] sm:text-[23px] font-bold text-[#231912]">
            کلاس‌های من
          </h2>
          <p class="text-[13.5px] text-[#6B5444] mt-1 text-justify">
            دوره‌ها و کلاس‌های تخصصی ثبت‌نام شده شما در باشگاه کتابخوانی کتابوشکا. با کلیک بر روی هر کارت می‌توانید وارد صفحه کلاس شده و کارت‌های جلسات تعریف شده و برگزار شده را مشاهده کنید.
          </p>
        </div>

        ${
          enrollmentNoticeBanner || hasPendingClasses
            ? `
          <div class="p-4 sm:p-5 rounded-2xl bg-[#FFF6E0] border-2 border-[#E3C178] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="space-y-1">
              <div class="text-[13.5px] font-bold text-[#6E4B0C]">
                ${toPersianDigits(
                  enrollmentNoticeBanner ||
                    'شما دارای دوره ثبت‌نام‌شده در وضعیت «غیرفعال» (در انتظار تایید مدیر) هستید.'
                )}
              </div>
              <p class="text-[12.5px] text-[#5C4110] font-medium">
                جهت تایید ثبت‌نام تیکت بزنید <strong class="font-bold text-[#235332]">✓</strong>
              </p>
            </div>
            <button
              type="button"
              data-switch-tab="tickets"
              class="js-switch-tab-btn px-4 py-2 rounded-xl bg-[#7A5411] hover:bg-[#5E3F0A] text-[#FAF5EC] text-[12px] font-semibold shrink-0 cursor-pointer self-start sm:self-auto"
            >
              ارسال تیکت تایید ثبت‌نام ←
            </button>
          </div>
        `
            : ''
        }

        <!-- Search & Filter Bar for Classes List (Item 3) -->
        <div class="p-4 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div class="flex-1">
            <input
              type="text"
              value="${toPersianDigits(classesListSearchQuery)}"
              placeholder="جستجو در عنوان کلاس، سرفصل یا نام مدرس..."
              class="js-classes-main-search-input w-full px-4 py-2.5 rounded-xl bg-[#F4E9DA]/65 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
            />
          </div>
          <div class="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 shrink-0">
            ${(
              [
                { key: 'all', label: 'همه کلاس‌ها' },
                { key: 'مبتدی', label: 'سطح مبتدی' },
                { key: 'پیشرفته', label: 'سطح پیشرفته' },
                { key: 'تخصصی', label: 'سطح تخصصی' },
              ] as const
            )
              .map(
                (f) => `
              <button
                type="button"
                data-classes-filter="${f.key}"
                class="js-classes-main-filter-btn px-3.5 py-2 rounded-xl text-[12px] font-semibold text-center transition-colors cursor-pointer ${
                  classesListFilter === f.key
                    ? 'bg-[#5A3A22] text-[#FAF5EC]'
                    : 'bg-[#F3E7D6] text-[#4E3B2D] hover:bg-[#E6D5BE]'
                }"
              >
                ${f.label}
              </button>
            `
              )
              .join('')}
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          ${
            filteredClasses.length > 0
              ? filteredClasses
                  .map((cls) => {
                    const totalCount = (cls.sub_sessions || []).length;
                    const coverImg = cls.cover_url || '/assets/blog-1.png';
                    const isInactive = cls.status === 'غیرفعال';

                    return `
                <article
                  data-open-class-id="${cls.id}"
                  class="js-open-class-card group rounded-2xl bg-[#FAF5EC] border ${
                    isInactive ? 'border-[#DFBA6F]' : 'border-[#E5D7C5]'
                  } hover:border-[#8B5A36] hover:shadow-[0_16px_36px_rgba(61,46,34,0.1)] transition-all cursor-pointer overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <!-- Class Cover Image -->
                    <div class="relative h-48 w-full overflow-hidden bg-[#EFE3D2]">
                      <img
                        src="${coverImg}"
                        alt="${cls.title}"
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div class="absolute inset-0 bg-gradient-to-t from-[#1E140E]/70 via-transparent to-transparent"></div>
                      <div class="absolute bottom-3 right-4 left-4 flex items-center justify-between text-[#FAF5EC]">
                        <div class="flex items-center gap-1.5">
                          <span class="px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                            isInactive
                              ? 'bg-[#8A5A10]/95 text-[#FFF8E7]'
                              : 'bg-[#235332]/90'
                          }">
                            ${isInactive ? 'غیرفعال (در انتظار تایید)' : 'فعال'}
                          </span>
                          <span class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#5A3A22]/90">
                            سطح ${toPersianDigits(cls.level_label)}
                          </span>
                        </div>
                        <span class="text-[11.5px] font-semibold bg-[#1E140E]/65 px-2.5 py-1 rounded-lg">
                          ${toPersianDigits(totalCount)} جلسه آموزشی
                        </span>
                      </div>
                    </div>

                    <div class="p-5 space-y-3">
                      <h3 class="font-display text-[17px] font-bold text-[#231912] group-hover:text-[#7A4B2A] transition-colors leading-[1.65] text-justify">
                        ${toPersianDigits(cls.title)}
                      </h3>

                      <p class="text-[12.5px] text-[#5B4739] leading-[1.85] text-justify">
                        ${toPersianDigits(cls.description)}
                      </p>

                      <div class="pt-2 border-t border-[#E6D8C5] space-y-1.5 text-[12.5px] text-[#5B4739]">
                        <div class="flex items-center justify-between gap-2">
                          <span class="text-[#7A6352]">متن و سرفصل:</span>
                          <strong class="text-[#231912] truncate">${toPersianDigits(cls.book_title)}</strong>
                        </div>
                        <div class="flex items-center justify-between gap-2">
                          <span class="text-[#7A6352]">مدرس دوره:</span>
                          <strong class="text-[#231912]">${toPersianDigits(cls.instructor_name)}</strong>
                        </div>
                        <div class="flex items-center justify-between gap-2">
                          <span class="text-[#7A6352]">برنامه هفتگی:</span>
                          <strong class="text-[#231912]">${toPersianDigits(cls.schedule_summary)}</strong>
                        </div>
                      </div>

                      ${
                        isInactive
                          ? `
                        <div class="p-3 rounded-xl bg-[#FFF6E0] border border-[#E3C178] text-[12px] text-[#6E4B0C] leading-[1.75]">
                          <strong>وضعیت: غیرفعال</strong> — جهت تایید ثبت‌نام تیکت بزنید <span class="font-bold text-[#235332]">✓</span>
                        </div>
                      `
                          : ''
                      }
                    </div>
                  </div>

                  <div class="px-5 pb-5">
                    <div class="w-full py-2.5 rounded-xl ${
                      isInactive
                        ? 'bg-[#EFE5D4] text-[#7A5A10] border border-[#DFBA6F]'
                        : 'bg-[#F3E7D6] group-hover:bg-[#5A3A22] text-[#3F2E21] group-hover:text-[#FAF5EC]'
                    } text-[12.5px] font-semibold text-center transition-colors">
                      ${
                        isInactive
                          ? '🔒 در انتظار تایید مدیر (دسترسی پس از تایید فعال می‌شود)'
                          : 'ورود به صفحه کلاس و مشاهده جلسات ←'
                      }
                    </div>
                  </div>
                </article>
              `;
                  })
                  .join('')
              : `<div class="md:col-span-2 p-6 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] text-center text-[13.5px] text-[#6B5444]">کلاسی مطابق با فیلتر یا جستجوی شما یافت نشد.</div>`
          }
        </div>
      </div>
    `;
  }

  function renderLibraryTab(): string {
    const query = librarySearchQuery.trim().toLowerCase();
    const filteredBooks = state.library.filter((book) => {
      if (libraryFilter !== 'all' && book.reading_status !== libraryFilter) {
        return false;
      }
      if (!query) return true;
      const haystack =
        `${book.book_title} ${book.author} ${book.translator} ${book.personal_note}`.toLowerCase();
      return haystack.includes(query);
    });

    return `
      <div class="space-y-6">
        <!-- Header with Add Book Button at Top -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="font-display text-[20px] sm:text-[23px] font-bold text-[#231912]">
              کتابخانه شخصی من
            </h2>
            <p class="text-[13.5px] text-[#6B5444] mt-1 text-justify">
              با وارد کردن تعداد صفحات خوانده شده و کلیک بر روی «ثبت تغییرات»، نوار پیشرفت مطالعه به صورت خودکار محاسبه و بروزرسانی می‌شود.
            </p>
          </div>
          <button
            type="button"
            class="js-toggle-add-book-form w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[13px] font-semibold text-center justify-center transition-colors cursor-pointer shrink-0"
          >
            ${isAddBookFormOpen ? '✕ بستن فرم افزودن کتاب' : '+ افزودن کتاب جدید'}
          </button>
        </div>

        <!-- Collapsible Add New Book Form at the Top -->
        ${
          isAddBookFormOpen
            ? `
          <div class="p-6 rounded-2xl bg-[#FAF5EC] border-2 border-[#C8AF8F] shadow-[0_12px_30px_rgba(61,46,34,0.08)]">
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
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">تعداد کل صفحات</label>
                <input
                  type="number"
                  name="pages_count"
                  value="350"
                  min="20"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
                />
              </div>
              <div class="sm:col-span-2">
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
              <div class="sm:col-span-2 lg:col-span-3">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">یادداشت و برداشت شخصی</label>
                <textarea
                  name="personal_note"
                  rows="2"
                  placeholder="هدف از مطالعه یا یادداشت خود درباره این کتاب را بنویسید..."
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
                ></textarea>
              </div>
              <div class="sm:col-span-2 lg:col-span-3 flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  class="js-toggle-add-book-form px-4 py-2 rounded-xl border border-[#C5B198] text-[12.5px] font-semibold text-[#4E3B2D] hover:bg-[#EFE3D2] cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  class="px-5 py-2 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[13px] font-semibold transition-colors cursor-pointer"
                >
                  ثبت کتاب در قفسه من
                </button>
              </div>
            </form>
          </div>
        `
            : ''
        }

        <!-- Search & Filter Bar -->
        <div class="p-4 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div class="flex-1">
            <input
              type="text"
              value="${toPersianDigits(librarySearchQuery)}"
              placeholder="جستجو در نام کتاب، نویسنده، مترجم یا یادداشت‌ها..."
              class="js-library-search-input w-full px-4 py-2.5 rounded-xl bg-[#F4E9DA]/65 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
            />
          </div>
          <div class="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 shrink-0">
            ${(
              [
                { key: 'all', label: 'همه کتاب‌ها' },
                { key: 'در حال مطالعه', label: 'در حال مطالعه' },
                { key: 'خوانده‌شده', label: 'خوانده‌شده' },
                { key: 'در نوبت مطالعه', label: 'در نوبت مطالعه' },
              ] as const
            )
              .map(
                (f) => `
              <button
                type="button"
                data-libfilter="${f.key}"
                class="js-library-filter-btn px-3.5 py-2 rounded-xl text-[12px] font-semibold text-center transition-colors cursor-pointer ${
                  libraryFilter === f.key
                    ? 'bg-[#5A3A22] text-[#FAF5EC]'
                    : 'bg-[#F3E7D6] text-[#4E3B2D] hover:bg-[#E6D5BE]'
                }"
              >
                ${f.label}
              </button>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Books Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          ${
            filteredBooks.length > 0
              ? filteredBooks
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

                  <!-- Controls: Pages Read Input (Item 4: exact label "تعداد صفحات خوانده شده") + Status + Textarea Note -->
                  <div class="pt-3.5 border-t border-[#E6D8C5] space-y-3">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label class="block text-[11.5px] font-semibold text-[#5E493A] mb-1">
                          تعداد صفحات خوانده شده
                        </label>
                        <input
                          type="text"
                          inputmode="numeric"
                          data-book-id="${book.id}"
                          data-total-pages="${totalPages}"
                          value="${toPersianDigits(pagesRead)}"
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
                      <textarea
                        rows="2"
                        data-book-id="${book.id}"
                        placeholder="برداشت شخصی یا نکته کلیدی کتاب..."
                        class="js-book-note-input w-full px-3 py-2 rounded-xl bg-[#F4E9DA]/70 border border-[#DFCEB9] text-[12.5px] text-[#231912] leading-[1.7] focus:outline-none focus:border-[#8B5A36]"
                      >${toPersianDigits(book.personal_note || '')}</textarea>
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
                  .join('')
              : `<div class="md:col-span-2 p-6 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] text-center text-[13.5px] text-[#6B5444]">کتابی مطابق با فیلتر یا عبارت جستجوی شما یافت نشد.</div>`
          }
        </div>
      </div>
    `;
  }

  function renderAnnouncementsTab(): string {
    const unreadCount = state.announcements.filter((a) => a.is_read === 0).length;

    return `
      <div class="space-y-5 mt-0 pt-0">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="font-display text-[20px] sm:text-[23px] font-bold text-[#231912]">
              اطلاعیه‌های باشگاه کتابخوانی کتابوشکا
            </h2>
            <p class="text-[13.5px] text-[#6B5444] mt-1 text-justify">
              آخرین اخبار، فراخوان‌های رأی‌گیری کتاب ماه، منابع آموزشی بارگذاری‌شده و اطلاعیه‌های دبیرخانه باشگاه را در این بخش دنبال کنید.
            </p>
          </div>
          ${
            unreadCount > 0
              ? `
            <button
              type="button"
              class="js-mark-all-announcements-read w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[12.5px] font-semibold text-center justify-center transition-colors cursor-pointer shrink-0"
            >
              ✓ ثبت همه اطلاعیه‌ها به عنوان خوانده‌شده (${toPersianDigits(unreadCount)})
            </button>
          `
              : `
            <span class="px-3.5 py-2 rounded-xl bg-[#E4F2E7] border border-[#BBD9C2] text-[#235332] text-[12px] font-semibold shrink-0 self-start sm:self-auto">
              ✓ تمامی اطلاعیه‌ها مطالعه شده‌اند
            </span>
          `
          }
        </div>

        <div class="space-y-4">
          ${state.announcements
            .map(
              (ann: ClubAnnouncement) => `
            <article class="p-5 sm:p-6 rounded-2xl bg-[#FAF5EC] border ${
              ann.is_read === 0 ? 'border-[#8B5A36] shadow-[0_10px_28px_rgba(122,75,42,0.08)]' : 'border-[#E5D7C5]'
            } space-y-3 transition-all">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2.5">
                  ${
                    ann.is_important
                      ? `<span class="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#FBEAE8] text-[#9E3329]">مهم</span>`
                      : ''
                  }
                  <span class="px-2.5 py-0.5 rounded-md text-[11.5px] font-semibold bg-[#EFE0CC] text-[#6E4526]">
                    ${toPersianDigits(ann.category)}
                  </span>
                  <h3 class="font-display text-[17px] font-bold text-[#231912]">
                    ${toPersianDigits(ann.title)}
                  </h3>
                </div>
                <span class="text-[12px] text-[#6B5444]">
                  ${toPersianDigits(ann.published_date)}
                </span>
              </div>

              <p class="text-[13.5px] text-[#3F2F23] leading-[1.9] text-justify">
                ${toPersianDigits(ann.content)}
              </p>

              <div class="pt-2 flex items-center justify-between border-t border-[#E8DAC6]">
                <span class="text-[11.5px] ${ann.is_read ? 'text-[#235332]' : 'text-[#7A4B2A] font-semibold'}">
                  ${ann.is_read ? '✓ مطالعه شده' : '● اطلاعیه جدید'}
                </span>
                ${
                  ann.is_read === 0
                    ? `
                  <button
                    type="button"
                    data-announcement-id="${ann.id}"
                    class="js-mark-announcement-read px-4 py-1.5 rounded-xl bg-[#F3E7D6] hover:bg-[#5A3A22] text-[#3F2E21] hover:text-[#FAF5EC] text-[12px] font-semibold transition-colors cursor-pointer"
                  >
                    ثبت به عنوان خوانده‌شده
                  </button>
                `
                    : ''
                }
              </div>
            </article>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  function getTicketMessagesForDisplay(ticket: MemberTicket) {
    if (Array.isArray(ticket.messages) && ticket.messages.length > 0) {
      return ticket.messages;
    }
    return [
      {
        id: `init-${ticket.id}`,
        sender_role: 'member' as const,
        sender_name: `${state.member.first_name} ${state.member.last_name}`.trim() || 'کاربر باشگاه',
        text: ticket.message || '',
        created_at: ticket.created_at || 'ثبت‌شده',
        attachments: (ticket.attachments || []).filter((a) => a.uploader_role === 'member'),
      },
      ...(Array.isArray(ticket.admin_replies) && ticket.admin_replies.length > 0
        ? ticket.admin_replies.map((rep, idx) => ({
            id: `adm-${ticket.id}-${idx}`,
            sender_role: 'admin' as const,
            sender_name: 'مدیر باشگاه',
            text: rep.text,
            created_at: rep.created_at || ticket.created_at || 'ثبت‌شده',
            attachments: (rep as { attachments?: TicketAttachmentMeta[] }).attachments || [],
          }))
        : ticket.admin_reply
        ? [
            {
              id: `adm-single-${ticket.id}`,
              sender_role: 'admin' as const,
              sender_name: 'مدیر باشگاه',
              text: ticket.admin_reply,
              created_at: ticket.updated_at || ticket.created_at || 'ثبت‌شده',
              attachments: (ticket.attachments || []).filter((a) => a.uploader_role === 'admin'),
            },
          ]
        : []),
    ];
  }

  function getTicketLatestReplyDate(ticket: MemberTicket): string {
    const msgs = getTicketMessagesForDisplay(ticket);
    if (msgs.length > 1) {
      return msgs[msgs.length - 1].created_at || ticket.updated_at || ticket.created_at || '—';
    }
    if (ticket.updated_at && ticket.updated_at !== ticket.created_at) {
      return ticket.updated_at;
    }
    return 'بدون پاسخ جدید';
  }

  function renderTicketsTab(): string {
    if (selectedTicketId !== null) {
      const ticket = state.tickets.find((t) => Number(t.id) === Number(selectedTicketId));
      if (ticket) {
        const messagesList = getTicketMessagesForDisplay(ticket);
        const latestReplyDate = getTicketLatestReplyDate(ticket);
        const isClosed = ticket.status === 'بسته‌شده';
        const statusBadgeClass =
          ticket.status === 'پاسخ داده‌شده'
            ? 'bg-[#E4F2E7] text-[#235332] border-[#BBD9C2]'
            : isClosed
            ? 'bg-[#EAE0D2] text-[#5B4739] border-[#D5C3AE]'
            : 'bg-[#FFF3CD] text-[#7A5A10] border-[#E5C77B]';

        return `
          <div class="space-y-6">
            <!-- Ticket Detail Header -->
            <div class="p-5 sm:p-6 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] space-y-4">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  class="js-back-to-tickets-list inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F3E7D6] hover:bg-[#E5D4BC] text-[#3F2E21] text-[12.5px] font-semibold cursor-pointer transition-colors"
                >
                  <span>→</span>
                  <span>بازگشت به لیست تیکت‌ها</span>
                </button>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-mono text-[12px] font-bold px-2.5 py-1 rounded-md bg-[#EFE3D2] text-[#4E3B2D]">
                    #${toPersianDigits(ticket.ticket_code)}
                  </span>
                  <span class="px-3 py-1 rounded-lg border text-[12px] font-bold ${statusBadgeClass}">
                    ${toPersianDigits(ticket.status)}
                  </span>
                </div>
              </div>

              <div>
                <h2 class="font-display text-[19px] sm:text-[22px] font-bold text-[#231912]">
                  ${toPersianDigits(ticket.subject)}
                </h2>
                <div class="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px] text-[#6B5444]">
                  <span>بخش: <strong class="text-[#231912]">${toPersianDigits(ticket.department)}</strong></span>
                  <span>اولویت: <strong class="text-[#231912]">${toPersianDigits(ticket.priority)}</strong></span>
                  <span>تاریخ ایجاد: <strong class="text-[#231912]">${toPersianDigits(ticket.created_at)}</strong></span>
                  <span>آخرین پاسخ: <strong class="text-[#231912]">${toPersianDigits(latestReplyDate)}</strong></span>
                </div>
              </div>
            </div>

            <!-- Conversation Thread -->
            <div class="p-5 sm:p-6 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] space-y-4">
              <h3 class="font-display text-[16.5px] font-bold text-[#231912] border-b border-[#E6D8C5] pb-3">
                گفتگوها و فایل‌های پیوست تیکت
              </h3>
              <div class="space-y-3.5">
                ${messagesList
                  .map((msg, idx) => {
                    const isAdmin = msg.sender_role === 'admin';
                    const msgAttachments = Array.isArray(msg.attachments) ? msg.attachments : [];
                    const legacyName =
                      idx === 0 && msgAttachments.length === 0 ? ticket.attachment_name : undefined;
                    return `
                      <div class="p-4 rounded-2xl border ${
                        isAdmin
                          ? 'bg-[#EEF6F0] border-[#C5DFCC] text-[#1E3F29]'
                          : 'bg-[#F4E9DA]/60 border-[#E2D2BC] text-[#231912]'
                      } space-y-2">
                        <div class="flex items-center justify-between gap-2 text-[11.5px] ${
                          isAdmin ? 'text-[#235332]' : 'text-[#6B5444]'
                        }">
                          <span class="font-bold flex items-center gap-1.5">
                            <span class="w-2 h-2 rounded-full ${isAdmin ? 'bg-[#235332]' : 'bg-[#7A4B2A]'}"></span>
                            <span>${isAdmin ? 'پاسخ دبیرخانه / مدیر باشگاه کتابوشکا' : 'پیام شما'}</span>
                          </span>
                          <span>${toPersianDigits(msg.created_at || ticket.created_at)}</span>
                        </div>
                        ${
                          msg.text
                            ? `<p class="text-[13.5px] leading-[1.9] text-justify whitespace-pre-line">${toPersianDigits(msg.text)}</p>`
                            : ''
                        }
                        ${renderTicketAttachmentsHtml(ticket.id, msgAttachments, legacyName)}
                      </div>
                    `;
                  })
                  .join('')}
              </div>
            </div>

            <!-- Reply Form or Closed Notice -->
            ${
              isClosed
                ? `
              <div class="p-5 rounded-2xl bg-[#EAE0D2]/80 border border-[#D5C3AE] flex flex-col items-center justify-center text-center space-y-1.5">
                <div class="text-[14px] font-bold text-[#4E3B2D] text-center">این تیکت توسط مدیریت باشگاه بسته شده است</div>
                <p class="text-[12.5px] text-[#6B5444] !text-center text-center mx-auto">
                  امکان ارسال پیام جدید در تیکت بسته‌شده وجود ندارد. در صورت نیاز می‌توانید تیکت جدیدی ثبت نمایید.
                </p>
              </div>
            `
                : `
              <form data-ticket-id="${ticket.id}" class="js-member-reply-ticket-form p-5 sm:p-6 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] space-y-4">
                <h3 class="font-display text-[16.5px] font-bold text-[#231912]">
                  ارسال پاسخ یا فایل پیوست جدید در این تیکت
                </h3>
                <div>
                  <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">متن پیام شما *</label>
                  <textarea
                    name="reply_message"
                    rows="3"
                    placeholder="پاسخ یا توضیحات تکمیلی خود را بنویسید..."
                    class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] leading-[1.85] focus:outline-none focus:border-[#8B5A36]"
                  ></textarea>
                </div>
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <input
                      type="file"
                      multiple
                      class="js-member-reply-ticket-files hidden"
                      accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                    />
                    <button
                      type="button"
                      class="js-trigger-reply-ticket-file w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#F3E7D6] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[12px] font-semibold text-[#3F2E21] inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <span>📎</span>
                      <span>افزودن فایل یا تصویر پیوست</span>
                    </button>
                    <span class="js-reply-ticket-file-label text-[12px] text-[#6B5444] text-center sm:text-right">
                      ${selectedReplyFileNames ? `فایل انتخاب‌شده: ${toPersianDigits(selectedReplyFileNames)}` : 'فایلی انتخاب نشده است'}
                    </span>
                  </div>
                  <button
                    type="submit"
                    class="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[13px] font-semibold text-center justify-center transition-colors cursor-pointer"
                  >
                    ارسال پاسخ
                  </button>
                </div>
              </form>
            `
            }
          </div>
        `;
      }
      selectedTicketId = null;
    }

    return `
      <div class="space-y-8">
        <div>
          <h2 class="font-display text-[20px] sm:text-[23px] font-bold text-[#231912]">
            تیکت‌ها و پشتیبانی اعضا
          </h2>
          <p class="text-[13.5px] text-[#6B5444] mt-1 text-justify">
            پیشنهاد کتاب برای دوره‌های آینده یا درخواست‌های پشتیبانی و تایید ثبت‌نام خود را به همراه فایل پیوست برای دبیرخانه باشگاه ارسال نمایید.
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
                  placeholder="عنوان درخواست یا پیشنهاد..."
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
                />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">بخش مربوطه</label>
                <select
                  name="department"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
                >
                  <option value="امور ثبت‌نام و دوره‌ها">امور ثبت‌نام و دوره‌ها</option>
                  <option value="پیشنهاد کتاب">پیشنهاد کتاب</option>
                  <option value="پشتیبانی فنی">پشتیبانی فنی</option>
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
                placeholder="شرح کامل پیام یا پیشنهاد خود را بنویسید..."
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
              ></textarea>
            </div>

            <!-- File Attachment Button & Submit -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <input
                  type="file"
                  multiple
                  class="js-ticket-file-input hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                />
                <button
                  type="button"
                  class="js-trigger-ticket-file w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#F3E7D6] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[12.5px] font-semibold text-[#3F2E21] inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>📎</span>
                  <span>افزودن فایل پیوست</span>
                </button>
                <span class="js-ticket-file-label text-[12px] text-[#6B5444] text-center sm:text-right">
                  ${selectedTicketFileName ? `فایل انتخاب‌شده: ${toPersianDigits(selectedTicketFileName)}` : 'فایلی انتخاب نشده است (حداکثر ۵ مگابایت)'}
                </span>
              </div>

              <button
                type="submit"
                class="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[13px] font-semibold text-center justify-center transition-colors cursor-pointer"
              >
                ثبت و ارسال تیکت
              </button>
            </div>
          </form>
        </div>

        <!-- Tickets Cards List -->
        <div class="space-y-4">
          <h3 class="font-display text-[18px] font-bold text-[#231912]">
            لیست تیکت‌های ثبت‌شده شما (${toPersianDigits(state.tickets.length)})
          </h3>
          ${
            state.tickets.length === 0
              ? `
            <div class="p-6 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] text-center text-[13.5px] text-[#6B5444]">
              هنوز تیکتی ثبت نکرده‌اید.
            </div>
          `
              : `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${state.tickets
                .map((ticket) => {
                  const latestReplyDate = getTicketLatestReplyDate(ticket);
                  const msgsCount = getTicketMessagesForDisplay(ticket).length;
                  const attachmentsCount = (ticket.attachments || []).length || (ticket.attachment_name ? 1 : 0);
                  const statusBadgeClass =
                    ticket.status === 'پاسخ داده‌شده'
                      ? 'bg-[#E4F2E7] text-[#235332] border-[#BBD9C2]'
                      : ticket.status === 'بسته‌شده'
                      ? 'bg-[#EAE0D2] text-[#5B4739] border-[#D5C3AE]'
                      : 'bg-[#FFF3CD] text-[#7A5A10] border-[#E5C77B]';

                  return `
                    <article class="p-5 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] hover:border-[#8B5A36] transition-all flex flex-col justify-between gap-4 shadow-[0_6px_20px_rgba(61,46,34,0.04)]">
                      <div class="space-y-3">
                        <div class="flex items-center justify-between gap-2 flex-wrap">
                          <span class="font-mono text-[11.5px] font-bold px-2.5 py-1 rounded-md bg-[#EFE3D2] text-[#4E3B2D]">
                            #${toPersianDigits(ticket.ticket_code)}
                          </span>
                          <span class="px-2.5 py-0.5 rounded-md border text-[11.5px] font-semibold ${statusBadgeClass}">
                            ${toPersianDigits(ticket.status)}
                          </span>
                        </div>

                        <h4 class="font-display text-[16.5px] font-bold text-[#231912] leading-[1.6] truncate" title="${toPersianDigits(ticket.subject)}">
                          ${toPersianDigits(ticket.subject)}
                        </h4>

                        <div class="pt-2.5 border-t border-[#E6D8C5] space-y-1.5 text-[12px] text-[#5B4739]">
                          <div class="flex items-center justify-between gap-2">
                            <span class="text-[#7A6352]">تاریخ ایجاد تیکت:</span>
                            <strong class="text-[#231912]">${toPersianDigits(ticket.created_at)}</strong>
                          </div>
                          <div class="flex items-center justify-between gap-2">
                            <span class="text-[#7A6352]">تاریخ آخرین پاسخ:</span>
                            <strong class="text-[#231912]">${toPersianDigits(latestReplyDate)}</strong>
                          </div>
                          <div class="flex items-center justify-between gap-2">
                            <span class="text-[#7A6352]">بخش مربوطه:</span>
                            <strong class="text-[#231912]">${toPersianDigits(ticket.department)}</strong>
                          </div>
                        </div>
                      </div>

                      <div class="pt-3 border-t border-[#E6D8C5] flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2 text-[11px] text-[#6B5444]">
                          <span>💬 ${toPersianDigits(msgsCount)} پیام</span>
                          ${
                            attachmentsCount > 0
                              ? `<span>· 📎 ${toPersianDigits(attachmentsCount)} پیوست</span>`
                              : ''
                          }
                        </div>
                        <button
                          type="button"
                          data-ticket-id="${ticket.id}"
                          class="js-open-ticket-detail px-4 py-2 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[12px] font-semibold transition-colors cursor-pointer"
                        >
                          جزئیات ←
                        </button>
                      </div>
                    </article>
                  `;
                })
                .join('')}
            </div>
          `
          }
        </div>
      </div>
    `;
  }

  function renderProfileTab(): string {
    const displayAvatar = pendingAvatarUrl || state.member.avatar_url || '';

    return `
      <div class="space-y-6">
        <div>
          <h2 class="font-display text-[20px] sm:text-[23px] font-bold text-[#231912]">
            پرونده و پروفایل کاربری
          </h2>
          <p class="text-[13.5px] text-[#6B5444] mt-1 text-justify">
            تصویر پروفایل، اطلاعات فردی، سوابق تحصیلی و ژانرهای مورد علاقه خود را در این بخش مشاهده و ویرایش کنید.
          </p>
        </div>

        <form class="js-profile-form p-6 sm:p-8 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] space-y-6" novalidate>
          <!-- Avatar Upload Section -->
          <div class="pb-5 border-b border-[#E6D8C5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-20 h-20 rounded-2xl bg-[#7A4B2A] text-[#FAF5EC] font-display text-[26px] font-bold flex items-center justify-center overflow-hidden border-2 border-[#DEC8AC] shrink-0">
                ${
                  displayAvatar
                    ? `<img src="${displayAvatar}" alt="${state.member.first_name}" class="js-profile-avatar-preview w-full h-full object-cover" />`
                    : `<span class="js-profile-avatar-initial">${state.member.first_name.charAt(0)}</span>`
                }
              </div>
              <div>
                <h3 class="font-bold text-[15.5px] text-[#231912]">
                  تصویر پروفایل کاربری
                </h3>
                <p class="text-[12px] text-[#6B5444] mt-0.5">
                  فرمت‌های مجاز: JPG، PNG یا WEBP · تصویر در دیتابیس ذخیره می‌شود
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2.5 self-end sm:self-auto">
              <input
                type="file"
                accept="image/*"
                class="js-profile-avatar-input hidden"
              />
              <button
                type="button"
                title="انتخاب تصویر جدید"
                aria-label="انتخاب تصویر جدید"
                class="js-trigger-avatar-upload w-10 h-10 rounded-xl bg-[#F3E7D6] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[#3F2E21] inline-flex items-center justify-center transition-colors cursor-pointer"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
              </button>
              ${
                displayAvatar
                  ? `
                <button
                  type="button"
                  title="حذف عکس"
                  aria-label="حذف عکس"
                  class="js-remove-avatar-btn w-10 h-10 rounded-xl border border-[#E6B8B3] text-[#9E3329] hover:bg-[#FBEAE8] inline-flex items-center justify-center transition-colors cursor-pointer"
                >
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              `
                  : ''
              }
            </div>
          </div>

          <!-- Form Fields: City removed and replaced directly by Email -->
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
              <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">سطح روسی</label>
              <select
                name="education"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13.5px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
              >
                <option value="" ${!['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(state.member.education) ? 'selected' : ''}>سطح روسی خود را انتخاب کنید</option>
                ${['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
                  .map(
                    (lvl) =>
                      `<option value="${lvl}" ${state.member.education === lvl ? 'selected' : ''}>${lvl}</option>`
                  )
                  .join('')}
              </select>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">پست الکترونیک (ایمیل)</label>
              <input
                type="text"
                name="email"
                dir="ltr"
                value="${state.member.email || ''}"
                placeholder="name@example.com"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13.5px] text-[#231912] text-left focus:outline-none focus:border-[#8B5A36]"
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

          ${
            profileSavedBannerMessage
              ? `
            <div class="p-3.5 rounded-xl bg-[#E4F2E7] border border-[#BBD9C2] text-[#235332] text-[13px] font-semibold flex items-center justify-between">
              <span>✓ ${toPersianDigits(profileSavedBannerMessage)}</span>
            </div>
          `
              : ''
          }

          <div class="flex justify-end pt-2">
            <button
              type="button"
              class="js-save-profile-btn w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[13.5px] font-semibold text-center justify-center transition-colors cursor-pointer"
            >
              ${isSavingProfile ? 'در حال ذخیره تغییرات...' : 'ذخیره تغییرات پروفایل'}
            </button>
          </div>
        </form>
      </div>
    `;
  }

  function getAvailableCalendarMonths(): string[] {
    const baseMonths = [
      'فروردین ۱۴۰۵',
      'اردیبهشت ۱۴۰۵',
      'خرداد ۱۴۰۵',
      'تیر ۱۴۰۵',
      'مرداد ۱۴۰۵',
      'شهریور ۱۴۰۵',
      'مهر ۱۴۰۵',
      'آبان ۱۴۰۵',
      'آذر ۱۴۰۵',
      'دی ۱۴۰۵',
      'بهمن ۱۴۰۵',
      'اسفند ۱۴۰۵',
    ];
    const eventMonths = state.calendarEvents
      .map((ev) => String(ev.month_name || '').trim())
      .filter(Boolean);
    const merged = Array.from(new Set([...eventMonths, 'آبان ۱۴۰۵', 'آذر ۱۴۰۵']));
    return merged.sort((a, b) => {
      const idxA = baseMonths.indexOf(a);
      const idxB = baseMonths.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b, 'fa');
    });
  }

  function renderCalendarTab(): string {
    const weekdays = [
      'شنبه',
      'یکشنبه',
      'دوشنبه',
      'سه‌شنبه',
      'چهارشنبه',
      'پنجشنبه',
      'جمعه',
    ];

    const availableMonths = getAvailableCalendarMonths();
    if (!availableMonths.includes(activeCalendarMonth)) {
      activeCalendarMonth = availableMonths[0] || 'آبان ۱۴۰۵';
    }

    const monthOffsets: Record<string, number> = {
      'فروردین ۱۴۰۵': 0,
      'اردیبهشت ۱۴۰۵': 3,
      'خرداد ۱۴۰۵': 6,
      'تیر ۱۴۰۵': 2,
      'مرداد ۱۴۰۵': 5,
      'شهریور ۱۴۰۵': 1,
      'مهر ۱۴۰۵': 4,
      'آبان ۱۴۰۵': 3,
      'آذر ۱۴۰۵': 5,
      'دی ۱۴۰۵': 0,
      'بهمن ۱۴۰۵': 2,
      'اسفند ۱۴۰۵': 4,
    };
    const startOffset =
      monthOffsets[activeCalendarMonth] !== undefined
        ? monthOffsets[activeCalendarMonth]
        : 3;
    const isFirstSixMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'].some((m) =>
      activeCalendarMonth.startsWith(m)
    );
    const totalDays = isFirstSixMonths ? 31 : 30;

    const monthEvents = state.calendarEvents.filter(
      (ev) => ev.month_name === activeCalendarMonth
    );

    const cells: string[] = [];
    for (let i = 0; i < startOffset; i += 1) {
      cells.push(
        `<div class="min-h-[112px] rounded-xl bg-[#F4E9DA]/35 border border-[#E8DAC6]/60 p-2"></div>`
      );
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const persianDay = toPersianDigits(day);
      const dayEvents = monthEvents.filter(
        (ev) => parseLocalizedInt(ev.day_of_month, -1) === day
      );
      const hasEvent = dayEvents.length > 0;

      cells.push(`
        <div class="min-h-[118px] rounded-xl p-2.5 border transition-all flex flex-col justify-between ${
          hasEvent
            ? 'bg-[#FDF9F1] border-[#C8A987] shadow-[0_6px_16px_rgba(122,75,42,0.08)]'
            : 'bg-[#FAF5EC] border-[#E5D7C5]'
        }">
          <div class="flex items-center justify-between">
            <span class="w-7 h-7 rounded-lg text-[13px] font-bold flex items-center justify-center ${
              hasEvent
                ? 'bg-[#5A3A22] text-[#FAF5EC]'
                : 'text-[#5B4739] bg-[#F2E6D5]/70'
            }">
              ${persianDay}
            </span>
            ${
              hasEvent
                ? `<span class="text-[10.5px] font-semibold text-[#7A4B2A]">${toPersianDigits(dayEvents.length)} رویداد</span>`
                : ''
            }
          </div>

          <div class="mt-2 space-y-1.5">
            ${dayEvents
              .map((ev) => {
                const isPast = isCalendarEventPast(ev);
                return `
              <button
                type="button"
                data-cal-event-id="${ev.id}"
                class="js-open-calendar-event w-full text-right p-2 rounded-lg border text-[11px] leading-[1.45] transition-all cursor-pointer block ${
                  isPast
                    ? 'bg-[#EFE7DC] border-[#D8CABB] text-[#6B5444] hover:bg-[#E6DACA]'
                    : ev.is_reserved
                    ? 'bg-[#E6F3E9] border-[#B7DBC0] text-[#1F4B2C] hover:bg-[#D7ECD9]'
                    : 'bg-[#F3E5D3] border-[#DEC4A4] text-[#4A321F] hover:bg-[#EAD6BC]'
                }"
              >
                <div class="font-bold truncate">${toPersianDigits(ev.title)}</div>
                <div class="flex items-center justify-between text-[10px] opacity-85 mt-1">
                  <span>ساعت ${toPersianDigits(ev.time_range)}</span>
                  <span>${isPast ? 'برگزار شده' : ev.is_reserved ? '✓ رزرو' : 'مشاهده'}</span>
                </div>
              </button>
            `;
              })
              .join('')}
          </div>
        </div>
      `);
    }

    return `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="font-display text-[20px] sm:text-[23px] font-bold text-[#231912]">
              تقویم ماهانه رویدادها، نشست‌ها و دوره‌های باشگاه
            </h2>
            <p class="text-[13.5px] text-[#6B5444] mt-1 text-justify">
              تمامی نشست‌های کتاب‌خوانی و کلاس‌های آموزشی تعریف‌شده در باشگاه به‌صورت پویا در روزهای تقویم درج شده‌اند. برای مشاهده جزئیات یا ورود به دوره روی رویداد کلیک کنید.
            </p>
          </div>

          <!-- Dynamic Month Switcher -->
          <div class="inline-flex flex-wrap items-center gap-1.5 bg-[#FAF5EC] p-1.5 rounded-xl border border-[#E5D7C5] shrink-0 self-start sm:self-auto">
            ${availableMonths
              .map(
                (m) => `
              <button
                type="button"
                data-cal-month="${m}"
                class="js-switch-cal-month px-3.5 py-2 rounded-lg text-[12px] font-bold transition-colors cursor-pointer ${
                  activeCalendarMonth === m
                    ? 'bg-[#5A3A22] text-[#FAF5EC]'
                    : 'text-[#4E3B2D] hover:bg-[#EFE3D2]'
                }"
              >
                ${toPersianDigits(m)}
              </button>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Calendar Grid Container -->
        <div class="p-4 sm:p-6 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] shadow-[0_10px_28px_rgba(61,46,34,0.05)] overflow-x-auto">
          <div class="min-w-[760px] space-y-3">
            <!-- Weekday Headers -->
            <div class="grid grid-cols-7 gap-2.5 text-center">
              ${weekdays
                .map(
                  (dayName) => `
                <div class="py-2.5 rounded-xl bg-[#EFE2CE] text-[#3F2E21] text-[12.5px] font-bold border border-[#DFCBB2]">
                  ${dayName}
                </div>
              `
                )
                .join('')}
            </div>

            <!-- Days Grid -->
            <div class="grid grid-cols-7 gap-2.5">
              ${cells.join('')}
            </div>
          </div>
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
      case 'announcements':
        return renderAnnouncementsTab();
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
    const unreadAnnouncementsCount = state.announcements.filter(
      (a) => a.is_read === 0
    ).length;

    const navItems: Array<{ key: PanelTabKey; label: string; badge?: string }> = [
      { key: 'dashboard', label: 'داشبورد' },
      {
        key: 'sessions',
        label: 'نشست های من',
        badge: toPersianDigits(state.sessions.length),
      },
      {
        key: 'classes',
        label: 'کلاس های من',
        badge: toPersianDigits(state.classes.length),
      },
      {
        key: 'library',
        label: 'کتابخانه من',
        badge: toPersianDigits(state.library.length),
      },
      {
        key: 'announcements',
        label: 'اطلاعیه',
        badge:
          unreadAnnouncementsCount > 0
            ? toPersianDigits(unreadAnnouncementsCount)
            : undefined,
      },
      {
        key: 'tickets',
        label: 'تیکت',
        badge: toPersianDigits(state.tickets.length),
      },
      { key: 'profile', label: 'پروفایل' },
      {
        key: 'calendar',
        label: 'تقویم رویدادها',
        badge: toPersianDigits(state.calendarEvents.length),
      },
    ];

    const sidebarAvatar = state.member.avatar_url || '';
    const activeNavItem = navItems.find((item) => item.key === activeTab) || navItems[0];

    $wrapper.html(`
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7 items-start">
        <!-- Sidebar Navigation -->
        <aside class="lg:col-span-3 p-4 sm:p-5 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] shadow-[0_12px_32px_rgba(61,46,34,0.05)] lg:sticky lg:top-24">
          <div class="flex items-center justify-between gap-3 lg:pb-4 lg:mb-4 lg:border-b lg:border-[#E6D8C5]">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#7A4B2A] text-[#FAF5EC] font-display text-[18px] font-bold flex items-center justify-center overflow-hidden border border-[#DEC8AC] shrink-0">
                ${
                  sidebarAvatar
                    ? `<img src="${sidebarAvatar}" alt="${state.member.first_name}" class="w-full h-full object-cover" />`
                    : state.member.first_name.charAt(0)
                }
              </div>
              <div class="min-w-0">
                <h3 class="font-bold text-[14.5px] sm:text-[15px] text-[#231912] truncate">
                  ${state.member.first_name} ${state.member.last_name}
                </h3>
                <span class="text-[12px] text-[#6B5444] block">
                  ${toPersianDigits(state.member.phone)}
                </span>
              </div>
            </div>

            <button
              type="button"
              aria-expanded="${isMobileSidebarOpen ? 'true' : 'false'}"
              aria-label="باز و بسته کردن منوی پنل کاربری"
              class="js-toggle-member-mobile-nav lg:hidden inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#EFE3D2] hover:bg-[#E4D3BC] text-[#3F2E21] text-[12.5px] font-semibold transition-colors cursor-pointer shrink-0"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="4" y1="7" x2="20" y2="7"></line>
                <line x1="4" y1="12" x2="20" y2="12"></line>
                <line x1="4" y1="17" x2="20" y2="17"></line>
              </svg>
              <span>${activeNavItem.label}</span>
              <svg class="w-4 h-4 transition-transform ${isMobileSidebarOpen ? 'rotate-180' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>

          <div class="${isMobileSidebarOpen ? 'block pt-4 mt-4 border-t border-[#E6D8C5]' : 'hidden'} lg:block">
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
                class="js-back-to-home hidden lg:block w-full px-4 py-2.5 rounded-xl text-[12.5px] font-semibold text-[#5B4636] hover:bg-[#EFE3D2] text-right transition-colors cursor-pointer"
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
          </div>
        </aside>

        <!-- Main Content Area -->
        <main class="lg:col-span-9 min-w-0">
          ${getActiveTabContent()}
        </main>
      </div>
      ${renderSubSessionModal()}
      ${renderCalendarEventModal()}
    `);
  }

  function refreshPanelStateInBackground(): void {
    ApiService.fetchMemberPanelData(state.member.phone)
      .then((fresh) => {
        state = {
          ...state,
          sessions: [...(fresh.sessions || [])],
          classes: [...(fresh.classes || [])],
          library: [...(fresh.library || [])],
          tickets: [...(fresh.tickets || [])],
          calendarEvents: [...(fresh.calendarEvents || [])],
          announcements: [...(fresh.announcements || [])],
        };
        render();
      })
      .catch(() => {
        // Ignore silent background sync error
      });
  }

  // Event Delegations
  $wrapper.on('click', '.js-toggle-member-mobile-nav', () => {
    isMobileSidebarOpen = !isMobileSidebarOpen;
    render();
  });

  $wrapper.on('click', '.js-panel-tab-btn', function () {
    const nextTab = $(this).data('tab') as PanelTabKey;
    if (nextTab) {
      activeTab = nextTab;
      isMobileSidebarOpen = false;
      selectedSessionId = null;
      selectedClassId = null;
      selectedTicketId = null;
      activeSubSessionModal = null;
      activeCalendarEventModal = null;
      subSessionFilter = 'all';
      subSessionSearchQuery = '';
      profileSavedBannerMessage = '';
      notifyRoute();
      render();
      refreshPanelStateInBackground();
    }
  });

  $wrapper.on('click', '.js-switch-tab-btn', function () {
    const nextTab = $(this).data('switch-tab') as PanelTabKey;
    if (nextTab) {
      activeTab = nextTab;
      isMobileSidebarOpen = false;
      selectedSessionId = null;
      selectedClassId = null;
      selectedTicketId = null;
      activeSubSessionModal = null;
      activeCalendarEventModal = null;
      profileSavedBannerMessage = '';
      notifyRoute();
      render();
      refreshPanelStateInBackground();
    }
  });

  // Main Sessions list search & filter handlers (Item 1)
  $wrapper.on('click', '.js-sessions-main-filter-btn', function () {
    const nextFilter = $(this).data('sessions-filter') as
      | 'all'
      | 'ثبت‌نام‌شده'
      | 'برگزارشده';
    if (nextFilter) {
      sessionsListFilter = nextFilter;
      render();
    }
  });

  $wrapper.on('input', '.js-sessions-main-search-input', function () {
    sessionsListSearchQuery = String($(this).val() || '');
    render();
    const $input = $wrapper.find('.js-sessions-main-search-input');
    $input.trigger('focus');
    const len = String($input.val() || '').length;
    const el = $input.get(0) as HTMLInputElement | undefined;
    if (el && el.setSelectionRange) {
      el.setSelectionRange(len, len);
    }
  });

  // Main Classes list search & filter handlers (Item 3)
  $wrapper.on('click', '.js-classes-main-filter-btn', function () {
    const nextFilter = $(this).data('classes-filter') as 'all' | 'پیشرفته' | 'تخصصی';
    if (nextFilter) {
      classesListFilter = nextFilter;
      render();
    }
  });

  $wrapper.on('input', '.js-classes-main-search-input', function () {
    classesListSearchQuery = String($(this).val() || '');
    render();
    const $input = $wrapper.find('.js-classes-main-search-input');
    $input.trigger('focus');
    const len = String($input.val() || '').length;
    const el = $input.get(0) as HTMLInputElement | undefined;
    if (el && el.setSelectionRange) {
      el.setSelectionRange(len, len);
    }
  });

  // Open a Session card into Session Detail View (enforcing admin approval)
  $wrapper.on('click', '.js-open-session-card', function () {
    const sessionId = Number($(this).data('open-session-id'));
    if (sessionId) {
      const targetSession = state.sessions.find((s) => Number(s.id) === sessionId);
      if (!targetSession || !isSessionApprovedForAccess(targetSession)) {
        showToast(
          'این نشست در وضعیت «غیرفعال» (در انتظار تایید مدیر باشگاه) است. پس از تایید ثبت‌نام، دسترسی به جزئیات و لینک جلسات فعال می‌شود.',
          true
        );
        return;
      }
      activeTab = 'sessions';
      selectedSessionId = sessionId;
      activeSubSessionModal = null;
      subSessionFilter = 'all';
      subSessionSearchQuery = '';
      notifyRoute();
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  $wrapper.on('click', '.js-back-to-sessions-list', () => {
    selectedSessionId = null;
    activeSubSessionModal = null;
    subSessionFilter = 'all';
    subSessionSearchQuery = '';
    notifyRoute();
    render();
  });

  // Open a Class card into Class Detail View (enforcing admin approval)
  $wrapper.on('click', '.js-open-class-card', function () {
    const classId = Number($(this).data('open-class-id'));
    if (classId) {
      const targetClass = state.classes.find((c) => Number(c.id) === classId);
      if (!targetClass || !isClassApprovedForAccess(targetClass)) {
        showToast(
          'این دوره آموزشی در وضعیت «غیرفعال» (در انتظار تایید مدیر باشگاه) است. پس از تایید ثبت‌نام، دسترسی به محتوای کلاس و جلسات فعال می‌شود.',
          true
        );
        return;
      }
      activeTab = 'classes';
      selectedClassId = classId;
      activeSubSessionModal = null;
      subSessionFilter = 'all';
      subSessionSearchQuery = '';
      notifyRoute();
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  $wrapper.on('click', '.js-back-to-classes-list', () => {
    selectedClassId = null;
    activeSubSessionModal = null;
    subSessionFilter = 'all';
    subSessionSearchQuery = '';
    notifyRoute();
    render();
  });

  // Sub-session filter & search handlers
  $wrapper.on('click', '.js-subsession-filter-btn', function () {
    const nextFilter = $(this).data('subfilter') as 'all' | 'تعریف شده' | 'برگزار شده';
    if (nextFilter) {
      subSessionFilter = nextFilter;
      render();
    }
  });

  $wrapper.on('input', '.js-subsession-search-input', function () {
    subSessionSearchQuery = String($(this).val() || '');
    render();
    const $input = $wrapper.find('.js-subsession-search-input');
    $input.trigger('focus');
    const len = String($input.val() || '').length;
    const el = $input.get(0) as HTMLInputElement | undefined;
    if (el && el.setSelectionRange) {
      el.setSelectionRange(len, len);
    }
  });

  // Library toggle add form, filter & search handlers
  $wrapper.on('click', '.js-toggle-add-book-form', () => {
    isAddBookFormOpen = !isAddBookFormOpen;
    render();
  });

  $wrapper.on('click', '.js-library-filter-btn', function () {
    const nextFilter = $(this).data('libfilter') as
      | 'all'
      | 'در حال مطالعه'
      | 'خوانده‌شده'
      | 'در نوبت مطالعه';
    if (nextFilter) {
      libraryFilter = nextFilter;
      render();
    }
  });

  $wrapper.on('input', '.js-library-search-input', function () {
    librarySearchQuery = String($(this).val() || '');
    render();
    const $input = $wrapper.find('.js-library-search-input');
    $input.trigger('focus');
    const len = String($input.val() || '').length;
    const el = $input.get(0) as HTMLInputElement | undefined;
    if (el && el.setSelectionRange) {
      el.setSelectionRange(len, len);
    }
  });

  // Open Held / Defined Sub-Session Modal
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

  // Calendar month switch & event modal handlers
  $wrapper.on('click', '.js-switch-cal-month', function () {
    const month = String($(this).data('cal-month') || '').trim();
    if (month) {
      activeCalendarMonth = month;
      render();
    }
  });

  $wrapper.on('click', '.js-open-calendar-event', function () {
    const evId = Number($(this).data('cal-event-id'));
    const found = state.calendarEvents.find((e) => Number(e.id) === evId);
    if (found) {
      activeCalendarEventModal = found;
      render();
    }
  });

  $wrapper.on('click', '.js-calendar-open-target', function () {
    const targetType = String($(this).data('cal-target-type') || '');
    const targetId = Number($(this).data('cal-target-id') || 0);
    activeCalendarEventModal = null;

    if (targetType === 'session') {
      const targetSession = state.sessions.find((s) => Number(s.id) === targetId);
      activeTab = 'sessions';
      if (targetSession && isSessionApprovedForAccess(targetSession)) {
        selectedSessionId = targetSession.id;
      } else {
        selectedSessionId = null;
        if (targetSession && !isSessionApprovedForAccess(targetSession)) {
          showToast(
            'این نشست در انتظار تایید مدیر باشگاه است. پس از تایید ثبت‌نام، دسترسی به جلسات فعال می‌شود.',
            true
          );
        }
      }
      notifyRoute();
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (targetType === 'class') {
      const targetClass = state.classes.find((c) => Number(c.id) === targetId);
      activeTab = 'classes';
      if (targetClass && isClassApprovedForAccess(targetClass)) {
        selectedClassId = targetClass.id;
      } else {
        selectedClassId = null;
        if (targetClass && !isClassApprovedForAccess(targetClass)) {
          showToast(
            'این دوره آموزشی در انتظار تایید مدیر باشگاه است. پس از تایید ثبت‌نام، دسترسی به جلسات فعال می‌شود.',
            true
          );
        }
      }
      notifyRoute();
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  $wrapper.on('click', '.js-close-calendar-modal', () => {
    activeCalendarEventModal = null;
    render();
  });

  $wrapper.on('click', '.js-calendar-modal-backdrop', function (event) {
    if ($(event.target).hasClass('js-calendar-modal-backdrop')) {
      activeCalendarEventModal = null;
      render();
    }
  });

  // Announcements mark as read
  $wrapper.on('click', '.js-mark-announcement-read', function () {
    const announcementId = Number($(this).data('announcement-id'));
    if (!announcementId) return;
    ApiService.markAnnouncementRead(announcementId)
      .then((res) => {
        state.announcements = state.announcements.map((a) =>
          Number(a.id) === announcementId ? { ...res.announcement, is_read: 1 } : a
        );
        render();
        showToast('اطلاعیه به عنوان خوانده‌شده ثبت گردید.');
      })
      .catch((err) => {
        showToast(err.message || 'خطا در بروزرسانی اطلاعیه', true);
      });
  });

  $wrapper.on('click', '.js-mark-all-announcements-read', () => {
    ApiService.markAllAnnouncementsRead()
      .then(() => {
        state.announcements = state.announcements.map((a) => ({ ...a, is_read: 1 }));
        render();
        showToast('تمامی اطلاعیه‌ها به عنوان خوانده‌شده ثبت شدند.');
      })
      .catch((err) => {
        showToast(err.message || 'خطا در بروزرسانی اطلاعیه‌ها', true);
      });
  });

  // Profile avatar upload handlers with client-side resize
  $wrapper.on('click', '.js-trigger-avatar-upload', () => {
    $wrapper.find('.js-profile-avatar-input').trigger('click');
  });

  $wrapper.on('change', '.js-profile-avatar-input', function (event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    resizeImageToDataUrl(file, 320)
      .then((dataUrl) => {
        pendingAvatarUrl = dataUrl;
        profileSavedBannerMessage = '';
        render();
        showToast('تصویر انتخاب شد؛ اکنون روی «ذخیره تغییرات پروفایل» کلیک کنید.');
      })
      .catch(() => {
        showToast('خطا در بارگذاری تصویر', true);
      });
  });

  $wrapper.on('click', '.js-remove-avatar-btn', () => {
    pendingAvatarUrl = '';
    state.member.avatar_url = '';
    profileSavedBannerMessage = '';
    render();
  });

  // Ticket file attachment & detail view handlers
  $wrapper.on('click', '.js-trigger-ticket-file', () => {
    $wrapper.find('.js-ticket-file-input').trigger('click');
  });

  $wrapper.on('change', '.js-ticket-file-input', function (event) {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (files.length > 0) {
      selectedTicketFileName = files.map((f) => f.name).join('، ');
      $wrapper
        .find('.js-ticket-file-label')
        .text(`فایل انتخاب‌شده: ${toPersianDigits(selectedTicketFileName)}`);
    } else {
      selectedTicketFileName = '';
      $wrapper
        .find('.js-ticket-file-label')
        .text('فایلی انتخاب نشده است (حداکثر ۵ مگابایت)');
    }
  });

  $wrapper.on('click', '.js-open-ticket-detail', function () {
    const ticketId = Number($(this).data('ticket-id'));
    if (!ticketId) return;
    selectedTicketId = ticketId;
    selectedReplyFileNames = '';
    notifyRoute();
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  $wrapper.on('click', '.js-back-to-tickets-list', () => {
    selectedTicketId = null;
    selectedReplyFileNames = '';
    notifyRoute();
    render();
  });

  $wrapper.on('click', '.js-trigger-reply-ticket-file', () => {
    $wrapper.find('.js-member-reply-ticket-files').trigger('click');
  });

  $wrapper.on('change', '.js-member-reply-ticket-files', function (event) {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (files.length > 0) {
      selectedReplyFileNames = files.map((f) => f.name).join('، ');
      $wrapper
        .find('.js-reply-ticket-file-label')
        .text(`فایل انتخاب‌شده: ${toPersianDigits(selectedReplyFileNames)}`);
    } else {
      selectedReplyFileNames = '';
      $wrapper.find('.js-reply-ticket-file-label').text('فایلی انتخاب نشده است');
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

  // Save book changes and automatically advance progress bar based on pages_read
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
        state.library = [res.book, ...state.library];
        isAddBookFormOpen = false;
        render();
        showToast('کتاب جدید در دیتابیس و کتابخانه شخصی شما ثبت شد.');
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
      $form.find('[name="department"]').val() || 'امور ثبت‌نام و دوره‌ها'
    );
    const priority = String($form.find('[name="priority"]').val() || 'عادی') as
      | 'عادی'
      | 'مهم'
      | 'فوری';
    const message = String($form.find('[name="message"]').val() || '').trim();
    const fileInput = $form.find('.js-ticket-file-input')[0] as HTMLInputElement | undefined;

    if (!subject || !message) {
      showToast('لطفاً موضوع و متن تیکت را تکمیل کنید.', true);
      return;
    }

    readFilesForTicketAttachments(fileInput?.files)
      .then((attachments) =>
        ApiService.createMemberTicket({
          member_phone: state.member.phone,
          subject,
          department,
          priority,
          message,
          attachment_name: attachments[0]?.file_name || selectedTicketFileName || undefined,
          attachments,
        })
      )
      .then((res) => {
        state.tickets = [res.ticket, ...state.tickets];
        selectedTicketFileName = '';
        if (fileInput) fileInput.value = '';
        render();
        showToast('تیکت شما به همراه فایل پیوست در دیتابیس ثبت و ارسال شد.');
      })
      .catch((err) => {
        showToast(err.message || 'خطا در ارسال تیکت', true);
      });
  });

  // Member reply to an open ticket
  $wrapper.on('submit', '.js-member-reply-ticket-form', function (event) {
    event.preventDefault();
    const $form = $(this);
    const ticketId = Number($form.data('ticket-id') || selectedTicketId || 0);
    if (!ticketId) return;

    const currentTicket = state.tickets.find((t) => Number(t.id) === ticketId);
    if (currentTicket && currentTicket.status === 'بسته‌شده') {
      showToast('این تیکت بسته شده است و امکان ارسال پیام جدید وجود ندارد.', true);
      return;
    }

    const message = String($form.find('[name="reply_message"]').val() || '').trim();
    const fileInput = $form.find('.js-member-reply-ticket-files')[0] as
      | HTMLInputElement
      | undefined;
    const hasFiles = Boolean(fileInput?.files && fileInput.files.length > 0);

    if (!message && !hasFiles) {
      showToast('لطفاً متن پاسخ را وارد نمایید یا فایل پیوست انتخاب کنید.', true);
      return;
    }

    readFilesForTicketAttachments(fileInput?.files)
      .then((attachments) =>
        ApiService.replyMemberTicket({
          ticketId,
          message,
          attachments,
        })
      )
      .then((res) => {
        state.tickets = state.tickets.map((t) =>
          Number(t.id) === ticketId ? res.ticket : t
        );
        selectedReplyFileNames = '';
        if (fileInput) fileInput.value = '';
        render();
        showToast('پاسخ شما در تیکت ثبت شد.');
      })
      .catch((err) => {
        showToast(err.message || 'خطا در ثبت پاسخ تیکت', true);
      });
  });

  // Save Profile handler (Item 5: works on button click AND form submit)
  function handleSaveProfile(): void {
    if (isSavingProfile) return;
    const $form = $wrapper.find('.js-profile-form');
    if (!$form.length) return;

    const first_name = String($form.find('[name="first_name"]').val() || '').trim();
    const last_name = String($form.find('[name="last_name"]').val() || '').trim();
    const education = String($form.find('[name="education"]').val() || 'B1').trim();
    const email = String($form.find('[name="email"]').val() || '').trim();
    const bio = String($form.find('[name="bio"]').val() || '').trim();

    if (!first_name || !last_name) {
      showToast('لطفاً نام و نام خانوادگی را وارد نمایید.', true);
      return;
    }

    isSavingProfile = true;
    profileSavedBannerMessage = '';
    $wrapper.find('.js-save-profile-btn').text('در حال ذخیره تغییرات...');

    const payload = {
      phone: state.member.phone || '',
      first_name,
      last_name,
      education,
      email,
      avatar_url: pendingAvatarUrl,
      bio,
    };

    ApiService.updateMemberProfile(payload)
      .then((res) => {
        isSavingProfile = false;
        state.member = {
          ...state.member,
          ...res.member,
          avatar_url:
            res.member.avatar_url !== undefined
              ? res.member.avatar_url
              : pendingAvatarUrl,
        };
        pendingAvatarUrl = state.member.avatar_url || '';
        profileSavedBannerMessage =
          'اطلاعات و تغییرات پروفایل شما با موفقیت در دیتابیس ذخیره شد.';
        props.onMemberUpdated(state.member);
        render();
        showToast('اطلاعات و تصویر پروفایل شما با موفقیت ذخیره شد.');
      })
      .catch((err) => {
        isSavingProfile = false;
        render();
        showToast(err.message || 'خطا در ذخیره پروفایل در دیتابیس', true);
      });
  }

  $wrapper.on('click', '.js-save-profile-btn', (event) => {
    event.preventDefault();
    handleSaveProfile();
  });

  $wrapper.on('submit', '.js-profile-form', (event) => {
    event.preventDefault();
    handleSaveProfile();
  });

  // Toggle calendar reservation (only allowed for upcoming events)
  $wrapper.on('click', '.js-toggle-calendar-reserve', function () {
    const eventId = Number($(this).data('event-id'));
    const targetEv = state.calendarEvents.find((e) => e.id === eventId);
    if (targetEv && isCalendarEventPast(targetEv)) {
      showToast('این رویداد برگزار شده است و امکان رزرو یا لغو آن وجود ندارد.', true);
      return;
    }
    ApiService.toggleCalendarReservation(eventId)
      .then((res) => {
        state.calendarEvents = state.calendarEvents.map((ev) =>
          ev.id === eventId ? res.event : ev
        );
        if (activeCalendarEventModal && activeCalendarEventModal.id === eventId) {
          activeCalendarEventModal = res.event;
        }
        render();
        showToast(
          res.event.is_reserved
            ? 'رزرو حضور شما در این رویداد در دیتابیس ثبت شد.'
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
