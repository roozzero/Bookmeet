import $ from 'jquery';
import type { LibraryBook, MemberSession, UserComment } from '../types/models.ts';
import { toPersianDigits } from '../utils/persianNumbers.ts';

export interface EventSubSession {
  sessionNumber: string;
  title: string;
  date: string;
  time: string;
  pagesRange: string;
  status: 'برگزار شده' | 'نشست آتی';
}

export interface EventAudienceComment {
  id: number;
  authorName: string;
  authorRole: string;
  createdDate: string;
  rating: number;
  commentText: string;
  adminReply?: string;
}

export interface UpcomingEventCard {
  id: number;
  badge: string;
  category: string;
  publicationYear: number;
  title: string;
  bookTitle: string;
  bookOriginalTitle: string;
  bookAuthor: string;
  bookTranslator: string;
  bookPublisher: string;
  pagesCount: number;
  dateText: string;
  timeText: string;
  hostName: string;
  capacityText: string;
  locationLabel: string;
  coverUrl: string;
  summary: string;
  fullDescription: string[];
  bookIntroduction: string;
  sessionsList: EventSubSession[];
  comments: EventAudienceComment[];
}

export type ClubEventDetailItem = UpcomingEventCard;

export function mapSessionToEventCard(
  session: MemberSession,
  approvedComments: UserComment[] = []
): UpcomingEventCard {
  const translatorName = (session.translator || session.mentor_name || '').trim();
  const shortDesc = (session.short_description || '').trim();
  const fullDescRaw = (session.full_description || '').trim();
  const fullDescParagraphs = fullDescRaw
    ? fullDescRaw
        .split(/\n+/)
        .map((p) => p.trim())
        .filter(Boolean)
    : shortDesc
    ? [shortDesc]
    : [];

  const matchingComments: EventAudienceComment[] = approvedComments
    .filter(
      (c) =>
        c.status === 'تایید شده' &&
        (c.target_title === session.title || c.target_title === session.book_title)
    )
    .map((c) => ({
      id: c.id,
      authorName: c.author_name,
      authorRole: 'عضو باشگاه کتابخوانی',
      createdDate: c.created_date,
      rating: c.rating || 5,
      commentText: c.comment_text,
      adminReply: c.admin_reply || undefined,
    }));

  const mappedSubSessions: EventSubSession[] = (session.sub_sessions || []).map(
    (sub, idx) => ({
      sessionNumber: String(sub.session_number || `جلسه ${toPersianDigits(idx + 1)}`),
      title: String(sub.title || ''),
      date: String(sub.session_date || session.session_date || ''),
      time: String(sub.session_time || session.session_time || ''),
      pagesRange: String(sub.pages_to_read || ''),
      status: sub.status === 'برگزار شده' ? 'برگزار شده' : 'نشست آتی',
    })
  );

  return {
    id: session.id,
    badge: session.category || 'نشست هم‌خوانی',
    category: session.category || '',
    publicationYear: Number(session.publication_year || 0),
    title: session.title || session.book_title || '',
    bookTitle: session.book_title || session.title || '',
    bookOriginalTitle: '',
    bookAuthor: session.book_author || '',
    bookTranslator: translatorName,
    bookPublisher: session.publisher || '',
    pagesCount: Number(session.pages_count || 0),
    dateText: session.session_date || '',
    timeText: session.session_time || '',
    hostName: translatorName,
    capacityText: session.status === 'فعال' ? 'ظرفیت باز' : session.status,
    locationLabel: session.meeting_link_or_room || session.location_type || '',
    coverUrl: session.cover_url || '/assets/book-current.png',
    summary: shortDesc,
    fullDescription: fullDescParagraphs,
    bookIntroduction: fullDescRaw || shortDesc,
    sessionsList: mappedSubSessions,
    comments: matchingComments,
  };
}

