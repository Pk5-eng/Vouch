export type Category = 'career' | 'academics' | 'life' | 'emotional' | 'logistics' | 'building';
export type Visibility = 'global' | 'trust_group' | 'veiled';
export type QuestionStatus = 'open' | 'resolved';
export type GroupRole = 'creator' | 'member';
export type NotificationType = 'new_response' | 'marked_helpful' | 'outcome_posted' | 'group_invite' | 'vouch_received';

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'career', label: 'Career' },
  { value: 'academics', label: 'Academics' },
  { value: 'life', label: 'Life' },
  { value: 'emotional', label: 'Emotional' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'building', label: 'Building Together' },
];

export interface User {
  id: string;
  email: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  notification_email: string | null;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrustGroup {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  is_private: boolean;
  created_at: string;
}

export interface TrustGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  vouch_context: string | null;
  joined_at: string;
  users?: User;
}

export interface Question {
  id: string;
  author_id: string;
  title: string;
  context: string | null;
  category: Category;
  visibility: Visibility;
  trust_group_id: string | null;
  is_veiled: boolean;
  status: QuestionStatus;
  outcome_text: string | null;
  outcome_at: string | null;
  created_at: string;
  updated_at: string;
  author?: User;
  trust_group?: TrustGroup;
  responses?: Response[];
  response_count?: number;
}

export interface Response {
  id: string;
  question_id: string;
  author_id: string;
  experience: string;
  takeaway: string | null;
  created_at: string;
  author?: User;
  user_has_rated?: boolean;
}

export interface HelpfulnessRating {
  id: string;
  response_id: string;
  rated_by: string;
  is_from_asker: boolean;
  created_at: string;
}

export interface GratitudeNote {
  id: string;
  response_id: string;
  from_user_id: string;
  note: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface UserHelpfulness {
  user_id: string;
  total_helpful_ratings: number;
  helpful_to_asker_count: number;
  questions_helped_on: number;
}
