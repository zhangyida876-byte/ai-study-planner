import React from 'react';
import { Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import NotFound from './pages/NotFound/NotFound';
import Workbench from './pages/Workbench/Workbench';
import Diagnosis from './pages/Diagnosis/Diagnosis';
import Plan from './pages/Plan/Plan';
import Knowledge from './pages/Knowledge/Knowledge';

const RoutesComponent = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Workbench />} />
        <Route path="diagnosis" element={<Diagnosis />} />
        <Route path="plan" element={<Plan />} />
        <Route path="knowledge" element={<Knowledge />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default RoutesComponent;
