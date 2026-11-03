import $ from 'jquery';

export function createScrollToTopButtonComponent(): JQuery<HTMLElement> {
  const $btn = $(`
    <button
      type="button"
      aria-label="بازگشت به بالای صفحه"
      title="بازگشت به بالا"
      class="js-scroll-top-btn scroll-top-circle is-active"
    >
      <!-- Rising Brown Liquid Container (Strictly pinned to bottom: 0) -->
      <div class="js-liquid-level scroll-top-liquid-level" style="height: 0%;">
        <!-- Back Sloshing Brown Wave -->
        <svg
          class="js-liquid-waves scroll-top-wave-back absolute -top-[10px] left-0 w-[200%] h-[13px] opacity-0 transition-opacity duration-150"
          viewBox="0 0 200 18"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,9 C25,18 25,0 50,9 C75,18 75,0 100,9 C125,18 125,0 150,9 C175,18 175,0 200,9 L200,18 L0,18 Z"
            fill="#6e4b30"
            fill-opacity="0.82"
          ></path>
        </svg>

        <!-- Front Sloshing Espresso-Brown Wave -->
        <svg
          class="js-liquid-waves scroll-top-wave-front absolute -top-[8px] left-0 w-[200%] h-[12px] opacity-0 transition-opacity duration-150"
          viewBox="0 0 200 18"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,9 C25,0 25,18 50,9 C75,0 75,18 100,9 C125,0 125,18 150,9 C175,0 175,18 200,9 L200,18 L0,18 Z"
            fill="#382315"
          ></path>
        </svg>
      </div>

      <!-- Upward Arrow Icon -->
      <span class="js-scroll-arrow relative z-10 text-[#382315] transition-colors duration-200 flex items-center justify-center">
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.3"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M18 15l-6-6-6 6"></path>
        </svg>
      </span>
    </button>
  `);

  const $liquidLevel = $btn.find('.js-liquid-level');
  const $waves = $btn.find('.js-liquid-waves');
  const $arrow = $btn.find('.js-scroll-arrow');

  function updateLiquidFillOnScroll(): void {
    const scrollTop = $(window).scrollTop() || 0;
    const docHeight = $(document).height() || 1;
    const winHeight = $(window).height() || 1;
    const maxScroll = Math.max(1, docHeight - winHeight);

    const ratio = Math.max(0, Math.min(1, scrollTop / maxScroll));

    if (ratio <= 0.005) {
      $liquidLevel.css('height', '0%');
      $waves.removeClass('opacity-100').addClass('opacity-0');
    } else if (ratio >= 0.985) {
      // Completely filled from bottom to top when reaching the end of the page
      $liquidLevel.css('height', '115%');
      $waves.removeClass('opacity-0').addClass('opacity-100');
    } else {
      const fillHeightPercent = ratio * 108;
      $liquidLevel.css('height', `${fillHeightPercent.toFixed(1)}%`);
      $waves.removeClass('opacity-0').addClass('opacity-100');
    }

    // Switch arrow icon color when brown liquid crosses the middle of the circle
    if (ratio >= 0.46) {
      $arrow.removeClass('text-[#382315]').addClass('text-[#f8f4ea]');
    } else {
      $arrow.removeClass('text-[#f8f4ea]').addClass('text-[#382315]');
    }
  }

  $(window)
    .off('scroll.liquidTop resize.liquidTop')
    .on('scroll.liquidTop resize.liquidTop', updateLiquidFillOnScroll);

  // Initial sync after mount
  window.setTimeout(updateLiquidFillOnScroll, 40);

  $btn.on('click', (e) => {
    e.preventDefault();
    $('html, body').stop(true).animate({ scrollTop: 0 }, 520);
  });

  return $btn;
}
