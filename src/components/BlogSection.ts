import $ from 'jquery';
import type { BlogPost } from '../types/models.ts';
import { toPersianDigits } from '../utils/persianNumbers.ts';

export interface BlogSectionProps {
  blogPosts: BlogPost[];
  onOpenPost?: (post: BlogPost) => void;
}

export function createBlogSectionComponent(
  props: BlogSectionProps
): JQuery<HTMLElement> {
  const { blogPosts, onOpenPost } = props;

  const $section = $(`
    <section
      id="blog"
      dir="rtl"
      aria-label="وبلاگ باشگاه کتابخوانی بوک‌میت"
      class="w-full py-20 md:py-28 px-6 md:px-14 border-t border-[#dfd6c3]/80 relative overflow-hidden bg-[#ebe4d1]/45"
    >
      <div class="max-w-6xl mx-auto">
        <!-- Section Header -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div class="inline-flex items-center gap-2.5 text-xs md:text-sm font-medium text-[#7a5c43] mb-3">
              <span class="w-6 h-[1.5px] bg-[#8c6b4f] inline-block"></span>
              <span>۰۴ · وبلاگ و جستارهای ادبی باشگاه</span>
            </div>
            <h2 class="text-2xl sm:text-3xl md:text-[36px] font-bold text-[#382315] leading-[1.35] tracking-tight">
              یادداشت‌ها، نقدها و تجربه‌های خوانش در بوک‌میت
            </h2>
          </div>

          <p class="text-sm text-[#594636] max-w-md leading-[1.95] text-justify" style="text-align: justify; text-justify: inter-word;">
            در وبلاگ بوک‌میت، خلاصه مباحث مطرح‌شده در نشست‌های هفتگی، جستارهای تحلیلی اعضا و راهنماهای خوانش خلاق ادبیات داستانی منتشر می‌شود.
          </p>
        </div>

        <!-- Blog Posts Grid -->
        <div class="js-blog-grid grid grid-cols-1 md:grid-cols-3 gap-7"></div>
      </div>
    </section>
  `);

  const $grid = $section.find('.js-blog-grid');

  if (!blogPosts || blogPosts.length === 0) {
    $grid.append(`
      <div class="col-span-full bg-[#f8f4ea] border border-[#ded3be] rounded-[24px] p-10 text-center text-sm text-[#6b5643]">
        هنوز مقاله‌ای در وبلاگ باشگاه ثبت نشده است.
      </div>
    `);
    return $section;
  }

  blogPosts.forEach((post) => {
    const $card = $(`
      <article
        data-post-id="${post.id}"
        class="group bg-[#f8f4ea] border border-[#ded3be] hover:border-[#9e7d5d] rounded-[24px] overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-[0_14px_34px_-18px_rgba(48,31,17,0.14)] hover:shadow-[0_22px_44px_-18px_rgba(48,31,17,0.22)]"
      >
        <div>
          <!-- Blog Cover Image -->
          <div class="js-open-post-trigger relative aspect-[16/10] w-full overflow-hidden bg-[#e5dcc8] border-b border-[#e4dac7] cursor-pointer">
            <img
              src="${post.cover_url}"
              alt="${toPersianDigits(post.title)}"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          </div>

          <!-- Post Meta & Excerpt -->
          <div class="p-6">
            <div class="flex items-center justify-between text-[11px] text-[#7a6451] mb-3 pb-2.5 border-b border-[#e8dfd0]">
              <span>${post.author ? `نویسنده: <strong class="font-semibold text-[#473425]">${toPersianDigits(post.author)}</strong>` : ''}</span>
              <span>${toPersianDigits(post.published_date)}${post.reading_time ? ` · ${toPersianDigits(post.reading_time)}` : ''}</span>
            </div>

            ${
              post.category
                ? `<div class="text-[12px] font-bold text-[#7a5230] mb-1">
                    ${toPersianDigits(post.category)}
                  </div>`
                : ''
            }

            <h3 class="js-open-post-trigger text-base md:text-[17px] font-bold text-[#382315] leading-[1.6] mb-3 group-hover:text-[#7a5230] transition-colors cursor-pointer">
              ${toPersianDigits(post.title)}
            </h3>

            ${
              post.excerpt && post.excerpt.trim()
                ? `<p
                    class="text-xs md:text-[13.5px] text-[#4e3d2f] leading-[2.05] text-justify font-normal"
                    style="text-align: justify; text-justify: inter-word;"
                  >
                    ${toPersianDigits(post.excerpt)}
                  </p>`
                : ''
            }
          </div>
        </div>

        <!-- Card Footer -->
        <div class="px-6 pb-5 pt-1 flex items-center justify-between">
          <button
            type="button"
            class="js-open-post-btn inline-flex items-center gap-1.5 text-xs font-semibold text-[#6b4c32] hover:text-[#382315] transition-colors cursor-pointer"
          >
            <span>مطالعه کامل یادداشت</span>
            <span class="transition-transform duration-200 group-hover:-translate-x-1">←</span>
          </button>
          <span class="text-[11px] text-[#8c7662]">شماره ${toPersianDigits(post.id)}</span>
        </div>
      </article>
    `);

    $card.find('.js-open-post-btn, .js-open-post-trigger').on('click', (e) => {
      e.preventDefault();
      if (onOpenPost) {
        onOpenPost(post);
      }
    });

    $grid.append($card);
  });

  return $section;
}
