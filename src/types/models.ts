export interface NavigationLink {
  id: number;
  label: string;
  href: string;
  sort_order: number;
  is_active: number;
}

export interface HeroSettings {
  id: number;
  headline: string;
  subtitle_line_1: string;
  subtitle_line_2: string;
  nav_cta_text: string;
  nav_cta_target: string;
  hero_image_url: string;
  audio_progress_percent: number;
}

export interface FeaturedBook {
  id: number;
  title: string;
  persian_title: string;
  author: string;
  publication_year: number;
  synopsis: string;
}

export interface AboutClubData {
  id: number;
  section_kicker: string;
  title: string;
  paragraph_1: string;
  paragraph_2: string;
  image_url: string;
  image_caption: string;
  stat_1_value: string;
  stat_1_label: string;
  stat_2_value: string;
  stat_2_label: string;
  stat_3_value: string;
  stat_3_label: string;
}

export interface AboutManagerData {
  id: number;
  section_kicker: string;
  full_name: string;
  role_title: string;
  bio_paragraph_1: string;
  bio_paragraph_2: string;
  quote_text: string;
  image_url: string;
  credentials_line: string;
}

export interface LibraryBook {
  id: number;
  is_current: number;
  title: string;
  original_title: string;
  author: string;
  translator: string;
  category: 'کلاسیک' | 'معاصر';
  publication_year: number;
  pages_count: number;
  reading_progress_percent: number;
  session_schedule: string;
  cover_url: string;
  short_description: string;
  sort_order: number;
}

export interface BlogPost {
  id: number;
  title: string;
  slug?: string;
  category: string;
  author: string;
  published_date: string;
  reading_time: string;
  cover_url: string;
  excerpt: string;
  full_content: string;
  tags?: string;
  status?: 'منتشر شده' | 'پیش‌نویس';
  sort_order: number;
}

export interface GalleryImage {
  id: number;
  title: string;
  url: string;
  category: string;
  created_at: string;
}

export interface ContactInfoData {
  id: number;
  section_kicker: string;
  title: string;
  description: string;
  address: string;
  meeting_hours: string;
  email: string;
  phone: string;
  telegram_handle: string;
}

export interface ContactMessageInput {
  full_name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ClubMember {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  role?: 'member' | 'admin';
  status?: 'فعال' | 'غیرفعال';
  education: string;
  favorite_genre: string;
  email?: string;
  city?: string;
  avatar_url?: string;
  bio?: string;
  membership_code?: string;
  joined_date?: string;
  created_at: string;
}

export interface UserComment {
  id: number;
  author_name: string;
  author_phone: string;
  target_title: string;
  target_type: string;
  rating: number;
  comment_text: string;
  admin_reply: string;
  status: 'تایید شده' | 'در انتظار تایید' | 'رد شده';
  created_date: string;
  sort_order: number;
}

export interface SessionSubItem {
  id: number;
  session_number: string | number;
  title: string;
  status: 'برگزار شده' | 'تعریف شده' | 'جلسه آتی';
  session_date: string;
  session_time: string;
  cover_url?: string;
  pages_read?: number | string;
  pages_to_read?: string;
  reviewed_topics?: string;
  session_notes?: string;
  meeting_link?: string;
}

export interface MemberSession {
  id: number;
  member_phone: string;
  title: string;
  book_title: string;
  book_author?: string;
  pages_count?: number;
  publisher?: string;
  mentor_name: string;
  session_date: string;
  session_time: string;
  cover_url?: string;
  location_type: string;
  meeting_link_or_room: string;
  status: 'فعال' | 'غیرفعال' | 'ثبت‌نام‌شده' | 'برگزارشده' | 'ظرفیت باز';
  member_note: string;
  sub_sessions: SessionSubItem[];
  sort_order: number;
}

export interface MemberClassItem {
  id: number;
  member_phone: string;
  title: string;
  book_title: string;
  instructor_name: string;
  schedule_summary: string;
  level_label: 'مبتدی' | 'پیشرفته' | 'تخصصی' | string;
  cover_url?: string;
  total_sessions?: number;
  held_sessions?: number;
  status: 'فعال' | 'غیرفعال' | 'ثبت‌نام‌شده' | 'برگزارشده' | string;
  description: string;
  sub_sessions: SessionSubItem[];
  sort_order: number;
}

export interface MemberLibraryItem {
  id: number;
  member_phone: string;
  book_title: string;
  author: string;
  translator: string;
  cover_url: string;
  reading_status: 'در حال مطالعه' | 'خوانده‌شده' | 'در نوبت مطالعه';
  pages_read: number;
  progress_percent: number;
  pages_count: number;
  personal_note: string;
  updated_at: string;
}

export interface MemberTicket {
  id: number;
  member_phone: string;
  ticket_code: string;
  subject: string;
  department: string;
  priority: 'عادی' | 'مهم' | 'فوری';
  status: 'پاسخ داده‌شده' | 'در انتظار بررسی' | 'بسته‌شده';
  message: string;
  attachment_name?: string;
  admin_reply: string;
  admin_replies?: Array<{ text: string; created_at?: string; date?: string }>;
  created_at: string;
}

export interface ClubCalendarEvent {
  id: number;
  title: string;
  event_type: string;
  day_of_month: string;
  month_name: string;
  weekday_name: string;
  time_range: string;
  host_name: string;
  location_label: string;
  capacity_info: string;
  description: string;
  is_reserved: number;
  sort_order: number;
}

export interface ClubAnnouncement {
  id: number;
  title: string;
  category: 'جلسات کتابخوانی' | 'کلاس ها' | 'فنی' | string;
  published_date: string;
  summary: string;
  content: string;
  is_important: number;
  is_read: number;
  target_user_phone?: string;
  target_user_name?: string;
  sort_order: number;
}

export interface MemberPanelPayload {
  member: ClubMember;
  sessions: MemberSession[];
  classes: MemberClassItem[];
  library: MemberLibraryItem[];
  tickets: MemberTicket[];
  calendarEvents: ClubCalendarEvent[];
  announcements: ClubAnnouncement[];
}

export interface AdminPanelPayload {
  admin: ClubMember;
  gallery: GalleryImage[];
  sessions: MemberSession[];
  classes: MemberClassItem[];
  users: ClubMember[];
  tickets: MemberTicket[];
  announcements: ClubAnnouncement[];
  blogPosts: BlogPost[];
  comments: UserComment[];
  heroSettings: HeroSettings;
  aboutClub: AboutClubData;
  aboutManager: AboutManagerData;
  contactInfo: ContactInfoData;
  libraryBooks: LibraryBook[];
}

export interface ClubRegisterInput {
  first_name: string;
  last_name: string;
  phone: string;
  education: string;
  favorite_genre?: string;
  password: string;
  confirm_password: string;
}

export interface ClubLoginInput {
  phone: string;
  password: string;
}

export interface ClubForgotPasswordInput {
  phone: string;
}

export interface BootstrapPayload {
  navigationLinks: NavigationLink[];
  heroSettings: HeroSettings;
  featuredBooks: FeaturedBook[];
  aboutClub: AboutClubData;
  aboutManager: AboutManagerData;
  libraryBooks: LibraryBook[];
  blogPosts: BlogPost[];
  contactInfo: ContactInfoData;
}




