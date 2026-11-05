import $ from 'jquery';
import { ApiService } from '../services/api.ts';
import { toPersianDigits } from '../utils/persianNumbers.ts';
import {
  UPCOMING_EVENTS_DATA,
  type ClubEventDetailItem,
  type EventAudienceComment,
} from './LibrarySection.ts';

export interface EventDetailPageProps {
  eventItem: ClubEventDetailItem;
  onBackToHomeEvents: () => void;
  onSelectEvent: (eventItem: ClubEventDetailItem) => void;
  onRegisterEvent: (eventItem: ClubEventDetailItem) => void;
}

export function createEventDetailPageComponent(
  props: EventDetailPageProps
): JQuery<HTMLElement> {
  const { eventItem } = props;
  let localComments: EventAudienceComment[] = [...(eventItem.comments || [])];
  let commentSubmittedMsg = '';

  const $page = $(`
    <main
      dir="rtl"
      aria-label="صفحه جزئیات نشست و معرفی کتاب"
      class="w-full max-w-[1140px] mx-auto px-6 sm:px-10 pt-28 pb-20 space-y-12"
    ></main>
  `);

  function render(): void {
    const otherEvents = UPCOMING_EVENTS_DATA.filter((e) => e.id !== eventItem.id);

    $page.html(`
      <!-- Top Breadcrumb & Back Action -->
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-[#d8ceba] pb-4">
        <div class="flex items-center gap-2 text-xs font-medium text-[#6e5a47]">
          <button
            type="button"
            class="js-back-to-events hover:text-[#23180f] cursor-pointer"
          >
            صفحه اصلی
          </button>
          <span>/</span>
          <button
            type="button"
            class="js-back-to-events hover:text-[#23180f] cursor-pointer"
          >
            رویدادها و کتاب در حال مطالعه
          </button>
          <span>/</span>
          <span class="text-[#38281b] font-semibold">${toPersianDigits(eventItem.bookTitle)}</span>
        </div>

        <button
          type="button"
          class="js-back-to-events inline-flex items-center gap-1.5 text-xs font-semibold text-[#4e3d2e] hover:text-[#23180f] cursor-pointer"
        >
          <span>→</span>
          <span>بازگشت به بخش رویدادها</span>
        </button>
      </div>

      <!-- Session Specifications & Hero Overview (مشخصات نشست) -->
      <section class="bg-[#e6decb]/65 border border-[#d5cab6] rounded-2xl p-6 sm:p-8 lg:p-10">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <!-- Book / Session Cover -->
          <div class="lg:col-span-4 flex flex-col">
            <div class="relative w-full h-full min-h-[280px] sm:min-h-[340px] rounded-xl overflow-hidden border border-[#d0c3ac] bg-[#dfd6c1]">
              <img
                src="${eventItem.coverUrl}"
                alt="${toPersianDigits(eventItem.title)}"
                referrerpolicy="no-referrer"
                class="w-full h-full object-cover"
              />
            </div>
          </div>

          <!-- Session Specs & Register CTA -->
          <div class="lg:col-span-8 flex flex-col justify-between space-y-6 text-right">
            <div class="space-y-3">
              <div class="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#755f4b]">
                <span>حلقه هم‌خوانی و نشست ادبی</span>
                <span>·</span>
                <span>اثر محور: ${toPersianDigits(eventItem.bookTitle)}</span>
                <span>·</span>
                <span>${toPersianDigits(eventItem.sessionsList.length)} جلسه در این دوره</span>
              </div>

              <h1 class="text-[22px] sm:text-[28px] font-bold text-[#38281b] leading-[1.45]">
                ${toPersianDigits(eventItem.title)}
              </h1>

              <p
                class="text-[14px] sm:text-[15px] leading-[2] text-[#4e3e30] text-justify"
                style="text-align: justify; text-justify: inter-word;"
              >
                ${toPersianDigits(eventItem.shortDescription)}
              </p>
            </div>

            <!-- Session Specifications Grid (مشخصات نشست) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4 border-t border-[#d6cbb7] text-xs sm:text-[13px]">
              <div class="p-3.5 rounded-xl bg-[#faf6ec]/75 border border-[#dbcfba]">
                <span class="text-[#755f4b] block mb-1">تسهیل‌گر و منتقد نشست:</span>
                <strong class="text-[#38281b] font-bold">${toPersianDigits(eventItem.mentor)}</strong>
              </div>
              <div class="p-3.5 rounded-xl bg-[#faf6ec]/75 border border-[#dbcfba]">
                <span class="text-[#755f4b] block mb-1">زمان و تاریخ برگزاری:</span>
                <strong class="text-[#38281b] font-bold">${toPersianDigits(eventItem.dateLabel)} · ${toPersianDigits(eventItem.timeLabel)}</strong>
              </div>
              <div class="p-3.5 rounded-xl bg-[#faf6ec]/75 border border-[#dbcfba]">
                <span class="text-[#755f4b] block mb-1">محل برگزاری نشست:</span>
                <strong class="text-[#38281b] font-bold">${toPersianDigits(eventItem.location)}</strong>
              </div>
              <div class="p-3.5 rounded-xl bg-[#faf6ec]/75 border border-[#dbcfba]">
                <span class="text-[#755f4b] block mb-1">شناسنامه اثر:</span>
                <strong class="text-[#38281b] font-bold">${toPersianDigits(eventItem.bookAuthor)} · ترجمه ${toPersianDigits(eventItem.bookTranslator)} (${toPersianDigits(eventItem.pagesCount)} صفحه)</strong>
              </div>
            </div>

            <!-- Primary CTA -->
            <div class="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[#d6cbb7]">
              <div class="text-xs text-[#5f4d3d] leading-relaxed">
                با ثبت‌نام در این نشست، دوره در بخش <strong class="text-[#38281b]">«جلسات من»</strong> در پنل کاربری شما ایجاد می‌شود و پس از تایید مدیر فعال می‌گردد.
              </div>
              <button
                type="button"
                class="js-detail-register-event px-7 py-3 rounded-xl bg-[#3e2d1f] hover:bg-[#291d13] text-[#faf6ec] text-sm font-semibold transition-colors cursor-pointer shrink-0"
              >
                ثبت‌نام در این نشست
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Book Introduction & Full Session Description (معرفی کتاب و توضیحات نشست) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section class="lg:col-span-6 bg-[#e6decb]/50 border border-[#d5cab6] rounded-2xl p-6 sm:p-7 space-y-4">
          <h2 class="text-lg sm:text-xl font-bold text-[#38281b] border-b border-[#d8ceba] pb-3">
            معرفی کتاب «${toPersianDigits(eventItem.bookTitle)}»
          </h2>
          <div class="grid grid-cols-2 gap-3 text-xs text-[#5f4d3d] bg-[#faf6ec]/70 p-3.5 rounded-xl border border-[#dbcfba]">
            <div>نویسنده: <strong class="text-[#38281b]">${toPersianDigits(eventItem.bookAuthor)}</strong></div>
            <div>مترجم: <strong class="text-[#38281b]">${toPersianDigits(eventItem.bookTranslator)}</strong></div>
            <div>انتشارات: <strong class="text-[#38281b]">${toPersianDigits(eventItem.publisher)}</strong></div>
            <div>تعداد صفحات: <strong class="text-[#38281b]">${toPersianDigits(eventItem.pagesCount)} صفحه (چاپ ${toPersianDigits(eventItem.publicationYear)})</strong></div>
          </div>
          <p
            class="text-[14px] sm:text-[14.5px] leading-[2.05] text-[#4e3e30] text-justify"
            style="text-align: justify; text-justify: inter-word;"
          >
            ${toPersianDigits(eventItem.bookIntroduction)}
          </p>
        </section>

        <section class="lg:col-span-6 bg-[#e6decb]/50 border border-[#d5cab6] rounded-2xl p-6 sm:p-7 space-y-4">
          <h2 class="text-lg sm:text-xl font-bold text-[#38281b] border-b border-[#d8ceba] pb-3">
            توضیحات و محورهای تحلیلی نشست
          </h2>
          <div class="space-y-4 text-[14px] sm:text-[14.5px] leading-[2.05] text-[#4e3e30] text-justify">
            ${eventItem.fullDescription
              .map(
                (para) => `
              <p style="text-align: justify; text-justify: inter-word;">
                ${toPersianDigits(para)}
              </p>
            `
              )
              .join('')}
          </div>
        </section>
      </div>

      <!-- Sessions Schedule List (جلسات دوره هم‌خوانی) -->
      <section class="space-y-5">
        <div class="border-b border-[#d8ceba] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 class="text-lg sm:text-xl font-bold text-[#38281b]">
              برنامه جلسات این دوره هم‌خوانی
            </h2>
            <p class="text-xs sm:text-sm text-[#695645] mt-1">
              فهرست جلسات برگزار شده و نشست‌های پیش رو به همراه محدوده صفحات مطالعه هر جلسه
            </p>
          </div>
          <span class="text-xs font-semibold text-[#5a3a22]">
            مجموعاً ${toPersianDigits(eventItem.sessionsList.length)} نشست
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${eventItem.sessionsList
            .map(
              (s) => `
            <article class="bg-[#e6decb]/55 border border-[#d5cab6] rounded-xl p-5 flex flex-col justify-between space-y-3">
              <div class="space-y-2">
                <div class="flex items-center justify-between gap-2 text-xs font-semibold border-b border-[#d8ceba] pb-2">
                  <span class="${
                    s.status === 'نشست پیش رو' ? 'text-[#235332]' : 'text-[#6e5641]'
                  }">
                    ${toPersianDigits(s.sessionNumber)} · ${toPersianDigits(s.status)}
                  </span>
                  <span class="text-[#5f4d3d]">
                    ${toPersianDigits(s.dateLabel)} · ساعت ${toPersianDigits(s.timeLabel)}
                  </span>
                </div>
                <h3 class="text-base font-bold text-[#38281b]">
                  ${toPersianDigits(s.title)}
                </h3>
              </div>
              <div class="pt-2 border-t border-[#ded4c1] flex items-center justify-between text-xs text-[#4e3e30]">
                <span class="text-[#755f4b]">بخش مورد مطالعه:</span>
                <strong class="font-semibold text-[#38281b]">${toPersianDigits(s.pagesToRead)}</strong>
              </div>
            </article>
          `
            )
            .join('')}
        </div>
      </section>

      <!-- Audience Comments Section (نظرات مخاطبان) -->
      <section class="bg-[#e6decb]/55 border border-[#d5cab6] rounded-2xl p-6 sm:p-8 space-y-6">
        <div class="border-b border-[#d8ceba] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 class="text-lg sm:text-xl font-bold text-[#38281b]">
              نظرات مخاطبان و اعضای حلقه هم‌خوانی
            </h2>
            <p class="text-xs sm:text-sm text-[#695645] mt-1">
              دیدگاه‌ها و برداشت‌های شرکت‌کنندگان درباره این کتاب و نشست‌های هم‌خوانی
            </p>
          </div>
          <span class="text-xs font-semibold text-[#5a3a22]">
            ${toPersianDigits(localComments.length)} دیدگاه ثبت‌شده
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${localComments
            .map(
              (c) => `
            <article class="p-4 sm:p-5 rounded-xl bg-[#faf6ec]/80 border border-[#dbcfba] space-y-2.5">
              <div class="flex items-center justify-between gap-2">
                <div>
                  <strong class="text-sm font-bold text-[#38281b] block">${toPersianDigits(c.authorName)}</strong>
                  <span class="text-[11px] text-[#755f4b]">${toPersianDigits(c.roleLabel)}</span>
                </div>
                <div class="text-left">
                  <div class="text-xs text-[#8c5a2b] font-bold">${'★'.repeat(c.rating)}</div>
                  <span class="text-[11px] text-[#755f4b]">${toPersianDigits(c.dateLabel)}</span>
                </div>
              </div>
              <p class="text-[13px] leading-[1.9] text-[#4e3e30] text-justify" style="text-align: justify; text-justify: inter-word;">
                ${toPersianDigits(c.commentText)}
              </p>
            </article>
          `
            )
            .join('')}
        </div>

        <!-- Add Comment Form -->
        <form class="js-event-comment-form pt-4 border-t border-[#d8ceba] space-y-4">
          <h3 class="text-sm sm:text-base font-bold text-[#38281b]">
            ثبت دیدگاه شما درباره این نشست و کتاب
          </h3>
          ${
            commentSubmittedMsg
              ? `<div class="p-3 rounded-xl bg-[#e4f2e7] border border-[#bbd9c2] text-[#235332] text-xs font-semibold">${toPersianDigits(commentSubmittedMsg)}</div>`
              : ''
          }
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-[#4e3e30] mb-1">نام و نام خانوادگی *</label>
              <input
                type="text"
                name="author_name"
                required
                placeholder="نام خود را وارد کنید..."
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#faf6ec] border border-[#d5cab6] text-xs text-[#231912] focus:outline-none focus:border-[#755f4b]"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-[#4e3e30] mb-1">امتیاز شما به نشست</label>
              <select
                name="rating"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#faf6ec] border border-[#d5cab6] text-xs text-[#231912] focus:outline-none focus:border-[#755f4b]"
              >
                <option value="5">۵ ستاره (عالی)</option>
                <option value="4">۴ ستاره (خوب)</option>
                <option value="3">۳ ستاره (متوسط)</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-[#4e3e30] mb-1">متن دیدگاه یا برداشت ادبی *</label>
            <textarea
              name="comment_text"
              rows="3"
              required
              placeholder="دیدگاه یا پرسش خود را درباره این کتاب و نشست بنویسید..."
              class="w-full px-3.5 py-2.5 rounded-xl bg-[#faf6ec] border border-[#d5cab6] text-xs text-[#231912] focus:outline-none focus:border-[#755f4b]"
            ></textarea>
          </div>
          <div class="flex justify-end">
            <button
              type="submit"
              class="px-5 py-2.5 rounded-xl bg-[#3e2d1f] hover:bg-[#2a1d13] text-[#faf6ec] text-xs font-semibold cursor-pointer"
            >
              ثبت دیدگاه
            </button>
          </div>
        </form>
      </section>

      <!-- Other Upcoming Events -->
      <section class="space-y-4 pt-4 border-t border-[#d8ceba]">
        <h3 class="text-base sm:text-lg font-bold text-[#38281b]">
          سایر رویدادها و نشست‌های پیش رو در باشگاه بوک‌میت
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          ${otherEvents
            .map(
              (oe) => `
            <div class="p-4 rounded-xl bg-[#e6decb]/45 border border-[#d5cab6] flex items-center justify-between gap-4">
              <div class="min-w-0">
                <div class="text-xs text-[#755f4b]">${toPersianDigits(oe.dateLabel)} · ${toPersianDigits(oe.timeLabel)}</div>
                <h4 class="text-sm font-bold text-[#38281b] truncate mt-0.5">${toPersianDigits(oe.title)}</h4>
              </div>
              <button
                type="button"
                data-other-event-id="${oe.id}"
                class="js-switch-other-event px-3.5 py-2 rounded-lg border border-[#7c624a] text-xs font-semibold text-[#38281b] hover:bg-[#dfd5c0] shrink-0 cursor-pointer"
              >
                مشاهده جزئیات ←
              </button>
            </div>
          `
            )
            .join('')}
        </div>
      </section>
    `);
  }

  $page.on('click', '.js-back-to-events', () => {
    props.onBackToHomeEvents();
  });

  $page.on('click', '.js-detail-register-event', () => {
    props.onRegisterEvent(eventItem);
  });

  $page.on('click', '.js-switch-other-event', function () {
    const id = Number($(this).attr('data-other-event-id'));
    const nextEv = UPCOMING_EVENTS_DATA.find((e) => e.id === id);
    if (nextEv) {
      props.onSelectEvent(nextEv);
    }
  });

  $page.on('submit', '.js-event-comment-form', function (e) {
    e.preventDefault();
    const $f = $(this);
    const authorName = String($f.find('[name="author_name"]').val() || '').trim();
    const commentText = String($f.find('[name="comment_text"]').val() || '').trim();
    const rating = Number($f.find('[name="rating"]').val() || 5);
    if (!authorName || !commentText) return;

    const newComment: EventAudienceComment = {
      id: Date.now(),
      authorName,
      roleLabel: 'هم‌خوان باشگاه',
      dateLabel: '۱۴ آبان ۱۴۰۵',
      rating,
      commentText,
    };
    localComments = [newComment, ...localComments];
    commentSubmittedMsg = 'دیدگاه شما با موفقیت ثبت شد و در لیست نظرات قرار گرفت.';

    ApiService.saveAdminComment({
      author_name: authorName,
      target_title: eventItem.title,
      target_type: 'نشست هم‌خوانی',
      rating,
      comment_text: commentText,
      status: 'تایید شده',
    }).catch(() => {
      // already added locally
    });

    render();
  });

  render();
  return $page;
}
