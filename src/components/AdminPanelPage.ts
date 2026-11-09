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
  CourseSyllabusItem,
  EnrollmentRecord,
  FooterLinkItem,
  FooterSettingsData,
  GalleryImage,
  HeroSettings,
  LibraryBook,
  LibraryCategory,
  MemberClassItem,
  MemberSession,
  MemberTicket,
  SessionSubItem,
  TicketAttachmentMeta,
  TicketAttachmentUploadInput,
  UserComment,
} from '../types/models.ts';
import {
  extractIsoDateForInput,
  extractTimeForInput,
  formatPersianDateDisplay,
  toEnglishDigits,
  toPersianDigits,
} from '../utils/persianNumbers.ts';
import { normalizeArticleHtml, sanitizeRichHtml } from '../utils/sanitizeHtml.ts';

export type AdminTabKey =
  | 'dashboard'
  | 'gallery'
  | 'library'
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
    footerSettings?: FooterSettingsData;
    blogPosts?: BlogPost[];
    sessions?: MemberSession[];
    classes?: MemberClassItem[];
    libraryBooks?: LibraryBook[];
    libraryCategories?: LibraryCategory[];
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

function normalizeSessionStatus(status?: string): 'فعال' | 'غیرفعال' | 'برگزار شده' {
  if (status === 'برگزارشده' || status === 'برگزار شده') {
    return 'برگزار شده';
  }
  if (status === 'غیرفعال') {
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
          <span>📎 پیوست:</span>
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
              <div class="inline-flex flex-col gap-1.5 p-2 rounded-xl bg-[#FAF5EC] border border-[#D8C4AA] max-w-full">
                ${
                  isImage
                    ? `
                      <a href="${url}" target="_blank" rel="noopener noreferrer" class="block overflow-hidden rounded-lg border border-[#E5D7C5] bg-[#F4E9DA]">
                        <img src="${url}" alt="${att.file_name}" class="max-h-36 w-auto object-contain mx-auto" loading="lazy" />
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

export function createAdminPanelPageComponent(props: AdminPanelPageProps): JQuery {
  const defaultFooterSettings: FooterSettingsData = {
    id: 1,
    title: 'باشگاه کتابخوانی بوک‌میت',
    description:
      'محفلی صمیمی برای خوانش آهسته، نقد ادبی و هم‌اندیشی پیرامون ماندگارترین آثار داستانی و فلسفی جهان.',
    phone: '۰۲۱-۸۸۹۴۳۲۱۰',
    email: 'hello@bookmeet.ir',
    address: 'تهران، خیابان کریم‌خان زند، خیابان ایرانشهر، خانه فرهنگ و ادبیات بوک‌میت',
    links: [
      { label: 'درباره باشگاه', href: '#about-club' },
      { label: 'کتابخانه', href: '#library' },
      { label: 'نشست‌ها', href: '#events' },
      { label: 'کلاس‌ها و دوره‌ها', href: '#courses' },
      { label: 'وبلاگ', href: '#blog' },
      { label: 'تماس با ما', href: '#contact' },
    ],
    instagram_url: '',
    telegram_url: '',
    twitter_url: '',
    youtube_url: '',
    linkedin_url: '',
    copyright_text: 'تمامی حقوق مادی و معنوی برای باشگاه کتابخوانی بوک‌میت محفوظ است · ۱۴۰۵',
    tagline_text: 'حلقه‌های مطالعاتی و نقد ادبیات داستانی',
  };

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
    footerSettings: props.initialData.footerSettings
      ? {
          ...defaultFooterSettings,
          ...props.initialData.footerSettings,
          links: Array.isArray(props.initialData.footerSettings.links)
            ? props.initialData.footerSettings.links.map((l) => ({ ...l }))
            : defaultFooterSettings.links.map((l) => ({ ...l })),
        }
      : {
          ...defaultFooterSettings,
          links: defaultFooterSettings.links.map((l) => ({ ...l })),
        },
    libraryBooks: [...(props.initialData.libraryBooks || [])],
    libraryCategories: [...(props.initialData.libraryCategories || [])],
  };

  let activeTab: AdminTabKey = props.initialTab || 'dashboard';

  // Gallery state
  let gallerySearch = '';
  let galleryCategoryFilter = 'all';
  let newGalleryImageUrl = '';
  let galleryPickerTarget: null | 'session' | 'class' | 'blog' | 'blog_inline' | 'library' = null;
  let blogInlineImageSize: 'full' | 'lg' | 'md' | 'sm' = 'lg';

  // Library management state
  let librarySearch = '';
  let libraryCategoryFilter = 'all';
  let editingLibraryBook: Partial<LibraryBook> | null = null;
  let viewingLibraryBook: LibraryBook | null = null;
  let editingLibraryTagsList: string[] = [];
  let isLibraryCategoryModalOpen = false;
  let editingLibraryCategoryItem: LibraryCategory | null = null;

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

  // Dedicated Registered Members Modal state
  let enrolledMembersModalTarget: {
    targetType: 'session' | 'class';
    targetId: number;
    targetTitle: string;
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
  let sessionStatusFilter: 'all' | 'فعال' | 'غیرفعال' | 'برگزار شده' = 'all';
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
  let selectedAdminTicketId: number | null = null;

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

  // Parse initialSubPath if provided (e.g. /admin/blog/create, /admin/sessions/1, /admin/tickets/3)
  function applySubPath(tab: AdminTabKey, subPath?: string): void {
    activeTab = tab;
    managingSubSessionsForSessionId = null;
    managingSubSessionsForClassId = null;
    selectedAdminTicketId = null;
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
    } else if (tab === 'tickets' && parts[0]) {
      const tid = Number(parts[0]);
      if (!Number.isNaN(tid) && state.tickets.some((t) => Number(t.id) === tid)) {
        selectedAdminTicketId = tid;
      }
    } else if (tab === 'blog') {
      if (parts[0] === 'create') {
        blogPageMode = 'editor';
        editingBlogPost = {
          title: '',
          slug: '',
          category: 'یادداشت ادبی',
          author: '',
          published_date: '',
          reading_time: '',
          tags: '',
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
    if (activeTab === 'tickets' && selectedAdminTicketId !== null) {
      props.onRouteChange(`/admin/tickets/${selectedAdminTicketId}`);
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

  function syncOpenFormsFromDom(): void {
    const $sessionForm = $wrapper.find('.js-admin-session-form');
    if (editingSession && $sessionForm.length) {
      const rawPages = toEnglishDigits(
        String($sessionForm.find('[name="pages_count"]').val() || '').trim()
      );
      const rawPubYear = toEnglishDigits(
        String($sessionForm.find('[name="publication_year"]').val() || '').trim()
      );
      const translatorVal = String(
        $sessionForm.find('[name="translator"]').val() || ''
      ).trim();

      editingSession = {
        ...editingSession,
        title: String($sessionForm.find('[name="title"]').val() || ''),
        status: String(
          $sessionForm.find('[name="status"]').val() || 'فعال'
        ) as MemberSession['status'],
        book_title: String($sessionForm.find('[name="book_title"]').val() || ''),
        book_author: String($sessionForm.find('[name="book_author"]').val() || ''),
        translator: translatorVal,
        mentor_name: translatorVal,
        category: String($sessionForm.find('[name="category"]').val() || ''),
        publication_year: rawPubYear ? Number(rawPubYear) : undefined,
        pages_count: rawPages ? Number(rawPages) : undefined,
        publisher: String($sessionForm.find('[name="publisher"]').val() || ''),
        session_date: String($sessionForm.find('[name="session_date"]').val() || ''),
        session_time: String($sessionForm.find('[name="session_time"]').val() || ''),
        cover_url: String(
          $sessionForm.find('[name="cover_url"]').val() ||
            editingSession.cover_url ||
            '/assets/book-current.png'
        ),
        short_description: String(
          $sessionForm.find('[name="short_description"]').val() || ''
        ),
        full_description: String(
          $sessionForm.find('[name="full_description"]').val() || ''
        ),
      };
    }

    const $classForm = $wrapper.find('.js-admin-class-form');
    if (editingClass && $classForm.length) {
      const domSyllabus: CourseSyllabusItem[] = [];
      $classForm.find('.js-admin-syllabus-row').each(function (idx) {
        const $row = $(this);
        const rawId = Number($row.attr('data-syllabus-id')) || Date.now() + idx;
        const sessionNumber = String(
          $row.find('.js-syllabus-number-input').val() || `جلسه ${toPersianDigits(idx + 1)}`
        ).trim();
        const itemTitle = String($row.find('.js-syllabus-title-input').val() || '').trim();
        const itemDesc = String($row.find('.js-syllabus-desc-input').val() || '').trim();
        domSyllabus.push({
          id: rawId,
          session_number: sessionNumber,
          title: itemTitle,
          description: itemDesc,
        });
      });

      editingClass = {
        ...editingClass,
        title: String($classForm.find('[name="title"]').val() || ''),
        status: String(
          $classForm.find('[name="status"]').val() || 'فعال'
        ) as MemberClassItem['status'],
        book_title: String($classForm.find('[name="book_title"]').val() || ''),
        instructor_name: String($classForm.find('[name="instructor_name"]').val() || ''),
        schedule_summary: String(
          $classForm.find('[name="schedule_summary"]').val() || ''
        ),
        level_label: String($classForm.find('[name="level_label"]').val() || 'مبتدی'),
        start_date: String($classForm.find('[name="start_date"]').val() || ''),
        end_date: String($classForm.find('[name="end_date"]').val() || ''),
        duration_label: String($classForm.find('[name="duration_label"]').val() || ''),
        sessions_count: String($classForm.find('[name="sessions_count"]').val() || ''),
        capacity_label: String($classForm.find('[name="capacity_label"]').val() || ''),
        syllabus: domSyllabus,
        cover_url: String(
          $classForm.find('[name="cover_url"]').val() ||
            editingClass.cover_url ||
            '/assets/blog-1.png'
        ),
        description: String($classForm.find('[name="description"]').val() || ''),
      };
    }

    const $blogForm = $wrapper.find('.js-admin-blog-form');
    if (editingBlogPost && $blogForm.length) {
      const $wysiwyg = $blogForm.find('.js-admin-blog-wysiwyg');
      const currentRichHtml = $wysiwyg.length
        ? sanitizeRichHtml($wysiwyg.html() || '')
        : String($blogForm.find('[name="full_content"]').val() || '');
      editingBlogPost = {
        ...editingBlogPost,
        title: String($blogForm.find('[name="title"]').val() || ''),
        slug: String($blogForm.find('[name="slug"]').val() || ''),
        category: String($blogForm.find('[name="category"]').val() || ''),
        author: String($blogForm.find('[name="author"]').val() || ''),
        published_date: String($blogForm.find('[name="published_date"]').val() || ''),
        reading_time: String($blogForm.find('[name="reading_time"]').val() || ''),
        tags: String($blogForm.find('[name="tags"]').val() || ''),
        status: String($blogForm.find('[name="status"]').val() || 'منتشر شده') as
          | 'منتشر شده'
          | 'پیش‌نویس',
        cover_url: String(
          $blogForm.find('[name="cover_url"]').val() ||
            editingBlogPost.cover_url ||
            '/assets/blog-1.png'
        ),
        excerpt: String($blogForm.find('[name="excerpt"]').val() || ''),
        full_content: currentRichHtml,
      };
    }

    const $libForm = $wrapper.find('.js-admin-library-book-form');
    if (editingLibraryBook && $libForm.length) {
      const rawPubYear = toEnglishDigits(
        String($libForm.find('[name="publication_year"]').val() || '').trim()
      );
      const rawPagesCount = toEnglishDigits(
        String($libForm.find('[name="pages_count"]').val() || '').trim()
      );
      editingLibraryBook = {
        ...editingLibraryBook,
        title: String($libForm.find('[name="title"]').val() || ''),
        author: String($libForm.find('[name="author"]').val() || ''),
        translator: String($libForm.find('[name="translator"]').val() || ''),
        publisher: String($libForm.find('[name="publisher"]').val() || ''),
        publication_year: rawPubYear ? Number(rawPubYear) : 0,
        edition_number: String($libForm.find('[name="edition_number"]').val() || ''),
        pages_count: rawPagesCount ? Number(rawPagesCount) : 0,
        short_description: String($libForm.find('[name="short_description"]').val() || ''),
        description: String($libForm.find('[name="description"]').val() || ''),
        memorable_quote: String($libForm.find('[name="memorable_quote"]').val() || ''),
        recommended_for: String($libForm.find('[name="recommended_for"]').val() || ''),
        category: String($libForm.find('[name="category"]').val() || ''),
        cover_url: String(
          $libForm.find('[name="cover_url"]').val() || editingLibraryBook.cover_url || ''
        ),
        notes: String($libForm.find('[name="notes"]').val() || ''),
        tags: editingLibraryTagsList.join('، '),
      };
    }
  }

  function renderEnrolledMembersBlock(params: {
    targetType: 'session' | 'class';
    targetId: number;
    targetTitle: string;
    members?: EnrollmentRecord[];
  }): string {
    const list = Array.isArray(params.members) ? params.members : [];
    const activeCount = list.filter((m) => m.status === 'فعال').length;
    const pendingCount = list.filter((m) => m.status === 'غیرفعال').length;

    return `
      <div class="mt-3 pt-3 border-t border-[#E2D2BE] flex flex-wrap items-center justify-between gap-2">
        <div class="text-[12px] text-[#4E3B2D] flex items-center gap-1.5 flex-wrap">
          <span class="w-2 h-2 rounded-full bg-[#5A3A22]"></span>
          <span>اعضای ثبت‌نام‌شده: <strong class="text-[#231912]">${toPersianDigits(list.length)} نفر</strong></span>
          ${
            list.length > 0
              ? `<span class="text-[11px] text-[#6B5444]">(${toPersianDigits(activeCount)} فعال · ${toPersianDigits(pendingCount)} در انتظار)</span>`
              : ''
          }
        </div>
        <button
          type="button"
          data-open-enrolled-type="${params.targetType}"
          data-open-enrolled-id="${params.targetId}"
          data-open-enrolled-title="${params.targetTitle}"
          class="js-admin-open-enrolled-modal px-3 py-1.5 rounded-xl bg-[#F3E7D6] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[#3F2E21] text-[11.5px] font-semibold cursor-pointer transition-colors"
        >
          لیست اعضای ثبت‌نام‌شده
        </button>
      </div>
    `;
  }

  // ==================== MODALS: CONFIRMATION, ENROLLED MEMBERS, TICKET TO MEMBER & GALLERY PICKER ====================
  function renderModals(): string {
    let html = '';

    if (enrolledMembersModalTarget) {
      const targetParent =
        enrolledMembersModalTarget.targetType === 'session'
          ? state.sessions.find((s) => s.id === enrolledMembersModalTarget?.targetId)
          : state.classes.find((c) => c.id === enrolledMembersModalTarget?.targetId);
      const list: EnrollmentRecord[] = Array.isArray(targetParent?.enrolled_members)
        ? targetParent!.enrolled_members!
        : [];
      const modalTitle = targetParent?.title || enrolledMembersModalTarget.targetTitle;

      html += `
        <div class="js-admin-enrolled-modal-backdrop fixed inset-0 z-40 bg-[#1B120C]/65 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div class="w-full max-w-[680px] max-h-[85vh] rounded-2xl bg-[#FAF5EC] border-2 border-[#DEC8AC] shadow-[0_24px_60px_rgba(27,18,12,0.35)] flex flex-col overflow-hidden">
            <div class="px-6 py-4 border-b border-[#E5D7C5] flex items-center justify-between gap-3">
              <div>
                <h3 class="font-display text-[17.5px] font-bold text-[#231912]">
                  لیست اعضای ثبت‌نام‌شده · ${toPersianDigits(modalTitle)}
                </h3>
                <p class="text-[12px] text-[#6B5444] mt-0.5">
                  تعداد کل ثبت‌نام‌کنندگان واقعی در این دوره: <strong>${toPersianDigits(list.length)} نفر</strong>
                </p>
              </div>
              <button
                type="button"
                class="js-admin-close-enrolled-modal px-3 py-1.5 rounded-xl text-[#4E3B2D] hover:bg-[#EFE3D2] text-[13px] font-semibold cursor-pointer"
              >
                بستن ✕
              </button>
            </div>

            <div class="p-6 overflow-y-auto space-y-3">
              ${
                list.length === 0
                  ? `
                    <div class="p-8 rounded-2xl bg-[#F4E9DA]/55 border border-dashed border-[#D8C4AA] text-center space-y-2">
                      <div class="text-[14.5px] font-bold text-[#231912]">هنوز هیچ کاربری در این دوره ثبت‌نام نکرده است.</div>
                      <p class="text-[12.5px] text-[#6B5444]">
                        پس از ثبت‌نام کاربران از طریق سایت، مشخصات، شماره تماس و وضعیت ثبت‌نام آن‌ها در این پنجره نمایش داده می‌شود.
                      </p>
                    </div>
                  `
                  : list
                      .map((m) => {
                        const badgeClass =
                          m.status === 'فعال'
                            ? 'bg-[#E4F2E7] text-[#235332] border-[#BBD9C2]'
                            : m.status === 'لغو شده'
                            ? 'bg-[#FBEAE8] text-[#9E3329] border-[#E6B8B3]'
                            : 'bg-[#FFF3CD] text-[#7A5A10] border-[#E5C77B]';

                        const statusText =
                          m.status === 'غیرفعال'
                            ? 'غیرفعال (در انتظار تایید)'
                            : m.status;

                        return `
                          <div class="p-3.5 rounded-xl bg-[#F4E9DA]/65 border border-[#DFCEB9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div class="min-w-0 space-y-1">
                              <div class="flex items-center gap-2 flex-wrap">
                                <strong class="text-[13px] font-bold text-[#231912]">${toPersianDigits(m.member_name)}</strong>
                                <span class="text-[12px] text-[#6B5444]" dir="ltr">${toPersianDigits(m.member_phone)}</span>
                                <span class="px-2.5 py-0.5 rounded-md border text-[11px] font-semibold ${badgeClass}">
                                  ${toPersianDigits(statusText)}
                                </span>
                              </div>
                              <div class="text-[11px] text-[#7A6352]">
                                تاریخ ثبت‌نام: ${toPersianDigits(m.registered_at)}
                              </div>
                            </div>

                            <div class="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                data-enroll-type="${enrolledMembersModalTarget.targetType}"
                                data-enroll-id="${enrolledMembersModalTarget.targetId}"
                                data-enroll-title="${modalTitle}"
                                data-member-phone="${m.member_phone}"
                                data-member-name="${m.member_name}"
                                class="js-admin-approve-enrollment px-3 py-1.5 rounded-lg bg-[#235332] hover:bg-[#193E25] text-[#FAF5EC] text-[11.5px] font-semibold cursor-pointer transition-colors ${
                                  m.status === 'فعال' ? 'opacity-60' : ''
                                }"
                              >
                                تایید
                              </button>
                              <button
                                type="button"
                                data-enroll-type="${enrolledMembersModalTarget.targetType}"
                                data-enroll-id="${enrolledMembersModalTarget.targetId}"
                                data-enroll-title="${modalTitle}"
                                data-member-phone="${m.member_phone}"
                                data-member-name="${m.member_name}"
                                class="js-admin-cancel-enrollment px-3 py-1.5 rounded-lg border border-[#E0A9A3] bg-[#FBEAE8] hover:bg-[#F5D5D1] text-[#9E3329] text-[11.5px] font-semibold cursor-pointer transition-colors"
                              >
                                لغو
                              </button>
                              <button
                                type="button"
                                data-enroll-title="${modalTitle}"
                                data-member-phone="${m.member_phone}"
                                data-member-name="${m.member_name}"
                                class="js-admin-ticket-enrollment px-3 py-1.5 rounded-lg bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[11.5px] font-semibold cursor-pointer transition-colors"
                              >
                                ارسال تیکت
                              </button>
                            </div>
                          </div>
                        `;
                      })
                      .join('')
              }
            </div>
          </div>
        </div>
      `;
    }

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
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">پیوست فایل یا تصویر (اختیاری - حداکثر ۵ فایل تا ۵ مگابایت)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                  class="js-admin-member-ticket-files w-full px-3 py-2 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[12px] text-[#4E3B2D] file:ml-3 file:px-3 file:py-1 file:rounded-lg file:border-0 file:bg-[#5A3A22] file:text-[#FAF5EC] file:text-[11.5px] file:font-semibold file:cursor-pointer"
                />
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

    if (isLibraryCategoryModalOpen) {
      const catList = state.libraryCategories || [];
      html += `
        <div class="js-admin-lib-cat-backdrop fixed inset-0 z-50 bg-[#1B120C]/65 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div class="w-full max-w-[540px] max-h-[85vh] rounded-2xl bg-[#FAF5EC] border-2 border-[#DEC8AC] shadow-[0_24px_60px_rgba(27,18,12,0.35)] flex flex-col overflow-hidden">
            <div class="px-6 py-4 border-b border-[#E5D7C5] flex items-center justify-between gap-3">
              <div>
                <h3 class="font-display text-[17.5px] font-bold text-[#231912]">مدیریت دسته‌بندی‌ها</h3>
                <p class="text-[11.5px] text-[#6B5444] mt-0.5">ایجاد، ویرایش و حذف دسته‌بندی‌های کتابخانه در دیتابیس MySQL</p>
              </div>
              <button
                type="button"
                class="js-admin-close-lib-cat-modal px-2.5 py-1 rounded-lg text-[#4E3B2D] hover:bg-[#EFE3D2] text-[13px] font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div class="p-6 overflow-y-auto space-y-5">
              <form class="js-admin-lib-cat-form space-y-3">
                <label class="block text-[12px] font-semibold text-[#4E3B2D]">
                  ${editingLibraryCategoryItem ? `ویرایش نام دسته‌بندی «${toPersianDigits(editingLibraryCategoryItem.name)}»` : 'افزودن دسته‌بندی جدید'}
                </label>
                <div class="flex items-center gap-2">
                  <input
                    type="text"
                    name="library_category_name"
                    required
                    value="${editingLibraryCategoryItem ? toPersianDigits(editingLibraryCategoryItem.name) : ''}"
                    placeholder="نام دسته‌بندی را وارد نمایید..."
                    class="flex-1 px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
                  />
                  ${
                    editingLibraryCategoryItem
                      ? `
                    <button
                      type="button"
                      class="js-admin-cancel-edit-lib-cat px-3.5 py-2.5 rounded-xl border border-[#C5B198] text-[#4E3B2D] hover:bg-[#EFE3D2] text-[12px] font-semibold cursor-pointer shrink-0"
                    >
                      انصراف
                    </button>
                  `
                      : ''
                  }
                  <button
                    type="submit"
                    class="px-4 py-2.5 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[12.5px] font-semibold cursor-pointer shrink-0"
                  >
                    ${editingLibraryCategoryItem ? 'ذخیره ویرایش' : '+ ایجاد دسته‌بندی'}
                  </button>
                </div>
              </form>

              <div class="space-y-2.5">
                <span class="block text-[12px] font-semibold text-[#4E3B2D]">
                  لیست دسته‌بندی‌های ثبت‌شده (${toPersianDigits(catList.length)} مورد):
                </span>
                ${
                  catList.length === 0
                    ? `
                  <div class="p-5 rounded-xl bg-[#F4E9DA]/50 border border-dashed border-[#D8C4AA] text-center text-[12.5px] text-[#6B5444]">
                    هنوز دسته‌بندی‌ای در دیتابیس ثبت نشده است.
                  </div>
                `
                    : `
                  <div class="space-y-2">
                    ${catList
                      .map((cat) => {
                        const usedCount = state.libraryBooks.filter(
                          (b) => (b.category || '').trim() === cat.name.trim()
                        ).length;
                        return `
                          <div class="p-3 rounded-xl bg-[#F4E9DA]/65 border border-[#DFCEB9] flex items-center justify-between gap-3">
                            <div class="min-w-0 flex items-center gap-2 flex-wrap">
                              <strong class="text-[13px] font-bold text-[#231912]">${toPersianDigits(cat.name)}</strong>
                              <span class="px-2 py-0.5 rounded-md bg-[#EFE3D2] text-[#6B5444] text-[11px]">
                                ${toPersianDigits(usedCount)} کتاب
                              </span>
                            </div>
                            <div class="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                data-edit-lib-cat="${cat.id}"
                                class="js-admin-edit-lib-cat px-3 py-1.5 rounded-lg bg-[#F3E7D6] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[#3F2E21] text-[11.5px] font-semibold cursor-pointer"
                              >
                                ویرایش
                              </button>
                              <button
                                type="button"
                                data-delete-lib-cat="${cat.id}"
                                class="js-admin-delete-lib-cat px-3 py-1.5 rounded-lg border border-[#E6B8B3] text-[#9E3329] hover:bg-[#FBEAE8] text-[11.5px] font-semibold cursor-pointer"
                              >
                                حذف
                              </button>
                            </div>
                          </div>
                        `;
                      })
                      .join('')}
                  </div>
                `
                }
              </div>
            </div>

            <div class="px-6 py-3.5 border-t border-[#E5D7C5] flex justify-end">
              <button
                type="button"
                class="js-admin-close-lib-cat-modal px-4 py-2 rounded-xl border border-[#C5B198] text-[#4E3B2D] hover:bg-[#EFE3D2] text-[12.5px] font-semibold cursor-pointer"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      `;
    }

    if (viewingLibraryBook) {
      const b = viewingLibraryBook;
      const bTags = String(b.tags || '')
        .split(/[،,]/)
        .map((t) => t.trim())
        .filter(Boolean);
      const bNoteItems = String(b.notes || '')
        .split(/\r?\n|•/)
        .map((line) => line.replace(/^[\s\-*•●▪▫–—]+/, '').trim())
        .filter(Boolean);

      html += `
        <div class="js-admin-view-lib-book-backdrop fixed inset-0 z-50 bg-[#1B120C]/65 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div class="w-full max-w-[760px] max-h-[88vh] rounded-2xl bg-[#FAF5EC] border-2 border-[#DEC8AC] shadow-[0_24px_60px_rgba(27,18,12,0.35)] flex flex-col overflow-hidden">
            <div class="px-6 py-4 border-b border-[#E5D7C5] flex items-center justify-between gap-3">
              <div class="min-w-0">
                <h3 class="font-display text-[18px] font-bold text-[#231912] truncate">
                  جزئیات کتاب · ${toPersianDigits(b.title)}
                </h3>
                ${
                  b.category
                    ? `<span class="inline-block mt-1 px-2.5 py-0.5 rounded-md bg-[#EFE3D2] text-[#5A3A22] text-[11px] font-semibold">${toPersianDigits(b.category)}</span>`
                    : ''
                }
              </div>
              <button
                type="button"
                class="js-admin-close-view-lib-book px-3 py-1.5 rounded-xl text-[#4E3B2D] hover:bg-[#EFE3D2] text-[13px] font-semibold cursor-pointer shrink-0"
              >
                بستن ✕
              </button>
            </div>

            <div class="p-6 overflow-y-auto space-y-5">
              <div class="flex flex-col sm:flex-row items-start gap-5">
                ${
                  b.cover_url
                    ? `<img src="${b.cover_url}" alt="${b.title}" class="w-32 h-44 object-cover rounded-xl border border-[#D8C4AA] shrink-0" />`
                    : `<div class="w-32 h-44 rounded-xl bg-[#EFE3D2] border border-[#D8C4AA] flex items-center justify-center text-[12px] text-[#6B5444] shrink-0">بدون تصویر کاور</div>`
                }
                <div class="flex-1 min-w-0 space-y-3 w-full">
                  <div>
                    <span class="text-[11.5px] font-semibold text-[#7A6352] block">عنوان کتاب:</span>
                    <div class="font-display text-[18px] font-bold text-[#231912] mt-0.5">${toPersianDigits(b.title)}</div>
                  </div>

                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                    <div class="p-2.5 rounded-xl bg-[#F4E9DA]/65 border border-[#E5D7C5]">
                      <span class="block text-[11px] text-[#7A6352]">نام نویسنده:</span>
                      <strong class="block text-[12.5px] text-[#231912] mt-0.5">${b.author ? toPersianDigits(b.author) : '—'}</strong>
                    </div>
                    <div class="p-2.5 rounded-xl bg-[#F4E9DA]/65 border border-[#E5D7C5]">
                      <span class="block text-[11px] text-[#7A6352]">مترجم:</span>
                      <strong class="block text-[12.5px] text-[#231912] mt-0.5">${b.translator ? toPersianDigits(b.translator) : '—'}</strong>
                    </div>
                    <div class="p-2.5 rounded-xl bg-[#F4E9DA]/65 border border-[#E5D7C5]">
                      <span class="block text-[11px] text-[#7A6352]">نام ناشر:</span>
                      <strong class="block text-[12.5px] text-[#231912] mt-0.5">${b.publisher ? toPersianDigits(b.publisher) : '—'}</strong>
                    </div>
                    <div class="p-2.5 rounded-xl bg-[#F4E9DA]/65 border border-[#E5D7C5]">
                      <span class="block text-[11px] text-[#7A6352]">سال انتشار:</span>
                      <strong class="block text-[12.5px] text-[#231912] mt-0.5">${b.publication_year && Number(b.publication_year) > 0 ? toPersianDigits(b.publication_year) : '—'}</strong>
                    </div>
                    <div class="p-2.5 rounded-xl bg-[#F4E9DA]/65 border border-[#E5D7C5]">
                      <span class="block text-[11px] text-[#7A6352]">نوبت چاپ:</span>
                      <strong class="block text-[12.5px] text-[#231912] mt-0.5">${b.edition_number ? toPersianDigits(b.edition_number) : '—'}</strong>
                    </div>
                    <div class="p-2.5 rounded-xl bg-[#F4E9DA]/65 border border-[#E5D7C5]">
                      <span class="block text-[11px] text-[#7A6352]">تعداد صفحات:</span>
                      <strong class="block text-[12.5px] text-[#231912] mt-0.5">${b.pages_count && Number(b.pages_count) > 0 ? `${toPersianDigits(b.pages_count)} صفحه` : '—'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              ${
                b.short_description
                  ? `
                <div class="p-4 rounded-xl bg-[#F4E9DA]/60 border border-[#E5D7C5]">
                  <h4 class="font-bold text-[13.5px] text-[#231912] mb-1.5">خلاصه کتاب</h4>
                  <p class="text-[13px] text-[#3F2E21] leading-[1.9] whitespace-pre-line">${toPersianDigits(b.short_description)}</p>
                </div>
              `
                  : ''
              }

              ${
                b.description
                  ? `
                <div class="p-4 rounded-xl bg-[#F4E9DA]/60 border border-[#E5D7C5]">
                  <h4 class="font-bold text-[13.5px] text-[#231912] mb-1.5">توضیحات</h4>
                  <p class="text-[13px] text-[#3F2E21] leading-[1.9] whitespace-pre-line">${toPersianDigits(b.description)}</p>
                </div>
              `
                  : ''
              }

              ${
                b.memorable_quote
                  ? `
                <div class="p-4 rounded-xl bg-[#EFE3D2]/80 border-r-4 border-[#7A4B2A]">
                  <h4 class="font-bold text-[13px] text-[#7A4B2A] mb-1">جمله‌ای که به یادگار ماند</h4>
                  <blockquote class="text-[13.5px] italic text-[#231912] leading-[1.9] whitespace-pre-line">«${toPersianDigits(b.memorable_quote)}»</blockquote>
                </div>
              `
                  : ''
              }

              ${
                b.recommended_for
                  ? `
                <div class="p-4 rounded-xl bg-[#F4E9DA]/60 border border-[#E5D7C5]">
                  <h4 class="font-bold text-[13.5px] text-[#231912] mb-1.5">به چه کسانی توصیه می‌شود</h4>
                  <p class="text-[13px] text-[#3F2E21] leading-[1.9] whitespace-pre-line">${toPersianDigits(b.recommended_for)}</p>
                </div>
              `
                  : ''
              }

              ${
                bNoteItems.length > 0
                  ? `
                <div class="p-4 rounded-xl bg-[#F4E9DA]/60 border border-[#E5D7C5]">
                  <h4 class="font-bold text-[13.5px] text-[#231912] mb-2">نکات و یادداشت‌ها</h4>
                  <ul class="space-y-2 pr-1">
                    ${bNoteItems
                      .map(
                        (item) => `
                      <li class="flex items-start gap-2.5 text-[13px] text-[#3F2E21] leading-[1.9] text-justify">
                        <span class="w-2 h-2 rounded-full bg-[#7A4B2A] shrink-0 mt-2.5"></span>
                        <span class="flex-1">${toPersianDigits(item)}</span>
                      </li>
                    `
                      )
                      .join('')}
                  </ul>
                </div>
              `
                  : ''
              }

              ${
                bTags.length > 0
                  ? `
                <div class="p-4 rounded-xl bg-[#F4E9DA]/60 border border-[#E5D7C5]">
                  <h4 class="font-bold text-[13.5px] text-[#231912] mb-2">برچسب‌ها</h4>
                  <div class="flex flex-wrap gap-1.5">
                    ${bTags
                      .map(
                        (tag) =>
                          `<span class="px-2.5 py-1 rounded-lg bg-[#F3E7D6] border border-[#D8C4AA] text-[#4E3B2D] text-[11.5px] font-semibold">#${toPersianDigits(tag)}</span>`
                      )
                      .join('')}
                  </div>
                </div>
              `
                  : ''
              }
            </div>

            <div class="px-6 py-3.5 border-t border-[#E5D7C5] flex items-center justify-end gap-2.5">
              <button
                type="button"
                data-edit-lib-book="${b.id}"
                class="js-admin-edit-lib-book px-4 py-2 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[12.5px] font-semibold cursor-pointer"
              >
                ویرایش این کتاب
              </button>
              <button
                type="button"
                class="js-admin-close-view-lib-book px-4 py-2 rounded-xl border border-[#C5B198] text-[#4E3B2D] hover:bg-[#EFE3D2] text-[12.5px] font-semibold cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
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

  // ==================== 1.8 LIBRARY MANAGEMENT TAB ====================
  function getAvailableLibraryCategoryNames(): string[] {
    const fromTable = (state.libraryCategories || [])
      .map((c) => String(c.name || '').trim())
      .filter(Boolean);
    const fromBooks = (state.libraryBooks || [])
      .map((b) => String(b.category || '').trim())
      .filter(Boolean);
    return Array.from(new Set([...fromTable, ...fromBooks]));
  }

  function renderLibraryTab(): string {
    const q = librarySearch.trim().toLowerCase();
    const availableCategories = getAvailableLibraryCategoryNames();

    const filteredBooks = state.libraryBooks.filter((b) => {
      if (
        libraryCategoryFilter !== 'all' &&
        String(b.category || '').trim() !== libraryCategoryFilter
      ) {
        return false;
      }
      if (!q) return true;
      const haystack = `${b.title || ''} ${b.author || ''} ${b.translator || ''} ${
        b.publisher || ''
      } ${b.short_description || ''} ${b.description || ''} ${
        b.category || ''
      } ${b.tags || ''} ${b.memorable_quote || ''} ${b.recommended_for || ''} ${
        b.notes || ''
      }`.toLowerCase();
      return haystack.includes(q);
    });

    return `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="font-display text-[20px] sm:text-[23px] font-bold text-[#231912]">مدیریت کتابخانه باشگاه</h2>
            <p class="text-[13.5px] text-[#6B5444] mt-1">
              ثبت، مشاهده، ویرایش و حذف کتاب‌های کتابخانه باشگاه به همراه مدیریت دسته‌بندی‌ها و برچسب‌ها در دیتابیس MySQL.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              class="js-admin-open-lib-cat-modal px-4 py-2.5 rounded-xl bg-[#F3E7D6] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[#3F2E21] text-[12.5px] font-semibold transition-colors cursor-pointer"
            >
              مدیریت دسته‌بندی‌ها
            </button>
            <button
              type="button"
              class="js-admin-new-lib-book-btn px-5 py-2.5 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[13px] font-semibold transition-colors cursor-pointer"
            >
              + افزودن کتاب جدید
            </button>
          </div>
        </div>

        ${
          editingLibraryBook
            ? `
          <form class="js-admin-library-book-form p-6 rounded-2xl bg-[#FAF5EC] border-2 border-[#C8AF8F] space-y-5" novalidate>
            <div class="flex items-center justify-between pb-3 border-b border-[#E5D7C5]">
              <h3 class="font-display text-[17.5px] font-bold text-[#231912]">
                ${editingLibraryBook.id ? 'ویرایش اطلاعات کتاب' : 'ثبت کتاب جدید در کتابخانه'}
              </h3>
              <button
                type="button"
                class="js-admin-cancel-lib-book text-[12.5px] font-semibold text-[#6B5444] hover:text-[#231912] cursor-pointer"
              >
                انصراف ✕
              </button>
            </div>

            <input type="hidden" name="id" value="${editingLibraryBook.id || ''}" />

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="sm:col-span-2">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">عنوان کتاب *</label>
                <input
                  type="text"
                  name="title"
                  required
                  value="${toPersianDigits(editingLibraryBook.title || '')}"
                  placeholder="عنوان کتاب را وارد نمایید..."
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
                />
              </div>

              <div class="sm:col-span-2">
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-[12px] font-semibold text-[#4E3B2D]">دسته‌بندی</label>
                  <button
                    type="button"
                    class="js-admin-open-lib-cat-modal text-[11px] font-semibold text-[#7A4B2A] hover:text-[#231912] cursor-pointer"
                  >
                    + مدیریت دسته‌بندی‌ها
                  </button>
                </div>
                <select
                  name="category"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
                >
                  <option value="" ${!editingLibraryBook.category ? 'selected' : ''}>انتخاب دسته‌بندی...</option>
                  ${availableCategories
                    .map(
                      (cat) =>
                        `<option value="${cat}" ${
                          editingLibraryBook?.category === cat ? 'selected' : ''
                        }>${toPersianDigits(cat)}</option>`
                    )
                    .join('')}
                </select>
              </div>

              <!-- 6 Specification Fields: Author, Translator, Publisher, Publication Year, Edition Number, Page Count -->
              <div class="sm:col-span-2">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">نام نویسنده</label>
                <input
                  type="text"
                  name="author"
                  value="${toPersianDigits(editingLibraryBook.author || '')}"
                  placeholder="مثلاً: فیودور داستایفسکی"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
                />
              </div>

              <div class="sm:col-span-2">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">مترجم</label>
                <input
                  type="text"
                  name="translator"
                  value="${toPersianDigits(editingLibraryBook.translator || '')}"
                  placeholder="مثلاً: سروش حبیبی"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
                />
              </div>

              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">نام ناشر</label>
                <input
                  type="text"
                  name="publisher"
                  value="${toPersianDigits(editingLibraryBook.publisher || '')}"
                  placeholder="مثلاً: نشر ماهی"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
                />
              </div>

              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">سال انتشار</label>
                <input
                  type="text"
                  inputmode="numeric"
                  name="publication_year"
                  value="${
                    editingLibraryBook.publication_year && Number(editingLibraryBook.publication_year) > 0
                      ? toPersianDigits(editingLibraryBook.publication_year)
                      : ''
                  }"
                  placeholder="مثلاً: ۱۴۰۲"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
                />
              </div>

              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">نوبت چاپ</label>
                <input
                  type="text"
                  name="edition_number"
                  value="${toPersianDigits(editingLibraryBook.edition_number || '')}"
                  placeholder="مثلاً: چاپ دوازدهم"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
                />
              </div>

              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">تعداد صفحات</label>
                <input
                  type="text"
                  inputmode="numeric"
                  name="pages_count"
                  value="${
                    editingLibraryBook.pages_count && Number(editingLibraryBook.pages_count) > 0
                      ? toPersianDigits(editingLibraryBook.pages_count)
                      : ''
                  }"
                  placeholder="مثلاً: ۴۸۰"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
                />
              </div>

              <!-- Cover Image Upload & Gallery Picker -->
              <div class="sm:col-span-2 lg:col-span-4">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">تصویر کاور جلد کتاب</label>
                <input type="hidden" name="cover_url" value="${editingLibraryBook.cover_url || ''}" />
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9]">
                  <div class="flex items-center gap-3 min-w-0">
                    ${
                      editingLibraryBook.cover_url
                        ? `<img src="${editingLibraryBook.cover_url}" alt="کاور کتاب" class="w-16 h-22 rounded-lg object-cover border border-[#D5C3AE] shrink-0" />`
                        : `<div class="w-16 h-22 rounded-lg bg-[#EFE3D2] border border-dashed border-[#C5B198] flex items-center justify-center text-[11px] text-[#6B5444] shrink-0 px-1 text-center">بدون تصویر</div>`
                    }
                    <div class="min-w-0">
                      <div class="text-[12.5px] font-semibold text-[#231912]">
                        ${editingLibraryBook.cover_url ? 'تصویر کاور انتخاب شده است' : 'تصویری انتخاب نشده است'}
                      </div>
                      <p class="text-[11px] text-[#6B5444] mt-0.5">
                        می‌توانید تصویر جلد کتاب را مستقیماً از سیستم خود بارگذاری کنید یا از گالری تصاویر انتخاب نمایید.
                      </p>
                    </div>
                  </div>
                  <div class="flex flex-wrap items-center gap-2 shrink-0">
                    <input type="file" accept="image/*" class="js-admin-lib-cover-file-input hidden" />
                    <button
                      type="button"
                      class="js-admin-trigger-lib-cover-upload px-3.5 py-2 rounded-xl bg-[#F3E7D6] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[#3F2E21] text-[12px] font-semibold cursor-pointer"
                    >
                      آپلود تصویر کاور
                    </button>
                    <button
                      type="button"
                      data-gallery-target="library"
                      class="js-admin-open-gallery-picker px-3.5 py-2 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[12px] font-semibold cursor-pointer"
                    >
                      انتخاب از گالری تصاویر
                    </button>
                    ${
                      editingLibraryBook.cover_url
                        ? `
                      <button
                        type="button"
                        class="js-admin-clear-lib-cover px-3 py-2 rounded-xl border border-[#E6B8B3] text-[#9E3329] hover:bg-[#FBEAE8] text-[11.5px] font-semibold cursor-pointer"
                      >
                        حذف تصویر
                      </button>
                    `
                        : ''
                    }
                  </div>
                </div>
              </div>

              <!-- Multi-Tag Management -->
              <div class="sm:col-span-2 lg:col-span-4">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">برچسب‌ها</label>
                <div class="p-3.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] space-y-3">
                  <div class="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="برچسب را بنویسید و دکمه «افزودن برچسب» یا کلید Enter را بزنید..."
                      class="js-admin-lib-tag-input flex-1 px-3.5 py-2 rounded-xl bg-[#FAF5EC] border border-[#DFCEB9] text-[12.5px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
                    />
                    <button
                      type="button"
                      class="js-admin-add-lib-tag-btn px-4 py-2 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[12px] font-semibold cursor-pointer shrink-0"
                    >
                      + افزودن برچسب
                    </button>
                  </div>
                  ${
                    editingLibraryTagsList.length > 0
                      ? `
                    <div class="flex flex-wrap items-center gap-2">
                      ${editingLibraryTagsList
                        .map(
                          (tag, idx) => `
                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FAF5EC] border border-[#D8C4AA] text-[12px] font-semibold text-[#3F2E21]">
                          <span>#${toPersianDigits(tag)}</span>
                          <button
                            type="button"
                            data-edit-tag-idx="${idx}"
                            title="ویرایش برچسب"
                            class="js-admin-edit-lib-tag text-[#7A4B2A] hover:text-[#231912] text-[11px] px-1 cursor-pointer"
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            data-remove-tag-idx="${idx}"
                            title="حذف برچسب"
                            class="js-admin-remove-lib-tag text-[#9E3329] hover:text-[#6E1B14] text-[12px] font-bold px-0.5 cursor-pointer"
                          >
                            ✕
                          </button>
                        </span>
                      `
                        )
                        .join('')}
                    </div>
                  `
                      : `<p class="text-[11.5px] text-[#6B5444]">هنوز برچسبی برای این کتاب ثبت نشده است.</p>`
                  }
                </div>
              </div>

              <!-- خلاصه کتاب -->
              <div class="sm:col-span-2 lg:col-span-4">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">خلاصه کتاب</label>
                <textarea
                  name="short_description"
                  rows="3"
                  placeholder="خلاصه کتاب را وارد نمایید..."
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
                >${toPersianDigits(editingLibraryBook.short_description || '')}</textarea>
              </div>

              <!-- توضیحات -->
              <div class="sm:col-span-2 lg:col-span-4">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">توضیحات</label>
                <textarea
                  name="description"
                  rows="4"
                  placeholder="توضیحات تکمیلی و معرفی کامل کتاب را وارد نمایید..."
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
                >${toPersianDigits(editingLibraryBook.description || '')}</textarea>
              </div>

              <!-- جمله‌ای که به یادگار ماند -->
              <div class="sm:col-span-2 lg:col-span-4">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">جمله‌ای که به یادگار ماند</label>
                <textarea
                  name="memorable_quote"
                  rows="2"
                  placeholder="برشی ماندگار یا جمله‌ای به یادگار مانده از متن کتاب..."
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
                >${toPersianDigits(editingLibraryBook.memorable_quote || '')}</textarea>
              </div>

              <!-- به چه کسانی توصیه می‌شود -->
              <div class="sm:col-span-2 lg:col-span-4">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">به چه کسانی توصیه می‌شود</label>
                <textarea
                  name="recommended_for"
                  rows="2"
                  placeholder="مطالعه این کتاب به چه مخاطبانی توصیه می‌شود..."
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
                >${toPersianDigits(editingLibraryBook.recommended_for || '')}</textarea>
              </div>

              <!-- نکات و یادداشت‌ها -->
              <div class="sm:col-span-2 lg:col-span-4">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">نکات و یادداشت‌ها (هر نکته را در یک خط جداگانه وارد نمایید)</label>
                <textarea
                  name="notes"
                  rows="4"
                  placeholder="هر نکته را در یک سطر بنویسید تا در صفحه کتاب به‌صورت بالت دایره‌ای نمایش داده شود..."
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
                >${toPersianDigits(editingLibraryBook.notes || '')}</textarea>
              </div>
            </div>

            <div class="flex justify-end gap-2.5 pt-2 border-t border-[#E5D7C5]">
              <button
                type="button"
                class="js-admin-cancel-lib-book px-4 py-2.5 rounded-xl border border-[#C5B198] text-[12.5px] font-semibold text-[#4E3B2D] hover:bg-[#EFE3D2] cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                class="px-6 py-2.5 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[13px] font-semibold cursor-pointer"
              >
                ${editingLibraryBook.id ? 'بروزرسانی کتاب در دیتابیس' : 'ذخیره کتاب در دیتابیس'}
              </button>
            </div>
          </form>
        `
            : ''
        }

        <!-- Search and Category Filter Bar -->
        <div class="p-4 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <input
            type="text"
            value="${toPersianDigits(librarySearch)}"
            placeholder="جستجو در عنوان کتاب، خلاصه، توضیحات، دسته‌بندی یا برچسب‌ها..."
            class="js-admin-lib-search flex-1 px-4 py-2.5 rounded-xl bg-[#F4E9DA]/65 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
          />
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              data-lib-cat-filter="all"
              class="js-admin-lib-cat-filter px-3.5 py-2 rounded-xl text-[12px] font-semibold cursor-pointer transition-colors ${
                libraryCategoryFilter === 'all'
                  ? 'bg-[#5A3A22] text-[#FAF5EC]'
                  : 'bg-[#F4E9DA]/70 border border-[#DFCEB9] text-[#4E3B2D] hover:bg-[#E8D8C3]'
              }"
            >
              همه کتاب‌ها (${toPersianDigits(state.libraryBooks.length)})
            </button>
            ${availableCategories
              .map(
                (cat) => `
              <button
                type="button"
                data-lib-cat-filter="${cat}"
                class="js-admin-lib-cat-filter px-3.5 py-2 rounded-xl text-[12px] font-semibold cursor-pointer transition-colors ${
                  libraryCategoryFilter === cat
                    ? 'bg-[#5A3A22] text-[#FAF5EC]'
                    : 'bg-[#F4E9DA]/70 border border-[#DFCEB9] text-[#4E3B2D] hover:bg-[#E8D8C3]'
                }"
              >
                ${toPersianDigits(cat)}
              </button>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Books Grid -->
        ${
          filteredBooks.length === 0
            ? `
          <div class="p-10 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] text-center space-y-2">
            <div class="font-display text-[17px] font-bold text-[#231912]">کتابی در این بخش یافت نشد</div>
            <p class="text-[13px] text-[#6B5444]">
              برای افزودن کتاب جدید به کتابخانه روی دکمه «+ افزودن کتاب جدید» کلیک کنید.
            </p>
          </div>
        `
            : `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            ${filteredBooks
              .map((book) => {
                const bookTags = String(book.tags || '')
                  .split(/[،,]/)
                  .map((t) => t.trim())
                  .filter(Boolean);
                return `
                  <article class="p-5 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] flex flex-col justify-between gap-4">
                    <div class="flex items-start gap-4">
                      ${
                        book.cover_url
                          ? `<img src="${book.cover_url}" alt="${book.title}" class="w-20 h-28 rounded-xl object-cover border border-[#D8C4AA] shrink-0" />`
                          : `<div class="w-20 h-28 rounded-xl bg-[#EFE3D2] border border-[#D8C4AA] flex items-center justify-center text-[11px] text-[#6B5444] shrink-0 text-center px-1">بدون کاور</div>`
                      }
                      <div class="flex-1 min-w-0 space-y-2">
                        <div class="flex items-start justify-between gap-2">
                          <h3 class="font-display text-[17px] font-bold text-[#231912] truncate">
                            ${toPersianDigits(book.title)}
                          </h3>
                          ${
                            book.category
                              ? `<span class="px-2.5 py-0.5 rounded-md bg-[#EFE3D2] text-[#5A3A22] text-[11px] font-semibold shrink-0">${toPersianDigits(book.category)}</span>`
                              : ''
                          }
                        </div>
                        ${
                          book.author || book.translator || book.publisher
                            ? `<p class="text-[11.5px] font-semibold text-[#6B5444] truncate">
                                ${book.author ? `نویسنده: ${toPersianDigits(book.author)}` : ''}${
                                book.author && book.translator ? ' · ' : ''
                              }${book.translator ? `مترجم: ${toPersianDigits(book.translator)}` : ''}${
                                (book.author || book.translator) && book.publisher ? ' · ' : ''
                              }${book.publisher ? `ناشر: ${toPersianDigits(book.publisher)}` : ''}
                              </p>`
                            : ''
                        }
                        ${
                          book.short_description
                            ? `<p class="text-[12.5px] text-[#5B4739] line-clamp-2 leading-[1.75]">${toPersianDigits(book.short_description)}</p>`
                            : `<p class="text-[12px] text-[#8B735E] italic">خلاصه‌ای ثبت نشده است</p>`
                        }
                        ${
                          bookTags.length > 0
                            ? `
                          <div class="flex flex-wrap gap-1.5 pt-1">
                            ${bookTags
                              .slice(0, 4)
                              .map(
                                (tag) =>
                                  `<span class="px-2 py-0.5 rounded-md bg-[#F4E9DA] border border-[#DFCEB9] text-[#4E3B2D] text-[10.5px] font-semibold">#${toPersianDigits(tag)}</span>`
                              )
                              .join('')}
                            ${
                              bookTags.length > 4
                                ? `<span class="text-[10.5px] text-[#6B5444]">+${toPersianDigits(bookTags.length - 4)}</span>`
                                : ''
                            }
                          </div>
                        `
                            : ''
                        }
                      </div>
                    </div>

                    <div class="pt-3 border-t border-[#E6D8C5] flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        data-view-lib-book="${book.id}"
                        class="js-admin-view-lib-book px-3.5 py-1.5 rounded-xl bg-[#F3E7D6] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[#3F2E21] text-[12px] font-semibold cursor-pointer"
                      >
                        مشاهده جزئیات
                      </button>
                      <div class="flex items-center gap-2">
                        <button
                          type="button"
                          data-edit-lib-book="${book.id}"
                          class="js-admin-edit-lib-book px-3.5 py-1.5 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[12px] font-semibold cursor-pointer"
                        >
                          ویرایش
                        </button>
                        <button
                          type="button"
                          data-delete-lib-book="${book.id}"
                          class="js-admin-delete-lib-book px-3.5 py-1.5 rounded-xl border border-[#E6B8B3] text-[#9E3329] hover:bg-[#FBEAE8] text-[12px] font-semibold cursor-pointer"
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
        `
        }
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
      const normStatus = normalizeSessionStatus(s.status);
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
                <input type="text" name="title" required value="${toPersianDigits(editingSession.title || '')}" placeholder="مثلاً: حلقه هم‌خوانی صد سال تنهایی" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">وضعیت دوره *</label>
                <select name="status" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]">
                  <option value="فعال" ${normalizeSessionStatus(editingSession.status) === 'فعال' ? 'selected' : ''}>فعال</option>
                  <option value="غیرفعال" ${normalizeSessionStatus(editingSession.status) === 'غیرفعال' ? 'selected' : ''}>غیرفعال</option>
                  <option value="برگزار شده" ${normalizeSessionStatus(editingSession.status) === 'برگزار شده' ? 'selected' : ''}>برگزار شده</option>
                </select>
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">نام کتاب *</label>
                <input type="text" name="book_title" required value="${toPersianDigits(editingSession.book_title || '')}" placeholder="مثلاً: صد سال تنهایی" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">نام نویسنده *</label>
                <input type="text" name="book_author" required value="${toPersianDigits(editingSession.book_author || '')}" placeholder="مثلاً: گابریل گارسیا مارکز" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">نام مترجم *</label>
                <input type="text" name="translator" required value="${toPersianDigits(editingSession.translator ?? editingSession.mentor_name ?? '')}" placeholder="مثلاً: بهمن فرزانه" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">ژانر / دسته‌بندی کتاب *</label>
                <input type="text" name="category" required value="${toPersianDigits(editingSession.category || '')}" placeholder="مثلاً: ادبیات کلاسیک" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">سال انتشار *</label>
                <input type="text" inputmode="numeric" name="publication_year" required value="${editingSession.publication_year ? toPersianDigits(editingSession.publication_year) : ''}" placeholder="مثلاً: ۱۴۰۵" class="js-persian-digits-input w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">تعداد صفحات *</label>
                <input type="text" inputmode="numeric" name="pages_count" required value="${editingSession.pages_count ? toPersianDigits(editingSession.pages_count) : ''}" placeholder="مثلاً: ۴۶۸" class="js-persian-digits-input w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">انتشارات *</label>
                <input type="text" name="publisher" required value="${toPersianDigits(editingSession.publisher || '')}" placeholder="مثلاً: نشر نیلوفر" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">تاریخ برگزاری جلسه *</label>
                <input
                  type="date"
                  name="session_date"
                  data-existing-date="${editingSession.session_date || ''}"
                  value="${extractIsoDateForInput(editingSession.session_date)}"
                  class="js-admin-date-picker w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]"
                />
                ${
                  editingSession.session_date
                    ? `<span class="js-admin-date-preview block text-[11px] text-[#6B5444] mt-1">تاریخ ثبت‌شده: ${formatPersianDateDisplay(editingSession.session_date)}</span>`
                    : `<span class="js-admin-date-preview block text-[11px] text-[#6B5444] mt-1">تاریخ را از تقویم انتخاب کنید</span>`
                }
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">ساعت شروع جلسه *</label>
                <input
                  type="time"
                  name="session_time"
                  data-existing-time="${editingSession.session_time || ''}"
                  value="${extractTimeForInput(editingSession.session_time)}"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]"
                />
                ${
                  editingSession.session_time
                    ? `<span class="block text-[11px] text-[#6B5444] mt-1">ساعت ثبت‌شده: ${toPersianDigits(editingSession.session_time)}</span>`
                    : ''
                }
              </div>
              <div class="sm:col-span-2 lg:col-span-3">
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
              <div class="sm:col-span-2 lg:col-span-3">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">توضیحات کوتاه کارت (نمایش در کارت کتاب در حال مطالعه و رویدادها) *</label>
                <textarea name="short_description" rows="2" required placeholder="خلاصه کوتاهی از معرفی این کتاب و محور نشست را بنویسید..." class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]">${toPersianDigits(editingSession.short_description || '')}</textarea>
              </div>
              <div class="sm:col-span-2 lg:col-span-3">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">معرفی کامل کتاب و توضیحات نشست (نمایش در صفحه مشاهده جزئیات) *</label>
                <textarea name="full_description" rows="4" required placeholder="توضیحات کامل درباره داستان کتاب، اهمیت ادبی اثر و شیوه برگزاری جلسات هم‌خوانی را وارد نمایید..." class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]">${toPersianDigits(editingSession.full_description || '')}</textarea>
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

        <!-- Search and Status Filter -->
        <div class="p-4 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <input
            type="text"
            value="${toPersianDigits(sessionSearch)}"
            placeholder="جستجو در عنوان دوره، نام کتاب، نویسنده یا مترجم..."
            class="js-admin-session-search flex-1 px-4 py-2 rounded-xl bg-[#F4E9DA]/65 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
          />
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            ${(
              [
                { key: 'all', label: 'همه دوره‌ها' },
                { key: 'فعال', label: 'فعال' },
                { key: 'غیرفعال', label: 'غیرفعال' },
                { key: 'برگزار شده', label: 'برگزار شده' },
              ] as const
            )
              .map(
                (f) => `
              <button
                type="button"
                data-session-filter="${f.key}"
                class="js-admin-session-filter px-3.5 h-8 rounded-lg text-[12px] font-semibold inline-flex items-center justify-center cursor-pointer transition-colors ${
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
              const normStatus = normalizeSessionStatus(s.status);
              return `
            <article class="rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] overflow-hidden flex flex-col justify-between">
              <div>
                <div class="relative h-40 bg-[#EFE3D2]">
                  <img src="${s.cover_url || '/assets/book-current.png'}" alt="${s.title}" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 bg-gradient-to-t from-[#1E140E]/75 via-transparent to-transparent"></div>
                  <div class="absolute bottom-3 right-4 left-4 flex items-center justify-between text-[#FAF5EC] text-[11.5px] font-semibold">
                    <span class="px-2.5 py-1 rounded-lg ${
                      normStatus === 'فعال'
                        ? 'bg-[#235332]/90'
                        : normStatus === 'برگزار شده'
                        ? 'bg-[#1D5430]/95'
                        : 'bg-[#7A5A10]/90'
                    }">${normStatus}</span>
                    <span class="px-2.5 py-1 rounded-lg bg-[#1E140E]/65">${toPersianDigits((s.sub_sessions || []).length)} زیرجلسه</span>
                  </div>
                </div>
                <div class="p-5 space-y-2.5">
                  <h3 class="font-display text-[16.5px] font-bold text-[#231912] truncate">${toPersianDigits(s.title)}</h3>
                  <div class="text-[12.5px] text-[#5B4739] grid grid-cols-2 gap-y-1.5 gap-x-3">
                    <div>نام کتاب: <strong class="text-[#231912]">${toPersianDigits(s.book_title)}</strong></div>
                    <div>نویسنده: <strong class="text-[#231912]">${toPersianDigits(s.book_author || '—')}</strong></div>
                    <div>مترجم: <strong class="text-[#231912]">${toPersianDigits(s.translator || s.mentor_name || '—')}</strong></div>
                    <div>ژانر: <strong class="text-[#231912]">${toPersianDigits(s.category || '—')}</strong></div>
                    <div>تعداد صفحات: <strong class="text-[#231912]">${s.pages_count ? `${toPersianDigits(s.pages_count)} صفحه` : '—'}</strong></div>
                    <div>سال انتشار: <strong class="text-[#231912]">${s.publication_year ? toPersianDigits(s.publication_year) : '—'}</strong></div>
                    <div>انتشارات: <strong class="text-[#231912]">${toPersianDigits(s.publisher || '—')}</strong></div>
                    <div>زمان: <strong class="text-[#231912]">${formatPersianDateDisplay(s.session_date || '—')}${s.session_time ? ` · ساعت ${toPersianDigits(s.session_time)}` : ''}</strong></div>
                  </div>
                  ${renderEnrolledMembersBlock({
                    targetType: 'session',
                    targetId: s.id,
                    targetTitle: s.title,
                    members: s.enrolled_members,
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
                <div class="flex flex-wrap items-center gap-2">
                  ${
                    normStatus !== 'برگزار شده'
                      ? `
                    <button
                      type="button"
                      data-mark-held-session="${s.id}"
                      class="js-admin-mark-session-held px-3 py-2 rounded-xl bg-[#E4F2E7] hover:bg-[#235332] text-[#235332] hover:text-[#FAF5EC] border border-[#BBD9C2] text-[12px] font-semibold cursor-pointer transition-colors"
                    >
                      برگزار شده
                    </button>
                  `
                      : `
                    <span class="px-3 py-2 rounded-xl bg-[#E4F2E7] text-[#235332] border border-[#BBD9C2] text-[11.5px] font-bold">
                      ✓ برگزار شده
                    </span>
                  `
                  }
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
                value="${toPersianDigits(subBeingEdited?.session_number || '')}"
                placeholder="مثلاً: جلسه اول"
                class="js-persian-digits-input w-full px-3 py-2 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[12.5px]"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[11.5px] font-semibold text-[#4E3B2D] mb-1">عنوان جلسه *</label>
              <input
                type="text"
                name="title"
                required
                value="${toPersianDigits(subBeingEdited?.title || '')}"
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
              <label class="block text-[11.5px] font-semibold text-[#4E3B2D] mb-1">تاریخ برگزاری *</label>
              <input
                type="date"
                name="session_date"
                data-existing-date="${subBeingEdited?.session_date || ''}"
                value="${extractIsoDateForInput(subBeingEdited?.session_date)}"
                class="js-admin-date-picker w-full px-3 py-2 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[12.5px]"
              />
              ${
                subBeingEdited?.session_date
                  ? `<span class="js-admin-date-preview block text-[11px] text-[#6B5444] mt-1">تاریخ ثبت‌شده: ${formatPersianDateDisplay(subBeingEdited.session_date)}</span>`
                  : `<span class="js-admin-date-preview block text-[11px] text-[#6B5444] mt-1">تاریخ جلسه را انتخاب کنید</span>`
              }
            </div>
            <div>
              <label class="block text-[11.5px] font-semibold text-[#4E3B2D] mb-1">ساعت شروع جلسه *</label>
              <input
                type="time"
                name="session_time"
                data-existing-time="${subBeingEdited?.session_time || ''}"
                value="${extractTimeForInput(subBeingEdited?.session_time)}"
                class="w-full px-3 py-2 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[12.5px]"
              />
              ${
                subBeingEdited?.session_time
                  ? `<span class="block text-[11px] text-[#6B5444] mt-1">ساعت ثبت‌شده: ${toPersianDigits(subBeingEdited.session_time)}</span>`
                  : ''
              }
            </div>
            <div>
              <label class="block text-[11.5px] font-semibold text-[#4E3B2D] mb-1">سر فصل جلسه</label>
              <input
                type="text"
                name="pages_to_read"
                value="${toPersianDigits(subBeingEdited?.pages_to_read || '')}"
                placeholder="سرفصل یا موضوع مورد مطالعه این جلسه را وارد کنید"
                class="js-persian-digits-input w-full px-3 py-2 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[12.5px]"
              />
            </div>
            <div>
              <label class="block text-[11.5px] font-semibold text-[#4E3B2D] mb-1">لینک ورود به جلسه</label>
              <input
                type="text"
                name="meeting_link"
                dir="ltr"
                value="${subBeingEdited?.meeting_link || ''}"
                placeholder="https://meet.bookmeet.ir/live"
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
                    ${formatPersianDateDisplay(sub.session_date)}${
                      sub.session_time ? ` · ساعت ${toPersianDigits(sub.session_time)}` : ''
                    }
                  </span>
                </div>
                <h4 class="font-display text-[15.5px] font-bold text-[#231912]">${toPersianDigits(sub.title)}</h4>
                <p class="text-[12px] text-[#5B4739]">سر فصل جلسه: ${toPersianDigits(sub.pages_to_read || String(sub.pages_read || '—'))}</p>
              </div>
              <div class="pt-2 border-t border-[#E6D8C5] flex flex-wrap items-center justify-end gap-2">
                ${
                  displayStatus !== 'برگزار شده'
                    ? `
                  <button
                    type="button"
                    data-parent-type="${params.parentType}"
                    data-parent-id="${params.parentId}"
                    data-sub-id="${sub.id}"
                    class="js-admin-mark-subsession-held px-3 py-1.5 rounded-lg bg-[#E4F2E7] hover:bg-[#235332] text-[#235332] hover:text-[#FAF5EC] border border-[#BBD9C2] text-[11.5px] font-semibold cursor-pointer transition-colors"
                  >
                    برگزار شده
                  </button>
                `
                    : `
                  <span class="px-2.5 py-1 rounded-lg bg-[#E4F2E7] text-[#235332] border border-[#BBD9C2] text-[11px] font-bold">
                    ✓ برگزار شده
                  </span>
                `
                }
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
          <form class="js-admin-class-form p-6 rounded-2xl bg-[#FAF5EC] border-2 border-[#C8AF8F] space-y-5">
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
                <input type="text" name="instructor_name" required value="${toPersianDigits(editingClass.instructor_name || '')}" placeholder="مثلاً: دکتر سهراب رستگار" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">برنامه هفتگی (روز و ساعت کلاس)</label>
                <input type="text" name="schedule_summary" value="${toPersianDigits(editingClass.schedule_summary || '')}" placeholder="مثلاً: دوشنبه‌ها · ساعت ۱۷:۳۰ تا ۱۹:۳۰" class="js-persian-digits-input w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">زمان شروع دوره</label>
                <input type="text" name="start_date" value="${toPersianDigits(editingClass.start_date || '')}" placeholder="مثلاً: ۱۵ آبان ۱۴۰۵" class="js-persian-digits-input w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">زمان پایان دوره</label>
                <input type="text" name="end_date" value="${toPersianDigits(editingClass.end_date || '')}" placeholder="مثلاً: ۳۰ دی ۱۴۰۵" class="js-persian-digits-input w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">مدت دوره</label>
                <input type="text" name="duration_label" value="${toPersianDigits(editingClass.duration_label || '')}" placeholder="مثلاً: ۱۰ هفته (۲۰ ساعت)" class="js-persian-digits-input w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">تعداد جلسات</label>
                <input type="text" name="sessions_count" value="${toPersianDigits(editingClass.sessions_count || '')}" placeholder="مثلاً: ۱۰ جلسه آموزشی" class="js-persian-digits-input w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">وضعیت ظرفیت</label>
                <input type="text" name="capacity_label" value="${toPersianDigits(editingClass.capacity_label || '')}" placeholder="مثلاً: ظرفیت محدود (۸ نفر)" class="js-persian-digits-input w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]" />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">سطح کلاس *</label>
                <select name="level_label" class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]">
                  <option value="مبتدی" ${editingClass.level_label === 'مبتدی' || !editingClass.level_label ? 'selected' : ''}>مبتدی</option>
                  <option value="پیشرفته" ${editingClass.level_label === 'پیشرفته' ? 'selected' : ''}>پیشرفته</option>
                  <option value="تخصصی" ${editingClass.level_label === 'تخصصی' ? 'selected' : ''}>تخصصی</option>
                </select>
              </div>
              <div class="sm:col-span-3">
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

            <!-- Session-by-Session Course Syllabus Builder -->
            <div class="pt-4 border-t border-[#DFCEB9] space-y-3.5">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 class="font-display text-[15px] font-bold text-[#231912]">
                    سرفصل‌های جلسه به جلسه دوره
                  </h4>
                  <p class="text-[12px] text-[#6B5444]">
                    سرفصل هر جلسه از دوره را به‌صورت جداگانه اضافه، ویرایش یا جابه‌جا کنید تا در صفحه جزئیات دوره نمایش داده شود.
                  </p>
                </div>
                <button
                  type="button"
                  class="js-admin-add-syllabus-item px-3.5 py-2 rounded-xl bg-[#EFE3D2] hover:bg-[#E2D0B8] border border-[#D4BEA2] text-[#3F2E21] text-[12px] font-bold cursor-pointer self-start sm:self-auto shrink-0"
                >
                  + افزودن جلسه به سرفصل
                </button>
              </div>

              ${
                Array.isArray(editingClass.syllabus) && editingClass.syllabus.length > 0
                  ? `
                <div class="space-y-2.5">
                  ${editingClass.syllabus
                    .map(
                      (item, idx) => `
                    <div
                      data-syllabus-id="${item.id || idx + 1}"
                      data-syllabus-index="${idx}"
                      class="js-admin-syllabus-row p-3.5 rounded-xl bg-[#F4E9DA]/75 border border-[#DFCEB9] flex flex-col sm:flex-row items-stretch sm:items-start gap-3"
                    >
                      <div class="flex items-center gap-2 sm:w-36 shrink-0">
                        <span class="w-7 h-7 rounded-lg bg-[#5A3A22] text-[#FAF5EC] text-[12px] font-bold inline-flex items-center justify-center shrink-0">
                          ${toPersianDigits(idx + 1)}
                        </span>
                        <input
                          type="text"
                          value="${toPersianDigits(item.session_number || `جلسه ${idx + 1}`)}"
                          placeholder="شماره جلسه"
                          class="js-syllabus-number-input w-full px-2.5 py-1.5 rounded-lg bg-[#FAF5EC] border border-[#D8C5AC] text-[12px] font-semibold text-[#231912]"
                        />
                      </div>
                      <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          value="${item.title || ''}"
                          placeholder="عنوان سرفصل این جلسه (مثلاً: الفبای سیریلیک و آواشناسی)"
                          class="js-syllabus-title-input w-full px-3 py-1.5 rounded-lg bg-[#FAF5EC] border border-[#D8C5AC] text-[12.5px] text-[#231912]"
                        />
                        <input
                          type="text"
                          value="${item.description || ''}"
                          placeholder="توضیح کوتاه یا مباحث جلسه (اختیاری)"
                          class="js-syllabus-desc-input w-full px-3 py-1.5 rounded-lg bg-[#FAF5EC] border border-[#D8C5AC] text-[12.5px] text-[#231912]"
                        />
                      </div>
                      <div class="flex items-center justify-end gap-1 shrink-0">
                        <button
                          type="button"
                          data-move-syllabus="${idx}"
                          data-move-dir="up"
                          title="انتقال به بالا"
                          ${idx === 0 ? 'disabled' : ''}
                          class="js-admin-move-syllabus w-7 h-7 rounded-lg bg-[#FAF5EC] hover:bg-[#E5D4BC] border border-[#D8C5AC] text-[#4E3B2D] text-[12px] font-bold inline-flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          data-move-syllabus="${idx}"
                          data-move-dir="down"
                          title="انتقال به پایین"
                          ${idx === (editingClass.syllabus?.length || 1) - 1 ? 'disabled' : ''}
                          class="js-admin-move-syllabus w-7 h-7 rounded-lg bg-[#FAF5EC] hover:bg-[#E5D4BC] border border-[#D8C5AC] text-[#4E3B2D] text-[12px] font-bold inline-flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          data-remove-syllabus="${idx}"
                          title="حذف این جلسه از سرفصل"
                          class="js-admin-remove-syllabus-item px-2.5 h-7 rounded-lg border border-[#E6B8B3] text-[#9E3329] hover:bg-[#FBEAE8] text-[11.5px] font-semibold inline-flex items-center justify-center cursor-pointer"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  `
                    )
                    .join('')}
                </div>
              `
                  : `
                <div class="p-4 rounded-xl bg-[#F4E9DA]/45 border border-dashed border-[#D8C5AC] text-center text-[12.5px] text-[#6B5444]">
                  هنوز جلسه‌ای در سرفصل این دوره ثبت نشده است. با دکمه «+ افزودن جلسه به سرفصل» جلسات دوره را اضافه کنید.
                </div>
              `
              }
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
                    <span class="px-2.5 py-1 rounded-lg bg-[#1E140E]/65">${toPersianDigits(
                      c.sessions_count || `${(c.syllabus || c.sub_sessions || []).length} جلسه آموزشی`
                    )}</span>
                  </div>
                </div>
                <div class="p-5 space-y-2.5">
                  <h3 class="font-display text-[16.5px] font-bold text-[#231912] text-justify leading-[1.65]">${toPersianDigits(c.title)}</h3>
                  <p class="text-[12.5px] text-[#5B4739] text-justify leading-[1.8]">${toPersianDigits(c.description)}</p>
                  <div class="pt-2 border-t border-[#E6D8C5] text-[12px] text-[#5B4739] grid grid-cols-1 sm:grid-cols-2 gap-1">
                    <div>مدرس: <strong class="text-[#231912]">${toPersianDigits(c.instructor_name || '—')}</strong></div>
                    <div>برنامه: <strong class="text-[#231912]">${toPersianDigits(c.schedule_summary || '—')}</strong></div>
                    ${
                      c.start_date
                        ? `<div>شروع: <strong class="text-[#231912]">${toPersianDigits(c.start_date)}</strong></div>`
                        : ''
                    }
                    ${
                      c.end_date
                        ? `<div>پایان: <strong class="text-[#231912]">${toPersianDigits(c.end_date)}</strong></div>`
                        : ''
                    }
                    ${
                      c.duration_label
                        ? `<div>مدت: <strong class="text-[#231912]">${toPersianDigits(c.duration_label)}</strong></div>`
                        : ''
                    }
                    ${
                      c.capacity_label
                        ? `<div>ظرفیت: <strong class="text-[#235332]">${toPersianDigits(c.capacity_label)}</strong></div>`
                        : ''
                    }
                  </div>
                  ${renderEnrolledMembersBlock({
                    targetType: 'class',
                    targetId: c.id,
                    targetTitle: c.title,
                    members: c.enrolled_members,
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
      return `${u.first_name} ${u.last_name} ${u.phone} ${u.email || ''} ${u.education || ''}`
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
            placeholder="جستجو در جدول کاربران بر اساس نام، شماره تلفن، ایمیل یا تحصیلات..."
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
            <table class="w-full text-right border-collapse min-w-[940px]">
              <thead>
                <tr class="bg-[#EFE3D2] text-[#3F2E21] text-[12px] font-bold border-b border-[#DFCEB9]">
                  <th class="py-3.5 px-4">#</th>
                  <th class="py-3.5 px-4">کاربر (نام و تصویر پروفایل)</th>
                  <th class="py-3.5 px-4">وضعیت</th>
                  <th class="py-3.5 px-4">کد عضویت</th>
                  <th class="py-3.5 px-4">شماره همراه</th>
                  <th class="py-3.5 px-4">پست الکترونیک (ایمیل)</th>
                  <th class="py-3.5 px-4">تحصیلات</th>
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
                    <td class="py-3.5 px-4 whitespace-nowrap text-[#6B5444]">${toPersianDigits(u.joined_date || '—')}</td>
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
  function getAdminTicketMessagesList(ticket: MemberTicket) {
    if (Array.isArray(ticket.messages) && ticket.messages.length > 0) {
      return ticket.messages;
    }
    return [
      {
        id: `init-${ticket.id}`,
        sender_role: 'member' as const,
        sender_name: ticket.member_phone || 'کاربر باشگاه',
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

  function getAdminTicketLatestReplyDate(ticket: MemberTicket): string {
    const msgs = getAdminTicketMessagesList(ticket);
    if (msgs.length > 1) {
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg?.created_at) return lastMsg.created_at;
    }
    if (ticket.updated_at && ticket.updated_at !== ticket.created_at) {
      return ticket.updated_at;
    }
    return 'بدون پاسخ جدید';
  }

  function getTicketOwnerLabel(ticket: MemberTicket): string {
    const rawPhone = String(ticket.member_phone || '').trim();
    const normPhone = toEnglishDigits(rawPhone);
    const matchedUser = state.users.find(
      (u) => u.phone === rawPhone || toEnglishDigits(u.phone) === normPhone
    );
    if (matchedUser) {
      return `${matchedUser.first_name} ${matchedUser.last_name} (${toPersianDigits(rawPhone)})`;
    }
    return toPersianDigits(rawPhone || 'کاربر باشگاه');
  }

  function renderTicketsTab(): string {
    // Dedicated Ticket Detail Page when a ticket card is opened
    if (selectedAdminTicketId !== null) {
      const ticket = state.tickets.find((t) => Number(t.id) === Number(selectedAdminTicketId));
      if (ticket) {
        const messagesList = getAdminTicketMessagesList(ticket);
        const latestReplyDate = getAdminTicketLatestReplyDate(ticket);
        const ownerLabel = getTicketOwnerLabel(ticket);
        const isClosed = ticket.status === 'بسته‌شده';
        const statusBadgeClass =
          ticket.status === 'پاسخ داده‌شده'
            ? 'bg-[#E4F2E7] text-[#235332] border-[#BBD9C2]'
            : isClosed
            ? 'bg-[#EAE0D2] text-[#5B4739] border-[#D5C3AE]'
            : 'bg-[#FFF3CD] text-[#7A5A10] border-[#E5C77B]';

        return `
          <div data-admin-ticket-card="${ticket.id}" class="space-y-6">
            <!-- Top Navigation & Actions Bar -->
            <div class="p-5 sm:p-6 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div class="space-y-2">
                <button
                  type="button"
                  class="js-admin-back-to-tickets-list inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#7A4B2A] hover:text-[#231912] cursor-pointer"
                >
                  <span>→</span>
                  <span>بازگشت به لیست تیکت‌ها</span>
                </button>
                <div class="flex items-center gap-2.5 flex-wrap">
                  <span class="font-mono text-[12px] font-bold px-2.5 py-1 rounded-md bg-[#EFE3D2] text-[#4E3B2D]">
                    #${toPersianDigits(ticket.ticket_code)}
                  </span>
                  <h2 class="font-display text-[19px] sm:text-[21px] font-bold text-[#231912]">
                    ${toPersianDigits(ticket.subject)}
                  </h2>
                  <span class="px-2.5 py-0.5 rounded-md border text-[11.5px] font-semibold ${statusBadgeClass}">
                    ${toPersianDigits(ticket.status)}
                  </span>
                </div>
                <div class="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px] text-[#5B4739]">
                  <span>صاحب تیکت: <strong class="text-[#231912]">${ownerLabel}</strong></span>
                  <span>بخش: <strong class="text-[#231912]">${toPersianDigits(ticket.department)}</strong></span>
                  <span>تاریخ ایجاد: <strong class="text-[#231912]">${toPersianDigits(ticket.created_at)}</strong></span>
                  <span>آخرین پاسخ: <strong class="text-[#231912]">${toPersianDigits(latestReplyDate)}</strong></span>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-center">
                ${
                  !isClosed
                    ? `
                  <button
                    type="button"
                    data-close-ticket="${ticket.id}"
                    class="js-admin-close-ticket-btn px-4 py-2 rounded-xl bg-[#7A5411] hover:bg-[#5E3F0A] text-[#FAF5EC] text-[12px] font-semibold transition-colors cursor-pointer"
                  >
                    بستن تیکت
                  </button>
                `
                    : `
                  <span class="px-3.5 py-2 rounded-xl bg-[#EAE0D2] border border-[#D5C3AE] text-[#5B4739] text-[12px] font-semibold">
                    🔒 تیکت بسته شده
                  </span>
                `
                }
                <button
                  type="button"
                  data-delete-ticket="${ticket.id}"
                  class="js-admin-delete-ticket px-3.5 py-2 rounded-xl border border-[#E6B8B3] text-[#9E3329] hover:bg-[#FBEAE8] text-[12px] font-semibold cursor-pointer"
                >
                  حذف تیکت
                </button>
              </div>
            </div>

            <!-- Full Conversation Thread -->
            <div class="p-5 sm:p-6 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-[#E6D8C5]">
                <h3 class="font-display text-[16.5px] font-bold text-[#231912]">
                  تاریخچه کامل گفت‌وگو و فایل‌های پیوست (${toPersianDigits(messagesList.length)} پیام)
                </h3>
                <span class="text-[11.5px] text-[#7A6352]">اولویت: ${toPersianDigits(ticket.priority || 'عادی')}</span>
              </div>

              <div class="space-y-3">
                ${messagesList
                  .map((msg, msgIdx) => {
                    const isAdmin = msg.sender_role === 'admin';
                    const msgAttachments = Array.isArray(msg.attachments) ? msg.attachments : [];
                    const legacyName =
                      msgIdx === 0 && msgAttachments.length === 0 ? ticket.attachment_name : undefined;
                    return `
                      <div class="p-4 rounded-xl border ${
                        isAdmin
                          ? 'bg-[#EEF6F0] border-[#C5DFCC] text-[#1E3F29]'
                          : 'bg-[#F4E9DA]/55 border-[#E8DAC6] text-[#3D2E22]'
                      } space-y-2">
                        <div class="flex items-center justify-between gap-2 text-[11.5px] ${
                          isAdmin ? 'text-[#235332]' : 'text-[#6B5444]'
                        }">
                          <span class="font-bold">
                            ${isAdmin ? 'پاسخ مدیر باشگاه / دبیرخانه' : `پیام کاربر (${ownerLabel})`}
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

              <!-- Reply Form or Closed Notice -->
              ${
                isClosed
                  ? `
                <div class="p-4 rounded-xl bg-[#EAE0D2]/80 border border-[#D5C3AE] text-[13px] font-semibold text-[#5B4739] text-center">
                  این تیکت بسته شده است و امکان ارسال پاسخ جدید برای آن وجود ندارد.
                </div>
              `
                  : `
                <div class="pt-4 border-t border-[#E6D8C5] space-y-3">
                  <div>
                    <label class="block text-[12.5px] font-semibold text-[#235332] mb-1.5">ثبت پاسخ جدید دبیرخانه / مدیر باشگاه:</label>
                    <textarea
                      rows="3"
                      placeholder="متن پاسخ جدید خود را اینجا بنویسید..."
                      class="js-admin-ticket-reply-input w-full px-3.5 py-2.5 rounded-xl bg-[#FDFBF7] border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
                    ></textarea>
                  </div>
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-[#F4E9DA]/50 border border-[#E2D2BE]">
                    <div class="flex items-center gap-2 flex-wrap">
                      <label class="text-[11.5px] font-semibold text-[#4E3B2D]">📎 پیوست فایل یا تصویر به پاسخ (اختیاری):</label>
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                        class="js-admin-ticket-reply-files text-[11.5px] text-[#4E3B2D] file:ml-2 file:px-3 file:py-1 file:rounded-lg file:border-0 file:bg-[#5A3A22] file:text-[#FAF5EC] file:text-[11px] file:font-semibold file:cursor-pointer"
                      />
                    </div>
                    <span class="text-[10.5px] text-[#7A6352]">فرمت‌های مجاز: تصویر، PDF، Word، ZIP (حداکثر ۵ مگابایت)</span>
                  </div>
                  <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div class="flex items-center gap-2">
                      <label class="text-[12px] font-semibold text-[#4E3B2D]">وضعیت پس از ثبت:</label>
                      <select class="js-admin-ticket-status-select px-3 py-1.5 rounded-xl bg-[#F4E9DA]/70 border border-[#DFCEB9] text-[12.5px] text-[#231912]">
                        <option value="پاسخ داده‌شده" ${ticket.status === 'پاسخ داده‌شده' ? 'selected' : ''}>پاسخ داده‌شده</option>
                        <option value="در انتظار بررسی" ${ticket.status === 'در انتظار بررسی' ? 'selected' : ''}>در انتظار بررسی</option>
                      </select>
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        data-close-ticket="${ticket.id}"
                        class="js-admin-close-ticket-btn px-4 py-2 rounded-xl border border-[#C5B198] hover:bg-[#EFE2CE] text-[#4E3B2D] text-[12px] font-semibold cursor-pointer"
                      >
                        بستن تیکت
                      </button>
                      <button
                        type="button"
                        data-save-ticket="${ticket.id}"
                        class="js-admin-save-ticket px-5 py-2 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[12.5px] font-semibold cursor-pointer"
                      >
                        ارسال پاسخ دبیرخانه
                      </button>
                    </div>
                  </div>
                </div>
              `
              }
            </div>
          </div>
        `;
      }
      selectedAdminTicketId = null;
    }

    const filteredTickets = state.tickets.filter((t) => {
      if (ticketFilter === 'all') return true;
      return t.status === ticketFilter;
    });

    const pendingCount = state.tickets.filter((t) => t.status === 'در انتظار بررسی').length;
    const repliedCount = state.tickets.filter((t) => t.status === 'پاسخ داده‌شده').length;
    const closedCount = state.tickets.filter((t) => t.status === 'بسته‌شده').length;

    return `
      <div class="space-y-6">
        <div>
          <h2 class="font-display text-[20px] sm:text-[23px] font-bold text-[#231912]">مدیریت تیکت‌ها و درخواست‌های اعضا</h2>
          <p class="text-[13.5px] text-[#6B5444] mt-1">
            کارت‌های خلاصه تیکت‌های ارسالی اعضا. برای مشاهده مکالمه کامل، ارسال پاسخ یا بستن تیکت روی دکمه «مشاهده جزئیات» کلیک کنید.
          </p>
        </div>

        <!-- Structured RTL Ticket Filter Bar -->
        <div class="p-4 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-2 text-[12.5px] font-semibold text-[#4E3B2D]">
            <span class="w-2 h-2 rounded-full bg-[#5A3A22]"></span>
            <span>فیلتر بر اساس وضعیت تیکت:</span>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            ${(
              [
                { key: 'all', label: 'همه تیکت‌ها', count: state.tickets.length },
                { key: 'در انتظار بررسی', label: 'در انتظار بررسی', count: pendingCount },
                { key: 'پاسخ داده‌شده', label: 'پاسخ داده‌شده', count: repliedCount },
                { key: 'بسته‌شده', label: 'بسته‌شده', count: closedCount },
              ] as const
            )
              .map(
                (f) => `
              <button
                type="button"
                data-ticket-filter="${f.key}"
                class="js-admin-ticket-filter px-3.5 py-2 rounded-xl text-[12px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  ticketFilter === f.key
                    ? 'bg-[#5A3A22] text-[#FAF5EC] shadow-xs'
                    : 'bg-[#F4E9DA]/70 border border-[#DFCEB9] text-[#4E3B2D] hover:bg-[#E6D5BE]'
                }"
              >
                <span>${f.label}</span>
                <span class="px-1.5 py-0.5 rounded-md text-[10.5px] ${
                  ticketFilter === f.key
                    ? 'bg-[#FAF5EC]/20 text-[#FAF5EC]'
                    : 'bg-[#E5D7C5] text-[#4E3B2D]'
                }">${toPersianDigits(f.count)}</span>
              </button>
            `
              )
              .join('')}
          </div>
        </div>

        ${
          filteredTickets.length === 0
            ? `
          <div class="p-8 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] text-center text-[13.5px] text-[#6B5444]">
            تیکتی در این وضعیت یافت نشد.
          </div>
        `
            : `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            ${filteredTickets
              .map((ticket) => {
                const messagesList = getAdminTicketMessagesList(ticket);
                const latestReplyDate = getAdminTicketLatestReplyDate(ticket);
                const ownerLabel = getTicketOwnerLabel(ticket);
                const attachmentsCount =
                  (ticket.attachments || []).length || (ticket.attachment_name ? 1 : 0);
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

                      <h3 class="font-display text-[16.5px] font-bold text-[#231912] leading-[1.6] truncate" title="${toPersianDigits(ticket.subject)}">
                        ${toPersianDigits(ticket.subject)}
                      </h3>

                      <div class="pt-2.5 border-t border-[#E6D8C5] space-y-1.5 text-[12px] text-[#5B4739]">
                        <div class="flex items-center justify-between gap-2">
                          <span class="text-[#7A6352]">فرستنده (صاحب تیکت):</span>
                          <strong class="text-[#231912] truncate">${ownerLabel}</strong>
                        </div>
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
                        <span>💬 ${toPersianDigits(messagesList.length)} پیام</span>
                        ${
                          attachmentsCount > 0
                            ? `<span>· 📎 ${toPersianDigits(attachmentsCount)} پیوست</span>`
                            : ''
                        }
                      </div>
                      <button
                        type="button"
                        data-ticket-id="${ticket.id}"
                        class="js-admin-open-ticket-detail px-4 py-2 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[12px] font-semibold transition-colors cursor-pointer"
                      >
                        مشاهده جزئیات ←
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
                  value="${editingBlogPost.author || ''}"
                  placeholder="نام نویسنده مقاله را وارد کنید"
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
                  value="${editingBlogPost.published_date || ''}"
                  placeholder="مثلاً: ۱۴ آبان ۱۴۰۵"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]"
                />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">زمان تخمینی مطالعه</label>
                <input
                  type="text"
                  name="reading_time"
                  value="${editingBlogPost.reading_time || ''}"
                  placeholder="مثلاً: ۶ دقیقه مطالعه"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]"
                />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">برچسب‌ها و کلمات کلیدی (با ویرگول جدا کنید)</label>
                <input
                  type="text"
                  name="tags"
                  value="${editingBlogPost.tags || ''}"
                  placeholder="در صورت تمایل برچسب‌ها را با ویرگول وارد کنید"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]"
                />
              </div>

              <!-- Cover Picker from Gallery or Direct Upload -->
              <div class="sm:col-span-3">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">تصویر کاور مقاله *</label>
                <input type="hidden" name="cover_url" value="${editingBlogPost.cover_url || '/assets/blog-1.png'}" />
                <input type="file" accept="image/*" class="js-admin-blog-cover-file-input hidden" />
                <div class="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9]">
                  <div class="flex items-center gap-3.5">
                    <img
                      src="${editingBlogPost.cover_url || '/assets/blog-1.png'}"
                      alt="کاور مقاله"
                      class="w-24 h-16 rounded-xl object-cover border border-[#D5C3AE]"
                    />
                    <div>
                      <div class="text-[13px] font-bold text-[#231912]">تصویر شاخص مقاله</div>
                      <div dir="ltr" class="text-[11.5px] text-[#6B5444] text-left max-w-[260px] truncate">${
                        (editingBlogPost.cover_url || '').startsWith('data:image/')
                          ? 'تصویر آپلود شده اختصاصی'
                          : editingBlogPost.cover_url || '/assets/blog-1.png'
                      }</div>
                    </div>
                  </div>
                  <div class="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      class="js-admin-trigger-blog-cover-upload px-3.5 py-2 rounded-xl bg-[#F3E7D6] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[#3F2E21] text-[12px] font-semibold cursor-pointer"
                    >
                      + آپلود تصویر از دستگاه
                    </button>
                    <button
                      type="button"
                      data-gallery-target="blog"
                      class="js-admin-open-gallery-picker px-4 py-2 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[12.5px] font-semibold cursor-pointer"
                    >
                      انتخاب تصویر کاور از گالری تصاویر
                    </button>
                  </div>
                </div>
              </div>

              <div class="sm:col-span-3">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">خلاصه مقاله (چکیده / لید)</label>
                <textarea
                  name="excerpt"
                  rows="3"
                  placeholder="خلاصه‌ای از موضوع مقاله که در کارت‌های صفحه اصلی نمایش داده می‌شود..."
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13.5px] leading-[1.85]"
                >${editingBlogPost.excerpt || ''}</textarea>
              </div>

              <div class="sm:col-span-3">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1.5">متن کامل مقاله *</label>
                <div class="rounded-xl border border-[#DFCEB9] bg-[#FAF5EC] overflow-hidden shadow-2xs">
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
                      title="زیرخط‌دار (Underline)"
                      class="js-blog-editor-tool h-8 px-2.5 rounded-lg bg-[#FAF5EC] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[12px] underline font-semibold text-[#231912] cursor-pointer"
                    >
                      U زیرخط
                    </button>
                    <span class="w-px h-5 bg-[#D5C3AE] mx-0.5"></span>
                    <button
                      type="button"
                      data-editor-cmd="h2"
                      title="تیتر اصلی (H2)"
                      class="js-blog-editor-tool h-8 px-2.5 rounded-lg bg-[#FAF5EC] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[12px] font-bold text-[#231912] cursor-pointer"
                    >
                      تیتر H2
                    </button>
                    <button
                      type="button"
                      data-editor-cmd="h3"
                      title="زیرعنوان (H3)"
                      class="js-blog-editor-tool h-8 px-2.5 rounded-lg bg-[#FAF5EC] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[12px] font-semibold text-[#231912] cursor-pointer"
                    >
                      زیرعنوان H3
                    </button>
                    <button
                      type="button"
                      data-editor-cmd="p"
                      title="پاراگراف معمولی"
                      class="js-blog-editor-tool h-8 px-2.5 rounded-lg bg-[#FAF5EC] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[12px] font-semibold text-[#231912] cursor-pointer"
                    >
                      پاراگراف
                    </button>
                    <button
                      type="button"
                      data-editor-cmd="quote"
                      title="نقل‌قول (Blockquote)"
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
                    <span class="w-px h-5 bg-[#D5C3AE] mx-0.5"></span>
                    <button
                      type="button"
                      data-editor-cmd="align-right"
                      title="تراز از راست"
                      class="js-blog-editor-tool h-8 px-2.5 rounded-lg bg-[#FAF5EC] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[12px] font-semibold text-[#231912] cursor-pointer"
                    >
                      راست‌چین
                    </button>
                    <button
                      type="button"
                      data-editor-cmd="align-center"
                      title="وسط‌چین"
                      class="js-blog-editor-tool h-8 px-2.5 rounded-lg bg-[#FAF5EC] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[12px] font-semibold text-[#231912] cursor-pointer"
                    >
                      وسط‌چین
                    </button>
                    <button
                      type="button"
                      data-editor-cmd="align-left"
                      title="چپ‌چین"
                      class="js-blog-editor-tool h-8 px-2.5 rounded-lg bg-[#FAF5EC] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[12px] font-semibold text-[#231912] cursor-pointer"
                    >
                      چپ‌چین
                    </button>
                    <button
                      type="button"
                      data-editor-cmd="align-justify"
                      title="تراز دوطرفه (Justify)"
                      class="js-blog-editor-tool h-8 px-2.5 rounded-lg bg-[#FAF5EC] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[12px] font-semibold text-[#231912] cursor-pointer"
                    >
                      هم‌تراز
                    </button>
                    <span class="w-px h-5 bg-[#D5C3AE] mx-0.5"></span>
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
                      data-editor-cmd="image"
                      title="درج تصویر در متن"
                      aria-label="درج تصویر در متن"
                      class="js-blog-editor-tool h-8 w-8 inline-flex items-center justify-center rounded-lg bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] cursor-pointer"
                    >
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                    </button>
                    <button
                      type="button"
                      data-editor-cmd="undo"
                      title="بازگشت به قبل (Undo)"
                      class="js-blog-editor-tool h-8 px-2.5 rounded-lg bg-[#FAF5EC] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[12px] font-semibold text-[#231912] cursor-pointer"
                    >
                      ↶ واگرد
                    </button>
                    <button
                      type="button"
                      data-editor-cmd="redo"
                      title="انجام مجدد (Redo)"
                      class="js-blog-editor-tool h-8 px-2.5 rounded-lg bg-[#FAF5EC] hover:bg-[#E5D4BC] border border-[#D8C4AA] text-[12px] font-semibold text-[#231912] cursor-pointer"
                    >
                      ↷ از نو
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

                  <!-- Inline Link Inserter Bar (Hidden by default) -->
                  <div class="js-blog-link-bar hidden px-3.5 py-2.5 bg-[#F4E9DA] border-b border-[#DFCEB9] flex flex-wrap items-center gap-2">
                    <span class="text-[12px] font-semibold text-[#4E3B2D]">نشانی لینک (URL):</span>
                    <input
                      type="url"
                      dir="ltr"
                      placeholder="https://example.com"
                      class="js-blog-link-url-input flex-1 min-w-[200px] px-3 py-1.5 rounded-lg bg-[#FAF5EC] border border-[#D8C4AA] text-[12.5px] text-[#231912] text-left"
                    />
                    <button
                      type="button"
                      class="js-blog-apply-link px-3.5 py-1.5 rounded-lg bg-[#5A3A22] text-[#FAF5EC] text-[12px] font-semibold cursor-pointer"
                    >
                      اعمال لینک
                    </button>
                    <button
                      type="button"
                      class="js-blog-cancel-link px-3 py-1.5 rounded-lg border border-[#C5B198] text-[12px] font-semibold text-[#4E3B2D] cursor-pointer"
                    >
                      بستن
                    </button>
                  </div>

                  <!-- Inline Image Inserter & Size Bar (Hidden by default) -->
                  <div class="js-blog-image-bar hidden px-3.5 py-3 bg-[#F4E9DA] border-b border-[#DFCEB9] space-y-2.5">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="text-[12px] font-bold text-[#231912]">درج تصویر در محل مکان‌نما:</span>
                        <input type="file" accept="image/*" class="js-blog-inline-image-file hidden" />
                        <button
                          type="button"
                          class="js-blog-trigger-inline-upload px-3 py-1.5 rounded-lg bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[11.5px] font-semibold cursor-pointer"
                        >
                          + آپلود تصویر از دستگاه
                        </button>
                        <button
                          type="button"
                          data-gallery-target="blog_inline"
                          class="js-admin-open-gallery-picker px-3 py-1.5 rounded-lg bg-[#FAF5EC] hover:bg-[#E5D4BC] border border-[#C5B198] text-[#3F2E21] text-[11.5px] font-semibold cursor-pointer"
                        >
                          انتخاب از گالری باشگاه
                        </button>
                      </div>
                      <div class="flex items-center gap-1.5">
                        <span class="text-[11.5px] font-semibold text-[#4E3B2D]">اندازه نمایش تصویر:</span>
                        <select class="js-blog-inline-image-size px-2.5 py-1 rounded-lg bg-[#FAF5EC] border border-[#C5B198] text-[11.5px] text-[#231912]">
                          <option value="full" ${blogInlineImageSize === 'full' ? 'selected' : ''}>تمام‌عرض (۱۰۰٪)</option>
                          <option value="lg" ${blogInlineImageSize === 'lg' ? 'selected' : ''}>بزرگ (۷۵٪)</option>
                          <option value="md" ${blogInlineImageSize === 'md' ? 'selected' : ''}>متوسط (۵۰٪)</option>
                          <option value="sm" ${blogInlineImageSize === 'sm' ? 'selected' : ''}>کوچک (۳۵٪)</option>
                        </select>
                        <button
                          type="button"
                          class="js-blog-close-image-bar px-2.5 py-1 rounded-lg border border-[#C5B198] text-[11.5px] font-semibold text-[#4E3B2D] cursor-pointer"
                        >
                          بستن
                        </button>
                      </div>
                    </div>
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="text-[11.5px] text-[#6B5444]">یا درج با لینک مستقیم تصویر:</span>
                      <input
                        type="text"
                        dir="ltr"
                        placeholder="https://example.com/photo.jpg یا /assets/blog-1.png"
                        class="js-blog-inline-image-url flex-1 min-w-[200px] px-3 py-1.5 rounded-lg bg-[#FAF5EC] border border-[#D8C4AA] text-[12px] text-[#231912] text-left"
                      />
                      <button
                        type="button"
                        class="js-blog-insert-url-image px-3.5 py-1.5 rounded-lg bg-[#3F2E21] hover:bg-[#231912] text-[#FAF5EC] text-[11.5px] font-semibold cursor-pointer"
                      >
                        درج تصویر از لینک
                      </button>
                    </div>
                    <p class="text-[11px] text-[#6B5444]">
                      نکته: با کلیک روی هر تصویر داخل متن نیز می‌توانید اندازه آن را بین تمام‌عرض، بزرگ، متوسط یا کوچک تغییر دهید.
                    </p>
                  </div>

                  <!-- Selected Image Quick Resize Bar (Shown when clicking an image inside editor) -->
                  <div class="js-blog-selected-img-toolbar hidden px-3.5 py-2 bg-[#EFE3D2] border-b border-[#DFCEB9] flex flex-wrap items-center justify-between gap-2">
                    <span class="text-[11.5px] font-bold text-[#231912]">تنظیم اندازه تصویر انتخاب‌شده در متن:</span>
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <button type="button" data-set-img-size="full" class="js-blog-resize-selected-img px-2.5 py-1 rounded-lg bg-[#FAF5EC] hover:bg-[#5A3A22] hover:text-[#FAF5EC] border border-[#C5B198] text-[11px] font-semibold cursor-pointer">تمام‌عرض (۱۰۰٪)</button>
                      <button type="button" data-set-img-size="lg" class="js-blog-resize-selected-img px-2.5 py-1 rounded-lg bg-[#FAF5EC] hover:bg-[#5A3A22] hover:text-[#FAF5EC] border border-[#C5B198] text-[11px] font-semibold cursor-pointer">بزرگ (۷۵٪)</button>
                      <button type="button" data-set-img-size="md" class="js-blog-resize-selected-img px-2.5 py-1 rounded-lg bg-[#FAF5EC] hover:bg-[#5A3A22] hover:text-[#FAF5EC] border border-[#C5B198] text-[11px] font-semibold cursor-pointer">متوسط (۵۰٪)</button>
                      <button type="button" data-set-img-size="sm" class="js-blog-resize-selected-img px-2.5 py-1 rounded-lg bg-[#FAF5EC] hover:bg-[#5A3A22] hover:text-[#FAF5EC] border border-[#C5B198] text-[11px] font-semibold cursor-pointer">کوچک (۳۵٪)</button>
                      <button type="button" class="js-blog-remove-selected-img px-2.5 py-1 rounded-lg bg-[#FBEAE8] hover:bg-[#F5D5D1] border border-[#E6B8B3] text-[#9E3329] text-[11px] font-semibold cursor-pointer">حذف تصویر</button>
                    </div>
                  </div>

                  <!-- RTL ContentEditable Rich Text Surface -->
                  <div
                    dir="rtl"
                    contenteditable="true"
                    data-placeholder="متن کامل مقاله، تیترها، لیست‌ها، تصاویر و تحلیل‌های ادبی را در این بخش بنویسید..."
                    class="js-admin-blog-wysiwyg min-h-[280px] w-full px-4 py-3.5 bg-[#FAF5EC] text-[14px] text-[#231912] leading-[2] focus:outline-none [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#2d1c10] [&_h2]:my-2.5 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-[#382315] [&_h3]:my-2 [&_ul]:list-disc [&_ul]:pr-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pr-6 [&_ol]:my-2 [&_blockquote]:my-3 [&_blockquote]:p-4 [&_blockquote]:bg-[#f2ecde] [&_blockquote]:border-r-4 [&_blockquote]:border-[#6b4c32] [&_blockquote]:rounded-l-xl [&_a]:text-[#7a4b2a] [&_a]:underline [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-2xl [&_img]:my-4 [&_img]:mx-auto [&_img]:block [&_img]:border [&_img]:border-[#DFCEB9] [&_img]:cursor-pointer [&_img[data-img-size='full']]:w-full [&_img[data-img-size='lg']]:w-full [&_img[data-img-size='lg']]:sm:w-3/4 [&_img[data-img-size='md']]:w-full [&_img[data-img-size='md']]:sm:w-1/2 [&_img[data-img-size='sm']]:w-2/3 [&_img[data-img-size='sm']]:sm:w-1/3 empty:before:content-[attr(data-placeholder)] empty:before:text-[#8C7662]"
                  >${normalizeArticleHtml(editingBlogPost.full_content || '')}</div>

                  <textarea
                    name="full_content"
                    class="js-admin-blog-content-textarea hidden"
                  >${normalizeArticleHtml(editingBlogPost.full_content || '')}</textarea>
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
      return `${p.title} ${p.category} ${p.author} ${p.tags || ''}`.toLowerCase().includes(q);
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
                  <div class="absolute top-3 left-3 px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                    post.status === 'پیش‌نویس'
                      ? 'bg-[#FFF3CD] text-[#7A5A10] border border-[#E5C77B]'
                      : 'bg-[#E4F2E7] text-[#235332] border border-[#BBD9C2]'
                  }">
                    ${toPersianDigits(post.status || 'منتشر شده')}
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
    const fs = state.footerSettings || defaultFooterSettings;
    const footerLinks = Array.isArray(fs.links) ? fs.links : [];

    return `
      <div class="space-y-6">
        <div>
          <h2 class="font-display text-[20px] sm:text-[23px] font-bold text-[#231912]">تنظیمات صفحه اصلی سایت</h2>
          <p class="text-[13.5px] text-[#6B5444] mt-1 text-justify">
            تمامی متون، تیترها، آمارها، اطلاعات تماس و تنظیمات فوتر صفحه اصلی سایت را در این بخش ویرایش کرده و مستقیماً در دیتابیس ذخیره نمایید.
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

          <!-- 5. تنظیمات فوتر -->
          <div class="p-6 rounded-2xl bg-[#FAF5EC] border border-[#E5D7C5] space-y-5">
            <h3 class="font-display text-[17px] font-bold text-[#231912] border-b border-[#E6D8C5] pb-2.5">
              تنظیمات فوتر
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="sm:col-span-2">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">عنوان فوتر</label>
                <input
                  type="text"
                  name="footer_title"
                  value="${toPersianDigits(fs.title || '')}"
                  placeholder="مثلاً: باشگاه کتابخوانی بوک‌میت"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]"
                />
              </div>

              <div class="sm:col-span-2">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">توضیحات / درباره باشگاه در فوتر</label>
                <textarea
                  name="footer_description"
                  rows="2"
                  placeholder="توضیحات کوتاه معرفی باشگاه در فوتر..."
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]"
                >${toPersianDigits(fs.description || '')}</textarea>
              </div>

              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">شماره تماس در فوتر</label>
                <input
                  type="text"
                  name="footer_phone"
                  value="${toPersianDigits(fs.phone || '')}"
                  placeholder="مثلاً: ۰۲۱-۸۸۹۴۳۲۱۰"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]"
                />
              </div>

              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">ایمیل در فوتر</label>
                <input
                  type="text"
                  dir="ltr"
                  name="footer_email"
                  value="${fs.email || ''}"
                  placeholder="hello@bookmeet.ir"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-left"
                />
              </div>

              <div class="sm:col-span-2">
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">نشانی در فوتر</label>
                <input
                  type="text"
                  name="footer_address"
                  value="${toPersianDigits(fs.address || '')}"
                  placeholder="نشانی نمایش داده شده در فوتر سایت..."
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]"
                />
              </div>

              <!-- Footer Navigation Links -->
              <div class="sm:col-span-2 space-y-2.5 pt-2">
                <div class="flex items-center justify-between">
                  <label class="block text-[12.5px] font-bold text-[#231912]">لینک‌های فوتر و عناوین آن‌ها</label>
                  <button
                    type="button"
                    class="js-admin-add-footer-link px-3.5 py-1.5 rounded-xl bg-[#EFE3D2] hover:bg-[#E2D0B7] text-[#3F2E21] text-[12px] font-semibold cursor-pointer"
                  >
                    + افزودن لینک جدید به فوتر
                  </button>
                </div>
                <div class="js-admin-footer-links-list space-y-2">
                  ${footerLinks
                    .map(
                      (link, idx) => `
                    <div class="js-admin-footer-link-row flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-xl bg-[#F4E9DA]/50 border border-[#DFCEB9]">
                      <input
                        type="text"
                        name="footer_link_label_${idx}"
                        data-footer-link-label
                        value="${toPersianDigits(link.label || '')}"
                        placeholder="عنوان لینک (مثلاً: کتابخانه)"
                        class="flex-1 px-3 py-2 rounded-lg bg-[#FAF5EC] border border-[#DFCEB9] text-[12.5px]"
                      />
                      <input
                        type="text"
                        dir="ltr"
                        name="footer_link_href_${idx}"
                        data-footer-link-href
                        value="${link.href || ''}"
                        placeholder="مسیر یا آدرس لینک (مثلاً: #library یا /library)"
                        class="flex-1 px-3 py-2 rounded-lg bg-[#FAF5EC] border border-[#DFCEB9] text-[12.5px] text-left"
                      />
                      <button
                        type="button"
                        data-remove-footer-link="${idx}"
                        class="js-admin-remove-footer-link px-3 py-2 rounded-lg border border-[#E6B8B3] text-[#9E3329] hover:bg-[#FBEAE8] text-[11.5px] font-semibold cursor-pointer shrink-0"
                      >
                        حذف
                      </button>
                    </div>
                  `
                    )
                    .join('')}
                </div>
              </div>

              <!-- Social Media Links -->
              <div class="sm:col-span-2 pt-2">
                <label class="block text-[12.5px] font-bold text-[#231912] mb-2">لینک شبکه‌های اجتماعی در فوتر</label>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label class="block text-[11.5px] font-semibold text-[#4E3B2D] mb-1">لینک اینستاگرام</label>
                    <input
                      type="text"
                      dir="ltr"
                      name="footer_instagram"
                      value="${fs.instagram_url || ''}"
                      placeholder="https://instagram.com/..."
                      class="w-full px-3 py-2 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[12.5px] text-left"
                    />
                  </div>
                  <div>
                    <label class="block text-[11.5px] font-semibold text-[#4E3B2D] mb-1">لینک تلگرام</label>
                    <input
                      type="text"
                      dir="ltr"
                      name="footer_telegram"
                      value="${fs.telegram_url || ''}"
                      placeholder="https://t.me/..."
                      class="w-full px-3 py-2 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[12.5px] text-left"
                    />
                  </div>
                  <div>
                    <label class="block text-[11.5px] font-semibold text-[#4E3B2D] mb-1">لینک ایکس (توییتر)</label>
                    <input
                      type="text"
                      dir="ltr"
                      name="footer_twitter"
                      value="${fs.twitter_url || ''}"
                      placeholder="https://x.com/..."
                      class="w-full px-3 py-2 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[12.5px] text-left"
                    />
                  </div>
                  <div>
                    <label class="block text-[11.5px] font-semibold text-[#4E3B2D] mb-1">لینک یوتیوب</label>
                    <input
                      type="text"
                      dir="ltr"
                      name="footer_youtube"
                      value="${fs.youtube_url || ''}"
                      placeholder="https://youtube.com/..."
                      class="w-full px-3 py-2 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[12.5px] text-left"
                    />
                  </div>
                  <div>
                    <label class="block text-[11.5px] font-semibold text-[#4E3B2D] mb-1">لینک لینکدین</label>
                    <input
                      type="text"
                      dir="ltr"
                      name="footer_linkedin"
                      value="${fs.linkedin_url || ''}"
                      placeholder="https://linkedin.com/..."
                      class="w-full px-3 py-2 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[12.5px] text-left"
                    />
                  </div>
                </div>
              </div>

              <!-- Copyright & Tagline -->
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">متن کپی‌رایت فوتر</label>
                <input
                  type="text"
                  name="footer_copyright"
                  value="${toPersianDigits(fs.copyright_text || '')}"
                  placeholder="© ۱۴۰۵ باشگاه کتابخوانی بوک‌میت · تمامی حقوق محفوظ است."
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]"
                />
              </div>

              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">عبارت مکمل پایین فوتر</label>
                <input
                  type="text"
                  name="footer_tagline"
                  value="${toPersianDigits(fs.tagline_text || '')}"
                  placeholder="حلقه‌های مطالعاتی و نقد ادبیات داستانی"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px]"
                />
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
              ذخیره تمامی تنظیمات صفحه اصلی و فوتر در دیتابیس
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
      case 'library':
        return renderLibraryTab();
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
        key: 'sessions',
        label: 'مدیریت نشستها',
        badge: toPersianDigits(state.sessions.length),
      },
      {
        key: 'classes',
        label: 'مدیریت کلاس ها',
        badge: toPersianDigits(state.classes.length),
      },
      {
        key: 'library',
        label: 'کتابخانه',
        badge: toPersianDigits(state.libraryBooks.length),
      },
      {
        key: 'users',
        label: 'مدیریت کاربران',
        badge: toPersianDigits(state.users.length),
      },
      {
        key: 'blog',
        label: 'وبلاگ',
        badge: toPersianDigits(state.blogPosts.length),
      },
      {
        key: 'comments',
        label: 'نظرات کاربران',
        badge: toPersianDigits(state.comments.length),
      },
      {
        key: 'gallery',
        label: 'گالری تصاویر',
        badge: toPersianDigits(state.gallery.length),
      },
      {
        key: 'announcements',
        label: 'اطلاعیه ها',
        badge: toPersianDigits(state.announcements.length),
      },
      {
        key: 'tickets',
        label: 'تیکت ها',
        badge: toPersianDigits(state.tickets.length),
      },
      { key: 'profile', label: 'پروفایل' },
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
      selectedAdminTicketId = null;
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
      selectedAdminTicketId = null;
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

  // --- Persian Digits Live Input Formatting ---
  $wrapper.on('input', '.js-persian-digits-input', function () {
    const el = this as HTMLInputElement;
    const formatted = toPersianDigits(el.value);
    if (el.value !== formatted) {
      const pos = el.selectionStart || formatted.length;
      el.value = formatted;
      try {
        el.setSelectionRange(pos, pos);
      } catch {
        // ignore selection range unsupported
      }
    }
  });

  // --- Enrolled Members Modal Handlers ---
  $wrapper.on('click', '.js-admin-open-enrolled-modal', function () {
    syncOpenFormsFromDom();
    const targetType = String($(this).data('open-enrolled-type')) as 'session' | 'class';
    const targetId = Number($(this).data('open-enrolled-id'));
    const targetTitle = String($(this).data('open-enrolled-title') || '');
    enrolledMembersModalTarget = {
      targetType,
      targetId,
      targetTitle,
    };
    render();
  });

  $wrapper.on('click', '.js-admin-close-enrolled-modal', () => {
    syncOpenFormsFromDom();
    enrolledMembersModalTarget = null;
    render();
  });

  $wrapper.on('click', '.js-admin-enrolled-modal-backdrop', function (e) {
    if ($(e.target).hasClass('js-admin-enrolled-modal-backdrop')) {
      syncOpenFormsFromDom();
      enrolledMembersModalTarget = null;
      render();
    }
  });

  // --- Gallery Picker Modal Handlers ---
  $wrapper.on('click', '.js-admin-open-gallery-picker', function () {
    syncOpenFormsFromDom();
    const target = $(this).data('gallery-target') as
      | 'session'
      | 'class'
      | 'blog'
      | 'blog_inline'
      | 'library';
    const sizeSelectVal = String($wrapper.find('.js-blog-inline-image-size').val() || '');
    if (sizeSelectVal === 'full' || sizeSelectVal === 'lg' || sizeSelectVal === 'md' || sizeSelectVal === 'sm') {
      blogInlineImageSize = sizeSelectVal;
    }
    galleryPickerTarget = target;
    render();
  });

  $wrapper.on('click', '.js-admin-close-gallery-picker', () => {
    syncOpenFormsFromDom();
    galleryPickerTarget = null;
    render();
  });

  $wrapper.on('click', '.js-admin-gallery-picker-backdrop', function (e) {
    if ($(e.target).hasClass('js-admin-gallery-picker-backdrop')) {
      syncOpenFormsFromDom();
      galleryPickerTarget = null;
      render();
    }
  });

  $wrapper.on('click', '.js-admin-pick-gallery-item', function () {
    syncOpenFormsFromDom();
    const url = String($(this).data('pick-image-url') || '');
    if (!url) return;
    const pickedTarget = galleryPickerTarget;
    if (pickedTarget === 'session' && editingSession) {
      editingSession.cover_url = url;
    } else if (pickedTarget === 'class' && editingClass) {
      editingClass.cover_url = url;
    } else if (pickedTarget === 'blog' && editingBlogPost) {
      editingBlogPost.cover_url = url;
    } else if (pickedTarget === 'library' && editingLibraryBook) {
      editingLibraryBook.cover_url = url;
    } else if (pickedTarget === 'blog_inline' && editingBlogPost) {
      const imgHtml = `<p><img src="${url}" alt="تصویر مقاله" data-img-size="${blogInlineImageSize}" /></p>`;
      editingBlogPost.full_content = sanitizeRichHtml(
        `${editingBlogPost.full_content || ''}${imgHtml}`
      );
    }
    galleryPickerTarget = null;
    render();
    showToast(
      pickedTarget === 'blog_inline'
        ? 'تصویر انتخاب‌شده به متن مقاله اضافه شد.'
        : 'تصویر کاور از گالری تصاویر انتخاب شد.'
    );
  });

  // --- Library Management Tab & Categories Modal Handlers ---
  $wrapper.on('input', '.js-admin-lib-search', function () {
    librarySearch = String($(this).val() || '');
    render();
    const $input = $wrapper.find('.js-admin-lib-search');
    $input.trigger('focus');
    const len = String($input.val() || '').length;
    const el = $input.get(0) as HTMLInputElement | undefined;
    if (el && el.setSelectionRange) {
      el.setSelectionRange(len, len);
    }
  });

  $wrapper.on('click', '.js-admin-lib-cat-filter', function () {
    libraryCategoryFilter = String($(this).data('lib-cat-filter') || 'all');
    render();
  });

  $wrapper.on('click', '.js-admin-new-lib-book-btn', () => {
    editingLibraryBook = {
      title: '',
      author: '',
      translator: '',
      publisher: '',
      publication_year: 0,
      edition_number: '',
      pages_count: 0,
      short_description: '',
      description: '',
      memorable_quote: '',
      recommended_for: '',
      category: '',
      tags: '',
      cover_url: '',
      notes: '',
    };
    editingLibraryTagsList = [];
    render();
  });

  $wrapper.on('click', '.js-admin-cancel-lib-book', () => {
    editingLibraryBook = null;
    editingLibraryTagsList = [];
    render();
  });

  $wrapper.on('click', '.js-admin-view-lib-book', function () {
    const id = Number($(this).data('view-lib-book'));
    const found = state.libraryBooks.find((b) => Number(b.id) === id);
    if (found) {
      viewingLibraryBook = found;
      render();
    }
  });

  $wrapper.on('click', '.js-admin-close-view-lib-book', () => {
    viewingLibraryBook = null;
    render();
  });

  $wrapper.on('click', '.js-admin-view-lib-book-backdrop', function (e) {
    if ($(e.target).hasClass('js-admin-view-lib-book-backdrop')) {
      viewingLibraryBook = null;
      render();
    }
  });

  $wrapper.on('click', '.js-admin-edit-lib-book', function () {
    const id = Number($(this).data('edit-lib-book'));
    const found = state.libraryBooks.find((b) => Number(b.id) === id);
    if (!found) return;
    viewingLibraryBook = null;
    editingLibraryBook = { ...found };
    editingLibraryTagsList = String(found.tags || '')
      .split(/[،,]/)
      .map((t) => t.trim())
      .filter(Boolean);
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  $wrapper.on('click', '.js-admin-trigger-lib-cover-upload', () => {
    syncOpenFormsFromDom();
    $wrapper.find('.js-admin-lib-cover-file-input').trigger('click');
  });

  $wrapper.on('change', '.js-admin-lib-cover-file-input', function (event) {
    syncOpenFormsFromDom();
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !editingLibraryBook) return;
    resizeImageToDataUrl(file, 640)
      .then((dataUrl) => {
        if (editingLibraryBook) {
          editingLibraryBook.cover_url = dataUrl;
          render();
          showToast('تصویر کاور جلد کتاب بارگذاری شد.');
        }
      })
      .catch((err) => showToast(err.message || 'خطا در بارگذاری تصویر کاور', true));
  });

  $wrapper.on('click', '.js-admin-clear-lib-cover', () => {
    syncOpenFormsFromDom();
    if (editingLibraryBook) {
      editingLibraryBook.cover_url = '';
      render();
    }
  });

  function addLibraryTagsFromInput(): void {
    syncOpenFormsFromDom();
    const raw = String($wrapper.find('.js-admin-lib-tag-input').val() || '').trim();
    if (!raw) return;
    const parts = raw
      .split(/[،,]/)
      .map((t) => t.trim().replace(/^#+/, '').trim())
      .filter(Boolean);
    for (const part of parts) {
      if (!editingLibraryTagsList.includes(part)) {
        editingLibraryTagsList.push(part);
      }
    }
    if (editingLibraryBook) {
      editingLibraryBook.tags = editingLibraryTagsList.join('، ');
    }
    render();
    $wrapper.find('.js-admin-lib-tag-input').trigger('focus');
  }

  $wrapper.on('click', '.js-admin-add-lib-tag-btn', () => {
    addLibraryTagsFromInput();
  });

  $wrapper.on('keydown', '.js-admin-lib-tag-input', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addLibraryTagsFromInput();
    }
  });

  $wrapper.on('click', '.js-admin-remove-lib-tag', function () {
    syncOpenFormsFromDom();
    const idx = Number($(this).data('remove-tag-idx'));
    if (!Number.isNaN(idx) && idx >= 0 && idx < editingLibraryTagsList.length) {
      editingLibraryTagsList.splice(idx, 1);
      if (editingLibraryBook) {
        editingLibraryBook.tags = editingLibraryTagsList.join('، ');
      }
      render();
    }
  });

  $wrapper.on('click', '.js-admin-edit-lib-tag', function () {
    syncOpenFormsFromDom();
    const idx = Number($(this).data('edit-tag-idx'));
    if (!Number.isNaN(idx) && idx >= 0 && idx < editingLibraryTagsList.length) {
      const tagToEdit = editingLibraryTagsList[idx];
      editingLibraryTagsList.splice(idx, 1);
      if (editingLibraryBook) {
        editingLibraryBook.tags = editingLibraryTagsList.join('، ');
      }
      render();
      const $tagInput = $wrapper.find('.js-admin-lib-tag-input');
      $tagInput.val(tagToEdit).trigger('focus');
    }
  });

  $wrapper.on('submit', '.js-admin-library-book-form', function (e) {
    e.preventDefault();
    syncOpenFormsFromDom();
    if (!editingLibraryBook) return;

    const pendingTagInput = String(
      $wrapper.find('.js-admin-lib-tag-input').val() || ''
    ).trim();
    if (pendingTagInput) {
      const extraParts = pendingTagInput
        .split(/[،,]/)
        .map((t) => t.trim().replace(/^#+/, '').trim())
        .filter(Boolean);
      for (const part of extraParts) {
        if (!editingLibraryTagsList.includes(part)) {
          editingLibraryTagsList.push(part);
        }
      }
    }

    const title = String(editingLibraryBook.title || '').trim();
    if (!title) {
      showToast('لطفاً عنوان کتاب را وارد نمایید.', true);
      return;
    }

    const pubYearNum = Number(editingLibraryBook.publication_year || 0);
    if (Number.isNaN(pubYearNum) || pubYearNum < 0) {
      showToast('سال انتشار باید یک عدد معتبر باشد.', true);
      return;
    }

    const pagesCountNum = Number(editingLibraryBook.pages_count || 0);
    if (Number.isNaN(pagesCountNum) || pagesCountNum < 0) {
      showToast('تعداد صفحات باید یک عدد معتبر باشد.', true);
      return;
    }

    const payload: Partial<LibraryBook> & { id?: number } = {
      id: editingLibraryBook.id ? Number(editingLibraryBook.id) : undefined,
      title,
      author: String(editingLibraryBook.author || '').trim(),
      translator: String(editingLibraryBook.translator || '').trim(),
      publisher: String(editingLibraryBook.publisher || '').trim(),
      publication_year: pubYearNum,
      edition_number: String(editingLibraryBook.edition_number || '').trim(),
      pages_count: pagesCountNum,
      short_description: String(editingLibraryBook.short_description || '').trim(),
      description: String(editingLibraryBook.description || '').trim(),
      memorable_quote: String(editingLibraryBook.memorable_quote || '').trim(),
      recommended_for: String(editingLibraryBook.recommended_for || '').trim(),
      category: String(editingLibraryBook.category || '').trim(),
      tags: editingLibraryTagsList.join('، '),
      cover_url: String(editingLibraryBook.cover_url || '').trim(),
      notes: String(editingLibraryBook.notes || '').trim(),
    };

    const isUpdating = Boolean(payload.id);

    ApiService.saveAdminLibraryBook(payload)
      .then((res) => {
        if (isUpdating) {
          state.libraryBooks = state.libraryBooks.map((b) =>
            Number(b.id) === Number(res.book.id) ? res.book : b
          );
        } else {
          state.libraryBooks = [res.book, ...state.libraryBooks];
        }
        editingLibraryBook = null;
        editingLibraryTagsList = [];
        props.onSiteDataUpdated({ libraryBooks: state.libraryBooks });
        render();
        showToast(
          isUpdating
            ? 'اطلاعات کتاب با موفقیت در دیتابیس بروزرسانی شد.'
            : 'کتاب جدید با موفقیت در کتابخانه ثبت شد.'
        );
      })
      .catch((err) => showToast(err.message || 'خطا در ذخیره اطلاعات کتاب', true));
  });

  $wrapper.on('click', '.js-admin-delete-lib-book', function () {
    const id = Number($(this).data('delete-lib-book'));
    const target = state.libraryBooks.find((b) => Number(b.id) === id);
    if (!target) return;
    askDeleteConfirmation(
      'حذف کتاب از کتابخانه',
      `آیا از حذف کتاب «${target.title}» از کتابخانه باشگاه اطمینان دارید؟`,
      () => {
        ApiService.deleteAdminLibraryBook(id)
          .then(() => {
            state.libraryBooks = state.libraryBooks.filter((b) => Number(b.id) !== id);
            if (editingLibraryBook && Number(editingLibraryBook.id) === id) {
              editingLibraryBook = null;
              editingLibraryTagsList = [];
            }
            props.onSiteDataUpdated({ libraryBooks: state.libraryBooks });
            render();
            showToast('کتاب مورد نظر از کتابخانه حذف شد.');
          })
          .catch((err) => showToast(err.message || 'خطا در حذف کتاب', true));
      }
    );
  });

  // --- Library Categories Modal Handlers ---
  $wrapper.on('click', '.js-admin-open-lib-cat-modal', () => {
    syncOpenFormsFromDom();
    editingLibraryCategoryItem = null;
    isLibraryCategoryModalOpen = true;
    render();
  });

  $wrapper.on('click', '.js-admin-close-lib-cat-modal', () => {
    syncOpenFormsFromDom();
    editingLibraryCategoryItem = null;
    isLibraryCategoryModalOpen = false;
    render();
  });

  $wrapper.on('click', '.js-admin-lib-cat-backdrop', function (e) {
    if ($(e.target).hasClass('js-admin-lib-cat-backdrop')) {
      syncOpenFormsFromDom();
      editingLibraryCategoryItem = null;
      isLibraryCategoryModalOpen = false;
      render();
    }
  });

  $wrapper.on('click', '.js-admin-edit-lib-cat', function () {
    syncOpenFormsFromDom();
    const id = Number($(this).data('edit-lib-cat'));
    const found = (state.libraryCategories || []).find((c) => Number(c.id) === id);
    if (found) {
      editingLibraryCategoryItem = { ...found };
      render();
      $wrapper.find('[name="library_category_name"]').trigger('focus');
    }
  });

  $wrapper.on('click', '.js-admin-cancel-edit-lib-cat', () => {
    syncOpenFormsFromDom();
    editingLibraryCategoryItem = null;
    render();
  });

  $wrapper.on('submit', '.js-admin-lib-cat-form', function (e) {
    e.preventDefault();
    syncOpenFormsFromDom();
    const name = String(
      $(this).find('[name="library_category_name"]').val() || ''
    ).trim();
    if (!name) {
      showToast('لطفاً نام دسته‌بندی را وارد نمایید.', true);
      return;
    }

    if (editingLibraryCategoryItem) {
      const oldName = editingLibraryCategoryItem.name;
      ApiService.updateAdminLibraryCategory({
        id: editingLibraryCategoryItem.id,
        name,
      })
        .then((res) => {
          state.libraryCategories = (state.libraryCategories || []).map((c) =>
            Number(c.id) === Number(res.category.id) ? res.category : c
          );
          if (Array.isArray(res.libraryBooks)) {
            state.libraryBooks = res.libraryBooks;
          }
          if (editingLibraryBook && editingLibraryBook.category === oldName) {
            editingLibraryBook.category = res.category.name;
          }
          editingLibraryCategoryItem = null;
          props.onSiteDataUpdated({
            libraryBooks: state.libraryBooks,
            libraryCategories: state.libraryCategories,
          });
          render();
          showToast('دسته‌بندی با موفقیت ویرایش شد.');
        })
        .catch((err) => showToast(err.message || 'خطا در ویرایش دسته‌بندی', true));
      return;
    }

    ApiService.createAdminLibraryCategory({ name })
      .then((res) => {
        state.libraryCategories = [...(state.libraryCategories || []), res.category];
        if (editingLibraryBook && !editingLibraryBook.category) {
          editingLibraryBook.category = res.category.name;
        }
        props.onSiteDataUpdated({
          libraryCategories: state.libraryCategories,
        });
        render();
        showToast('دسته‌بندی جدید با موفقیت ایجاد شد.');
      })
      .catch((err) => showToast(err.message || 'خطا در ایجاد دسته‌بندی', true));
  });

  $wrapper.on('click', '.js-admin-delete-lib-cat', function () {
    syncOpenFormsFromDom();
    const id = Number($(this).data('delete-lib-cat'));
    const target = (state.libraryCategories || []).find((c) => Number(c.id) === id);
    if (!target) return;
    askDeleteConfirmation(
      'حذف دسته‌بندی کتابخانه',
      `آیا از حذف دسته‌بندی «${target.name}» اطمینان دارید؟`,
      () => {
        ApiService.deleteAdminLibraryCategory(id)
          .then(() => {
            state.libraryCategories = (state.libraryCategories || []).filter(
              (c) => Number(c.id) !== id
            );
            if (
              editingLibraryCategoryItem &&
              Number(editingLibraryCategoryItem.id) === id
            ) {
              editingLibraryCategoryItem = null;
            }
            props.onSiteDataUpdated({
              libraryCategories: state.libraryCategories,
            });
            render();
            showToast('دسته‌بندی مورد نظر حذف شد.');
          })
          .catch((err) => showToast(err.message || 'خطا در حذف دسته‌بندی', true));
      }
    );
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
    sessionStatusFilter = $(this).data('session-filter') as
      | 'all'
      | 'فعال'
      | 'غیرفعال'
      | 'برگزار شده';
    render();
  });

  $wrapper.on('change', '.js-admin-date-picker', function () {
    const val = String($(this).val() || '').trim();
    const $preview = $(this).siblings('.js-admin-date-preview');
    if (val) {
      $preview.text(`تاریخ انتخاب‌شده: ${formatPersianDateDisplay(val)}`);
    }
  });

  $wrapper.on('click', '.js-admin-mark-session-held', function () {
    const id = Number($(this).data('mark-held-session'));
    const target = state.sessions.find((s) => s.id === id);
    if (!target) return;
    askDeleteConfirmation(
      'تغییر وضعیت جلسه به «برگزار شده»',
      `آیا از تغییر وضعیت «${target.title}» به «برگزار شده» اطمینان دارید؟ پس از تایید، این جلسه به بخش جلسات برگزار شده منتقل می‌شود.`,
      () => {
        ApiService.saveAdminSession({
          ...target,
          id: target.id,
          status: 'برگزارشده',
        })
          .then((res) => {
            state.sessions = state.sessions.map((s) => (s.id === id ? res.session : s));
            props.onSiteDataUpdated({ sessions: state.sessions });
            render();
            showToast('وضعیت دوره هم‌خوانی به «برگزار شده» تغییر یافت.');
          })
          .catch((err) => showToast(err.message || 'خطا در تغییر وضعیت جلسه', true));
      },
      { confirmLabel: 'بله، برگزار شده ثبت شود', confirmTone: 'success' }
    );
  });

  $wrapper.on('click', '.js-admin-mark-subsession-held', function () {
    const parentType = String($(this).data('parent-type')) as 'session' | 'class';
    const parentId = Number($(this).data('parent-id'));
    const subId = Number($(this).data('sub-id'));

    if (parentType === 'session') {
      const target = state.sessions.find((s) => s.id === parentId);
      if (!target) return;
      const updatedSubs = (target.sub_sessions || []).map((sub) =>
        sub.id === subId ? { ...sub, status: 'برگزار شده' as const } : sub
      );
      ApiService.saveAdminSession({ id: target.id, sub_sessions: updatedSubs })
        .then((res) => {
          state.sessions = state.sessions.map((s) =>
            s.id === target.id ? res.session : s
          );
          props.onSiteDataUpdated({ sessions: state.sessions });
          render();
          showToast('وضعیت این کارت جلسه به «برگزار شده» تغییر یافت.');
        })
        .catch((err) => showToast(err.message || 'خطا در بروزرسانی وضعیت جلسه', true));
    } else {
      const target = state.classes.find((c) => c.id === parentId);
      if (!target) return;
      const updatedSubs = (target.sub_sessions || []).map((sub) =>
        sub.id === subId ? { ...sub, status: 'برگزار شده' as const } : sub
      );
      ApiService.saveAdminClass({ id: target.id, sub_sessions: updatedSubs })
        .then((res) => {
          state.classes = state.classes.map((c) =>
            c.id === target.id ? res.classItem : c
          );
          props.onSiteDataUpdated({ classes: state.classes });
          render();
          showToast('وضعیت این کارت جلسه به «برگزار شده» تغییر یافت.');
        })
        .catch((err) => showToast(err.message || 'خطا در بروزرسانی وضعیت جلسه', true));
    }
  });

  $wrapper.on('click', '.js-admin-new-session-btn', () => {
    editingSession = {
      title: '',
      book_title: '',
      book_author: '',
      translator: '',
      category: '',
      publication_year: undefined,
      pages_count: undefined,
      publisher: '',
      mentor_name: '',
      session_date: '',
      session_time: '',
      short_description: '',
      full_description: '',
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
    const rawPages = toEnglishDigits(String($f.find('[name="pages_count"]').val() || '').trim());
    const rawPubYear = toEnglishDigits(
      String($f.find('[name="publication_year"]').val() || '').trim()
    );
    const translatorName = String($f.find('[name="translator"]').val() || '').trim();

    const $dateInput = $f.find('[name="session_date"]');
    const pickedIsoDate = String($dateInput.val() || '').trim();
    const fallbackExistingDate = String($dateInput.attr('data-existing-date') || '').trim();
    const resolvedSessionDate = pickedIsoDate || fallbackExistingDate;

    const $timeInput = $f.find('[name="session_time"]');
    const pickedTime = String($timeInput.val() || '').trim();
    const fallbackExistingTime = String($timeInput.attr('data-existing-time') || '').trim();
    const resolvedSessionTime = pickedTime
      ? toPersianDigits(pickedTime)
      : toPersianDigits(fallbackExistingTime);

    if (!resolvedSessionDate) {
      showToast('لطفاً تاریخ برگزاری جلسه را انتخاب کنید.', true);
      return;
    }

    const rawStatus = String($f.find('[name="status"]').val() || 'فعال');
    const normalizedStatus: MemberSession['status'] =
      rawStatus === 'برگزار شده' || rawStatus === 'برگزارشده'
        ? 'برگزارشده'
        : (rawStatus as MemberSession['status']);

    const payload: Partial<MemberSession> & { id?: number } = {
      id,
      title: String($f.find('[name="title"]').val() || '').trim(),
      book_title: String($f.find('[name="book_title"]').val() || '').trim(),
      book_author: String($f.find('[name="book_author"]').val() || '').trim(),
      translator: translatorName,
      mentor_name: translatorName,
      category: String($f.find('[name="category"]').val() || '').trim(),
      publication_year: Number(rawPubYear) || 1405,
      pages_count: Number(rawPages) || 300,
      publisher: String($f.find('[name="publisher"]').val() || '').trim(),
      session_date: resolvedSessionDate,
      session_time: resolvedSessionTime,
      short_description: String($f.find('[name="short_description"]').val() || '').trim(),
      full_description: String($f.find('[name="full_description"]').val() || '').trim(),
      status: normalizedStatus,
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
        props.onSiteDataUpdated({ sessions: state.sessions });
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
            props.onSiteDataUpdated({ sessions: state.sessions });
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

    const $subDateInput = $f.find('[name="session_date"]');
    const pickedSubDate = String($subDateInput.val() || '').trim();
    const fallbackSubDate = String($subDateInput.attr('data-existing-date') || '').trim();
    const resolvedSubDate = pickedSubDate || fallbackSubDate;

    const $subTimeInput = $f.find('[name="session_time"]');
    const pickedSubTime = String($subTimeInput.val() || '').trim();
    const fallbackSubTime = String($subTimeInput.attr('data-existing-time') || '').trim();
    const resolvedSubTime = pickedSubTime
      ? toPersianDigits(pickedSubTime)
      : toPersianDigits(fallbackSubTime);

    if (!resolvedSubDate) {
      showToast('لطفاً تاریخ برگزاری جلسه را از تقویم انتخاب کنید.', true);
      return;
    }

    const subItemData: SessionSubItem = {
      id: existingSubId || Date.now(),
      session_number: String($f.find('[name="session_number"]').val() || 'جلسه جدید').trim(),
      title: String($f.find('[name="title"]').val() || '').trim(),
      status: String($f.find('[name="status"]').val() || 'جلسه آتی') as
        | 'جلسه آتی'
        | 'برگزار شده',
      session_date: resolvedSubDate,
      session_time: resolvedSubTime,
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
          props.onSiteDataUpdated({ sessions: state.sessions });
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
          props.onSiteDataUpdated({ classes: state.classes });
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
              props.onSiteDataUpdated({ sessions: state.sessions });
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
              props.onSiteDataUpdated({ classes: state.classes });
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
      instructor_name: '',
      schedule_summary: '',
      level_label: 'مبتدی',
      start_date: '',
      end_date: '',
      duration_label: '',
      sessions_count: '',
      capacity_label: '',
      syllabus: [],
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
      editingClass = {
        ...found,
        syllabus: Array.isArray(found.syllabus) ? [...found.syllabus] : [],
      };
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  $wrapper.on('click', '.js-admin-cancel-class', () => {
    editingClass = null;
    render();
  });

  $wrapper.on('click', '.js-admin-add-syllabus-item', () => {
    syncOpenFormsFromDom();
    if (!editingClass) return;
    const currentList = Array.isArray(editingClass.syllabus) ? [...editingClass.syllabus] : [];
    const nextNum = currentList.length + 1;
    currentList.push({
      id: Date.now() + nextNum,
      session_number: `جلسه ${toPersianDigits(nextNum)}`,
      title: '',
      description: '',
    });
    editingClass.syllabus = currentList;
    render();
  });

  $wrapper.on('click', '.js-admin-remove-syllabus-item', function () {
    syncOpenFormsFromDom();
    if (!editingClass) return;
    const idx = Number($(this).attr('data-remove-syllabus'));
    const currentList = Array.isArray(editingClass.syllabus) ? [...editingClass.syllabus] : [];
    if (idx >= 0 && idx < currentList.length) {
      currentList.splice(idx, 1);
      editingClass.syllabus = currentList;
      render();
    }
  });

  $wrapper.on('click', '.js-admin-move-syllabus', function () {
    syncOpenFormsFromDom();
    if (!editingClass) return;
    const idx = Number($(this).attr('data-move-syllabus'));
    const dir = String($(this).attr('data-move-dir'));
    const currentList = Array.isArray(editingClass.syllabus) ? [...editingClass.syllabus] : [];
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (idx >= 0 && idx < currentList.length && targetIdx >= 0 && targetIdx < currentList.length) {
      const temp = currentList[idx];
      currentList[idx] = currentList[targetIdx];
      currentList[targetIdx] = temp;
      editingClass.syllabus = currentList;
      render();
    }
  });

  $wrapper.on('submit', '.js-admin-class-form', function (e) {
    e.preventDefault();
    syncOpenFormsFromDom();
    const $f = $(this);
    const id = Number($f.find('[name="id"]').val() || 0) || undefined;
    const cleanedSyllabus = (editingClass?.syllabus || [])
      .map((item, idx) => ({
        id: item.id || idx + 1,
        session_number: String(
          item.session_number || `جلسه ${toPersianDigits(idx + 1)}`
        ).trim(),
        title: String(item.title || '').trim(),
        description: String(item.description || '').trim(),
      }))
      .filter((item) => item.title.length > 0 || (item.description && item.description.length > 0));

    const payload: Partial<MemberClassItem> & { id?: number } = {
      id,
      title: String($f.find('[name="title"]').val() || '').trim(),
      book_title: String($f.find('[name="book_title"]').val() || '').trim(),
      instructor_name: String($f.find('[name="instructor_name"]').val() || '').trim(),
      schedule_summary: String($f.find('[name="schedule_summary"]').val() || '').trim(),
      level_label: String($f.find('[name="level_label"]').val() || 'مبتدی').trim(),
      start_date: String($f.find('[name="start_date"]').val() || '').trim(),
      end_date: String($f.find('[name="end_date"]').val() || '').trim(),
      duration_label: String($f.find('[name="duration_label"]').val() || '').trim(),
      sessions_count: String($f.find('[name="sessions_count"]').val() || '').trim(),
      capacity_label: String($f.find('[name="capacity_label"]').val() || '').trim(),
      syllabus: cleanedSyllabus,
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
        props.onSiteDataUpdated({ classes: state.classes });
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
            props.onSiteDataUpdated({ classes: state.classes });
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
    const fileInput = $f.find('.js-admin-member-ticket-files')[0] as HTMLInputElement | undefined;
    if (!subject || !message) return;

    readFilesForTicketAttachments(fileInput?.files)
      .then((attachments) =>
        ApiService.createMemberTicket({
          member_phone: targetInfo.member_phone,
          subject,
          department,
          priority,
          message,
          attachment_name: attachments[0]?.file_name,
          attachments,
        })
      )
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

  $wrapper.on('click', '.js-admin-open-ticket-detail', function () {
    const id = Number($(this).data('ticket-id'));
    if (!Number.isNaN(id)) {
      selectedAdminTicketId = id;
      notifyRoute();
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  $wrapper.on('click', '.js-admin-back-to-tickets-list', () => {
    selectedAdminTicketId = null;
    notifyRoute();
    render();
  });

  $wrapper.on('click', '.js-admin-close-ticket-btn', function () {
    const id = Number($(this).data('close-ticket'));
    const target = state.tickets.find((t) => Number(t.id) === id);
    if (!target) return;
    if (target.status === 'بسته‌شده') {
      showToast('این تیکت قبلاً بسته شده است.', true);
      return;
    }

    askDeleteConfirmation(
      'بستن تیکت پشتیبانی',
      `آیا از بستن تیکت «${target.subject}» (#${toPersianDigits(target.ticket_code)}) اطمینان دارید؟ پس از بستن تیکت، امکان ارسال پاسخ جدید در آن وجود نخواهد داشت.`,
      () => {
        ApiService.closeAdminTicket(id)
          .then((res) => {
            state.tickets = state.tickets.map((t) =>
              Number(t.id) === id ? res.ticket : t
            );
            render();
            showToast('تیکت با موفقیت بسته شد.');
          })
          .catch((err) => showToast(err.message || 'خطا در بستن تیکت', true));
      },
      { confirmLabel: 'بله، تیکت بسته شود', confirmTone: 'danger' }
    );
  });

  $wrapper.on('click', '.js-admin-save-ticket', function () {
    const id = Number($(this).data('save-ticket'));
    const existingTicket = state.tickets.find((t) => Number(t.id) === id);
    if (existingTicket?.status === 'بسته‌شده') {
      showToast('این تیکت بسته شده است و امکان ارسال پاسخ جدید در آن وجود ندارد.', true);
      return;
    }
    const $card = $wrapper.find(`[data-admin-ticket-card="${id}"]`);
    const $textarea = $card.find('.js-admin-ticket-reply-input');
    const admin_reply = String($textarea.val() || '').trim();
    const status = String(
      $card.find('.js-admin-ticket-status-select').val() || 'پاسخ داده‌شده'
    ) as MemberTicket['status'];
    const fileInput = $card.find('.js-admin-ticket-reply-files')[0] as HTMLInputElement | undefined;
    const hasFiles = Boolean(fileInput?.files && fileInput.files.length > 0);
    const statusChanged = existingTicket && existingTicket.status !== status;

    if (!admin_reply && !hasFiles && !statusChanged) {
      showToast('لطفاً متن پاسخ را وارد کنید یا فایل پیوست انتخاب نمایید.', true);
      return;
    }

    readFilesForTicketAttachments(fileInput?.files)
      .then((attachments) =>
        ApiService.replyAdminTicket({ id, admin_reply, status, attachments })
      )
      .then((res) => {
        state.tickets = state.tickets.map((t) => (Number(t.id) === id ? res.ticket : t));
        $textarea.val('');
        if (fileInput) fileInput.value = '';
        render();
        showToast('پاسخ و وضعیت تیکت با موفقیت ذخیره شد.');
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
            if (selectedAdminTicketId === id) {
              selectedAdminTicketId = null;
              notifyRoute();
            }
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
    const bio = String($f.find('[name="bio"]').val() || '').trim();
    const new_password = String($f.find('[name="new_password"]').val() || '').trim();

    ApiService.updateAdminProfile({
      first_name,
      last_name,
      email,
      education,
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
      author: '',
      published_date: '',
      reading_time: '',
      tags: '',
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
    syncOpenFormsFromDom();
    isBlogCategoryModalOpen = true;
    render();
  });

  $wrapper.on('click', '.js-admin-close-blog-cat-modal', () => {
    syncOpenFormsFromDom();
    isBlogCategoryModalOpen = false;
    render();
  });

  $wrapper.on('click', '.js-admin-blog-cat-backdrop', function (e) {
    if ($(e.target).hasClass('js-admin-blog-cat-backdrop')) {
      syncOpenFormsFromDom();
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

  // Rich Text WYSIWYG Editor Toolbar & Sync Handlers for Blog Content
  let savedLinkSelectionRange: Range | null = null;
  let savedImageSelectionRange: Range | null = null;
  let selectedInlineImgEl: HTMLImageElement | null = null;

  function syncBlogWysiwygToHiddenInput(): void {
    const editorEl = $wrapper.find('.js-admin-blog-wysiwyg')[0] as HTMLElement | undefined;
    if (!editorEl) return;
    const rawHtml = editorEl.innerHTML || '';
    const $hidden = $wrapper.find('.js-admin-blog-content-textarea');
    $hidden.val(rawHtml);
    if (editingBlogPost) {
      editingBlogPost.full_content = rawHtml;
    }
  }

  function insertInlineImageIntoBlogEditor(src: string, size: 'full' | 'lg' | 'md' | 'sm'): void {
    const cleanSrc = String(src || '').trim();
    if (!cleanSrc) return;
    const editorEl = $wrapper.find('.js-admin-blog-wysiwyg')[0] as HTMLElement | undefined;
    const imgMarkup = `<p><img src="${cleanSrc}" alt="تصویر مقاله" data-img-size="${size}" /></p>`;
    if (!editorEl) {
      if (editingBlogPost) {
        editingBlogPost.full_content = sanitizeRichHtml(
          `${editingBlogPost.full_content || ''}${imgMarkup}`
        );
      }
      render();
      return;
    }

    editorEl.focus();
    if (savedImageSelectionRange) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedImageSelectionRange);
      }
    }
    const inserted = document.execCommand('insertHTML', false, imgMarkup);
    if (!inserted) {
      $(editorEl).append(imgMarkup);
    }
    savedImageSelectionRange = null;
    syncBlogWysiwygToHiddenInput();
  }

  $wrapper.on('click', '.js-admin-trigger-blog-cover-upload', () => {
    $wrapper.find('.js-admin-blog-cover-file-input').trigger('click');
  });

  $wrapper.on('change', '.js-admin-blog-cover-file-input', function (event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    syncOpenFormsFromDom();
    resizeImageToDataUrl(file, 960)
      .then((dataUrl) => {
        if (editingBlogPost) {
          editingBlogPost.cover_url = dataUrl;
        }
        render();
        showToast('تصویر کاور مقاله بارگذاری شد.');
      })
      .catch((err) => showToast(err.message || 'خطا در بارگذاری تصویر کاور', true));
  });

  $wrapper.on('input keyup paste', '.js-admin-blog-wysiwyg', () => {
    syncBlogWysiwygToHiddenInput();
  });

  $wrapper.on('click', '.js-admin-blog-wysiwyg', function (e) {
    const target = e.target as HTMLElement;
    if (target && target.tagName === 'IMG') {
      selectedInlineImgEl = target as HTMLImageElement;
      $wrapper.find('.js-blog-selected-img-toolbar').removeClass('hidden');
    } else {
      selectedInlineImgEl = null;
      $wrapper.find('.js-blog-selected-img-toolbar').addClass('hidden');
    }
  });

  $wrapper.on('click', '.js-blog-resize-selected-img', function () {
    const size = String($(this).data('set-img-size') || 'lg') as 'full' | 'lg' | 'md' | 'sm';
    if (selectedInlineImgEl) {
      selectedInlineImgEl.setAttribute('data-img-size', size);
      syncBlogWysiwygToHiddenInput();
      showToast('اندازه تصویر داخل متن بروزرسانی شد.');
    }
  });

  $wrapper.on('click', '.js-blog-remove-selected-img', () => {
    if (selectedInlineImgEl) {
      const parentP = selectedInlineImgEl.closest('p, figure');
      selectedInlineImgEl.remove();
      if (parentP && !parentP.textContent?.trim() && parentP.querySelectorAll('img').length === 0) {
        parentP.remove();
      }
      selectedInlineImgEl = null;
      $wrapper.find('.js-blog-selected-img-toolbar').addClass('hidden');
      syncBlogWysiwygToHiddenInput();
      showToast('تصویر از متن مقاله حذف شد.');
    }
  });

  $wrapper.on('change', '.js-blog-inline-image-size', function () {
    const val = String($(this).val() || 'lg');
    if (val === 'full' || val === 'lg' || val === 'md' || val === 'sm') {
      blogInlineImageSize = val;
    }
  });

  $wrapper.on('click', '.js-blog-trigger-inline-upload', () => {
    $wrapper.find('.js-blog-inline-image-file').trigger('click');
  });

  $wrapper.on('change', '.js-blog-inline-image-file', function (event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const sizeVal = String($wrapper.find('.js-blog-inline-image-size').val() || blogInlineImageSize) as
      | 'full'
      | 'lg'
      | 'md'
      | 'sm';
    blogInlineImageSize = sizeVal;
    resizeImageToDataUrl(file, 1080)
      .then((dataUrl) => {
        insertInlineImageIntoBlogEditor(dataUrl, blogInlineImageSize);
        input.value = '';
        $wrapper.find('.js-blog-image-bar').addClass('hidden');
        showToast('تصویر در متن مقاله درج شد.');
      })
      .catch((err) => showToast(err.message || 'خطا در درج تصویر', true));
  });

  $wrapper.on('click', '.js-blog-insert-url-image', () => {
    const rawUrl = String($wrapper.find('.js-blog-inline-image-url').val() || '').trim();
    if (!rawUrl) {
      showToast('لطفاً لینک تصویر را وارد نمایید.', true);
      return;
    }
    const sizeVal = String($wrapper.find('.js-blog-inline-image-size').val() || blogInlineImageSize) as
      | 'full'
      | 'lg'
      | 'md'
      | 'sm';
    blogInlineImageSize = sizeVal;
    insertInlineImageIntoBlogEditor(rawUrl, blogInlineImageSize);
    $wrapper.find('.js-blog-inline-image-url').val('');
    $wrapper.find('.js-blog-image-bar').addClass('hidden');
    showToast('تصویر از لینک در متن مقاله درج شد.');
  });

  $wrapper.on('click', '.js-blog-close-image-bar', () => {
    $wrapper.find('.js-blog-image-bar').addClass('hidden');
    savedImageSelectionRange = null;
  });

  $wrapper.on('click', '.js-blog-editor-tool', function (e) {
    e.preventDefault();
    const cmd = String($(this).data('editor-cmd') || '');
    const editorEl = $wrapper.find('.js-admin-blog-wysiwyg')[0] as HTMLElement | undefined;
    if (!editorEl) return;

    editorEl.focus();

    switch (cmd) {
      case 'bold':
        document.execCommand('bold', false);
        break;
      case 'italic':
        document.execCommand('italic', false);
        break;
      case 'underline':
        document.execCommand('underline', false);
        break;
      case 'h2':
        document.execCommand('formatBlock', false, 'H2');
        break;
      case 'h3':
        document.execCommand('formatBlock', false, 'H3');
        break;
      case 'p':
        document.execCommand('formatBlock', false, 'P');
        break;
      case 'quote':
        document.execCommand('formatBlock', false, 'BLOCKQUOTE');
        break;
      case 'ul':
        document.execCommand('insertUnorderedList', false);
        break;
      case 'ol':
        document.execCommand('insertOrderedList', false);
        break;
      case 'align-right':
        document.execCommand('justifyRight', false);
        break;
      case 'align-center':
        document.execCommand('justifyCenter', false);
        break;
      case 'align-left':
        document.execCommand('justifyLeft', false);
        break;
      case 'align-justify':
        document.execCommand('justifyFull', false);
        break;
      case 'undo':
        document.execCommand('undo', false);
        break;
      case 'redo':
        document.execCommand('redo', false);
        break;
      case 'clear':
        document.execCommand('removeFormat', false);
        document.execCommand('formatBlock', false, 'P');
        break;
      case 'link': {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          savedLinkSelectionRange = sel.getRangeAt(0).cloneRange();
        }
        $wrapper.find('.js-blog-image-bar').addClass('hidden');
        const $bar = $wrapper.find('.js-blog-link-bar');
        $bar.toggleClass('hidden');
        if (!$bar.hasClass('hidden')) {
          $bar.find('.js-blog-link-url-input').val('https://').trigger('focus');
        }
        return;
      }
      case 'image': {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          savedImageSelectionRange = sel.getRangeAt(0).cloneRange();
        }
        $wrapper.find('.js-blog-link-bar').addClass('hidden');
        const $imgBar = $wrapper.find('.js-blog-image-bar');
        $imgBar.toggleClass('hidden');
        return;
      }
      default:
        break;
    }

    syncBlogWysiwygToHiddenInput();
  });

  $wrapper.on('click', '.js-blog-apply-link', () => {
    const editorEl = $wrapper.find('.js-admin-blog-wysiwyg')[0] as HTMLElement | undefined;
    const rawUrl = String($wrapper.find('.js-blog-link-url-input').val() || '').trim();
    if (!editorEl || !rawUrl) return;

    editorEl.focus();
    if (savedLinkSelectionRange) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedLinkSelectionRange);
      }
    }

    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 0) {
      document.execCommand('createLink', false, rawUrl);
    } else {
      document.execCommand(
        'insertHTML',
        false,
        `<a href="${rawUrl}" target="_blank" rel="noopener noreferrer">${rawUrl}</a>`
      );
    }

    $wrapper.find('.js-blog-link-bar').addClass('hidden');
    savedLinkSelectionRange = null;
    syncBlogWysiwygToHiddenInput();
  });

  $wrapper.on('click', '.js-blog-cancel-link', () => {
    $wrapper.find('.js-blog-link-bar').addClass('hidden');
    savedLinkSelectionRange = null;
  });

  $wrapper.on('submit', '.js-admin-blog-form', function (e) {
    e.preventDefault();
    syncBlogWysiwygToHiddenInput();
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

    const editorEl = $f.find('.js-admin-blog-wysiwyg')[0] as HTMLElement | undefined;
    const rawEditorHtml = editorEl
      ? editorEl.innerHTML
      : String($f.find('[name="full_content"]').val() || '');
    const sanitizedContent = sanitizeRichHtml(rawEditorHtml);
    const hasPlainText = Boolean((editorEl?.textContent || '').trim());
    const hasEmbeddedImage = /<img\b/i.test(sanitizedContent);

    if (!sanitizedContent || (!hasPlainText && !hasEmbeddedImage)) {
      showToast('لطفاً متن کامل مقاله را وارد نمایید.', true);
      return;
    }

    const rawExcerpt = String($f.find('[name="excerpt"]').val() || '').trim();
    const fallbackExcerpt =
      rawExcerpt ||
      (editorEl?.textContent || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 180);

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
      excerpt: fallbackExcerpt,
      full_content: sanitizedContent,
    };
    ApiService.saveAdminBlogPost(payload)
      .then((res) => {
        const savedPost = res.post;
        if (id) {
          const existsInList = state.blogPosts.some((p) => Number(p.id) === Number(id));
          state.blogPosts = existsInList
            ? state.blogPosts.map((p) => (Number(p.id) === Number(id) ? { ...savedPost } : p))
            : [{ ...savedPost }, ...state.blogPosts];
        } else {
          state.blogPosts = [{ ...savedPost }, ...state.blogPosts];
        }
        if (savedPost.category && !blogCategories.includes(savedPost.category)) {
          blogCategories = [...blogCategories, savedPost.category];
        }
        blogPageMode = 'list';
        editingBlogPost = null;
        props.onSiteDataUpdated({ blogPosts: [...state.blogPosts] });
        notifyRoute();
        render();
        showToast('مقاله وبلاگ با موفقیت ذخیره و کارت مقاله بروزرسانی شد.');
      })
      .catch((err) => showToast(err.message || 'خطا در ذخیره مقاله', true));
  });

  $wrapper.on('click', '.js-admin-delete-blog', function () {
    const id = Number($(this).data('delete-blog'));
    const target = state.blogPosts.find((p) => Number(p.id) === id);
    askDeleteConfirmation(
      'حذف مقاله وبلاگ',
      `آیا از حذف مقاله «${target?.title || ''}» از وبلاگ اطمینان دارید؟`,
      () => {
        ApiService.deleteAdminBlogPost(id)
          .then(() => {
            state.blogPosts = state.blogPosts.filter((p) => Number(p.id) !== id);
            props.onSiteDataUpdated({ blogPosts: [...state.blogPosts] });
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

  // --- Home Settings & Footer Settings Handlers ---
  function readHomeSettingsFormIntoState(): {
    heroSettings: Partial<HeroSettings>;
    aboutClub: Partial<AboutClubData>;
    aboutManager: Partial<AboutManagerData>;
    contactInfo: Partial<ContactInfoData>;
    footerSettings: Partial<FooterSettingsData>;
  } | null {
    const $f = $wrapper.find('.js-admin-home-settings-form');
    if (!$f.length) return null;

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

    const links: FooterLinkItem[] = [];
    $f.find('.js-admin-footer-link-row').each(function () {
      const label = String($(this).find('[data-footer-link-label]').val() || '').trim();
      const href = String($(this).find('[data-footer-link-href]').val() || '').trim();
      if (label || href) {
        links.push({ label, href: href || '#' });
      }
    });

    const footerSettings: Partial<FooterSettingsData> = {
      title: String($f.find('[name="footer_title"]').val() || '').trim(),
      description: String($f.find('[name="footer_description"]').val() || '').trim(),
      phone: String($f.find('[name="footer_phone"]').val() || '').trim(),
      email: String($f.find('[name="footer_email"]').val() || '').trim(),
      address: String($f.find('[name="footer_address"]').val() || '').trim(),
      links,
      instagram_url: String($f.find('[name="footer_instagram"]').val() || '').trim(),
      telegram_url: String($f.find('[name="footer_telegram"]').val() || '').trim(),
      twitter_url: String($f.find('[name="footer_twitter"]').val() || '').trim(),
      youtube_url: String($f.find('[name="footer_youtube"]').val() || '').trim(),
      linkedin_url: String($f.find('[name="footer_linkedin"]').val() || '').trim(),
      copyright_text: String($f.find('[name="footer_copyright"]').val() || '').trim(),
      tagline_text: String($f.find('[name="footer_tagline"]').val() || '').trim(),
    };

    state.heroSettings = { ...state.heroSettings, ...heroSettings };
    state.aboutClub = { ...state.aboutClub, ...aboutClub };
    state.aboutManager = { ...state.aboutManager, ...aboutManager };
    state.contactInfo = { ...state.contactInfo, ...contactInfo };
    state.footerSettings = {
      ...(state.footerSettings || defaultFooterSettings),
      ...footerSettings,
      links,
    };

    return {
      heroSettings,
      aboutClub,
      aboutManager,
      contactInfo,
      footerSettings,
    };
  }

  $wrapper.on('click', '.js-admin-add-footer-link', () => {
    readHomeSettingsFormIntoState();
    const currentLinks = Array.isArray(state.footerSettings?.links)
      ? [...state.footerSettings!.links]
      : [];
    currentLinks.push({ label: 'لینک جدید', href: '#' });
    state.footerSettings = {
      ...(state.footerSettings || defaultFooterSettings),
      links: currentLinks,
    };
    render();
  });

  $wrapper.on('click', '.js-admin-remove-footer-link', function () {
    readHomeSettingsFormIntoState();
    const idx = Number($(this).data('remove-footer-link'));
    const currentLinks = Array.isArray(state.footerSettings?.links)
      ? [...state.footerSettings!.links]
      : [];
    if (!Number.isNaN(idx) && idx >= 0 && idx < currentLinks.length) {
      currentLinks.splice(idx, 1);
      state.footerSettings = {
        ...(state.footerSettings || defaultFooterSettings),
        links: currentLinks,
      };
      render();
    }
  });

  function handleSaveHomeSettings(): void {
    const collected = readHomeSettingsFormIntoState();
    if (!collected) return;

    const cleanLinks = (collected.footerSettings.links || []).filter((l) =>
      Boolean(String(l.label || '').trim())
    );
    collected.footerSettings.links = cleanLinks;

    ApiService.updateAdminHomeSettings(collected)
      .then((res) => {
        state.heroSettings = res.heroSettings;
        state.aboutClub = res.aboutClub;
        state.aboutManager = res.aboutManager;
        state.contactInfo = res.contactInfo;
        if (res.footerSettings) {
          state.footerSettings = res.footerSettings;
        }
        homeSettingsSavedBanner =
          'تمامی تنظیمات صفحه اصلی و فوتر با موفقیت در دیتابیس ذخیره و در سایت اعمال شد.';
        props.onSiteDataUpdated({
          heroSettings: res.heroSettings,
          aboutClub: res.aboutClub,
          aboutManager: res.aboutManager,
          contactInfo: res.contactInfo,
          footerSettings: res.footerSettings,
        });
        render();
        showToast('تنظیمات صفحه اصلی و فوتر سایت با موفقیت ذخیره شد.');
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
