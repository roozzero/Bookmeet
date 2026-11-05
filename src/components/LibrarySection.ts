import $ from 'jquery';
import type { LibraryBook } from '../types/models.ts';
import { toPersianDigits } from '../utils/persianNumbers.ts';

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
  let hasEnteredViewport = false;

  const upcomingEvents = [
    {
      id: 1,
      title: 'نشست هم‌خوانی و تحلیل «صد سال تنهایی» (فصل‌های ۱۲ تا ۱۵)',
      dateLabel: 'چهارشنبه ۲۴ آبان ۱۴۰۵',
      timeLabel: 'ساعت ۱۸:۰۰ تا ۲۰:۰۰',
      mentor: 'دکتر سهراب رستگار',
      location: 'نشست حضوری · سالن اصلی خانه کتاب بوک‌میت',
      description:
        'واکاوی ساختار دایره‌ای زمان، استعاره‌های تنهایی خاندان بوئندیا و گفت‌وگوی گروهی اعضا درباره فصل‌های میانی رمان.',
    },
    {
      id: 2,
      title: 'شب ادبیات کلاسیک؛ کالبدشکافی رمان «مرشد و مارگاریتا»',
      dateLabel: 'جمعه ۲۶ آبان ۱۴۰۵',
      timeLabel: 'ساعت ۱۹:۰۰ تا ۲۱:۰۰',
      mentor: 'دکتر سهراب رستگار و نیلوفر فرهادی',
      location: 'نشست برخط (آنلاین) · تالار گفت‌وگوی بوک‌میت',
      description:
        'بررسی طنز فلسفی میخائیل بولگاکف، تقابل خیر و شر در مسکوی دهه ۱۹۳۰ و تحلیل شخصیت‌پردازی پروفسور ولاند.',
    },
    {
      id: 3,
      title: 'کارگاه عملی حاشیه‌نویسی و خوانش خلاق متون داستانی',
      dateLabel: 'دوشنبه ۲۹ آبان ۱۴۰۵',
      timeLabel: 'ساعت ۱۷:۳۰ تا ۱۹:۳۰',
      mentor: 'آرمان کاظمی',
      location: 'نشست حضوری · اتاق مطالعه باشگاه بوک‌میت',
      description:
        'آموزش شیوه‌های یادداشت‌برداری تحلیلی، ثبت تداعی‌های فردی هنگام مطالعه رمان و آماده‌سازی جستارهای نقد ادبی.',
    },
  ];

  const $section = $(`
    <section
      dir="rtl"
      aria-labelledby="library-section-heading"
      class="w-full max-w-[1140px] mx-auto px-6 sm:px-10 py-16 sm:py-24 border-t border-[#ddd4c0] space-y-16"
    >
      <!-- PART 1: رویدادها و کتاب در حال مطالعه (Connected to #events in Navbar) -->
      <div id="events" class="space-y-10 scroll-mt-24">
        <!-- Section Header -->
        <div class="space-y-3 text-right">
          <div class="text-xs font-medium text-[#755f4b]">
            ۰۳ · رویدادها و کتاب در حال مطالعه باشگاه بوک‌میت
          </div>
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <h2
              id="library-section-heading"
              class="text-[24px] sm:text-[32px] font-bold text-[#38281b] leading-[1.38]"
            >
              کتاب در حال مطالعه و رویدادهای پیش رو
            </h2>
            <p class="text-xs sm:text-sm text-[#695645] max-w-md text-justify" style="text-align: justify; text-justify: inter-word;">
              مروری بر کتاب منتخب این ماه در حلقه‌های هم‌خوانی و نشست‌های پیش روی باشگاه کتابخوانی بوک‌میت.
            </p>
          </div>
        </div>

        <!-- نمایش کتاب در حال مطالعه (Currently Reading Book Showcase) -->
        <div class="js-current-book-container bg-[#e6decb]/65 border border-[#d5cab6] rounded-2xl p-6 sm:p-8 lg:p-10">
        </div>

        <!-- رویدادهای پیش رو (۳ کارت زیر کتاب در حال مطالعه) -->
        <div class="space-y-5">
          <div class="border-b border-[#dbd1bd] pb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 class="text-lg sm:text-xl font-bold text-[#38281b]">
                رویدادهای پیش رو در باشگاه
              </h3>
              <p class="text-xs sm:text-sm text-[#695645] mt-1">
                برنامه سه نشست و کارگاه آتی حلقه‌های مطالعاتی بوک‌میت
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            ${upcomingEvents
              .slice(0, 3)
              .map(
                (ev) => `
              <article class="bg-[#e6decb]/55 border border-[#d5cab6] hover:border-[#8a725a] rounded-xl p-5 flex flex-col justify-between space-y-4 transition-colors">
                <div class="space-y-3 text-right">
                  <div class="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-[#755f4b] border-b border-[#d8ceba] pb-2.5">
                    <span>${toPersianDigits(ev.dateLabel)}</span>
                    <span>${toPersianDigits(ev.timeLabel)}</span>
                  </div>
                  <h4 class="text-base sm:text-[17px] font-bold text-[#38281b] leading-[1.55] text-justify">
                    ${toPersianDigits(ev.title)}
                  </h4>
                  <p class="text-[13px] leading-[1.9] text-[#4e3e30] font-normal text-justify" style="text-align: justify; text-justify: inter-word;">
                    ${toPersianDigits(ev.description)}
                  </p>
                </div>
                <div class="pt-3 border-t border-[#d8ceba] space-y-1.5 text-xs text-[#5f4d3d]">
                  <div>تسهیل‌گر: <strong class="text-[#38281b]">${toPersianDigits(ev.mentor)}</strong></div>
                  <div>محل برگزاری: <span class="text-[#4e3e30]">${toPersianDigits(ev.location)}</span></div>
                </div>
              </article>
            `
              )
              .join('')}
          </div>
        </div>
      </div>

      <!-- PART 2: کتابخانه و نمایش کتاب‌های اخیر معرفی‌شده (Connected to #library in Navbar) -->
      <div id="library" class="space-y-6 pt-6 border-t border-[#ddd4c0] scroll-mt-24">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#dbd1bd] pb-4">
          <div>
            <h3 class="text-lg sm:text-xl font-bold text-[#38281b]">
              کتابخانه و کتاب‌های اخیر معرفی‌شده در باشگاه
            </h3>
            <p class="text-xs sm:text-sm text-[#695645] mt-1 text-justify" style="text-align: justify; text-justify: inter-word;">
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

  function animateProgressBar(targetPercent: number) {
    const $bar = $currentContainer.find('.js-reading-progress-bar');
    const $label = $currentContainer.find('.js-reading-progress-text');

    $bar.stop(true, true).css('width', '0%');
    $label.text(`پیشرفت هم‌خوانی: ${toPersianDigits(0)}٪`);

    $({ pct: 0 })
      .stop(true, true)
      .animate(
        { pct: targetPercent },
        {
          duration: 1450,
          easing: 'swing',
          step(now) {
            const current = Math.round(now);
            $bar.css('width', `${current}%`);
            $label.text(`پیشرفت هم‌خوانی: ${toPersianDigits(current)}٪`);
          },
          complete() {
            $bar.css('width', `${targetPercent}%`);
            $label.text(`پیشرفت هم‌خوانی: ${toPersianDigits(targetPercent)}٪`);
          },
        }
      );
  }

  function renderCurrentBook(book: LibraryBook, shouldAnimateNow = false) {
    if (!book) return;
    $currentContainer.empty();

    const statusLabel =
      book.is_current === 1
        ? 'کتاب در حال مطالعه این ماه'
        : 'مرور شناسنامه و چکیده کتاب';

    const $card = $(`
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
        <!-- Right Column in RTL: Book Cover Showcase (Clean, no change-cover button) -->
        <div class="lg:col-span-4 flex flex-col">
          <div class="relative w-full h-full min-h-[290px] sm:min-h-[340px] rounded-xl overflow-hidden border border-[#d0c3ac] bg-[#dfd6c1] flex items-center justify-center group">
            <img
              src="${book.cover_url}"
              alt="${toPersianDigits(book.title)} — ${toPersianDigits(book.author)}"
              referrerpolicy="no-referrer"
              class="js-current-cover-img w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
        </div>

        <!-- Left Column in RTL: Book Details, Justified Short Description & Animated Progress -->
        <div class="lg:col-span-8 flex flex-col justify-between text-right space-y-6">
          <div class="space-y-3">
            <!-- Unboxed Metadata Kicker -->
            <div class="flex flex-wrap items-center gap-2 text-xs font-medium text-[#755f4b]">
              <span>${statusLabel}</span>
              <span aria-hidden="true">·</span>
              <span>ادبیات ${toPersianDigits(book.category)}</span>
              <span aria-hidden="true">·</span>
              <span class="tabular-nums">سال انتشار ${toPersianDigits(book.publication_year)}</span>
            </div>

            <div>
              <h3 class="text-[22px] sm:text-[28px] font-bold text-[#38281b] leading-[1.35]">
                ${toPersianDigits(book.title)}
              </h3>
              <div class="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#5f4d3d] mt-1">
                <span>نویسنده: ${toPersianDigits(book.author)}</span>
                <span aria-hidden="true">·</span>
                <span>ترجمه: ${toPersianDigits(book.translator)}</span>
                <span aria-hidden="true">·</span>
                <span class="tabular-nums">${toPersianDigits(book.pages_count)} صفحه</span>
              </div>
            </div>

            <p
              class="pt-2 text-[14.5px] sm:text-[15.5px] leading-[2.05] text-[#4e3e30] font-normal text-justify"
              style="text-align: justify; text-justify: inter-word;"
            >
              ${toPersianDigits(book.short_description)}
            </p>
          </div>

          <!-- Group Reading Progress & Next Session Info -->
          <div class="pt-5 border-t border-[#d6cbb7] space-y-3">
            <div class="flex items-center justify-between text-xs font-medium text-[#4a392b]">
              <span>${toPersianDigits(book.session_schedule)}</span>
              <span class="js-reading-progress-text tabular-nums font-bold text-[#38281b]">
                پیشرفت هم‌خوانی: ۰٪
              </span>
            </div>

            <div class="w-full h-2.5 bg-[#d5cab6] rounded-full overflow-hidden">
              <div
                class="js-reading-progress-bar h-full bg-[#3e2d1f] rounded-full"
                style="width: 0%;"
              ></div>
            </div>
          </div>
        </div>
      </div>
    `);

    $currentContainer.append($card);

    if (shouldAnimateNow || hasEnteredViewport) {
      animateProgressBar(book.reading_progress_percent);
    }
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
                alt="${toPersianDigits(book.title)} — ${toPersianDigits(book.author)}"
                referrerpolicy="no-referrer"
                class="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.03]"
              />
            </div>

            <!-- Unboxed Metadata -->
            <div class="space-y-1 text-right">
              <div class="flex items-center gap-1.5 text-[11.5px] text-[#755f4b]">
                <span>${toPersianDigits(book.author)}</span>
                <span aria-hidden="true">·</span>
                <span>ترجمه ${toPersianDigits(book.translator)}</span>
              </div>

              <h4 class="text-base font-bold text-[#38281b] leading-snug">
                ${toPersianDigits(book.title)}
              </h4>
            </div>

            <!-- Justified Short Description -->
            <p
              class="text-[13px] leading-[1.9] text-[#4e3e30] font-normal text-justify"
              style="text-align: justify; text-justify: inter-word;"
            >
              ${toPersianDigits(book.short_description)}
            </p>
          </div>

          <div class="pt-3 border-t border-[#d8ceba] flex items-center justify-between gap-2 text-xs">
            <span class="text-[#695645] tabular-nums">
              ${toPersianDigits(book.pages_count)} صفحه · چاپ ${toPersianDigits(book.publication_year)}
            </span>
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
        renderCurrentBook(activeBook, true);
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

  renderCurrentBook(activeBook, false);
  renderRecentBooksGrid();

  // Trigger progress bar motion graphic when section enters viewport
  const sectionEl = $section[0];
  if (sectionEl && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasEnteredViewport) {
            hasEnteredViewport = true;
            if (activeBook) {
              animateProgressBar(activeBook.reading_progress_percent);
            }
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(sectionEl);
  } else {
    hasEnteredViewport = true;
    window.setTimeout(() => {
      if (activeBook) {
        animateProgressBar(activeBook.reading_progress_percent);
      }
    }, 350);
  }

  return $section;
}
