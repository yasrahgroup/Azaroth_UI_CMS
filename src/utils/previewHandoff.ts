export interface PreviewDraftResult {
  saved: boolean;
  path?: string;
}

type PreviewDraftSaver = () => Promise<PreviewDraftResult>;

let activeSaver: PreviewDraftSaver | null = null;

export function registerPreviewDraftSaver(saver: PreviewDraftSaver): () => void {
  activeSaver = saver;
  return () => {
    if (activeSaver === saver) activeSaver = null;
  };
}

export async function saveDraftBeforePreview(): Promise<PreviewDraftResult> {
  if (!activeSaver) return { saved: true };
  try {
    return await activeSaver();
  } catch {
    return { saved: false };
  }
}
