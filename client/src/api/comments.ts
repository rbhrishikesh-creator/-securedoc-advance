import { request } from './client';
import { CommentItem } from '../types';

export const commentsApi = {
  list: (documentId: string) =>
    request<{ comments: CommentItem[] }>(`/documents/${documentId}/comments`),

  add: (documentId: string, content: string) =>
    request<{ comment: CommentItem }>(`/documents/${documentId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  delete: (commentId: string) =>
    request<{ message: string }>(`/documents/comments/${commentId}`, {
      method: 'DELETE',
    }),
};
