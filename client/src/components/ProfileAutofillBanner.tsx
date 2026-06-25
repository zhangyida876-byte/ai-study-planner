import React from 'react';
import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { StageSlug } from '@client/src/config/stages';
import { stagePath } from '@client/src/config/stages';
import type { StageProfile } from '@client/src/types/stage-profile';

interface ProfileAutofillBannerProps {
  stageSlug: StageSlug;
  profile: StageProfile;
  regionText: string;
  onSyncBack?: () => void;
  showSyncBack?: boolean;
}

const ProfileAutofillBanner: React.FC<ProfileAutofillBannerProps> = ({
  stageSlug,
  profile,
  regionText,
  onSyncBack,
  showSyncBack,
}) => {
  if (!profile.studentName && !profile.grade && !regionText) {
    return (
      <div className="mb-4 rounded-lg border-2 border-dashed border-marker-red/40 bg-marker-red/5 px-4 py-3 font-hand text-sm">
        尚未填写学段主页学生档案。
        <Button variant="ghost" className="h-auto p-0 font-hand text-pen-blue" asChild>
          <Link to={stagePath(stageSlug)}>前往填写 →</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border-2 border-pen-blue/30 bg-pen-blue/5 px-4 py-3">
      <div className="flex items-start gap-2 font-hand text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-pen-blue" />
        <div>
          <p className="font-medium text-pen-blue">已从学段主页自动带入</p>
          <p className="mt-0.5 text-ink/70">
            {[profile.studentName, regionText, profile.grade, profile.targetSchool]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        {showSyncBack && onSyncBack && (
          <Button variant="outline" size="sm" className="font-hand" onClick={onSyncBack}>
            同步回主页档案
          </Button>
        )}
        <Button variant="ghost" size="sm" className="font-hand" asChild>
          <Link to={stagePath(stageSlug)}>编辑档案</Link>
        </Button>
      </div>
    </div>
  );
};

export default ProfileAutofillBanner;
