import $ from 'jquery';
import { ApiService } from '../services/api.ts';
import type {
  AboutClubData,
  AboutManagerData,
  AdminPanelPayload,
  BlogPost,
  ClubAnnouncement,
  ClubMember,
  ContactInfoData,
  EnrollmentRecord,
  GalleryImage,
  HeroSettings,
  MemberClassItem,
  MemberSession,
  MemberTicket,
  SessionSubItem,
  UserComment,
} from '../types/models.ts';
import { toPersianDigits } from '../utils/persianNumbers.ts';

export type AdminTabKey =
  | 'dashboard'
  | 'gallery'
  | 'sessions'
  | 'classes'
  | 'users'
  | 'tickets'
  | 'announcements'
  | 'profile'
  | 'blog'
  | 'comments'
  | 'home_settings';

export interface AdminPanelPageProps {
  initialData: AdminPanelPayload;
  initialTab?: AdminTabKey;
  initialSubPath?: string;
  onRouteChange?: (path: string) => void;
  onBackToSite: () => void;
  onLogout: () => void;
  onAdminUpdated: (admin: ClubMember) => void;
  onSiteDataUpdated: (updated: {
    heroSettings?: HeroSettings;
    aboutClub?: AboutClubData;
    aboutManager?: AboutManagerData;
    contactInfo?: ContactInfoData;
    blogPosts?: BlogPost[];
  }) => void;
}

function resizeImageToDataUrl(file: File, maxDim = 480): Promise<string> {
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
    reader.readAsDataURL(file);
  });
}

function normalizeCourseStatus(status?: string): 'فعال' | 'غیرفعال' {
  if (status === 'غیرفعال' || status === 'برگزارشده') {
    return 'غیرفعال';
  }
  return 'فعال';
}

function normalizeSubSessionStatus(status?: string): 'جلسه آتی' | 'برگزار شده' {
  if (status === 'برگزار شده') {
    return 'برگزار شده';
  }
  return 'جلسه آتی';
}

