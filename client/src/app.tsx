import React, { Suspense } from 'react';
import { Route, Routes, Navigate, useParams } from 'react-router-dom';

import Layout from './components/Layout';
import NotFound from './pages/NotFound/NotFound';
import Workbench from './pages/Workbench/Workbench';
import StageHome from './pages/StageHome/StageHome';
import Diagnosis from './pages/Diagnosis/Diagnosis';
import Knowledge from './pages/Knowledge/Knowledge';
import History from './pages/History/History';
import { isStageSlug } from './config/stages';

const CaseMaterials = React.lazy(() => import('./pages/CaseMaterials/CaseMaterials'));
const Scripts = React.lazy(() => import('./pages/Scripts/Scripts'));

const PageLoader: React.FC = () => (
  <div className="font-hand p-6 text-muted-foreground">正在加载页面...</div>
);

const StageGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { stage } = useParams<{ stage: string }>();
  if (!isStageSlug(stage)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const StageLegacyRedirect: React.FC<{
  target: 'phone' | 'wechat' | 'future' | 'scripts';
  tab?: string;
}> = ({ target, tab }) => {
  const { stage } = useParams<{ stage: string }>();
  if (!isStageSlug(stage)) return <Navigate to="/" replace />;
  const search = tab ? `?tab=${tab}` : '';
  return <Navigate to={`/${stage}/${target}${search}`} replace />;
};

const RoutesComponent = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Workbench />} />
        <Route
          path=":stage"
          element={
            <StageGuard>
              <StageHome />
            </StageGuard>
          }
        />
        <Route
          path=":stage/phone"
          element={
            <StageGuard>
              <Diagnosis experience="phone" />
            </StageGuard>
          }
        />
        <Route
          path=":stage/wechat"
          element={
            <StageGuard>
              <Diagnosis experience="wechat" />
            </StageGuard>
          }
        />
        <Route path=":stage/diagnosis" element={<StageLegacyRedirect target="phone" />} />
        <Route
          path=":stage/future"
          element={<StageLegacyRedirect target="phone" />}
        />
        <Route
          path=":stage/knowledge"
          element={
            <StageGuard>
              <Knowledge />
            </StageGuard>
          }
        />
        <Route
          path=":stage/materials"
          element={
            <StageGuard>
              <Suspense fallback={<PageLoader />}>
                <CaseMaterials />
              </Suspense>
            </StageGuard>
          }
        />
        <Route
          path=":stage/scripts"
          element={
            <StageGuard>
              <Suspense fallback={<PageLoader />}>
                <Scripts />
              </Suspense>
            </StageGuard>
          }
        />
        <Route
          path=":stage/history"
          element={
            <StageGuard>
              <History />
            </StageGuard>
          }
        />
        <Route path=":stage/plan" element={<StageLegacyRedirect target="phone" />} />
        <Route path=":stage/study-plan" element={<StageLegacyRedirect target="phone" />} />
        <Route path=":stage/advice" element={<StageLegacyRedirect target="scripts" tab="objection" />} />
        {/* 旧路径兼容 */}
        <Route path="diagnosis" element={<Navigate to="/middle/phone" replace />} />
        <Route path="phone" element={<Navigate to="/middle/phone" replace />} />
        <Route path="wechat" element={<Navigate to="/middle/wechat" replace />} />
        <Route path="plan" element={<Navigate to="/middle/phone" replace />} />
        <Route path="study-plan" element={<Navigate to="/middle/phone" replace />} />
        <Route path="advice" element={<Navigate to="/middle/scripts?tab=objection" replace />} />
        <Route path="knowledge" element={<Navigate to="/middle/knowledge" replace />} />
        <Route path="materials" element={<Navigate to="/middle/materials" replace />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default RoutesComponent;
