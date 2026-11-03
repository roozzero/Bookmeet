import $ from 'jquery';
import type {
  BootstrapPayload,
  ClubForgotPasswordInput,
  ClubLoginInput,
  ClubMember,
  ClubRegisterInput,
  ContactMessageInput,
  FeaturedBook,
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
};


