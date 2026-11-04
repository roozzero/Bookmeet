import $ from 'jquery';
import type { NavigationLink } from '../types/models.ts';

export interface NavbarProps {
  navigationLinks: NavigationLink[];
  ctaText: string;
  activeHref?: string;
  isStationaryCta?: boolean;
  onNavigate?: (href: string, label: string) => void;
  onLoginClick?: () => void;
}

export function createNavbarComponent(props: NavbarProps): JQuery<HTMLElement> {
  const logoSrc = '/assets/Bookmate%20Persian%20Logo%20with%20Colorful%20Books.png';
  const ctaMotionClass = props.isStationaryCta ? '' : 'club-login-btn--rocking';

  const $header = $(`
    <header
      dir="rtl"
      class="js-floating-navbar sticky top-0 z-40 w-full px-6 sm:px-10 py-3 flex items-center justify-between gap-6 transition-all duration-200 bg-[#ede8d6]/92 backdrop-blur-md border-b border-transparent"
    >
      <!-- Zone 1 (Right in RTL): Bookmate Persian Logo with Colorful Books -->
      <button
        type="button"
        class="js-brand-logo inline-flex items-center shrink-0 hover:opacity-90 transition-opacity bg-transparent border-0 p-0 cursor-pointer"
        aria-label="باشگاه کتابخوانی بوک میت"
      >
        <img
          src="${logoSrc}"
          alt="لوگوی باشگاه کتابخوانی بوک میت"
          class="h-11 sm:h-13 w-auto object-contain select-none"
        />
      </button>

      <!-- Zone 2 (Center): 6 Persian Navigation Links -->
      <nav
        class="flex items-center gap-5 sm:gap-7 md:gap-8 text-[14px] font-medium text-[#4a392b] overflow-x-auto"
        aria-label="منوی اصلی"
      ></nav>

      <!-- Zone 3 (Left in RTL): Primary Action Button (Stationary in Member Panel, Rocking on Home) -->
      <div class="flex items-center shrink-0">
        <button
          type="button"
          class="js-club-login-btn club-login-btn ${ctaMotionClass} px-4 py-2 text-[13px] font-medium whitespace-nowrap shrink-0 cursor-pointer"
        >
          ${props.ctaText}
        </button>
      </div>
    </header>
  `);

  const $nav = $header.find('nav');
  props.navigationLinks.forEach((link, idx) => {
    const isInitialActive = props.activeHref
      ? props.activeHref === link.href
      : idx === 0;

    const $link = $(`
      <button
        type="button"
        data-href="${link.href}"
        data-label="${link.label}"
        class="js-nav-link bg-transparent whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 cursor-pointer ${
          isInitialActive
            ? 'text-[#23180f] font-semibold border-[#3b2a1e]'
            : 'text-[#4a392b] hover:text-[#23180f] border-transparent'
        }"
      >${link.label}</button>
    `);

    $link.on('click', (e) => {
      e.preventDefault();
      $nav
        .find('.js-nav-link')
        .removeClass('text-[#23180f] font-semibold border-[#3b2a1e]')
        .addClass('text-[#4a392b] border-transparent');
      $link
        .removeClass('text-[#4a392b] border-transparent')
        .addClass('text-[#23180f] font-semibold border-[#3b2a1e]');

      if (props.onNavigate) {
        props.onNavigate(link.href, link.label);
      }
    });

    $nav.append($link);
  });

  // Add subtle border & shadow when scrolling down so the floating navbar stands out cleanly
  function syncNavbarScrollState(): void {
    const scrollTop = $(window).scrollTop() || 0;
    if (scrollTop > 14) {
      $header
        .removeClass('border-transparent')
        .addClass(
          'border-[#dbd0bc] shadow-[0_10px_28px_-14px_rgba(45,29,16,0.16)]'
        );
    } else {
      $header
        .removeClass(
          'border-[#dbd0bc] shadow-[0_10px_28px_-14px_rgba(45,29,16,0.16)]'
        )
        .addClass('border-transparent');
    }
  }

  $(window)
    .off('scroll.floatingNavbar')
    .on('scroll.floatingNavbar', syncNavbarScrollState);
  window.setTimeout(syncNavbarScrollState, 20);

  $header.find('.js-brand-logo').on('click', (e) => {
    e.preventDefault();
    if (props.onNavigate) {
      props.onNavigate('#home', 'صفحه اصلی');
    }
  });

  $header.find('.js-club-login-btn').on('click', (e) => {
    e.preventDefault();
    if (props.onLoginClick) {
      props.onLoginClick();
    }
  });

  return $header;
}
