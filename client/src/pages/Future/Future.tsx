import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { isStageSlug } from '@client/src/config/stages';

/**
 * 旧版未来规划路由的兼容入口。
 * 业务已统一到学情诊断与升学规划，避免再次挂载两套独立表单。
 */
const Future: React.FC = () => {
  const { stage } = useParams<{ stage?: string }>();
  if (!isStageSlug(stage)) return <Navigate to="/" replace />;
  return <Navigate to={`/${stage}/diagnosis`} replace />;
};

export default Future;
