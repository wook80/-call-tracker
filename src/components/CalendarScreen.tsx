import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRecords } from '../context/RecordContext';

const CalendarScreen: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { records, goalCalls, setGoalCalls, updateRecord, addRecord } = useRecords();

  // 목표 마감일 상태 추가 (기본값: 올해 12월 31일)
  const thisYear = new Date().getFullYear();
  const [goalDeadline, setGoalDeadline] = useState<string>(`${thisYear}-12-31`);
  const [showGoalModal, setShowGoalModal] = useState(false);

  // 날짜별 입력/수정 모달 상태
  const [editDate, setEditDate] = useState<Date | null>(null);
  const [editFields, setEditFields] = useState({
    calls: '',
    amount: '',
    image: undefined as string | undefined,
  });
  const [editImagePreview, setEditImagePreview] = useState<string | undefined>(undefined);

  // 월요일 시작 요일 배열
  const weekDays = ['월', '화', '수', '목', '금', '토', '일'];

  // 현재 월의 모든 날짜 생성 (월요일 시작)
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // 월 이동
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // 목표 대비 현황 계산
  const totalCalls = records.reduce((sum, record) => sum + record.calls, 0);
  const remainingCalls = goalCalls - totalCalls;
  const today = new Date();
  const deadlineDate = parseISO(goalDeadline);
  const remainingDays = Math.max(0, Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const averageCallsPerDay = remainingDays > 0 ? Math.ceil(remainingCalls / remainingDays) : 0;

  // 특정 날짜의 기록 가져오기
  const getRecordForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return records.find(record => record.date === dateStr);
  };

  // 월요일 시작 달력 그리드 만들기
  const getCalendarGrid = () => {
    const firstDay = getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1; // 월요일=0, 일요일=6
    const prefix = Array(firstDay).fill(null);
    return [...prefix, ...daysInMonth];
  };

  // 날짜 클릭 시 입력/수정 모달 오픈
  const handleDateClick = (date: Date) => {
    const record = getRecordForDate(date);
    setEditDate(date);
    setEditFields({
      calls: record ? String(record.calls) : '',
      amount: record ? String(record.amount) : '',
      image: record?.image,
    });
    setEditImagePreview(record?.image);
  };

  // 입력값 변경
  const handleEditFieldChange = (field: string, value: string) => {
    setEditFields(prev => ({ ...prev, [field]: value }));
  };

  // 사진 교체
  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setEditImagePreview(reader.result as string);
        setEditFields(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // 사진 삭제
  const handleEditImageDelete = () => {
    setEditImagePreview(undefined);
    setEditFields(prev => ({ ...prev, image: undefined }));
  };

  // 저장 버튼 클릭 시
  const handleEditSave = () => {
    if (!editDate) return;
    const dateStr = format(editDate, 'yyyy-MM-dd');
    const record = getRecordForDate(editDate);
    if (record) {
      updateRecord(record.id, {
        calls: parseInt(editFields.calls) || 0,
        amount: parseInt(editFields.amount) || 0,
        image: editFields.image,
      });
    } else {
      addRecord({
        id: Date.now().toString(),
        date: dateStr,
        calls: parseInt(editFields.calls) || 0,
        amount: parseInt(editFields.amount) || 0,
        image: editFields.image,
      });
    }
    setEditDate(null);
    setEditFields({ calls: '', amount: '', image: undefined });
    setEditImagePreview(undefined);
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      {/* 헤더 - 월 이동 */}
      <div className="flex justify-between items-center bg-gray-800 rounded-lg p-4">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          ←
        </button>
        <h2 className="text-xl font-bold">
          {format(currentDate, 'yyyy년 MM월', { locale: ko })}
        </h2>
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          →
        </button>
      </div>

      {/* 달력 */}
      <div className="bg-gray-800 rounded-lg p-4">
        {/* 요일 헤더 (월요일 시작) */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 (월요일 시작) */}
        <div className="grid grid-cols-7 gap-1">
          {getCalendarGrid().map((day, idx) => {
            if (!day) {
              return <div key={idx} />;
            }
            const record = getRecordForDate(day as Date);
            const isToday = isSameDay(day as Date, new Date());
            return (
              <div
                key={(day as Date).toString()}
                className={`min-h-[60px] p-1 border border-gray-700 rounded-lg cursor-pointer transition-colors ${
                  isToday ? 'bg-yellow-400/20 border-yellow-400' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                onClick={() => handleDateClick(day as Date)}
              >
                <div className="text-xs text-gray-400 mb-1">
                  {format(day as Date, 'd')}
                </div>
                {record && (record.calls > 0 || record.amount > 0) && (
                  <div className="text-xs">
                    <div className="text-green-400 font-medium">{record.calls}콜</div>
                    <div className="text-yellow-400">{record.amount.toLocaleString()}원</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 목표 대비 현황 */}
      <div className="bg-gray-800 rounded-lg p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold">목표 대비 현황</h3>
          <button
            onClick={() => setShowGoalModal(true)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
          >
            목표 설정
          </button>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>목표:</span>
            <span className="font-bold text-yellow-400">{goalCalls.toLocaleString()}콜</span>
          </div>
          <div className="flex justify-between">
            <span>완료:</span>
            <span className="font-bold text-green-400">{totalCalls.toLocaleString()}콜</span>
          </div>
          <div className="flex justify-between">
            <span>남은:</span>
            <span className="font-bold text-red-400">{remainingCalls.toLocaleString()}콜</span>
          </div>
          <div className="flex justify-between">
            <span>남은 날:</span>
            <span className="font-bold">{remainingDays}일</span>
          </div>
          <div className="flex justify-between">
            <span>하루 평균:</span>
            <span className="font-bold text-blue-400">{averageCallsPerDay}콜</span>
          </div>
          <div className="flex justify-between">
            <span>목표 마감일:</span>
            <span className="font-bold text-gray-300">{goalDeadline}</span>
          </div>
        </div>

        {/* 진행률 바 */}
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min((totalCalls / goalCalls) * 100, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* 목표 설정 모달 */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-80">
            <h3 className="text-lg font-bold mb-4">목표 설정</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">목표 콜 수</label>
              <input
                type="number"
                value={goalCalls}
                onChange={(e) => setGoalCalls(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
                placeholder="목표 콜 수"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">목표 마감일</label>
              <input
                type="date"
                value={goalDeadline}
                onChange={(e) => setGoalDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowGoalModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
              >
                취소
              </button>
              <button
                onClick={() => setShowGoalModal(false)}
                className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 날짜별 입력/수정 모달 */}
      {editDate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-auto relative">
            <button
              onClick={() => setEditDate(null)}
              className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center z-10"
            >
              ×
            </button>
            <h3 className="text-lg font-bold mb-4">{format(editDate, 'yyyy-MM-dd')} 기록 입력/수정</h3>
            {editImagePreview && (
              <div className="mb-4">
                <img
                  src={editImagePreview}
                  alt="기록 사진 미리보기"
                  className="w-full max-h-60 object-contain rounded-lg border border-gray-700"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleEditImageDelete}
                    className="flex-1 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm"
                  >
                    사진 삭제
                  </button>
                  <label className="flex-1 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm text-center cursor-pointer">
                    사진 교체
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleEditImageChange}
                    />
                  </label>
                </div>
              </div>
            )}
            {!editImagePreview && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">사진 추가</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
                />
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">콜 수</label>
                <input
                  type="number"
                  value={editFields.calls}
                  onChange={e => handleEditFieldChange('calls', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">금액 (원)</label>
                <input
                  type="number"
                  value={editFields.amount}
                  onChange={e => handleEditFieldChange('amount', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
                  placeholder="0"
                />
              </div>
              <button
                onClick={handleEditSave}
                className="w-full mt-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold rounded-lg transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarScreen; 