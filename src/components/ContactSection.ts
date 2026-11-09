import $ from 'jquery';
import { ApiService } from '../services/api.ts';
import type { ContactInfoData, FooterSettingsData } from '../types/models.ts';
import { toPersianDigits } from '../utils/persianNumbers.ts';

export interface ContactSectionProps {
  contactInfo: ContactInfoData;
  footerSettings?: FooterSettingsData;
}

const DEFAULT_FOOTER_SETTINGS: FooterSettingsData = {
  id: 1,
  title: 'باشگاه کتابخوانی بوک‌میت',
  description: 'محفلی صمیمی برای خوانش آهسته، نقد ادبی و هم‌اندیشی پیرامون ماندگارترین آثار داستانی و فلسفی جهان.',
  phone: '۰۲۱-۸۸۹۴۳۲۱۰',
  email: 'hello@bookmeet.ir',
  address: 'تهران، خیابان کریم‌خان زند، خیابان ایرانشهر، خانه فرهنگ و ادبیات بوک‌میت',
  links: [
    { label: 'درباره باشگاه', href: '#about-club' },
    { label: 'کتابخانه', href: '#library' },
    { label: 'نشست‌ها', href: '#events' },
    { label: 'کلاس‌ها و دوره‌ها', href: '#courses' },
    { label: 'وبلاگ', href: '#blog' },
    { label: 'تماس با ما', href: '#contact' },
  ],
  instagram_url: '',
  telegram_url: '',
  twitter_url: '',
  youtube_url: '',
  linkedin_url: '',
  copyright_text: 'تمامی حقوق مادی و معنوی برای باشگاه کتابخوانی بوک‌میت محفوظ است · ۱۴۰۵',
  tagline_text: 'حلقه‌های مطالعاتی و نقد ادبیات داستانی',
};

