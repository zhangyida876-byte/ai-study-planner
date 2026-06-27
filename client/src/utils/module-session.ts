import type { StageSlug } from '@client/src/config/stages';

const MODULE_SESSION_VERSION = 'v2';

function getSessionKey(stageSlug: StageSlug, moduleName: string): string {
  return `education-ai:module-session:${MODULE_SESSION_VERSION}:${stageSlug}:${moduleName}`;
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

export function clearModuleSession(stageSlug: StageSlug, moduleName: string) {
  try {
    localStorage.removeItem(getSessionKey(stageSlug, moduleName));
  } catch {
    // ignore storage errors
  }
}
