import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRecords } from '../context/RecordContext';
import Tesseract from 'tesseract.js';

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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState('');
  const [fields, setFields] = useState({
    date: '',
    calls: '',
    amount: '',
    distance: '',
  });

  // OCR로 텍스트에서 데이터 추출
  const extractFields = (text: string) => {
    // 날짜: YYYY.MM.DD 또는 YYYY-MM-DD
    const dateMatch = text.match(/(20[0-9]{2}[.\-][0-9]{2}[.\-][0-9]{2})/);
    // 콜수: XX건
    const callsMatch = text.match(/([0-9]+)건/);
    // 금액: 123,456원
    const amountMatch = text.match(/([0-9,]+)원/);
    // 거리: XX.Xkm
    const distanceMatch = text.match(/([0-9]+\.?[0-9]*)km/);
    return {
      date: dateMatch ? dateMatch[1].replace(/\./g, '-').replace(/\-/g, '-') : '',
      calls: callsMatch ? callsMatch[1] : '',
      amount: amountMatch ? amountMatch[1].replace(/,/g, '') : '',
      distance: distanceMatch ? distanceMatch[1] : '',
    };
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
        Tesseract.recognize(reader.result as string, 'kor+eng', { logger: m => {} })
          .then(({ data: { text } }) => {
            setOcrResult(text);
            const extracted = extractFields(text);
            setFields(extracted);
            setLoading(false);
          })
          .catch(() => setLoading(false));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleFieldChange = (field: string, value: string) => {
    setFields(prev => ({ ...prev, [field]: value }));
  };

  // 저장 버튼 클릭 시
  const handleSave = () => {
    if (!fields.date) {
      alert('날짜를 인식하지 못했습니다. 직접 입력해 주세요.');
      return;
    }
    const record = {
      id: Date.now().toString(),
      date: fields.date.length === 10 ? fields.date : '',
      calls: parseInt(fields.calls) || 0,
      amount: parseInt(fields.amount) || 0,
      distance: parseFloat(fields.distance) || 0,
      image: imagePreview || undefined,
    };
    addRecord(record);
    setTodayRecord(record as any);
    setImagePreview(null);
    setFields({ date: '', calls: '', amount: '', distance: '' });
    setOcrResult('');
    alert('기록이 저장되었습니다!');
  };

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
        <h3 className="text-lg font-bold mb-4">기록 사진 업로드 (OCR 자동 인식)</h3>
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
        {loading && <div className="mt-4 text-yellow-400">사진에서 글자를 인식 중입니다...</div>}
      </div>

      {/* 미리보기 및 입력값 확인/수정 */}
      {imagePreview && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-bold mb-4">입력값 확인 및 수정</h3>
          <div className="flex flex-col md:flex-row gap-4">
            <img
              src={imagePreview}
              alt="업로드된 기록"
              className="w-full max-w-xs h-auto object-contain rounded-lg border border-gray-700"
            />
            <div className="flex-1 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">날짜</label>
                <input
                  type="text"
                  value={fields.date}
                  onChange={e => handleFieldChange('date', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
                  placeholder="YYYY-MM-DD"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">콜 수</label>
                <input
                  type="number"
                  value={fields.calls}
                  onChange={e => handleFieldChange('calls', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">금액 (원)</label>
                <input
                  type="number"
                  value={fields.amount}
                  onChange={e => handleFieldChange('amount', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">운행 거리 (km)</label>
                <input
                  type="number"
                  value={fields.distance}
                  onChange={e => handleFieldChange('distance', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
                  placeholder="0"
                />
              </div>
              <button
                onClick={handleSave}
                className="w-full mt-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold rounded-lg transition-colors"
              >
                저장
              </button>
            </div>
          </div>
          {ocrResult && (
            <div className="mt-4 text-xs text-gray-400 whitespace-pre-wrap">
              <b>OCR 인식 결과:</b>
              <br />
              {ocrResult}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadScreen; 