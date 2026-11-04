import $ from 'jquery';
import { ApiService } from '../services/api.ts';
import { toPersianDigits } from '../utils/persianNumbers.ts';
import type { ClubMember } from '../types/models.ts';

export interface ClubAuthModalOptions {
  onAuthSuccess?: (member: ClubMember) => void;
}

const EDUCATION_OPTIONS = [
  'دیپلم',
  'کاردانی',
  'کارشناسی',
  'کارشناسی ارشد',
  'دکتری',
  'سایر',
];

export function createClubAuthModalComponent(
  options: ClubAuthModalOptions = {}
): JQuery<HTMLElement> {
  const $modal = $(`
    <div dir="rtl" class="js-login-modal hidden fixed inset-0 z-50 bg-[#23180f]/55 backdrop-blur-[2px] flex items-center justify-center p-3 cursor-pointer">
      <div class="js-modal-card bg-[#faf6ec] border border-[#dcd0bc] rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-3.5 text-right relative cursor-default">
        <!-- Modal Header -->
        <div class="flex items-center justify-between border-b border-[#e5dccb] pb-2.5">
          <div class="flex items-center gap-2">
            <img
              src="/assets/Bookmate Persian Logo with Colorful Books.png"
              alt="لوگوی باشگاه کتابخوانی بوک‌میت"
              class="h-7 w-auto object-contain select-none"
            />
            <h2 class="js-auth-modal-title text-sm font-bold text-[#38281b]">
              ورود به باشگاه بوک‌میت
            </h2>
          </div>
          <button
            type="button"
            class="js-close-login bg-transparent hover:bg-transparent text-xs font-semibold text-[#735e4c] hover:text-[#23180f] px-1.5 py-1 transition-colors cursor-pointer"
          >
            بستن
          </button>
        </div>

        <!-- VIEW 1: LOGIN FORM -->
        <form class="js-login-form space-y-3" autocomplete="on">
          <div>
            <label class="block text-xs font-semibold text-[#4f3f31] mb-1">
              شماره تلفن همراه یا نام کاربری
            </label>
            <input
              type="text"
              name="login_phone"
              required
              placeholder="۰۹۱۲۳۴۵۶۷۸۹ یا admin"
              class="js-persian-digit-input w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#6e492d] transition-colors"
            />
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-semibold text-[#4f3f31]">
                رمز عبور
              </label>
              <button
                type="button"
                class="js-open-forgot bg-transparent hover:bg-transparent text-[11px] font-semibold text-[#8c5a32] hover:text-[#38281b] underline underline-offset-4 cursor-pointer transition-colors"
              >
                فراموشی رمز عبور؟
              </button>
            </div>
            <input
              type="password"
              name="login_password"
              required
              placeholder="••••••••"
              class="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#6e492d] transition-colors"
            />
          </div>

          <div class="js-login-error hidden text-xs text-red-800 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-justify"></div>
          <div class="js-login-feedback hidden text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-justify">
            ورود شما به باشگاه کتابخوانی بوک‌میت با موفقیت انجام شد. خوش آمدید!
          </div>

          <div class="pt-2.5 flex items-center justify-between gap-2 border-t border-[#e8dfd0]">
            <button
              type="button"
              class="js-switch-to-register bg-transparent hover:bg-transparent text-xs font-semibold text-[#7a5436] hover:text-[#2c1d11] underline underline-offset-4 cursor-pointer"
            >
              هنوز عضو نشده‌اید؟ ثبت‌نام در باشگاه
            </button>
            <div class="flex items-center gap-3">
              <button
                type="button"
                class="js-close-login bg-transparent hover:bg-transparent px-2 py-1 text-xs font-medium text-[#6e5a49] hover:text-[#23180f] cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                class="js-login-submit bg-transparent hover:bg-transparent border border-[#8c6f56] hover:border-[#23180f] text-[#38281b] hover:text-[#23180f] px-4 py-1.5 text-xs font-bold cursor-pointer rounded-xl transition-colors"
              >
                ورود به حساب
              </button>
            </div>
          </div>
        </form>

        <!-- VIEW 2: REGISTRATION FORM -->
        <form class="js-register-form hidden space-y-2.5" autocomplete="on">
          <!-- Row 1: First Name & Last Name -->
          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="block text-xs font-semibold text-[#4f3f31] mb-1">
                نام <span class="text-[#a16237]">*</span>
              </label>
              <input
                type="text"
                name="first_name"
                required
                placeholder="سهراب"
                class="w-full px-2.5 py-1.5 text-xs sm:text-sm bg-white border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#6e492d]"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-[#4f3f31] mb-1">
                نام خانوادگی <span class="text-[#a16237]">*</span>
              </label>
              <input
                type="text"
                name="last_name"
                required
                placeholder="رستگار"
                class="w-full px-2.5 py-1.5 text-xs sm:text-sm bg-white border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#6e492d]"
              />
            </div>
          </div>

          <!-- Row 2: Phone Number & Custom Styled Education Dropdown -->
          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="block text-xs font-semibold text-[#4f3f31] mb-1">
                شماره تلفن <span class="text-[#a16237]">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                required
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                class="js-persian-digit-input w-full px-2.5 py-1.5 text-xs sm:text-sm bg-white border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#6e492d]"
              />
            </div>

            <!-- Custom Modern Education Dropdown -->
            <div class="js-education-dropdown relative">
              <label class="block text-xs font-semibold text-[#4f3f31] mb-1">
                تحصیلات <span class="text-[#a16237]">*</span>
              </label>
              <input type="hidden" name="education" value="" />
              <button
                type="button"
                class="js-education-trigger w-full px-2.5 py-1.5 text-xs sm:text-sm bg-white hover:bg-[#fdfbf7] border border-[#d5c8b2] focus:border-[#6e492d] rounded-xl text-[#2c1f14] flex items-center justify-between gap-1.5 transition-all cursor-pointer"
              >
                <span class="js-education-label text-[#8a7968] truncate">انتخاب مقطع...</span>
                <svg
                  class="js-education-chevron w-3.5 h-3.5 text-[#7a6451] shrink-0 transition-transform duration-200"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="5 7.5 10 12.5 15 7.5"></polyline>
                </svg>
              </button>

              <!-- Dropdown Menu List -->
              <div class="js-education-menu hidden absolute right-0 left-0 top-full mt-1 z-30 bg-[#faf6ec] border border-[#cfc0a9] rounded-xl shadow-[0_14px_30px_-8px_rgba(45,29,16,0.22)] py-1 overflow-hidden">
                ${EDUCATION_OPTIONS.map(
                  (opt) => `
                  <button
                    type="button"
                    data-value="${opt}"
                    class="js-education-option w-full text-right px-3 py-1.5 text-xs font-medium text-[#3d2c1e] hover:bg-[#ece2cf] hover:text-[#23180f] flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>${opt}</span>
                    <span class="js-education-check opacity-0 text-[#6e492d] text-[11px]">✓</span>
                  </button>
                `
                ).join('')}
              </div>
            </div>
          </div>

          <!-- Row 3: Password & Confirm Password -->
          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="block text-xs font-semibold text-[#4f3f31] mb-1">
                رمز عبور <span class="text-[#a16237]">*</span>
              </label>
              <input
                type="password"
                name="password"
                required
                minlength="4"
                placeholder="حداقل ۴ کاراکتر"
                class="w-full px-2.5 py-1.5 text-xs sm:text-sm bg-white border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#6e492d]"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-[#4f3f31] mb-1">
                تایید رمز عبور <span class="text-[#a16237]">*</span>
              </label>
              <input
                type="password"
                name="confirm_password"
                required
                minlength="4"
                placeholder="تکرار رمز عبور"
                class="w-full px-2.5 py-1.5 text-xs sm:text-sm bg-white border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#6e492d]"
              />
            </div>
          </div>

          <div class="js-register-error hidden text-xs text-red-800 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-justify"></div>
          <div class="js-register-feedback hidden text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-justify">
            ثبت‌نام شما در باشگاه کتابخوانی بوک‌میت با موفقیت انجام شد!
          </div>

          <div class="pt-2.5 flex items-center justify-between gap-2 border-t border-[#e8dfd0]">
            <button
              type="button"
              class="js-switch-to-login bg-transparent hover:bg-transparent text-xs font-semibold text-[#7a5436] hover:text-[#2c1d11] underline underline-offset-4 cursor-pointer"
            >
              حساب دارید؟ ورود به باشگاه
            </button>
            <div class="flex items-center gap-3">
              <button
                type="button"
                class="js-close-login bg-transparent hover:bg-transparent px-2 py-1 text-xs font-medium text-[#6e5a49] hover:text-[#23180f] cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                class="js-register-submit bg-transparent hover:bg-transparent border border-[#8c6f56] hover:border-[#23180f] text-[#38281b] hover:text-[#23180f] px-4 py-1.5 text-xs font-bold cursor-pointer rounded-xl transition-colors"
              >
                ثبت‌نام
              </button>
            </div>
          </div>
        </form>

        <!-- VIEW 3: FORGOT PASSWORD FORM (Phone Only -> SMS Link Message) -->
        <form class="js-forgot-form hidden space-y-3" autocomplete="on">
          <p class="text-xs text-[#645140] leading-6 text-justify">
            شماره تلفن همراه خود را وارد نمایید تا لینک تغییر رمز عبور برای شما پیامک شود.
          </p>

          <div>
            <label class="block text-xs font-semibold text-[#4f3f31] mb-1">
              شماره تلفن همراه
            </label>
            <input
              type="tel"
              name="forgot_phone"
              required
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              class="js-persian-digit-input w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#6e492d]"
            />
          </div>

          <div class="js-forgot-error hidden text-xs text-red-800 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-justify"></div>
          <div class="js-forgot-feedback hidden text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-justify">
            لینک تغییر رمز برای شما پیامک خواهد شد.
          </div>

          <div class="pt-2.5 flex items-center justify-between gap-2 border-t border-[#e8dfd0]">
            <button
              type="button"
              class="js-back-to-login bg-transparent hover:bg-transparent text-xs font-semibold text-[#7a5436] hover:text-[#2c1d11] underline underline-offset-4 cursor-pointer"
            >
              → بازگشت به فرم ورود
            </button>
            <button
              type="submit"
              class="js-forgot-submit bg-transparent hover:bg-transparent border border-[#8c6f56] hover:border-[#23180f] text-[#38281b] hover:text-[#23180f] px-4 py-1.5 text-xs font-bold cursor-pointer rounded-xl transition-colors"
            >
              ارسال لینک تغییر رمز
            </button>
          </div>
        </form>
      </div>
    </div>
  `);

  const $modalTitle = $modal.find('.js-auth-modal-title');
  const $loginForm = $modal.find('.js-login-form');
  const $registerForm = $modal.find('.js-register-form');
  const $forgotForm = $modal.find('.js-forgot-form');

  // Custom Education Dropdown Logic
  const $eduDropdown = $modal.find('.js-education-dropdown');
  const $eduTrigger = $eduDropdown.find('.js-education-trigger');
  const $eduLabel = $eduDropdown.find('.js-education-label');
  const $eduChevron = $eduDropdown.find('.js-education-chevron');
  const $eduMenu = $eduDropdown.find('.js-education-menu');
  const $eduInput = $eduDropdown.find('input[name="education"]');

  function closeEducationDropdown(): void {
    $eduMenu.addClass('hidden');
    $eduChevron.removeClass('rotate-180');
    $eduTrigger.removeClass('border-[#6e492d]');
  }

  $eduTrigger.on('click', (e) => {
    e.stopPropagation();
    const isHidden = $eduMenu.hasClass('hidden');
    if (isHidden) {
      $eduMenu.removeClass('hidden');
      $eduChevron.addClass('rotate-180');
      $eduTrigger.addClass('border-[#6e492d]');
    } else {
      closeEducationDropdown();
    }
  });

  $eduDropdown.find('.js-education-option').on('click', function (e) {
    e.stopPropagation();
    const val = String($(this).attr('data-value') || '');
    $eduInput.val(val);
    $eduLabel.text(val).removeClass('text-[#8a7968]').addClass('text-[#2c1f14] font-medium');
    $eduDropdown.find('.js-education-check').addClass('opacity-0');
    $(this).find('.js-education-check').removeClass('opacity-0');
    closeEducationDropdown();
  });

  // Close custom dropdown when clicking anywhere inside the modal card outside the dropdown
  $modal.find('.js-modal-card').on('click', (e) => {
    if ($(e.target).closest('.js-education-dropdown').length === 0) {
      closeEducationDropdown();
    }
  });

  function clearNotifications(): void {
    $modal
      .find(
        '.js-login-error, .js-login-feedback, .js-register-error, .js-register-feedback, .js-forgot-error, .js-forgot-feedback'
      )
      .addClass('hidden');
  }

  function switchView(view: 'login' | 'register' | 'forgot'): void {
    clearNotifications();
    closeEducationDropdown();

    if (view === 'forgot') {
      $modalTitle.text('فراموشی رمز عبور');
      $loginForm.addClass('hidden');
      $registerForm.addClass('hidden');
      $forgotForm.removeClass('hidden');
      return;
    }

    if (view === 'login') {
      $modalTitle.text('ورود به باشگاه بوک‌میت');
      $registerForm.addClass('hidden');
      $forgotForm.addClass('hidden');
      $loginForm.removeClass('hidden');
    } else {
      $modalTitle.text('ثبت‌نام در باشگاه بوک‌میت');
      $loginForm.addClass('hidden');
      $forgotForm.addClass('hidden');
      $registerForm.removeClass('hidden');
    }
  }

  function closeModal(): void {
    $modal.addClass('hidden');
    clearNotifications();
    closeEducationDropdown();
    switchView('login');
  }

  // Convert any typed digits in phone fields to Persian digits in real time
  $modal.find('.js-persian-digit-input').on('input', function () {
    const $input = $(this);
    const val = String($input.val() || '');
    const converted = toPersianDigits(val);
    if (val !== converted) {
      $input.val(converted);
    }
  });

  $modal.find('.js-switch-to-register').on('click', () => {
    switchView('register');
  });

  $modal.find('.js-switch-to-login, .js-back-to-login').on('click', () => {
    switchView('login');
  });

  $modal.find('.js-open-forgot').on('click', () => {
    const loginPhone = String($loginForm.find('input[name="login_phone"]').val() || '');
    if (loginPhone) {
      $forgotForm.find('input[name="forgot_phone"]').val(toPersianDigits(loginPhone));
    }
    switchView('forgot');
  });

  // Close modal via close/cancel buttons
  $modal.find('.js-close-login').on('click', () => {
    closeModal();
  });

  // Close modal when clicking anywhere on the page outside the modal card
  $modal.on('mousedown', (e) => {
    if ($(e.target).closest('.js-modal-card').length === 0) {
      closeModal();
    }
  });

  // Handle Login Form Submit
  $loginForm.on('submit', (e) => {
    e.preventDefault();
    clearNotifications();

    const phone = toPersianDigits(
      String($loginForm.find('input[name="login_phone"]').val() || '').trim()
    );
    const password = String(
      $loginForm.find('input[name="login_password"]').val() || ''
    );

    const $submitBtn = $loginForm.find('.js-login-submit');
    $submitBtn.prop('disabled', true).text('در حال بررسی...');

    ApiService.loginClubMember({ phone, password })
      .then((res) => {
        const welcomeMsg =
          res.member.role === 'admin'
            ? toPersianDigits(
                `${res.member.first_name} ${res.member.last_name} عزیز، ورود شما به پنل مدیریت باشگاه با موفقیت انجام شد.`
              )
            : toPersianDigits(
                `${res.member.first_name} ${res.member.last_name} عزیز، ورود شما به باشگاه کتابخوانی بوک‌میت با موفقیت انجام شد.`
              );
        $loginForm
          .find('.js-login-feedback')
          .text(welcomeMsg)
          .removeClass('hidden');

        window.setTimeout(() => {
          closeModal();
          if (options.onAuthSuccess) {
            options.onAuthSuccess(res.member);
          }
        }, 450);
      })
      .catch((err: Error) => {
        $loginForm
          .find('.js-login-error')
          .text(toPersianDigits(err.message || 'خطا در ورود به حساب کاربری'))
          .removeClass('hidden');
      })
      .finally(() => {
        $submitBtn.prop('disabled', false).text('ورود به حساب');
      });
  });

  // Handle Registration Form Submit
  $registerForm.on('submit', (e) => {
    e.preventDefault();
    clearNotifications();

    const first_name = String(
      $registerForm.find('input[name="first_name"]').val() || ''
    ).trim();
    const last_name = String(
      $registerForm.find('input[name="last_name"]').val() || ''
    ).trim();
    const phone = toPersianDigits(
      String($registerForm.find('input[name="phone"]').val() || '').trim()
    );
    const education = String($eduInput.val() || '').trim();
    const password = String(
      $registerForm.find('input[name="password"]').val() || ''
    );
    const confirm_password = String(
      $registerForm.find('input[name="confirm_password"]').val() || ''
    );

    if (!education) {
      $registerForm
        .find('.js-register-error')
        .text('لطفاً مقطع تحصیلی خود را انتخاب نمایید.')
        .removeClass('hidden');
      return;
    }

    if (password !== confirm_password) {
      $registerForm
        .find('.js-register-error')
        .text('رمز عبور و تایید رمز عبور با یکدیگر مطابقت ندارند.')
        .removeClass('hidden');
      return;
    }

    const $submitBtn = $registerForm.find('.js-register-submit');
    $submitBtn.prop('disabled', true).text('در حال ثبت...');

    ApiService.registerClubMember({
      first_name,
      last_name,
      phone,
      education,
      password,
      confirm_password,
    })
      .then((res) => {
        const successMsg = toPersianDigits(
          `${res.member.first_name} ${res.member.last_name} عزیز، عضویت شما در باشگاه بوک‌میت با موفقیت ثبت شد. در حال ورود به پنل کاربری...`
        );
        $registerForm
          .find('.js-register-feedback')
          .text(successMsg)
          .removeClass('hidden');

        window.setTimeout(() => {
          ($registerForm[0] as HTMLFormElement).reset();
          $eduInput.val('');
          $eduLabel
            .text('انتخاب مقطع...')
            .addClass('text-[#8a7968]')
            .removeClass('text-[#2c1f14] font-medium');
          $eduDropdown.find('.js-education-check').addClass('opacity-0');
          closeModal();
          if (options.onAuthSuccess) {
            options.onAuthSuccess(res.member);
          }
        }, 550);
      })
      .catch((err: Error) => {
        $registerForm
          .find('.js-register-error')
          .text(toPersianDigits(err.message || 'خطا در ثبت‌نام'))
          .removeClass('hidden');
      })
      .finally(() => {
        $submitBtn.prop('disabled', false).text('ثبت‌نام');
      });
  });

  // Handle Forgot Password Form Submit (Phone Only -> SMS Link Message)
  $forgotForm.on('submit', (e) => {
    e.preventDefault();
    clearNotifications();

    const phone = toPersianDigits(
      String($forgotForm.find('input[name="forgot_phone"]').val() || '').trim()
    );

    const $submitBtn = $forgotForm.find('.js-forgot-submit');
    $submitBtn.prop('disabled', true).text('در حال ارسال...');

    ApiService.resetClubPassword({ phone })
      .then((res) => {
        $forgotForm
          .find('.js-forgot-feedback')
          .text(
            toPersianDigits(
              res.message || 'لینک تغییر رمز برای شما پیامک خواهد شد.'
            )
          )
          .removeClass('hidden');
      })
      .catch(() => {
        $forgotForm
          .find('.js-forgot-feedback')
          .text('لینک تغییر رمز برای شما پیامک خواهد شد.')
          .removeClass('hidden');
      })
      .finally(() => {
        $submitBtn.prop('disabled', false).text('ارسال لینک تغییر رمز');
      });
  });

  return $modal;
}
