import React from 'react';
import { Route, Routes, Navigate, useParams } from 'react-router-dom';

import Layout from './components/Layout';
import NotFound from './pages/NotFound/NotFound';
import Workbench from './pages/Workbench/Workbench';
import StageHome from './pages/StageHome/StageHome';
import Diagnosis from './pages/Diagnosis/Diagnosis';
import Plan from './pages/Plan/Plan';
import Knowledge from './pages/Knowledge/Knowledge';
import StudyPlan from './pages/StudyPlan/StudyPlan';
import Advice from './pages/Advice/Advice';
import { isStageSlug } from './config/stages';

const StageGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { stage } = useParams<{ stage: string }>();
  if (!isStageSlug(stage)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
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
          path=":stage/diagnosis"
          element={
            <StageGuard>
              <Diagnosis />
            </StageGuard>
          }
        />
        <Route
          path=":stage/plan"
          element={
            <StageGuard>
              <Plan />
            </StageGuard>
          }
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
          path=":stage/study-plan"
          element={
            <StageGuard>
              <StudyPlan />
            </StageGuard>
          }
        />
        <Route
          path=":stage/advice"
          element={
            <StageGuard>
              <Advice />
            </StageGuard>
          }
        />
        {/* 旧路径兼容 */}
        <Route path="diagnosis" element={<Navigate to="/middle/diagnosis" replace />} />
        <Route path="plan" element={<Navigate to="/middle/plan" replace />} />
        <Route path="knowledge" element={<Navigate to="/middle/knowledge" replace />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default RoutesComponent;