export function buildEventFromLibraryBook(
  book: LibraryBook,
  approvedComments: UserComment[] = []
): UpcomingEventCard {
  const matchingComments: EventAudienceComment[] = approvedComments
    .filter((c) => c.status === 'تایید شده' && c.target_title === book.title)
    .map((c) => ({
      id: c.id,
      authorName: c.author_name,
      authorRole: 'عضو باشگاه کتابخوانی',
      createdDate: c.created_date,
      rating: c.rating || 5,
      commentText: c.comment_text,
      adminReply: c.admin_reply || undefined,
    }));

  return {
    id: 100 + book.id,
    badge: book.category || 'کتاب در حال مطالعه باشگاه',
    category: book.category || '',
    publicationYear: Number(book.publication_year || 0),
    title: book.title,
    bookTitle: book.title,
    bookOriginalTitle: book.original_title || '',
    bookAuthor: book.author || '',
    bookTranslator: book.translator || '',
    bookPublisher: '',
    pagesCount: Number(book.pages_count || 0),
    dateText: book.session_schedule || '',
    timeText: '',
    hostName: book.translator || '',
    capacityText: 'ظرفیت باز',
    locationLabel: '',
    coverUrl: book.cover_url || '/assets/book-current.png',
    summary: book.short_description || '',
    fullDescription: book.short_description ? [book.short_description] : [],
    bookIntroduction: book.short_description || '',
    sessionsList: [],
    comments: matchingComments,
  };
}

export const buildBookEventDetail = buildEventFromLibraryBook;

export interface LibrarySectionCallbacks {
  onOpenEventDetail?: (eventItem: UpcomingEventCard) => void;
  onRegisterEvent?: (eventItem: UpcomingEventCard) => void;
}

export function createLibrarySectionComponent(props: {
  libraryBooks: LibraryBook[];
  publicSessions?: MemberSession[];
  approvedComments?: UserComment[];
  onOpenEventDetail?: (eventItem: UpcomingEventCard) => void;
  onRegisterEvent?: (eventItem: UpcomingEventCard) => void;
}): JQuery {
  return createLibrarySection(
    props.libraryBooks,
    {
      onOpenEventDetail: props.onOpenEventDetail,
      onRegisterEvent: props.onRegisterEvent,
    },
    props.publicSessions || [],
    props.approvedComments || []
  );
}

