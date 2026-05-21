// Shared TypeScript types used across all Edge Functions.
// Mirrors snake_case from the DB schema so we don't waste cycles on mapping.

export type Rating = 1 | 2 | 3 | 4; // 1 Again, 2 Hard, 3 Good, 4 Easy
export type FsrsStateName = 'new' | 'learning' | 'review' | 'relearning';
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';
export type StudyPlanStatus = 'active' | 'paused' | 'completed' | 'abandoned';

export interface FsrsCardRow {
  id: string;
  user_id: string;
  question_id: string;
  state: FsrsStateName;
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  last_review: string | null;
}

export interface QuizQuestionRow {
  id: string;
  certification_id: string;
  module_id: string | null;
  question_text: string;
  question_type: 'single_choice' | 'multi_choice' | 'true_false' | 'short_answer';
  options: Array<{ id: string; text: string }>;
  correct_answer: string[];
  explanation: string | null;
  difficulty: number;
}

export interface ConceptRow {
  id: string;
  certification_id: string;
  slug: string;
  name: string;
  description: string | null;
}

export interface ConceptMasteryRow {
  user_id: string;
  concept_id: string;
  mastery_score: number;
  attempts: number;
  correct: number;
  last_seen_at: string | null;
  updated_at: string;
}

export interface ModuleRow {
  id: string;
  certification_id: string;
  title: string;
  description: string | null;
  order_index: number;
  estimated_minutes: number;
}

export interface LessonRow {
  id: string;
  module_id: string;
  title: string;
  content_md: string | null;
  video_url: string | null;
  order_index: number;
  estimated_minutes: number;
}
