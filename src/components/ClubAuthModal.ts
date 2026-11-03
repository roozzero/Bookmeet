import $ from 'jquery';
import { ApiService } from '../services/api.ts';
import { toPersianDigits } from '../utils/persianNumbers.ts';
import type { ClubMember } from '../types/models.ts';

export interface ClubAuthModalOptions {
  onAuthSuccess?: (member: ClubMember) => void;
}

export function createClubAuthModalComponent(
  options: ClubAuthModalOptions = {}
): JQuery<HTMLElement> {
  const $modal = $(`
    <div dir="rtl" class="js-login-modal hidden fixed inset-0 z-50 bg-[#23180f]/55 backdrop-blur-[2px] flex items-center justify-center p-3">
      <div class="bg-[#faf6ec] border border-[#dcd0bc] rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-3 text-right relative">
        <!-- Modal Header -->
        <div class="flex items-center justify-between border-b border-[#e5dccb] pb-2.5">
          <div class="flex items-center gap-2">
            <img
              src="/assets/Bookmate Persian Logo with Colorful Books.png"
              alt="لوگوی باشگاه کتابخوانی بوک‌میت"
              class="h-7 w-auto object-contain select-none"
            />
            <h2 class="js-auth-modal-title text-sm font-bold text-[#38281b]">
              ورود و عضویت در باشگاه بوک‌میت
            </h2>
          </div>
          <button
            type="button"
            class="js-close-login text-xs font-medium text-[#735e4c] hover:text-[#23180f] bg-[#f0e8d8] hover:bg-[#e5dac5] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            بستن
          </button>
        </div>

        <!-- Mode Switcher Tabs (Login / Register) -->
        <div class="js-auth-tabs grid grid-cols-2 gap-1 bg-[#efe7d6] p-1 rounded-xl border border-[#dfd3be]">
          <button
            type="button"
            data-tab="login"
            class="js-tab-btn py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer bg-[#38281b] text-[#faf6ec] shadow-sm"
          >
            ورود به باشگاه
          </button>
          <button
            type="button"
            data-tab="register"
            class="js-tab-btn py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer text-[#5c4838] hover:text-[#2a1d12]"
          >
            ثبت‌نام در باشگاه
          </button>
        </div>

        <!-- VIEW 1: LOGIN FORM -->
        <form class="js-login-form space-y-2.5" autocomplete="on">
          <div>
            <label class="block text-xs font-semibold text-[#4f3f31] mb-1">
              شماره تلفن همراه
            </label>
            <input
              type="tel"
              name="login_phone"
              required
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
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
                class="js-open-forgot text-[11px] font-semibold text-[#8c5a32] hover:text-[#38281b] underline underline-offset-4 cursor-pointer transition-colors"
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

          <div class="pt-2 flex items-center justify-between gap-2 border-t border-[#e8dfd0]">
            <button
              type="button"
              data-switch-tab="register"
              class="js-switch-to-register text-xs font-semibold text-[#7a5436] hover:text-[#2c1d11] cursor-pointer"
            >
              هنوز عضو نشده‌اید؟ ثبت‌نام
            </button>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="js-close-login px-3 py-1.5 text-xs font-medium text-[#5c4b3c] hover:text-[#23180f] cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                class="js-login-submit club-login-btn px-4 py-2 text-xs font-bold cursor-pointer rounded-xl"
              >
                ورود به حساب
              </button>
            </div>
          </div>
        </form>

        <!-- VIEW 2: REGISTRATION FORM (Compact 2-Column Grid, No Scroll Required) -->
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

          <!-- Row 2: Phone Number & Education -->
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
            <div>
              <label class="block text-xs font-semibold text-[#4f3f31] mb-1">
                تحصیلات <span class="text-[#a16237]">*</span>
              </label>
              <select
                name="education"
                required
                class="w-full px-2.5 py-1.5 text-xs sm:text-sm bg-white border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#6e492d]"
              >
                <option value="" disabled selected>انتخاب مقطع...</option>
                <option value="دیپلم">دیپلم</option>
                <option value="کاردانی">کاردانی</option>
                <option value="کارشناسی">کارشناسی</option>
                <option value="کارشناسی ارشد">کارشناسی ارشد</option>
                <option value="دکتری">دکتری</option>
                <option value="پژوهشگر آزاد / سایر">سایر</option>
              </select>
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

          <div class="pt-2 flex items-center justify-between gap-2 border-t border-[#e8dfd0]">
            <button
              type="button"
              class="js-switch-to-login text-xs font-semibold text-[#7a5436] hover:text-[#2c1d11] cursor-pointer"
            >
              حساب دارید؟ ورود به باشگاه
            </button>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="js-close-login px-3 py-1.5 text-xs font-medium text-[#5c4b3c] hover:text-[#23180f] cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                class="js-register-submit club-login-btn px-4 py-2 text-xs font-bold cursor-pointer rounded-xl"
              >
                تکمیل ثبت‌نام
              </button>
            </div>
          </div>
        </form>

        <!-- VIEW 3: FORGOT PASSWORD FORM -->
        <form class="js-forgot-form hidden space-y-2.5" autocomplete="off">
          <div class="bg-[#f3ece0] border border-[#e2d5c1] rounded-xl p-2.5">
            <h3 class="text-xs font-bold text-[#38281b] mb-0.5">
              بازیابی و بازنشانی رمز عبور
            </h3>
            <p class="text-[11px] text-[#645140] leading-5 text-justify">
              شماره تلفن همراه و رمز عبور جدید خود را وارد نمایید تا رمز حساب شما بازنشانی شود.
            </p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-[#4f3f31] mb-1">
              شماره تلفن همراه
            </label>
            <input
              type="tel"
              name="forgot_phone"
              required
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              class="js-persian-digit-input w-full px-3 py-1.5 text-xs sm:text-sm bg-white border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#6e492d]"
            />
          </div>

          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="block text-xs font-semibold text-[#4f3f31] mb-1">
                رمز عبور جدید
              </label>
              <input
                type="password"
                name="new_password"
                required
                minlength="4"
                placeholder="رمز جدید"
                class="w-full px-2.5 py-1.5 text-xs sm:text-sm bg-white border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#6e492d]"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-[#4f3f31] mb-1">
                تایید رمز عبور جدید
              </label>
              <input
                type="password"
                name="confirm_new_password"
                required
                minlength="4"
                placeholder="تکرار رمز جدید"
                class="w-full px-2.5 py-1.5 text-xs sm:text-sm bg-white border border-[#d5c8b2] rounded-xl text-[#2c1f14] focus:outline-none focus:border-[#6e492d]"
              />
            </div>
          </div>

          <div class="js-forgot-error hidden text-xs text-red-800 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-justify"></div>
          <div class="js-forgot-feedback hidden text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-justify"></div>

          <div class="pt-2 flex items-center justify-between gap-2 border-t border-[#e8dfd0]">
            <button
              type="button"
              class="js-back-to-login text-xs font-semibold text-[#7a5436] hover:text-[#2c1d11] cursor-pointer"
            >
              → بازگشت به فرم ورود
            </button>
            <button
              type="submit"
              class="js-forgot-submit club-login-btn px-4 py-2 text-xs font-bold cursor-pointer rounded-xl"
            >
              ثبت رمز جدید
            </button>
          </div>
        </form>
      </div>
    </div>
  `);

  const $tabsContainer = $modal.find('.js-auth-tabs');
  const $tabButtons = $modal.find('.js-tab-btn');
  const $loginForm = $modal.find('.js-login-form');
  const $registerForm = $modal.find('.js-register-form');
  const $forgotForm = $modal.find('.js-forgot-form');

  function clearNotifications(): void {
    $modal
      .find(
        '.js-login-error, .js-login-feedback, .js-register-error, .js-register-feedback, .js-forgot-error, .js-forgot-feedback'
      )
      .addClass('hidden');
  }

  function switchView(view: 'login' | 'register' | 'forgot'): void {
    clearNotifications();

    if (view === 'forgot') {
      $tabsContainer.addClass('hidden');
      $loginForm.addClass('hidden');
      $registerForm.addClass('hidden');
      $forgotForm.removeClass('hidden');
      return;
    }

    $tabsContainer.removeClass('hidden');
    $forgotForm.addClass('hidden');

    $tabButtons.each(function () {
      const $btn = $(this);
      const tab = $btn.attr('data-tab');
      if (tab === view) {
        $btn
          .addClass('bg-[#38281b] text-[#faf6ec] shadow-sm')
          .removeClass('text-[#5c4838] hover:text-[#2a1d12]');
      } else {
        $btn
          .removeClass('bg-[#38281b] text-[#faf6ec] shadow-sm')
          .addClass('text-[#5c4838] hover:text-[#2a1d12]');
      }
    });

    if (view === 'login') {
      $registerForm.addClass('hidden');
      $loginForm.removeClass('hidden');
    } else {
      $loginForm.addClass('hidden');
      $registerForm.removeClass('hidden');
    }
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

  // Tab button clicks
  $tabButtons.on('click', function () {
    const targetTab = $(this).attr('data-tab') as 'login' | 'register';
    if (targetTab) {
      switchView(targetTab);
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

  // Close modal handler
  $modal.find('.js-close-login').on('click', () => {
    $modal.addClass('hidden');
    clearNotifications();
    switchView('login');
  });

  // Close when clicking backdrop outside modal card
  $modal.on('click', (e) => {
    if ($(e.target).hasClass('js-login-modal')) {
      $modal.addClass('hidden');
      clearNotifications();
      switchView('login');
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
        const welcomeMsg = toPersianDigits(
          `${res.member.first_name} ${res.member.last_name} عزیز، ورود شما به باشگاه کتابخوانی بوک‌میت با موفقیت انجام شد.`
        );
        $loginForm
          .find('.js-login-feedback')
          .text(welcomeMsg)
          .removeClass('hidden');

        if (options.onAuthSuccess) {
          options.onAuthSuccess(res.member);
        }

        window.setTimeout(() => {
          $modal.addClass('hidden');
          clearNotifications();
        }, 1200);
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
    const education = String(
      $registerForm.find('select[name="education"]').val() || ''
    ).trim();
    const password = String(
      $registerForm.find('input[name="password"]').val() || ''
    );
    const confirm_password = String(
      $registerForm.find('input[name="confirm_password"]').val() || ''
    );

    if (password !== confirm_password) {
      $registerForm
        .find('.js-register-error')
        .text('رمز عبور و تایید رمز عبور با یکدیگر مطابقت ندارند.')
        .removeClass('hidden');
      return;
    }

    const $submitBtn = $registerForm.find('.js-register-submit');
    $submitBtn.prop('disabled', true).text('در حال ثبت عضویت...');

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
          `${res.member.first_name} ${res.member.last_name} عزیز، عضویت شما در باشگاه بوک‌میت با موفقیت ثبت شد. خوش آمدید!`
        );
        $registerForm
          .find('.js-register-feedback')
          .text(successMsg)
          .removeClass('hidden');

        if (options.onAuthSuccess) {
          options.onAuthSuccess(res.member);
        }

        window.setTimeout(() => {
          $modal.addClass('hidden');
          clearNotifications();
          ($registerForm[0] as HTMLFormElement).reset();
          switchView('login');
        }, 1400);
      })
      .catch((err: Error) => {
        $registerForm
          .find('.js-register-error')
          .text(toPersianDigits(err.message || 'خطا در ثبت‌نام'))
          .removeClass('hidden');
      })
      .finally(() => {
        $submitBtn.prop('disabled', false).text('تکمیل ثبت‌نام');
      });
  });

  // Handle Forgot Password Form Submit
  $forgotForm.on('submit', (e) => {
    e.preventDefault();
    clearNotifications();

    const phone = toPersianDigits(
      String($forgotForm.find('input[name="forgot_phone"]').val() || '').trim()
    );
    const new_password = String(
      $forgotForm.find('input[name="new_password"]').val() || ''
    );
    const confirm_new_password = String(
      $forgotForm.find('input[name="confirm_new_password"]').val() || ''
    );

    if (new_password !== confirm_new_password) {
      $forgotForm
        .find('.js-forgot-error')
        .text('رمز عبور جدید و تایید رمز عبور جدید با یکدیگر مطابقت ندارند.')
        .removeClass('hidden');
      return;
    }

    const $submitBtn = $forgotForm.find('.js-forgot-submit');
    $submitBtn.prop('disabled', true).text('در حال بازنشانی...');

    ApiService.resetClubPassword({
      phone,
      new_password,
      confirm_new_password,
    })
      .then((res) => {
        $forgotForm
          .find('.js-forgot-feedback')
          .text(
            toPersianDigits(
              res.message ||
                'رمز عبور حساب شما با موفقیت تغییر یافت. در حال انتقال به صفحه ورود...'
            )
          )
          .removeClass('hidden');

        window.setTimeout(() => {
          $loginForm.find('input[name="login_phone"]').val(phone);
          ($forgotForm[0] as HTMLFormElement).reset();
          switchView('login');
        }, 1300);
      })
      .catch((err: Error) => {
        $forgotForm
          .find('.js-forgot-error')
          .text(toPersianDigits(err.message || 'خطا در بازنشانی رمز عبور'))
          .removeClass('hidden');
      })
      .finally(() => {
        $submitBtn.prop('disabled', false).text('ثبت رمز جدید');
      });
  });

  return $modal;
}
