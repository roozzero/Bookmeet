import $ from 'jquery';
import type { LibraryBook } from '../types/models.ts';

export interface LibrarySectionProps {
  libraryBooks: LibraryBook[];
}

export function createLibrarySectionComponent(
  props: LibrarySectionProps
): JQuery<HTMLElement> {
  const initialCurrent =
    props.libraryBooks.find((b) => b.is_current === 1) || props.libraryBooks[0];
  let activeBook = initialCurrent;
  let selectedCategory: 'همه' | 'کلاسیک' | 'معاصر' = 'همه';

  const $section = $(`
    <section
      id="library"
      dir="rtl"
      aria-labelledby="library-section-heading"
      class="w-full max-w-[1140px] mx-auto px-6 sm:px-10 py-16 sm:py-24 border-t border-[#ddd4c0] space-y-14"
    >
      <!-- Section Header -->
      <div class="space-y-3 text-right">
        <div class="text-xs font-medium text-[#755f4b]">
          ۰۳ · کتابخانه باشگاه کتابخوانی بوک‌میت
        </div>
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <h2
            id="library-section-heading"
            class="text-[24px] sm:text-[32px] font-bold text-[#38281b] leading-[1.38]"
          >
            کتاب در حال مطالعه و آثار اخیر معرفی‌شده
          </h2>
          <p class="text-xs sm:text-sm text-[#695645] max-w-md text-justify">
            مروری بر کتاب منتخب این ماه در حلقه‌های هم‌خوانی و فهرست آثار برجسته‌ای که در نشست‌های اخیر باشگاه نقد و بررسی شده‌اند.
          </p>
        </div>
      </div>

      <!-- PART 1: نمایش کتاب در حال مطالعه (Currently Reading Book Showcase) -->
      <div class="js-current-book-container bg-[#e6decb]/65 border border-[#d5cab6] rounded-2xl p-6 sm:p-8 lg:p-10">
      </div>

      <!-- PART 2: نمایش چند کتاب اخیر معرفی‌شده (Recently Introduced Books Grid) -->
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#dbd1bd] pb-4">
          <div>
            <h3 class="text-lg sm:text-xl font-bold text-[#38281b]">
              کتاب‌های اخیر معرفی‌شده در باشگاه
            </h3>
            <p class="text-xs sm:text-sm text-[#695645] mt-1 text-justify">
              آثاری که در دوره‌های گذشته توسط اعضای باشگاه مطالعه و تحلیل شده‌اند.
            </p>
          </div>

          <!-- Interactive Category Filter Tabs -->
          <div class="flex items-center gap-1 p-1 bg-[#dfd6c2] rounded-lg self-start sm:self-auto">
            <button
              type="button"
              data-cat="همه"
              class="js-lib-filter px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer bg-[#faf6ec] text-[#23180f] shadow-xs"
            >
              همه آثار
            </button>
            <button
              type="button"
              data-cat="کلاسیک"
              class="js-lib-filter px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer text-[#5c4b3c] hover:text-[#23180f]"
            >
              ادبیات کلاسیک
            </button>
            <button
              type="button"
              data-cat="معاصر"
              class="js-lib-filter px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer text-[#5c4b3c] hover:text-[#23180f]"
            >
              ادبیات معاصر
            </button>
          </div>
        </div>

        <div class="js-recent-books-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        </div>
      </div>
    </section>
  `);

  const $currentContainer = $section.find('.js-current-book-container');
  const $recentGrid = $section.find('.js-recent-books-grid');

  function renderCurrentBook(book: LibraryBook) {
    if (!book) return;
    $currentContainer.empty();

    const statusLabel =
      book.is_current === 1
        ? 'کتاب در حال مطالعه این ماه'
        : 'مرور شناسنامه و چکیده کتاب';

    const $card = $(`
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
        <!-- Right Column in RTL: Book Cover Showcase -->
        <div class="lg:col-span-4 flex flex-col">
          <div class="relative w-full h-full min-h-[290px] sm:min-h-[340px] rounded-xl overflow-hidden border border-[#d0c3ac] bg-[#dfd6c1] flex items-center justify-center group">
            <img
              src="${book.cover_url}"
              alt="${book.title} — ${book.author}"
              referrerpolicy="no-referrer"
              class="js-current-cover-img w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <div class="absolute bottom-3 left-3 z-10">
              <label
                class="px-2.5 py-1 text-[11px] font-medium text-[#f5efe4] bg-[#241911]/75 border border-[#f5efe4]/35 hover:bg-[#241911] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="تغییر تصویر جلد کتاب"
              >
                <span>تغییر تصویر جلد</span>
                <input type="file" accept="image/*" class="js-current-cover-input hidden" />
              </label>
            </div>
          </div>
        </div>

        <!-- Left Column in RTL: Book Details, Justified Short Description & Progress -->
        <div class="lg:col-span-8 flex flex-col justify-between text-right space-y-6">
          <div class="space-y-3">
            <!-- Unboxed Metadata Kicker -->
            <div class="flex flex-wrap items-center gap-2 text-xs font-medium text-[#755f4b]">
              <span>${statusLabel}</span>
              <span aria-hidden="true">·</span>
              <span>ادبیات ${book.category}</span>
              <span aria-hidden="true">·</span>
              <span class="tabular-nums">سال انتشار ${book.publication_year}</span>
            </div>

            <div>
              <h3 class="text-[22px] sm:text-[28px] font-bold text-[#38281b] leading-[1.35]">
                ${book.title}
              </h3>
              <div class="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#5f4d3d] mt-1">
                <span>نویسنده: ${book.author}</span>
                <span aria-hidden="true">·</span>
                <span>ترجمه: ${book.translator}</span>
                <span aria-hidden="true">·</span>
                <span class="tabular-nums">${book.pages_count} صفحه</span>
              </div>
            </div>

            <p class="pt-2 text-[14.5px] sm:text-[15.5px] leading-[2.05] text-[#4e3e30] font-normal text-justify">
              ${book.short_description}
            </p>
          </div>

          <!-- Group Reading Progress & Next Session Info -->
          <div class="pt-5 border-t border-[#d6cbb7] space-y-3">
            <div class="flex items-center justify-between text-xs font-medium text-[#4a392b]">
              <span>${book.session_schedule}</span>
              <span class="tabular-nums font-bold text-[#38281b]">
                پیشرفت هم‌خوانی: ${book.reading_progress_percent}٪
              </span>
            </div>

            <div class="w-full h-2 bg-[#d5cab6] rounded-full overflow-hidden">
              <div
                class="h-full bg-[#3e2d1f] rounded-full transition-all duration-300"
                style="width: ${book.reading_progress_percent}%;"
              ></div>
            </div>
          </div>
        </div>
      </div>
    `);

    const $coverInput = $card.find('.js-current-cover-input');
    const $coverImg = $card.find('.js-current-cover-img');

    $coverInput.on('change', function (e) {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result;
        if (typeof result === 'string') {
          book.cover_url = result;
          $coverImg.attr('src', result);
        }
      };
      reader.readAsDataURL(file);
    });

    $currentContainer.append($card);
  }

  function renderRecentBooksGrid() {
    $recentGrid.empty();

    const recentBooks = props.libraryBooks.filter((b) => {
      const isRecent = b.is_current === 0;
      const matchesCat =
        selectedCategory === 'همه' || b.category === selectedCategory;
      return isRecent && matchesCat;
    });

    recentBooks.forEach((book) => {
      const isInspecting = activeBook?.id === book.id;
      const $item = $(`
        <article
          class="bg-[#e6decb]/55 border ${
            isInspecting ? 'border-[#3e2d1f]' : 'border-[#d5cab6]'
          } rounded-xl p-4 flex flex-col justify-between space-y-4 transition-colors hover:border-[#8a725a]"
        >
          <div class="space-y-3.5">
            <!-- Cover Thumbnail -->
            <div class="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-[#dfd6c1] border border-[#d2c5ae]">
              <img
                src="${book.cover_url}"
                alt="${book.title} — ${book.author}"
                referrerpolicy="no-referrer"
                class="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.03]"
              />
            </div>

            <!-- Unboxed Metadata -->
            <div class="space-y-1 text-right">
              <div class="flex items-center gap-1.5 text-[11.5px] text-[#755f4b]">
                <span>${book.author}</span>
                <span aria-hidden="true">·</span>
                <span>ترجمه ${book.translator}</span>
              </div>

              <h4 class="text-base font-bold text-[#38281b] leading-snug">
                ${book.title}
              </h4>
            </div>

            <!-- Justified Short Description -->
            <p class="text-[13px] leading-[1.9] text-[#4e3e30] font-normal text-justify">
              ${book.short_description}
            </p>
          </div>

          <div class="pt-3 border-t border-[#d8ceba] flex items-center justify-between gap-2 text-xs">
            <span class="text-[#695645] tabular-nums">${book.pages_count} صفحه</span>
            <button
              type="button"
              class="js-inspect-book text-xs font-semibold text-[#3d2c1e] hover:text-[#23180f] underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
            >
              نمایش در قاب اصلی
            </button>
          </div>
        </article>
      `);

      $item.find('.js-inspect-book').on('click', () => {
        activeBook = book;
        renderCurrentBook(activeBook);
        renderRecentBooksGrid();
      });

      $recentGrid.append($item);
    });
  }

  // Wire Category Filter Buttons
  $section.find('.js-lib-filter').on('click', function () {
    const cat = $(this).attr('data-cat') as 'همه' | 'کلاسیک' | 'معاصر';
    selectedCategory = cat;

    $section
      .find('.js-lib-filter')
      .removeClass('bg-[#faf6ec] text-[#23180f] shadow-xs')
      .addClass('text-[#5c4b3c]');

    $(this)
      .removeClass('text-[#5c4b3c]')
      .addClass('bg-[#faf6ec] text-[#23180f] shadow-xs');

    renderRecentBooksGrid();
  });

  renderCurrentBook(activeBook);
  renderRecentBooksGrid();

  return $section;
}
