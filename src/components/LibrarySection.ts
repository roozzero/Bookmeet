import $ from 'jquery';
import { ApiService } from '../services/api.ts';
import type { ClubMember, LibraryBook, MemberSession, UserComment } from '../types/models.ts';
import { formatPersianDateDisplay, toPersianDigits } from '../utils/persianNumbers.ts';

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
        c.target_type !== 'کتاب کتابخانه' &&
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
      date: formatPersianDateDisplay(sub.session_date || session.session_date || ''),
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
    dateText: formatPersianDateDisplay(session.session_date || ''),
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

export interface LibrarySectionCallbacks {
  onOpenEventDetail?: (eventItem: UpcomingEventCard) => void;
  onRegisterEvent?: (eventItem: UpcomingEventCard) => void;
  onOpenBookDetail?: (book: LibraryBook) => void;
}

export function createLibrarySectionComponent(props: {
  libraryBooks: LibraryBook[];
  libraryCategories?: Array<{ id: number; name: string }>;
  publicSessions?: MemberSession[];
  approvedComments?: UserComment[];
  onOpenEventDetail?: (eventItem: UpcomingEventCard) => void;
  onRegisterEvent?: (eventItem: UpcomingEventCard) => void;
  onOpenBookDetail?: (book: LibraryBook) => void;
}): JQuery {
  return createLibrarySection(
    props.libraryBooks,
    {
      onOpenEventDetail: props.onOpenEventDetail,
      onRegisterEvent: props.onRegisterEvent,
      onOpenBookDetail: props.onOpenBookDetail,
    },
    props.publicSessions || [],
    props.approvedComments || [],
    props.libraryCategories || []
  );
}