export function createAdminPanelPageComponent(props: AdminPanelPageProps): JQuery {
  let state: AdminPanelPayload = {
    admin: { ...props.initialData.admin },
    sessions: [...(props.initialData.sessions || [])],
    classes: [...(props.initialData.classes || [])],
    users: [...(props.initialData.users || [])],
    tickets: [...(props.initialData.tickets || [])],
    announcements: [...(props.initialData.announcements || [])],
    blogPosts: [...(props.initialData.blogPosts || [])],
    comments: [...(props.initialData.comments || [])],
    gallery: [...(props.initialData.gallery || [])],
    heroSettings: { ...props.initialData.heroSettings },
    aboutClub: { ...props.initialData.aboutClub },
    aboutManager: { ...props.initialData.aboutManager },
    contactInfo: { ...props.initialData.contactInfo },
    libraryBooks: [...(props.initialData.libraryBooks || [])],
  };

  let activeTab: AdminTabKey = props.initialTab || 'dashboard';

  // Gallery state
  let gallerySearch = '';
  let galleryCategoryFilter = 'all';
  let newGalleryImageUrl = '';
  let galleryPickerTarget: null | 'session' | 'class' | 'blog' = null;

  // Universal action confirmation modal state (used for Delete, Approve Enrollment, Cancel Enrollment)
  let pendingDeleteConfirm: {
    title: string;
    description: string;
    confirmLabel?: string;
    confirmTone?: 'danger' | 'success';
    onConfirm: () => void;
  } | null = null;

  // Send Ticket to Enrolled Member modal state
  let ticketTargetEnrollment: {
    member_phone: string;
    member_name: string;
    course_or_session_title: string;
  } | null = null;

  // Personal announcement modal state (for a specific user)
  let notifyTargetUser: ClubMember | null = null;

  // Password reset modal state (for a specific user)
  let resetPasswordTargetUser: ClubMember | null = null;

  // Blog new category modal state
  let isBlogCategoryModalOpen = false;
  const defaultBlogCategories = [
    'یادداشت ادبی',
    'نقد و بررسی کتاب',
    'گزارش نشست‌ها',
    'راهنمای مطالعه',
    'گفتگو و مصاحبه',
  ];
  let savedCustomBlogCategories: string[] = [];
  try {
    const rawCats = window.localStorage.getItem('bookmeet_blog_categories');
    if (rawCats) {
      savedCustomBlogCategories = JSON.parse(rawCats);
    }
  } catch {
    savedCustomBlogCategories = [];
  }
  let blogCategories: string[] = Array.from(
    new Set([
      ...defaultBlogCategories,
      ...savedCustomBlogCategories,
      ...state.blogPosts.map((p) => p.category).filter(Boolean),
    ])
  );

  // Sessions management state
  let sessionSearch = '';
  let sessionStatusFilter: 'all' | 'فعال' | 'غیرفعال' = 'all';
  let editingSession: Partial<MemberSession> | null = null;
  let managingSubSessionsForSessionId: number | null = null;
  let editingSubSession: SessionSubItem | null = null;
  let isAddingSubSession = false;
  let subSessionSearch = '';
  let subSessionStatusFilter: 'all' | 'جلسه آتی' | 'برگزار شده' = 'all';

  // Classes management state
  let classSearch = '';
  let classStatusFilter: 'all' | 'فعال' | 'غیرفعال' = 'all';
  let editingClass: Partial<MemberClassItem> | null = null;
  let managingSubSessionsForClassId: number | null = null;

  // Users management state
  let userSearch = '';
  let userStatusFilter: 'all' | 'فعال' | 'غیرفعال' = 'all';
  let editingUser: (Partial<ClubMember> & { password?: string }) | null = null;

  // Tickets management state
  let ticketFilter: 'all' | 'در انتظار بررسی' | 'پاسخ داده‌شده' | 'بسته‌شده' = 'all';

  // Announcements management state
  let editingAnnouncement: Partial<ClubAnnouncement> | null = null;

  // Profile state
  let pendingAdminAvatar = state.admin.avatar_url || '/assets/manager-portrait.png';
  let adminProfileSavedBanner = '';

  // Blog management state
  let blogSearch = '';
  let blogPageMode: 'list' | 'editor' = 'list';
  let editingBlogPost: Partial<BlogPost> | null = null;

  // Comments management state
  let commentFilter: 'all' | 'تایید شده' | 'در انتظار تایید' | 'رد شده' = 'all';

  // Home settings banner
  let homeSettingsSavedBanner = '';

  // Parse initialSubPath if provided (e.g. /admin/blog/create, /admin/sessions/1)
  function applySubPath(tab: AdminTabKey, subPath?: string): void {
    activeTab = tab;
    managingSubSessionsForSessionId = null;
    managingSubSessionsForClassId = null;
    editingSubSession = null;
    isAddingSubSession = false;
    blogPageMode = 'list';

    if (!subPath) return;
    const parts = subPath.split('/').filter(Boolean);
    if (tab === 'sessions' && parts[0]) {
      const sid = Number(parts[0]);
      if (!Number.isNaN(sid) && state.sessions.some((s) => s.id === sid)) {
        managingSubSessionsForSessionId = sid;
      }
    } else if (tab === 'classes' && parts[0]) {
      const cid = Number(parts[0]);
      if (!Number.isNaN(cid) && state.classes.some((c) => c.id === cid)) {
        managingSubSessionsForClassId = cid;
      }
    } else if (tab === 'blog') {
      if (parts[0] === 'create') {
        blogPageMode = 'editor';
        editingBlogPost = {
          title: '',
          slug: '',
          category: 'یادداشت ادبی',
          author: `${state.admin.first_name} ${state.admin.last_name}`,
          published_date: '۱۴ آبان ۱۴۰۵',
          reading_time: '۶ دقیقه مطالعه',
          tags: 'ادبیات داستانی، نقد کتاب، بوک‌میت',
          status: 'منتشر شده',
          cover_url: state.gallery[0]?.url || '/assets/blog-1.png',
          excerpt: '',
          full_content: '',
        };
      } else if (parts[0] === 'edit' && parts[1]) {
        const bid = Number(parts[1]);
        const found = state.blogPosts.find((p) => p.id === bid);
        if (found) {
          blogPageMode = 'editor';
          editingBlogPost = { ...found };
        }
      }
    }
  }

  applySubPath(props.initialTab || 'dashboard', props.initialSubPath);

  function notifyRoute(): void {
    if (!props.onRouteChange) return;
    if (activeTab === 'sessions' && managingSubSessionsForSessionId !== null) {
      props.onRouteChange(`/admin/sessions/${managingSubSessionsForSessionId}`);
      return;
    }
    if (activeTab === 'classes' && managingSubSessionsForClassId !== null) {
      props.onRouteChange(`/admin/classes/${managingSubSessionsForClassId}`);
      return;
    }
    if (activeTab === 'blog' && blogPageMode === 'editor') {
      if (editingBlogPost?.id) {
        props.onRouteChange(`/admin/blog/edit/${editingBlogPost.id}`);
      } else {
        props.onRouteChange('/admin/blog/create');
      }
      return;
    }
    props.onRouteChange(`/admin/${activeTab}`);
  }

  const $wrapper = $(`
    <section
      aria-label="پنل مدیریت باشگاه کتابخوانی بوک‌میت"
      class="w-full max-w-[1440px] mx-auto px-5 sm:px-10 md:px-16 lg:px-20 pt-6 pb-20"
    ></section>
  `);

  function showToast(message: string, isError = false): void {
    const $existing = $wrapper.find('.js-admin-toast');
    $existing.remove();
    const $toast = $(`
      <div class="js-admin-toast fixed bottom-6 left-6 z-50 px-5 py-3.5 rounded-xl border shadow-[0_16px_36px_rgba(44,30,22,0.18)] text-[13.5px] font-medium flex items-center gap-2.5 transition-all duration-300 ${
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

  function askDeleteConfirmation(
    title: string,
    description: string,
    onConfirm: () => void,
    options?: { confirmLabel?: string; confirmTone?: 'danger' | 'success' }
  ): void {
    pendingDeleteConfirm = {
      title,
      description,
      confirmLabel: options?.confirmLabel,
      confirmTone: options?.confirmTone || 'danger',
      onConfirm,
    };
    render();
  }

  function getDefaultEnrolledMembers(status?: string): EnrollmentRecord[] {
    return [
      {
        id: 1,
        member_phone: '۰۹۱۲۳۴۵۶۷۸۹',
        member_name: 'پرنیا فرهمند',
        registered_at: '۸ آبان ۱۴۰۵',
        status: status === 'غیرفعال' ? 'غیرفعال' : 'فعال',
      },
      {
        id: 2,
        member_phone: '۰۹۳۵۴۴۴۵۵۶۶',
        member_name: 'مهسا تاجیک',
        registered_at: '۱۴ آبان ۱۴۰۵',
        status: 'غیرفعال',
      },
    ];
  }

  function renderEnrolledMembersBlock(params: {
    targetType: 'session' | 'class';
    targetId: number;
    targetTitle: string;
    members?: EnrollmentRecord[];
    fallbackStatus?: string;
  }): string {
    const list =
      Array.isArray(params.members) && params.members.length > 0
        ? params.members
        : getDefaultEnrolledMembers(params.fallbackStatus);

    return `
      <div class="mt-3 pt-3 border-t border-[#E2D2BE] space-y-2.5">
        <div class="flex items-center justify-between">
          <h4 class="text-[12.5px] font-bold text-[#231912] flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-[#5A3A22]"></span>
            <span>لیست اعضای ثبت‌نام‌شده (${toPersianDigits(list.length)} نفر)</span>
          </h4>
          <span class="text-[11px] text-[#6B5444]">تایید، لغو یا ارسال تیکت</span>
        </div>

        <div class="space-y-2 max-h-56 overflow-y-auto pl-1">
          ${list
            .map((m) => {
              const badgeClass =
                m.status === 'فعال'
                  ? 'bg-[#E4F2E7] text-[#235332] border-[#BBD9C2]'
                  : m.status === 'لغو شده'
                  ? 'bg-[#FBEAE8] text-[#9E3329] border-[#E6B8B3]'
                  : 'bg-[#FFF3CD] text-[#7A5A10] border-[#E5C77B]';

              const statusText =
                m.status === 'غیرفعال' ? 'غیرفعال (در انتظار تایید)' : m.status;

              return `
                <div class="p-2.5 rounded-xl bg-[#F4E9DA]/65 border border-[#DFCEB9] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div class="min-w-0 space-y-0.5">
                    <div class="flex items-center gap-2 flex-wrap">
                      <strong class="text-[12.5px] font-bold text-[#231912]">${toPersianDigits(m.member_name)}</strong>
                      <span class="text-[11px] text-[#6B5444]" dir="ltr">${toPersianDigits(m.member_phone)}</span>
                      <span class="px-2 py-0.5 rounded-md border text-[10.5px] font-semibold ${badgeClass}">
                        ${toPersianDigits(statusText)}
                      </span>
                    </div>
                    <div class="text-[10.5px] text-[#7A6352]">
                      تاریخ ثبت‌نام: ${toPersianDigits(m.registered_at)}
                    </div>
                  </div>

                  <div class="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      data-enroll-type="${params.targetType}"
                      data-enroll-id="${params.targetId}"
                      data-enroll-title="${params.targetTitle}"
                      data-member-phone="${m.member_phone}"
                      data-member-name="${m.member_name}"
                      class="js-admin-approve-enrollment px-2.5 py-1 rounded-lg bg-[#235332] hover:bg-[#193E25] text-[#FAF5EC] text-[11px] font-semibold cursor-pointer transition-colors ${
                        m.status === 'فعال' ? 'opacity-60' : ''
                      }"
                    >
                      تایید
                    </button>
                    <button
                      type="button"
                      data-enroll-type="${params.targetType}"
                      data-enroll-id="${params.targetId}"
                      data-enroll-title="${params.targetTitle}"
                      data-member-phone="${m.member_phone}"
                      data-member-name="${m.member_name}"
                      class="js-admin-cancel-enrollment px-2.5 py-1 rounded-lg border border-[#E0A9A3] bg-[#FBEAE8] hover:bg-[#F5D5D1] text-[#9E3329] text-[11px] font-semibold cursor-pointer transition-colors"
                    >
                      لغو
                    </button>
                    <button
                      type="button"
                      data-enroll-title="${params.targetTitle}"
                      data-member-phone="${m.member_phone}"
                      data-member-name="${m.member_name}"
                      class="js-admin-ticket-enrollment px-2.5 py-1 rounded-lg bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[11px] font-semibold cursor-pointer transition-colors"
                    >
                      ارسال تیکت
                    </button>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  // ==================== MODALS: CONFIRMATION, TICKET TO MEMBER & GALLERY PICKER ====================
  function renderModals(): string {
    let html = '';

    if (pendingDeleteConfirm) {
      const isSuccessTone = pendingDeleteConfirm.confirmTone === 'success';
      html += `
        <div class="js-admin-confirm-backdrop fixed inset-0 z-50 bg-[#1B120C]/65 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div class="w-full max-w-[440px] rounded-2xl bg-[#FAF5EC] border-2 border-[#DEC8AC] shadow-[0_24px_60px_rgba(27,18,12,0.35)] p-6 space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl ${
                isSuccessTone
                  ? 'bg-[#E4F2E7] text-[#235332]'
                  : 'bg-[#FBEAE8] text-[#9E3329]'
              } flex items-center justify-center font-bold text-[18px] shrink-0">
                ${isSuccessTone ? '✓' : '!'}
              </div>
              <h3 class="font-display text-[17.5px] font-bold text-[#231912]">
                ${toPersianDigits(pendingDeleteConfirm.title)}
              </h3>
            </div>
            <p class="text-[13.5px] text-[#4E3B2D] leading-[1.85] text-justify">
              ${toPersianDigits(pendingDeleteConfirm.description)}
            </p>
            <div class="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                class="js-admin-cancel-delete-modal px-4 py-2 rounded-xl border border-[#C5B198] text-[#4E3B2D] hover:bg-[#EFE3D2] text-[12.5px] font-semibold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                class="js-admin-confirm-delete-modal px-5 py-2 rounded-xl ${
                  isSuccessTone
                    ? 'bg-[#235332] hover:bg-[#193E25]'
                    : 'bg-[#9E3329] hover:bg-[#7E261E]'
                } text-[#FAF5EC] text-[12.5px] font-semibold cursor-pointer"
              >
                ${toPersianDigits(pendingDeleteConfirm.confirmLabel || 'بله، حذف شود')}
              </button>
            </div>
          </div>
        </div>
      `;
    }

    if (ticketTargetEnrollment) {
      html += `
        <div class="js-admin-member-ticket-backdrop fixed inset-0 z-50 bg-[#1B120C]/65 backdrop-blur-[2px] flex items-center justify-center p-4">
          <form class="js-admin-member-ticket-form w-full max-w-[500px] rounded-2xl bg-[#FAF5EC] border-2 border-[#DEC8AC] shadow-[0_24px_60px_rgba(27,18,12,0.35)] p-6 space-y-4">
            <div class="flex items-center justify-between border-b border-[#E5D7C5] pb-3">
              <div>
                <h3 class="font-display text-[17.5px] font-bold text-[#231912]">
                  ارسال تیکت به ${toPersianDigits(ticketTargetEnrollment.member_name)}
                </h3>
                <p class="text-[11.5px] text-[#6B5444] mt-0.5">
                  شماره تماس: ${toPersianDigits(ticketTargetEnrollment.member_phone)} · مربوط به: ${toPersianDigits(ticketTargetEnrollment.course_or_session_title)}
                </p>
              </div>
              <button
                type="button"
                class="js-admin-close-member-ticket px-2.5 py-1 rounded-lg text-[#4E3B2D] hover:bg-[#EFE3D2] text-[13px] font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div class="space-y-3">
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">موضوع تیکت *</label>
                <input
                  type="text"
                  name="ticket_subject"
                  required
                  value="${toPersianDigits(`وضعیت ثبت‌نام در «${ticketTargetEnrollment.course_or_session_title}»`)}"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]"
                />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">بخش مربوطه</label>
                  <select name="ticket_department" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[12.5px] text-[#231912]">
                    <option value="امور ثبت‌نام و دوره‌ها">امور ثبت‌نام و دوره‌ها</option>
                    <option value="پشتیبانی فنی">پشتیبانی فنی</option>
                    <option value="امور مالی و شهریه">امور مالی و شهریه</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">اولویت</label>
                  <select name="ticket_priority" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[12.5px] text-[#231912]">
                    <option value="مهم">مهم</option>
                    <option value="عادی">عادی</option>
                    <option value="فوری">فوری</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">متن پیام تیکت برای این مخاطب *</label>
                <textarea
                  name="ticket_message"
                  rows="4"
                  required
                  placeholder="متن پیام یا راهنمایی جهت تکمیل و تایید ثبت‌نام را بنویسید..."
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] leading-[1.8]"
                >هم‌خوان گرامی، درخواست ثبت‌نام شما در «${toPersianDigits(ticketTargetEnrollment.course_or_session_title)}» بررسی شد. لطفاً جهت هماهنگی نهایی پاسخ خود را در همین تیکت ثبت فرمایید.</textarea>
              </div>
            </div>

            <div class="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                class="js-admin-close-member-ticket px-4 py-2 rounded-xl border border-[#C5B198] text-[#4E3B2D] hover:bg-[#EFE3D2] text-[12.5px] font-semibold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                class="px-5 py-2 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[12.5px] font-semibold cursor-pointer"
              >
                ارسال تیکت به مخاطب
              </button>
            </div>
          </form>
        </div>
      `;
    }

    if (galleryPickerTarget) {
      html += `
        <div class="js-admin-gallery-picker-backdrop fixed inset-0 z-50 bg-[#1B120C]/65 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div class="w-full max-w-[780px] max-h-[85vh] rounded-2xl bg-[#FAF5EC] border-2 border-[#DEC8AC] shadow-[0_24px_60px_rgba(27,18,12,0.35)] flex flex-col overflow-hidden">
            <div class="px-6 py-4 border-b border-[#E5D7C5] flex items-center justify-between">
              <div>
                <h3 class="font-display text-[18px] font-bold text-[#231912]">انتخاب تصویر از گالری تصاویر</h3>
                <p class="text-[12px] text-[#6B5444] mt-0.5">بر روی تصویر مورد نظر کلیک کنید تا به عنوان تصویر کاور انتخاب شود.</p>
              </div>
              <button
                type="button"
                class="js-admin-close-gallery-picker px-3 py-1.5 rounded-xl text-[#4E3B2D] hover:bg-[#EFE3D2] text-[13px] font-semibold cursor-pointer"
              >
                بستن ✕
              </button>
            </div>
            <div class="p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              ${state.gallery
                .map(
                  (img) => `
                <button
                  type="button"
                  data-pick-image-url="${img.url}"
                  class="js-admin-pick-gallery-item group rounded-xl bg-[#F4E9DA]/60 border-2 border-[#E2D2BE] hover:border-[#5A3A22] overflow-hidden text-right transition-all cursor-pointer flex flex-col"
                >
                  <div class="h-32 w-full bg-[#EFE3D2] overflow-hidden">
                    <img src="${img.url}" alt="${img.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div class="p-2.5">
                    <div class="text-[12px] font-bold text-[#231912] truncate">${toPersianDigits(img.title)}</div>
                    <div class="text-[10.5px] text-[#6B5444] mt-0.5">${toPersianDigits(img.category)}</div>
                  </div>
                </button>
              `
                )
                .join('')}
            </div>
          </div>
        </div>
      `;
    }

    if (notifyTargetUser) {
      html += `
        <div class="js-admin-user-notify-backdrop fixed inset-0 z-50 bg-[#1B120C]/65 backdrop-blur-[2px] flex items-center justify-center p-4">
          <form class="js-admin-user-notify-form w-full max-w-[480px] rounded-2xl bg-[#FAF5EC] border-2 border-[#DEC8AC] shadow-[0_24px_60px_rgba(27,18,12,0.35)] p-6 space-y-4">
            <div class="flex items-center justify-between border-b border-[#E5D7C5] pb-3">
              <div>
                <h3 class="font-display text-[17.5px] font-bold text-[#231912]">
                  ارسال اطلاعیه شخصی به ${notifyTargetUser.first_name} ${notifyTargetUser.last_name}
                </h3>
                <p class="text-[11.5px] text-[#6B5444] mt-0.5">
                  این اطلاعیه فقط برای شماره ${toPersianDigits(notifyTargetUser.phone)} ارسال و نمایش داده می‌شود.
                </p>
              </div>
              <button
                type="button"
                class="js-admin-close-user-notify px-2.5 py-1 rounded-lg text-[#4E3B2D] hover:bg-[#EFE3D2] text-[13px] font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div class="space-y-3">
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">عنوان اطلاعیه *</label>
                <input
                  type="text"
                  name="notify_title"
                  required
                  placeholder="مثلاً: یادآوری جلسه هم‌خوانی فردا"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]"
                />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">متن کامل پیام و اطلاعیه *</label>
                <textarea
                  name="notify_content"
                  rows="4"
                  required
                  placeholder="متن پیام اختصاصی برای این عضو را بنویسید..."
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] leading-[1.8]"
                ></textarea>
              </div>
            </div>
            <div class="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                class="js-admin-close-user-notify px-4 py-2 rounded-xl border border-[#C5B198] text-[#4E3B2D] hover:bg-[#EFE3D2] text-[12.5px] font-semibold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                class="px-5 py-2 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[12.5px] font-semibold cursor-pointer"
              >
                ارسال اطلاعیه به کاربر
              </button>
            </div>
          </form>
        </div>
      `;
    }

    if (resetPasswordTargetUser) {
      html += `
        <div class="js-admin-reset-pass-backdrop fixed inset-0 z-50 bg-[#1B120C]/65 backdrop-blur-[2px] flex items-center justify-center p-4">
          <form class="js-admin-reset-pass-form w-full max-w-[420px] rounded-2xl bg-[#FAF5EC] border-2 border-[#DEC8AC] shadow-[0_24px_60px_rgba(27,18,12,0.35)] p-6 space-y-4">
            <div class="flex items-center justify-between border-b border-[#E5D7C5] pb-3">
              <div>
                <h3 class="font-display text-[17px] font-bold text-[#231912]">
                  ریست رمز عبور کاربر
                </h3>
                <p class="text-[11.5px] text-[#6B5444] mt-0.5">
                  کاربر: ${resetPasswordTargetUser.first_name} ${resetPasswordTargetUser.last_name} (${toPersianDigits(resetPasswordTargetUser.phone)})
                </p>
              </div>
              <button
                type="button"
                class="js-admin-close-reset-pass px-2.5 py-1 rounded-lg text-[#4E3B2D] hover:bg-[#EFE3D2] text-[13px] font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div>
              <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">رمز عبور جدید کاربر *</label>
              <input
                type="text"
                name="new_user_password"
                dir="ltr"
                required
                value="1234"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13.5px] font-mono text-[#231912] text-left"
              />
              <span class="block text-[11px] text-[#6B5444] mt-1">رمز پیش‌فرض ریست: 1234 (قابل تغییر توسط شما)</span>
            </div>
            <div class="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                class="js-admin-close-reset-pass px-4 py-2 rounded-xl border border-[#C5B198] text-[#4E3B2D] hover:bg-[#EFE3D2] text-[12.5px] font-semibold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                class="px-5 py-2 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[12.5px] font-semibold cursor-pointer"
              >
                تایید و ریست رمز عبور
              </button>
            </div>
          </form>
        </div>
      `;
    }

    if (isBlogCategoryModalOpen) {
      html += `
        <div class="js-admin-blog-cat-backdrop fixed inset-0 z-50 bg-[#1B120C]/65 backdrop-blur-[2px] flex items-center justify-center p-4">
          <form class="js-admin-blog-cat-form w-full max-w-[440px] rounded-2xl bg-[#FAF5EC] border-2 border-[#DEC8AC] shadow-[0_24px_60px_rgba(27,18,12,0.35)] p-6 space-y-4">
            <div class="flex items-center justify-between border-b border-[#E5D7C5] pb-3">
              <div>
                <h3 class="font-display text-[17.5px] font-bold text-[#231912]">ایجاد دسته‌بندی جدید مقالات</h3>
                <p class="text-[11.5px] text-[#6B5444] mt-0.5">عنوان دسته‌بندی جدید را وارد کنید تا به لیست دسته‌بندی‌ها اضافه شود.</p>
              </div>
              <button
                type="button"
                class="js-admin-close-blog-cat-modal px-2.5 py-1 rounded-lg text-[#4E3B2D] hover:bg-[#EFE3D2] text-[13px] font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div>
              <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">عنوان دسته‌بندی جدید *</label>
              <input
                type="text"
                name="new_blog_category"
                required
                placeholder="مثلاً: فلسفه و اندیشه"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]"
              />
            </div>
            <div class="space-y-1.5">
              <span class="block text-[11.5px] font-semibold text-[#6B5444]">دسته‌بندی‌های فعلی:</span>
              <div class="flex flex-wrap gap-1.5">
                ${blogCategories
                  .map(
                    (c) =>
                      `<span class="px-2.5 py-1 rounded-lg bg-[#EFE3D2] text-[#4E3B2D] text-[11.5px] font-medium">${toPersianDigits(c)}</span>`
                  )
                  .join('')}
              </div>
            </div>
            <div class="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                class="js-admin-close-blog-cat-modal px-4 py-2 rounded-xl border border-[#C5B198] text-[#4E3B2D] hover:bg-[#EFE3D2] text-[12.5px] font-semibold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                class="px-5 py-2 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[12.5px] font-semibold cursor-pointer"
              >
                افزودن دسته‌بندی
              </button>
            </div>
          </form>
        </div>
      `;
    }

    return html;
  }

  // ==================== 1. DASHBOARD TAB ====================
  function renderDashboardTab(): string {
    const pendingTickets = state.tickets.filter((t) => t.status === 'در انتظار بررسی').length;
    const pendingComments = state.comments.filter((c) => c.status === 'در انتظار تایید').length;

    return `
      <div class="space-y-6">
        <div class="px-5 py-3.5 rounded-2xl bg-gradient-to-l from-[#EFE3D1] via-[#F5ECDE] to-[#FAF5EC] border border-[#E2D3BF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 class="font-display text-[18px] sm:text-[20px] font-bold text-[#231912]">
            ${state.admin.first_name} ${state.admin.last_name} عزیز، به پنل مدیریت باشگاه خوش آمدید
          </h2>
          <div class="inline-flex items-center gap-3 bg-[#FAF5EC] px-3.5 py-1.5 rounded-xl border border-[#DFCEB9] text-[12px] shrink-0 self-start sm:self-auto">
            <span class="text-[#7A6352]">سطح دسترسی: <strong class="font-bold text-[#235332]">مدیر کل باشگاه</strong></span>
            <span class="text-[#D5C3AE]">|</span>
            <span class="text-[#6E5644]">شناسه ورود: <strong dir="ltr" class="font-mono text-[#231912]">admin</strong></span>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <div data-admin-switch="sessions" class="js-admin-switch-tab p-4 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] hover:border-[#8B5A36] transition-colors cursor-pointer">
            <span class="text-[11.5px] text-[#7A6250] block mb-1">دوره‌ها و جلسات</span>
            <div class="font-display text-[26px] font-bold text-[#231912]">${toPersianDigits(state.sessions.length)}</div>
            <span class="text-[11px] text-[#5E7A65]">مدیریت جلسات ←</span>
          </div>

          <div data-admin-switch="classes" class="js-admin-switch-tab p-4 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] hover:border-[#8B5A36] transition-colors cursor-pointer">
            <span class="text-[11.5px] text-[#7A6250] block mb-1">کلاس‌های آموزشی</span>
            <div class="font-display text-[26px] font-bold text-[#231912]">${toPersianDigits(state.classes.length)}</div>
            <span class="text-[11px] text-[#5E7A65]">مدیریت کلاس‌ها ←</span>
          </div>

          <div data-admin-switch="users" class="js-admin-switch-tab p-4 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] hover:border-[#8B5A36] transition-colors cursor-pointer">
            <span class="text-[11.5px] text-[#7A6250] block mb-1">کاربران عضو</span>
            <div class="font-display text-[26px] font-bold text-[#231912]">${toPersianDigits(state.users.length)}</div>
            <span class="text-[11px] text-[#7A4B2A]">مدیریت کاربران ←</span>
          </div>

          <div data-admin-switch="tickets" class="js-admin-switch-tab p-4 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] hover:border-[#8B5A36] transition-colors cursor-pointer">
            <span class="text-[11.5px] text-[#7A6250] block mb-1">تیکت‌های دریافتی</span>
            <div class="font-display text-[26px] font-bold text-[#231912]">${toPersianDigits(state.tickets.length)}</div>
            <span class="text-[11px] text-[#9E3329]">${toPersianDigits(pendingTickets)} در انتظار بررسی</span>
          </div>

          <div data-admin-switch="blog" class="js-admin-switch-tab p-4 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] hover:border-[#8B5A36] transition-colors cursor-pointer">
            <span class="text-[11.5px] text-[#7A6250] block mb-1">مقالات وبلاگ</span>
            <div class="font-display text-[26px] font-bold text-[#231912]">${toPersianDigits(state.blogPosts.length)}</div>
            <span class="text-[11px] text-[#6B5444]">مدیریت وبلاگ ←</span>
          </div>

          <div data-admin-switch="gallery" class="js-admin-switch-tab p-4 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] hover:border-[#8B5A36] transition-colors cursor-pointer">
            <span class="text-[11.5px] text-[#7A6250] block mb-1">گالری تصاویر</span>
            <div class="font-display text-[26px] font-bold text-[#231912]">${toPersianDigits(state.gallery.length)}</div>
            <span class="text-[11px] text-[#7A5A10]">مدیریت گالری ←</span>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="p-6 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-display text-[17px] font-bold text-[#231912]">آخرین تیکت‌های کاربران</h3>
              <button type="button" data-admin-switch="tickets" class="js-admin-switch-tab text-[12px] font-semibold text-[#7A4B2A] hover:text-[#231912] cursor-pointer">
                مشاهده همه تیکت‌ها ←
              </button>
            </div>
            <div class="space-y-3">
              ${state.tickets
                .slice(0, 3)
                .map(
                  (t) => `
                <div class="p-3.5 rounded-xl bg-[#F4E9DA]/60 border border-[#E5D6C3] flex items-center justify-between gap-3">
                  <div class="min-w-0">
                    <div class="text-[13px] font-bold text-[#231912] truncate">${toPersianDigits(t.subject)}</div>
                    <div class="text-[11.5px] text-[#6B5444] mt-0.5">${toPersianDigits(t.department)} · شماره: ${toPersianDigits(t.member_phone)}</div>
                  </div>
                  <span class="px-2.5 py-1 rounded-md text-[11px] font-semibold shrink-0 ${
                    t.status === 'پاسخ داده‌شده'
                      ? 'bg-[#E4F2E7] text-[#235332]'
                      : 'bg-[#FFF3CD] text-[#7A5A10]'
                  }">${toPersianDigits(t.status)}</span>
                </div>
              `
                )
                .join('')}
            </div>
          </div>

          <div class="p-6 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-display text-[17px] font-bold text-[#231912]">آخرین نظرات ثبت‌شده</h3>
              <button type="button" data-admin-switch="comments" class="js-admin-switch-tab text-[12px] font-semibold text-[#7A4B2A] hover:text-[#231912] cursor-pointer">
                مدیریت نظرات ←
              </button>
            </div>
            <div class="space-y-3">
              ${state.comments
                .slice(0, 3)
                .map(
                  (c) => `
                <div class="p-3.5 rounded-xl bg-[#F4E9DA]/60 border border-[#E5D6C3] space-y-1">
                  <div class="flex items-center justify-between gap-2">
                    <strong class="text-[13px] text-[#231912]">${toPersianDigits(c.author_name)}</strong>
                    <span class="px-2 py-0.5 rounded-md text-[10.5px] font-semibold ${
                      c.status === 'تایید شده'
                        ? 'bg-[#E4F2E7] text-[#235332]'
                        : c.status === 'در انتظار تایید'
                        ? 'bg-[#FFF3CD] text-[#7A5A10]'
                        : 'bg-[#FBEAE8] text-[#9E3329]'
                    }">${toPersianDigits(c.status)}</span>
                  </div>
                  <p class="text-[12px] text-[#5B4739] truncate">${toPersianDigits(c.comment_text)}</p>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==================== 1.5 GALLERY TAB ====================
  function renderGalleryTab(): string {
    const q = gallerySearch.trim().toLowerCase();
    const filteredGallery = state.gallery.filter((g) => {
      if (galleryCategoryFilter !== 'all' && g.category !== galleryCategoryFilter) {
        return false;
      }
      if (!q) return true;
      return `${g.title} ${g.category}`.toLowerCase().includes(q);
    });

    return `
      <div class="space-y-6">
        <div>
          <h2 class="font-display text-[20px] sm:text-[23px] font-bold text-[#231912]">گالری تصاویر باشگاه</h2>
          <p class="text-[13.5px] text-[#6B5444] mt-1">
            بارگذاری و مدیریت تصاویر کاور کتاب‌ها، دوره‌های هم‌خوانی، کلاس‌های آموزشی و مقالات وبلاگ.
          </p>
        </div>

        <!-- Add Image to Gallery Form (Single-line compact buttons, no category field) -->
        <form class="js-admin-gallery-form p-5 rounded-2xl bg-[#FAF5EC] border border-[#DFCEB9] space-y-3.5">
          <h3 class="font-display text-[16px] font-bold text-[#231912]">+ افزودن تصویر جدید به گالری</h3>
          <div class="flex flex-col sm:flex-row sm:items-end gap-3">
            <div class="flex-1 min-w-0">
              <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">عنوان تصویر *</label>
              <input
                type="text"
                name="title"
                required
                placeholder="مثلاً: کاور کتاب بلندی‌های بادگیر"
                class="w-full h-10 px-3.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]"
              />
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <input type="file" accept="image/*" class="js-admin-gallery-file-input hidden" />
              <button
                type="button"
                class="js-admin-trigger-gallery-file h-10 px-3.5 rounded-xl bg-[#F3E7D6] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[12px] font-semibold text-[#3F2E21] whitespace-nowrap cursor-pointer"
              >
                انتخاب فایل
              </button>
              <button
                type="submit"
                class="h-10 px-4 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[12px] font-semibold whitespace-nowrap cursor-pointer"
              >
                ثبت در گالری
              </button>
            </div>
          </div>
          ${
            newGalleryImageUrl
              ? `
            <div class="flex items-center gap-3 pt-1">
              <img src="${newGalleryImageUrl}" alt="پیش‌نمایش" class="w-14 h-14 rounded-xl object-cover border border-[#DFCEB9]" />
              <span class="text-[12px] text-[#235332] font-semibold">✓ فایل تصویر آماده ثبت در گالری است.</span>
            </div>
          `
              : ''
          }
        </form>

        <!-- Search with Filters Underneath -->
        <div class="p-4 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] space-y-3">
          <input
            type="text"
            value="${toPersianDigits(gallerySearch)}"
            placeholder="جستجو در عنوان تصاویر گالری..."
            class="js-admin-gallery-search w-full px-4 py-2.5 rounded-xl bg-[#F4E9DA]/65 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
          />
          <div class="flex flex-wrap items-center gap-2">
            ${['all', 'کاور کتاب', 'وبلاگ و کلاس‌ها', 'تصاویر باشگاه']
              .map(
                (cat) => `
              <button
                type="button"
                data-gallery-cat="${cat}"
                class="js-admin-gallery-cat min-w-[115px] h-8 px-3 rounded-lg text-[12px] font-semibold inline-flex items-center justify-center cursor-pointer transition-colors ${
                  galleryCategoryFilter === cat
                    ? 'bg-[#5A3A22] text-[#FAF5EC]'
                    : 'bg-[#F4E9DA]/70 border border-[#DFCEB9] text-[#4E3B2D]'
                }"
              >
                ${cat === 'all' ? 'همه تصاویر' : cat}
              </button>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Gallery Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          ${filteredGallery
            .map(
              (item) => `
            <div class="rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] overflow-hidden flex flex-col justify-between">
              <div>
                <div class="h-44 bg-[#EFE3D2] relative overflow-hidden">
                  <img src="${item.url}" alt="${item.title}" class="w-full h-full object-cover" />
                </div>
                <div class="p-3.5">
                  <h4 class="font-bold text-[13.5px] text-[#231912] truncate">${toPersianDigits(item.title)}</h4>
                  <span class="text-[11px] text-[#6B5444] block mt-0.5">${toPersianDigits(item.created_at)}</span>
                </div>
              </div>
              <div class="px-3.5 pb-3.5 pt-2 border-t border-[#E6D8C5] flex justify-end">
                <button
                  type="button"
                  data-delete-gallery="${item.id}"
                  class="js-admin-delete-gallery px-3 py-1.5 rounded-lg border border-[#E6B8B3] text-[#9E3329] hover:bg-[#FBEAE8] text-[11.5px] font-semibold cursor-pointer"
                >
                  حذف تصویر
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

  // ==================== 2. SESSIONS MANAGEMENT TAB ====================
  function renderSessionsTab(): string {
    if (managingSubSessionsForSessionId !== null) {
      const parentSession = state.sessions.find(
        (s) => s.id === managingSubSessionsForSessionId
      );
      if (parentSession) {
        return renderManageSubSessionsView({
          parentType: 'session',
          parentId: parentSession.id,
          parentTitle: parentSession.title,
          subSessions: parentSession.sub_sessions || [],
        });
      }
    }

    const q = sessionSearch.trim().toLowerCase();
    const filtered = state.sessions.filter((s) => {
      const normStatus = normalizeCourseStatus(s.status);
      if (sessionStatusFilter !== 'all' && normStatus !== sessionStatusFilter) {
        return false;
      }
      if (!q) return true;
      return `${s.title} ${s.book_title} ${s.book_author || ''} ${s.publisher || ''} ${s.mentor_name}`
        .toLowerCase()
        .includes(q);
    });

    return `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="font-display text-[20px] sm:text-[23px] font-bold text-[#231912]">مدیریت جلسات باشگاه</h2>
            <p class="text-[13.5px] text-[#6B5444] mt-1 text-justify">
              ایجاد دوره هم‌خوانی جدید، ویرایش اطلاعات کتاب و دوره و مدیریت کارت‌های جلسات هر دوره در دیتابیس.
            </p>
          </div>
          <button
            type="button"
            class="js-admin-new-session-btn px-5 py-2.5 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[13px] font-semibold transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            + افزودن دوره هم‌خوانی جدید
          </button>
        </div>

        ${
          editingSession
            ? `
          <form class="js-admin-session-form p-6 rounded-2xl bg-[#FAF5EC] border-2 border-[#C8AF8F] space-y-4">
            <h3 class="font-display text-[17px] font-bold text-[#231912]">
              ${editingSession.id ? 'ویرایش دوره هم‌خوانی' : 'افزودن دوره هم‌خوانی جدید'}
            </h3>
            <input type="hidden" name="id" value="${editingSession.id || ''}" />
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div class="sm:col-span-2">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">عنوان دوره هم‌خوانی *</label>
                <input type="text" name="title" required value="${editingSession.title || ''}" placeholder="مثلاً: حلقه هم‌خوانی صد سال تنهایی" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">وضعیت دوره *</label>
                <select name="status" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]">
                  <option value="فعال" ${normalizeCourseStatus(editingSession.status) === 'فعال' ? 'selected' : ''}>فعال</option>
                  <option value="غیرفعال" ${normalizeCourseStatus(editingSession.status) === 'غیرفعال' ? 'selected' : ''}>غیرفعال</option>
                </select>
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">نام کتاب *</label>
                <input type="text" name="book_title" required value="${editingSession.book_title || ''}" placeholder="مثلاً: صد سال تنهایی" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">نام نویسنده *</label>
                <input type="text" name="book_author" required value="${editingSession.book_author || ''}" placeholder="مثلاً: گابریل گارسیا مارکز" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">تعداد صفحات *</label>
                <input type="number" name="pages_count" required value="${editingSession.pages_count || 320}" placeholder="۴۶۸" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">انتشارات *</label>
                <input type="text" name="publisher" required value="${editingSession.publisher || ''}" placeholder="مثلاً: نشر نیلوفر" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">نام تسهیل‌گر *</label>
                <input type="text" name="mentor_name" required value="${editingSession.mentor_name || 'دکتر سهراب رستگار'}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">روز و تاریخ برگزاری</label>
                <input type="text" name="session_date" value="${editingSession.session_date || 'چهارشنبه‌ها · آذر ۱۴۰۵'}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">ساعت برگزاری</label>
                <input type="text" name="session_time" value="${editingSession.session_time || 'ساعت ۱۸:۰۰ تا ۲۰:۰۰'}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]" />
              </div>
              <div class="sm:col-span-2">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">تصویر کاور دوره (انتخاب از گالری تصاویر)</label>
                <input type="hidden" name="cover_url" value="${editingSession.cover_url || '/assets/book-current.png'}" />
                <div class="flex items-center gap-3 p-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9]">
                  <img src="${editingSession.cover_url || '/assets/book-current.png'}" alt="کاور دوره" class="w-14 h-14 rounded-lg object-cover border border-[#D5C3AE] shrink-0" />
                  <div class="flex-1 min-w-0">
                    <div class="text-[12px] font-semibold text-[#231912] truncate">تصویر انتخاب‌شده از گالری</div>
                    <div dir="ltr" class="text-[11px] text-[#6B5444] truncate text-left">${editingSession.cover_url || '/assets/book-current.png'}</div>
                  </div>
                  <button
                    type="button"
                    data-gallery-target="session"
                    class="js-admin-open-gallery-picker px-3.5 py-2 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[12px] font-semibold cursor-pointer shrink-0"
                  >
                    انتخاب از گالری تصاویر
                  </button>
                </div>
              </div>
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" class="js-admin-cancel-session px-4 py-2 rounded-xl border border-[#C5B198] text-[12.5px] font-semibold text-[#4E3B2D] cursor-pointer">انصراف</button>
              <button type="submit" class="px-5 py-2 rounded-xl bg-[#5A3A22] text-[#FAF5EC] text-[13px] font-semibold cursor-pointer">ذخیره در دیتابیس</button>
            </div>
          </form>
        `
            : ''
        }

        <!-- Search and Equal-Sized Compact Active/Inactive Filter -->
        <div class="p-4 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <input
            type="text"
            value="${toPersianDigits(sessionSearch)}"
            placeholder="جستجو در عنوان دوره، نام کتاب، نویسنده یا تسهیل‌گر..."
            class="js-admin-session-search flex-1 px-4 py-2 rounded-xl bg-[#F4E9DA]/65 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
          />
          <div class="flex items-center gap-2 shrink-0">
            ${(
              [
                { key: 'all', label: 'همه دوره‌ها' },
                { key: 'فعال', label: 'فعال' },
                { key: 'غیرفعال', label: 'غیرفعال' },
              ] as const
            )
              .map(
                (f) => `
              <button
                type="button"
                data-session-filter="${f.key}"
                class="js-admin-session-filter w-[104px] h-8 rounded-lg text-[12px] font-semibold inline-flex items-center justify-center cursor-pointer transition-colors ${
                  sessionStatusFilter === f.key
                    ? 'bg-[#5A3A22] text-[#FAF5EC]'
                    : 'bg-[#F4E9DA]/70 border border-[#DFCEB9] text-[#4E3B2D]'
                }"
              >
                ${f.label}
              </button>
            `
              )
              .join('')}
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          ${filtered
            .map((s) => {
              const normStatus = normalizeCourseStatus(s.status);
              return `
            <article class="rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] overflow-hidden flex flex-col justify-between">
              <div>
                <div class="relative h-40 bg-[#EFE3D2]">
                  <img src="${s.cover_url || '/assets/book-current.png'}" alt="${s.title}" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 bg-gradient-to-t from-[#1E140E]/75 via-transparent to-transparent"></div>
                  <div class="absolute bottom-3 right-4 left-4 flex items-center justify-between text-[#FAF5EC] text-[11.5px] font-semibold">
                    <span class="px-2.5 py-1 rounded-lg ${
                      normStatus === 'فعال' ? 'bg-[#235332]/90' : 'bg-[#7A5A10]/90'
                    }">${normStatus}</span>
                    <span class="px-2.5 py-1 rounded-lg bg-[#1E140E]/65">${toPersianDigits((s.sub_sessions || []).length)} زیرجلسه</span>
                  </div>
                </div>
                <div class="p-5 space-y-2.5">
                  <h3 class="font-display text-[16.5px] font-bold text-[#231912] truncate">${toPersianDigits(s.title)}</h3>
                  <div class="text-[12.5px] text-[#5B4739] grid grid-cols-2 gap-y-1.5 gap-x-3">
                    <div>نام کتاب: <strong class="text-[#231912]">${toPersianDigits(s.book_title)}</strong></div>
                    <div>نویسنده: <strong class="text-[#231912]">${toPersianDigits(s.book_author || '—')}</strong></div>
                    <div>تعداد صفحات: <strong class="text-[#231912]">${toPersianDigits(s.pages_count || 320)} صفحه</strong></div>
                    <div>انتشارات: <strong class="text-[#231912]">${toPersianDigits(s.publisher || '—')}</strong></div>
                    <div>تسهیل‌گر: <strong class="text-[#231912]">${toPersianDigits(s.mentor_name)}</strong></div>
                    <div>زمان: <strong class="text-[#231912]">${toPersianDigits(s.session_date)}</strong></div>
                  </div>
                  ${renderEnrolledMembersBlock({
                    targetType: 'session',
                    targetId: s.id,
                    targetTitle: s.title,
                    members: s.enrolled_members,
                    fallbackStatus: s.status,
                  })}
                </div>
              </div>
              <div class="px-5 pb-5 pt-3 border-t border-[#E6D8C5] flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  data-manage-session-subs="${s.id}"
                  class="js-admin-manage-session-subs px-3.5 py-2 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[12px] font-semibold cursor-pointer"
                >
                  صفحه جلسات دوره (${toPersianDigits((s.sub_sessions || []).length)})
                </button>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    data-edit-session="${s.id}"
                    class="js-admin-edit-session px-3 py-2 rounded-xl bg-[#F3E7D6] hover:bg-[#E5D4BC] text-[#3F2E21] text-[12px] font-semibold cursor-pointer"
                  >
                    ویرایش
                  </button>
                  <button
                    type="button"
                    data-delete-session="${s.id}"
                    class="js-admin-delete-session px-3 py-2 rounded-xl border border-[#E6B8B3] text-[#9E3329] hover:bg-[#FBEAE8] text-[12px] font-semibold cursor-pointer"
                  >
                    حذف
                  </button>
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

  // ==================== SHARED SUB-SESSIONS PAGE (FOR SESSIONS & CLASSES) ====================
  function renderManageSubSessionsView(params: {
    parentType: 'session' | 'class';
    parentId: number;
    parentTitle: string;
    subSessions: SessionSubItem[];
  }): string {
    const subBeingEdited = editingSubSession;
    const showSubForm = isAddingSubSession || subBeingEdited !== null;

    const q = subSessionSearch.trim().toLowerCase();
    const filteredSubs = params.subSessions.filter((sub) => {
      const displayStatus = normalizeSubSessionStatus(sub.status);
      if (subSessionStatusFilter !== 'all' && displayStatus !== subSessionStatusFilter) {
        return false;
      }
      if (!q) return true;
      return `${sub.session_number} ${sub.title} ${sub.session_date} ${sub.pages_to_read || ''}`
        .toLowerCase()
        .includes(q);
    });

    return `
      <div class="space-y-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="font-display text-[19px] sm:text-[21px] font-bold text-[#231912]">
              صفحه جلسات: ${toPersianDigits(params.parentTitle)}
            </h2>
            <p class="text-[13px] text-[#6B5444] mt-1">
              کارت‌های جلسات آتی و برگزار شده این دوره را جستجو، فیلتر، اضافه، ویرایش یا حذف نمایید.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="js-admin-open-add-subsession px-4 py-2 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[12.5px] font-semibold cursor-pointer"
            >
              + افزودن کارت جلسه جدید
            </button>
            <button
              type="button"
              class="js-admin-close-subs-view px-4 py-2 rounded-xl bg-[#F3E7D6] hover:bg-[#E5D4BC] text-[#3F2E21] text-[12.5px] font-semibold cursor-pointer"
            >
              → بازگشت به لیست
            </button>
          </div>
        </div>

        ${
          showSubForm
            ? `
        <!-- Add / Edit Sub-Session Card Form -->
        <form
          data-parent-type="${params.parentType}"
          data-parent-id="${params.parentId}"
          class="js-admin-add-subsession-form p-5 rounded-2xl bg-[#FAF5EC] border-2 border-[#DFCEB9] space-y-4"
        >
          <div class="flex items-center justify-between">
            <h3 class="font-display text-[16px] font-bold text-[#231912]">
              ${subBeingEdited ? `ویرایش کارت جلسه (${toPersianDigits(subBeingEdited.session_number)})` : '+ افزودن کارت جلسه جدید'}
            </h3>
            <button type="button" class="js-admin-cancel-subsession-edit text-[12px] font-semibold text-[#9E3329] cursor-pointer">
              بستن فرم ✕
            </button>
          </div>
          <input type="hidden" name="sub_id" value="${subBeingEdited?.id || ''}" />
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div>
              <label class="block text-[11.5px] font-semibold text-[#4E3B2D] mb-1">شماره جلسه *</label>
              <input
                type="text"
                name="session_number"
                required
                value="${subBeingEdited?.session_number || ''}"
                placeholder="مثلاً: جلسه ششم"
                class="w-full px-3 py-2 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[12.5px]"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[11.5px] font-semibold text-[#4E3B2D] mb-1">عنوان جلسه *</label>
              <input
                type="text"
                name="title"
                required
                value="${subBeingEdited?.title || ''}"
                placeholder="عنوان مبحث این نشست..."
                class="w-full px-3 py-2 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[12.5px]"
              />
            </div>
            <div>
              <label class="block text-[11.5px] font-semibold text-[#4E3B2D] mb-1">وضعیت *</label>
              <select
                name="status"
                class="w-full px-3 py-2 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[12.5px]"
              >
                <option value="جلسه آتی" ${normalizeSubSessionStatus(subBeingEdited?.status) === 'جلسه آتی' ? 'selected' : ''}>جلسه آتی</option>
                <option value="برگزار شده" ${normalizeSubSessionStatus(subBeingEdited?.status) === 'برگزار شده' ? 'selected' : ''}>برگزار شده</option>
              </select>
            </div>
            <div>
              <label class="block text-[11.5px] font-semibold text-[#4E3B2D] mb-1">تاریخ برگزاری</label>
              <input
                type="text"
                name="session_date"
                value="${subBeingEdited?.session_date || '۳۰ آبان ۱۴۰۵'}"
                class="w-full px-3 py-2 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[12.5px]"
              />
            </div>
            <div>
              <label class="block text-[11.5px] font-semibold text-[#4E3B2D] mb-1">زمان برگزاری</label>
              <input
                type="text"
                name="session_time"
                value="${subBeingEdited?.session_time || '۱۸:۰۰ تا ۲۰:۰۰'}"
                class="w-full px-3 py-2 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[12.5px]"
              />
            </div>
            <div>
              <label class="block text-[11.5px] font-semibold text-[#4E3B2D] mb-1">صفحات مطالعه</label>
              <input
                type="text"
                name="pages_to_read"
                value="${subBeingEdited?.pages_to_read || ''}"
                placeholder="صفحات ۱ تا ۹۰"
                class="w-full px-3 py-2 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[12.5px]"
              />
            </div>
            <div>
              <label class="block text-[11.5px] font-semibold text-[#4E3B2D] mb-1">لینک ورود به جلسه</label>
              <input
                type="text"
                name="meeting_link"
                dir="ltr"
                value="${subBeingEdited?.meeting_link || 'https://meet.bookmeet.ir/live'}"
                class="w-full px-3 py-2 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[12.5px] text-left"
              />
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" class="js-admin-cancel-subsession-edit px-4 py-2 rounded-xl border border-[#C5B198] text-[12.5px] font-semibold text-[#4E3B2D] cursor-pointer">انصراف</button>
            <button type="submit" class="px-5 py-2 rounded-xl bg-[#5A3A22] text-[#FAF5EC] text-[12.5px] font-semibold cursor-pointer">
              ${subBeingEdited ? 'ذخیره تغییرات کارت جلسه' : 'افزودن کارت جلسه'}
            </button>
          </div>
        </form>
        `
            : ''
        }

        <!-- Search and Equal-Sized Compact Filter for Sub-Sessions -->
        <div class="p-4 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <input
            type="text"
            value="${toPersianDigits(subSessionSearch)}"
            placeholder="جستجو در شماره جلسه، عنوان مبحث یا تاریخ برگزاری..."
            class="js-admin-subsession-search flex-1 px-4 py-2 rounded-xl bg-[#F4E9DA]/65 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
          />
          <div class="flex items-center gap-2 shrink-0">
            ${(
              [
                { key: 'all', label: 'همه جلسات' },
                { key: 'جلسه آتی', label: 'جلسه آتی' },
                { key: 'برگزار شده', label: 'برگزار شده' },
              ] as const
            )
              .map(
                (f) => `
              <button
                type="button"
                data-subsession-filter="${f.key}"
                class="js-admin-subsession-filter w-[104px] h-8 rounded-lg text-[12px] font-semibold inline-flex items-center justify-center cursor-pointer transition-colors ${
                  subSessionStatusFilter === f.key
                    ? 'bg-[#5A3A22] text-[#FAF5EC]'
                    : 'bg-[#F4E9DA]/70 border border-[#DFCEB9] text-[#4E3B2D]'
                }"
              >
                ${f.label}
              </button>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Sub-Sessions Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${filteredSubs
            .map((sub) => {
              const displayStatus = normalizeSubSessionStatus(sub.status);
              return `
            <div class="p-4 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] flex flex-col justify-between gap-3">
              <div class="space-y-2">
                <div class="flex items-center justify-between gap-2">
                  <span class="px-2.5 py-1 rounded-lg text-[11.5px] font-bold ${
                    displayStatus === 'جلسه آتی'
                      ? 'bg-[#E4F2E7] text-[#235332]'
                      : 'bg-[#EFE0CC] text-[#6E4526]'
                  }">
                    ${toPersianDigits(sub.session_number)} · ${displayStatus}
                  </span>
                  <span class="text-[11.5px] text-[#6B5444]">
                    ${toPersianDigits(sub.session_date)} · ساعت ${toPersianDigits(sub.session_time)}
                  </span>
                </div>
                <h4 class="font-display text-[15.5px] font-bold text-[#231912]">${toPersianDigits(sub.title)}</h4>
                <p class="text-[12px] text-[#5B4739]">محدوده مطالعه: ${toPersianDigits(sub.pages_to_read || String(sub.pages_read || '—'))}</p>
              </div>
              <div class="pt-2 border-t border-[#E6D8C5] flex justify-end gap-2">
                <button
                  type="button"
                  data-parent-type="${params.parentType}"
                  data-parent-id="${params.parentId}"
                  data-sub-id="${sub.id}"
                  class="js-admin-edit-subsession px-3 py-1.5 rounded-lg bg-[#F3E7D6] hover:bg-[#E5D4BC] text-[#3F2E21] text-[11.5px] font-semibold cursor-pointer"
                >
                  ویرایش
                </button>
                <button
                  type="button"
                  data-parent-type="${params.parentType}"
                  data-parent-id="${params.parentId}"
                  data-sub-id="${sub.id}"
                  class="js-admin-delete-subsession px-3 py-1.5 rounded-lg border border-[#E6B8B3] text-[#9E3329] hover:bg-[#FBEAE8] text-[11.5px] font-semibold cursor-pointer"
                >
                  حذف این جلسه
                </button>
              </div>
            </div>
          `;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  // ==================== 3. CLASSES MANAGEMENT TAB ====================
  function renderClassesTab(): string {
    if (managingSubSessionsForClassId !== null) {
      const parentClass = state.classes.find((c) => c.id === managingSubSessionsForClassId);
      if (parentClass) {
        return renderManageSubSessionsView({
          parentType: 'class',
          parentId: parentClass.id,
          parentTitle: parentClass.title,
          subSessions: parentClass.sub_sessions || [],
        });
      }
    }

    const q = classSearch.trim().toLowerCase();
    const filtered = state.classes.filter((c) => {
      const normStatus = normalizeCourseStatus(c.status);
      if (classStatusFilter !== 'all' && normStatus !== classStatusFilter) {
        return false;
      }
      if (!q) return true;
      return `${c.title} ${c.book_title} ${c.instructor_name}`.toLowerCase().includes(q);
    });

    return `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="font-display text-[20px] sm:text-[23px] font-bold text-[#231912]">مدیریت کلاس‌های آموزشی</h2>
            <p class="text-[13.5px] text-[#6B5444] mt-1 text-justify">
              تعریف کلاس‌های جدید، تعیین سطح و وضعیت کلاس، انتخاب کاور از گالری و مدیریت کارت‌های جلسات هر کلاس.
            </p>
          </div>
          <button
            type="button"
            class="js-admin-new-class-btn px-5 py-2.5 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[13px] font-semibold transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            + افزودن کلاس جدید
          </button>
        </div>

        ${
          editingClass
            ? `
          <form class="js-admin-class-form p-6 rounded-2xl bg-[#FAF5EC] border-2 border-[#C8AF8F] space-y-4">
            <h3 class="font-display text-[17px] font-bold text-[#231912]">
              ${editingClass.id ? 'ویرایش کلاس آموزشی' : 'تعریف کلاس آموزشی جدید'}
            </h3>
            <input type="hidden" name="id" value="${editingClass.id || ''}" />
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div class="sm:col-span-2">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">عنوان کلاس *</label>
                <input type="text" name="title" required value="${editingClass.title || ''}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">وضعیت کلاس *</label>
                <select name="status" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]">
                  <option value="فعال" ${normalizeCourseStatus(editingClass.status) === 'فعال' ? 'selected' : ''}>فعال</option>
                  <option value="غیرفعال" ${normalizeCourseStatus(editingClass.status) === 'غیرفعال' ? 'selected' : ''}>غیرفعال</option>
                </select>
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">متن و سرفصل محوری *</label>
                <input type="text" name="book_title" required value="${editingClass.book_title || ''}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">نام مدرس *</label>
                <input type="text" name="instructor_name" required value="${editingClass.instructor_name || 'دکتر سهراب رستگار'}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">برنامه هفتگی</label>
                <input type="text" name="schedule_summary" value="${editingClass.schedule_summary || 'دوشنبه‌ها · ساعت ۱۷:۳۰ تا ۱۹:۳۰'}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">سطح کلاس *</label>
                <select name="level_label" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]">
                  <option value="مبتدی" ${editingClass.level_label === 'مبتدی' ? 'selected' : ''}>مبتدی</option>
                  <option value="پیشرفته" ${editingClass.level_label === 'پیشرفته' || !editingClass.level_label ? 'selected' : ''}>پیشرفته</option>
                  <option value="تخصصی" ${editingClass.level_label === 'تخصصی' ? 'selected' : ''}>تخصصی</option>
                </select>
              </div>
              <div class="sm:col-span-2">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">تصویر کاور کلاس (انتخاب از گالری تصاویر)</label>
                <input type="hidden" name="cover_url" value="${editingClass.cover_url || '/assets/blog-1.png'}" />
                <div class="flex items-center gap-3 p-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9]">
                  <img src="${editingClass.cover_url || '/assets/blog-1.png'}" alt="کاور کلاس" class="w-14 h-14 rounded-lg object-cover border border-[#D5C3AE] shrink-0" />
                  <div class="flex-1 min-w-0">
                    <div class="text-[12px] font-semibold text-[#231912] truncate">تصویر انتخاب‌شده از گالری</div>
                    <div dir="ltr" class="text-[11px] text-[#6B5444] truncate text-left">${editingClass.cover_url || '/assets/blog-1.png'}</div>
                  </div>
                  <button
                    type="button"
                    data-gallery-target="class"
                    class="js-admin-open-gallery-picker px-3.5 py-2 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[12px] font-semibold cursor-pointer shrink-0"
                  >
                    انتخاب از گالری تصاویر
                  </button>
                </div>
              </div>
              <div class="sm:col-span-3">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">توضیحات کلاس</label>
                <textarea name="description" rows="3" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]">${editingClass.description || ''}</textarea>
              </div>
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" class="js-admin-cancel-class px-4 py-2 rounded-xl border border-[#C5B198] text-[12.5px] font-semibold text-[#4E3B2D] cursor-pointer">انصراف</button>
              <button type="submit" class="px-5 py-2 rounded-xl bg-[#5A3A22] text-[#FAF5EC] text-[13px] font-semibold cursor-pointer">ذخیره کلاس در دیتابیس</button>
            </div>
          </form>
        `
            : ''
        }

        <!-- Search and Equal-Sized Compact Active/Inactive Filter -->
        <div class="p-4 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <input
            type="text"
            value="${toPersianDigits(classSearch)}"
            placeholder="جستجو در عنوان کلاس، سرفصل یا نام مدرس..."
            class="js-admin-class-search flex-1 px-4 py-2 rounded-xl bg-[#F4E9DA]/65 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
          />
          <div class="flex items-center gap-2 shrink-0">
            ${(
              [
                { key: 'all', label: 'همه کلاس‌ها' },
                { key: 'فعال', label: 'فعال' },
                { key: 'غیرفعال', label: 'غیرفعال' },
              ] as const
            )
              .map(
                (f) => `
              <button
                type="button"
                data-class-filter="${f.key}"
                class="js-admin-class-filter w-[104px] h-8 rounded-lg text-[12px] font-semibold inline-flex items-center justify-center cursor-pointer transition-colors ${
                  classStatusFilter === f.key
                    ? 'bg-[#5A3A22] text-[#FAF5EC]'
                    : 'bg-[#F4E9DA]/70 border border-[#DFCEB9] text-[#4E3B2D]'
                }"
              >
                ${f.label}
              </button>
            `
              )
              .join('')}
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          ${filtered
            .map((c) => {
              const normStatus = normalizeCourseStatus(c.status);
              return `
            <article class="rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] overflow-hidden flex flex-col justify-between">
              <div>
                <div class="relative h-44 bg-[#EFE3D2]">
                  <img src="${c.cover_url || '/assets/blog-1.png'}" alt="${c.title}" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 bg-gradient-to-t from-[#1E140E]/75 via-transparent to-transparent"></div>
                  <div class="absolute bottom-3 right-4 left-4 flex items-center justify-between text-[#FAF5EC] text-[11.5px] font-semibold">
                    <div class="flex items-center gap-1.5">
                      <span class="px-2.5 py-1 rounded-lg ${
                        normStatus === 'فعال' ? 'bg-[#235332]/90' : 'bg-[#7A5A10]/90'
                      }">${normStatus}</span>
                      <span class="px-2.5 py-1 rounded-lg bg-[#5A3A22]/90">سطح ${toPersianDigits(c.level_label)}</span>
                    </div>
                    <span class="px-2.5 py-1 rounded-lg bg-[#1E140E]/65">${toPersianDigits((c.sub_sessions || []).length)} جلسه آموزشی</span>
                  </div>
                </div>
                <div class="p-5 space-y-2.5">
                  <h3 class="font-display text-[16.5px] font-bold text-[#231912] text-justify leading-[1.65]">${toPersianDigits(c.title)}</h3>
                  <p class="text-[12.5px] text-[#5B4739] text-justify leading-[1.8]">${toPersianDigits(c.description)}</p>
                  <div class="pt-2 border-t border-[#E6D8C5] text-[12px] text-[#5B4739] space-y-1">
                    <div>مدرس: <strong class="text-[#231912]">${toPersianDigits(c.instructor_name)}</strong></div>
                    <div>برنامه: <strong class="text-[#231912]">${toPersianDigits(c.schedule_summary)}</strong></div>
                  </div>
                  ${renderEnrolledMembersBlock({
                    targetType: 'class',
                    targetId: c.id,
                    targetTitle: c.title,
                    members: c.enrolled_members,
                    fallbackStatus: c.status,
                  })}
                </div>
              </div>
              <div class="px-5 pb-5 pt-3 border-t border-[#E6D8C5] flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  data-manage-class-subs="${c.id}"
                  class="js-admin-manage-class-subs px-3.5 py-2 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[12px] font-semibold cursor-pointer"
                >
                  صفحه جلسات کلاس (${toPersianDigits((c.sub_sessions || []).length)})
                </button>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    data-edit-class="${c.id}"
                    class="js-admin-edit-class px-3 py-2 rounded-xl bg-[#F3E7D6] hover:bg-[#E5D4BC] text-[#3F2E21] text-[12px] font-semibold cursor-pointer"
                  >
                    ویرایش
                  </button>
                  <button
                    type="button"
                    data-delete-class="${c.id}"
                    class="js-admin-delete-class px-3 py-2 rounded-xl border border-[#E6B8B3] text-[#9E3329] hover:bg-[#FBEAE8] text-[12px] font-semibold cursor-pointer"
                  >
                    حذف
                  </button>
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

  // ==================== 4. USERS MANAGEMENT TAB (TABLE VIEW) ====================
  function renderUsersTab(): string {
    const q = userSearch.trim().toLowerCase();
    const filteredUsers = state.users.filter((u) => {
      const uStatus = u.status || 'فعال';
      if (userStatusFilter !== 'all' && uStatus !== userStatusFilter) {
        return false;
      }
      if (!q) return true;
      return `${u.first_name} ${u.last_name} ${u.phone} ${u.email || ''} ${u.favorite_genre || ''} ${u.education || ''}`
        .toLowerCase()
        .includes(q);
    });

    return `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="font-display text-[20px] sm:text-[23px] font-bold text-[#231912]">مدیریت کاربران باشگاه</h2>
            <p class="text-[13.5px] text-[#6B5444] mt-1 text-justify">
              جدول مشخصات کامل کاربران عضو باشگاه، مدیریت وضعیت فعال/غیرفعال، ریست رمز عبور و ارسال اطلاعیه اختصاصی.
            </p>
          </div>
          <button
            type="button"
            class="js-admin-new-user-btn px-5 py-2.5 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[13px] font-semibold transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            + افزودن کاربر جدید
          </button>
        </div>

        ${
          editingUser
            ? `
          <form class="js-admin-user-form p-6 rounded-2xl bg-[#FAF5EC] border-2 border-[#C8AF8F] space-y-4">
            <h3 class="font-display text-[17px] font-bold text-[#231912]">
              افزودن عضو جدید به باشگاه
            </h3>
            <input type="hidden" name="id" value="${editingUser.id || ''}" />
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">نام *</label>
                <input type="text" name="first_name" required value="${editingUser.first_name || ''}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">نام خانوادگی *</label>
                <input type="text" name="last_name" required value="${editingUser.last_name || ''}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">شماره همراه *</label>
                <input type="text" name="phone" required value="${toPersianDigits(editingUser.phone || '')}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">مقطع تحصیلی</label>
                <select name="education" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]">
                  ${['دیپلم', 'کاردانی', 'کارشناسی', 'کارشناسی ارشد', 'دکتری']
                    .map(
                      (lvl) =>
                        `<option value="${lvl}" ${editingUser?.education === lvl ? 'selected' : ''}>${lvl}</option>`
                    )
                    .join('')}
                </select>
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">حوزه مورد علاقه کتاب</label>
                <input type="text" name="favorite_genre" value="${editingUser.favorite_genre || 'ادبیات داستانی و رمان کلاسیک'}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">پست الکترونیک (ایمیل)</label>
                <input type="text" name="email" dir="ltr" value="${editingUser.email || ''}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-left" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">کد عضویت</label>
                <input type="text" name="membership_code" value="${toPersianDigits(editingUser.membership_code || 'BM-۱۴۰۵-۱۴۰')}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">رمز عبور *</label>
                <input type="text" name="password" placeholder="پیش‌فرض: 1234" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]" />
              </div>
              <div class="sm:col-span-3">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">بیوگرافی و درباره من</label>
                <textarea name="bio" rows="2" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]">${editingUser.bio || ''}</textarea>
              </div>
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" class="js-admin-cancel-user px-4 py-2 rounded-xl border border-[#C5B198] text-[12.5px] font-semibold text-[#4E3B2D] cursor-pointer">انصراف</button>
              <button type="submit" class="px-5 py-2 rounded-xl bg-[#5A3A22] text-[#FAF5EC] text-[13px] font-semibold cursor-pointer">ذخیره کاربر</button>
            </div>
          </form>
        `
            : ''
        }

        <!-- Search and Equal-Sized Active/Inactive Filter -->
        <div class="p-4 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <input
            type="text"
            value="${toPersianDigits(userSearch)}"
            placeholder="جستجو در جدول کاربران بر اساس نام، شماره تلفن، ایمیل، تحصیلات یا ژانر مورد علاقه..."
            class="js-admin-user-search flex-1 px-4 py-2 rounded-xl bg-[#F4E9DA]/65 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
          />
          <div class="flex items-center gap-2 shrink-0">
            ${(
              [
                { key: 'all', label: 'همه کاربران' },
                { key: 'فعال', label: 'فعال' },
                { key: 'غیرفعال', label: 'غیرفعال' },
              ] as const
            )
              .map(
                (f) => `
              <button
                type="button"
                data-user-filter="${f.key}"
                class="js-admin-user-filter w-[104px] h-8 rounded-lg text-[12px] font-semibold inline-flex items-center justify-center cursor-pointer transition-colors ${
                  userStatusFilter === f.key
                    ? 'bg-[#5A3A22] text-[#FAF5EC]'
                    : 'bg-[#F4E9DA]/70 border border-[#DFCEB9] text-[#4E3B2D]'
                }"
              >
                ${f.label}
              </button>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Users Profile Table -->
        <div class="rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] overflow-hidden shadow-xs">
          <div class="overflow-x-auto">
            <table class="w-full text-right border-collapse min-w-[1040px]">
              <thead>
                <tr class="bg-[#EFE3D2] text-[#3F2E21] text-[12px] font-bold border-b border-[#DFCEB9]">
                  <th class="py-3.5 px-4">#</th>
                  <th class="py-3.5 px-4">کاربر (نام و تصویر پروفایل)</th>
                  <th class="py-3.5 px-4">وضعیت</th>
                  <th class="py-3.5 px-4">کد عضویت</th>
                  <th class="py-3.5 px-4">شماره همراه</th>
                  <th class="py-3.5 px-4">پست الکترونیک (ایمیل)</th>
                  <th class="py-3.5 px-4">تحصیلات</th>
                  <th class="py-3.5 px-4">حوزه مورد علاقه کتاب</th>
                  <th class="py-3.5 px-4">تاریخ عضویت</th>
                  <th class="py-3.5 px-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#E6D8C5] text-[12.5px] text-[#231912]">
                ${filteredUsers
                  .map((u, idx) => {
                    const uStatus = u.status || 'فعال';
                    const isActive = uStatus === 'فعال';
                    return `
                  <tr class="hover:bg-[#F5EBDC]/60 transition-colors">
                    <td class="py-3.5 px-4 font-bold text-[#6B5444]">${toPersianDigits(idx + 1)}</td>
                    <td class="py-3.5 px-4">
                      <div class="flex items-center gap-2.5">
                        <div class="w-9 h-9 rounded-xl bg-[#7A4B2A] text-[#FAF5EC] font-display text-[14px] font-bold flex items-center justify-center overflow-hidden shrink-0">
                          ${
                            u.avatar_url
                              ? `<img src="${u.avatar_url}" alt="${u.first_name}" class="w-full h-full object-cover" />`
                              : u.first_name.charAt(0)
                          }
                        </div>
                        <div class="font-bold text-[#231912] whitespace-nowrap">${u.first_name} ${u.last_name}</div>
                      </div>
                    </td>
                    <td class="py-3.5 px-4 whitespace-nowrap">
                      <span class="px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                        isActive
                          ? 'bg-[#E4F2E7] text-[#235332]'
                          : 'bg-[#FBEAE8] text-[#9E3329]'
                      }">
                        ${uStatus}
                      </span>
                    </td>
                    <td class="py-3.5 px-4 whitespace-nowrap">
                      <span class="px-2.5 py-1 rounded-md bg-[#EFE3D2] text-[#4E3B2D] text-[11.5px] font-semibold">
                        ${toPersianDigits(u.membership_code || 'BM-۱۴۰۵')}
                      </span>
                    </td>
                    <td class="py-3.5 px-4 whitespace-nowrap font-medium">${toPersianDigits(u.phone)}</td>
                    <td class="py-3.5 px-4 whitespace-nowrap" dir="ltr">${u.email || '—'}</td>
                    <td class="py-3.5 px-4 whitespace-nowrap">${toPersianDigits(u.education || '—')}</td>
                    <td class="py-3.5 px-4 max-w-[180px] truncate" title="${u.favorite_genre || ''}">${toPersianDigits(u.favorite_genre || '—')}</td>
                    <td class="py-3.5 px-4 whitespace-nowrap text-[#6B5444]">${toPersianDigits(u.joined_date || 'آبان ۱۴۰۵')}</td>
                    <td class="py-3.5 px-4 whitespace-nowrap">
                      <div class="flex items-center justify-center gap-1.5">
                        <!-- 1. Toggle Active / Inactive Icon Button -->
                        <button
                          type="button"
                          data-toggle-user="${u.id}"
                          title="${isActive ? 'غیرفعال کردن کاربر' : 'فعال کردن کاربر'}"
                          aria-label="${isActive ? 'غیرفعال کردن کاربر' : 'فعال کردن کاربر'}"
                          class="js-admin-toggle-user-status w-8 h-8 rounded-lg inline-flex items-center justify-center border transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-[#E4F2E7] border-[#BBD9C2] text-[#235332] hover:bg-[#D2E9D7]'
                              : 'bg-[#FFF3CD] border-[#E8D28C] text-[#7A5A10] hover:bg-[#F7E5AE]'
                          }"
                        >
                          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                            <line x1="12" y1="2" x2="12" y2="12"></line>
                          </svg>
                        </button>

                        <!-- 2. Reset Password Icon Button -->
                        <button
                          type="button"
                          data-reset-pass-user="${u.id}"
                          title="ریست رمز عبور کاربر"
                          aria-label="ریست رمز عبور کاربر"
                          class="js-admin-reset-user-password w-8 h-8 rounded-lg inline-flex items-center justify-center bg-[#F3E7D6] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[#4E3B2D] transition-colors cursor-pointer"
                        >
                          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
                          </svg>
                        </button>

                        <!-- 3. Send Personal Announcement Icon Button -->
                        <button
                          type="button"
                          data-notify-user="${u.id}"
                          title="ارسال اطلاعیه به این کاربر"
                          aria-label="ارسال اطلاعیه به این کاربر"
                          class="js-admin-open-user-notify-modal w-8 h-8 rounded-lg inline-flex items-center justify-center bg-[#EFE3D2] hover:bg-[#E2D0B8] border border-[#D5C1A7] text-[#5A3A22] transition-colors cursor-pointer"
                        >
                          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                          </svg>
                        </button>

                        <!-- 4. Delete User Icon Button -->
                        <button
                          type="button"
                          data-delete-user="${u.id}"
                          title="حذف کاربر"
                          aria-label="حذف کاربر"
                          class="js-admin-delete-user w-8 h-8 rounded-lg inline-flex items-center justify-center border border-[#E6B8B3] text-[#9E3329] hover:bg-[#FBEAE8] transition-colors cursor-pointer"
                        >
                          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // ==================== 5. TICKETS MANAGEMENT TAB ====================
  function renderTicketsTab(): string {
    const filteredTickets = state.tickets.filter((t) => {
      if (ticketFilter === 'all') return true;
      return t.status === ticketFilter;
    });

    return `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="font-display text-[20px] sm:text-[23px] font-bold text-[#231912]">مدیریت تیکت‌ها و درخواست‌های اعضا</h2>
            <p class="text-[13.5px] text-[#6B5444] mt-1">
              بررسی پیشنهادهای کتاب و پیام‌های پشتیبانی فنی اعضا و ثبت پاسخ جدید دبیرخانه.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            ${(
              [
                { key: 'all', label: 'همه تیکت‌ها' },
                { key: 'در انتظار بررسی', label: 'در انتظار بررسی' },
                { key: 'پاسخ داده‌شده', label: 'پاسخ داده‌شده' },
                { key: 'بسته‌شده', label: 'بسته‌شده' },
              ] as const
            )
              .map(
                (f) => `
              <button
                type="button"
                data-ticket-filter="${f.key}"
                class="js-admin-ticket-filter px-3.5 py-2 rounded-xl text-[12px] font-semibold cursor-pointer ${
                  ticketFilter === f.key
                    ? 'bg-[#5A3A22] text-[#FAF5EC]'
                    : 'bg-[#FAF5EC] border border-[#E5D7C5] text-[#4E3B2D]'
                }"
              >
                ${f.label}
              </button>
            `
              )
              .join('')}
          </div>
        </div>

        <div class="space-y-4">
          ${filteredTickets
            .map((ticket) => {
              const repliesList =
                Array.isArray(ticket.admin_replies) && ticket.admin_replies.length > 0
                  ? ticket.admin_replies
                  : ticket.admin_reply
                  ? [{ text: ticket.admin_reply, created_at: ticket.created_at || 'ثبت‌شده' }]
                  : [];

              return `
            <div data-admin-ticket-card="${ticket.id}" class="p-5 sm:p-6 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] space-y-4">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2.5">
                  <span class="font-mono text-[12px] font-bold px-2.5 py-1 rounded-md bg-[#EFE3D2] text-[#4E3B2D]">
                    #${toPersianDigits(ticket.ticket_code)}
                  </span>
                  <h3 class="font-display text-[16.5px] font-bold text-[#231912]">${toPersianDigits(ticket.subject)}</h3>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-[11.5px] px-2.5 py-0.5 rounded-md bg-[#F3E9DA] text-[#6B5444]">
                    بخش: ${toPersianDigits(ticket.department)}
                  </span>
                  <span class="text-[11.5px] px-2.5 py-0.5 rounded-md bg-[#EFE3D2] text-[#4E3B2D]">
                    فرستنده: ${toPersianDigits(ticket.member_phone)}
                  </span>
                </div>
              </div>

              <p class="text-[13.5px] text-[#3D2E22] leading-[1.85] text-justify bg-[#F4E9DA]/50 p-3.5 rounded-xl border border-[#E8DAC6]">
                ${toPersianDigits(ticket.message)}
              </p>

              ${
                ticket.attachment_name
                  ? `
                <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F2E6D5] border border-[#DFCEB9] text-[12px] text-[#4E3B2D]">
                  <span>📎 فایل پیوست کاربر:</span>
                  <strong>${toPersianDigits(ticket.attachment_name)}</strong>
                </div>
              `
                  : ''
              }

              <!-- Existing Replies List -->
              ${
                repliesList.length > 0
                  ? `
                <div class="space-y-2 pt-2">
                  <div class="text-[12px] font-bold text-[#235332]">پاسخ‌های ثبت‌شده دبیرخانه:</div>
                  ${repliesList
                    .map(
                      (rep) => `
                    <div class="p-3.5 rounded-xl bg-[#EEF6F0] border border-[#C5DFCC] text-[13px] text-[#1E3F29] space-y-1">
                      <div class="flex items-center justify-between text-[11px] text-[#3B6E4C]">
                        <span class="font-bold">پاسخ مدیر باشگاه</span>
                        <span>${toPersianDigits(rep.created_at)}</span>
                      </div>
                      <p class="leading-[1.8] text-justify">${toPersianDigits(rep.text)}</p>
                    </div>
                  `
                    )
                    .join('')}
                </div>
              `
                  : ''
              }

              <div class="pt-3 border-t border-[#E6D8C5] space-y-3">
                <div>
                  <label class="block text-[12px] font-semibold text-[#235332] mb-1">ثبت پاسخ جدید دبیرخانه / مدیر باشگاه:</label>
                  <textarea
                    rows="2"
                    placeholder="متن پاسخ جدید خود را اینجا بنویسید..."
                    class="js-admin-ticket-reply-input w-full px-3.5 py-2.5 rounded-xl bg-[#FDFBF7] border border-[#DFCEB9] text-[13px] text-[#231912]"
                  ></textarea>
                </div>
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <label class="text-[12px] font-semibold text-[#4E3B2D]">وضعیت تیکت:</label>
                    <select class="js-admin-ticket-status-select px-3 py-1.5 rounded-xl bg-[#F4E9DA]/70 border border-[#DFCEB9] text-[12.5px] text-[#231912]">
                      <option value="پاسخ داده‌شده" ${ticket.status === 'پاسخ داده‌شده' ? 'selected' : ''}>پاسخ داده‌شده</option>
                      <option value="در انتظار بررسی" ${ticket.status === 'در انتظار بررسی' ? 'selected' : ''}>در انتظار بررسی</option>
                      <option value="بسته‌شده" ${ticket.status === 'بسته‌شده' ? 'selected' : ''}>بسته‌شده</option>
                    </select>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      data-delete-ticket="${ticket.id}"
                      class="js-admin-delete-ticket px-3.5 py-2 rounded-xl border border-[#E6B8B3] text-[#9E3329] hover:bg-[#FBEAE8] text-[12px] font-semibold cursor-pointer"
                    >
                      حذف تیکت
                    </button>
                    <button
                      type="button"
                      data-save-ticket="${ticket.id}"
                      class="js-admin-save-ticket px-5 py-2 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[12.5px] font-semibold cursor-pointer"
                    >
                      ثبت پاسخ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  // ==================== 6. ANNOUNCEMENTS MANAGEMENT TAB ====================
  function renderAnnouncementsTab(): string {
    const categories = ['جلسات کتابخوانی', 'کلاس ها', 'فنی'];

    return `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="font-display text-[20px] sm:text-[23px] font-bold text-[#231912]">مدیریت اطلاعیه‌های باشگاه</h2>
            <p class="text-[13.5px] text-[#6B5444] mt-1">
              انتشار اطلاعیه جدید در دسته‌بندی‌های جلسات کتابخوانی، کلاس‌ها و فنی برای نمایش در پنل کاربری اعضا.
            </p>
          </div>
          <button
            type="button"
            class="js-admin-new-announcement-btn px-5 py-2.5 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[13px] font-semibold transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            + انتشار اطلاعیه جدید
          </button>
        </div>

        ${
          editingAnnouncement
            ? `
          <form class="js-admin-announcement-form p-6 rounded-2xl bg-[#FAF5EC] border-2 border-[#C8AF8F] space-y-4">
            <h3 class="font-display text-[17px] font-bold text-[#231912]">
              ${editingAnnouncement.id ? 'ویرایش اطلاعیه' : 'انتشار اطلاعیه جدید'}
            </h3>
            <input type="hidden" name="id" value="${editingAnnouncement.id || ''}" />
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="sm:col-span-2">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">عنوان اطلاعیه *</label>
                <input type="text" name="title" required value="${editingAnnouncement.title || ''}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">دسته‌بندی *</label>
                <select name="category" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]">
                  ${categories
                    .map(
                      (cat) =>
                        `<option value="${cat}" ${editingAnnouncement?.category === cat ? 'selected' : ''}>${cat}</option>`
                    )
                    .join('')}
                </select>
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">تاریخ انتشار</label>
                <input type="text" name="published_date" value="${editingAnnouncement.published_date || '۱۴ آبان ۱۴۰۵'}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">اهمیت اطلاعیه</label>
                <select name="is_important" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]">
                  <option value="1" ${editingAnnouncement.is_important ? 'selected' : ''}>مهم (دارای نشان ویژه)</option>
                  <option value="0" ${!editingAnnouncement.is_important ? 'selected' : ''}>عادی</option>
                </select>
              </div>
              <div class="sm:col-span-3">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">متن کامل اطلاعیه *</label>
                <textarea name="content" rows="3" required class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]">${editingAnnouncement.content || ''}</textarea>
              </div>
            </div>
            <div class="flex justify-end gap-2">
              <button type="button" class="js-admin-cancel-announcement px-4 py-2 rounded-xl border border-[#C5B198] text-[12.5px] font-semibold text-[#4E3B2D] cursor-pointer">انصراف</button>
              <button type="submit" class="px-5 py-2 rounded-xl bg-[#5A3A22] text-[#FAF5EC] text-[13px] font-semibold cursor-pointer">ذخیره اطلاعیه</button>
            </div>
          </form>
        `
            : ''
        }

        <div class="space-y-4">
          ${state.announcements
            .map(
              (ann) => `
            <article class="p-5 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] space-y-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  ${
                    ann.is_important
                      ? `<span class="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#FBEAE8] text-[#9E3329]">مهم</span>`
                      : ''
                  }
                  <span class="px-2.5 py-0.5 rounded-md text-[11.5px] font-semibold bg-[#EFE0CC] text-[#6E4526]">${toPersianDigits(ann.category)}</span>
                  <h3 class="font-display text-[16.5px] font-bold text-[#231912]">${toPersianDigits(ann.title)}</h3>
                </div>
                <span class="text-[12px] text-[#6B5444]">${toPersianDigits(ann.published_date)}</span>
              </div>
              <p class="text-[13.5px] text-[#3F2F23] leading-[1.85] text-justify">${toPersianDigits(ann.content)}</p>
              <div class="pt-2 border-t border-[#E8DAC6] flex justify-end gap-2">
                <button
                  type="button"
                  data-edit-announcement="${ann.id}"
                  class="js-admin-edit-announcement px-3.5 py-1.5 rounded-xl bg-[#F3E7D6] hover:bg-[#E5D4BC] text-[#3F2E21] text-[12px] font-semibold cursor-pointer"
                >
                  ویرایش
                </button>
                <button
                  type="button"
                  data-delete-announcement="${ann.id}"
                  class="js-admin-delete-announcement px-3.5 py-1.5 rounded-xl border border-[#E6B8B3] text-[#9E3329] hover:bg-[#FBEAE8] text-[12px] font-semibold cursor-pointer"
                >
                  حذف
                </button>
              </div>
            </article>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  // ==================== 7. ADMIN PROFILE TAB ====================
  function renderProfileTab(): string {
    return `
      <div class="space-y-6">
        <div>
          <h2 class="font-display text-[20px] sm:text-[23px] font-bold text-[#231912]">پروفایل مدیر باشگاه</h2>
          <p class="text-[13.5px] text-[#6B5444] mt-1">
            ویرایش مشخصات فردی، تصویر پروفایل و رمز عبور ویژه مدیریت باشگاه کتابخوانی بوک‌میت.
          </p>
        </div>

        <form class="js-admin-profile-form p-6 sm:p-8 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] space-y-6" novalidate>
          <div class="pb-5 border-b border-[#E6D8C5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-20 h-20 rounded-2xl bg-[#7A4B2A] text-[#FAF5EC] font-display text-[26px] font-bold flex items-center justify-center overflow-hidden border-2 border-[#DEC8AC] shrink-0">
                ${
                  pendingAdminAvatar
                    ? `<img src="${pendingAdminAvatar}" alt="${state.admin.first_name}" class="w-full h-full object-cover" />`
                    : state.admin.first_name.charAt(0)
                }
              </div>
              <div>
                <h3 class="font-bold text-[15.5px] text-[#231912]">تصویر پروفایل مدیر</h3>
                <p class="text-[12px] text-[#6B5444] mt-0.5">نام کاربری ویژه ورود مدیر: <strong dir="ltr" class="font-mono text-[#231912]">admin</strong></p>
              </div>
            </div>
            <div class="flex items-center gap-2.5">
              <input type="file" accept="image/*" class="js-admin-avatar-input hidden" />
              <button type="button" class="js-admin-trigger-avatar px-4 py-2 rounded-xl bg-[#F3E7D6] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[12.5px] font-semibold text-[#3F2E21] cursor-pointer">
                انتخاب تصویر جدید
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">نام *</label>
              <input type="text" name="first_name" value="${state.admin.first_name}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13.5px]" />
            </div>
            <div>
              <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">نام خانوادگی *</label>
              <input type="text" name="last_name" value="${state.admin.last_name}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13.5px]" />
            </div>
            <div>
              <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">نام کاربری ورود مدیر</label>
              <input type="text" dir="ltr" readonly value="admin" class="w-full px-3.5 py-2.5 rounded-xl bg-[#EAE0D2] border border-[#D8C7B1] text-[13.5px] text-[#6B5444] text-left cursor-not-allowed" />
            </div>
            <div>
              <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">پست الکترونیک (ایمیل)</label>
              <input type="text" name="email" dir="ltr" value="${state.admin.email || 'admin@bookmeet.ir'}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13.5px] text-left" />
            </div>
            <div>
              <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">مقطع تحصیلی</label>
              <input type="text" name="education" value="${state.admin.education || 'دکتری'}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13.5px]" />
            </div>
            <div>
              <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">تغییر رمز عبور مدیر (اختیاری)</label>
              <input type="password" name="new_password" placeholder="رمز فعلی: admin1234" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13.5px]" />
            </div>
            <div class="sm:col-span-2 lg:col-span-3">
              <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">حوزه تخصصی و پژوهشی</label>
              <input type="text" name="favorite_genre" value="${state.admin.favorite_genre || 'ادبیات تطبیقی و نقد ادبی'}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13.5px]" />
            </div>
            <div class="sm:col-span-2 lg:col-span-3">
              <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">درباره مدیر</label>
              <textarea name="bio" rows="3" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13.5px]">${state.admin.bio || ''}</textarea>
            </div>
          </div>

          ${
            adminProfileSavedBanner
              ? `
            <div class="p-3.5 rounded-xl bg-[#E4F2E7] border border-[#BBD9C2] text-[#235332] text-[13px] font-semibold">
              ✓ ${toPersianDigits(adminProfileSavedBanner)}
            </div>
          `
              : ''
          }

          <div class="flex justify-end">
            <button type="button" class="js-admin-save-profile-btn px-6 py-2.5 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[13.5px] font-semibold cursor-pointer">
              ذخیره تغییرات پروفایل مدیر
            </button>
          </div>
        </form>
      </div>
    `;
  }

  // ==================== 8. BLOG & ARTICLES MANAGEMENT TAB (WITH DEDICATED CREATE PAGE) ====================
  function renderBlogTab(): string {
    if (blogPageMode === 'editor' && editingBlogPost) {
      return `
        <div class="space-y-6">
          <div class="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="text-right">
              <h2 class="font-display text-[20px] sm:text-[23px] font-bold text-[#231912]">
                ${editingBlogPost.id ? 'صفحه ویرایش مقاله وبلاگ' : 'صفحه ساخت مقاله جدید در وبلاگ'}
              </h2>
              <p class="text-[13.5px] text-[#6B5444] mt-1">
                تمامی مشخصات مقاله، تصویر کاور، برچسب‌ها، خلاصه و متن کامل مقاله را در این صفحه تکمیل نمایید.
              </p>
            </div>
            <div class="mr-auto flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                class="js-admin-open-blog-cat-modal px-4 py-2.5 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[12.5px] font-semibold cursor-pointer"
              >
                + دسته‌بندی
              </button>
              <button
                type="button"
                class="js-admin-cancel-blog px-4 py-2.5 rounded-xl bg-[#F3E7D6] hover:bg-[#E5D4BC] text-[#3F2E21] text-[12.5px] font-semibold cursor-pointer"
              >
                → بازگشت به لیست مقالات
              </button>
            </div>
          </div>

          <form class="js-admin-blog-form p-6 sm:p-8 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] space-y-5">
            <input type="hidden" name="id" value="${editingBlogPost.id || ''}" />
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div class="sm:col-span-2">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">عنوان کامل مقاله *</label>
                <input
                  type="text"
                  name="title"
                  required
                  value="${editingBlogPost.title || ''}"
                  placeholder="مثلاً: کالبدشکافی زمان و روایت در رمان‌های قرن بیستم"
                  class="js-admin-blog-title-input w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13.5px] text-[#231912]"
                />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">نامک / Slug (در صورت خالی بودن خودکار ایجاد می‌شود)</label>
                <input
                  type="text"
                  name="slug"
                  dir="ltr"
                  value="${editingBlogPost.slug || ''}"
                  placeholder="در صورت خالی بودن خودکار ساخته می‌شود"
                  class="js-admin-blog-slug-input w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] text-left"
                />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">دسته‌بندی مقاله *</label>
                <select
                  name="category"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]"
                >
                  ${blogCategories
                    .map(
                      (c) =>
                        `<option value="${c}" ${editingBlogPost?.category === c ? 'selected' : ''}>${c}</option>`
                    )
                    .join('')}
                </select>
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">نام نویسنده مقاله *</label>
                <input
                  type="text"
                  name="author"
                  required
                  value="${editingBlogPost.author || 'سهراب رستگار'}"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]"
                />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">وضعیت انتشار مقاله</label>
                <select
                  name="status"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]"
                >
                  <option value="منتشر شده" ${editingBlogPost.status !== 'پیش‌نویس' ? 'selected' : ''}>منتشر شده</option>
                  <option value="پیش‌نویس" ${editingBlogPost.status === 'پیش‌نویس' ? 'selected' : ''}>پیش‌نویس</option>
                </select>
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">تاریخ انتشار</label>
                <input
                  type="text"
                  name="published_date"
                  value="${editingBlogPost.published_date || '۱۴ آبان ۱۴۰۵'}"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]"
                />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">زمان تخمینی مطالعه</label>
                <input
                  type="text"
                  name="reading_time"
                  value="${editingBlogPost.reading_time || '۶ دقیقه مطالعه'}"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]"
                />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">برچسب‌ها و کلمات کلیدی (با ویرگول جدا کنید)</label>
                <input
                  type="text"
                  name="tags"
                  value="${editingBlogPost.tags || 'ادبیات داستانی، نقد کتاب، بوک‌میت'}"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]"
                />
              </div>

              <!-- Cover Picker from Gallery -->
              <div class="sm:col-span-3">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">تصویر کاور مقاله *</label>
                <input type="hidden" name="cover_url" value="${editingBlogPost.cover_url || '/assets/blog-1.png'}" />
                <div class="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9]">
                  <div class="flex items-center gap-3.5">
                    <img
                      src="${editingBlogPost.cover_url || '/assets/blog-1.png'}"
                      alt="کاور مقاله"
                      class="w-24 h-16 rounded-xl object-cover border border-[#D5C3AE]"
                    />
                    <div>
                      <div class="text-[13px] font-bold text-[#231912]">تصویر شاخص مقاله</div>
                      <div dir="ltr" class="text-[11.5px] text-[#6B5444] text-left">${editingBlogPost.cover_url || '/assets/blog-1.png'}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    data-gallery-target="blog"
                    class="js-admin-open-gallery-picker px-4 py-2 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[12.5px] font-semibold cursor-pointer"
                  >
                    انتخاب تصویر کاور از گالری تصاویر
                  </button>
                </div>
              </div>

              <div class="sm:col-span-3">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">خلاصه مقاله (چکیده / لید) *</label>
                <textarea
                  name="excerpt"
                  rows="3"
                  required
                  placeholder="خلاصه‌ای جذاب از موضوع مقاله که در کارت‌های صفحه اصلی نمایش داده می‌شود..."
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13.5px] leading-[1.85]"
                >${editingBlogPost.excerpt || ''}</textarea>
              </div>

              <div class="sm:col-span-3">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">متن کامل مقاله *</label>
                <div class="rounded-xl border border-[#DFCEB9] bg-[#F4E9DA]/60 overflow-hidden">
                  <!-- Rich Text Formatting Toolbar -->
                  <div class="px-3 py-2 bg-[#EFE3D2] border-b border-[#DFCEB9] flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      data-editor-cmd="bold"
                      title="ضخیم (Bold)"
                      class="js-blog-editor-tool h-8 px-2.5 rounded-lg bg-[#FAF5EC] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[12px] font-bold text-[#231912] cursor-pointer"
                    >
                      B بولد
                    </button>
                    <button
                      type="button"
                      data-editor-cmd="italic"
                      title="مورب (Italic)"
                      class="js-blog-editor-tool h-8 px-2.5 rounded-lg bg-[#FAF5EC] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[12px] italic font-semibold text-[#231912] cursor-pointer"
                    >
                      I ایتالیک
                    </button>
                    <button
                      type="button"
                      data-editor-cmd="underline"
                      title="زیرخط‌دار"
                      class="js-blog-editor-tool h-8 px-2.5 rounded-lg bg-[#FAF5EC] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[12px] underline font-semibold text-[#231912] cursor-pointer"
                    >
                      U زیرخط
                    </button>
                    <span class="w-px h-5 bg-[#D5C3AE] mx-0.5"></span>
                    <button
                      type="button"
                      data-editor-cmd="h2"
                      title="افزودن تیتر اصلی"
                      class="js-blog-editor-tool h-8 px-2.5 rounded-lg bg-[#FAF5EC] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[12px] font-bold text-[#231912] cursor-pointer"
                    >
                      تیتر H2
                    </button>
                    <button
                      type="button"
                      data-editor-cmd="h3"
                      title="افزودن زیرعنوان"
                      class="js-blog-editor-tool h-8 px-2.5 rounded-lg bg-[#FAF5EC] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[12px] font-semibold text-[#231912] cursor-pointer"
                    >
                      زیرعنوان H3
                    </button>
                    <button
                      type="button"
                      data-editor-cmd="quote"
                      title="درج نقل‌قول ادبی"
                      class="js-blog-editor-tool h-8 px-2.5 rounded-lg bg-[#FAF5EC] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[12px] font-semibold text-[#231912] cursor-pointer"
                    >
                      « نقل‌قول »
                    </button>
                    <span class="w-px h-5 bg-[#D5C3AE] mx-0.5"></span>
                    <button
                      type="button"
                      data-editor-cmd="ul"
                      title="لیست نقطه‌ای"
                      class="js-blog-editor-tool h-8 px-2.5 rounded-lg bg-[#FAF5EC] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[12px] font-semibold text-[#231912] cursor-pointer"
                    >
                      • لیست نقطه‌ای
                    </button>
                    <button
                      type="button"
                      data-editor-cmd="ol"
                      title="لیست شماره‌دار"
                      class="js-blog-editor-tool h-8 px-2.5 rounded-lg bg-[#FAF5EC] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[12px] font-semibold text-[#231912] cursor-pointer"
                    >
                      ۱. لیست شماره‌دار
                    </button>
                    <button
                      type="button"
                      data-editor-cmd="link"
                      title="درج لینک"
                      class="js-blog-editor-tool h-8 px-2.5 rounded-lg bg-[#FAF5EC] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[12px] font-semibold text-[#231912] cursor-pointer"
                    >
                      🔗 لینک
                    </button>
                    <button
                      type="button"
                      data-editor-cmd="hr"
                      title="درج خط جداکننده"
                      class="js-blog-editor-tool h-8 px-2.5 rounded-lg bg-[#FAF5EC] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[12px] font-semibold text-[#231912] cursor-pointer"
                    >
                      ― جداکننده
                    </button>
                    <button
                      type="button"
                      data-editor-cmd="clear"
                      title="پاک‌سازی فرمت متن انتخاب‌شده"
                      class="js-blog-editor-tool h-8 px-2.5 rounded-lg bg-[#FAF5EC] hover:bg-[#FBEAE8] border border-[#E6B8B3] text-[11.5px] font-semibold text-[#9E3329] cursor-pointer mr-auto"
                    >
                      پاک‌سازی فرمت
                    </button>
                  </div>
                  <textarea
                    name="full_content"
                    rows="11"
                    required
                    placeholder="متن کامل مقاله، پاراگراف‌ها و تحلیل‌های ادبی را در این بخش بنویسید..."
                    class="js-admin-blog-content-textarea w-full px-4 py-3 bg-transparent text-[13.5px] text-[#231912] leading-[2] focus:outline-none"
                  >${editingBlogPost.full_content || ''}</textarea>
                </div>
              </div>
            </div>

            <div class="pt-3 border-t border-[#E6D8C5] flex items-center justify-end gap-3">
              <button
                type="button"
                class="js-admin-cancel-blog px-5 py-2.5 rounded-xl border border-[#C5B198] text-[13px] font-semibold text-[#4E3B2D] cursor-pointer"
              >
                انصراف و بازگشت
              </button>
              <button
                type="submit"
                class="px-6 py-2.5 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[13.5px] font-semibold cursor-pointer"
              >
                ذخیره و انتشار مقاله در وبلاگ
              </button>
            </div>
          </form>
        </div>
      `;
    }

    const q = blogSearch.trim().toLowerCase();
    const filteredPosts = state.blogPosts.filter((p) => {
      if (!q) return true;
      return `${p.title} ${p.category} ${p.author}`.toLowerCase().includes(q);
    });

    return `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="font-display text-[20px] sm:text-[23px] font-bold text-[#231912]">مدیریت وبلاگ و مقالات</h2>
            <p class="text-[13.5px] text-[#6B5444] mt-1">
              ایجاد مقاله جدید در صفحه اختصاصی، ویرایش متن مقالات و مدیریت انتشار در وبلاگ باشگاه.
            </p>
          </div>
          <button
            type="button"
            class="js-admin-new-blog-btn px-5 py-2.5 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[13px] font-semibold transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            + ایجاد مقاله جدید
          </button>
        </div>

        <div class="p-4 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5]">
          <input
            type="text"
            value="${toPersianDigits(blogSearch)}"
            placeholder="جستجو در عنوان مقاله، دسته‌بندی یا نویسنده..."
            class="js-admin-blog-search w-full px-4 py-2.5 rounded-xl bg-[#F4E9DA]/65 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          ${filteredPosts
            .map(
              (post) => `
            <article class="rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] overflow-hidden flex flex-col justify-between">
              <div>
                <div class="relative h-44 bg-[#EFE3D2]">
                  <img src="${post.cover_url || '/assets/blog-1.png'}" alt="${post.title}" class="w-full h-full object-cover" />
                  <div class="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-[#5A3A22]/90 text-[#FAF5EC] text-[11px] font-semibold">
                    ${toPersianDigits(post.category)}
                  </div>
                </div>
                <div class="p-5 space-y-2.5">
                  <h3 class="font-display text-[16.5px] font-bold text-[#231912] leading-[1.6] text-justify">${toPersianDigits(post.title)}</h3>
                  <div class="text-[12px] text-[#6B5444]">
                    نویسنده: <strong class="text-[#231912]">${toPersianDigits(post.author)}</strong> · ${toPersianDigits(post.published_date)} · ${toPersianDigits(post.reading_time)}
                  </div>
                  <p class="text-[12.5px] text-[#5B4739] leading-[1.8] text-justify line-clamp-3">${toPersianDigits(post.excerpt)}</p>
                </div>
              </div>
              <div class="px-5 pb-5 pt-3 border-t border-[#E6D8C5] flex justify-end gap-2">
                <button
                  type="button"
                  data-edit-blog="${post.id}"
                  class="js-admin-edit-blog px-3.5 py-1.5 rounded-xl bg-[#F3E7D6] hover:bg-[#E5D4BC] text-[#3F2E21] text-[12px] font-semibold cursor-pointer"
                >
                  ویرایش مقاله
                </button>
                <button
                  type="button"
                  data-delete-blog="${post.id}"
                  class="js-admin-delete-blog px-3.5 py-1.5 rounded-xl border border-[#E6B8B3] text-[#9E3329] hover:bg-[#FBEAE8] text-[12px] font-semibold cursor-pointer"
                >
                  حذف
                </button>
              </div>
            </article>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  // ==================== 9. USER COMMENTS MANAGEMENT TAB ====================
  function renderCommentsTab(): string {
    const filteredComments = state.comments.filter((c) => {
      if (commentFilter === 'all') return true;
      return c.status === commentFilter;
    });

    return `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="font-display text-[20px] sm:text-[23px] font-bold text-[#231912]">مدیریت نظرات کاربران</h2>
            <p class="text-[13.5px] text-[#6B5444] mt-1">
              بررسی، تایید، رد یا پاسخگویی به دیدگاه‌ها و نظرات ثبت‌شده اعضا درباره مقالات و نشست‌های باشگاه.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            ${(
              [
                { key: 'all', label: 'همه نظرات' },
                { key: 'تایید شده', label: 'تایید شده' },
                { key: 'در انتظار تایید', label: 'در انتظار تایید' },
                { key: 'رد شده', label: 'رد شده' },
              ] as const
            )
              .map(
                (f) => `
              <button
                type="button"
                data-comment-filter="${f.key}"
                class="js-admin-comment-filter px-3.5 py-2 rounded-xl text-[12px] font-semibold cursor-pointer ${
                  commentFilter === f.key
                    ? 'bg-[#5A3A22] text-[#FAF5EC]'
                    : 'bg-[#FAF5EC] border border-[#E5D7C5] text-[#4E3B2D]'
                }"
              >
                ${f.label}
              </button>
            `
              )
              .join('')}
          </div>
        </div>

        <div class="space-y-4">
          ${filteredComments
            .map(
              (comment) => `
            <div data-admin-comment-card="${comment.id}" class="p-5 sm:p-6 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] space-y-4">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 class="font-bold text-[15.5px] text-[#231912]">
                    ${toPersianDigits(comment.author_name)}
                    <span class="text-[12px] font-normal text-[#6B5444] mr-2">(${toPersianDigits(comment.author_phone)})</span>
                  </h3>
                  <span class="text-[12px] text-[#7A4B2A] block mt-0.5">
                    درباره: ${toPersianDigits(comment.target_title)}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-[12px] text-[#6B5444]">${toPersianDigits(comment.created_date)}</span>
                  <span class="px-2.5 py-0.5 rounded-md text-[11.5px] font-semibold ${
                    comment.status === 'تایید شده'
                      ? 'bg-[#E4F2E7] text-[#235332]'
                      : comment.status === 'در انتظار تایید'
                      ? 'bg-[#FFF3CD] text-[#7A5A10]'
                      : 'bg-[#FBEAE8] text-[#9E3329]'
                  }">
                    ${toPersianDigits(comment.status)}
                  </span>
                </div>
              </div>

              <p class="text-[13.5px] text-[#3D2E22] leading-[1.85] text-justify bg-[#F4E9DA]/50 p-3.5 rounded-xl border border-[#E8DAC6]">
                ${toPersianDigits(comment.comment_text)}
              </p>

              <div class="pt-3 border-t border-[#E6D8C5] space-y-3">
                <div>
                  <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">پاسخ مدیر به این نظر:</label>
                  <textarea
                    rows="2"
                    class="js-admin-comment-reply-input w-full px-3.5 py-2 rounded-xl bg-[#FDFBF7] border border-[#DFCEB9] text-[13px] text-[#231912]"
                  >${toPersianDigits(comment.admin_reply || '')}</textarea>
                </div>
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <label class="text-[12px] font-semibold text-[#4E3B2D]">وضعیت انتشار:</label>
                    <select class="js-admin-comment-status-select px-3 py-1.5 rounded-xl bg-[#F4E9DA]/70 border border-[#DFCEB9] text-[12.5px] text-[#231912]">
                      <option value="تایید شده" ${comment.status === 'تایید شده' ? 'selected' : ''}>تایید شده</option>
                      <option value="در انتظار تایید" ${comment.status === 'در انتظار تایید' ? 'selected' : ''}>در انتظار تایید</option>
                      <option value="رد شده" ${comment.status === 'رد شده' ? 'selected' : ''}>رد شده</option>
                    </select>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      data-delete-comment="${comment.id}"
                      class="js-admin-delete-comment px-3.5 py-2 rounded-xl border border-[#E6B8B3] text-[#9E3329] hover:bg-[#FBEAE8] text-[12px] font-semibold cursor-pointer"
                    >
                      حذف نظر
                    </button>
                    <button
                      type="button"
                      data-save-comment="${comment.id}"
                      class="js-admin-save-comment px-5 py-2 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[12.5px] font-semibold cursor-pointer"
                    >
                      ذخیره وضعیت و پاسخ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  // ==================== 10. HOME PAGE SETTINGS TAB ====================
  function renderHomeSettingsTab(): string {
    const h = state.heroSettings;
    const ac = state.aboutClub;
    const am = state.aboutManager;
    const ci = state.contactInfo;

    return `
      <div class="space-y-6">
        <div>
          <h2 class="font-display text-[20px] sm:text-[23px] font-bold text-[#231912]">تنظیمات صفحه اصلی سایت</h2>
          <p class="text-[13.5px] text-[#6B5444] mt-1 text-justify">
            تمامی متون، تیترها، آمارها و اطلاعات تماس صفحه اصلی سایت را در این بخش ویرایش کرده و مستقیماً در دیتابیس ذخیره نمایید.
          </p>
        </div>

        <form class="js-admin-home-settings-form space-y-6" novalidate>
          <div class="p-6 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] space-y-4">
            <h3 class="font-display text-[17px] font-bold text-[#231912] border-b border-[#E6D8C5] pb-2.5">
              ۱. تنظیمات بخش هیرو (Hero Section)
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="sm:col-span-2">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">تیتر اصلی هیرو سکشن</label>
                <input type="text" name="hero_headline" value="${h.headline}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">زیرعنوان خط اول</label>
                <input type="text" name="hero_sub1" value="${h.subtitle_line_1}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">زیرعنوان خط دوم</label>
                <input type="text" name="hero_sub2" value="${h.subtitle_line_2}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">متن دکمه ورود در ناوبری</label>
                <input type="text" name="hero_cta" value="${h.nav_cta_text}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]" />
              </div>
            </div>
          </div>

          <div class="p-6 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] space-y-4">
            <h3 class="font-display text-[17px] font-bold text-[#231912] border-b border-[#E6D8C5] pb-2.5">
              ۲. تنظیمات بخش «درباره باشگاه»
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="sm:col-span-3">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">تیتر بخش درباره باشگاه</label>
                <input type="text" name="club_title" value="${ac.title}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]" />
              </div>
              <div class="sm:col-span-3">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">پاراگراف اول درباره باشگاه</label>
                <textarea name="club_p1" rows="3" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]">${ac.paragraph_1}</textarea>
              </div>
              <div class="sm:col-span-3">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">پاراگراف دوم درباره باشگاه</label>
                <textarea name="club_p2" rows="3" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]">${ac.paragraph_2}</textarea>
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">آمار ۱ (مقدار و عنوان)</label>
                <div class="flex gap-2">
                  <input type="text" name="stat_1_value" value="${ac.stat_1_value}" class="w-24 px-3 py-2 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]" />
                  <input type="text" name="stat_1_label" value="${ac.stat_1_label}" class="flex-1 px-3 py-2 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]" />
                </div>
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">آمار ۲ (مقدار و عنوان)</label>
                <div class="flex gap-2">
                  <input type="text" name="stat_2_value" value="${ac.stat_2_value}" class="w-24 px-3 py-2 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]" />
                  <input type="text" name="stat_2_label" value="${ac.stat_2_label}" class="flex-1 px-3 py-2 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]" />
                </div>
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">آمار ۳ (مقدار و عنوان)</label>
                <div class="flex gap-2">
                  <input type="text" name="stat_3_value" value="${ac.stat_3_value}" class="w-24 px-3 py-2 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]" />
                  <input type="text" name="stat_3_label" value="${ac.stat_3_label}" class="flex-1 px-3 py-2 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]" />
                </div>
              </div>
            </div>
          </div>

          <div class="p-6 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] space-y-4">
            <h3 class="font-display text-[17px] font-bold text-[#231912] border-b border-[#E6D8C5] pb-2.5">
              ۳. تنظیمات بخش «معرفی مدیر باشگاه»
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">نام کامل مدیر در صفحه اصلی</label>
                <input type="text" name="mgr_name" value="${am.full_name}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">عنوان و سمت علمی</label>
                <input type="text" name="mgr_role" value="${am.role_title}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]" />
              </div>
              <div class="sm:col-span-2">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">جمله نقل‌قول (Quote)</label>
                <input type="text" name="mgr_quote" value="${am.quote_text}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]" />
              </div>
              <div class="sm:col-span-2">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">خط سوابق و مدارک</label>
                <input type="text" name="mgr_creds" value="${am.credentials_line}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]" />
              </div>
            </div>
          </div>

          <div class="p-6 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] space-y-4">
            <h3 class="font-display text-[17px] font-bold text-[#231912] border-b border-[#E6D8C5] pb-2.5">
              ۴. تنظیمات بخش «ارتباط با ما»
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="sm:col-span-2">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">تیتر بخش ارتباط با ما</label>
                <input type="text" name="contact_title" value="${ci.title}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]" />
              </div>
              <div class="sm:col-span-2">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">نشانی باشگاه</label>
                <input type="text" name="contact_address" value="${ci.address}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">ساعات برگزاری نشست‌ها</label>
                <input type="text" name="contact_hours" value="${ci.meeting_hours}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">شماره تماس</label>
                <input type="text" name="contact_phone" value="${ci.phone}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">ایمیل ارتباطی</label>
                <input type="text" name="contact_email" dir="ltr" value="${ci.email}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-left" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">شناسه تلگرام</label>
                <input type="text" name="contact_telegram" dir="ltr" value="${ci.telegram_handle}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-left" />
              </div>
            </div>
          </div>

          ${
            homeSettingsSavedBanner
              ? `
            <div class="p-4 rounded-xl bg-[#E4F2E7] border border-[#BBD9C2] text-[#235332] text-[13.5px] font-semibold">
              ✓ ${toPersianDigits(homeSettingsSavedBanner)}
            </div>
          `
              : ''
          }

          <div class="flex justify-end">
            <button
              type="button"
              class="js-admin-save-home-settings px-7 py-3 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[14px] font-semibold cursor-pointer shadow-sm"
            >
              ذخیره تمامی تنظیمات صفحه اصلی در دیتابیس
            </button>
          </div>
        </form>
      </div>
    `;
  }

  function getActiveTabContent(): string {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboardTab();
      case 'gallery':
        return renderGalleryTab();
      case 'sessions':
        return renderSessionsTab();
      case 'classes':
        return renderClassesTab();
      case 'users':
        return renderUsersTab();
      case 'tickets':
        return renderTicketsTab();
      case 'announcements':
        return renderAnnouncementsTab();
      case 'profile':
        return renderProfileTab();
      case 'blog':
        return renderBlogTab();
      case 'comments':
        return renderCommentsTab();
      case 'home_settings':
        return renderHomeSettingsTab();
      default:
        return renderDashboardTab();
    }
  }

  function render(): void {
    const navItems: { key: AdminTabKey; label: string; badge?: string }[] = [
      { key: 'dashboard', label: 'داشبورد' },
      {
        key: 'gallery',
        label: 'گالری تصاویر',
        badge: toPersianDigits(state.gallery.length),
      },
      {
        key: 'sessions',
        label: 'مدیریت جلسات',
        badge: toPersianDigits(state.sessions.length),
      },
      {
        key: 'classes',
        label: 'مدیریت کلاس ها',
        badge: toPersianDigits(state.classes.length),
      },
      {
        key: 'users',
        label: 'مدیریت کاربران',
        badge: toPersianDigits(state.users.length),
      },
      {
        key: 'tickets',
        label: 'تیکت',
        badge: toPersianDigits(state.tickets.length),
      },
      {
        key: 'announcements',
        label: 'اطلاعیه ها',
        badge: toPersianDigits(state.announcements.length),
      },
      { key: 'profile', label: 'پروفایل' },
      {
        key: 'blog',
        label: 'وبلاگ و مقالات',
        badge: toPersianDigits(state.blogPosts.length),
      },
      {
        key: 'comments',
        label: 'نظرات کاربران',
        badge: toPersianDigits(state.comments.length),
      },
      { key: 'home_settings', label: 'تنظیمات صفحه اصلی' },
    ];

    $wrapper.html(`
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        <!-- Sidebar Navigation -->
        <aside class="lg:col-span-3 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] p-5 lg:sticky lg:top-24">
          <div class="flex items-center gap-3.5 pb-4 mb-4 border-b border-[#E6D8C5]">
            <div class="w-12 h-12 rounded-2xl bg-[#5A3A22] text-[#FAF5EC] font-display text-[19px] font-bold flex items-center justify-center shrink-0 overflow-hidden">
              ${
                state.admin.avatar_url
                  ? `<img src="${state.admin.avatar_url}" alt="${state.admin.first_name}" class="w-full h-full object-cover" />`
                  : state.admin.first_name.charAt(0)
              }
            </div>
            <div class="min-w-0">
              <div class="font-bold text-[15px] text-[#231912] truncate">
                ${state.admin.first_name} ${state.admin.last_name}
              </div>
              <div class="text-[11.5px] text-[#235332] font-semibold truncate">مدیر ارشد باشگاه بوک‌میت</div>
            </div>
          </div>

          <nav class="space-y-1.5" aria-label="منوی پنل مدیریت">
            ${navItems
              .map((item) => {
                const isActive = activeTab === item.key;
                return `
                  <button
                    type="button"
                    data-admin-tab="${item.key}"
                    class="js-admin-tab-btn w-full px-4 py-2.5 rounded-xl text-right text-[13px] font-semibold flex items-center justify-between transition-all cursor-pointer ${
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
              class="js-admin-back-to-site w-full px-4 py-2.5 rounded-xl text-[12.5px] font-semibold text-[#5B4636] hover:bg-[#EFE3D2] text-right transition-colors cursor-pointer"
            >
              ← مشاهده صفحه اصلی سایت
            </button>
            <button
              type="button"
              class="js-admin-logout w-full px-4 py-2.5 rounded-xl text-[12.5px] font-semibold text-[#9E3329] hover:bg-[#FBEAE8] text-right transition-colors cursor-pointer"
            >
              خروج از پنل مدیریت
            </button>
          </div>
        </aside>

        <!-- Main Content Area -->
        <main class="lg:col-span-9 min-w-0">
          ${getActiveTabContent()}
        </main>
      </div>
      ${renderModals()}
    `);
  }

  // ==================== EVENT HANDLERS ====================
  $wrapper.on('click', '.js-admin-tab-btn', function () {
    const tab = $(this).data('admin-tab') as AdminTabKey;
    if (tab) {
      activeTab = tab;
      editingSession = null;
      managingSubSessionsForSessionId = null;
      editingSubSession = null;
      editingClass = null;
      managingSubSessionsForClassId = null;
      editingUser = null;
      editingAnnouncement = null;
      editingBlogPost = null;
      blogPageMode = 'list';
      adminProfileSavedBanner = '';
      homeSettingsSavedBanner = '';
      notifyRoute();
      render();
    }
  });

  $wrapper.on('click', '.js-admin-switch-tab', function () {
    const tab = $(this).data('admin-switch') as AdminTabKey;
    if (tab) {
      activeTab = tab;
      managingSubSessionsForSessionId = null;
      managingSubSessionsForClassId = null;
      editingSubSession = null;
      blogPageMode = 'list';
      notifyRoute();
      render();
    }
  });

  $wrapper.on('click', '.js-admin-back-to-site', () => {
    props.onBackToSite();
  });

  $wrapper.on('click', '.js-admin-logout', () => {
    props.onLogout();
  });

  // --- Universal Delete Confirmation Modal Handlers ---
  $wrapper.on('click', '.js-admin-cancel-delete-modal', () => {
    pendingDeleteConfirm = null;
    render();
  });

  $wrapper.on('click', '.js-admin-confirm-backdrop', function (e) {
    if ($(e.target).hasClass('js-admin-confirm-backdrop')) {
      pendingDeleteConfirm = null;
      render();
    }
  });

  $wrapper.on('click', '.js-admin-confirm-delete-modal', () => {
    if (pendingDeleteConfirm) {
      const fn = pendingDeleteConfirm.onConfirm;
      pendingDeleteConfirm = null;
      fn();
    }
  });

  // --- Gallery Picker Modal Handlers ---
  $wrapper.on('click', '.js-admin-open-gallery-picker', function () {
    const target = $(this).data('gallery-target') as 'session' | 'class' | 'blog';
    galleryPickerTarget = target;
    render();
  });

  $wrapper.on('click', '.js-admin-close-gallery-picker', () => {
    galleryPickerTarget = null;
    render();
  });

  $wrapper.on('click', '.js-admin-gallery-picker-backdrop', function (e) {
    if ($(e.target).hasClass('js-admin-gallery-picker-backdrop')) {
      galleryPickerTarget = null;
      render();
    }
  });

  $wrapper.on('click', '.js-admin-pick-gallery-item', function () {
    const url = String($(this).data('pick-image-url') || '');
    if (!url) return;
    if (galleryPickerTarget === 'session' && editingSession) {
      editingSession.cover_url = url;
    } else if (galleryPickerTarget === 'class' && editingClass) {
      editingClass.cover_url = url;
    } else if (galleryPickerTarget === 'blog' && editingBlogPost) {
      editingBlogPost.cover_url = url;
    }
    galleryPickerTarget = null;
    render();
    showToast('تصویر کاور از گالری تصاویر انتخاب شد.');
  });

  // --- Gallery Tab Handlers ---
  $wrapper.on('input', '.js-admin-gallery-search', function () {
    gallerySearch = String($(this).val() || '');
    render();
    $wrapper.find('.js-admin-gallery-search').trigger('focus');
  });

  $wrapper.on('click', '.js-admin-gallery-cat', function () {
    galleryCategoryFilter = String($(this).data('gallery-cat') || 'all');
    render();
  });

  $wrapper.on('click', '.js-admin-trigger-gallery-file', () => {
    $wrapper.find('.js-admin-gallery-file-input').trigger('click');
  });

  $wrapper.on('change', '.js-admin-gallery-file-input', function (event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    resizeImageToDataUrl(file, 520).then((dataUrl) => {
      newGalleryImageUrl = dataUrl;
      render();
      showToast('فایل تصویر بارگذاری شد؛ اکنون دکمه «ثبت در گالری» را بزنید.');
    });
  });

  $wrapper.on('submit', '.js-admin-gallery-form', function (e) {
    e.preventDefault();
    const $f = $(this);
    const title = String($f.find('[name="title"]').val() || '').trim();
    const category = 'کاور کتاب';
    const url = newGalleryImageUrl || '/assets/book-current.png';

    ApiService.saveAdminGalleryImage({ title, category, url })
      .then((res) => {
        state.gallery = [res.image, ...state.gallery];
        newGalleryImageUrl = '';
        render();
        showToast('تصویر جدید با موفقیت به گالری اضافه شد.');
      })
      .catch((err) => showToast(err.message || 'خطا در ثبت تصویر', true));
  });

  $wrapper.on('click', '.js-admin-delete-gallery', function () {
    const id = Number($(this).data('delete-gallery'));
    const target = state.gallery.find((g) => g.id === id);
    askDeleteConfirmation(
      'حذف تصویر از گالری',
      `آیا از حذف تصویر «${target?.title || ''}» از گالری تصاویر اطمینان دارید؟`,
      () => {
        ApiService.deleteAdminGalleryImage(id)
          .then(() => {
            state.gallery = state.gallery.filter((g) => g.id !== id);
            render();
            showToast('تصویر از گالری حذف شد.');
          })
          .catch((err) => showToast(err.message || 'خطا در حذف تصویر', true));
      }
    );
  });

  // --- Sessions Handlers ---
  $wrapper.on('input', '.js-admin-session-search', function () {
    sessionSearch = String($(this).val() || '');
    render();
    $wrapper.find('.js-admin-session-search').trigger('focus');
  });

  $wrapper.on('click', '.js-admin-session-filter', function () {
    sessionStatusFilter = $(this).data('session-filter') as 'all' | 'فعال' | 'غیرفعال';
    render();
  });

  $wrapper.on('click', '.js-admin-new-session-btn', () => {
    editingSession = {
      title: '',
      book_title: '',
      book_author: '',
      pages_count: 350,
      publisher: '',
      mentor_name: 'دکتر سهراب رستگار',
      session_date: 'چهارشنبه‌ها · آذر ۱۴۰۵',
      session_time: 'ساعت ۱۸:۰۰ تا ۲۰:۰۰',
      status: 'فعال',
      cover_url: state.gallery[0]?.url || '/assets/book-current.png',
    };
    render();
  });

  $wrapper.on('click', '.js-admin-edit-session', function () {
    const id = Number($(this).data('edit-session'));
    const found = state.sessions.find((s) => s.id === id);
    if (found) {
      editingSession = { ...found };
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  $wrapper.on('click', '.js-admin-cancel-session', () => {
    editingSession = null;
    render();
  });

  $wrapper.on('submit', '.js-admin-session-form', function (e) {
    e.preventDefault();
    const $f = $(this);
    const id = Number($f.find('[name="id"]').val() || 0) || undefined;
    const payload: Partial<MemberSession> & { id?: number } = {
      id,
      title: String($f.find('[name="title"]').val() || '').trim(),
      book_title: String($f.find('[name="book_title"]').val() || '').trim(),
      book_author: String($f.find('[name="book_author"]').val() || '').trim(),
      pages_count: Number($f.find('[name="pages_count"]').val() || 320),
      publisher: String($f.find('[name="publisher"]').val() || '').trim(),
      mentor_name: String($f.find('[name="mentor_name"]').val() || '').trim(),
      session_date: String($f.find('[name="session_date"]').val() || '').trim(),
      session_time: String($f.find('[name="session_time"]').val() || '').trim(),
      status: String($f.find('[name="status"]').val() || 'فعال') as MemberSession['status'],
      cover_url: String($f.find('[name="cover_url"]').val() || '/assets/book-current.png').trim(),
    };
    ApiService.saveAdminSession(payload)
      .then((res) => {
        if (id) {
          state.sessions = state.sessions.map((s) => (s.id === id ? res.session : s));
        } else {
          state.sessions = [res.session, ...state.sessions];
        }
        editingSession = null;
        render();
        showToast('اطلاعات دوره هم‌خوانی در دیتابیس ذخیره شد.');
      })
      .catch((err) => showToast(err.message || 'خطا در ذخیره جلسه', true));
  });

  $wrapper.on('click', '.js-admin-delete-session', function () {
    const id = Number($(this).data('delete-session'));
    const target = state.sessions.find((s) => s.id === id);
    askDeleteConfirmation(
      'حذف دوره هم‌خوانی',
      `آیا از حذف دوره «${target?.title || ''}» اطمینان دارید؟`,
      () => {
        ApiService.deleteAdminSession(id)
          .then(() => {
            state.sessions = state.sessions.filter((s) => s.id !== id);
            render();
            showToast('دوره هم‌خوانی از دیتابیس حذف شد.');
          })
          .catch((err) => showToast(err.message || 'خطا در حذف جلسه', true));
      }
    );
  });

  $wrapper.on('click', '.js-admin-manage-session-subs', function () {
    managingSubSessionsForSessionId = Number($(this).data('manage-session-subs'));
    editingSubSession = null;
    isAddingSubSession = false;
    subSessionSearch = '';
    subSessionStatusFilter = 'all';
    notifyRoute();
    render();
  });

  // --- Sub-Sessions (Shared for Sessions & Classes) ---
  $wrapper.on('click', '.js-admin-open-add-subsession', () => {
    isAddingSubSession = true;
    editingSubSession = null;
    render();
  });

  $wrapper.on('input', '.js-admin-subsession-search', function () {
    subSessionSearch = String($(this).val() || '');
    render();
    $wrapper.find('.js-admin-subsession-search').trigger('focus');
  });

  $wrapper.on('click', '.js-admin-subsession-filter', function () {
    subSessionStatusFilter = $(this).data('subsession-filter') as
      | 'all'
      | 'جلسه آتی'
      | 'برگزار شده';
    render();
  });

  $wrapper.on('click', '.js-admin-close-subs-view', () => {
    managingSubSessionsForSessionId = null;
    managingSubSessionsForClassId = null;
    editingSubSession = null;
    isAddingSubSession = false;
    notifyRoute();
    render();
  });

  $wrapper.on('click', '.js-admin-edit-subsession', function () {
    const parentType = String($(this).data('parent-type')) as 'session' | 'class';
    const parentId = Number($(this).data('parent-id'));
    const subId = Number($(this).data('sub-id'));

    const parent =
      parentType === 'session'
        ? state.sessions.find((s) => s.id === parentId)
        : state.classes.find((c) => c.id === parentId);
    const foundSub = (parent?.sub_sessions || []).find((sub) => sub.id === subId);
    if (foundSub) {
      editingSubSession = { ...foundSub };
      isAddingSubSession = false;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  $wrapper.on('click', '.js-admin-cancel-subsession-edit', () => {
    editingSubSession = null;
    isAddingSubSession = false;
    render();
  });

  $wrapper.on('submit', '.js-admin-add-subsession-form', function (e) {
    e.preventDefault();
    const $f = $(this);
    const parentType = String($f.data('parent-type')) as 'session' | 'class';
    const parentId = Number($f.data('parent-id'));
    const existingSubId = Number($f.find('[name="sub_id"]').val() || 0) || undefined;

    const subItemData: SessionSubItem = {
      id: existingSubId || Date.now(),
      session_number: String($f.find('[name="session_number"]').val() || 'جلسه جدید').trim(),
      title: String($f.find('[name="title"]').val() || '').trim(),
      status: String($f.find('[name="status"]').val() || 'جلسه آتی') as
        | 'جلسه آتی'
        | 'برگزار شده',
      session_date: String($f.find('[name="session_date"]').val() || '').trim(),
      session_time: String($f.find('[name="session_time"]').val() || '').trim(),
      pages_to_read: String($f.find('[name="pages_to_read"]').val() || '').trim(),
      pages_read: editingSubSession?.pages_read || 95,
      meeting_link: String($f.find('[name="meeting_link"]').val() || '').trim(),
      reviewed_topics: editingSubSession?.reviewed_topics || '',
      session_notes: editingSubSession?.session_notes || '',
      cover_url: editingSubSession?.cover_url || '/assets/book-current.png',
    };

    if (parentType === 'session') {
      const target = state.sessions.find((s) => s.id === parentId);
      if (!target) return;
      const updatedSubs = existingSubId
        ? (target.sub_sessions || []).map((sub) =>
            sub.id === existingSubId ? subItemData : sub
          )
        : [...(target.sub_sessions || []), subItemData];
      ApiService.saveAdminSession({ id: target.id, sub_sessions: updatedSubs }).then(
        (res) => {
          state.sessions = state.sessions.map((s) =>
            s.id === target.id ? res.session : s
          );
          editingSubSession = null;
          isAddingSubSession = false;
          render();
          showToast(
            existingSubId
              ? 'کارت جلسه با موفقیت ویرایش شد.'
              : 'کارت جلسه جدید به این دوره اضافه شد.'
          );
        }
      );
    } else {
      const target = state.classes.find((c) => c.id === parentId);
      if (!target) return;
      const updatedSubs = existingSubId
        ? (target.sub_sessions || []).map((sub) =>
            sub.id === existingSubId ? subItemData : sub
          )
        : [...(target.sub_sessions || []), subItemData];
      ApiService.saveAdminClass({ id: target.id, sub_sessions: updatedSubs }).then(
        (res) => {
          state.classes = state.classes.map((c) =>
            c.id === target.id ? res.classItem : c
          );
          editingSubSession = null;
          isAddingSubSession = false;
          render();
          showToast(
            existingSubId
              ? 'کارت جلسه با موفقیت ویرایش شد.'
              : 'کارت جلسه جدید به این کلاس اضافه شد.'
          );
        }
      );
    }
  });

  $wrapper.on('click', '.js-admin-delete-subsession', function () {
    const parentType = String($(this).data('parent-type')) as 'session' | 'class';
    const parentId = Number($(this).data('parent-id'));
    const subId = Number($(this).data('sub-id'));

    askDeleteConfirmation(
      'حذف کارت جلسه',
      'آیا از حذف این کارت جلسه اطمینان دارید؟',
      () => {
        if (parentType === 'session') {
          const target = state.sessions.find((s) => s.id === parentId);
          if (!target) return;
          const updatedSubs = (target.sub_sessions || []).filter(
            (sub) => sub.id !== subId
          );
          ApiService.saveAdminSession({ id: target.id, sub_sessions: updatedSubs }).then(
            (res) => {
              state.sessions = state.sessions.map((s) =>
                s.id === target.id ? res.session : s
              );
              render();
              showToast('کارت جلسه حذف شد.');
            }
          );
        } else {
          const target = state.classes.find((c) => c.id === parentId);
          if (!target) return;
          const updatedSubs = (target.sub_sessions || []).filter(
            (sub) => sub.id !== subId
          );
          ApiService.saveAdminClass({ id: target.id, sub_sessions: updatedSubs }).then(
            (res) => {
              state.classes = state.classes.map((c) =>
                c.id === target.id ? res.classItem : c
              );
              render();
              showToast('کارت جلسه از کلاس حذف شد.');
            }
          );
        }
      }
    );
  });

  // --- Classes Handlers ---
  $wrapper.on('input', '.js-admin-class-search', function () {
    classSearch = String($(this).val() || '');
    render();
    $wrapper.find('.js-admin-class-search').trigger('focus');
  });

  $wrapper.on('click', '.js-admin-class-filter', function () {
    classStatusFilter = $(this).data('class-filter') as 'all' | 'فعال' | 'غیرفعال';
    render();
  });

  $wrapper.on('click', '.js-admin-new-class-btn', () => {
    editingClass = {
      title: '',
      book_title: '',
      instructor_name: 'دکتر سهراب رستگار',
      schedule_summary: 'دوشنبه‌ها · ساعت ۱۷:۳۰ تا ۱۹:۳۰',
      level_label: 'مبتدی',
      status: 'فعال',
      cover_url: state.gallery[5]?.url || '/assets/blog-1.png',
      description: '',
    };
    render();
  });

  $wrapper.on('click', '.js-admin-edit-class', function () {
    const id = Number($(this).data('edit-class'));
    const found = state.classes.find((c) => c.id === id);
    if (found) {
      editingClass = { ...found };
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  $wrapper.on('click', '.js-admin-cancel-class', () => {
    editingClass = null;
    render();
  });

  $wrapper.on('submit', '.js-admin-class-form', function (e) {
    e.preventDefault();
    const $f = $(this);
    const id = Number($f.find('[name="id"]').val() || 0) || undefined;
    const payload: Partial<MemberClassItem> & { id?: number } = {
      id,
      title: String($f.find('[name="title"]').val() || '').trim(),
      book_title: String($f.find('[name="book_title"]').val() || '').trim(),
      instructor_name: String($f.find('[name="instructor_name"]').val() || '').trim(),
      schedule_summary: String($f.find('[name="schedule_summary"]').val() || '').trim(),
      level_label: String($f.find('[name="level_label"]').val() || 'مبتدی').trim(),
      status: String($f.find('[name="status"]').val() || 'فعال') as MemberClassItem['status'],
      cover_url: String($f.find('[name="cover_url"]').val() || '/assets/blog-1.png').trim(),
      description: String($f.find('[name="description"]').val() || '').trim(),
    };
    ApiService.saveAdminClass(payload)
      .then((res) => {
        if (id) {
          state.classes = state.classes.map((c) => (c.id === id ? res.classItem : c));
        } else {
          state.classes = [res.classItem, ...state.classes];
        }
        editingClass = null;
        render();
        showToast('اطلاعات کلاس در دیتابیس ذخیره شد.');
      })
      .catch((err) => showToast(err.message || 'خطا در ذخیره کلاس', true));
  });

  $wrapper.on('click', '.js-admin-delete-class', function () {
    const id = Number($(this).data('delete-class'));
    const target = state.classes.find((c) => c.id === id);
    askDeleteConfirmation(
      'حذف کلاس آموزشی',
      `آیا از حذف کلاس «${target?.title || ''}» اطمینان دارید؟`,
      () => {
        ApiService.deleteAdminClass(id)
          .then(() => {
            state.classes = state.classes.filter((c) => c.id !== id);
            render();
            showToast('کلاس آموزشی حذف شد.');
          })
          .catch((err) => showToast(err.message || 'خطا در حذف کلاس', true));
      }
    );
  });

  $wrapper.on('click', '.js-admin-manage-class-subs', function () {
    managingSubSessionsForClassId = Number($(this).data('manage-class-subs'));
    editingSubSession = null;
    isAddingSubSession = false;
    subSessionSearch = '';
    subSessionStatusFilter = 'all';
    notifyRoute();
    render();
  });

  // --- Enrolled Members Handlers (Approve / Cancel with Confirmation Modal + Send Ticket Modal) ---
  $wrapper.on('click', '.js-admin-approve-enrollment', function () {
    const targetType = String($(this).data('enroll-type')) as 'session' | 'class';
    const targetId = Number($(this).data('enroll-id'));
    const targetTitle = String($(this).data('enroll-title') || '');
    const memberPhone = String($(this).data('member-phone') || '');
    const memberName = String($(this).data('member-name') || 'کاربر');

    askDeleteConfirmation(
      'تایید ثبت‌نام و فعال‌سازی دوره / نشست',
      `آیا از تایید ثبت‌نام «${memberName}» (${memberPhone}) در «${targetTitle}» اطمینان دارید؟ پس از تایید شما، وضعیت این دوره برای کاربر به «فعال» تغییر می‌یابد.`,
      () => {
        ApiService.updateAdminEnrollmentStatus({
          target_type: targetType,
          target_id: targetId,
          member_phone: memberPhone,
          status: 'فعال',
        })
          .then((res) => {
            if (targetType === 'session' && res.session) {
              state.sessions = state.sessions.map((s) =>
                s.id === targetId ? res.session! : s
              );
            } else if (targetType === 'class' && res.classItem) {
              state.classes = state.classes.map((c) =>
                c.id === targetId ? res.classItem! : c
              );
            }
            render();
            showToast(
              `ثبت‌نام «${memberName}» تایید شد و دوره برای ایشان فعال گردید.`
            );
          })
          .catch((err) => showToast(err.message || 'خطا در تایید ثبت‌نام', true));
      },
      { confirmLabel: 'بله، تایید و فعال شود', confirmTone: 'success' }
    );
  });

  $wrapper.on('click', '.js-admin-cancel-enrollment', function () {
    const targetType = String($(this).data('enroll-type')) as 'session' | 'class';
    const targetId = Number($(this).data('enroll-id'));
    const targetTitle = String($(this).data('enroll-title') || '');
    const memberPhone = String($(this).data('member-phone') || '');
    const memberName = String($(this).data('member-name') || 'کاربر');

    askDeleteConfirmation(
      'لغو ثبت‌نام عضو',
      `آیا از لغو ثبت‌نام «${memberName}» (${memberPhone}) در «${targetTitle}» اطمینان دارید؟`,
      () => {
        ApiService.updateAdminEnrollmentStatus({
          target_type: targetType,
          target_id: targetId,
          member_phone: memberPhone,
          status: 'لغو شده',
        })
          .then((res) => {
            if (targetType === 'session' && res.session) {
              state.sessions = state.sessions.map((s) =>
                s.id === targetId ? res.session! : s
              );
            } else if (targetType === 'class' && res.classItem) {
              state.classes = state.classes.map((c) =>
                c.id === targetId ? res.classItem! : c
              );
            }
            render();
            showToast(`ثبت‌نام «${memberName}» در این دوره لغو گردید.`);
          })
          .catch((err) => showToast(err.message || 'خطا در لغو ثبت‌نام', true));
      },
      { confirmLabel: 'بله، ثبت‌نام لغو شود', confirmTone: 'danger' }
    );
  });

  $wrapper.on('click', '.js-admin-ticket-enrollment', function () {
    const targetTitle = String($(this).data('enroll-title') || '');
    const memberPhone = String($(this).data('member-phone') || '');
    const memberName = String($(this).data('member-name') || 'کاربر');
    ticketTargetEnrollment = {
      member_phone: memberPhone,
      member_name: memberName,
      course_or_session_title: targetTitle,
    };
    render();
  });

  $wrapper.on('click', '.js-admin-close-member-ticket', () => {
    ticketTargetEnrollment = null;
    render();
  });

  $wrapper.on('click', '.js-admin-member-ticket-backdrop', function (e) {
    if ($(e.target).hasClass('js-admin-member-ticket-backdrop')) {
      ticketTargetEnrollment = null;
      render();
    }
  });

  $wrapper.on('submit', '.js-admin-member-ticket-form', function (e) {
    e.preventDefault();
    if (!ticketTargetEnrollment) return;
    const targetInfo = ticketTargetEnrollment;
    const $f = $(this);
    const subject = String($f.find('[name="ticket_subject"]').val() || '').trim();
    const department = String(
      $f.find('[name="ticket_department"]').val() || 'امور ثبت‌نام و دوره‌ها'
    ).trim();
    const priority = String($f.find('[name="ticket_priority"]').val() || 'مهم') as
      | 'عادی'
      | 'مهم'
      | 'فوری';
    const message = String($f.find('[name="ticket_message"]').val() || '').trim();
    if (!subject || !message) return;

    ApiService.createMemberTicket({
      member_phone: targetInfo.member_phone,
      subject,
      department,
      priority,
      message,
    })
      .then((res) => {
        state.tickets = [res.ticket, ...state.tickets];
        ticketTargetEnrollment = null;
        render();
        showToast(
          `تیکت اختصاصی برای «${targetInfo.member_name}» با موفقیت ارسال و ثبت شد.`
        );
      })
      .catch((err) => showToast(err.message || 'خطا در ارسال تیکت', true));
  });

  // --- Users Handlers ---
  $wrapper.on('input', '.js-admin-user-search', function () {
    userSearch = String($(this).val() || '');
    render();
    $wrapper.find('.js-admin-user-search').trigger('focus');
  });

  $wrapper.on('click', '.js-admin-user-filter', function () {
    userStatusFilter = $(this).data('user-filter') as 'all' | 'فعال' | 'غیرفعال';
    render();
  });

  $wrapper.on('click', '.js-admin-new-user-btn', () => {
    editingUser = {
      first_name: '',
      last_name: '',
      phone: '',
      education: 'کارشناسی ارشد',
      favorite_genre: 'ادبیات داستانی و رمان کلاسیک',
      email: '',
      membership_code: `BM-۱۴۰۵-${120 + state.users.length}`,
      bio: '',
    };
    render();
  });

  $wrapper.on('click', '.js-admin-cancel-user', () => {
    editingUser = null;
    render();
  });

  $wrapper.on('submit', '.js-admin-user-form', function (e) {
    e.preventDefault();
    const $f = $(this);
    const id = Number($f.find('[name="id"]').val() || 0) || undefined;
    const payload = {
      id,
      first_name: String($f.find('[name="first_name"]').val() || '').trim(),
      last_name: String($f.find('[name="last_name"]').val() || '').trim(),
      phone: toPersianDigits(String($f.find('[name="phone"]').val() || '').trim()),
      education: String($f.find('[name="education"]').val() || 'کارشناسی ارشد').trim(),
      favorite_genre: String($f.find('[name="favorite_genre"]').val() || '').trim(),
      email: String($f.find('[name="email"]').val() || '').trim(),
      membership_code: String($f.find('[name="membership_code"]').val() || '').trim(),
      password: String($f.find('[name="password"]').val() || '').trim() || undefined,
      bio: String($f.find('[name="bio"]').val() || '').trim(),
    };
    ApiService.saveAdminUser(payload)
      .then((res) => {
        if (id) {
          state.users = state.users.map((u) => (u.id === id ? res.user : u));
        } else {
          state.users = [...state.users, res.user];
        }
        editingUser = null;
        render();
        showToast('اطلاعات کاربر در دیتابیس ذخیره شد.');
      })
      .catch((err) => showToast(err.message || 'خطا در ذخیره کاربر', true));
  });

  // 1. Toggle User Active / Inactive
  $wrapper.on('click', '.js-admin-toggle-user-status', function () {
    const id = Number($(this).data('toggle-user'));
    const target = state.users.find((u) => u.id === id);
    if (!target) return;
    const nextStatus: 'فعال' | 'غیرفعال' =
      (target.status || 'فعال') === 'فعال' ? 'غیرفعال' : 'فعال';
    ApiService.saveAdminUser({ id: target.id, status: nextStatus })
      .then((res) => {
        state.users = state.users.map((u) => (u.id === id ? res.user : u));
        render();
        showToast(
          `وضعیت حساب کاربری «${target.first_name} ${target.last_name}» به «${nextStatus}» تغییر یافت.`
        );
      })
      .catch((err) => showToast(err.message || 'خطا در تغییر وضعیت کاربر', true));
  });

  // 2. Reset User Password Modal
  $wrapper.on('click', '.js-admin-reset-user-password', function () {
    const id = Number($(this).data('reset-pass-user'));
    const target = state.users.find((u) => u.id === id);
    if (!target) return;
    resetPasswordTargetUser = target;
    render();
  });

  $wrapper.on('click', '.js-admin-close-reset-pass', () => {
    resetPasswordTargetUser = null;
    render();
  });

  $wrapper.on('click', '.js-admin-reset-pass-backdrop', function (e) {
    if ($(e.target).hasClass('js-admin-reset-pass-backdrop')) {
      resetPasswordTargetUser = null;
      render();
    }
  });

  $wrapper.on('submit', '.js-admin-reset-pass-form', function (e) {
    e.preventDefault();
    if (!resetPasswordTargetUser) return;
    const targetUser = resetPasswordTargetUser;
    const newPassword = String($(this).find('[name="new_user_password"]').val() || '1234').trim();
    ApiService.saveAdminUser({ id: targetUser.id, password: newPassword })
      .then(() => {
        resetPasswordTargetUser = null;
        render();
        showToast(
          `رمز عبور کاربر «${targetUser.first_name} ${targetUser.last_name}» با موفقیت ریست شد.`
        );
      })
      .catch((err) => showToast(err.message || 'خطا در ریست رمز عبور', true));
  });

  // 3. Send Personal Announcement to User Modal
  $wrapper.on('click', '.js-admin-open-user-notify-modal', function () {
    const id = Number($(this).data('notify-user'));
    const target = state.users.find((u) => u.id === id);
    if (!target) return;
    notifyTargetUser = target;
    render();
  });

  $wrapper.on('click', '.js-admin-close-user-notify', () => {
    notifyTargetUser = null;
    render();
  });

  $wrapper.on('click', '.js-admin-user-notify-backdrop', function (e) {
    if ($(e.target).hasClass('js-admin-user-notify-backdrop')) {
      notifyTargetUser = null;
      render();
    }
  });

  $wrapper.on('submit', '.js-admin-user-notify-form', function (e) {
    e.preventDefault();
    if (!notifyTargetUser) return;
    const targetUser = notifyTargetUser;
    const title = String($(this).find('[name="notify_title"]').val() || '').trim();
    const content = String($(this).find('[name="notify_content"]').val() || '').trim();
    if (!title || !content) return;

    ApiService.saveAdminAnnouncement({
      title,
      category: 'اطلاعیه شخصی',
      published_date: '۱۴ آبان ۱۴۰۵',
      is_important: 1,
      summary: content.slice(0, 140),
      content,
      target_user_phone: targetUser.phone,
      target_user_name: `${targetUser.first_name} ${targetUser.last_name}`,
    })
      .then((res) => {
        state.announcements = [res.announcement, ...state.announcements];
        notifyTargetUser = null;
        render();
        showToast(
          `اطلاعیه اختصاصی فقط برای «${targetUser.first_name} ${targetUser.last_name}» ارسال شد.`
        );
      })
      .catch((err) => showToast(err.message || 'خطا در ارسال اطلاعیه', true));
  });

  // 4. Delete User
  $wrapper.on('click', '.js-admin-delete-user', function () {
    const id = Number($(this).data('delete-user'));
    const target = state.users.find((u) => u.id === id);
    askDeleteConfirmation(
      'حذف حساب کاربری',
      `آیا از حذف کاربر «${target ? `${target.first_name} ${target.last_name}` : ''}» اطمینان دارید؟`,
      () => {
        ApiService.deleteAdminUser(id)
          .then(() => {
            state.users = state.users.filter((u) => u.id !== id);
            render();
            showToast('کاربر از دیتابیس حذف شد.');
          })
          .catch((err) => showToast(err.message || 'خطا در حذف کاربر', true));
      }
    );
  });

  // --- Tickets Handlers ---
  $wrapper.on('click', '.js-admin-ticket-filter', function () {
    ticketFilter = $(this).data('ticket-filter');
    render();
  });

  $wrapper.on('click', '.js-admin-save-ticket', function () {
    const id = Number($(this).data('save-ticket'));
    const $card = $wrapper.find(`[data-admin-ticket-card="${id}"]`);
    const $textarea = $card.find('.js-admin-ticket-reply-input');
    const admin_reply = String($textarea.val() || '').trim();
    const status = String(
      $card.find('.js-admin-ticket-status-select').val() || 'پاسخ داده‌شده'
    ) as MemberTicket['status'];

    if (!admin_reply) {
      showToast('لطفاً متن پاسخ را وارد نمایید.', true);
      return;
    }

    ApiService.replyAdminTicket({ id, admin_reply, status })
      .then((res) => {
        state.tickets = state.tickets.map((t) => (t.id === id ? res.ticket : t));
        $textarea.val('');
        render();
        showToast('پاسخ شما به تیکت اضافه شد.');
      })
      .catch((err) => showToast(err.message || 'خطا در ثبت پاسخ تیکت', true));
  });

  $wrapper.on('click', '.js-admin-delete-ticket', function () {
    const id = Number($(this).data('delete-ticket'));
    const target = state.tickets.find((t) => t.id === id);
    askDeleteConfirmation(
      'حذف تیکت',
      `آیا از حذف تیکت «${target?.subject || ''}» اطمینان دارید؟`,
      () => {
        ApiService.deleteAdminTicket(id)
          .then(() => {
            state.tickets = state.tickets.filter((t) => t.id !== id);
            render();
            showToast('تیکت حذف شد.');
          })
          .catch((err) => showToast(err.message || 'خطا در حذف تیکت', true));
      }
    );
  });

  // --- Announcements Handlers ---
  $wrapper.on('click', '.js-admin-new-announcement-btn', () => {
    editingAnnouncement = {
      title: '',
      category: 'جلسات کتابخوانی',
      published_date: '۱۴ آبان ۱۴۰۵',
      is_important: 1,
      content: '',
    };
    render();
  });

  $wrapper.on('click', '.js-admin-edit-announcement', function () {
    const id = Number($(this).data('edit-announcement'));
    const found = state.announcements.find((a) => a.id === id);
    if (found) {
      editingAnnouncement = { ...found };
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  $wrapper.on('click', '.js-admin-cancel-announcement', () => {
    editingAnnouncement = null;
    render();
  });

  $wrapper.on('submit', '.js-admin-announcement-form', function (e) {
    e.preventDefault();
    const $f = $(this);
    const id = Number($f.find('[name="id"]').val() || 0) || undefined;
    const content = String($f.find('[name="content"]').val() || '').trim();
    const payload: Partial<ClubAnnouncement> & { id?: number } = {
      id,
      title: String($f.find('[name="title"]').val() || '').trim(),
      category: String($f.find('[name="category"]').val() || 'جلسات کتابخوانی').trim(),
      published_date: String($f.find('[name="published_date"]').val() || '').trim(),
      is_important: Number($f.find('[name="is_important"]').val() || 0),
      summary: content.slice(0, 140),
      content,
    };
    ApiService.saveAdminAnnouncement(payload)
      .then((res) => {
        if (id) {
          state.announcements = state.announcements.map((a) =>
            a.id === id ? res.announcement : a
          );
        } else {
          state.announcements = [res.announcement, ...state.announcements];
        }
        editingAnnouncement = null;
        render();
        showToast('اطلاعیه در دیتابیس ذخیره شد.');
      })
      .catch((err) => showToast(err.message || 'خطا در ذخیره اطلاعیه', true));
  });

  $wrapper.on('click', '.js-admin-delete-announcement', function () {
    const id = Number($(this).data('delete-announcement'));
    const target = state.announcements.find((a) => a.id === id);
    askDeleteConfirmation(
      'حذف اطلاعیه',
      `آیا از حذف اطلاعیه «${target?.title || ''}» اطمینان دارید؟`,
      () => {
        ApiService.deleteAdminAnnouncement(id)
          .then(() => {
            state.announcements = state.announcements.filter((a) => a.id !== id);
            render();
            showToast('اطلاعیه حذف شد.');
          })
          .catch((err) => showToast(err.message || 'خطا در حذف اطلاعیه', true));
      }
    );
  });

  // --- Admin Profile Handlers ---
  $wrapper.on('click', '.js-admin-trigger-avatar', () => {
    $wrapper.find('.js-admin-avatar-input').trigger('click');
  });

  $wrapper.on('change', '.js-admin-avatar-input', function (event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    resizeImageToDataUrl(file, 320).then((dataUrl) => {
      pendingAdminAvatar = dataUrl;
      render();
      showToast('تصویر جدید انتخاب شد؛ روی «ذخیره تغییرات پروفایل مدیر» کلیک کنید.');
    });
  });

  function handleSaveAdminProfile(): void {
    const $f = $wrapper.find('.js-admin-profile-form');
    if (!$f.length) return;
    const first_name = String($f.find('[name="first_name"]').val() || 'سهراب').trim();
    const last_name = String($f.find('[name="last_name"]').val() || 'رستگار').trim();
    const email = String($f.find('[name="email"]').val() || 'admin@bookmeet.ir').trim();
    const education = String($f.find('[name="education"]').val() || 'دکتری').trim();
    const favorite_genre = String($f.find('[name="favorite_genre"]').val() || '').trim();
    const bio = String($f.find('[name="bio"]').val() || '').trim();
    const new_password = String($f.find('[name="new_password"]').val() || '').trim();

    ApiService.updateAdminProfile({
      first_name,
      last_name,
      email,
      education,
      favorite_genre,
      bio,
      avatar_url: pendingAdminAvatar,
      new_password: new_password || undefined,
    })
      .then((res) => {
        state.admin = res.admin;
        adminProfileSavedBanner = 'اطلاعات پروفایل مدیر با موفقیت در دیتابیس ذخیره شد.';
        props.onAdminUpdated(state.admin);
        render();
        showToast('پروفایل مدیر با موفقیت بروزرسانی شد.');
      })
      .catch((err) => showToast(err.message || 'خطا در ذخیره پروفایل مدیر', true));
  }

  $wrapper.on('click', '.js-admin-save-profile-btn', (e) => {
    e.preventDefault();
    handleSaveAdminProfile();
  });

  $wrapper.on('submit', '.js-admin-profile-form', (e) => {
    e.preventDefault();
    handleSaveAdminProfile();
  });

  // --- Blog Handlers ---
  $wrapper.on('input', '.js-admin-blog-search', function () {
    blogSearch = String($(this).val() || '');
    render();
    $wrapper.find('.js-admin-blog-search').trigger('focus');
  });

  $wrapper.on('click', '.js-admin-new-blog-btn', () => {
    blogPageMode = 'editor';
    editingBlogPost = {
      title: '',
      slug: '',
      category: 'یادداشت ادبی',
      author: `${state.admin.first_name} ${state.admin.last_name}`,
      published_date: '۱۴ آبان ۱۴۰۵',
      reading_time: '۶ دقیقه مطالعه',
      tags: 'ادبیات داستانی، نقد کتاب، بوک‌میت',
      status: 'منتشر شده',
      cover_url: state.gallery[5]?.url || '/assets/blog-1.png',
      excerpt: '',
      full_content: '',
    };
    notifyRoute();
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  $wrapper.on('click', '.js-admin-edit-blog', function () {
    const id = Number($(this).data('edit-blog'));
    const found = state.blogPosts.find((p) => p.id === id);
    if (found) {
      blogPageMode = 'editor';
      editingBlogPost = { ...found };
      notifyRoute();
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  $wrapper.on('click', '.js-admin-cancel-blog', () => {
    blogPageMode = 'list';
    editingBlogPost = null;
    notifyRoute();
    render();
  });

  $wrapper.on('click', '.js-admin-open-blog-cat-modal', () => {
    isBlogCategoryModalOpen = true;
    render();
  });

  $wrapper.on('click', '.js-admin-close-blog-cat-modal', () => {
    isBlogCategoryModalOpen = false;
    render();
  });

  $wrapper.on('click', '.js-admin-blog-cat-backdrop', function (e) {
    if ($(e.target).hasClass('js-admin-blog-cat-backdrop')) {
      isBlogCategoryModalOpen = false;
      render();
    }
  });

  $wrapper.on('submit', '.js-admin-blog-cat-form', function (e) {
    e.preventDefault();
    const newCat = String($(this).find('[name="new_blog_category"]').val() || '').trim();
    if (!newCat) return;
    if (!blogCategories.includes(newCat)) {
      blogCategories = [...blogCategories, newCat];
      try {
        window.localStorage.setItem('bookmeet_blog_categories', JSON.stringify(blogCategories));
      } catch {
        // ignore storage error
      }
    }
    if (editingBlogPost) {
      editingBlogPost.category = newCat;
    }
    isBlogCategoryModalOpen = false;
    render();
    showToast(`دسته‌بندی جدید «${newCat}» به مقالات اضافه شد.`);
  });

  // Rich Text Editor Toolbar Handler for Blog Content
  $wrapper.on('click', '.js-blog-editor-tool', function () {
    const cmd = String($(this).data('editor-cmd') || '');
    const textarea = $wrapper.find('.js-admin-blog-content-textarea')[0] as
      | HTMLTextAreaElement
      | undefined;
    if (!textarea) return;

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const currentVal = textarea.value;
    const selected = currentVal.slice(start, end);

    let replacement = selected;
    switch (cmd) {
      case 'bold':
        replacement = `**${selected || 'متن برجسته'}**`;
        break;
      case 'italic':
        replacement = `*${selected || 'متن مورب'}*`;
        break;
      case 'underline':
        replacement = `<u>${selected || 'متن زیرخط‌دار'}</u>`;
        break;
      case 'h2':
        replacement = `\n## ${selected || 'تیتر بخش اصلی'}\n`;
        break;
      case 'h3':
        replacement = `\n### ${selected || 'زیرعنوان بخش'}\n`;
        break;
      case 'quote':
        replacement = `\n«${selected || 'جمله یا نقل‌قول ادبی برگزیده را اینجا بنویسید...'}»\n`;
        break;
      case 'ul':
        replacement = selected
          ? selected
              .split('\n')
              .map((line) => `• ${line}`)
              .join('\n')
          : `\n• مورد اول\n• مورد دوم\n• مورد سوم\n`;
        break;
      case 'ol':
        replacement = selected
          ? selected
              .split('\n')
              .map((line, idx) => `${toPersianDigits(idx + 1)}. ${line}`)
              .join('\n')
          : `\n۱. نکته اول\n۲. نکته دوم\n۳. نکته سوم\n`;
        break;
      case 'link':
        replacement = `[${selected || 'عنوان لینک'}](https://bookmeet.ir)`;
        break;
      case 'hr':
        replacement = `\n────────────────────\n`;
        break;
      case 'clear':
        replacement = selected
          .replace(/(\*\*|\*|<u>|<\/u>|^##\s+|^###\s+|«|»)/gm, '')
          .trim();
        break;
      default:
        break;
    }

    const nextVal = currentVal.slice(0, start) + replacement + currentVal.slice(end);
    textarea.value = nextVal;
    if (editingBlogPost) {
      editingBlogPost.full_content = nextVal;
    }
    textarea.focus();
    const cursorPos = start + replacement.length;
    textarea.setSelectionRange(cursorPos, cursorPos);
  });

  $wrapper.on('submit', '.js-admin-blog-form', function (e) {
    e.preventDefault();
    const $f = $(this);
    const id = Number($f.find('[name="id"]').val() || 0) || undefined;
    const rawTitle = String($f.find('[name="title"]').val() || '').trim();
    const rawSlug = String($f.find('[name="slug"]').val() || '').trim();
    const autoGeneratedSlug =
      rawSlug ||
      rawTitle
        .replace(/[؟?!.,،؛:«»"']/g, '')
        .trim()
        .replace(/\s+/g, '-') ||
      `blog-post-${Date.now()}`;

    const payload: Partial<BlogPost> & { id?: number } = {
      id,
      title: rawTitle,
      slug: autoGeneratedSlug,
      category: String($f.find('[name="category"]').val() || '').trim(),
      author: String($f.find('[name="author"]').val() || '').trim(),
      published_date: String($f.find('[name="published_date"]').val() || '').trim(),
      reading_time: String($f.find('[name="reading_time"]').val() || '').trim(),
      tags: String($f.find('[name="tags"]').val() || '').trim(),
      status: String($f.find('[name="status"]').val() || 'منتشر شده') as
        | 'منتشر شده'
        | 'پیش‌نویس',
      cover_url: String($f.find('[name="cover_url"]').val() || '/assets/blog-1.png').trim(),
      excerpt: String($f.find('[name="excerpt"]').val() || '').trim(),
      full_content: String($f.find('[name="full_content"]').val() || '').trim(),
    };
    ApiService.saveAdminBlogPost(payload)
      .then((res) => {
        if (id) {
          state.blogPosts = state.blogPosts.map((p) => (p.id === id ? res.post : p));
        } else {
          state.blogPosts = [res.post, ...state.blogPosts];
        }
        blogPageMode = 'list';
        editingBlogPost = null;
        props.onSiteDataUpdated({ blogPosts: state.blogPosts });
        notifyRoute();
        render();
        showToast('مقاله وبلاگ با موفقیت در دیتابیس ذخیره شد.');
      })
      .catch((err) => showToast(err.message || 'خطا در ذخیره مقاله', true));
  });

  $wrapper.on('click', '.js-admin-delete-blog', function () {
    const id = Number($(this).data('delete-blog'));
    const target = state.blogPosts.find((p) => p.id === id);
    askDeleteConfirmation(
      'حذف مقاله وبلاگ',
      `آیا از حذف مقاله «${target?.title || ''}» از وبلاگ اطمینان دارید؟`,
      () => {
        ApiService.deleteAdminBlogPost(id)
          .then(() => {
            state.blogPosts = state.blogPosts.filter((p) => p.id !== id);
            props.onSiteDataUpdated({ blogPosts: state.blogPosts });
            render();
            showToast('مقاله از وبلاگ حذف شد.');
          })
          .catch((err) => showToast(err.message || 'خطا در حذف مقاله', true));
      }
    );
  });

  // --- Comments Handlers ---
  $wrapper.on('click', '.js-admin-comment-filter', function () {
    commentFilter = $(this).data('comment-filter');
    render();
  });

  $wrapper.on('click', '.js-admin-save-comment', function () {
    const id = Number($(this).data('save-comment'));
    const $card = $wrapper.find(`[data-admin-comment-card="${id}"]`);
    const admin_reply = String($card.find('.js-admin-comment-reply-input').val() || '').trim();
    const status = String(
      $card.find('.js-admin-comment-status-select').val() || 'تایید شده'
    ) as UserComment['status'];

    ApiService.saveAdminComment({ id, admin_reply, status })
      .then((res) => {
        state.comments = state.comments.map((c) => (c.id === id ? res.comment : c));
        render();
        showToast('وضعیت نظر و پاسخ مدیر در دیتابیس ذخیره شد.');
      })
      .catch((err) => showToast(err.message || 'خطا در ذخیره نظر', true));
  });

  $wrapper.on('click', '.js-admin-delete-comment', function () {
    const id = Number($(this).data('delete-comment'));
    const target = state.comments.find((c) => c.id === id);
    askDeleteConfirmation(
      'حذف نظر کاربر',
      `آیا از حذف نظر «${target?.author_name || ''}» اطمینان دارید؟`,
      () => {
        ApiService.deleteAdminComment(id)
          .then(() => {
            state.comments = state.comments.filter((c) => c.id !== id);
            render();
            showToast('نظر کاربر حذف شد.');
          })
          .catch((err) => showToast(err.message || 'خطا در حذف نظر', true));
      }
    );
  });

  // --- Home Settings Handlers ---
  function handleSaveHomeSettings(): void {
    const $f = $wrapper.find('.js-admin-home-settings-form');
    if (!$f.length) return;

    const heroSettings: Partial<HeroSettings> = {
      headline: String($f.find('[name="hero_headline"]').val() || '').trim(),
      subtitle_line_1: String($f.find('[name="hero_sub1"]').val() || '').trim(),
      subtitle_line_2: String($f.find('[name="hero_sub2"]').val() || '').trim(),
      nav_cta_text: String($f.find('[name="hero_cta"]').val() || '').trim(),
    };

    const aboutClub: Partial<AboutClubData> = {
      title: String($f.find('[name="club_title"]').val() || '').trim(),
      paragraph_1: String($f.find('[name="club_p1"]').val() || '').trim(),
      paragraph_2: String($f.find('[name="club_p2"]').val() || '').trim(),
      stat_1_value: String($f.find('[name="stat_1_value"]').val() || '').trim(),
      stat_1_label: String($f.find('[name="stat_1_label"]').val() || '').trim(),
      stat_2_value: String($f.find('[name="stat_2_value"]').val() || '').trim(),
      stat_2_label: String($f.find('[name="stat_2_label"]').val() || '').trim(),
      stat_3_value: String($f.find('[name="stat_3_value"]').val() || '').trim(),
      stat_3_label: String($f.find('[name="stat_3_label"]').val() || '').trim(),
    };

    const aboutManager: Partial<AboutManagerData> = {
      full_name: String($f.find('[name="mgr_name"]').val() || '').trim(),
      role_title: String($f.find('[name="mgr_role"]').val() || '').trim(),
      quote_text: String($f.find('[name="mgr_quote"]').val() || '').trim(),
      credentials_line: String($f.find('[name="mgr_creds"]').val() || '').trim(),
    };

    const contactInfo: Partial<ContactInfoData> = {
      title: String($f.find('[name="contact_title"]').val() || '').trim(),
      address: String($f.find('[name="contact_address"]').val() || '').trim(),
      meeting_hours: String($f.find('[name="contact_hours"]').val() || '').trim(),
      phone: String($f.find('[name="contact_phone"]').val() || '').trim(),
      email: String($f.find('[name="contact_email"]').val() || '').trim(),
      telegram_handle: String($f.find('[name="contact_telegram"]').val() || '').trim(),
    };

    ApiService.updateAdminHomeSettings({
      heroSettings,
      aboutClub,
      aboutManager,
      contactInfo,
    })
      .then((res) => {
        state.heroSettings = res.heroSettings;
        state.aboutClub = res.aboutClub;
        state.aboutManager = res.aboutManager;
        state.contactInfo = res.contactInfo;
        homeSettingsSavedBanner =
          'تمامی تنظیمات صفحه اصلی با موفقیت در دیتابیس ذخیره و در سایت اعمال شد.';
        props.onSiteDataUpdated({
          heroSettings: res.heroSettings,
          aboutClub: res.aboutClub,
          aboutManager: res.aboutManager,
          contactInfo: res.contactInfo,
        });
        render();
        showToast('تنظیمات صفحه اصلی سایت با موفقیت ذخیره شد.');
      })
      .catch((err) => showToast(err.message || 'خطا در ذخیره تنظیمات صفحه اصلی', true));
  }

  $wrapper.on('click', '.js-admin-save-home-settings', (e) => {
    e.preventDefault();
    handleSaveHomeSettings();
  });

  $wrapper.on('submit', '.js-admin-home-settings-form', (e) => {
    e.preventDefault();
    handleSaveHomeSettings();
  });

  render();
  return $wrapper;
}
