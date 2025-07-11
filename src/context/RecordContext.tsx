import React, { createContext, useContext, useState, useEffect } from 'react';

interface Record {
  id: string;
  date: string;
  calls: number;
  amount: number;
  image?: string;
}

interface RecordContextType {
  records: Record[];
  setRecords: React.Dispatch<React.SetStateAction<Record[]>>;
  goalCalls: number;
  setGoalCalls: React.Dispatch<React.SetStateAction<number>>;
  goalDeadline: string;
  setGoalDeadline: React.Dispatch<React.SetStateAction<string>>;
  addRecord: (record: Record) => void;
  updateRecord: (id: string, updates: Partial<Record>) => void;
  deleteRecord: (id: string) => void;
}

const RecordContext = createContext<RecordContextType | undefined>(undefined);

export const useRecords = () => {
  const context = useContext(RecordContext);
  if (context === undefined) {
    throw new Error('useRecords must be used within a RecordProvider');
  }
  return context;
};

export const RecordProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<Record[]>([]);
  const [goalCalls, setGoalCalls] = useState(1000);
  const thisYear = new Date().getFullYear();
  const [goalDeadline, setGoalDeadline] = useState<string>(`${thisYear}-12-31`);

  // 로컬 스토리지에서 데이터 로드
  useEffect(() => {
    const savedRecords = localStorage.getItem('call-tracker-records');
    const savedGoal = localStorage.getItem('call-tracker-goal');
    const savedDeadline = localStorage.getItem('call-tracker-deadline');
    if (savedRecords) {
      setRecords(JSON.parse(savedRecords));
    }
    if (savedGoal) {
      setGoalCalls(JSON.parse(savedGoal));
    }
    if (savedDeadline) {
      setGoalDeadline(savedDeadline);
    }
  }, []);

  // 데이터 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem('call-tracker-records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('call-tracker-goal', JSON.stringify(goalCalls));
  }, [goalCalls]);

  useEffect(() => {
    localStorage.setItem('call-tracker-deadline', goalDeadline);
  }, [goalDeadline]);

  const addRecord = (record: Record) => {
    setRecords(prev => [...prev, record]);
  };

  const updateRecord = (id: string, updates: Partial<Record>) => {
    setRecords(prev => prev.map(record => 
      record.id === id ? { ...record, ...updates } : record
    ));
  };

  const deleteRecord = (id: string) => {
    setRecords(prev => prev.filter(record => record.id !== id));
  };

  const value = {
    records,
    setRecords,
    goalCalls,
    setGoalCalls,
    goalDeadline,
    setGoalDeadline,
    addRecord,
    updateRecord,
    deleteRecord,
  };

  return (
    <RecordContext.Provider value={value}>
      {children}
    </RecordContext.Provider>
  );
}; 