import $ from 'jquery';
import type {
  AboutClubData,
  AboutManagerData,
  AdminPanelPayload,
  BlogPost,
  BootstrapPayload,
  ClubAnnouncement,
  ClubCalendarEvent,
  ClubForgotPasswordInput,
  ClubLoginInput,
  ClubMember,
  ClubRegisterInput,
  ContactInfoData,
  ContactMessageInput,
  FeaturedBook,
  GalleryImage,
  HeroSettings,
  MemberClassItem,
  MemberLibraryItem,
  MemberPanelPayload,
  MemberSession,
  MemberTicket,
  UserComment,
} from '../types/models.ts';

const AUTH_TOKEN_STORAGE_KEY = 'bookmeet_auth_token';

function getStoredAuthToken(): string | null {
  try {
    return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredAuthToken(token: string | null): void {
  try {
    if (token) {
      window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore localStorage restrictions
  }
}

$.ajaxSetup({
  beforeSend: (jqXHR) => {
    const token = getStoredAuthToken();
    if (token) {
      jqXHR.setRequestHeader('Authorization', `Bearer ${token}`);
    }
  },
});

export const ApiService = {
  getAuthToken(): string | null {
    return getStoredAuthToken();
  },

  clearAuthToken(): void {
    setStoredAuthToken(null);
  },

  fetchCurrentSessionMember(): Promise<{ success: boolean; member: ClubMember }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/api/auth/me',
        method: 'GET',
        dataType: 'json',
        success: (data: { success: boolean; member: ClubMember }) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) => {
          if (jqXHR.status === 401) {
            setStoredAuthToken(null);
          }
          reject(new Error(jqXHR.responseJSON?.error || errorThrown || textStatus || 'Unauthorized'));
        },
      });
    });
  },

  logoutClubMember(): Promise<{ success: boolean }> {
    return new Promise((resolve) => {
      $.ajax({
        url: '/api/auth/logout',
        method: 'POST',
        dataType: 'json',
        complete: () => {
          setStoredAuthToken(null);
          resolve({ success: true });
        },
      });
    });
  },

  fetchBootstrapData(): Promise<BootstrapPayload> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/api/bootstrap',
        method: 'GET',
        dataType: 'json',
        success: (data: BootstrapPayload) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) =>
          reject(
            new Error(jqXHR.responseJSON?.error || errorThrown || textStatus || 'Request failed')
          ),
      });
    });
  },

  fetchFeaturedBooks(): Promise<{ books: FeaturedBook[] }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/api/books',
        method: 'GET',
        dataType: 'json',
        success: (data: { books: FeaturedBook[] }) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) =>
          reject(
            new Error(jqXHR.responseJSON?.error || errorThrown || textStatus || 'Request failed')
          ),
      });
    });
  },

  submitContactMessage(
    payload: ContactMessageInput
  ): Promise<{ success: boolean }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/api/contact',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        dataType: 'json',
        success: (data: { success: boolean }) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) =>
          reject(
            new Error(jqXHR.responseJSON?.error || errorThrown || textStatus || 'Request failed')
          ),
      });
    });
  },

  registerClubMember(
    payload: ClubRegisterInput
  ): Promise<{ success: boolean; member: ClubMember; token?: string }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/api/auth/register',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        dataType: 'json',
        success: (data: { success: boolean; member: ClubMember; token?: string }) => {
          if (data.token) {
            setStoredAuthToken(data.token);
          }
          resolve(data);
        },
        error: (jqXHR, textStatus, errorThrown) => {
          const serverError = jqXHR.responseJSON?.error;
          reject(new Error(serverError || errorThrown || textStatus || 'خطا در ثبت‌نام'));
        },
      });
    });
  },

  loginClubMember(
    payload: ClubLoginInput
  ): Promise<{ success: boolean; member: ClubMember; token?: string }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/api/auth/login',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        dataType: 'json',
        success: (data: { success: boolean; member: ClubMember; token?: string }) => {
          if (data.token) {
            setStoredAuthToken(data.token);
          }
          resolve(data);
        },
        error: (jqXHR, textStatus, errorThrown) => {
          const serverError = jqXHR.responseJSON?.error;
          reject(new Error(serverError || errorThrown || textStatus || 'خطا در ورود'));
        },
      });
    });
  },

  resetClubPassword(
    payload: ClubForgotPasswordInput
  ): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/api/auth/forgot-password',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        dataType: 'json',
        success: (data: { success: boolean; message: string }) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) => {
          const serverError = jqXHR.responseJSON?.error;
          reject(
            new Error(serverError || errorThrown || textStatus || 'خطا در بازنشانی رمز عبور')
          );
        },
      });
    });
  },

  fetchMemberPanelData(_phone?: string): Promise<MemberPanelPayload> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/api/panel',
        method: 'GET',
        dataType: 'json',
        success: (data: MemberPanelPayload) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) =>
          reject(
            new Error(
              jqXHR.responseJSON?.error || errorThrown || textStatus || 'Failed to load panel'
            )
          ),
      });
    });
  },

  updateMemberProfile(payload: {
    phone: string;
    first_name: string;
    last_name: string;
    education: string;
    email: string;
    avatar_url?: string;
    bio: string;
  }): Promise<{ success: boolean; member: ClubMember }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/api/panel/profile',
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        dataType: 'json',
        success: (data: { success: boolean; member: ClubMember }) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) =>
          reject(
            new Error(jqXHR.responseJSON?.error || errorThrown || textStatus || 'خطا')
          ),
      });
    });
  },

  saveMemberSessionNote(payload: {
    sessionId: number;
    member_note: string;
  }): Promise<{ success: boolean; session: MemberSession }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/api/panel/sessions/note',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        dataType: 'json',
        success: (data: { success: boolean; session: MemberSession }) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) =>
          reject(
            new Error(jqXHR.responseJSON?.error || errorThrown || textStatus || 'خطا')
          ),
      });
    });
  },

  updateMemberLibraryBook(payload: {
    bookId: number;
    pages_read: number;
    progress_percent?: number;
    reading_status: 'در حال مطالعه' | 'خوانده‌شده' | 'در نوبت مطالعه';
    personal_note: string;
  }): Promise<{ success: boolean; book: MemberLibraryItem }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/api/panel/library',
        method: 'PATCH',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        dataType: 'json',
        success: (data: { success: boolean; book: MemberLibraryItem }) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) =>
          reject(
            new Error(jqXHR.responseJSON?.error || errorThrown || textStatus || 'خطا')
          ),
      });
    });
  },

  addMemberLibraryBook(payload: {
    book_title: string;
    author: string;
    translator: string;
    reading_status: 'در حال مطالعه' | 'خوانده‌شده' | 'در نوبت مطالعه';
    pages_count: number;
    personal_note: string;
  }): Promise<{ success: boolean; book: MemberLibraryItem }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/api/panel/library',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        dataType: 'json',
        success: (data: { success: boolean; book: MemberLibraryItem }) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) =>
          reject(
            new Error(jqXHR.responseJSON?.error || errorThrown || textStatus || 'خطا')
          ),
      });
    });
  },

  createMemberTicket(payload: {
    member_phone: string;
    subject: string;
    department: string;
    priority: 'عادی' | 'مهم' | 'فوری';
    message: string;
    attachment_name?: string;
  }): Promise<{ success: boolean; ticket: MemberTicket }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/api/panel/tickets',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        dataType: 'json',
        success: (data: { success: boolean; ticket: MemberTicket }) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) =>
          reject(
            new Error(jqXHR.responseJSON?.error || errorThrown || textStatus || 'خطا')
          ),
      });
    });
  },

  toggleCalendarReservation(
    eventId: number
  ): Promise<{ success: boolean; event: ClubCalendarEvent }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/api/panel/calendar/reserve',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ eventId }),
        dataType: 'json',
        success: (data: { success: boolean; event: ClubCalendarEvent }) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) =>
          reject(
            new Error(jqXHR.responseJSON?.error || errorThrown || textStatus || 'خطا')
          ),
      });
    });
  },

  markAnnouncementRead(
    announcementId: number
  ): Promise<{ success: boolean; announcement: ClubAnnouncement }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/api/panel/announcements/read',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ announcementId }),
        dataType: 'json',
        success: (data: { success: boolean; announcement: ClubAnnouncement }) =>
          resolve(data),
        error: (jqXHR, textStatus, errorThrown) =>
          reject(
            new Error(jqXHR.responseJSON?.error || errorThrown || textStatus || 'خطا')
          ),
      });
    });
  },

  // ==================== ADMIN PANEL API CLIENT METHODS ====================
  fetchAdminPanelData(): Promise<AdminPanelPayload> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/api/admin',
        method: 'GET',
        dataType: 'json',
        success: (data: AdminPanelPayload) => resolve(data),
        error: (_jqXHR, textStatus, errorThrown) =>
          reject(new Error(errorThrown || textStatus || 'خطا در دریافت پنل مدیریت')),
      });
    });
  },

  saveAdminSession(
    payload: Partial<MemberSession> & { id?: number }
  ): Promise<{ success: boolean; session: MemberSession }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/api/admin/sessions',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        dataType: 'json',
        success: (data: { success: boolean; session: MemberSession }) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) =>
          reject(
            new Error(jqXHR.responseJSON?.error || errorThrown || textStatus || 'خطا')
          ),
      });
    });
  },

  deleteAdminSession(id: number): Promise<{ success: boolean }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `/api/admin/sessions/${id}`,
        method: 'DELETE',
        dataType: 'json',
        success: (data: { success: boolean }) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) =>
          reject(
            new Error(jqXHR.responseJSON?.error || errorThrown || textStatus || 'خطا')
          ),
      });
    });
  },

  saveAdminClass(
    payload: Partial<MemberClassItem> & { id?: number }
  ): Promise<{ success: boolean; classItem: MemberClassItem }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/api/admin/classes',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        dataType: 'json',
        success: (data: { success: boolean; classItem: MemberClassItem }) =>
          resolve(data),
        error: (jqXHR, textStatus, errorThrown) =>
          reject(
            new Error(jqXHR.responseJSON?.error || errorThrown || textStatus || 'خطا')
          ),
      });
    });
  },

  deleteAdminClass(id: number): Promise<{ success: boolean }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `/api/admin/classes/${id}`,
        method: 'DELETE',
        dataType: 'json',
        success: (data: { success: boolean }) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) =>
          reject(
            new Error(jqXHR.responseJSON?.error || errorThrown || textStatus || 'خطا')
          ),
      });
    });
  },

  saveAdminUser(
    payload: Partial<ClubMember> & { id?: number; password?: string }
  ): Promise<{ success: boolean; user: ClubMember }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/api/admin/users',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        dataType: 'json',
        success: (data: { success: boolean; user: ClubMember }) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) =>
          reject(
            new Error(jqXHR.responseJSON?.error || errorThrown || textStatus || 'خطا')
          ),
      });
    });
  },

  deleteAdminUser(id: number): Promise<{ success: boolean }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `/api/admin/users/${id}`,
        method: 'DELETE',
        dataType: 'json',
        success: (data: { success: boolean }) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) =>
          reject(
            new Error(jqXHR.responseJSON?.error || errorThrown || textStatus || 'خطا')
          ),
      });
    });
  },

  replyAdminTicket(payload: {
    id: number;
    admin_reply: string;
    status: 'پاسخ داده‌شده' | 'در انتظار بررسی' | 'بسته‌شده';
  }): Promise<{ success: boolean; ticket: MemberTicket }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/api/admin/tickets/reply',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        dataType: 'json',
        success: (data: { success: boolean; ticket: MemberTicket }) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) =>
          reject(
            new Error(jqXHR.responseJSON?.error || errorThrown || textStatus || 'خطا')
          ),
      });
    });
  },

  deleteAdminTicket(id: number): Promise<{ success: boolean }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `/api/admin/tickets/${id}`,
        method: 'DELETE',
        dataType: 'json',
        success: (data: { success: boolean }) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) =>
          reject(
            new Error(jqXHR.responseJSON?.error || errorThrown || textStatus || 'خطا')
          ),
      });
    });
  },

  saveAdminAnnouncement(
    payload: Partial<ClubAnnouncement> & { id?: number }
  ): Promise<{ success: boolean; announcement: ClubAnnouncement }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/api/admin/announcements',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        dataType: 'json',
        success: (data: { success: boolean; announcement: ClubAnnouncement }) =>
          resolve(data),
        error: (jqXHR, textStatus, errorThrown) =>
          reject(
            new Error(jqXHR.responseJSON?.error || errorThrown || textStatus || 'خطا')
          ),
      });
    });
  },

  deleteAdminAnnouncement(id: number): Promise<{ success: boolean }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `/api/admin/announcements/${id}`,
        method: 'DELETE',
        dataType: 'json',
        success: (data: { success: boolean }) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) =>
          reject(
            new Error(jqXHR.responseJSON?.error || errorThrown || textStatus || 'خطا')
          ),
      });
    });
  },

  updateAdminProfile(payload: {
    first_name: string;
    last_name: string;
    email: string;
    education: string;
    bio: string;
    avatar_url?: string;
    new_password?: string;
  }): Promise<{ success: boolean; admin: ClubMember }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/api/admin/profile',
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        dataType: 'json',
        success: (data: { success: boolean; admin: ClubMember }) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) =>
          reject(
            new Error(jqXHR.responseJSON?.error || errorThrown || textStatus || 'خطا')
          ),
      });
    });
  },

  saveAdminBlogPost(
    payload: Partial<BlogPost> & { id?: number }
  ): Promise<{ success: boolean; post: BlogPost }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/api/admin/blog',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        dataType: 'json',
        success: (data: { success: boolean; post: BlogPost }) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) =>
          reject(
            new Error(jqXHR.responseJSON?.error || errorThrown || textStatus || 'خطا')
          ),
      });
    });
  },

  deleteAdminBlogPost(id: number): Promise<{ success: boolean }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `/api/admin/blog/${id}`,
        method: 'DELETE',
        dataType: 'json',
        success: (data: { success: boolean }) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) =>
          reject(
            new Error(jqXHR.responseJSON?.error || errorThrown || textStatus || 'خطا')
          ),
      });
    });
  },

  saveAdminComment(
    payload: Partial<UserComment> & { id?: number }
  ): Promise<{ success: boolean; comment: UserComment }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/api/admin/comments',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        dataType: 'json',
        success: (data: { success: boolean; comment: UserComment }) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) =>
          reject(
            new Error(jqXHR.responseJSON?.error || errorThrown || textStatus || 'خطا')
          ),
      });
    });
  },

  deleteAdminComment(id: number): Promise<{ success: boolean }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `/api/admin/comments/${id}`,
        method: 'DELETE',
        dataType: 'json',
        success: (data: { success: boolean }) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) =>
          reject(
            new Error(jqXHR.responseJSON?.error || errorThrown || textStatus || 'خطا')
          ),
      });
    });
  },

  updateAdminHomeSettings(payload: {
    heroSettings?: Partial<HeroSettings>;
    aboutClub?: Partial<AboutClubData>;
    aboutManager?: Partial<AboutManagerData>;
    contactInfo?: Partial<ContactInfoData>;
  }): Promise<{
    success: boolean;
    heroSettings: HeroSettings;
    aboutClub: AboutClubData;
    aboutManager: AboutManagerData;
    contactInfo: ContactInfoData;
  }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/api/admin/home-settings',
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        dataType: 'json',
        success: (data) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) =>
          reject(
            new Error(jqXHR.responseJSON?.error || errorThrown || textStatus || 'خطا')
          ),
      });
    });
  },

  saveAdminGalleryImage(payload: {
    title: string;
    url: string;
    category?: string;
  }): Promise<{ success: boolean; image: GalleryImage }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/api/admin/gallery',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        dataType: 'json',
        success: (data: { success: boolean; image: GalleryImage }) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) =>
          reject(
            new Error(jqXHR.responseJSON?.error || errorThrown || textStatus || 'خطا')
          ),
      });
    });
  },

  deleteAdminGalleryImage(id: number): Promise<{ success: boolean }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `/api/admin/gallery/${id}`,
        method: 'DELETE',
        dataType: 'json',
        success: (data: { success: boolean }) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) =>
          reject(
            new Error(jqXHR.responseJSON?.error || errorThrown || textStatus || 'خطا')
          ),
      });
    });
  },

  enrollMemberInItem(payload: {
    member_phone: string;
    member_name?: string;
    target_type: 'session' | 'class';
    target_id?: number;
    title: string;
    book_title?: string;
    book_author?: string;
    pages_count?: number;
    publisher?: string;
    mentor_or_instructor?: string;
    schedule_text?: string;
    time_text?: string;
    level_label?: string;
    cover_url?: string;
    description?: string;
  }): Promise<{
    success: boolean;
    target_type: 'session' | 'class';
    session?: MemberSession;
    classItem?: MemberClassItem;
  }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/api/member/enroll',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        dataType: 'json',
        success: (data) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) =>
          reject(
            new Error(jqXHR.responseJSON?.error || errorThrown || textStatus || 'خطا')
          ),
      });
    });
  },

  submitPublicComment(payload: {
    author_name: string;
    author_phone?: string;
    target_title: string;
    target_type: string;
    rating?: number;
    comment_text: string;
  }): Promise<{ success: boolean; comment: UserComment }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/api/comments',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        dataType: 'json',
        success: (data: { success: boolean; comment: UserComment }) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) =>
          reject(
            new Error(jqXHR.responseJSON?.error || errorThrown || textStatus || 'خطا')
          ),
      });
    });
  },

  updateAdminEnrollmentStatus(payload: {
    target_type: 'session' | 'class';
    target_id: number;
    member_phone: string;
    status: 'فعال' | 'غیرفعال' | 'لغو شده';
  }): Promise<{
    success: boolean;
    session?: MemberSession;
    classItem?: MemberClassItem;
  }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/api/admin/enrollments',
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        dataType: 'json',
        success: (data) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) =>
          reject(
            new Error(jqXHR.responseJSON?.error || errorThrown || textStatus || 'خطا')
          ),
      });
    });
  },
};




