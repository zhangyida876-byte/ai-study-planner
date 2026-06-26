import { useState, useEffect } from 'react';
import type { StageSlug } from '@client/src/config/stages';
import { logger } from '@lark-apaas/client-toolkit/logger';

export interface StudentInfo {
  studentName: string;
  region: string;
  grade: string;
  school: string;
  targetSchool: string;
  targetExamDate: string;
  currentScore: string;
  weakSubjects: string[];
  weeklyStudyHours: number;
  boardingType: 'day' | 'boarding';
}

export function useStudentInfo(stage: StageSlug) {
  const [studentInfo, setStudentInfo] = useState<StudentInfo>({
    studentName: '',
    region: '',
    grade: '',
    school: '',
    targetSchool: '',
    targetExamDate: '',
    currentScore: '',
    weakSubjects: [],
    weeklyStudyHours: 0,
    boardingType: 'day',
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // 从localStorage加载学生信息
  useEffect(() => {
    const savedInfo = localStorage.getItem(`student_${stage}_info`);
    if (savedInfo) {
      try {
        setStudentInfo(JSON.parse(savedInfo));
      } catch (e) {
        logger.error('加载学生信息失败', String(e));
      }
    }
    setIsLoaded(true);
  }, [stage]);

  // 保存信息到localStorage
  const saveStudentInfo = (info: Partial<StudentInfo>, syncToGlobal = false) => {
    const updated = { ...studentInfo, ...info };
    setStudentInfo(updated);
    if (syncToGlobal) {
      localStorage.setItem(`student_${stage}_info`, JSON.stringify(updated));
    }
    return updated;
  };

  return {
    studentInfo,
    saveStudentInfo,
    isLoaded,
    hasRequiredInfo: !!studentInfo.region && !!studentInfo.grade,
  };
}
