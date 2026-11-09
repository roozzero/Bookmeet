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
      class="js-floating-navbar sticky top-0 z-40 w-full px-4 sm:px-8 md:px-10 py-3 transition-all duration-200 bg-[#ede8d6]/95 backdrop-blur-md border-b border-transparent"
    >
      <div class="flex items-center justify-between gap-3 sm:gap-6">
        <!-- Zone 1 (Right in RTL): Ketboshka Logo + Mobile Menu Toggle -->
        <div class="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            class="js-mobile-nav-toggle lg:hidden w-10 h-10 rounded-xl bg-[#f7f2e6] border border-[#d6c8b2] text-[#3b2a1e] flex items-center justify-center cursor-pointer hover:bg-[#ebe1cd] transition-colors"
            aria-label="باز کردن منوی اصلی"
            aria-expanded="false"
          >
            <svg class="js-mobile-nav-icon-open w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
            <svg class="js-mobile-nav-icon-close hidden w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <button
            type="button"
            class="js-brand-logo inline-flex items-center shrink-0 hover:opacity-90 transition-opacity bg-transparent border-0 p-0 cursor-pointer"
            aria-label="باشگاه کتابخوانی کتابوشکا"
          >
            <img
              src="${logoSrc}"
              alt="لوگوی باشگاه کتابخوانی کتابوشکا"
              class="h-10 sm:h-12 md:h-13 w-auto object-contain select-none"
            />
          </button>
        </div>

        <!-- Zone 2 (Center on Desktop): Persian Navigation Links -->
        <nav
          class="js-desktop-nav hidden lg:flex items-center gap-5 xl:gap-8 text-[14px] font-medium text-[#4a392b] overflow-x-auto"
          aria-label="منوی اصلی"
        ></nav>

        <!-- Zone 3 (Left in RTL): Primary Action Button -->
        <div class="flex items-center shrink-0">
          <button
            type="button"
            class="js-club-login-btn club-login-btn ${ctaMotionClass} px-3.5 sm:px-4 py-2 text-[12.5px] sm:text-[13px] font-medium whitespace-nowrap shrink-0 cursor-pointer"
          >
            ${props.ctaText}
          </button>
        </div>
      </div>

      <!-- Collapsible Mobile Navigation Drawer -->
      <nav
        class="js-mobile-nav-drawer hidden lg:hidden mt-3 pt-3 border-t border-[#d8ccb6] grid grid-cols-2 sm:grid-cols-4 gap-2"
        aria-label="منوی موبایل"
      ></nav>
    </header>
  `);

  const $desktopNav = $header.find('.js-desktop-nav');
  const $mobileDrawer = $header.find('.js-mobile-nav-drawer');

  function closeMobileDrawer(): void {
    $mobileDrawer.addClass('hidden');
    $header.find('.js-mobile-nav-toggle').attr('aria-expanded', 'false');
    $header.find('.js-mobile-nav-icon-open').removeClass('hidden');
    $header.find('.js-mobile-nav-icon-close').addClass('hidden');
  }

  $header.find('.js-mobile-nav-toggle').on('click', (e) => {
    e.preventDefault();
    const isHidden = $mobileDrawer.hasClass('hidden');
    if (isHidden) {
      $mobileDrawer.removeClass('hidden');
      $header.find('.js-mobile-nav-toggle').attr('aria-expanded', 'true');
      $header.find('.js-mobile-nav-icon-open').addClass('hidden');
      $header.find('.js-mobile-nav-icon-close').removeClass('hidden');
    } else {
      closeMobileDrawer();
    }
  });

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

    const $mobileLink = $(`
      <button
        type="button"
        data-href="${link.href}"
        data-label="${link.label}"
        class="js-mobile-nav-link px-3 py-2.5 rounded-xl text-right text-[13px] font-medium transition-colors cursor-pointer ${
          isInitialActive
            ? 'bg-[#3b2a1e] text-[#faf6ec] font-semibold'
            : 'bg-[#f7f2e6] text-[#3b2a1e] hover:bg-[#e8decb] border border-[#ded2bc]'
        }"
      >${link.label}</button>
    `);

    const handleNavClick = (e: JQuery.ClickEvent) => {
      e.preventDefault();
      $desktopNav
        .find('.js-nav-link')
        .removeClass('text-[#23180f] font-semibold border-[#3b2a1e]')
        .addClass('text-[#4a392b] border-transparent');
      $desktopNav
        .find(`.js-nav-link[data-href="${link.href}"]`)
        .removeClass('text-[#4a392b] border-transparent')
        .addClass('text-[#23180f] font-semibold border-[#3b2a1e]');

      $mobileDrawer
        .find('.js-mobile-nav-link')
        .removeClass('bg-[#3b2a1e] text-[#faf6ec] font-semibold')
        .addClass('bg-[#f7f2e6] text-[#3b2a1e] border border-[#ded2bc]');
      $mobileDrawer
        .find(`.js-mobile-nav-link[data-href="${link.href}"]`)
        .removeClass('bg-[#f7f2e6] text-[#3b2a1e] border border-[#ded2bc]')
        .addClass('bg-[#3b2a1e] text-[#faf6ec] font-semibold');

      closeMobileDrawer();

      if (props.onNavigate) {
        props.onNavigate(link.href, link.label);
      }
    };

    $link.on('click', handleNavClick);
    $mobileLink.on('click', handleNavClick);

    $desktopNav.append($link);
    $mobileDrawer.append($mobileLink);
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
    closeMobileDrawer();
    if (props.onNavigate) {
      props.onNavigate('#home', 'صفحه اصلی');
    }
  });

  $header.find('.js-club-login-btn').on('click', (e) => {
    e.preventDefault();
    closeMobileDrawer();
    if (props.onLoginClick) {
      props.onLoginClick();
    }
  });

  return $header;
}
