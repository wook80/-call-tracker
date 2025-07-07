import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRecords } from '../context/RecordContext';

interface Record {
  id: string;
  date: string;
  calls: number;
  amount: number;
  image?: string;
}

const UploadScreen: React.FC = () => {
  const { records, addRecord, updateRecord } = useRecords();
  const [todayRecord, setTodayRecord] = useState<Record | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const today = new Date().toISOString().split('T')[0];
        const newRecord = {
          id: Date.now().toString(),
          date: today,
          calls: 0,
          amount: 0,
          image: reader.result as string
        };
        
        // 오늘 기록이 있으면 업데이트, 없으면 새로 생성
        const existingIndex = records.findIndex(r => r.date === today);
        if (existingIndex >= 0) {
          const existingRecord = records[existingIndex];
          updateRecord(existingRecord.id, { image: reader.result as string });
          setTodayRecord({ ...existingRecord, image: reader.result as string });
        } else {
          addRecord(newRecord);
          setTodayRecord(newRecord);
        }
      };
      reader.readAsDataURL(file);
    }
  }, [records, addRecord, updateRecord]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false
  });

  const updateTodayRecord = (field: 'calls' | 'amount', value: number) => {
    const today = new Date().toISOString().split('T')[0];
    const existingIndex = records.findIndex(r => r.date === today);
    
    if (existingIndex >= 0) {
      const existingRecord = records[existingIndex];
      updateRecord(existingRecord.id, { [field]: value });
      setTodayRecord({ ...existingRecord, [field]: value });
    } else {
      const newRecord = {
        id: Date.now().toString(),
        date: today,
        calls: field === 'calls' ? value : 0,
        amount: field === 'amount' ? value : 0,
        image: todayRecord?.image
      };
      addRecord(newRecord);
      setTodayRecord(newRecord);
    }
  };

  // 오늘 기록 찾기
  React.useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayRec = records.find(r => r.date === today);
    setTodayRecord(todayRec || null);
  }, [records]);

  const getTodayStatus = () => {
    if (!todayRecord || (todayRecord.calls === 0 && todayRecord.amount === 0)) {
      return "오늘 아직 입력 없음";
    }
    return `${todayRecord.calls}콜 / ${todayRecord.amount.toLocaleString()}원 입력됨`;
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-6">
      {/* 오늘 기록 상태 */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-bold mb-2">오늘 기록 상태</h2>
        <p className="text-yellow-400 font-semibold">{getTodayStatus()}</p>
      </div>

      {/* 콜/금액 입력 */}
      <div className="bg-gray-800 rounded-lg p-4 space-y-4">
        <h3 className="text-lg font-bold">오늘 기록 입력</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">콜 수</label>
            <input
              type="number"
              value={todayRecord?.calls || 0}
              onChange={(e) => updateTodayRecord('calls', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">금액 (원)</label>
            <input
              type="number"
              value={todayRecord?.amount || 0}
              onChange={(e) => updateTodayRecord('amount', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* 사진 업로드 */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-bold mb-4">기록 사진 업로드</h3>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-yellow-400 bg-yellow-400/10' : 'border-gray-600 hover:border-gray-500'
          }`}
        >
          <input {...getInputProps()} />
          <div className="text-4xl mb-4">📸</div>
          {isDragActive ? (
            <p className="text-yellow-400">여기에 사진을 놓으세요!</p>
          ) : (
            <div>
              <p className="text-gray-300 mb-2">사진을 드래그하거나 클릭하여 업로드</p>
              <p className="text-sm text-gray-500">JPG, PNG, GIF 파일 지원</p>
            </div>
          )}
        </div>
      </div>

      {/* 최근 업로드한 사진 미리보기 */}
      {todayRecord?.image && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-bold mb-4">최근 업로드한 사진</h3>
          <div className="relative">
            <img
              src={todayRecord.image}
              alt="업로드된 기록"
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                const todayRec = records.find(r => r.date === today);
                if (todayRec) {
                  updateRecord(todayRec.id, { image: undefined });
                  setTodayRecord(prev => prev ? { ...prev, image: undefined } : null);
                }
              }}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadScreen; 