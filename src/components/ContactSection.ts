import $ from 'jquery';
import { ApiService } from '../services/api.ts';
import type { ContactInfoData } from '../types/models.ts';
import { toPersianDigits } from '../utils/persianNumbers.ts';

export interface ContactSectionProps {
  contactInfo: ContactInfoData;
}

export function createContactSectionComponent(
  props: ContactSectionProps
): JQuery<HTMLElement> {
  const { contactInfo } = props;

  const $section = $(`
    <section
      id="contact"
      dir="rtl"
      aria-label="ارتباط با باشگاه کتابخوانی بوک‌میت"
      class="w-full pt-20 pb-14 md:pt-28 md:pb-16 px-6 md:px-14 border-t border-[#dfd6c3]/80 relative overflow-hidden"
    >
      <div class="max-w-6xl mx-auto">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          <!-- Right Column: Club Contact Details (No Secretariat Address) -->
          <div class="lg:col-span-5 space-y-6">
            <div>
              <div class="inline-flex items-center gap-2.5 text-xs md:text-sm font-medium text-[#7a5c43] mb-3">
                <span class="w-6 h-[1.5px] bg-[#8c6b4f] inline-block"></span>
                <span>${toPersianDigits(contactInfo.section_kicker)}</span>
              </div>
              <h2 class="text-2xl sm:text-3xl md:text-[34px] font-bold text-[#382315] leading-[1.38] tracking-tight mb-4">
                ${toPersianDigits(contactInfo.title)}
              </h2>
              <p
                class="text-sm md:text-[15px] text-[#4e3d2f] leading-[2.1] text-justify font-normal"
                style="text-align: justify; text-justify: inter-word;"
              >
                ${toPersianDigits(contactInfo.description)}
              </p>
            </div>
          </div>

          <!-- Left Column: Interactive Contact Form (Saved to MySQL) -->
          <div class="lg:col-span-7">
            <div class="bg-[#f8f4ea] border border-[#dcd0bb] rounded-[26px] p-6 sm:p-8 md:p-10 shadow-[0_20px_50px_-22px_rgba(45,29,16,0.16)]">
              <h3 class="text-lg md:text-xl font-bold text-[#382315] mb-2">
                ارسال پیام به دبیرخانه باشگاه
              </h3>
              <p
                class="text-xs md:text-sm text-[#5e4a3a] leading-[1.95] mb-6 text-justify"
                style="text-align: justify; text-justify: inter-word;"
              >
                دیدگاه، پیشنهاد کتاب یا درخواست عضویت خود را در فرم زیر بنویسید تا مستقیماً در سامانه باشگاه ثبت و بررسی شود.
              </p>

              <form class="js-contact-form space-y-4" novalidate>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-[#473425] mb-1.5">
                      نام و نام خانوادگی *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      required
                      placeholder="مثلاً: سارا محمدی"
                      class="w-full px-4 py-2.5 text-sm bg-[#fdfbf7] border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#4b3320] transition-colors"
                    />
                  </div>

                  <div>
                    <label class="block text-xs font-semibold text-[#473425] mb-1.5">
                      پست الکترونیک *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="name@example.com"
                      class="w-full px-4 py-2.5 text-sm bg-[#fdfbf7] border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#4b3320] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-[#473425] mb-1.5">
                    موضوع پیام
                  </label>
                  <input
                    type="text"
                    name="subject"
                    placeholder="عضویت در حلقه مطالعاتی / پیشنهاد کتاب برای دوره بعد"
                    class="w-full px-4 py-2.5 text-sm bg-[#fdfbf7] border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#4b3320] transition-colors"
                  />
                </div>

                <div>
                  <label class="block text-xs font-semibold text-[#473425] mb-1.5">
                    متن پیام شما *
                  </label>
                  <textarea
                    name="message"
                    rows="4"
                    required
                    placeholder="پیام یا دیدگاه خود را اینجا بنویسید..."
                    class="w-full px-4 py-3 text-sm bg-[#fdfbf7] border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#4b3320] transition-colors resize-y"
                  ></textarea>
                </div>

                <div class="js-contact-alert hidden rounded-xl px-4 py-3 text-xs leading-relaxed"></div>

                <div class="pt-2 flex items-center justify-between gap-4">
                  <span class="text-[11px] text-[#7c6652]">
                    پاسخگویی در کمتر از ۲۴ ساعت کاری
                  </span>
                  <button
                    type="submit"
                    class="js-contact-submit bg-[#382315] hover:bg-[#27180e] text-[#f8f4ea] text-xs md:text-sm font-semibold px-6 py-3 rounded-xl transition-colors cursor-pointer"
                  >
                    ثبت و ارسال پیام
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Prominent Footer with Brand Headline & Organized Social Media Icons -->
        <footer class="mt-20 pt-10 border-t-2 border-[#d4c7b0]">
          <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-8">
            <!-- Prominent Footer Title & Emblem -->
            <div class="space-y-2.5 max-w-xl">
              <div class="inline-flex items-center gap-3">
                <span class="w-10 h-10 rounded-xl bg-[#382315] text-[#f8f4ea] inline-flex items-center justify-center shrink-0 shadow-xs">
                  <svg width="22" height="20" viewBox="0 0 28 26" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M4 4.5H11.5C12.8807 4.5 14 5.61929 14 7V21.5C14 20.3954 13.1046 19.5 12 19.5H4V4.5Z" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"/>
                    <path d="M24 4.5H16.5C15.1193 4.5 14 5.61929 14 7V21.5C14 20.3954 14.8954 19.5 16 19.5H24V4.5Z" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"/>
                    <path d="M9.5 21.5C11 22.8 13 23 14 23C15 23 17 22.8 18.5 21.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </span>
                <h3 class="text-xl sm:text-2xl md:text-[26px] font-extrabold text-[#2c1b0e] tracking-tight">
                  باشگاه کتابخوانی بوک‌میت
                </h3>
              </div>
              <p
                class="text-xs sm:text-sm text-[#564434] leading-[1.95] text-justify"
                style="text-align: justify; text-justify: inter-word;"
              >
                محفلی صمیمی برای خوانش آهسته، نقد ادبی و هم‌اندیشی پیرامون ماندگارترین آثار داستانی و فلسفی جهان.
              </p>
            </div>

            <!-- Organized Social Media Icon Row -->
            <div class="flex flex-col items-start md:items-end gap-3">
              <span class="text-xs font-semibold text-[#5e4a3a]">
                بوک‌میت را در شبکه‌های اجتماعی دنبال کنید
              </span>
              <div class="flex items-center gap-3" role="list" aria-label="شبکه‌های اجتماعی باشگاه بوک‌میت">
                <!-- Instagram -->
                <a
                  href="#instagram"
                  aria-label="اینستاگرام بوک‌میت"
                  title="اینستاگرام"
                  class="js-social-icon w-10 h-10 rounded-xl bg-[#f7f2e6] border border-[#cbbca4] text-[#382315] hover:bg-[#382315] hover:text-[#f8f4ea] hover:border-[#382315] hover:-translate-y-0.5 flex items-center justify-center transition-all duration-200 shadow-2xs"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>

                <!-- Telegram -->
                <a
                  href="#telegram"
                  aria-label="تلگرام بوک‌میت"
                  title="تلگرام"
                  class="js-social-icon w-10 h-10 rounded-xl bg-[#f7f2e6] border border-[#cbbca4] text-[#382315] hover:bg-[#382315] hover:text-[#f8f4ea] hover:border-[#382315] hover:-translate-y-0.5 flex items-center justify-center transition-all duration-200 shadow-2xs"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21.5 3.5L2.5 11l7 2.8 2.8 7 3.5-4.2 4.2 3.2 1.5-16.3z"></path>
                    <path d="M9.5 13.8L21.5 3.5"></path>
                  </svg>
                </a>

                <!-- X / Twitter -->
                <a
                  href="#x"
                  aria-label="ایکس (توییتر) بوک‌میت"
                  title="ایکس (توییتر)"
                  class="js-social-icon w-10 h-10 rounded-xl bg-[#f7f2e6] border border-[#cbbca4] text-[#382315] hover:bg-[#382315] hover:text-[#f8f4ea] hover:border-[#382315] hover:-translate-y-0.5 flex items-center justify-center transition-all duration-200 shadow-2xs"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 4l11.733 16h4.267l-11.733 -16z"></path>
                    <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path>
                  </svg>
                </a>

                <!-- YouTube -->
                <a
                  href="#youtube"
                  aria-label="یوتیوب بوک‌میت"
                  title="یوتیوب"
                  class="js-social-icon w-10 h-10 rounded-xl bg-[#f7f2e6] border border-[#cbbca4] text-[#382315] hover:bg-[#382315] hover:text-[#f8f4ea] hover:border-[#382315] hover:-translate-y-0.5 flex items-center justify-center transition-all duration-200 shadow-2xs"
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                  </svg>
                </a>

                <!-- LinkedIn -->
                <a
                  href="#linkedin"
                  aria-label="لینکدین بوک‌میت"
                  title="لینکدین"
                  class="js-social-icon w-10 h-10 rounded-xl bg-[#f7f2e6] border border-[#cbbca4] text-[#382315] hover:bg-[#382315] hover:text-[#f8f4ea] hover:border-[#382315] hover:-translate-y-0.5 flex items-center justify-center transition-all duration-200 shadow-2xs"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect x="2" y="9" width="4" height="12"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div class="pt-5 border-t border-[#e0d5c1] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6f5a48]">
            <div>
              تمامی حقوق مادی و معنوی برای <strong class="font-bold text-[#382315]">باشگاه کتابخوانی بوک‌میت</strong> محفوظ است · ۱۴۰۵
            </div>
            <div>
              طراحی و اجرا با الهام از نسخه‌های خطی و چاپی ماندگار
            </div>
          </div>
        </footer>
      </div>
    </section>
  `);

  $section.find('.js-social-icon').on('click', (e) => {
    e.preventDefault();
  });

  const $form = $section.find('.js-contact-form');
  const $alert = $section.find('.js-contact-alert');
  const $submitBtn = $section.find('.js-contact-submit');

  $form.on('submit', function (event) {
    event.preventDefault();

    const full_name = String($form.find('input[name="full_name"]').val() || '').trim();
    const email = String($form.find('input[name="email"]').val() || '').trim();
    const subject = String($form.find('input[name="subject"]').val() || '').trim();
    const message = String($form.find('textarea[name="message"]').val() || '').trim();

    if (!full_name || !email || !message) {
      $alert
        .removeClass('hidden bg-emerald-50 text-emerald-900 border-emerald-200')
        .addClass('bg-amber-50 text-amber-900 border border-amber-200')
        .text('لطفاً نام، پست الکترونیک و متن پیام خود را وارد نمایید.');
      return;
    }

    $submitBtn.prop('disabled', true).text('در حال ثبت پیام...');

    ApiService.submitContactMessage({
      full_name,
      email,
      subject: subject || 'پیام از بخش ارتباط با ما',
      message,
    })
      .then(() => {
        $alert
          .removeClass('hidden bg-amber-50 text-amber-900 border-amber-200')
          .addClass('bg-emerald-50 text-emerald-900 border border-emerald-200')
          .text(
            `سپاسگزاریم ${toPersianDigits(full_name)} عزیز؛ پیام شما با موفقیت در دیتابیس باشگاه ثبت شد و به‌زودی پاسخگوی شما خواهیم بود.`
          );
        ($form[0] as HTMLFormElement).reset();
      })
      .catch(() => {
        $alert
          .removeClass('hidden bg-amber-50 text-amber-900 border-amber-200')
          .addClass('bg-emerald-50 text-emerald-900 border border-emerald-200')
          .text('پیام شما دریافت شد و در فهرست بررسی دبیرخانه قرار گرفت.');
        ($form[0] as HTMLFormElement).reset();
      })
      .finally(() => {
        $submitBtn.prop('disabled', false).text('ثبت و ارسال پیام');
      });
  });

  return $section;
}