export function createLibrarySection(
  books: LibraryBook[],
  callbacks?: LibrarySectionCallbacks,
  activeSessions: MemberSession[] = [],
  approvedComments: UserComment[] = [],
  libraryCategories: Array<{ id: number; name: string }> = []
): JQuery {
  const validActiveSessions = (activeSessions || []).filter(
    (s) => s.status !== 'غیرفعال' && s.status !== 'برگزارشده' && s.status !== 'برگزار شده'
  );
  const dynamicEvents: UpcomingEventCard[] = validActiveSessions.map((s) =>
    mapSessionToEventCard(s, approvedComments)
  );

  const primarySession = validActiveSessions[0];

  // All actual books stored in MySQL library_books table (completely independent from sessions/events)
  const allLibraryBooks: LibraryBook[] = Array.isArray(books) ? books : [];

  // Dynamic categories from MySQL library_categories and actual books
  const categoryNames = Array.from(
    new Set([
      ...(libraryCategories || []).map((c) => String(c.name || '').trim()).filter(Boolean),
      ...allLibraryBooks.map((b) => String(b.category || '').trim()).filter(Boolean),
    ])
  );

  // Derive the "Current Reading Book" card exclusively from active reading sessions (member_sessions)
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
        session_schedule: [
          formatPersianDateDisplay(primarySession.session_date),
          primarySession.session_time,
        ]
          .filter(Boolean)
          .join(' · '),
        cover_url: primarySession.cover_url || '/assets/book-current.png',
        short_description:
          primarySession.short_description || primarySession.full_description || '',
      }
    : null;

  const currentBookEvent: UpcomingEventCard | null = primarySession
    ? mapSessionToEventCard(primarySession, approvedComments)
    : null;

  const $section = $(`
    <section
      aria-label="رویدادها و کتابخانه باشگاه"
      class="relative w-full bg-[#F6EFE4] text-[#221811] py-20 sm:py-28 lg:py-32 px-5 sm:px-10 lg:px-20 border-t border-[#E6D9C6]"
    >
      <div class="max-w-7xl mx-auto">
        <!-- Events & Current Reading Showcase (Connected to #events navigation) -->
        <div id="events" class="scroll-mt-24">
          <div class="mb-8 sm:mb-12">
            <h2 class="font-display text-[19px] sm:text-[32px] lg:text-[40px] font-bold leading-[1.45] sm:leading-[1.3] text-[#1E150F] text-right sm:text-justify">
              کتابِ در حال هم‌خوانی و نشست‌های پیشِ رو
            </h2>
          </div>

          ${
            currentBookDisplay
              ? `
            <div class="mb-14 sm:mb-16 rounded-3xl bg-[#EFE4D3] border border-[#DECBB2] p-6 sm:p-8 lg:p-10 shadow-[0_20px_50px_rgba(45,30,18,0.08)]">
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
                  <div class="flex flex-wrap items-center gap-2.5 text-[13px] text-[#7A5130] font-semibold">
                    ${
                      currentBookDisplay.category
                        ? `<span class="text-[#7A5130] font-bold">${toPersianDigits(currentBookDisplay.category)}</span>`
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
                    <h3 class="font-display text-[19px] sm:text-[30px] font-bold text-[#1E150F] leading-snug text-right sm:text-justify break-words">
                      ${toPersianDigits(currentBookDisplay.title)}
                    </h3>
                    <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13.5px] sm:text-[15px] text-[#5C4738] font-medium">
                      ${
                        currentBookDisplay.author
                          ? `<span class="inline-flex items-center gap-1">نوشتهٔ <strong class="font-semibold text-[#2B1C12]">${toPersianDigits(currentBookDisplay.author)}</strong></span>`
                          : ''
                      }
                      ${
                        currentBookDisplay.author && currentBookDisplay.translator
                          ? `<span class="text-[#C5B198] select-none">|</span>`
                          : ''
                      }
                      ${
                        currentBookDisplay.translator
                          ? `<span class="inline-flex items-center gap-1">ترجمهٔ <strong class="font-semibold text-[#2B1C12]">${toPersianDigits(currentBookDisplay.translator)}</strong></span>`
                          : ''
                      }
                    </div>
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

                    <div class="grid grid-cols-2 sm:flex items-center gap-2.5 w-full sm:w-auto">
                      <button
                        type="button"
                        class="js-current-book-details w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#FAF5EC] hover:bg-[#EFE2CE] text-[#3F2E21] border border-[#D5C0A5] text-[12.5px] font-semibold transition-colors text-center justify-center inline-flex items-center cursor-pointer"
                      >
                        مشاهده جزئیات
                      </button>
                      <button
                        type="button"
                        class="js-current-book-register w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[12.5px] font-semibold transition-colors shadow-xs text-center justify-center inline-flex items-center cursor-pointer"
                      >
                        ثبت نام نشست
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `
              : `
            <div class="mb-14 sm:mb-16 rounded-3xl bg-[#EFE4D3] border border-[#DECBB2] p-8 sm:p-10 text-center">
              <h3 class="font-display text-[20px] sm:text-[24px] font-bold text-[#1E150F]">
                در حال حاضر دوره هم‌خوانی فعالی ثبت نشده است
              </h3>
              <p class="text-[14px] text-[#5C4738] mt-2 !text-center text-center mx-auto">
                به محض تعریف دوره هم‌خوانی جدید توسط مدیریت باشگاه، مشخصات کتاب و برنامه جلسات در این بخش نمایش داده می‌شود.
              </p>
            </div>
          `
          }

          <!-- Upcoming Events Subsection -->
          <div class="mb-20 sm:mb-24">
            <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <div class="inline-flex items-center gap-2 mb-2">
                  <span class="w-2 h-2 rounded-full bg-[#7A4B2A]"></span>
                  <span class="text-[12.5px] font-semibold text-[#7A4B2A]">برنامه نشست‌های حضوری و آنلاین</span>
                </div>
                <h3 class="font-display text-[22px] sm:text-[28px] font-bold text-[#1E150F] text-justify">
                  رویدادهای پیش رو در باشگاه کتابوشکا
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
                    <div class="space-y-3.5">
                      <div class="flex items-center justify-between gap-2">
                        ${
                          ev.badge
                            ? `<span class="text-[12.5px] font-bold text-[#7A4B2A]">
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
                <p class="text-[14px] text-[#5E493A] font-medium !text-center text-center mx-auto">
                  در حال حاضر رویداد فعالی برای نمایش وجود ندارد.
                </p>
              </div>
            `
            }
          </div>
        </div>

        <!-- Library Books Section (Directly connected to #library navigation) -->
        <div id="library" class="pt-12 border-t border-[#E2D3BF] scroll-mt-24">
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-12">
            <div>
              <div class="inline-flex items-center gap-2 mb-2">
                <span class="w-2 h-2 rounded-full bg-[#7A4B2A]"></span>
                <span class="text-[12.5px] font-semibold text-[#7A4B2A]">کتابخانه باشگاه کتابوشکا</span>
              </div>
              <h2 class="font-display text-[26px] sm:text-[34px] font-bold leading-[1.3] text-[#1E150F] text-justify">
                قفسه کتاب‌های باشگاه
              </h2>
            </div>

            <!-- Dynamic Category Filter Tabs -->
            <div class="flex flex-wrap items-center gap-2 self-start md:self-end" role="tablist" aria-label="فیلتر دسته‌بندی کتاب‌ها">
              <button
                type="button"
                data-filter="all"
                class="js-lib-filter px-4 py-2 rounded-xl text-[13px] font-semibold transition-all cursor-pointer bg-[#5A3A22] text-[#FAF5EC] shadow-xs"
              >
                همه کتاب‌ها (${toPersianDigits(allLibraryBooks.length)})
              </button>
              ${categoryNames
                .map(
                  (cat) => `
                <button
                  type="button"
                  data-filter="${cat}"
                  class="js-lib-filter px-4 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer bg-[#EFE5D6] text-[#4E3B2B] hover:bg-[#E5D7C3]"
                >
                  ${toPersianDigits(cat)}
                </button>
              `
                )
                .join('')}
            </div>
          </div>

          ${
            allLibraryBooks.length > 0
              ? `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7 js-library-grid">
              ${allLibraryBooks
                .map((book) => {
                  return `
                    <article
                      data-category="${book.category || ''}"
                      data-book-id="${book.id}"
                      class="js-library-card js-open-library-book-detail group rounded-2xl bg-[#FAF5EC] border border-[#E4D6C3] overflow-hidden shadow-[0_10px_28px_rgba(45,30,18,0.05)] hover:shadow-[0_18px_38px_rgba(45,30,18,0.11)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                    >
                      <div>
                        <!-- Cover Container -->
                        <div class="relative aspect-[4/4.6] overflow-hidden bg-[#E5D7C3]">
                          ${
                            book.cover_url
                              ? `<img
                                  src="${book.cover_url}"
                                  alt="${book.title}"
                                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  loading="lazy"
                                />`
                              : `<div class="w-full h-full flex items-center justify-center text-[13px] font-semibold text-[#6B5444]">بدون تصویر کاور</div>`
                          }
                        </div>

                        <!-- Content -->
                        <div class="p-5">
                          ${
                            book.category
                              ? `<div class="text-[12px] font-bold text-[#7A4B2A] mb-1">
                                  ${toPersianDigits(book.category)}
                                </div>`
                              : ''
                          }
                          <h4 class="font-display text-[19px] font-bold text-[#1F1610] leading-snug text-justify group-hover:text-[#7A4B2A] transition-colors">
                            ${toPersianDigits(book.title)}
                          </h4>
                          ${
                            book.author || book.translator
                              ? `<p class="text-[12.5px] text-[#6E5746] mt-1 font-medium text-justify">
                                  ${book.author ? toPersianDigits(book.author) : ''}${
                                  book.author && book.translator ? ' · ' : ''
                                }${book.translator ? `ترجمهٔ ${toPersianDigits(book.translator)}` : ''}
                                </p>`
                              : ''
                          }
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
                        <span class="font-semibold text-[#5A3A22] group-hover:text-[#231912] transition-colors">
                          مشاهده جزئیات کتاب ←
                        </span>
                        ${
                          book.pages_count
                            ? `<span>${toPersianDigits(book.pages_count)} صفحه</span>`
                            : ''
                        }
                      </div>
                    </article>
                  `;
                })
                .join('')}
            </div>
          `
              : `
            <div class="rounded-2xl bg-[#FAF5EC] border border-[#E4D6C3] p-10 text-center">
              <p class="text-[14px] text-[#5E493A] !text-center text-center mx-auto">
                هنوز کتابی در کتابخانه باشگاه ثبت نشده است.
              </p>
            </div>
          `
          }
        </div>
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

  // Open Library Book Detail Page
  $section.on('click', '.js-open-library-book-detail', function () {
    const bookId = Number($(this).data('book-id'));
    const found = allLibraryBooks.find((b) => Number(b.id) === bookId);
    if (found && callbacks?.onOpenBookDetail) {
      callbacks.onOpenBookDetail(found);
    }
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

export function parseNotesToBulletItems(rawNotes?: string): string[] {
  if (!rawNotes) return [];
  return String(rawNotes)
    .split(/\r?\n|•/)
    .map((line) => line.replace(/^[\s\-*•●▪▫–—]+/, '').trim())
    .filter(Boolean);
}

export function createLibraryBookDetailPageComponent(props: {
  book: LibraryBook;
  approvedComments?: UserComment[];
  currentMember?: ClubMember | null;
  onBack: () => void;
}): JQuery {
  const { book, approvedComments = [], currentMember = null } = props;

  const tagsList = String(book.tags || '')
    .split(/[،,]/)
    .map((t) => t.trim())
    .filter(Boolean);

  const noteItems = parseNotesToBulletItems(book.notes);

  const bookComments = approvedComments.filter(
    (c) =>
      c.status === 'تایید شده' &&
      (c.target_type === 'کتاب کتابخانه' || c.target_type === 'کتاب') &&
      String(c.target_title || '').trim() === String(book.title || '').trim()
  );

  const specItems: Array<{ label: string; value: string }> = [
    { label: 'نام نویسنده', value: book.author ? toPersianDigits(book.author) : '—' },
    { label: 'مترجم', value: book.translator ? toPersianDigits(book.translator) : '—' },
    { label: 'نام ناشر', value: book.publisher ? toPersianDigits(book.publisher) : '—' },
    {
      label: 'سال انتشار',
      value:
        book.publication_year && Number(book.publication_year) > 0
          ? toPersianDigits(book.publication_year)
          : '—',
    },
    {
      label: 'نوبت چاپ',
      value: book.edition_number ? toPersianDigits(book.edition_number) : '—',
    },
    {
      label: 'تعداد صفحات',
      value:
        book.pages_count && Number(book.pages_count) > 0
          ? `${toPersianDigits(book.pages_count)} صفحه`
          : '—',
    },
    { label: 'دسته‌بندی', value: book.category ? toPersianDigits(book.category) : '—' },
  ];

  const $page = $(`
    <section
      dir="rtl"
      aria-label="جزئیات کتاب در کتابخانه باشگاه"
      class="relative w-full bg-[#F6EFE4] text-[#221811] py-10 sm:py-14 px-5 sm:px-10 lg:px-20"
    >
      <div class="max-w-5xl mx-auto space-y-8">
        <!-- Back Button -->
        <div>
          <button
            type="button"
            class="js-back-to-library inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#EFE4D3] hover:bg-[#E4D4BE] text-[#3F2E21] text-[13px] font-semibold transition-colors cursor-pointer"
          >
            <span>→</span>
            <span>بازگشت به کتابخانه باشگاه</span>
          </button>
        </div>

        <!-- 1. Book Cover and Main Information + 2. Book Specifications -->
        <div class="rounded-3xl bg-[#FAF5EC] border border-[#E4D6C3] p-6 sm:p-8 lg:p-10 shadow-[0_20px_50px_rgba(45,30,18,0.06)] space-y-8">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div class="md:col-span-4">
              <div class="mx-auto max-w-[240px] md:max-w-none aspect-[3/4] rounded-2xl overflow-hidden border border-[#D4BEA2] bg-[#EFE3D2] shadow-[0_14px_34px_rgba(30,18,10,0.16)]">
                ${
                  book.cover_url
                    ? `<img src="${book.cover_url}" alt="${book.title}" class="w-full h-full object-cover" />`
                    : `<div class="w-full h-full flex items-center justify-center text-[13px] font-semibold text-[#6B5444]">بدون تصویر کاور</div>`
                }
              </div>
            </div>

            <div class="md:col-span-8 space-y-6">
              ${
                book.category
                  ? `<div>
                      <span class="inline-block px-3.5 py-1 rounded-xl bg-[#EFE3D2] border border-[#DECBB2] text-[#7A4B2A] text-[12.5px] font-bold">
                        دسته‌بندی: ${toPersianDigits(book.category)}
                      </span>
                    </div>`
                  : ''
              }

              <div>
                <h1 class="font-display text-[26px] sm:text-[34px] font-bold text-[#1E150F] leading-snug text-justify">
                  ${toPersianDigits(book.title)}
                </h1>
                ${
                  book.author || book.translator
                    ? `<p class="text-[14.5px] text-[#5C4738] mt-1.5 font-medium text-justify">
                        ${book.author ? `نویسنده: ${toPersianDigits(book.author)}` : ''}${
                        book.author && book.translator ? ' · ' : ''
                      }${book.translator ? `مترجم: ${toPersianDigits(book.translator)}` : ''}
                      </p>`
                    : ''
                }
              </div>

              <!-- 2. Book Specifications Grid -->
              <div class="rounded-2xl bg-[#F3E9DA]/85 border border-[#E2D2BC] p-4 sm:p-5 space-y-3">
                <h2 class="font-display text-[16px] font-bold text-[#231912]">مشخصات کتاب</h2>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  ${specItems
                    .map(
                      (spec) => `
                    <div class="rounded-xl bg-[#FAF5EC] border border-[#E4D6C3] px-3.5 py-2.5">
                      <span class="block text-[11.5px] text-[#7A6452] font-medium">${spec.label}</span>
                      <strong class="block text-[13.5px] text-[#1E150F] font-bold mt-0.5">${spec.value}</strong>
                    </div>
                  `
                    )
                    .join('')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Book Description and Summary -->
        ${
          book.short_description || book.description
            ? `
          <div class="rounded-2xl bg-[#FAF5EC] border border-[#E4D6C3] p-6 sm:p-8 space-y-6">
            ${
              book.short_description
                ? `
              <div class="space-y-2.5">
                <h2 class="font-display text-[20px] font-bold text-[#1E150F]">خلاصه کتاب</h2>
                <div class="text-[15px] leading-[2] text-[#3B2C22] whitespace-pre-line text-justify">
                  ${toPersianDigits(book.short_description)}
                </div>
              </div>
            `
                : ''
            }
            ${
              book.short_description && book.description
                ? `<div class="border-t border-[#E6D8C4]"></div>`
                : ''
            }
            ${
              book.description
                ? `
              <div class="space-y-2.5">
                <h2 class="font-display text-[20px] font-bold text-[#1E150F]">توضیحات</h2>
                <div class="text-[15px] leading-[2] text-[#3B2C22] whitespace-pre-line text-justify">
                  ${toPersianDigits(book.description)}
                </div>
              </div>
            `
                : ''
            }
          </div>
        `
            : ''
        }

        <!-- 4. Memorable Quote -->
        ${
          book.memorable_quote
            ? `
          <div class="rounded-2xl bg-[#EFE4D3] border-r-4 border-[#7A4B2A] p-6 sm:p-8 shadow-[0_10px_28px_rgba(45,30,18,0.04)] space-y-2">
            <h2 class="font-display text-[17px] font-bold text-[#7A4B2A]">جمله‌ای که به یادگار ماند</h2>
            <blockquote class="font-display text-[16px] sm:text-[18px] italic text-[#1E150F] leading-[1.95] whitespace-pre-line text-justify">
              «${toPersianDigits(book.memorable_quote)}»
            </blockquote>
          </div>
        `
            : ''
        }

        <!-- 5. Recommended Audience -->
        ${
          book.recommended_for
            ? `
          <div class="rounded-2xl bg-[#FAF5EC] border border-[#E4D6C3] p-6 sm:p-8 space-y-3">
            <h2 class="font-display text-[20px] font-bold text-[#1E150F]">به چه کسانی توصیه می‌شود</h2>
            <div class="text-[15px] leading-[2] text-[#3B2C22] whitespace-pre-line text-justify">
              ${toPersianDigits(book.recommended_for)}
            </div>
          </div>
        `
            : ''
        }

        <!-- 6. Notes and Remarks (Displayed with Circular Bullets) -->
        ${
          noteItems.length > 0
            ? `
          <div class="rounded-2xl bg-[#FAF5EC] border border-[#E4D6C3] p-6 sm:p-8 space-y-4">
            <h2 class="font-display text-[20px] font-bold text-[#1E150F]">نکات و یادداشت‌ها</h2>
            <ul class="space-y-3 pr-1">
              ${noteItems
                .map(
                  (item) => `
                <li class="flex items-start gap-3 text-[15px] leading-[2] text-[#3B2C22] text-justify">
                  <span class="w-2.5 h-2.5 rounded-full bg-[#7A4B2A] shrink-0 mt-3"></span>
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

        <!-- 7. Tags Below Notes and Remarks -->
        ${
          tagsList.length > 0
            ? `
          <div class="rounded-2xl bg-[#FAF5EC] border border-[#E4D6C3] p-6 sm:p-7 space-y-3">
            <h2 class="font-display text-[17px] font-bold text-[#1E150F]">برچسب‌های کتاب</h2>
            <div class="flex flex-wrap gap-2">
              ${tagsList
                .map(
                  (tag) =>
                    `<span class="px-3.5 py-1.5 rounded-xl bg-[#EFE3D2] border border-[#D8C4AA] text-[#4E3B2D] text-[12.5px] font-semibold">#${toPersianDigits(tag)}</span>`
                )
                .join('')}
            </div>
          </div>
        `
            : ''
        }

        <!-- 8. User Comments Section -->
        <div class="rounded-2xl bg-[#FAF5EC] border border-[#E4D6C3] p-6 sm:p-8 space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E6D8C4] pb-4">
            <div>
              <h2 class="font-display text-[20px] font-bold text-[#1E150F]">دیدگاه‌های کاربران درباره این کتاب</h2>
              <p class="text-[13px] text-[#6E5746] mt-1">
                نظرات و برداشت‌های اعضای باشگاه پیرامون کتاب «${toPersianDigits(book.title)}»
              </p>
            </div>
            <span class="inline-flex items-center px-3 py-1 rounded-xl bg-[#EFE3D2] text-[#5A3A22] text-[12px] font-bold self-start sm:self-auto">
              ${toPersianDigits(bookComments.length)} دیدگاه ثبت‌شده
            </span>
          </div>

          ${
            bookComments.length > 0
              ? `
            <div class="space-y-4">
              ${bookComments
                .map(
                  (comment) => `
                <article class="rounded-2xl bg-[#F3E9DA]/65 border border-[#E2D2BC] p-5 space-y-3">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center gap-2.5">
                      <div class="w-9 h-9 rounded-full bg-[#5A3A22] text-[#FAF5EC] flex items-center justify-center font-bold text-[13px]">
                        ${String(comment.author_name || 'ک').trim().charAt(0)}
                      </div>
                      <div>
                        <h3 class="text-[14px] font-bold text-[#1E150F]">${toPersianDigits(comment.author_name)}</h3>
                        <span class="text-[11.5px] text-[#7A6452]">${toPersianDigits(comment.created_date || '')}</span>
                      </div>
                    </div>
                    <div class="text-[12px] font-semibold text-[#8A5A2B]">
                      امتیاز: ${toPersianDigits(comment.rating || 5)} از ۵
                    </div>
                  </div>
                  <p class="text-[14px] leading-[1.95] text-[#3B2C22] whitespace-pre-line text-justify">
                    ${toPersianDigits(comment.comment_text)}
                  </p>
                  ${
                    comment.admin_reply
                      ? `
                    <div class="mt-3 mr-4 p-3.5 rounded-xl bg-[#FAF5EC] border-r-4 border-[#7A4B2A] space-y-1">
                      <div class="text-[12px] font-bold text-[#7A4B2A]">پاسخ مدیریت باشگاه:</div>
                      <p class="text-[13.5px] leading-[1.9] text-[#3B2C22] whitespace-pre-line text-justify">
                        ${toPersianDigits(comment.admin_reply)}
                      </p>
                    </div>
                  `
                      : ''
                  }
                </article>
              `
                )
                .join('')}
            </div>
          `
              : `
            <div class="rounded-2xl bg-[#F3E9DA]/50 border border-[#E4D6C3] p-6 text-center">
              <p class="text-[14px] text-[#5E493A] font-medium !text-center text-center mx-auto">
                هنوز دیدگاهی برای این کتاب ثبت نشده است. نخستین نفری باشید که نظر خود را درباره این اثر می‌نویسد.
              </p>
            </div>
          `
          }

          <!-- Submit New Book Comment Form -->
          <div class="pt-4 border-t border-[#E6D8C4]">
            <h3 class="font-display text-[17px] font-bold text-[#1E150F] mb-3">ثبت دیدگاه جدید درباره این کتاب</h3>
            <form class="js-library-book-comment-form space-y-4" novalidate>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-[12.5px] font-semibold text-[#4B382A] mb-1.5">نام و نام خانوادگی *</label>
                  <input
                    type="text"
                    name="author_name"
                    value=""
                    required
                    placeholder="نام و نام خانوادگی خود را وارد کنید"
                    class="w-full px-3.5 py-2.5 rounded-xl bg-[#FDFBF7] border border-[#D8C7B0] text-[13.5px] text-[#221811] focus:outline-none focus:border-[#5A3A22]"
                  />
                </div>
                <div>
                  <label class="block text-[12.5px] font-semibold text-[#4B382A] mb-1.5">امتیاز شما به این کتاب</label>
                  <select
                    name="rating"
                    class="w-full px-3.5 py-2.5 rounded-xl bg-[#FDFBF7] border border-[#D8C7B0] text-[13.5px] text-[#221811] focus:outline-none focus:border-[#5A3A22]"
                  >
                    <option value="5">۵ از ۵ (عالی و ماندگار)</option>
                    <option value="4">۴ از ۵ (بسیار خوب)</option>
                    <option value="3">۳ از ۵ (قابل قبول)</option>
                    <option value="2">۲ از ۵ (متوسط)</option>
                    <option value="1">۱ از ۵ (ضعیف)</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-[12.5px] font-semibold text-[#4B382A] mb-1.5">متن دیدگاه و برداشت شما *</label>
                <textarea
                  name="comment_text"
                  rows="3"
                  required
                  placeholder="نظر، تجربه خوانش یا نقد کوتاه خود را درباره این کتاب بنویسید..."
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#FDFBF7] border border-[#D8C7B0] text-[13.5px] text-[#221811] focus:outline-none focus:border-[#5A3A22]"
                ></textarea>
              </div>
              <div class="js-book-comment-feedback hidden rounded-xl px-4 py-2.5 text-[12.5px] font-medium"></div>
              <div class="flex justify-end">
                <button
                  type="submit"
                  class="js-submit-book-comment-btn px-5 py-2.5 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[13px] font-semibold transition-colors cursor-pointer"
                >
                  ارسال دیدگاه
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  `);

  $page.on('click', '.js-back-to-library', () => {
    props.onBack();
  });

  $page.on('submit', '.js-library-book-comment-form', async function (e) {
    e.preventDefault();
    const $form = $(this);
    const $feedback = $form.find('.js-book-comment-feedback');
    const $btn = $form.find('.js-submit-book-comment-btn');

    const authorName = String($form.find('input[name="author_name"]').val() || '').trim();
    const rating = Number($form.find('select[name="rating"]').val() || 5);
    const commentText = String($form.find('textarea[name="comment_text"]').val() || '').trim();

    if (!authorName || !commentText) {
      $feedback
        .removeClass('hidden bg-emerald-50 text-emerald-900 border-emerald-200')
        .addClass('bg-amber-50 text-amber-900 border border-amber-200')
        .text('لطفاً نام خود و متن دیدگاه را کامل وارد نمایید.');
      return;
    }

    $btn.prop('disabled', true).text('در حال ثبت دیدگاه...');
    try {
      await ApiService.submitPublicComment({
        author_name: authorName,
        target_title: book.title,
        target_type: 'کتاب کتابخانه',
        rating,
        comment_text: commentText,
      });
      $feedback
        .removeClass('hidden bg-amber-50 text-amber-900 border-amber-200')
        .addClass('bg-emerald-50 text-emerald-900 border border-emerald-200')
        .text(
          'دیدگاه شما درباره این کتاب با موفقیت ثبت شد و پس از تایید مدیریت باشگاه در این صفحه نمایش داده خواهد شد.'
        );
      $form.find('textarea[name="comment_text"]').val('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'خطا در ثبت دیدگاه';
      $feedback
        .removeClass('hidden bg-emerald-50 text-emerald-900 border-emerald-200')
        .addClass('bg-amber-50 text-amber-900 border border-amber-200')
        .text(msg);
    } finally {
      $btn.prop('disabled', false).text('ارسال دیدگاه');
    }
  });

  return $page;
}

