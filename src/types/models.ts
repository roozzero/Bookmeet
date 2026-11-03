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
  created_at: string;
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
  new_password: string;
  confirm_new_password: string;
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


