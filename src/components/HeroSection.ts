import $ from 'jquery';
import type { FeaturedBook, HeroSettings } from '../types/models.ts';
import { createBookshelfComponent } from './Bookshelf.ts';

export interface HeroSectionProps {
  heroSettings: HeroSettings;
  featuredBooks: FeaturedBook[];
}

export function createHeroSectionComponent(
  props: HeroSectionProps
): JQuery<HTMLElement> {
  const $section = $(`
    <main dir="rtl" class="flex-1 flex flex-col justify-center relative z-20 pb-6">
      <section class="w-full max-w-[1060px] mx-auto px-6 pt-8 sm:pt-12 flex flex-col items-center text-center">
        <h1 class="hero-headline text-[28px] sm:text-[38px] md:text-[46px] tracking-tight max-w-[780px]">
          ${props.heroSettings.headline}
        </h1>

        <p class="mt-4 text-[14px] sm:text-[15.5px] leading-[1.85] text-[#564536] max-w-[560px] font-normal text-justify [text-align-last:center]">
          ${props.heroSettings.subtitle_line_1} ${props.heroSettings.subtitle_line_2}
        </p>

        <!-- Uploaded High-Res Bookshelf Asset with Animated Persian Thought-Bubbles -->
        <div class="js-bookshelf-mount w-full mt-4 sm:mt-6"></div>
      </section>
    </main>
  `);

  // Mount Bookshelf Asset Component
  const $bookshelf = createBookshelfComponent({
    heroImageUrl: props.heroSettings.hero_image_url,
    featuredBooks: props.featuredBooks,
  });
  $section.find('.js-bookshelf-mount').append($bookshelf);

  return $section;
}
