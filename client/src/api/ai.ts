import { request } from './client';

export interface DocumentAiMetadata {
  summary?: string;
  keyInsights?: string[];
  classification?: 'Confidential' | 'Internal' | 'Public' | 'Restricted' | 'Financial' | 'Legal' | 'Technical';
  riskScore?: number; // 0 - 100
  suggestedTags?: string[];
  extractedTextSnippet?: string;
  entities?: { name: string; type: string }[];
  processedAt?: string;
}

export interface AskAiResponse {
  answer: string;
  confidence: number;
  timestamp: string;
}

export const aiApi = {
  analyzeDocument: (docId: string) =>
    request<{ aiMetadata: DocumentAiMetadata; tags: string[] }>(`/ai/analyze/${docId}`, {
      method: 'POST',
    }),

  askDocumentAi: (
    docId: string,
    question: string,
    history: Array<{ role: 'user' | 'model'; content: string }> = []
  ) =>
    request<AskAiResponse>(`/ai/ask/${docId}`, {
      method: 'POST',
      body: JSON.stringify({ question, history }),
    }),

  getSummary: (docId: string) =>
    request<{ aiMetadata: DocumentAiMetadata }>(`/ai/summary/${docId}`),
};
