import $ from 'jquery';
import type { AboutClubData } from '../types/models.ts';

export interface AboutClubSectionProps {
  aboutClub: AboutClubData;
}

export function createAboutClubSectionComponent(
  props: AboutClubSectionProps
): JQuery<HTMLElement> {
  const { aboutClub } = props;

  const $section = $(`
    <section
      id="about-club"
      dir="rtl"
      aria-labelledby="about-club-heading"
      class="w-full max-w-[1140px] mx-auto px-6 sm:px-10 py-16 sm:py-24 border-t border-[#ddd4c0]"
    >
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
        <!-- Right Column in RTL: Editorial Kicker, Heading, Two-Paragraph Justified Intro & Unboxed Metrics -->
        <div class="lg:col-span-7 flex flex-col justify-between text-right space-y-6">
          <div class="space-y-4">
            <div class="text-xs font-medium text-[#755f4b] tracking-normal">
              ${aboutClub.section_kicker}
            </div>

            <h2
              id="about-club-heading"
              class="text-[24px] sm:text-[32px] font-bold text-[#38281b] leading-[1.38] text-balance"
            >
              ${aboutClub.title}
            </h2>

            <div class="space-y-4 pt-2 text-[14.5px] sm:text-[15.5px] leading-[2.05] text-[#4e3e30] font-normal text-justify">
              <p class="js-about-p1 text-justify">
                ${aboutClub.paragraph_1}
              </p>
              <p class="js-about-p2 text-justify">
                ${aboutClub.paragraph_2}
              </p>
            </div>
          </div>

          <!-- Clean Unboxed Editorial Metrics Row -->
          <div class="pt-6 border-t border-[#dbd1bd] grid grid-cols-3 gap-6">
            <div>
              <div class="text-xl sm:text-2xl font-bold text-[#38281b] tabular-nums">
                ${aboutClub.stat_1_value}
              </div>
              <div class="text-xs text-[#695645] mt-1">
                ${aboutClub.stat_1_label}
              </div>
            </div>

            <div>
              <div class="text-xl sm:text-2xl font-bold text-[#38281b] tabular-nums">
                ${aboutClub.stat_2_value}
              </div>
              <div class="text-xs text-[#695645] mt-1">
                ${aboutClub.stat_2_label}
              </div>
            </div>

            <div>
              <div class="text-xl sm:text-2xl font-bold text-[#38281b] tabular-nums">
                ${aboutClub.stat_3_value}
              </div>
              <div class="text-xs text-[#695645] mt-1">
                ${aboutClub.stat_3_label}
              </div>
            </div>
          </div>
        </div>

        <!-- Left Column in RTL: Modern Architectural Image Frame Showcase -->
        <div class="lg:col-span-5 flex flex-col">
          <div class="relative w-full h-full min-h-[320px] sm:min-h-[380px] rounded-2xl overflow-hidden border border-[#d5cab6] bg-[#e4dcc8] flex flex-col justify-end group">
            <img
              src="${aboutClub.image_url}"
              alt="${aboutClub.image_caption}"
              referrerpolicy="no-referrer"
              class="js-about-image absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />

            <div class="relative z-10 bg-gradient-to-t from-[#241911]/85 via-[#241911]/40 to-transparent p-5 pt-14 flex items-end justify-between gap-4">
              <div class="text-right">
                <p class="text-xs font-medium text-[#f5efe4] leading-relaxed text-justify">
                  ${aboutClub.image_caption}
                </p>
              </div>

              <label
                class="px-3 py-1.5 text-[11.5px] font-medium text-[#f5efe4] border border-[#f5efe4]/40 hover:border-[#f5efe4] hover:bg-[#f5efe4]/10 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="جایگزینی تصویر بخش درباره باشگاه"
              >
                <span>تغییر تصویر</span>
                <input
                  type="file"
                  accept="image/*"
                  class="js-about-file-input hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </section>
  `);

  const $fileInput = $section.find('.js-about-file-input');
  const $img = $section.find('.js-about-image');

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
