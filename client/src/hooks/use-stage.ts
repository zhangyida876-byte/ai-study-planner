import { useMemo } from 'react';
import { useParams, NavigateOptions, useNavigate } from 'react-router-dom';
import {
  parseStageSlug,
  STAGE_CONFIGS,
  type StageConfig,
  type StageSlug,
  type FeatureSlug,
  stagePath,
} from '@client/src/config/stages';

export function useStageFromRoute(): {
  stageSlug: StageSlug | null;
  stageConfig: StageConfig | null;
  isStageRoute: boolean;
} {
  const { stage: rawStage } = useParams<{ stage?: string }>();
  const stageSlug = parseStageSlug(rawStage);

  return useMemo(
    () => ({
      stageSlug,
      stageConfig: stageSlug ? STAGE_CONFIGS[stageSlug] : null,
      isStageRoute: stageSlug != null,
    }),
    [stageSlug],
  );
}

export function useRequiredStage(): {
  stageSlug: StageSlug;
  stageConfig: StageConfig;
} {
  const { stageSlug, stageConfig } = useStageFromRoute();
  if (!stageSlug || !stageConfig) {
    throw new Error('useRequiredStage must be used within /:stage/* routes');
  }
  return { stageSlug, stageConfig };
}

export function useStageNavigation() {
  const navigate = useNavigate();
  const { stageSlug } = useStageFromRoute();

  const goToFeature = (feature: FeatureSlug, options?: NavigateOptions) => {
    if (!stageSlug) return;
    navigate(stagePath(stageSlug, feature), options);
  };

  return { stageSlug, goToFeature, stagePath };
}
