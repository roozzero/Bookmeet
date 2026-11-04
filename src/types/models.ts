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
  category: string;
  author: string;
  published_date: string;
  reading_time: string;
  cover_url: string;
  excerpt: string;
  full_content: string;
  sort_order: number;
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
  education: string;
  favorite_genre: string;
  email?: string;
  city?: string;
  bio?: string;
  membership_code?: string;
  joined_date?: string;
  created_at: string;
}

export interface SessionSubItem {
  id: number;
  session_number: string;
  title: string;
  status: 'برگزار شده' | 'تعریف شده';
  session_date: string;
  session_time: string;
  pages_read?: number;
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
  mentor_name: string;
  session_date: string;
  session_time: string;
  location_type: string;
  meeting_link_or_room: string;
  status: 'ثبت‌نام‌شده' | 'برگزارشده' | 'ظرفیت باز';
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
  level_label: string;
  total_sessions: number;
  held_sessions: number;
  status: string;
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
  admin_reply: string;
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

export interface MemberPanelPayload {
  member: ClubMember;
  sessions: MemberSession[];
  classes: MemberClassItem[];
  library: MemberLibraryItem[];
  tickets: MemberTicket[];
  calendarEvents: ClubCalendarEvent[];
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



