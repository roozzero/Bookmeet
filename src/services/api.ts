import $ from 'jquery';
import type { BootstrapPayload, FeaturedBook } from '../types/models.ts';

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
};
