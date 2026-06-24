export interface PaginatedResponse<T> {
  count:        number;
  total_pages:  number;
  next:         string | null;
  previous:     string | null;
  results:      T[];
}

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
  philosophy:               string;
  mission_statement:        string;
  vision_statement:         string;
  core_values:              string;
  school_creed:             string;
  institutional_principles: string;
  founder_quotes:           Array<{ quote: string; author: string }>;
  updated_at:               string;
}

export interface TokenPair {
  access:  string;
  refresh: string;
}

export interface UserProfile {
  id:                  string;
  email:               string | null;
  username:            string | null;
  role:                UserRole;
  school:              string | null;
  first_name:          string;
  last_name:           string;
  full_name:           string;
  avatar_url:          string | null;
  school_name:         string | null;
  student_class_id:    string | null;
  student_class_name:  string | null;
  is_email_verified:   boolean;
  trial_expires_at:    string | null;
  date_joined:         string;
}

export interface DailyContent {
  id:           string;
  content_type: ContentType;
  body:         string;
  author:       string;
  display_date: string;
}

export interface SchoolClass {
  id:           string;
  name:         string;
  member_count: number;
}

export interface UserListItem {
  id:                 string;
  role:               UserRole;
  first_name:         string;
  last_name:          string;
  email:              string | null;
  username:           string | null;
  is_active:          boolean;
  date_joined:        string;
  student_class_id:   string | null;
  student_class_name: string | null;
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
  role:              'STUDENT' | 'TEACHER' | 'SUB_ADMIN';
  first_name:        string;
  last_name:         string;
  password:          string;
  email?:            string;
  username?:         string;
  student_class_id?: string | null;
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
  first_name?:        string;
  last_name?:         string;
  is_active?:         boolean;
  student_class_id?:  string | null;
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

// ── Quiz types ────────────────────────────────────────────────

export type QuizStatus     = 'GENERATING' | 'READY' | 'FAILED';
export type QuizDifficulty = 'easy' | 'moderate' | 'difficult';
export type QuestionType   = 'MCQ' | 'TF';

export interface QuizListItem {
  id:            string;
  title:         string;
  difficulty:    QuizDifficulty;
  num_questions: number;
  status:        QuizStatus;
  subject:       string;
  note_name:     string;
  attempt_count: number;
  created_at:    string;
}

export interface QuizQuestion {
  id:            string;
  order:         number;
  question_type: QuestionType;
  question_text: string;
  option_a:      string;
  option_b:      string;
  option_c:      string;
  option_d:      string;
  correct?:      string;       // only present after submitting an attempt
  explanation?:  string;       // only present after submitting an attempt
}

export interface QuizDetail extends QuizListItem {
  error_message: string;
  questions:     QuizQuestion[];
}

export interface QuizStatusPoll {
  id:             string;
  status:         QuizStatus;
  error_message:  string;
  question_count: number;
}

export interface AttemptAnswer {
  question:   QuizQuestion;
  chosen:     string;
  is_correct: boolean;
}

export interface QuizAttemptResult {
  id:              string;
  quiz_title:      string;
  quiz_difficulty: QuizDifficulty;
  score:           number;
  total:           number;
  percentage:      string;
  time_taken_s:    number | null;
  completed_at:    string;
  answers:         AttemptAnswer[];
}

export interface SubjectPerformance {
  subject:  string;
  attempts: number;
  average:  number;
}

export interface DifficultyStats {
  attempts: number;
  average:  number;
}

export interface RecentAttempt {
  id:           string;
  quiz_title:   string;
  difficulty:   QuizDifficulty;
  score:        number;
  total:        number;
  percentage:   number;
  completed_at: string;
}

export interface PerformanceStats {
  total_attempts:       number;
  overall_average:      number;
  readiness_score:      number;
  study_streak:         number;
  subjects:             SubjectPerformance[];
  difficulty_breakdown: Record<QuizDifficulty, DifficultyStats>;
  recent_attempts:      RecentAttempt[];
}

export interface StudentPerformanceSummary {
  id:             string;
  full_name:      string;
  username:       string;
  total_attempts: number;
  average_score:  number;
  last_active:    string | null;
}

export interface CreateQuizPayload {
  note_id:       string;
  difficulty:    QuizDifficulty;
  num_questions: number;
}

// ── Subject / Topic stats ─────────────────────────────────────

export interface SubtopicBreakdown {
  subtopic:  string;
  note_id:   string;
  attempts:  number;
  avg_score: number | null;
}

export interface TopicStudyRecommendation {
  weak_areas:               string[];
  estimated_study_hours:    number;
  expected_improvement_pct: number;
}

export type ConfidenceTrend = 'improving' | 'stable' | 'declining' | 'not_enough_data';

export interface TopicStats {
  subject:             string;
  topic:               string;
  notes_count:         number;
  quizzes_taken:       number;
  average_score:       number | null;
  last_score:          number | null;
  mastery_level:       number | null;
  confidence_trend:    ConfidenceTrend;
  study_minutes:       number;
  subtopic_breakdown:  SubtopicBreakdown[];
  recommendation:      TopicStudyRecommendation;
}

export interface TopicRow {
  topic:       string;
  notes_count: number;
  quizzes:     number;
  avg_score:   number | null;
}

export interface SubjectStats {
  subject:        string;
  topics_count:   number;
  notes_count:    number;
  quizzes_taken:  number;
  average_score:  number | null;
  topics:         TopicRow[];
}

export interface SubmitAttemptPayload {
  answers:      Array<{ question_id: string; chosen: string }>;
  time_taken_s?: number;
}

// ── Lesson Document (AI-first) types ─────────────────────────

export type LessonDocType       = 'plan' | 'note';
export type GenerationMode      = 'ai' | 'upload' | 'manual';
export type LessonDocStatus     =
  | 'draft' | 'generating' | 'submitted' | 'under_review'
  | 'revision_needed' | 'approved' | 'distributed';

export type CurriculumType =
  | 'nerdc' | 'british' | 'american' | 'blend_ng_uk' | 'blend_ng_us';

export interface DiagnosticCard {
  id:               string;
  urgency:          'red' | 'yellow';
  title:            string;
  description:      string;
  section:          string;
  suggestion:       string;
  suggested_content: string | null;
}

export interface ResourceCard {
  id:          string;
  type:        'video' | 'textbook' | 'past_questions' | 'website';
  title:       string;
  description: string;
  relevance:   string;
}

export interface LessonDocListItem {
  id:                  string;
  doc_type:            LessonDocType;
  generation_mode:     GenerationMode;
  subject:             string;
  topic:               string;
  subtopic:            string;
  class_level:         string;
  term:                number;
  week:                number;
  title:               string;
  board_summary:       string;
  status:              LessonDocStatus;
  distributed_to_class: boolean;
  teacher_name:        string;
  class_name:          string | null;
  created_at:          string;
  updated_at:          string;
}

export interface LessonDocDetail extends LessonDocListItem {
  additional_context:  string;
  content_markdown:    string;
  diagnostic_cards:    DiagnosticCard[];
  resource_cards:      ResourceCard[];
  ai_task_id:          string;
  generation_error:    string;
  approved_by_name:    string | null;
  approval_timestamp:  string | null;
  verification_hash:   string;
  admin_comments:      string;
  distributed_at:      string | null;
  version_count:       number;
}

export interface LessonDocVersion {
  id:               string;
  version_number:   number;
  content_markdown: string;
  board_summary:    string;
  saved_by_name:    string | null;
  change_note:      string;
  created_at:       string;
}

export interface CreateLessonDocPayload {
  doc_type:           LessonDocType;
  generation_mode:    GenerationMode;
  subject:            string;
  topic:              string;
  subtopic?:          string;
  class_level:        string;
  term:               number;
  week:               number;
  additional_context?: string;
}

export interface UpdateLessonDocPayload {
  title?:             string;
  content_markdown?:  string;
  board_summary?:     string;
  additional_context?: string;
}

export interface RegenerateSectionPayload {
  section_heading: string;
  instruction?:    string;
}

export interface AdminReviewLessonDocPayload {
  action:   'approve' | 'request_revision';
  comment?: string;
}

// ── Lesson Plan types (legacy) ────────────────────────────────

export type LessonPlanStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'REVISION_NEEDED'
  | 'APPROVED';

export interface LessonPlanListItem {
  id:           string;
  title:        string;
  subject:      string;
  topic:        string;
  status:       LessonPlanStatus;
  teacher_name: string;
  created_at:   string;
  updated_at:   string;
}

export interface LessonPlanComment {
  id:          string;
  author_name: string;
  body:        string;
  created_at:  string;
}

export interface LessonPlanDetail extends LessonPlanListItem {
  teacher_name:     string;
  subtopic:         string;
  duration_minutes: number | null;
  objective:        string;
  materials_needed: string;
  introduction:     string;
  main_content:     string;
  activities:       string;
  assessment:       string;
  homework:         string;
  ai_suggestions:   string;
  comments:         LessonPlanComment[];
}

export interface LessonPlanPayload {
  title:            string;
  subject?:         string;
  topic?:           string;
  subtopic?:        string;
  duration_minutes?: number | null;
  objective?:       string;
  materials_needed?: string;
  introduction?:    string;
  main_content?:    string;
  activities?:      string;
  assessment?:      string;
  homework?:        string;
}

export interface AdminReviewPayload {
  action:   'approve' | 'request_revision';
  comment?: string;
}

// ── Quiz settings types ───────────────────────────────────────

export interface StudentQuizPreferences {
  id:            string;
  num_questions: number;
  difficulty:    QuizDifficulty;
  updated_at:    string;
}

export interface TeacherSubjectThreshold {
  id:             string;
  subject:        string;
  min_questions:  number;
  min_difficulty: QuizDifficulty;
  updated_at:     string;
}

export interface SubjectLimits {
  subject:        string;
  min_questions:  number;
  min_difficulty: QuizDifficulty;
}

export interface TeacherThresholdPayload {
  subject:        string;
  min_questions:  number;
  min_difficulty: QuizDifficulty;
}

export interface StudentPreferencesPayload {
  num_questions?: number;
  difficulty?:    QuizDifficulty;
}
