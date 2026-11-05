import $ from 'jquery';
import {
  type EventAudienceComment,
  type UpcomingEventCard,
} from './LibrarySection.ts';
import { ApiService } from '../services/api.ts';
import { toPersianDigits } from '../utils/persianNumbers.ts';

export interface EventDetailPageProps {
  eventItem: UpcomingEventCard;
  allEvents?: UpcomingEventCard[];
  onBack?: () => void;
  onBackToHomeEvents?: () => void;
  onRegisterEvent: (eventItem: UpcomingEventCard) => void;
  onSelectOtherEvent?: (eventItem: UpcomingEventCard) => void;
  onSelectEvent?: (eventItem: UpcomingEventCard) => void;
}

export function createEventDetailPageComponent(props: EventDetailPageProps): JQuery {
  return createEventDetailPage({
    eventItem: props.eventItem,
    allEvents: props.allEvents,
    onBack: props.onBackToHomeEvents || props.onBack || (() => {}),
    onRegisterEvent: props.onRegisterEvent,
    onSelectOtherEvent: props.onSelectEvent || props.onSelectOtherEvent,
  });
}

export function createEventDetailPage(
  props: Required<Pick<EventDetailPageProps, 'eventItem' | 'onBack' | 'onRegisterEvent'>> &
    EventDetailPageProps
): JQuery {
  let currentEvent: UpcomingEventCard = {
    ...props.eventItem,
    comments: [...(props.eventItem.comments || [])],
  };
  let commentSubmittedMsg = '';

  const $wrapper = $(`
    <section
      aria-label="صفحه جزئیات کامل نشست و معرفی کتاب"
      class="min-h-screen w-full bg-[#F5EFE6] text-[#231912] pt-28 sm:pt-32 pb-24 px-4 sm:px-8 lg:px-16"
    ></section>
  `);

  function render(): void {
    const ev = currentEvent;
    const otherEvents = (props.allEvents || []).filter((e) => e.id !== ev.id);

    $wrapper.html(`
      <div class="max-w-6xl mx-auto space-y-10">
        <!-- Top Navigation Bar -->
        <div class="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#DFD0BC]">
          <div class="flex items-center gap-2 text-[13px] text-[#6B5444]">
            <span>صفحه اصلی</span>
            <span>/</span>
            <span>رویدادها و کتاب در حال مطالعه</span>
            <span>/</span>
            <strong class="text-[#231912]">${toPersianDigits(ev.title)}</strong>
          </div>

          <button
            type="button"
            class="js-event-detail-back px-4 py-2.5 rounded-xl bg-[#FAF5EC] hover:bg-[#EFE2CE] border border-[#D8C5AC] text-[#3F2E21] text-[13px] font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span>→</span>
            <span>بازگشت به صفحه اصلی</span>
          </button>
        </div>

        <!-- Hero Card: Event & Book Overview -->
        <div class="rounded-3xl bg-[#FAF5EC] border border-[#E2D3BF] overflow-hidden shadow-[0_18px_48px_rgba(38,26,16,0.08)]">
          <div class="grid grid-cols-1 lg:grid-cols-12">
            <!-- Cover Column -->
            <div class="lg:col-span-5 relative min-h-[290px] sm:min-h-[360px] bg-[#241810]">
              <img
                src="${ev.coverUrl}"
                alt="${ev.title}"
                class="w-full h-full object-cover"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-[#1E140E]/85 via-[#1E140E]/20 to-transparent"></div>
              <div class="absolute top-4 right-4 left-4 flex items-center justify-end gap-2">
                <span class="px-3 py-1 rounded-xl bg-[#235332]/90 text-[#FAF5EC] text-[12px] font-bold">
                  ${toPersianDigits(ev.capacityText)}
                </span>
              </div>
              ${
                ev.locationLabel
                  ? `<div class="absolute bottom-4 right-4 left-4 text-[#FAF5EC]">
                      <span class="text-[12px] text-[#E6D3B8] block">محل برگزاری نشست:</span>
                      <strong class="text-[15px] font-bold">${toPersianDigits(ev.locationLabel)}</strong>
                    </div>`
                  : ''
              }
            </div>

            <!-- Event & Book Specs Column -->
            <div class="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
              <div class="space-y-4">
                <div class="flex flex-wrap items-center gap-2 text-[13px] text-[#7A4B2A] font-semibold">
                  ${
                    ev.category
                      ? `<span class="text-[#7A4B2A] font-bold">${toPersianDigits(ev.category)}</span>`
                      : ''
                  }
                  ${
                    ev.publicationYear
                      ? `<span>•</span><span>سال انتشار: ${toPersianDigits(ev.publicationYear)}</span>`
                      : ''
                  }
                  ${
                    ev.pagesCount
                      ? `<span>•</span><span>${toPersianDigits(ev.pagesCount)} صفحه</span>`
                      : ''
                  }
                </div>

                <h1 class="font-display text-[24px] sm:text-[30px] font-bold text-[#1E150F] leading-[1.45] text-justify">
                  ${toPersianDigits(ev.title)}
                </h1>

                ${
                  ev.summary
                    ? `<p class="text-[14.5px] leading-[1.95] text-[#4A382B] text-justify">
                        ${toPersianDigits(ev.summary)}
                      </p>`
                    : ''
                }

                <!-- Specifications Grid -->
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-2">
                  <div class="p-3.5 rounded-2xl bg-[#F3E9DA] border border-[#E2D2BC]">
                    <span class="block text-[11.5px] text-[#786150]">نام کتاب</span>
                    <strong class="text-[13.5px] font-bold text-[#231912] mt-1 block">${toPersianDigits(ev.bookTitle || '—')}</strong>
                  </div>
                  <div class="p-3.5 rounded-2xl bg-[#F3E9DA] border border-[#E2D2BC]">
                    <span class="block text-[11.5px] text-[#786150]">نویسنده</span>
                    <strong class="text-[13.5px] font-bold text-[#231912] mt-1 block">${toPersianDigits(ev.bookAuthor || '—')}</strong>
                  </div>
                  <div class="p-3.5 rounded-2xl bg-[#F3E9DA] border border-[#E2D2BC]">
                    <span class="block text-[11.5px] text-[#786150]">مترجم</span>
                    <strong class="text-[13.5px] font-bold text-[#231912] mt-1 block">${toPersianDigits(ev.bookTranslator || '—')}</strong>
                  </div>
                  <div class="p-3.5 rounded-2xl bg-[#F3E9DA] border border-[#E2D2BC]">
                    <span class="block text-[11.5px] text-[#786150]">انتشارات و صفحات</span>
                    <strong class="text-[13.5px] font-bold text-[#231912] mt-1 block">${
                      ev.bookPublisher ? toPersianDigits(ev.bookPublisher) : '—'
                    }${ev.pagesCount ? ` (${toPersianDigits(ev.pagesCount)} ص)` : ''}</strong>
                  </div>
                  <div class="p-3.5 rounded-2xl bg-[#F3E9DA] border border-[#E2D2BC]">
                    <span class="block text-[11.5px] text-[#786150]">روزهای برگزاری</span>
                    <strong class="text-[13.5px] font-bold text-[#231912] mt-1 block">${toPersianDigits(ev.dateText || '—')}</strong>
                  </div>
                  <div class="p-3.5 rounded-2xl bg-[#F3E9DA] border border-[#E2D2BC]">
                    <span class="block text-[11.5px] text-[#786150]">ساعت نشست</span>
                    <strong class="text-[13.5px] font-bold text-[#231912] mt-1 block">${toPersianDigits(ev.timeText || '—')}</strong>
                  </div>
                </div>
              </div>

              <!-- CTA Register Bar -->
              <div class="pt-5 border-t border-[#E6D7C3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span class="text-[12.5px] text-[#6B5444] block mb-0.5">پس از ثبت نام و تایید مدیر نشست های شما فعال می شود</span>
                  <span class="text-[13.5px] font-bold text-[#235332]">ثبت در بخش «جلسات من» و تایید توسط مدیریت باشگاه</span>
                </div>
                <button
                  type="button"
                  class="js-detail-register-event px-7 py-3.5 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[14px] font-bold transition-colors shadow-sm cursor-pointer shrink-0"
                >
                  ثبت نام در این نشست هم‌خوانی
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Book Introduction & Event Description (Equal Height Side-by-Side Cards) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div class="lg:col-span-7 h-full flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-[#FAF5EC] border border-[#E2D3BF] space-y-4">
            <div class="space-y-4">
              <h2 class="font-display text-[21px] sm:text-[24px] font-bold text-[#1E150F]">
                درباره این نشست و محورهای گفت‌وگو
              </h2>
              ${
                ev.fullDescription.length > 0
                  ? `<div class="space-y-3.5 text-[14.5px] leading-[2] text-[#3F2F23] text-justify">
                      ${ev.fullDescription
                        .map((p) => `<p>${toPersianDigits(p)}</p>`)
                        .join('')}
                    </div>`
                  : `<p class="text-[14px] text-[#6B5444]">توضیحات تکمیلی برای این دوره ثبت نشده است.</p>`
              }
            </div>
          </div>

          <div class="lg:col-span-5 h-full flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-[#EFE4D3] border border-[#DECBB2] space-y-4">
            <div class="space-y-4">
              <h2 class="font-display text-[20px] sm:text-[22px] font-bold text-[#1E150F]">
                معرفی کتاب «${toPersianDigits(ev.bookTitle)}»
              </h2>
              ${
                ev.bookIntroduction
                  ? `<p class="text-[14px] leading-[1.95] text-[#3B2C22] text-justify">
                      ${toPersianDigits(ev.bookIntroduction)}
                    </p>`
                  : `<p class="text-[13.5px] text-[#6B5444]">معرفی کتاب برای این نشست ثبت نشده است.</p>`
              }
            </div>
            <div class="pt-3 border-t border-[#D8C2A6] text-[12.5px] text-[#5A4535] space-y-1.5">
              <div>• ژانر و دسته‌بندی: <strong>${toPersianDigits(ev.category || '—')}</strong></div>
              <div>• سال انتشار: <strong>${ev.publicationYear ? toPersianDigits(ev.publicationYear) : '—'}</strong></div>
              <div>• تعداد جلسات تعریف‌شده: <strong>${toPersianDigits(ev.sessionsList.length)} جلسه</strong></div>
            </div>
          </div>
        </div>

        <!-- Sessions Schedule List -->
        <div class="p-6 sm:p-8 lg:p-10 rounded-3xl bg-[#FAF5EC] border border-[#E2D3BF] space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 class="font-display text-[21px] sm:text-[25px] font-bold text-[#1E150F]">
                برنامه جلسات و بخش‌بندی مطالعه کتاب
              </h2>
              <p class="text-[13.5px] text-[#6B5444] mt-1">
                برنامه زمان‌بندی جلسات ثبت‌شده برای این دوره هم‌خوانی
              </p>
            </div>
            <span class="px-3.5 py-1.5 rounded-xl bg-[#EFE2CE] text-[#5A3A22] text-[12.5px] font-bold self-start sm:self-auto">
              مجموعاً ${toPersianDigits(ev.sessionsList.length)} جلسه
            </span>
          </div>

          ${
            ev.sessionsList.length > 0
              ? `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${ev.sessionsList
                .map(
                  (sub) => `
                <div class="p-5 rounded-2xl bg-[#F4E9DA]/65 border border-[#E2D2BC] flex flex-col justify-between gap-3">
                  <div class="space-y-2">
                    <div class="flex items-center justify-between gap-2">
                      <span class="px-2.5 py-1 rounded-lg bg-[#5A3A22] text-[#FAF5EC] text-[11.5px] font-bold">
                        ${toPersianDigits(sub.sessionNumber)}
                      </span>
                      <span class="px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                        sub.status === 'برگزار شده'
                          ? 'bg-[#E4F2E7] text-[#235332]'
                          : 'bg-[#FFF3CD] text-[#7A5A10]'
                      }">
                        ${toPersianDigits(sub.status)}
                      </span>
                    </div>
                    <h3 class="font-display text-[16px] font-bold text-[#231912] leading-[1.6] text-justify">
                      ${toPersianDigits(sub.title)}
                    </h3>
                  </div>

                  <div class="pt-3 border-t border-[#E2D2BC] text-[12px] text-[#5B4739] space-y-1">
                    ${
                      sub.date || sub.time
                        ? `<div class="flex items-center justify-between">
                            <span>تاریخ و ساعت:</span>
                            <strong class="text-[#231912]">${toPersianDigits(sub.date)}${
                            sub.date && sub.time ? ' · ساعت ' : ''
                          }${toPersianDigits(sub.time)}</strong>
                          </div>`
                        : ''
                    }
                    ${
                      sub.pagesRange
                        ? `<div class="flex items-center justify-between">
                            <span>محدوده مطالعه:</span>
                            <strong class="text-[#7A4B2A]">${toPersianDigits(sub.pagesRange)}</strong>
                          </div>`
                        : ''
                    }
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          `
              : `
            <div class="p-6 rounded-2xl bg-[#F4E9DA]/50 border border-[#E2D2BC] text-center text-[13.5px] text-[#6B5444]">
              هنوز جلسه‌ای برای این دوره ثبت نشده است.
            </div>
          `
          }
        </div>

        <!-- Audience Comments & Reviews Section -->
        <div class="p-6 sm:p-8 lg:p-10 rounded-3xl bg-[#FAF5EC] border border-[#E2D3BF] space-y-8">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 class="font-display text-[21px] sm:text-[25px] font-bold text-[#1E150F]">
                نظرات و دیدگاه‌های شرکت‌کنندگان (${toPersianDigits(ev.comments.length)})
              </h2>
              <p class="text-[13.5px] text-[#6B5444] mt-1">
                تجربه اعضا از حضور در نشست‌های هم‌خوانی و تحلیل این کتاب در باشگاه بوک‌میت
              </p>
            </div>
          </div>

          <!-- Existing Comments List -->
          ${
            ev.comments.length > 0
              ? `
            <div class="space-y-4">
              ${ev.comments
                .map(
                  (c) => `
                <article class="p-5 rounded-2xl bg-[#F4E9DA]/55 border border-[#E3D3BE] space-y-3">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl bg-[#7A4B2A] text-[#FAF5EC] font-display font-bold text-[15px] flex items-center justify-center">
                        ${c.authorName.charAt(0)}
                      </div>
                      <div>
                        <h4 class="font-bold text-[14px] text-[#231912]">${toPersianDigits(c.authorName)}</h4>
                        <span class="text-[11.5px] text-[#6B5444]">${toPersianDigits(c.authorRole)} · ${toPersianDigits(c.createdDate)}</span>
                      </div>
                    </div>
                    <div class="text-[#C58B2B] text-[13px] font-bold">
                      ${'★'.repeat(c.rating)}${'☆'.repeat(Math.max(0, 5 - c.rating))}
                    </div>
                  </div>

                  <p class="text-[13.5px] leading-[1.9] text-[#3B2C22] text-justify">
                    ${toPersianDigits(c.commentText)}
                  </p>

                  ${
                    c.adminReply
                      ? `
                    <div class="p-3.5 rounded-xl bg-[#EDF5EE] border border-[#C7DFCB] text-[12.5px] text-[#1E3F29]">
                      <strong class="block text-[#235332] mb-1">پاسخ مدیر باشگاه:</strong>
                      <p class="leading-[1.8] text-justify">${toPersianDigits(c.adminReply)}</p>
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
            <div class="p-6 rounded-2xl bg-[#F4E9DA]/40 border border-[#E3D3BE] text-center text-[13.5px] text-[#6B5444]">
              هنوز دیدگاهی برای این نشست ثبت نشده است. اولین نفری باشید که دیدگاه خود را ثبت می‌کند.
            </div>
          `
          }

          <!-- Add New Comment Form -->
          <form class="js-event-comment-form pt-6 border-t border-[#E6D7C3] space-y-4">
            <h3 class="font-display text-[17px] font-bold text-[#231912]">
              ثبت دیدگاه یا پرسش درباره این نشست
            </h3>
            ${
              commentSubmittedMsg
                ? `
              <div class="p-3.5 rounded-xl bg-[#E4F2E7] border border-[#BBD9C2] text-[#235332] text-[13px] font-semibold">
                ✓ ${toPersianDigits(commentSubmittedMsg)}
              </div>
            `
                : ''
            }
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">نام و نام خانوادگی *</label>
                <input
                  type="text"
                  name="author_name"
                  required
                  placeholder="نام شما..."
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
                />
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">امتیاز شما به این انتخاب</label>
                <select
                  name="rating"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912]"
                >
                  <option value="5">۵ ستاره (عالی)</option>
                  <option value="4">۴ ستاره (خوب)</option>
                  <option value="3">۳ ستاره (متوسط)</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-[12px] font-semibold text-[#4E3B2D] mb-1">متن دیدگاه شما *</label>
              <textarea
                name="comment_text"
                rows="3"
                required
                placeholder="دیدگاه یا سؤال خود را درباره این کتاب و نشست بنویسید..."
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E9DA]/60 border border-[#DFCEB9] text-[13px] text-[#231912] focus:outline-none focus:border-[#8B5A36]"
              ></textarea>
            </div>
            <div class="flex justify-end">
              <button
                type="submit"
                class="px-6 py-2.5 rounded-xl bg-[#5A3A22] hover:bg-[#432A18] text-[#FAF5EC] text-[13px] font-semibold transition-colors cursor-pointer"
              >
                ثبت دیدگاه
              </button>
            </div>
          </form>
        </div>

        <!-- Other Upcoming Events -->
        ${
          otherEvents.length > 0
            ? `
          <div class="space-y-4">
            <h3 class="font-display text-[20px] font-bold text-[#1E150F]">
              سایر رویدادها و نشست‌های پیش رو
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              ${otherEvents
                .map(
                  (item) => `
                <div class="p-5 rounded-2xl bg-[#FAF5EC] border border-[#E2D3BF] flex items-center justify-between gap-4">
                  <div>
                    ${
                      item.badge
                        ? `<span class="text-[11.5px] font-bold text-[#7A4B2A]">${toPersianDigits(item.badge)}</span>`
                        : ''
                    }
                    <h4 class="font-display text-[16.5px] font-bold text-[#231912] mt-0.5">${toPersianDigits(item.title)}</h4>
                    <p class="text-[12px] text-[#6B5444] mt-1">${toPersianDigits(item.dateText)}${
                    item.dateText && item.timeText ? ' · ' : ''
                  }${toPersianDigits(item.timeText)}</p>
                  </div>
                  <button
                    type="button"
                    data-switch-event="${item.id}"
                    class="js-switch-event-detail px-4 py-2 rounded-xl bg-[#F3E7D6] hover:bg-[#E5D4BC] text-[#3F2E21] text-[12px] font-semibold shrink-0 cursor-pointer"
                  >
                    مشاهده جزئیات
                  </button>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        `
            : ''
        }
      </div>
    `);
  }

  $wrapper.on('click', '.js-event-detail-back', () => {
    props.onBack();
  });

  $wrapper.on('click', '.js-detail-register-event', () => {
    props.onRegisterEvent(currentEvent);
  });

  $wrapper.on('click', '.js-switch-event-detail', function () {
    const id = Number($(this).data('switch-event'));
    const nextEv = (props.allEvents || []).find((e) => e.id === id);
    if (nextEv) {
      currentEvent = { ...nextEv, comments: [...(nextEv.comments || [])] };
      commentSubmittedMsg = '';
      if (props.onSelectOtherEvent) {
        props.onSelectOtherEvent(nextEv);
      }
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  $wrapper.on('submit', '.js-event-comment-form', function (e) {
    e.preventDefault();
    const $f = $(this);
    const authorName = String($f.find('[name="author_name"]').val() || '').trim();
    const rating = Number($f.find('[name="rating"]').val() || 5);
    const commentText = String($f.find('[name="comment_text"]').val() || '').trim();
    if (!authorName || !commentText) return;

    ApiService.submitPublicComment({
      author_name: authorName,
      target_title: currentEvent.title,
      target_type: 'نشست کتاب‌خوانی',
      rating,
      comment_text: commentText,
    })
      .then(() => {
        const newComment: EventAudienceComment = {
          id: Date.now(),
          authorName,
          authorRole: 'عضو و مخاطب باشگاه',
          createdDate: 'هم‌اکنون',
          rating,
          commentText,
        };
        currentEvent.comments = [newComment, ...currentEvent.comments];
        commentSubmittedMsg =
          'دیدگاه شما با موفقیت در دیتابیس ثبت شد و پس از تایید مدیریت نمایش داده می‌شود.';
        render();
      })
      .catch(() => {
        commentSubmittedMsg = 'دیدگاه شما ثبت شد.';
        render();
      });
  });

  render();
  return $wrapper;
}
