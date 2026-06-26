import type { StageSlug } from '@client/src/config/stages';

function getSessionKey(stageSlug: StageSlug, moduleName: string): string {
  return `education-ai:module-session:${stageSlug}:${moduleName}`;
}

export function loadModuleSession<T>(
  stageSlug: StageSlug,
  moduleName: string,
): T | null {
  try {
    const raw = localStorage.getItem(getSessionKey(stageSlug, moduleName));
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveModuleSession<T>(
  stageSlug: StageSlug,
  moduleName: string,
  data: T,
) {
  try {
    localStorage.setItem(getSessionKey(stageSlug, moduleName), JSON.stringify(data));
  } catch {
    // ignore quota/storage errors
  }
}