export function createLibrarySection(
  books: LibraryBook[],
  callbacks?: LibrarySectionCallbacks,
  activeSessions: MemberSession[] = [],
  approvedComments: UserComment[] = []
): JQuery {
  const validActiveSessions = (activeSessions || []).filter(
    (s) => s.status !== 'غیرفعال'
  );
  const dynamicEvents: UpcomingEventCard[] = validActiveSessions.map((s) =>
    mapSessionToEventCard(s, approvedComments)
  );

  const primarySession = validActiveSessions[0];
  const currentBookFromLibrary =
    books.find((b) => Number(b.is_current) === 1) || books[0];

  const archiveBooks = books.filter((b) =>
    currentBookFromLibrary ? b.id !== currentBookFromLibrary.id : true
  );

  // Derive the "Current Reading Book" card from the primary active session if available,
  // or fall back to an active library book if one exists.
  const currentBookDisplay = primarySession
    ? {
        title: primarySession.book_title || primarySession.title,
        original_title: '',
        author: primarySession.book_author || '',
        translator: primarySession.translator || primarySession.mentor_name || '',
        category: primarySession.category || '',
        publication_year: Number(primarySession.publication_year || 0),
        pages_count: Number(primarySession.pages_count || 0),
        reading_progress_percent: 0,
        session_schedule: [primarySession.session_date, primarySession.session_time]
          .filter(Boolean)
          .join(' · '),
        cover_url: primarySession.cover_url || '/assets/book-current.png',
        short_description:
          primarySession.short_description || primarySession.full_description || '',
      }
    : currentBookFromLibrary || null;

  const currentBookEvent: UpcomingEventCard | null = primarySession
    ? mapSessionToEventCard(primarySession, approvedComments)
    : currentBookFromLibrary
    ? buildEventFromLibraryBook(currentBookFromLibrary, approvedComments)
    : null;

  const $section = $(`
    <section
      id="library"
      aria-label="کتابخانه باشگاه و آثار منتخب"
      class="relative w-full bg-[#F6EFE4] text-[#221811] py-20 sm:py-28 lg:py-32 px-5 sm:px-10 lg:px-20 border-t border-[#E6D9C6]"
    >
      <div class="max-w-7xl mx-auto">
        <!-- Section Header -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div>
            <h2 class="font-display text-[28px] sm:text-[36px] lg:text-[42px] font-bold leading-[1.3] text-[#1E150F] text-justify">
              قفسه کتاب‌های خوانده‌شده و کتابِ در حال مطالعه
            </h2>
          </div>

          <!-- Category Filter Tabs -->
          <div class="flex flex-wrap items-center gap-2 self-start md:self-end" role="tablist" aria-label="فیلتر دسته‌بندی کتاب‌ها">
            <button
              type="button"
              data-filter="all"
              class="js-lib-filter px-4 py-2 rounded-xl text-[13px] font-semibold transition-all cursor-pointer bg-[#5A3A22] text-[#FAF5EC] shadow-xs"
            >
              همه آثار (${toPersianDigits(archiveBooks.length)})
            </button>
            <button
              type="button"
              data-filter="کلاسیک"
              class="js-lib-filter px-4 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer bg-[#EFE5D6] text-[#4E3B2B] hover:bg-[#E5D7C3]"
            >
              ادبیات کلاسیک
            </button>
            <button
              type="button"
              data-filter="معاصر"
              class="js-lib-filter px-4 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer bg-[#EFE5D6] text-[#4E3B2B] hover:bg-[#E5D7C3]"
            >
              ادبیات معاصر
            </button>
          </div>
        </div>

        <!-- Current Reading Book Showcase (Connected to #events navigation) -->
        ${
          currentBookDisplay
            ? `
          <div id="events" class="mb-14 sm:mb-16 rounded-3xl bg-[#EFE4D3] border border-[#DECBB2] p-6 sm:p-8 lg:p-10 shadow-[0_20px_50px_rgba(45,30,18,0.08)] scroll-mt-24">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              <!-- Book Cover -->
              <div class="lg:col-span-4 xl:col-span-3">
                <div class="relative mx-auto max-w-[240px] lg:max-w-none aspect-[3/4] rounded-2xl overflow-hidden shadow-[0_18px_40px_rgba(30,18,10,0.22)] border border-[#D4BEA2] bg-[#2D1F14]">
                  <img
                    src="${currentBookDisplay.cover_url}"
                    alt="${currentBookDisplay.title}"
                    class="w-full h-full object-cover"
                  />
                  <div class="absolute top-3 right-3 px-3 py-1 rounded-lg bg-[#1F150E]/85 backdrop-blur-md text-[#F5E6D3] text-[11.5px] font-semibold border border-[#C69B6D]/40">
                    در حال هم‌خوانی
                  </div>
                </div>
              </div>

              <!-- Book Details & Progress -->
              <div class="lg:col-span-8 xl:col-span-9 space-y-5">
                <div class="flex flex-wrap items-center gap-2.5 text-[12.5px] text-[#7A5130] font-semibold">
                  ${
                    currentBookDisplay.category
                      ? `<span class="px-3 py-1 rounded-lg bg-[#F8F2E8] border border-[#DFCBB0]">
                          ${toPersianDigits(currentBookDisplay.category)}
                        </span>`
                      : ''
                  }
                  ${
                    currentBookDisplay.publication_year
                      ? `<span>•</span><span>انتشار: ${toPersianDigits(currentBookDisplay.publication_year)}</span>`
                      : ''
                  }
                  ${
                    currentBookDisplay.pages_count
                      ? `<span>•</span><span>${toPersianDigits(currentBookDisplay.pages_count)} صفحه</span>`
                      : ''
                  }
                </div>

                <div>
                  <h3 class="font-display text-[24px] sm:text-[30px] font-bold text-[#1E150F] leading-snug text-justify">
                    ${toPersianDigits(currentBookDisplay.title)}
                  </h3>
                  <p class="text-[14px] sm:text-[15px] text-[#5C4738] mt-1 font-medium text-justify">
                    ${
                      currentBookDisplay.author
                        ? `نوشتهٔ ${toPersianDigits(currentBookDisplay.author)}`
                        : ''
                    }${
                currentBookDisplay.author && currentBookDisplay.translator ? ' · ' : ''
              }${
                currentBookDisplay.translator
                  ? `ترجمهٔ ${toPersianDigits(currentBookDisplay.translator)}`
                  : ''
              }
                  </p>
                </div>

                ${
                  currentBookDisplay.short_description
                    ? `<p class="text-[15px] sm:text-[16px] leading-[1.95] text-[#3B2C22] text-justify">
                        ${toPersianDigits(currentBookDisplay.short_description)}
                      </p>`
                    : ''
                }

                <!-- Schedule & Actions Row -->
                <div class="pt-3 border-t border-[#DCC8AE] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div class="flex items-center gap-2 text-[13px] text-[#4B382A]">
                    <span class="w-2 h-2 rounded-full bg-[#3B7A57]"></span>
                    <span>${
                      currentBookDisplay.session_schedule
                        ? toPersianDigits(currentBookDisplay.session_schedule)
                        : 'برنامه جلسات در جزئیات دوره'
                    }</span>
                  </div>

                  <div class="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      class="js-current-book-details px-4 py-2.5 rounded-xl bg-[#FAF5EC] hover:bg-[#EFE2CE] text-[#3F2E21] border border-[#D5C0A5] text-[12.5px] font-semibold transition-colors cursor-pointer"
                    >
                      مشاهده جزئیات
                    </button>
                    <button
                      type="button"
                      class="js-current-book-register px-5 py-2.5 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[12.5px] font-semibold transition-colors shadow-xs cursor-pointer"
                    >
                      ثبت نام در این نشست
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `
            : `
          <div id="events" class="mb-14 sm:mb-16 rounded-3xl bg-[#EFE4D3] border border-[#DECBB2] p-8 sm:p-10 text-center scroll-mt-24">
            <h3 class="font-display text-[20px] sm:text-[24px] font-bold text-[#1E150F]">
              در حال حاضر دوره هم‌خوانی فعالی ثبت نشده است
            </h3>
            <p class="text-[14px] text-[#5C4738] mt-2">
              به محض تعریف دوره هم‌خوانی جدید توسط مدیریت باشگاه، مشخصات کتاب و برنامه جلسات در این بخش نمایش داده می‌شود.
            </p>
          </div>
        `
        }

        <!-- Upcoming Events Subsection -->
        <div class="mb-16 sm:mb-20">
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div class="inline-flex items-center gap-2 mb-2">
                <span class="w-2 h-2 rounded-full bg-[#7A4B2A]"></span>
                <span class="text-[12.5px] font-semibold text-[#7A4B2A]">برنامه نشست‌های حضوری و آنلاین</span>
              </div>
              <h3 class="font-display text-[22px] sm:text-[28px] font-bold text-[#1E150F] text-justify">
                رویدادهای پیش رو در باشگاه بوک‌میت
              </h3>
            </div>
            <p class="text-[13.5px] text-[#5E493A] text-justify">
              نشست‌های فعال ثبت‌شده در باشگاه کتابخوانی
            </p>
          </div>

          ${
            dynamicEvents.length > 0
              ? `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7">
              ${dynamicEvents
                .map(
                  (ev) => `
                <article class="rounded-2xl bg-[#FAF5EC] border border-[#E4D6C3] p-6 flex flex-col justify-between shadow-[0_10px_28px_rgba(45,30,18,0.05)] hover:border-[#C5A480] transition-all duration-300">
                  <div class="space-y-4">
                    <div class="flex items-center justify-between gap-2">
                      ${
                        ev.badge
                          ? `<span class="px-3 py-1 rounded-lg bg-[#EFE2CE] text-[#5A3A22] text-[11.5px] font-bold">
                              ${toPersianDigits(ev.badge)}
                            </span>`
                          : '<span></span>'
                      }
                      <span class="text-[11.5px] font-semibold text-[#235332] bg-[#E4F2E7] px-2.5 py-1 rounded-md">
                        ${toPersianDigits(ev.capacityText)}
                      </span>
                    </div>

                    <h4 class="font-display text-[18px] sm:text-[19px] font-bold text-[#20160F] leading-[1.6] text-justify">
                      ${toPersianDigits(ev.title)}
                    </h4>

                    ${
                      ev.summary
                        ? `<p class="text-[13.5px] leading-[1.85] text-[#524033] text-justify">
                            ${toPersianDigits(ev.summary)}
                          </p>`
                        : ''
                    }
                  </div>

                  <div class="pt-4 mt-5 border-t border-[#E8DAC6] space-y-3">
                    <div class="space-y-1.5 text-[12.5px] text-[#4E3B2D]">
                      ${
                        ev.dateText
                          ? `<div class="flex items-center justify-between">
                              <span class="text-[#786150]">زمان برگزاری:</span>
                              <strong class="text-[#231912]">${toPersianDigits(ev.dateText)}</strong>
                            </div>`
                          : ''
                      }
                      ${
                        ev.timeText
                          ? `<div class="flex items-center justify-between">
                              <span class="text-[#786150]">ساعت نشست:</span>
                              <strong class="text-[#231912]">${toPersianDigits(ev.timeText)}</strong>
                            </div>`
                          : ''
                      }
                      ${
                        ev.hostName
                          ? `<div class="flex items-center justify-between">
                              <span class="text-[#786150]">مترجم:</span>
                              <strong class="text-[#231912]">${toPersianDigits(ev.hostName)}</strong>
                            </div>`
                          : ''
                      }
                    </div>

                    <!-- Event Action Buttons -->
                    <div class="pt-3 border-t border-[#E8DAC6] grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        data-event-details="${ev.id}"
                        class="js-event-view-details py-2.5 px-3 rounded-xl bg-[#F3E7D6] hover:bg-[#E5D4BC] text-[#3F2E21] text-[12px] font-semibold transition-colors text-center cursor-pointer"
                      >
                        مشاهده جزئیات
                      </button>
                      <button
                        type="button"
                        data-event-register="${ev.id}"
                        class="js-event-register-btn py-2.5 px-3 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[12px] font-semibold transition-colors text-center shadow-xs cursor-pointer"
                      >
                        ثبت نام
                      </button>
                    </div>
                  </div>
                </article>
              `
                )
                .join('')}
            </div>
          `
              : `
            <div class="rounded-2xl bg-[#FAF5EC] border border-[#E4D6C3] p-8 text-center">
              <p class="text-[14px] text-[#5E493A] font-medium">
                در حال حاضر رویداد فعالی برای نمایش وجود ندارد.
              </p>
            </div>
          `
          }
        </div>

        <!-- Archive Grid -->
        ${
          archiveBooks.length > 0
            ? `
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7 js-library-grid">
            ${archiveBooks
              .map(
                (book) => `
              <article
                data-category="${book.category}"
                class="js-library-card group rounded-2xl bg-[#FAF5EC] border border-[#E4D6C3] overflow-hidden shadow-[0_10px_28px_rgba(45,30,18,0.05)] hover:shadow-[0_18px_38px_rgba(45,30,18,0.11)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <!-- Cover Container -->
                  <div class="relative aspect-[4/4.6] overflow-hidden bg-[#E5D7C3]">
                    <img
                      src="${book.cover_url}"
                      alt="${book.title}"
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    ${
                      book.category
                        ? `<div class="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-[#1F150E]/80 backdrop-blur-xs text-[#F5E9DA] text-[11px] font-medium">
                            ${toPersianDigits(book.category)}
                          </div>`
                        : ''
                    }
                  </div>

                  <!-- Content -->
                  <div class="p-5">
                    <h4 class="font-display text-[19px] font-bold text-[#1F1610] leading-snug text-justify">
                      ${toPersianDigits(book.title)}
                    </h4>
                    <p class="text-[12.5px] text-[#6E5746] mt-1 font-medium text-justify">
                      ${toPersianDigits(book.author)}${
                  book.translator ? ` · ترجمهٔ ${toPersianDigits(book.translator)}` : ''
                }
                    </p>
                    ${
                      book.short_description
                        ? `<p class="text-[13.5px] leading-[1.85] text-[#423226] mt-3 line-clamp-3 text-justify">
                            ${toPersianDigits(book.short_description)}
                          </p>`
                        : ''
                    }
                  </div>
                </div>

                <!-- Card Footer -->
                <div class="px-5 py-3.5 bg-[#F2E8D9]/70 border-t border-[#E6D8C4] flex items-center justify-between text-[12px] text-[#5B4637]">
                  <span>${book.pages_count ? `${toPersianDigits(book.pages_count)} صفحه` : ''}</span>
                  <span class="font-medium text-[#7A4B2A]">${toPersianDigits(book.session_schedule)}</span>
                </div>
              </article>
            `
              )
              .join('')}
          </div>
        `
            : `
          <div class="rounded-2xl bg-[#FAF5EC] border border-[#E4D6C3] p-8 text-center">
            <p class="text-[14px] text-[#5E493A]">
              هنوز کتابی در آرشیو کتابخانه ثبت نشده است.
            </p>
          </div>
        `
        }
      </div>
    </section>
  `);

  // Interactive Category Filtering
  $section.on('click', '.js-lib-filter', function () {
    const selectedCategory = String($(this).data('filter'));

    $section
      .find('.js-lib-filter')
      .removeClass('bg-[#5A3A22] text-[#FAF5EC] shadow-xs font-semibold')
      .addClass('bg-[#EFE5D6] text-[#4E3B2B] font-medium');

    $(this)
      .removeClass('bg-[#EFE5D6] text-[#4E3B2B] font-medium')
      .addClass('bg-[#5A3A22] text-[#FAF5EC] shadow-xs font-semibold');

    const $cards = $section.find('.js-library-card');
    $cards.each(function () {
      const cardCategory = String($(this).data('category'));
      if (selectedCategory === 'all' || cardCategory === selectedCategory) {
        $(this).stop(true, true).fadeIn(220);
      } else {
        $(this).stop(true, true).fadeOut(160);
      }
    });
  });

  // Current Reading Book handlers
  $section.on('click', '.js-current-book-details', function () {
    if (currentBookEvent && callbacks?.onOpenEventDetail) {
      callbacks.onOpenEventDetail(currentBookEvent);
    }
  });

  $section.on('click', '.js-current-book-register', function () {
    if (currentBookEvent && callbacks?.onRegisterEvent) {
      callbacks.onRegisterEvent(currentBookEvent);
    }
  });

  // Upcoming Events cards handlers
  $section.on('click', '.js-event-view-details', function () {
    const id = Number($(this).data('event-details'));
    const found = dynamicEvents.find((e) => e.id === id);
    if (found && callbacks?.onOpenEventDetail) {
      callbacks.onOpenEventDetail(found);
    }
  });

  $section.on('click', '.js-event-register-btn', function () {
    const id = Number($(this).data('event-register'));
    const found = dynamicEvents.find((e) => e.id === id);
    if (found && callbacks?.onRegisterEvent) {
      callbacks.onRegisterEvent(found);
    }
  });

  return $section;
}
