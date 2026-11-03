import $ from 'jquery';
import type {
  BootstrapPayload,
  ClubCalendarEvent,
  ClubForgotPasswordInput,
  ClubLoginInput,
  ClubMember,
  ClubRegisterInput,
  ContactMessageInput,
  FeaturedBook,
  MemberLibraryItem,
  MemberPanelPayload,
  MemberSession,
  MemberTicket,
} from '../types/models.ts';

export const ApiService = {
  fetchBootstrapData(): Promise<BootstrapPayload> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/api/bootstrap',
        method: 'GET',
        dataType: 'json',
        success: (data: BootstrapPayload) => resolve(data),
        error: (_jqXHR, textStatus, errorThrown) =>
          reject(new Error(errorThrown || textStatus || 'Request failed')),
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
        error: (_jqXHR, textStatus, errorThrown) =>
          reject(new Error(errorThrown || textStatus || 'Request failed')),
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
        error: (_jqXHR, textStatus, errorThrown) =>
          reject(new Error(errorThrown || textStatus || 'Request failed')),
      });
    });
  },

  registerClubMember(
    payload: ClubRegisterInput
  ): Promise<{ success: boolean; member: ClubMember }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/api/auth/register',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        dataType: 'json',
        success: (data: { success: boolean; member: ClubMember }) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) => {
          const serverError = jqXHR.responseJSON?.error;
          reject(new Error(serverError || errorThrown || textStatus || 'خطا در ثبت‌نام'));
        },
      });
    });
  },

  loginClubMember(
    payload: ClubLoginInput
  ): Promise<{ success: boolean; member: ClubMember }> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/api/auth/login',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        dataType: 'json',
        success: (data: { success: boolean; member: ClubMember }) => resolve(data),
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

  fetchMemberPanelData(phone?: string): Promise<MemberPanelPayload> {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: phone ? `/api/panel?phone=${encodeURIComponent(phone)}` : '/api/panel',
        method: 'GET',
        dataType: 'json',
        success: (data: MemberPanelPayload) => resolve(data),
        error: (_jqXHR, textStatus, errorThrown) =>
          reject(new Error(errorThrown || textStatus || 'Failed to load panel')),
      });
    });
  },

  updateMemberProfile(payload: {
    phone: string;
    first_name: string;
    last_name: string;
    education: string;
    favorite_genre: string;
    email: string;
    city: string;
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
    progress_percent: number;
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
};



