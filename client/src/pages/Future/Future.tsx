import React from 'react';
import Diagnosis from '@client/src/pages/Diagnosis/Diagnosis';

/**
 * 旧版未来规划路由的兼容入口。
 * 业务已统一到学情诊断与升学规划，避免再次挂载两套独立表单。
 */
const Future: React.FC = () => <Diagnosis />;

export default Future;
