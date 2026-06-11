export type UserRole =
  | 'STUDENT'
  | 'TEACHER'
  | 'MAIN_ADMIN'
  | 'SUB_ADMIN'
  | 'VISITOR';

export type NoteStatus =
  | 'PENDING_OCR'
  | 'AWAITING_STUDENT_APPROVAL'
  | 'PROCESSING_AI'
  | 'READY'
  | 'FAILED';

export type NoteType = 'pdf' | 'image' | 'voice' | 'text';

export type ContentType = 'STUDENT_QUOTE' | 'TEACHER_TIP' | 'ADMIN_INSIGHT';

export type ConformityStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';

export interface JWTPayload {
  user_id:   string;
  role:      UserRole;
  school_id: string | null;
  exp:       number;
  iat:       number;
  is_staff?: boolean;
}

export interface PaginatedResponse<T> {
  count:       number;
  next:        string | null;
  previous:    string | null;
  total_pages: number;
  results:     T[];
}

export interface APIError {
  error_code:  string;
  detail:      string;
  status_code: number;
  timestamp:   string;
}

export interface SchoolPublic {
  id:       string;
  name:     string;
  slug:     string;
  logo_url: string;
}

export interface SchoolDetail extends SchoolPublic {
  address:       string;
  contact_email: string;
  contact_phone: string;
}

export interface SchoolAdmin extends SchoolDetail {
  is_active:       boolean;
  onboarding_date: string;
  created_at:      string;
  updated_at:      string;
}

export interface SchoolCulture {
  philosophy:                string;
  mission_statement:         string;
  vision_statement:          string;
  core_values:               string;
  school_creed:              string;
  institutional_principles:  string;
  founder_quotes:            Array<{ quote: string; author: string }>;
  updated_at:                string;
}

export interface TokenPair {
  access:  string;
  refresh: string;
}

export interface UserProfile {
  id:                string;
  email:             string | null;
  username:          string | null;
  role:              UserRole;
  school:            string | null;
  first_name:        string;
  last_name:         string;
  full_name:         string;
  avatar_url:        string | null;
  school_name:       string | null;
  is_email_verified: boolean;
  trial_expires_at:  string | null;
  date_joined:       string;
}

export interface DailyContent {
  id:           string;
  content_type: ContentType;
  body:         string;
  author:       string;
  display_date: string;
}

export interface UserListItem {
  id:          string;
  role:        UserRole;
  first_name:  string;
  last_name:   string;
  email:       string | null;
  username:    string | null;
  is_active:   boolean;
  date_joined: string;
}

export interface UserDetail extends UserListItem {
  school_name: string;
}

export interface NoteListItem {
  id:         string;
  file_name:  string;
  note_type:  NoteType;
  subject:    string;
  topic:      string;
  subtopic:   string;
  status:     NoteStatus;
  created_at: string;
}

export interface SchoolNoteListItem extends NoteListItem {
  owner_id:   string;
  owner_name: string;
}

export interface NoteDetail {
  id:                   string;
  owner_name:           string;
  file_url:             string;
  file_name:            string;
  note_type:            NoteType;
  file_size_bytes:      number;
  subject:              string;
  topic:                string;
  subtopic:             string;
  raw_ocr_text:         string;
  ai_summary_paragraph: string;
  ai_bullet_points:     string[];
  ai_key_points:        string[];
  status:               NoteStatus;
  error_message:        string;
  created_at:           string;
  updated_at:           string;
}

export interface NoteStatusPoll {
  id:            string;
  status:        NoteStatus;
  error_message: string;
  updated_at:    string;
}

export interface ConformityReport {
  id:                    string;
  student_note_id:       string;
  student_name:          string;
  teacher_note_id:       string;
  subject:               string;
  conformity_percentage: string;
  similarity_analysis:   string;
  status:                ConformityStatus;
  generated_at:          string;
}

export interface ConformityStatusPoll {
  id:                    string;
  status:                ConformityStatus;
  conformity_percentage: string;
  generated_at:          string;
}

// API Payload types
export interface LoginPayload {
  role:       UserRole;
  identifier: string;
  password:   string;
  school_id?: string;
}

export interface VisitorRegisterPayload {
  email:      string;
  password:   string;
  first_name: string;
  last_name:  string;
}

export interface ChangePasswordPayload {
  old_password:     string;
  new_password:     string;
  confirm_password: string;
}

export interface PasswordResetPayload {
  uid:              string;
  token:            string;
  new_password:     string;
  confirm_password: string;
}

export interface DailyContentFilters {
  content_type?: ContentType;
  display_date?: string;
}

export interface DailyContentPayload {
  content_type: ContentType;
  body:         string;
  author:       string;
  display_date: string;
}

export interface UserFilters {
  role?:      UserRole;
  is_active?: string;
  search?:    string;
}

export interface CreateUserPayload {
  role:       'STUDENT' | 'TEACHER' | 'SUB_ADMIN';
  first_name: string;
  last_name:  string;
  password:   string;
  email?:     string;
  username?:  string;
}

export interface BulkStudentRow {
  first_name: string;
  last_name:  string;
  username:   string;
  password:   string;
  email?:     string;
}

export interface BulkCreatePayload {
  students: BulkStudentRow[];
}

export interface BulkCreateResult {
  created: UserListItem[];
  failed:  Array<{ username: string; error: string }>;
}

export interface UpdateUserPayload {
  first_name?: string;
  last_name?:  string;
  is_active?:  boolean;
}

export interface SetPasswordPayload {
  new_password:     string;
  confirm_password: string;
}

export interface NoteFilters {
  status?:    NoteStatus;
  note_type?: NoteType;
  subject?:   string;
  search?:    string;
  ordering?:  string;
  page?:      number;
}

export interface SchoolNoteFilters {
  owner?:     string;
  subject?:   string;
  status?:    NoteStatus;
  note_type?: NoteType;
  search?:    string;
  page?:      number;
}

export interface NoteMetadataPayload {
  subject?:  string;
  topic?:    string;
  subtopic?: string;
}

export interface SchoolCulturePayload {
  philosophy?:               string;
  mission_statement?:        string;
  vision_statement?:         string;
  core_values?:              string;
  school_creed?:             string;
  institutional_principles?: string;
  founder_quotes?:           Array<{ quote: string; author: string }>;
}

export interface UploadResponse {
  note_id: string;
  task_id: string;
  status:  NoteStatus;
}

export interface BulkUploadResponse {
  uploaded: NoteListItem[];
  failed:   Array<{ filename: string; error: string }>;
}

export interface ConfirmOCRResponse {
  note_id: string;
  task_id: string;
  status:  'PROCESSING_AI';
}

export interface ConformityCreatePayload {
  student_note_id: string;
  teacher_note_id: string;
}

export interface ConformityCreateResponse {
  report_id: string;
  task_id:   string;
  status:    'PENDING';
}

export interface CreateSchoolPayload {
  name:           string;
  slug:           string;
  logo_url?:      string;
  address?:       string;
  contact_email?: string;
  contact_phone?: string;
}
