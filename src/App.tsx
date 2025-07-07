import React, { useState } from 'react';
import UploadScreen from './components/UploadScreen';
import CalendarScreen from './components/CalendarScreen';
import StatsScreen from './components/StatsScreen';
import { RecordProvider } from './context/RecordContext';

const screens = [
  { name: '기록 업로드', component: <UploadScreen /> },
  { name: '달력', component: <CalendarScreen /> },
  { name: '통계', component: <StatsScreen /> },
];

function App() {
  const [screenIdx, setScreenIdx] = useState(0);
  const [dark, setDark] = useState(true);

  // 스와이프(드래그) 이벤트 핸들러
  let startX = 0;
  const onTouchStart = (e: React.TouchEvent) => {
    startX = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    if (endX - startX > 50 && screenIdx > 0) setScreenIdx(screenIdx - 1);
    else if (startX - endX > 50 && screenIdx < screens.length - 1) setScreenIdx(screenIdx + 1);
  };

  // 다크모드 적용
  React.useEffect(() => {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [dark]);

  return (
    <RecordProvider>
      <div className="min-h-screen bg-gray-900 dark:bg-gray-900 text-white transition-colors duration-300">
        <div className="flex justify-between items-center px-4 py-2 border-b border-gray-700">
          <span className="font-bold text-lg">콜 트래커</span>
          <button
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-sm"
            onClick={() => setDark(!dark)}
          >
            {dark ? '☀️ 라이트' : '🌙 다크'}
          </button>
        </div>
        <div
          className="h-[calc(100vh-48px)] overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {screens[screenIdx].component}
        </div>
        <div className="flex justify-center gap-4 py-3 bg-gray-800 border-t border-gray-700">
          {screens.map((s, i) => (
            <button
              key={s.name}
              className={`px-4 py-1 rounded-full text-sm transition-colors duration-200 ${i === screenIdx ? 'bg-yellow-400 text-gray-900 font-bold' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setScreenIdx(i)}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>
    </RecordProvider>
  );
}

export default App;
