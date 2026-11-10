import $ from 'jquery';
import './styles/main.css';
import { ApiService } from './services/api.ts';
import { createNavbarComponent } from './components/Navbar.ts';
import { createHeroSectionComponent } from './components/HeroSection.ts';
import { createAboutClubSectionComponent } from './components/AboutClubSection.ts';
import { createAboutManagerSectionComponent } from './components/AboutManagerSection.ts';
import {
  createLibrarySectionComponent,
  createLibraryBookDetailPageComponent,
  mapSessionToEventCard,
  type ClubEventDetailItem,
} from './components/LibrarySection.ts';
import {
  createCoursesSectionComponent,
  mapClassToCourseCard,
  type RussianCourseCard,
} from './components/CoursesSection.ts';
import { createCourseDetailPageComponent } from './components/CourseDetailPage.ts';
import { createEventDetailPageComponent } from './components/EventDetailPage.ts';
import { createBlogSectionComponent } from './components/BlogSection.ts';
import { createBlogPostPageComponent } from './components/BlogPostPage.ts';
import { createContactSectionComponent } from './components/ContactSection.ts';
import { createScrollToTopButtonComponent } from './components/ScrollToTopButton.ts';
import { createClubAuthModalComponent } from './components/ClubAuthModal.ts';
import {
  createMemberPanelPageComponent,
  type PanelTabKey,
} from './components/MemberPanelPage.ts';
import {
  createAdminPanelPageComponent,
  type AdminTabKey,
} from './components/AdminPanelPage.ts';
import type {
  AdminPanelPayload,
  BlogPost,
  BootstrapPayload,
  ClubMember,
  LibraryBook,
  MemberPanelPayload,
} from './types/models.ts';

const ACTIVE_ROUTE_STORAGE_KEY = 'bookmeet_active_route';

