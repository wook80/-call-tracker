import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRecords } from '../context/RecordContext';

interface Record {
  id: string;
  date: string;
  calls: number;
  amount: number;
  image?: string;
}

const CalendarScreen: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { records, goalCalls, setGoalCalls } = useRecords();

  // 목표 설정 모달
  const [showGoalModal, setShowGoalModal] = useState(false);

  // 현재 월의 모든 날짜 생성
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // 월 이동
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // 목표 대비 현황 계산
  const totalCalls = records.reduce((sum, record) => sum + record.calls, 0);
  const remainingCalls = goalCalls - totalCalls;
  const remainingDays = Math.ceil((new Date(2024, 11, 31).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const averageCallsPerDay = remainingDays > 0 ? Math.ceil(remainingCalls / remainingDays) : 0;

  // 특정 날짜의 기록 가져오기
  const getRecordForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return records.find(record => record.date === dateStr);
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
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['일', '월', '화', '수', '목', '금', '토'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-1">
          {daysInMonth.map(day => {
            const record = getRecordForDate(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div
                key={day.toString()}
                className={`min-h-[60px] p-1 border border-gray-700 rounded-lg ${
                  isToday ? 'bg-yellow-400/20 border-yellow-400' : 'bg-gray-700'
                }`}
              >
                <div className="text-xs text-gray-400 mb-1">
                  {format(day, 'd')}
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
            <h3 className="text-lg font-bold mb-4">목표 콜 수 설정</h3>
            <input
              type="number"
              value={goalCalls}
              onChange={(e) => setGoalCalls(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400 mb-4"
              placeholder="목표 콜 수"
            />
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
    </div>
  );
};

export default CalendarScreen; 