import $ from 'jquery';
import type { AboutManagerData } from '../types/models.ts';

export interface AboutManagerSectionProps {
  aboutManager: AboutManagerData;
}

export function createAboutManagerSectionComponent(
  props: AboutManagerSectionProps
): JQuery<HTMLElement> {
  const { aboutManager } = props;

  const $section = $(`
    <section
      id="about-me"
      dir="rtl"
      aria-labelledby="about-manager-heading"
      class="w-full max-w-[1140px] mx-auto px-6 sm:px-10 py-16 sm:py-24 border-t border-[#ddd4c0]"
    >
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
        <!-- Right Column in RTL: Club Manager Portrait Frame -->
        <div class="lg:col-span-5 flex flex-col">
          <div class="relative w-full h-full min-h-[360px] sm:min-h-[420px] rounded-2xl overflow-hidden border border-[#d5cab6] bg-[#e4dcc8] flex flex-col justify-end group">
            <img
              src="${aboutManager.image_url}"
              alt="${aboutManager.full_name} — ${aboutManager.role_title}"
              referrerpolicy="no-referrer"
              class="js-manager-image absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />

            <!-- Subtle Gradient Scrim with Manager Name & Photo Picker -->
            <div class="relative z-10 bg-gradient-to-t from-[#241911]/88 via-[#241911]/45 to-transparent p-5 pt-16 flex items-end justify-between gap-4">
              <div class="text-right">
                <div class="text-sm font-bold text-[#f5efe4]">
                  ${aboutManager.full_name}
                </div>
                <div class="text-[11.5px] text-[#e2d8c5] mt-0.5">
                  مدیر و بنیان‌گذار باشگاه کتابخوانی بوک‌میت
                </div>
              </div>

              <label
                class="px-3 py-1.5 text-[11.5px] font-medium text-[#f5efe4] border border-[#f5efe4]/40 hover:border-[#f5efe4] hover:bg-[#f5efe4]/10 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="جایگزینی تصویر مدیر باشگاه"
              >
                <span>تغییر تصویر</span>
                <input
                  type="file"
                  accept="image/*"
                  class="js-manager-file-input hidden"
                />
              </label>
            </div>
          </div>
        </div>

        <!-- Left Column in RTL: Manager Introduction, Short Biography & Quote -->
        <div class="lg:col-span-7 flex flex-col justify-between text-right space-y-6">
          <div class="space-y-4">
            <div class="text-xs font-medium text-[#755f4b] tracking-normal">
              ${aboutManager.section_kicker}
            </div>

            <div>
              <h2
                id="about-manager-heading"
                class="text-[24px] sm:text-[32px] font-bold text-[#38281b] leading-[1.38]"
              >
                ${aboutManager.full_name}
              </h2>
              <div class="text-xs sm:text-sm font-medium text-[#695645] mt-1">
                ${aboutManager.role_title}
              </div>
            </div>

            <div class="space-y-4 pt-2 text-[14.5px] sm:text-[15.5px] leading-[2.05] text-[#4e3e30] font-normal text-justify">
              <p class="text-justify">
                ${aboutManager.bio_paragraph_1}
              </p>
              <p class="text-justify">
                ${aboutManager.bio_paragraph_2}
              </p>
            </div>
          </div>

          <!-- Editorial Quote & Unboxed Credentials -->
          <div class="pt-6 border-t border-[#dbd1bd] space-y-4">
            <p class="text-[13.5px] sm:text-[14.5px] font-medium text-[#38281b] leading-[1.95] text-justify">
              ${aboutManager.quote_text}
            </p>

            <div class="text-xs text-[#695645]">
              ${aboutManager.credentials_line}
            </div>
          </div>
        </div>
      </div>
    </section>
  `);

  const $fileInput = $section.find('.js-manager-file-input');
  const $img = $section.find('.js-manager-image');

  $fileInput.on('change', function (e) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === 'string') {
        $img.attr('src', result);
      }
    };
    reader.readAsDataURL(file);
  });

  return $section;
}