const FALLBACK_BOOTSTRAP: BootstrapPayload = {
  navigationLinks: [
    { id: 1, label: 'صفحه اصلی', href: '#home', sort_order: 1, is_active: 1 },
    { id: 2, label: 'درباره باشگاه', href: '#about-club', sort_order: 2, is_active: 1 },
    { id: 3, label: 'درباره من', href: '#about-me', sort_order: 3, is_active: 1 },
    { id: 4, label: 'رویدادها', href: '#events', sort_order: 4, is_active: 1 },
    { id: 5, label: 'کتابخانه', href: '#library', sort_order: 5, is_active: 1 },
    { id: 6, label: 'دوره ها', href: '#courses', sort_order: 6, is_active: 1 },
    { id: 7, label: 'وبلاگ', href: '#blog', sort_order: 7, is_active: 1 },
    { id: 8, label: 'ارتباط با ما', href: '#contact', sort_order: 8, is_active: 1 },
  ],
  heroSettings: {
    id: 1,
    headline: 'به باشگاه کتابخوانی کتابوشکا خوش آمدید',
    subtitle_line_1:
      'بعضی جهان‌ها تنها زمانی جان می‌گیرند که از خواندن دست بکشید و به تماشا بنشینید.',
    subtitle_line_2:
      'این روایت‌ها برگرفته از کتاب‌هایی هستند که هرگز ما را رها نکرده‌اند.',
    nav_cta_text: 'ورود به باشگاه',
    nav_cta_target: '#login-club',
    hero_image_url: '/assets/hero-bookshelf.png',
    audio_progress_percent: 100,
  },
  featuredBooks: [],
  aboutClub: {
    id: 1,
    section_kicker: '۰۱ · درباره باشگاه کتابخوانی کتابوشکا',
    title: 'جایی برای زیستن در جهانِ کتاب‌هایی که فراموش نمی‌شوند',
    paragraph_1:
      'باشگاه کتابخوانی کتابوشکا با هدف شکل‌دادن به فضایی صمیمی، عمیق و اندیشه‌ورز برای علاقه‌مندان به ادبیات داستانی و آثار ماندگار جهان راه‌اندازی شده است. ما در این باشگاه تنها به ورق زدن صفحه‌ها بسنده نمی‌کنیم؛ بلکه هر کتاب را دریچه‌ای تازه برای گفت‌وگو، کشف لایه‌های پنهان روایت و هم‌نشینی با ذهن‌های کنجکاوی می‌دانیم که دغدغه فهم عمیق‌تر زندگی و هنر داستان‌گویی را دارند.',
    paragraph_2:
      'در نشست‌های دوره‌ای و حلقه‌های مطالعاتی کتابوشکا، اعضا گرد هم می‌آیند تا ضمن واکاوی ساختار، شخصیت‌پردازی و درون‌مایه‌های فلسفی آثار برگزیده، تجربه‌های زیسته و برداشت‌های شخصی خود را به اشتراک بگذارند. چه خواننده‌ای حرفه‌ای باشید و چه به‌تازگی قدم در مسیر مطالعه جدی گذاشته باشید، کتابوشکا خانه‌ای الهام‌بخش برای تداوم عادت مطالعه و ساختن خاطراتی مشترک از جهان کتاب‌هاست.',
    image_url: '/assets/about-club.png',
    image_caption: 'نشست‌های هم‌خوانی و بررسی نسخه‌های ماندگار ادبی در باشگاه کتابوشکا',
    stat_1_value: '۰',
    stat_1_label: 'نشست نقد و هم‌خوانی',
    stat_2_value: '۰',
    stat_2_label: 'عضو فعال باشگاه',
    stat_3_value: '۰',
    stat_3_label: 'شاهکار ادبی بررسی‌شده',
  },
  aboutManager: {
    id: 1,
    section_kicker: '۰۲ · معرفی مدیر و بنیان‌گذار باشگاه',
    full_name: 'سهراب رستگار',
    role_title:
      'پژوهشگر ادبیات تطبیقی، منتقد ادبی و بنیان‌گذار باشگاه کتابخوانی کتابوشکا',
    bio_paragraph_1:
      'سهراب رستگار بیش از دوازده سال است که در حوزه نقد ادبی، روایت‌شناسی و برگزاری کارگاه‌های تخصصی خوانش خلاق فعالیت می‌کند. او پس از سال‌ها پژوهش در زمینه ادبیات کلاسیک و معاصر جهان، باشگاه کتابخوانی کتابوشکا را با این باور بنیان گذاشت که مطالعه زمانی به تجربه‌ای دگرگون‌کننده بدل می‌شود که در بستر گفت‌وگو و تبادل نگاه‌ها جریان یابد. رویکرد او در هدایت نشست‌ها، پیوند زدن میان نظریه ادبی و تجربه‌های ملموس زندگی روزمره است تا هر خواننده بتواند صدای ویژه خود را در مواجهه با متن بیابد.',
    bio_paragraph_2:
      'او تاکنون میزبان دهه‌ها نشست تحلیل رمان، بررسی نسخه‌های مصور شاهکارهای ادبی و گفت‌وگو با مترجمان و نویسندگان برجسته بوده است. دغدغه اصلی او در کتابوشکا، احیای فرهنگ خواندنِ دقیق و آهسته در روزگاری پرشتاب و ایجاد پیوندی پایدار میان دوستداران کتاب است؛ جایی که هر اثر نه یک کالای مصرفی، بلکه جهانی زنده برای کاوش و هم‌اندیشی به شمار می‌آید.',
    quote_text:
      '«کتاب‌ها زمانی به راستی آغاز می‌شوند که آخرین صفحه‌شان را می‌بندیم و درباره آنچه در ما دگرگون کرده‌اند با یکدیگر سخن می‌گوییم.»',
    image_url: '/assets/manager-portrait.png',
    credentials_line:
      'دکتری ادبیات تطبیقی · ۱۲ سال تجربه تسهیل‌گری نشست‌های کتاب · نویسنده و پژوهشگر روایت',
  },
  libraryBooks: [],
  libraryCategories: [],
  publicSessions: [],
  publicClasses: [],
  approvedComments: [],
  blogPosts: [],
  contactInfo: {
    id: 1,
    section_kicker: '۰۵ · ارتباط با ما و عضویت در حلقه‌های مطالعاتی',
    title: 'صدای شما، آغازگر گفت‌وگوهای تازه در باشگاه کتابوشکا است',
    description:
      'اگر درباره شیوه برگزاری نشست‌های هفتگی، پیشنهاد کتاب برای دوره‌های آینده، همکاری در نگارش جستارهای وبلاگ یا عضویت در حلقه‌های مطالعاتی کتابوشکا پرسشی دارید، پیام خود را برای ما ارسال کنید. دبیرخانه باشگاه در کوتاه‌ترین زمان پاسخگوی خواهد بود.',
    address: 'تهران، خیابان کریم‌خان زند، خیابان ایرانشهر، خانه فرهنگ و ادبیات کتابوشکا، پلاک ۴۲',
    meeting_hours: 'نشست‌های حضوری: چهارشنبه‌ها ساعت ۱۸ تا ۲۰ · نشست‌های برخط: جمعه‌ها ساعت ۱۹',
    email: 'hello@ketboshka.ir',
    phone: '۰۲۱-۸۸۹۴۳۲۱۰',
    telegram_handle: '@KetboshkaClub',
  },
  footerSettings: {
    id: 1,
    title: 'باشگاه کتابخوانی کتابوشکا',
    description:
      'محفلی صمیمی برای خوانش آهسته، نقد ادبی و هم‌اندیشی پیرامون ماندگارترین آثار داستانی و فلسفی جهان.',
    phone: '۰۲۱-۸۸۹۴۳۲۱۰',
    email: 'hello@ketboshka.ir',
    address: 'تهران، خیابان کریم‌خان زند، خیابان ایرانشهر، خانه فرهنگ و ادبیات کتابوشکا',
    links: [
      { label: 'درباره باشگاه', href: '#about-club' },
      { label: 'کتابخانه', href: '#library' },
      { label: 'نشست‌ها', href: '#events' },
      { label: 'کلاس‌ها و دوره‌ها', href: '#courses' },
      { label: 'وبلاگ', href: '#blog' },
      { label: 'تماس با ما', href: '#contact' },
    ],
    instagram_url: '',
    telegram_url: '',
    twitter_url: '',
    youtube_url: '',
    linkedin_url: '',
    copyright_text: 'تمامی حقوق مادی و معنوی برای باشگاه کتابخوانی کتابوشکا محفوظ است · ۱۴۰۵',
    tagline_text: 'حلقه‌های مطالعاتی و نقد ادبیات داستانی',
  },
};

function saveActiveRoute(cleanPath: string): void {
  try {
    if (cleanPath === '/login') return;
    window.sessionStorage.setItem(ACTIVE_ROUTE_STORAGE_KEY, cleanPath);
  } catch {
    // ignore storage errors
  }
}

