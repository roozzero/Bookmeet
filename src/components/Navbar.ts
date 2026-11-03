import $ from 'jquery';
import type { NavigationLink } from '../types/models.ts';

export interface NavbarProps {
  navigationLinks: NavigationLink[];
  ctaText: string;
  activeHref?: string;
  onNavigate?: (href: string, label: string) => void;
  onLoginClick?: () => void;
}

export function createNavbarComponent(props: NavbarProps): JQuery<HTMLElement> {
  const $header = $(`
    <header dir="rtl" class="w-full px-6 sm:px-10 pt-5 pb-3 flex items-center justify-between gap-8 relative z-30">
      <!-- Zone 1 (Right in RTL): Minimalist Open-Book Brand Mark -->
      <a href="#home" class="js-brand-logo inline-flex items-center gap-2.5 text-[#3b2a1e] hover:opacity-80 transition-opacity shrink-0 whitespace-nowrap" aria-label="باشگاه کتابخوانی بوک میت">
        <svg width="26" height="24" viewBox="0 0 28 26" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M4 4.5H11.5C12.8807 4.5 14 5.61929 14 7V21.5C14 20.3954 13.1046 19.5 12 19.5H4V4.5Z" stroke="#3b2a1e" stroke-width="2.1" stroke-linejoin="round"/>
          <path d="M24 4.5H16.5C15.1193 4.5 14 5.61929 14 7V21.5C14 20.3954 14.8954 19.5 16 19.5H24V4.5Z" stroke="#3b2a1e" stroke-width="2.1" stroke-linejoin="round"/>
          <path d="M11 4.5V11.5L14 9.5L17 11.5V4.5" fill="#ede8d6" stroke="#3b2a1e" stroke-width="1.9" stroke-linejoin="round"/>
          <path d="M9.5 21.5C11 22.8 13 23 14 23C15 23 17 22.8 18.5 21.5" stroke="#3b2a1e" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </a>

      <!-- Zone 2 (Center): 6 Persian Navigation Links -->
      <nav class="flex items-center gap-5 sm:gap-7 md:gap-8 text-[14px] font-medium text-[#4a392b] overflow-x-auto" aria-label="منوی اصلی">
      </nav>

      <!-- Zone 3 (Left in RTL): "ورود به باشگاه" Primary Action Button (Replaces Social Icons) -->
      <div class="flex items-center shrink-0">
        <button
          type="button"
          class="js-club-login-btn club-login-btn px-4 py-2 text-[13px] font-medium whitespace-nowrap shrink-0 cursor-pointer"
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
      <a
        href="${link.href}"
        data-href="${link.href}"
        data-label="${link.label}"
        class="js-nav-link whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
          isInitialActive
            ? 'text-[#23180f] font-semibold border-[#3b2a1e]'
            : 'text-[#4a392b] hover:text-[#23180f] border-transparent'
        }"
      >${link.label}</a>
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
