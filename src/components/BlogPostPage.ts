import $ from 'jquery';
import type { BlogPost } from '../types/models.ts';
import { toPersianDigits } from '../utils/persianNumbers.ts';
import { renderSanitizedArticleHtml } from '../utils/sanitizeHtml.ts';

export interface BlogPostPageProps {
  post: BlogPost;
  allPosts: BlogPost[];
  onBackToHome: () => void;
  onSelectPost: (post: BlogPost) => void;
}

export function createBlogPostPageComponent(
  props: BlogPostPageProps
): JQuery<HTMLElement> {
  const { post, allPosts, onBackToHome, onSelectPost } = props;

  const relatedPosts = allPosts.filter((p) => p.id !== post.id);
  const parsedTags = String(post.tags || '')
    .split(/[,،]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const sanitizedHtmlContent = renderSanitizedArticleHtml(post.full_content || '');

  const $page = $(`
    <main
      dir="rtl"
      aria-label="${toPersianDigits(post.title)}"
      class="w-full min-h-screen py-10 md:py-16 px-6 md:px-14"
    >
      <div class="max-w-4xl mx-auto">
        <!-- Top Navigation / Back Bar -->
        <div class="flex flex-wrap items-center justify-between gap-4 pb-6 mb-8 border-b border-[#dad0bc]">
          <button
            type="button"
            class="js-back-to-blog inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#382315] bg-[#f7f2e6] hover:bg-[#ebe2cf] border border-[#d5c8b2] px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <span>→</span>
            <span>بازگشت به صفحه اصلی و وبلاگ</span>
          </button>

          <div class="text-xs text-[#6f5a48]">
            <span>وبلاگ باشگاه کتابخوانی بوک‌میت</span>
            <span class="mx-1.5">·</span>
            <span>شماره یادداشت ${toPersianDigits(post.id)}</span>
          </div>
        </div>

        <!-- Article Container -->
        <article class="bg-[#f8f4ea] border border-[#dcd0bb] rounded-[28px] overflow-hidden shadow-[0_22px_54px_-24px_rgba(45,29,16,0.18)]">
          <!-- Cover Image Header -->
          <div class="relative aspect-[16/8.5] w-full bg-[#e5dcc8] border-b border-[#e2d7c3] overflow-hidden">
            <img
              src="${post.cover_url}"
              alt="${toPersianDigits(post.title)}"
              class="w-full h-full object-cover"
            />
          </div>

          <!-- Article Body -->
          <div class="p-6 sm:p-10 md:p-12 space-y-6">
            <!-- Meta Bar -->
            <div class="flex flex-wrap items-center justify-between gap-3 text-xs text-[#755f4b] pb-4 border-b border-[#e6dccb]">
              <div>
                ${
                  post.author
                    ? `نویسنده یادداشت: <strong class="font-bold text-[#382315]">${toPersianDigits(post.author)}</strong>`
                    : ''
                }
              </div>
              <div class="flex items-center gap-3">
                ${
                  post.published_date
                    ? `<span>تاریخ انتشار: ${toPersianDigits(post.published_date)}</span>`
                    : ''
                }
                ${post.published_date && post.reading_time ? `<span>·</span>` : ''}
                ${
                  post.reading_time
                    ? `<span>زمان مطالعه: ${toPersianDigits(post.reading_time)}</span>`
                    : ''
                }
              </div>
            </div>

            <!-- Category as Plain Text Directly Above Title -->
            <div class="space-y-2">
              ${
                post.category
                  ? `<div class="text-[13px] font-bold text-[#7a5230]">
                      ${toPersianDigits(post.category)}
                    </div>`
                  : ''
              }
              <h1 class="text-2xl sm:text-3xl md:text-[34px] font-bold text-[#382315] leading-[1.45]">
                ${toPersianDigits(post.title)}
              </h1>
            </div>

            <!-- Lead Excerpt (Only when non-empty) -->
            ${
              post.excerpt && post.excerpt.trim()
                ? `<p
                    class="text-base sm:text-[17px] font-medium text-[#3d2c1e] leading-[2.1] bg-[#efe8d8]/75 p-5 rounded-2xl border border-[#e0d4be] text-justify"
                    style="text-align: justify; text-justify: inter-word;"
                  >
                    ${toPersianDigits(post.excerpt)}
                  </p>`
                : ''
            }

            <!-- Main Article Content (Sanitized Rich Text HTML) -->
            <div class="js-article-rich-content space-y-4 text-[15px] sm:text-[16px] text-[#4a392b] leading-[2.15] text-justify [&_h2]:text-xl [&_h2]:sm:text-2xl [&_h2]:font-bold [&_h2]:text-[#2d1c10] [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:sm:text-xl [&_h3]:font-bold [&_h3]:text-[#382315] [&_h3]:mt-5 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pr-6 [&_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:pr-6 [&_ol]:space-y-1.5 [&_blockquote]:my-5 [&_blockquote]:p-5 [&_blockquote]:bg-[#f2ecde] [&_blockquote]:border-r-4 [&_blockquote]:border-[#6b4c32] [&_blockquote]:rounded-l-2xl [&_blockquote]:font-medium [&_blockquote]:text-[#382315] [&_a]:text-[#7a4b2a] [&_a]:underline [&_a]:font-semibold">
              ${sanitizedHtmlContent}
            </div>

            <!-- Article Footer Tags & Back Button -->
            <div class="pt-6 border-t border-[#e5dccb] flex flex-wrap items-center justify-between gap-4">
              ${
                parsedTags.length > 0
                  ? `<div class="flex flex-wrap items-center gap-2 text-xs text-[#695645]">
                      ${parsedTags
                        .map(
                          (tag) =>
                            `<span class="px-3 py-1 bg-[#ede5d5] rounded-lg">#${toPersianDigits(
                              tag.replace(/^#+/, '')
                            )}</span>`
                        )
                        .join('')}
                    </div>`
                  : `<div></div>`
              }

              <button
                type="button"
                class="js-back-to-blog text-xs sm:text-sm font-semibold text-[#6b4c32] hover:text-[#382315] underline underline-offset-4 cursor-pointer"
              >
                بازگشت به فهرست یادداشت‌ها
              </button>
            </div>
          </div>
        </article>

        <!-- Related Blog Posts -->
        ${
          relatedPosts.length > 0
            ? `<div class="mt-14 space-y-6">
                <h2 class="text-xl font-bold text-[#382315]">
                  سایر یادداشت‌های وبلاگ بوک‌میت
                </h2>
                <div class="js-related-posts grid grid-cols-1 md:grid-cols-2 gap-6"></div>
              </div>`
            : ''
        }
      </div>
    </main>
  `);

  $page.find('.js-back-to-blog').on('click', (e) => {
    e.preventDefault();
    onBackToHome();
  });

  const $relatedGrid = $page.find('.js-related-posts');
  relatedPosts.forEach((rel) => {
    const $relCard = $(`
      <article class="group bg-[#f8f4ea] border border-[#ded3be] hover:border-[#9e7d5d] rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-[0_12px_28px_-16px_rgba(48,31,17,0.14)] hover:shadow-[0_18px_36px_-16px_rgba(48,31,17,0.22)] cursor-pointer">
        <div>
          <!-- Suggested Article Cover Image -->
          <div class="relative aspect-[16/9.5] w-full overflow-hidden bg-[#e5dcc8] border-b border-[#e4dac7]">
            <img
              src="${rel.cover_url}"
              alt="${toPersianDigits(rel.title)}"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          </div>

          <div class="p-5 space-y-2">
            <div class="flex items-center justify-between text-[11px] text-[#7a6451]">
              <span>${rel.author ? `نویسنده: <strong class="font-semibold text-[#473425]">${toPersianDigits(rel.author)}</strong>` : ''}</span>
              <span>${toPersianDigits(rel.published_date)}${rel.reading_time ? ` · ${toPersianDigits(rel.reading_time)}` : ''}</span>
            </div>
            ${
              rel.category
                ? `<div class="text-[11.5px] font-bold text-[#7a5230]">
                    ${toPersianDigits(rel.category)}
                  </div>`
                : ''
            }
            <h3 class="text-sm sm:text-base font-bold text-[#382315] group-hover:text-[#7a5230] transition-colors leading-snug">
              ${toPersianDigits(rel.title)}
            </h3>
            ${
              rel.excerpt && rel.excerpt.trim()
                ? `<p
                    class="text-xs text-[#4e3d2f] leading-[1.95] text-justify"
                    style="text-align: justify; text-justify: inter-word;"
                  >
                    ${toPersianDigits(rel.excerpt)}
                  </p>`
                : ''
            }
          </div>
        </div>

        <div class="px-5 pb-4 pt-2 border-t border-[#e8dfd0] flex items-center justify-between text-xs font-semibold text-[#6b4c32] group-hover:text-[#382315]">
          <span>مطالعه کامل این یادداشت</span>
          <span class="transition-transform duration-200 group-hover:-translate-x-1">←</span>
        </div>
      </article>
    `);

    $relCard.on('click', () => {
      onSelectPost(rel);
    });

    $relatedGrid.append($relCard);
  });

  return $page;
}