function getSavedActiveRoute(): string | null {
  try {
    return window.sessionStorage.getItem(ACTIVE_ROUTE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function clearSavedActiveRoute(): void {
  try {
    window.sessionStorage.removeItem(ACTIVE_ROUTE_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

function pushRoute(path: string, replace = false): void {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  saveActiveRoute(cleanPath);
  try {
    if (window.location.pathname !== cleanPath) {
      if (replace) {
        window.history.replaceState({ path: cleanPath }, document.title, cleanPath);
      } else {
        window.history.pushState({ path: cleanPath }, document.title, cleanPath);
      }
    }
  } catch {
    // Ignore history API restrictions in sandboxed environments
  }
}

type PendingEnrollment =
  | { type: 'course'; course: RussianCourseCard }
  | { type: 'event'; eventItem: ClubEventDetailItem }
  | null;

function mountApplication(
  payload: BootstrapPayload,
  initialSessionMember: ClubMember | null = null
): void {
  const $app = $('#app');
  let allPosts = payload.blogPosts || [];
  let currentMember: ClubMember | null = initialSessionMember;
  let pendingEnrollment: PendingEnrollment = null;

  function isAdminMember(member: ClubMember | null | undefined): boolean {
    return Boolean(member && (member.role === 'admin' || member.phone === 'admin'));
  }

  function getActivePublicCourses(): RussianCourseCard[] {
    return (payload.publicClasses || [])
      .filter((c) => c.status !== 'غیرفعال')
      .map((c) => mapClassToCourseCard(c, payload.approvedComments || []));
  }

  function getActivePublicEvents(): ClubEventDetailItem[] {
    return (payload.publicSessions || [])
      .filter((s) => s.status !== 'غیرفعال')
      .map((s) => mapSessionToEventCard(s, payload.approvedComments || []));
  }

  function redirectToLoginPage(): void {
    currentMember = null;
    clearSavedActiveRoute();
    pushRoute('/login', true);
    renderMainHomeView(undefined, true, true);
  }

  function scrollToSection(href: string): void {
    const sectionMap: Record<string, string> = {
      '#home': '/',
      '#about-club': '/about-club',
      '#about-me': '/about-me',
      '#events': '/events',
      '#library': '/library',
      '#courses': '/courses',
      '#blog': '/blog',
      '#contact': '/contact',
    };
    if (sectionMap[href]) {
      pushRoute(sectionMap[href]);
    }
    if (href === '#home') {
      $('html, body').stop(true).animate({ scrollTop: 0 }, 450);
      return;
    }
    if (href.startsWith('#')) {
      const $target = $(href);
      if ($target.length) {
        const navHeight = $('.js-floating-navbar').outerHeight() || 72;
        $('html, body')
          .stop(true)
          .animate(
            { scrollTop: Math.max(0, ($target.offset()?.top || 0) - navHeight) },
            450
          );
      }
    }
  }

  function getNavbarCtaLabel(): string {
    if (currentMember) {
      if (isAdminMember(currentMember)) {
        return `پنل مدیریت · ${currentMember.first_name} ${currentMember.last_name}`;
      }
      return `پنل کاربری · ${currentMember.first_name} ${currentMember.last_name}`;
    }
    return payload.heroSettings.nav_cta_text || 'ورود به باشگاه';
  }

  function handleMemberAuthSuccess(member: ClubMember): void {
    currentMember = member;
    if (pendingEnrollment && !isAdminMember(member)) {
      const enrollmentToProcess = pendingEnrollment;
      pendingEnrollment = null;

      if (enrollmentToProcess.type === 'course') {
        const course = enrollmentToProcess.course;
        const noticeMsg = `دوره «${course.title}» با وضعیت غیرفعال در کلاس‌های شما ثبت شد.`;
        ApiService.enrollMemberInItem({
          member_phone: member.phone,
          member_name: `${member.first_name} ${member.last_name}`.trim(),
          target_type: 'class',
          target_id: course.id,
          title: course.title,
          mentor_or_instructor: course.instructor,
          schedule_text: course.schedule,
          cover_url: course.coverUrl,
          level_label: course.level,
          description: course.description,
        })
          .then(() => {
            openMemberPanel(member.phone, 'classes', undefined, false, noticeMsg);
          })
          .catch(() => {
            openMemberPanel(member.phone, 'classes', undefined, false, noticeMsg);
          });
        return;
      }

      if (enrollmentToProcess.type === 'event') {
        const ev = enrollmentToProcess.eventItem;
        const noticeMsg = `نشست «${ev.title}» با وضعیت غیرفعال در جلسات شما ثبت شد.`;
        ApiService.enrollMemberInItem({
          member_phone: member.phone,
          member_name: `${member.first_name} ${member.last_name}`.trim(),
          target_type: 'session',
          target_id: ev.id,
          title: ev.title,
          book_title: ev.bookTitle,
          book_author: ev.bookAuthor,
          pages_count: ev.pagesCount,
          publisher: ev.bookPublisher,
          mentor_or_instructor: ev.bookTranslator || ev.hostName,
          schedule_text: ev.dateText,
          time_text: ev.timeText,
          cover_url: ev.coverUrl,
          description: ev.summary,
        })
          .then(() => {
            openMemberPanel(member.phone, 'sessions', undefined, false, noticeMsg);
          })
          .catch(() => {
            openMemberPanel(member.phone, 'sessions', undefined, false, noticeMsg);
          });
        return;
      }
    }

    openAppropriatePanel(member);
  }

  function openAppropriatePanel(member?: ClubMember | null): void {
    const target = member || currentMember;
    if (isAdminMember(target)) {
      openAdminPanel('dashboard');
    } else if (target) {
      openMemberPanel(target.phone, 'dashboard');
    } else {
      redirectToLoginPage();
    }
  }

  function openAdminPanel(
    initialTab: AdminTabKey = 'dashboard',
    initialSubPath?: string,
    skipPush = false
  ): void {
    if (currentMember && !isAdminMember(currentMember)) {
      openMemberPanel(currentMember.phone, 'dashboard');
      return;
    }

    const targetUrl = initialSubPath
      ? `/admin/${initialTab}/${initialSubPath}`
      : `/admin/${initialTab}`;
    if (!skipPush) {
      pushRoute(targetUrl);
    } else {
      saveActiveRoute(targetUrl);
    }

    ApiService.fetchAdminPanelData()
      .then((adminData: AdminPanelPayload) => {
        currentMember = adminData.admin;
        renderAdminPanelView(adminData, initialTab, initialSubPath);
      })
      .catch(() => {
        redirectToLoginPage();
      });
  }

  function renderAdminPanelView(
    adminData: AdminPanelPayload,
    initialTab: AdminTabKey = 'dashboard',
    initialSubPath?: string
  ): void {
    $app.empty();

    const $shell = $(
      '<div dir="rtl" class="min-h-screen flex flex-col justify-start relative"></div>'
    );

    const adminNavItems = [
      { key: 'dashboard', label: 'داشبورد' },
      { key: 'sessions', label: 'مدیریت نشستها' },
      { key: 'classes', label: 'مدیریت کلاس ها' },
      { key: 'library', label: 'کتابخانه' },
      { key: 'users', label: 'مدیریت کاربران' },
      { key: 'blog', label: 'وبلاگ' },
      { key: 'comments', label: 'نظرات کاربران' },
      { key: 'gallery', label: 'گالری تصاویر' },
      { key: 'announcements', label: 'اطلاعیه ها' },
      { key: 'tickets', label: 'تیکت ها' },
      { key: 'contact_messages', label: 'پیامهای دریافتی' },
      { key: 'profile', label: 'پروفایل' },
      { key: 'home_settings', label: 'تنظیمات صفحه اصلی' },
    ];

    const handleAdminBackToSite = (): void => {
      ApiService.fetchBootstrapData()
        .then((fresh) => {
          payload.libraryBooks = fresh.libraryBooks || [];
          payload.libraryCategories = fresh.libraryCategories || [];
          payload.publicSessions = fresh.publicSessions || [];
          payload.publicClasses = fresh.publicClasses || [];
          payload.approvedComments = fresh.approvedComments || [];
          payload.blogPosts = fresh.blogPosts || [];
          if (fresh.footerSettings) payload.footerSettings = fresh.footerSettings;
          allPosts = payload.blogPosts;
        })
        .finally(() => {
          pushRoute('/');
          renderMainHomeView();
        });
    };

    const handleAdminLogout = (): void => {
      ApiService.logoutClubMember().finally(() => {
        currentMember = null;
        clearSavedActiveRoute();
        pushRoute('/');
        renderMainHomeView();
      });
    };

    const $navbar = createNavbarComponent({
      navigationLinks: payload.navigationLinks,
      ctaText: getNavbarCtaLabel(),
      isStationaryCta: true,
      panelMode: 'admin',
      panelMenuItems: adminNavItems,
      activePanelKey: initialTab,
      onPanelMenuSelect: (key) => {
        $shell.find(`.js-admin-tab-btn[data-admin-tab="${key}"]`).trigger('click');
      },
      onPanelBackToSite: handleAdminBackToSite,
      onPanelLogout: handleAdminLogout,
      onNavigate: (href) => {
        ApiService.fetchBootstrapData()
          .then((fresh) => {
            payload.libraryBooks = fresh.libraryBooks || [];
            payload.libraryCategories = fresh.libraryCategories || [];
            payload.publicSessions = fresh.publicSessions || [];
            payload.publicClasses = fresh.publicClasses || [];
            payload.approvedComments = fresh.approvedComments || [];
            payload.blogPosts = fresh.blogPosts || [];
            if (fresh.footerSettings) payload.footerSettings = fresh.footerSettings;
            allPosts = payload.blogPosts;
          })
          .finally(() => {
            renderMainHomeView(href);
          });
      },
      onLoginClick: () => {
        openAdminPanel('dashboard');
      },
    });

    const $adminPage = createAdminPanelPageComponent({
      initialData: adminData,
      initialTab,
      initialSubPath,
      onRouteChange: (newPath) => {
        pushRoute(newPath);
        const match = newPath.match(/^\/admin\/([^/?#]+)/);
        if (match && match[1]) {
          $navbar.trigger('navbar:set-active-key', [match[1]]);
        }
      },
      onBackToSite: handleAdminBackToSite,
      onLogout: handleAdminLogout,
      onAdminUpdated: (updatedAdmin) => {
        currentMember = updatedAdmin;
        $('.js-club-login-btn').text(getNavbarCtaLabel());
      },
      onSiteDataUpdated: (updated) => {
        if (updated.heroSettings) payload.heroSettings = updated.heroSettings;
        if (updated.aboutClub) payload.aboutClub = updated.aboutClub;
        if (updated.aboutManager) payload.aboutManager = updated.aboutManager;
        if (updated.contactInfo) payload.contactInfo = updated.contactInfo;
        if (updated.footerSettings) payload.footerSettings = updated.footerSettings;
        if (updated.blogPosts) {
          payload.blogPosts = updated.blogPosts;
          allPosts = updated.blogPosts;
        }
        if (updated.libraryBooks) {
          payload.libraryBooks = updated.libraryBooks;
        }
        if (updated.libraryCategories) {
          payload.libraryCategories = updated.libraryCategories;
        }
        if (updated.sessions) {
          payload.publicSessions = updated.sessions.filter(
            (s) => s.status !== 'غیرفعال'
          );
          ApiService.fetchBootstrapData()
            .then((fresh) => {
              payload.libraryBooks = fresh.libraryBooks || [];
              payload.libraryCategories = fresh.libraryCategories || [];
              payload.publicSessions = fresh.publicSessions || [];
              payload.approvedComments = fresh.approvedComments || [];
            })
            .catch(() => {
              // ignore refresh error
            });
        }
        if (updated.classes) {
          payload.publicClasses = updated.classes.filter((c) => c.status !== 'غیرفعال');
        }
      },
    });

    $shell.append($navbar, $adminPage);
    $app.append($shell);

    window.scrollTo(0, 0);
  }

  function openMemberPanel(
    phone?: string,
    initialTab: PanelTabKey = 'dashboard',
    initialSubPath?: string,
    skipPush = false,
    initialEnrollmentNotice?: string
  ): void {
    if (currentMember && isAdminMember(currentMember)) {
      openAdminPanel('dashboard');
      return;
    }

    const targetUrl = initialSubPath
      ? `/panel/${initialTab}/${initialSubPath}`
      : `/panel/${initialTab}`;
    if (!skipPush) {
      pushRoute(targetUrl);
    } else {
      saveActiveRoute(targetUrl);
    }

    ApiService.fetchMemberPanelData(phone || currentMember?.phone)
      .then((panelData: MemberPanelPayload) => {
        currentMember = panelData.member;
        renderMemberPanelView(
          panelData,
          initialTab,
          initialSubPath,
          initialEnrollmentNotice
        );
      })
      .catch(() => {
        redirectToLoginPage();
      });
  }

  function renderMemberPanelView(
    panelData: MemberPanelPayload,
    initialTab: PanelTabKey = 'dashboard',
    initialSubPath?: string,
    initialEnrollmentNotice?: string
  ): void {
    $app.empty();

    const $shell = $(
      '<div dir="rtl" class="min-h-screen flex flex-col justify-start relative"></div>'
    );

    const memberNavItems = [
      { key: 'dashboard', label: 'داشبورد' },
      { key: 'sessions', label: 'نشست های من' },
      { key: 'classes', label: 'کلاس های من' },
      { key: 'library', label: 'کتابخانه من' },
      { key: 'announcements', label: 'اطلاعیه' },
      { key: 'tickets', label: 'تیکت' },
      { key: 'profile', label: 'پروفایل' },
      { key: 'calendar', label: 'تقویم رویدادها' },
    ];

    const handleMemberBackToSite = (): void => {
      pushRoute('/');
      renderMainHomeView();
    };

    const handleMemberLogout = (): void => {
      ApiService.logoutClubMember().finally(() => {
        currentMember = null;
        clearSavedActiveRoute();
        pushRoute('/');
        renderMainHomeView();
      });
    };

    const $navbar = createNavbarComponent({
      navigationLinks: payload.navigationLinks,
      ctaText: getNavbarCtaLabel(),
      isStationaryCta: true,
      panelMode: 'member',
      panelMenuItems: memberNavItems,
      activePanelKey: initialTab,
      onPanelMenuSelect: (key) => {
        $shell.find(`.js-panel-tab-btn[data-tab="${key}"]`).trigger('click');
      },
      onPanelBackToSite: handleMemberBackToSite,
      onPanelLogout: handleMemberLogout,
      onNavigate: (href) => {
        renderMainHomeView(href);
      },
      onLoginClick: () => {
        openAppropriatePanel(currentMember);
      },
    });

    const $panelPage = createMemberPanelPageComponent({
      initialData: panelData,
      initialTab,
      initialSubPath,
      initialEnrollmentNotice,
      onRouteChange: (newPath) => {
        pushRoute(newPath);
        const match = newPath.match(/^\/panel\/([^/?#]+)/);
        if (match && match[1]) {
          $navbar.trigger('navbar:set-active-key', [match[1]]);
        }
      },
      onBackToSite: handleMemberBackToSite,
      onLogout: handleMemberLogout,
      onMemberUpdated: (updatedMember) => {
        currentMember = updatedMember;
        $('.js-club-login-btn').text(getNavbarCtaLabel());
      },
    });

    $shell.append($navbar, $panelPage);
    $app.append($shell);

    window.scrollTo(0, 0);
  }

  function renderMainHomeView(
    scrollToSelector?: string,
    skipPush = false,
    openLoginModal = false
  ): void {
    if (!skipPush && !scrollToSelector) {
      pushRoute('/');
    }
    $app.empty();

    const $shell = $(
      '<div id="home" dir="rtl" class="min-h-screen flex flex-col justify-between relative"></div>'
    );

    const $loginModal = createClubAuthModalComponent({
      onAuthSuccess: (member) => {
        handleMemberAuthSuccess(member);
      },
    });

    if (openLoginModal) {
      $loginModal.removeClass('hidden');
    }

    const $navbar = createNavbarComponent({
      navigationLinks: payload.navigationLinks,
      ctaText: getNavbarCtaLabel(),
      isStationaryCta: Boolean(currentMember),
      onNavigate: (href) => {
        scrollToSection(href);
      },
      onLoginClick: () => {
        pendingEnrollment = null;
        if (currentMember) {
          openAppropriatePanel(currentMember);
        } else {
          pushRoute('/login');
          $loginModal.removeClass('hidden');
        }
      },
    });

    const $hero = createHeroSectionComponent({
      heroSettings: payload.heroSettings,
      featuredBooks: payload.featuredBooks,
    });

    const $aboutClub = createAboutClubSectionComponent({
      aboutClub: payload.aboutClub || FALLBACK_BOOTSTRAP.aboutClub,
    });

    const $aboutManager = createAboutManagerSectionComponent({
      aboutManager: payload.aboutManager || FALLBACK_BOOTSTRAP.aboutManager,
    });

    const $library = createLibrarySectionComponent({
      libraryBooks: payload.libraryBooks || [],
      libraryCategories: payload.libraryCategories || [],
      publicSessions: payload.publicSessions || [],
      approvedComments: payload.approvedComments || [],
      onOpenEventDetail: (eventItem) => {
        pushRoute(`/event/${eventItem.id}`);
        renderEventDetailPageView(eventItem, true);
      },
      onOpenBookDetail: (book) => {
        pushRoute(`/library/${book.id}`);
        renderLibraryBookDetailPageView(book, true);
      },
      onRegisterEvent: (eventItem) => {
        if (currentMember && !isAdminMember(currentMember)) {
          pendingEnrollment = { type: 'event', eventItem };
          handleMemberAuthSuccess(currentMember);
          return;
        }
        pendingEnrollment = { type: 'event', eventItem };
        $loginModal.removeClass('hidden');
      },
    });

    const $courses = createCoursesSectionComponent({
      publicClasses: payload.publicClasses || [],
      approvedComments: payload.approvedComments || [],
      onOpenCourseDetail: (course) => {
        pushRoute(`/course/${course.id}`);
        renderCourseDetailPageView(course, true);
      },
      onRegisterCourse: (course) => {
        if (currentMember && !isAdminMember(currentMember)) {
          pendingEnrollment = { type: 'course', course };
          handleMemberAuthSuccess(currentMember);
          return;
        }
        pendingEnrollment = { type: 'course', course };
        $loginModal.removeClass('hidden');
      },
    });

    const $blog = createBlogSectionComponent({
      blogPosts: allPosts,
      onOpenPost: (post: BlogPost) => {
        pushRoute(`/blog/${post.id}`);
        renderBlogPostPageView(post, true);
      },
    });

    const $contact = createContactSectionComponent({
      contactInfo: payload.contactInfo || FALLBACK_BOOTSTRAP.contactInfo,
      footerSettings: payload.footerSettings || FALLBACK_BOOTSTRAP.footerSettings,
    });

    const $scrollToTopBtn = createScrollToTopButtonComponent();

    $shell.append(
      $navbar,
      $hero,
      $aboutClub,
      $aboutManager,
      $library,
      $courses,
      $blog,
      $contact,
      $scrollToTopBtn,
      $loginModal
    );
    $app.append($shell);

    if (scrollToSelector) {
      window.setTimeout(() => {
        scrollToSection(scrollToSelector);
      }, 60);
    } else {
      window.scrollTo(0, 0);
    }
  }

  function renderLibraryBookDetailPageView(
    book: LibraryBook,
    skipPush = false
  ): void {
    if (!skipPush) {
      pushRoute(`/library/${book.id}`);
    } else {
      saveActiveRoute(`/library/${book.id}`);
    }
    $app.empty();

    const $shell = $(
      '<div dir="rtl" class="min-h-screen flex flex-col justify-start relative"></div>'
    );

    const $loginModal = createClubAuthModalComponent({
      onAuthSuccess: (member) => {
        handleMemberAuthSuccess(member);
      },
    });

    const $navbar = createNavbarComponent({
      navigationLinks: payload.navigationLinks,
      ctaText: getNavbarCtaLabel(),
      activeHref: '#library',
      isStationaryCta: Boolean(currentMember),
      onNavigate: (href) => {
        renderMainHomeView(href);
      },
      onLoginClick: () => {
        pendingEnrollment = null;
        if (currentMember) {
          openAppropriatePanel(currentMember);
        } else {
          $loginModal.removeClass('hidden');
        }
      },
    });

    const $bookDetailPage = createLibraryBookDetailPageComponent({
      book,
      approvedComments: payload.approvedComments || [],
      currentMember,
      onBack: () => {
        pushRoute('/library');
        renderMainHomeView('#library', true);
      },
    });

    const $scrollToTopBtn = createScrollToTopButtonComponent();

    $shell.append($navbar, $bookDetailPage, $scrollToTopBtn, $loginModal);
    $app.append($shell);

    $('html, body').stop(true).animate({ scrollTop: 0 }, 250);
  }

  function renderCourseDetailPageView(
    course: RussianCourseCard,
    skipPush = false
  ): void {
    if (!skipPush) {
      pushRoute(`/course/${course.id}`);
    } else {
      saveActiveRoute(`/course/${course.id}`);
    }
    $app.empty();

    const $shell = $(
      '<div dir="rtl" class="min-h-screen flex flex-col justify-start relative"></div>'
    );

    const $loginModal = createClubAuthModalComponent({
      onAuthSuccess: (member) => {
        handleMemberAuthSuccess(member);
      },
    });

    const $navbar = createNavbarComponent({
      navigationLinks: payload.navigationLinks,
      ctaText: getNavbarCtaLabel(),
      activeHref: '#courses',
      isStationaryCta: Boolean(currentMember),
      onNavigate: (href) => {
        renderMainHomeView(href);
      },
      onLoginClick: () => {
        pendingEnrollment = null;
        if (currentMember) {
          openAppropriatePanel(currentMember);
        } else {
          $loginModal.removeClass('hidden');
        }
      },
    });

    const $courseDetailPage = createCourseDetailPageComponent({
      course,
      allCourses: getActivePublicCourses(),
      onBackToHomeCourses: () => {
        pushRoute('/courses');
        renderMainHomeView('#courses', true);
      },
      onRegisterCourse: (targetCourse) => {
        if (currentMember && !isAdminMember(currentMember)) {
          pendingEnrollment = { type: 'course', course: targetCourse };
          handleMemberAuthSuccess(currentMember);
          return;
        }
        pendingEnrollment = { type: 'course', course: targetCourse };
        $loginModal.removeClass('hidden');
      },
      onSelectCourse: (nextCourse) => {
        pushRoute(`/course/${nextCourse.id}`);
        renderCourseDetailPageView(nextCourse, true);
      },
    });

    const $scrollToTopBtn = createScrollToTopButtonComponent();

    $shell.append($navbar, $courseDetailPage, $scrollToTopBtn, $loginModal);
    $app.append($shell);

    $('html, body').stop(true).animate({ scrollTop: 0 }, 250);
  }

  function renderEventDetailPageView(
    eventItem: ClubEventDetailItem,
    skipPush = false
  ): void {
    if (!skipPush) {
      pushRoute(`/event/${eventItem.id}`);
    } else {
      saveActiveRoute(`/event/${eventItem.id}`);
    }
    $app.empty();

    const $shell = $(
      '<div dir="rtl" class="min-h-screen flex flex-col justify-start relative"></div>'
    );

    const $loginModal = createClubAuthModalComponent({
      onAuthSuccess: (member) => {
        handleMemberAuthSuccess(member);
      },
    });

    const $navbar = createNavbarComponent({
      navigationLinks: payload.navigationLinks,
      ctaText: getNavbarCtaLabel(),
      activeHref: '#events',
      isStationaryCta: Boolean(currentMember),
      onNavigate: (href) => {
        renderMainHomeView(href);
      },
      onLoginClick: () => {
        pendingEnrollment = null;
        if (currentMember) {
          openAppropriatePanel(currentMember);
        } else {
          $loginModal.removeClass('hidden');
        }
      },
    });

    const $eventDetailPage = createEventDetailPageComponent({
      eventItem,
      allEvents: getActivePublicEvents(),
      onBackToHomeEvents: () => {
        pushRoute('/events');
        renderMainHomeView('#events', true);
      },
      onRegisterEvent: (targetEvent) => {
        if (currentMember && !isAdminMember(currentMember)) {
          pendingEnrollment = { type: 'event', eventItem: targetEvent };
          handleMemberAuthSuccess(currentMember);
          return;
        }
        pendingEnrollment = { type: 'event', eventItem: targetEvent };
        $loginModal.removeClass('hidden');
      },
      onSelectEvent: (nextEvent) => {
        pushRoute(`/event/${nextEvent.id}`);
        renderEventDetailPageView(nextEvent, true);
      },
    });

    const $scrollToTopBtn = createScrollToTopButtonComponent();

    $shell.append($navbar, $eventDetailPage, $scrollToTopBtn, $loginModal);
    $app.append($shell);

    $('html, body').stop(true).animate({ scrollTop: 0 }, 250);
  }

  function renderBlogPostPageView(post: BlogPost, skipPush = false): void {
    if (!skipPush) {
      pushRoute(`/blog/${post.id}`);
    } else {
      saveActiveRoute(`/blog/${post.id}`);
    }
    $app.empty();

    const $shell = $(
      '<div dir="rtl" class="min-h-screen flex flex-col justify-start relative"></div>'
    );

    const $loginModal = createClubAuthModalComponent({
      onAuthSuccess: (member) => {
        handleMemberAuthSuccess(member);
      },
    });

    const $navbar = createNavbarComponent({
      navigationLinks: payload.navigationLinks,
      ctaText: getNavbarCtaLabel(),
      activeHref: '#blog',
      isStationaryCta: Boolean(currentMember),
      onNavigate: (href) => {
        renderMainHomeView(href);
      },
      onLoginClick: () => {
        pendingEnrollment = null;
        if (currentMember) {
          openAppropriatePanel(currentMember);
        } else {
          $loginModal.removeClass('hidden');
        }
      },
    });

    const $postPage = createBlogPostPageComponent({
      post,
      allPosts,
      onBackToHome: () => {
        pushRoute('/blog');
        renderMainHomeView('#blog', true);
      },
      onSelectPost: (nextPost: BlogPost) => {
        pushRoute(`/blog/${nextPost.id}`);
        renderBlogPostPageView(nextPost, true);
      },
    });

    const $scrollToTopBtn = createScrollToTopButtonComponent();

    $shell.append($navbar, $postPage, $scrollToTopBtn, $loginModal);
    $app.append($shell);

    $('html, body').stop(true).animate({ scrollTop: 0 }, 250);
  }

  // Client-side URL Router handler (for popstate / direct path navigation / refresh restoration)
  function handleLocationRoute(isInitialLoad = false): void {
    let pathname = window.location.pathname || '/';

    if (isInitialLoad && pathname === '/') {
      const savedRoute = getSavedActiveRoute();
      if (savedRoute && savedRoute !== '/' && savedRoute !== '/login') {
        const savedFirst = savedRoute.split('/').filter(Boolean)[0];
        if (savedFirst === 'admin' || savedFirst === 'panel') {
          pathname = savedRoute;
          pushRoute(savedRoute, true);
        } else if (
          savedFirst === 'event' ||
          savedFirst === 'course' ||
          savedFirst === 'blog' ||
          savedFirst === 'library'
        ) {
          pathname = savedRoute;
          pushRoute(savedRoute, true);
        }
      }
    }

    const segments = pathname.split('/').filter(Boolean);

    if (segments.length === 0) {
      saveActiveRoute('/');
      renderMainHomeView(undefined, true);
      return;
    }

    const first = segments[0];

    if (first === 'login') {
      if (currentMember) {
        openAppropriatePanel(currentMember);
        return;
      }
      renderMainHomeView(undefined, true, true);
      return;
    }

    // Library book detail route: /library/:id
    if (first === 'library' && segments[1]) {
      const bookId = Number(segments[1]);
      const matchedBook = (payload.libraryBooks || []).find((b) => Number(b.id) === bookId);
      if (matchedBook) {
        renderLibraryBookDetailPageView(matchedBook, true);
        return;
      }
      renderMainHomeView('#library', true);
      return;
    }

    // Section routes on home page
    const sectionRoutes: Record<string, string> = {
      'about-club': '#about-club',
      'about-me': '#about-me',
      events: '#events',
      library: '#library',
      courses: '#courses',
      contact: '#contact',
    };
    if (sectionRoutes[first]) {
      saveActiveRoute(`/${first}`);
      renderMainHomeView(sectionRoutes[first], true);
      return;
    }

    // Course detail routes: /course/:id
    if (first === 'course' && segments[1]) {
      const courseId = Number(segments[1]);
      const targetCourse = getActivePublicCourses().find((c) => c.id === courseId);
      if (targetCourse) {
        renderCourseDetailPageView(targetCourse, true);
        return;
      }
      renderMainHomeView('#courses', true);
      return;
    }

    // Event detail routes: /event/:id
    if (first === 'event' && segments[1]) {
      const eventId = Number(segments[1]);
      const activeEvents = getActivePublicEvents();
      const targetEvent = activeEvents.find((ev) => ev.id === eventId);
      if (targetEvent) {
        renderEventDetailPageView(targetEvent, true);
        return;
      }
      renderMainHomeView('#events', true);
      return;
    }

    // Blog routes: /blog or /blog/:id
    if (first === 'blog') {
      if (segments[1]) {
        const postId = Number(segments[1]);
        const targetPost = allPosts.find((p) => p.id === postId);
        if (targetPost) {
          renderBlogPostPageView(targetPost, true);
          return;
        }
      }
      renderMainHomeView('#blog', true);
      return;
    }

    // Admin Panel routes: /admin/:tab/...
    if (first === 'admin') {
      if (!currentMember) {
        redirectToLoginPage();
        return;
      }
      if (!isAdminMember(currentMember)) {
        openMemberPanel(currentMember.phone, 'dashboard');
        return;
      }
      const tab = (segments[1] as AdminTabKey) || 'dashboard';
      const subPath = segments.slice(2).join('/');
      openAdminPanel(tab, subPath || undefined, true);
      return;
    }

    // Member Panel routes: /panel/:tab/...
    if (first === 'panel') {
      if (!currentMember) {
        redirectToLoginPage();
        return;
      }
      if (isAdminMember(currentMember)) {
        openAdminPanel('dashboard');
        return;
      }
      const tab = (segments[1] as PanelTabKey) || 'dashboard';
      const subPath = segments.slice(2).join('/');
      openMemberPanel(currentMember.phone, tab, subPath || undefined, true);
      return;
    }

    renderMainHomeView(undefined, true);
  }

  $(window)
    .off('popstate.bookmeetRouter')
    .on('popstate.bookmeetRouter', () => {
      handleLocationRoute(false);
    });

  handleLocationRoute(true);
}

$(function () {
  const sessionPromise = ApiService.fetchCurrentSessionMember()
    .then((res) => res.member)
    .catch(() => null);

  const bootstrapPromise = ApiService.fetchBootstrapData().catch(
    () => FALLBACK_BOOTSTRAP
  );

  Promise.all([bootstrapPromise, sessionPromise]).then(([data, sessionMember]) => {
    mountApplication(data, sessionMember);
  });
});
