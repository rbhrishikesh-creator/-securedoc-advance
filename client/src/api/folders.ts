import { request } from './client';
import { Folder } from '../types';

export const foldersApi = {
  list: () => request<{ folders: Folder[] }>('/folders'),

  create: (name: string, parentFolderId?: string) =>
    request<{ message: string; folder: Folder }>('/folders', {
      method: 'POST',
      body: JSON.stringify({ name, parentFolderId }),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/folders/${id}`, {
      method: 'DELETE',
    }),
};
