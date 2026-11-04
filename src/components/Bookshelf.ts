import $ from 'jquery';
import type { FeaturedBook } from '../types/models.ts';

export interface BookshelfProps {
  heroImageUrl: string;
  featuredBooks: FeaturedBook[];
}

interface BubbleLayoutConfig {
  style: string;
  delayMs: number;
  dots: { style: string }[];
}

const BUBBLE_LAYOUTS: Record<string, BubbleLayoutConfig> = {
  'The Little Prince': {
    style: 'top: 13.2%; left: 5.7%; min-width: 112px; text-align: center;',
    delayMs: 120,
    dots: [
      { style: 'width: 9px; height: 9px; bottom: -11px; right: 4px;' },
      { style: 'width: 6px; height: 6px; bottom: -20px; right: -3px;' },
    ],
  },
  'The Alchemist': {
    style: 'top: 5.2%; left: 63.2%; min-width: 110px; text-align: center;',
    delayMs: 260,
    dots: [
      { style: 'width: 9px; height: 9px; bottom: -10px; left: -3px;' },
      { style: 'width: 6px; height: 6px; bottom: -19px; left: -10px;' },
    ],
  },
  'Watership Down': {
    style: 'top: 41.8%; left: 59.5%; min-width: 116px; text-align: center;',
    delayMs: 400,
    dots: [{ style: 'width: 7px; height: 7px; bottom: -7px; right: 24px;' }],
  },
  'The Night Circus': {
    style: 'top: 58.2%; left: 13.4%; min-width: 116px; text-align: center;',
    delayMs: 540,
    dots: [{ style: 'width: 7px; height: 7px; bottom: -7px; right: 24px;' }],
  },
  'The Neverending Story': {
    style: 'top: 72.6%; left: 75.5%; min-width: 148px; text-align: center;',
    delayMs: 680,
    dots: [
      { style: 'width: 9px; height: 9px; top: -10px; left: 2px;' },
      { style: 'width: 6px; height: 6px; top: -19px; left: -5px;' },
    ],
  },
};

export function createBookshelfComponent(props: BookshelfProps): JQuery<HTMLElement> {
  const imageSrc = props.heroImageUrl || '/assets/hero-bookshelf.png';

  const $stage = $(`
    <div class="hero-asset-stage mt-4 sm:mt-6">
      <div class="relative w-full">
        <img
          src="${imageSrc}"
          alt="قفسه کتاب‌های باشگاه کتابخوانی بوک میت"
          width="860"
          height="367"
          loading="eager"
          fetchpriority="high"
          decoding="async"
          class="js-hero-asset-img hero-asset-image"
        />

        <!-- Custom Persian Thought-Bubble Badges Layer -->
        <div class="js-bubbles-layer absolute inset-0"></div>
      </div>
    </div>
  `);

  const $bubblesLayer = $stage.find('.js-bubbles-layer');

  props.featuredBooks.forEach((book) => {
    const config = BUBBLE_LAYOUTS[book.title];
    if (!config) return;

    const $bubble = $(`
      <button
        type="button"
        data-book-title="${book.title}"
        aria-label="${book.persian_title}"
        style="${config.style}"
        class="book-thought-bubble js-thought-bubble"
      >
        <span>${book.persian_title}</span>
      </button>
    `);

    config.dots.forEach((dot) => {
      $bubble.append(`<span class="thought-dot" style="${dot.style}"></span>`);
    });

    // Staggered rotational entrance animation on page load
    window.setTimeout(() => {
      $bubble.addClass('is-entered');
      window.setTimeout(() => {
        $bubble.removeClass('is-entered').addClass('is-visible');
      }, 960);
    }, config.delayMs);

    // Click handler: ONLY play motion animation, no text/popover appears
    $bubble.on('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      $bubble.removeClass('is-entered is-clicked').addClass('is-visible');
      // Force reflow so rapid clicks re-trigger the animation cleanly
      void ($bubble[0] as HTMLElement).offsetWidth;
      $bubble.addClass('is-clicked');
    });

    $bubblesLayer.append($bubble);
  });

  return $stage;
}