export function createContactSectionComponent(
  props: ContactSectionProps
): JQuery<HTMLElement> {
  const { contactInfo } = props;
  const footer: FooterSettingsData = {
    ...DEFAULT_FOOTER_SETTINGS,
    ...(props.footerSettings || {}),
    links: Array.isArray(props.footerSettings?.links)
      ? props.footerSettings!.links
      : DEFAULT_FOOTER_SETTINGS.links,
  };

  const footerLinks = (footer.links || []).filter((l) => String(l?.label || '').trim());
  const hasFooterContact =
    Boolean(String(footer.phone || '').trim()) ||
    Boolean(String(footer.email || '').trim()) ||
    Boolean(String(footer.address || '').trim());

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

        <!-- Refined Proportional Footer Configured via Admin Footer Settings -->
        <footer class="mt-16 pt-8 border-t border-[#d8ccb6]">
          <div class="bg-[#f6f1e4]/75 border border-[#ded3be] rounded-2xl px-6 py-5 sm:px-7 sm:py-6 space-y-5">
            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-5 border-b border-[#e5dccb]">
              <!-- Compact Prominent Brand Title & Subtitle -->
              <div class="space-y-1.5 max-w-lg">
                <div class="inline-flex items-center gap-3">
                  <img
                    src="/assets/Bookmate%20Persian%20Logo%20with%20Colorful%20Books.png"
                    alt="لوگوی باشگاه کتابخوانی بوک‌میت"
                    class="h-10 w-auto object-contain select-none shrink-0"
                  />
                  <h3 class="text-base sm:text-[18px] font-bold text-[#2c1b0e] tracking-tight">
                    ${toPersianDigits(footer.title || 'باشگاه کتابخوانی بوک‌میت')}
                  </h3>
                </div>
                ${
                  footer.description
                    ? `<p
                        class="text-[12px] text-[#5c4a3a] leading-[1.9] text-justify"
                        style="text-align: justify; text-justify: inter-word;"
                      >
                        ${toPersianDigits(footer.description)}
                      </p>`
                    : ''
                }
              </div>

              <!-- Organized Social Media Icon Row -->
              <div class="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-2.5 w-full md:w-auto justify-between">
                <span class="text-[11px] font-medium text-[#6e5947]">
                  همراه ما در شبکه‌های اجتماعی باشید
                </span>
                <div class="flex items-center gap-2" role="list" aria-label="شبکه‌های اجتماعی باشگاه بوک‌میت">
                  <!-- Instagram -->
                  <a
                    href="${footer.instagram_url || '#instagram'}"
                    ${footer.instagram_url ? 'target="_blank" rel="noopener noreferrer"' : ''}
                    data-has-url="${footer.instagram_url ? '1' : '0'}"
                    aria-label="اینستاگرام بوک‌میت"
                    title="اینستاگرام"
                    class="js-social-icon w-8.5 h-8.5 rounded-lg bg-[#faf6ec] border border-[#cfc1aa] text-[#382315] hover:bg-[#382315] hover:text-[#f8f4ea] hover:border-[#382315] hover:-translate-y-0.5 flex items-center justify-center transition-all duration-200"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </a>

                  <!-- Telegram -->
                  <a
                    href="${footer.telegram_url || '#telegram'}"
                    ${footer.telegram_url ? 'target="_blank" rel="noopener noreferrer"' : ''}
                    data-has-url="${footer.telegram_url ? '1' : '0'}"
                    aria-label="تلگرام بوک‌میت"
                    title="تلگرام"
                    class="js-social-icon w-8.5 h-8.5 rounded-lg bg-[#faf6ec] border border-[#cfc1aa] text-[#382315] hover:bg-[#382315] hover:text-[#f8f4ea] hover:border-[#382315] hover:-translate-y-0.5 flex items-center justify-center transition-all duration-200"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21.5 3.5L2.5 11l7 2.8 2.8 7 3.5-4.2 4.2 3.2 1.5-16.3z"></path>
                      <path d="M9.5 13.8L21.5 3.5"></path>
                    </svg>
                  </a>

                  <!-- X / Twitter -->
                  <a
                    href="${footer.twitter_url || '#x'}"
                    ${footer.twitter_url ? 'target="_blank" rel="noopener noreferrer"' : ''}
                    data-has-url="${footer.twitter_url ? '1' : '0'}"
                    aria-label="ایکس (توییتر) بوک‌میت"
                    title="ایکس (توییتر)"
                    class="js-social-icon w-8.5 h-8.5 rounded-lg bg-[#faf6ec] border border-[#cfc1aa] text-[#382315] hover:bg-[#382315] hover:text-[#f8f4ea] hover:border-[#382315] hover:-translate-y-0.5 flex items-center justify-center transition-all duration-200"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M4 4l11.733 16h4.267l-11.733 -16z"></path>
                      <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path>
                    </svg>
                  </a>

                  <!-- YouTube -->
                  <a
                    href="${footer.youtube_url || '#youtube'}"
                    ${footer.youtube_url ? 'target="_blank" rel="noopener noreferrer"' : ''}
                    data-has-url="${footer.youtube_url ? '1' : '0'}"
                    aria-label="یوتیوب بوک‌میت"
                    title="یوتیوب"
                    class="js-social-icon w-8.5 h-8.5 rounded-lg bg-[#faf6ec] border border-[#cfc1aa] text-[#382315] hover:bg-[#382315] hover:text-[#f8f4ea] hover:border-[#382315] hover:-translate-y-0.5 flex items-center justify-center transition-all duration-200"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                    </svg>
                  </a>

                  <!-- LinkedIn -->
                  <a
                    href="${footer.linkedin_url || '#linkedin'}"
                    ${footer.linkedin_url ? 'target="_blank" rel="noopener noreferrer"' : ''}
                    data-has-url="${footer.linkedin_url ? '1' : '0'}"
                    aria-label="لینکدین بوک‌میت"
                    title="لینکدین"
                    class="js-social-icon w-8.5 h-8.5 rounded-lg bg-[#faf6ec] border border-[#cfc1aa] text-[#382315] hover:bg-[#382315] hover:text-[#f8f4ea] hover:border-[#382315] hover:-translate-y-0.5 flex items-center justify-center transition-all duration-200"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                      <rect x="2" y="9" width="4" height="12"></rect>
                      <circle cx="4" cy="4" r="2"></circle>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            ${
              footerLinks.length > 0 || hasFooterContact
                ? `
              <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#e5dccb] text-[12px] text-[#5c4a3a]">
                ${
                  footerLinks.length > 0
                    ? `
                  <nav aria-label="لینک‌های فوتر" class="flex flex-wrap items-center gap-x-5 gap-y-2">
                    ${footerLinks
                      .map(
                        (link) => `
                      <a
                        href="${link.href || '#'}"
                        class="font-semibold text-[#382315] hover:text-[#7a4b2a] transition-colors"
                      >
                        ${toPersianDigits(link.label)}
                      </a>
                    `
                      )
                      .join('')}
                  </nav>
                `
                    : '<div></div>'
                }

                ${
                  hasFooterContact
                    ? `
                  <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] text-[#5c4a3a]">
                    ${
                      footer.phone
                        ? `<span>تلفن: <strong class="font-semibold text-[#2c1b0e]">${toPersianDigits(footer.phone)}</strong></span>`
                        : ''
                    }
                    ${
                      footer.email
                        ? `<span>ایمیل: <strong class="font-semibold text-[#2c1b0e]">${footer.email}</strong></span>`
                        : ''
                    }
                    ${
                      footer.address
                        ? `<span>نشانی: <strong class="font-semibold text-[#2c1b0e]">${toPersianDigits(footer.address)}</strong></span>`
                        : ''
                    }
                  </div>
                `
                    : ''
                }
              </div>
            `
                : ''
            }

            <div class="pt-1 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#75604d]">
              <div>
                ${toPersianDigits(
                  footer.copyright_text ||
                    'تمامی حقوق مادی و معنوی برای باشگاه کتابخوانی بوک‌میت محفوظ است · ۱۴۰۵'
                )}
              </div>
              <div>
                ${toPersianDigits(footer.tagline_text || 'حلقه‌های مطالعاتی و نقد ادبیات داستانی')}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </section>
  `);

  $section.find('.js-social-icon').on('click', function (e) {
    const hasUrl = String($(this).attr('data-has-url')) === '1';
    if (!hasUrl) {
      e.preventDefault();
    }
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
