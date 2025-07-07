import React, { useState } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useRecords } from '../context/RecordContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const StatsScreen: React.FC = () => {
  const { records } = useRecords();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  // 주간/월간 데이터 계산
  const getWeekData = () => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // 월요일부터 시작
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const record = records.find(r => r.date === dateStr);
      return {
        date: format(day, 'MM/dd'),
        day: format(day, 'E', { locale: ko }),
        calls: record?.calls || 0,
        amount: record?.amount || 0
      };
    });
  };

  const getMonthData = () => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const record = records.find(r => r.date === dateStr);
      return {
        date: format(day, 'MM/dd'),
        day: format(day, 'E', { locale: ko }),
        calls: record?.calls || 0,
        amount: record?.amount || 0
      };
    });
  };

  // 요일별 통계
  const getDayOfWeekStats = () => {
    const dayNames = ['월', '화', '수', '목', '금', '토', '일'];
    const dayStats = dayNames.map(day => {
      const dayRecords = records.filter(record => {
        const recordDate = new Date(record.date);
        const dayOfWeek = getDay(recordDate);
        const koreanDay = dayNames[dayOfWeek === 0 ? 6 : dayOfWeek - 1];
        return koreanDay === day;
      });
      
      const totalCalls = dayRecords.reduce((sum, r) => sum + r.calls, 0);
      const totalAmount = dayRecords.reduce((sum, r) => sum + r.amount, 0);
      const avgCalls = dayRecords.length > 0 ? Math.round(totalCalls / dayRecords.length) : 0;
      
      return { day, totalCalls, totalAmount, avgCalls, recordCount: dayRecords.length };
    });
    
    return dayStats;
  };

  const currentData = selectedPeriod === 'week' ? getWeekData() : getMonthData();
  const dayStats = getDayOfWeekStats();

  // 주/월 비교 데이터
  const currentPeriodTotal = currentData.reduce((sum, day) => sum + day.calls, 0);
  const currentPeriodAmount = currentData.reduce((sum, day) => sum + day.amount, 0);

  // 이전 주/월 데이터 (임시로 0으로 설정)
  const previousPeriodTotal = 0;
  const previousPeriodAmount = 0;

  const callsDiff = currentPeriodTotal - previousPeriodTotal;
  const amountDiff = currentPeriodAmount - previousPeriodAmount;

  // 차트 데이터
  const chartData = {
    labels: dayStats.map(stat => stat.day),
    datasets: [
      {
        label: '평균 콜 수',
        data: dayStats.map(stat => stat.avgCalls),
        backgroundColor: dayStats.map(stat => {
          if (stat.avgCalls >= 40) return 'rgba(34, 197, 94, 0.8)'; // 초록
          if (stat.avgCalls >= 20) return 'rgba(234, 179, 8, 0.8)'; // 노랑
          return 'rgba(239, 68, 68, 0.8)'; // 빨강
        }),
        borderColor: dayStats.map(stat => {
          if (stat.avgCalls >= 40) return 'rgb(34, 197, 94)';
          if (stat.avgCalls >= 20) return 'rgb(234, 179, 8)';
          return 'rgb(239, 68, 68)';
        }),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#f3f4f6',
        },
      },
      title: {
        display: true,
        text: '요일별 평균 콜 수',
        color: '#f3f4f6',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#f3f4f6',
        },
        grid: {
          color: '#374151',
        },
      },
      x: {
        ticks: {
          color: '#f3f4f6',
        },
        grid: {
          color: '#374151',
        },
      },
    },
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-6 overflow-y-auto">
      {/* 기간 선택 */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedPeriod('week')}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
              selectedPeriod === 'week' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            주간
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
              selectedPeriod === 'month' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            월간
          </button>
        </div>
      </div>

      {/* 주/월 비교 */}
      <div className="bg-gray-800 rounded-lg p-4 space-y-4">
        <h3 className="text-lg font-bold">주/월 비교</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="text-sm text-gray-400 mb-1">이번 {selectedPeriod === 'week' ? '주' : '달'} 콜</div>
            <div className="text-xl font-bold text-green-400">{currentPeriodTotal}콜</div>
            {callsDiff !== 0 && (
              <div className={`text-sm ${callsDiff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {callsDiff > 0 ? '↗' : '↘'} {Math.abs(callsDiff)}콜
              </div>
            )}
          </div>
          
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="text-sm text-gray-400 mb-1">이번 {selectedPeriod === 'week' ? '주' : '달'} 수익</div>
            <div className="text-xl font-bold text-yellow-400">{currentPeriodAmount.toLocaleString()}원</div>
            {amountDiff !== 0 && (
              <div className={`text-sm ${amountDiff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {amountDiff > 0 ? '↗' : '↘'} {Math.abs(amountDiff).toLocaleString()}원
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 요일별 통계 */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-bold mb-4">요일별 통계</h3>
        <div className="h-64">
          <Bar data={chartData} options={chartOptions} />
        </div>
        
        {/* 요일별 상세 정보 */}
        <div className="mt-4 space-y-2">
          {dayStats.map(stat => (
            <div key={stat.day} className="flex justify-between items-center p-2 bg-gray-700 rounded">
              <span className="font-medium">{stat.day}요일</span>
              <div className="flex gap-4 text-sm">
                <span>평균: {stat.avgCalls}콜</span>
                <span>총: {stat.totalCalls}콜</span>
                <span>{stat.totalAmount.toLocaleString()}원</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 패턴 분석 */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-bold mb-4">패턴 분석</h3>
        <div className="space-y-3">
          {(() => {
            const bestDay = dayStats.reduce((best, current) => 
              current.avgCalls > best.avgCalls ? current : best
            );
            const worstDay = dayStats.reduce((worst, current) => 
              current.avgCalls < worst.avgCalls ? current : worst
            );
            
            return (
              <>
                <div className="p-3 bg-green-900/30 border border-green-500 rounded-lg">
                  <div className="text-green-400 font-medium">🔥 최고 성과</div>
                  <div>{bestDay.day}요일 평균 {bestDay.avgCalls}콜</div>
                </div>
                <div className="p-3 bg-red-900/30 border border-red-500 rounded-lg">
                  <div className="text-red-400 font-medium">⚠️ 개선 필요</div>
                  <div>{worstDay.day}요일 평균 {worstDay.avgCalls}콜</div>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default StatsScreen; 