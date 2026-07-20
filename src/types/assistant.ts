import { ProductSummary } from './product';

export type ChatRole = 'user' | 'assistant';

export interface ChatAction {
  label: string;
  onClick: () => void;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  products?: ProductSummary[];
  actions?: ChatAction[];
  isError?: boolean;
}

export interface AssistantHistoryTurn {
  role: ChatRole;
  content: string;
}

export interface AssistantChatResponse {
  success: boolean;
  reply: string;
  products?: ProductSummary[];
  navigateTo?: string;
  message?: string;
}
