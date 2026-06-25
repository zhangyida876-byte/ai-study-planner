import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { StageSlug } from '@client/src/config/stages';
import {
  EMPTY_STAGE_PROFILE,
  getExamCountdownDays,
  getProfileStorageKey,
  formatProfileRegion,
  type StageProfile,
} from '@client/src/types/stage-profile';

function loadProfile(stageSlug: StageSlug): StageProfile {
  try {
    const raw = localStorage.getItem(getProfileStorageKey(stageSlug));
    if (!raw) return { ...EMPTY_STAGE_PROFILE };
    return { ...EMPTY_STAGE_PROFILE, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY_STAGE_PROFILE };
  }
}

function saveToStorage(stageSlug: StageSlug, profile: StageProfile) {
  localStorage.setItem(getProfileStorageKey(stageSlug), JSON.stringify(profile));
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((l) => l());
}

export function useStageProfile(stageSlug: StageSlug) {
  const profile = useSyncExternalStore(
    subscribe,
    () => loadProfile(stageSlug),
    () => loadProfile(stageSlug),
  );

  const regionText = useMemo(() => formatProfileRegion(profile), [profile]);
  const countdownDays = useMemo(() => getExamCountdownDays(profile.examDate), [profile.examDate]);

  const saveProfile = useCallback(
    (next: StageProfile) => {
      const withMeta = { ...next, updatedAt: new Date().toISOString() };
      saveToStorage(stageSlug, withMeta);
      notify();
    },
    [stageSlug],
  );

  const updateProfile = useCallback(
    (patch: Partial<StageProfile>) => {
      const current = loadProfile(stageSlug);
      saveProfile({ ...current, ...patch });
    },
    [stageSlug, saveProfile],
  );

  const hasBasicInfo = Boolean(
    profile.studentName || profile.grade || regionText || profile.targetSchool,
  );

  return {
    profile,
    regionText,
    countdownDays,
    saveProfile,
    updateProfile,
    hasBasicInfo,
  };
}
