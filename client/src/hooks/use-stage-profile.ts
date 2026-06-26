import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { StageSlug } from '@client/src/config/stages';
import {
  EMPTY_STAGE_PROFILE,
  getExamCountdownDays,
  getProfileStorageKey,
  formatProfileRegion,
  type StageProfile,
} from '@client/src/types/stage-profile';

/** 各学段空档案单例 — useSyncExternalStore 要求 snapshot 引用稳定 */
const EMPTY_BY_STAGE: Record<StageSlug, StageProfile> = {
  elementary: { ...EMPTY_STAGE_PROFILE },
  middle: { ...EMPTY_STAGE_PROFILE },
  high: { ...EMPTY_STAGE_PROFILE },
};

type CacheEntry = { raw: string; profile: StageProfile };
const profileCache = new Map<StageSlug, CacheEntry>();

function readRaw(stageSlug: StageSlug): string {
  return localStorage.getItem(getProfileStorageKey(stageSlug)) ?? '';
}

function parseProfile(stageSlug: StageSlug, raw: string): StageProfile {
  if (!raw) return EMPTY_BY_STAGE[stageSlug];
  try {
    return { ...EMPTY_STAGE_PROFILE, ...JSON.parse(raw) };
  } catch {
    return EMPTY_BY_STAGE[stageSlug];
  }
}

/** getSnapshot 必须返回稳定引用，否则 React 无限重渲染 */
function loadProfile(stageSlug: StageSlug): StageProfile {
  const raw = readRaw(stageSlug);
  const cached = profileCache.get(stageSlug);
  if (cached && cached.raw === raw) return cached.profile;

  const profile = parseProfile(stageSlug, raw);
  profileCache.set(stageSlug, { raw, profile });
  return profile;
}

function commitProfile(stageSlug: StageSlug, profile: StageProfile) {
  const raw = JSON.stringify(profile);
  localStorage.setItem(getProfileStorageKey(stageSlug), raw);
  profileCache.set(stageSlug, { raw, profile });
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
      commitProfile(stageSlug, withMeta);
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
