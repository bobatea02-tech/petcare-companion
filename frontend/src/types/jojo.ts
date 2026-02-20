/**
 * TypeScript types for JoJo AI Assistant API responses
 */

export interface JoJoChatResponse {
  response: string;
  conversation_id: string;
  questions_remaining: number;
  pet_identified: boolean;
  quota_exceeded: boolean;
  needs_pet_name?: boolean;
  action_taken: boolean;
  action_type?: string;
  action_details?: Record<string, any>;
  speak_response: boolean;
  needs_clarification: boolean;
}

export interface JoJoChatRequest {
  message: string;
  conversation_id?: string;
  pet_name?: string;
}

export interface JojoQuotaResponse {
  questions_remaining: number;
  quota_resets_at?: string;
  questions_per_hour: number;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ConversationHistoryResponse {
  conversation_id: string;
  messages: ConversationMessage[];
  created_at: string;
  last_accessed_at: string;
}
