import $ from 'jquery';
import type { AboutClubData } from '../types/models.ts';
import { parseStatString, toPersianDigits } from '../utils/persianNumbers.ts';

export interface AboutClubSectionProps {
  aboutClub: AboutClubData;
}

export function createAboutClubSectionComponent(
  props: AboutClubSectionProps
): JQuery<HTMLElement> {
  const { aboutClub } = props;

  const stat1 = parseStatString(aboutClub.stat_1_value);
  const stat2 = parseStatString(aboutClub.stat_2_value);
  const stat3 = parseStatString(aboutClub.stat_3_value);

  const $section = $(`
    <section
      id="about-club"
      dir="rtl"
      aria-labelledby="about-club-heading"
      class="w-full max-w-[1140px] mx-auto px-6 sm:px-10 py-16 sm:py-24 border-t border-[#ddd4c0]"
    >
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
        <!-- Right Column in RTL: Editorial Kicker, Heading, Two-Paragraph Justified Intro & Animated Metrics -->
        <div class="lg:col-span-7 flex flex-col justify-between text-right space-y-6">
          <div class="space-y-4">
            <div class="text-xs font-medium text-[#755f4b] tracking-normal">
              ${toPersianDigits(aboutClub.section_kicker)}
            </div>

            <h2
              id="about-club-heading"
              class="text-[24px] sm:text-[32px] font-bold text-[#38281b] leading-[1.38] text-balance"
            >
              ${toPersianDigits(aboutClub.title)}
            </h2>

            <div class="space-y-4 pt-2 text-[14.5px] sm:text-[15.5px] leading-[2.05] text-[#4e3e30] font-normal text-justify">
              <p class="js-about-p1 text-justify" style="text-align: justify; text-justify: inter-word;">
                ${toPersianDigits(aboutClub.paragraph_1)}
              </p>
              <p class="js-about-p2 text-justify" style="text-align: justify; text-justify: inter-word;">
                ${toPersianDigits(aboutClub.paragraph_2)}
              </p>
            </div>
          </div>

          <!-- Clean Unboxed Editorial Metrics Row with Incremental Motion Graphics -->
          <div class="js-about-stats pt-6 border-t border-[#dbd1bd] grid grid-cols-3 gap-6">
            <div>
              <div
                class="js-stat-counter text-xl sm:text-2xl font-bold text-[#38281b] tabular-nums"
                data-prefix="${stat1.prefix}"
                data-target="${stat1.targetValue}"
                data-suffix="${stat1.suffix}"
              >
                ${stat1.prefix}۰${stat1.suffix}
              </div>
              <div class="text-xs text-[#695645] mt-1">
                ${toPersianDigits(aboutClub.stat_1_label)}
              </div>
            </div>

            <div>
              <div
                class="js-stat-counter text-xl sm:text-2xl font-bold text-[#38281b] tabular-nums"
                data-prefix="${stat2.prefix}"
                data-target="${stat2.targetValue}"
                data-suffix="${stat2.suffix}"
              >
                ${stat2.prefix}۰${stat2.suffix}
              </div>
              <div class="text-xs text-[#695645] mt-1">
                ${toPersianDigits(aboutClub.stat_2_label)}
              </div>
            </div>

            <div>
              <div
                class="js-stat-counter text-xl sm:text-2xl font-bold text-[#38281b] tabular-nums"
                data-prefix="${stat3.prefix}"
                data-target="${stat3.targetValue}"
                data-suffix="${stat3.suffix}"
              >
                ${stat3.prefix}۰${stat3.suffix}
              </div>
              <div class="text-xs text-[#695645] mt-1">
                ${toPersianDigits(aboutClub.stat_3_label)}
              </div>
            </div>
          </div>
        </div>

        <!-- Left Column in RTL: Modern Architectural Image Frame Showcase -->
        <div class="lg:col-span-5 flex flex-col">
          <div class="relative w-full h-full min-h-[320px] sm:min-h-[380px] rounded-2xl overflow-hidden border border-[#d5cab6] bg-[#e4dcc8] flex flex-col justify-end group">
            <img
              src="${aboutClub.image_url}"
              alt="${toPersianDigits(aboutClub.image_caption)}"
              referrerpolicy="no-referrer"
              class="js-about-image absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />

            <div class="relative z-10 bg-gradient-to-t from-[#241911]/85 via-[#241911]/40 to-transparent p-5 pt-14 flex items-end justify-between gap-4">
              <div class="text-right">
                <p class="text-xs font-medium text-[#f5efe4] leading-relaxed text-justify">
                  ${toPersianDigits(aboutClub.image_caption)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `);

  function runStatCountersAnimation() {
    $section.find('.js-stat-counter').each(function () {
      const $el = $(this);
      const prefix = String($el.attr('data-prefix') || '');
      const suffix = String($el.attr('data-suffix') || '');
      const target = Number($el.attr('data-target') || 0);

      $({ countVal: 0 }).animate(
        { countVal: target },
        {
          duration: 1700,
          easing: 'swing',
          step(now) {
            const current = Math.floor(now);
            $el.text(`${prefix}${toPersianDigits(current)}${suffix}`);
          },
          complete() {
            $el.text(`${prefix}${toPersianDigits(target)}${suffix}`);
          },
        }
      );
    });
  }

  // Trigger incremental counter animation when section enters viewport
  const sectionEl = $section[0];
  if (sectionEl && 'IntersectionObserver' in window) {
    let hasAnimated = false;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            hasAnimated = true;
            runStatCountersAnimation();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(sectionEl);
  } else {
    window.setTimeout(runStatCountersAnimation, 300);
  }

  return $section;
}
