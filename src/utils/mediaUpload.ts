import type { MediaItem } from '../types/index.js';

export interface AdminMediaUploadOptions {
  altText?: string;
  token?: string | null;
}

export type AdminMediaUploadResult =
  | { ok: true; media: MediaItem }
  | { ok: false; error: string };

export async function uploadAdminMedia(
  file: File,
  options: AdminMediaUploadOptions = {}
): Promise<AdminMediaUploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('altText', options.altText || file.name.replace(/\.[^/.]+$/, ''));

  const activeToken = options.token || localStorage.getItem('ath_token');
  const headers: Record<string, string> = {};
  if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

  try {
    const response = await fetch('/api/media/upload', {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return { ok: false, error: data?.error || 'Upload failed' };
    }
    if (!data?.url) {
      return { ok: false, error: 'Upload succeeded without a media URL' };
    }

    return { ok: true, media: data as MediaItem };
  } catch {
    return { ok: false, error: 'Upload failed due to a network error' };
  }
}
