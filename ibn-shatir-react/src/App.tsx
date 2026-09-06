import React, { useState } from 'react';
import { TabId } from './types/astronomy';
import { useAstroTime } from './hooks/useAstroTime';
import { useZodiacTelemetry } from './hooks/useZodiacTelemetry';
import { Header } from './components/Header';
import { TimeControlBar } from './components/TimeControlBar';
import { ZodiacBanner } from './components/ZodiacBanner';
import { TabNavigation } from './components/TabNavigation';
import { CosmosView } from './components/views/CosmosView';
import { Cosmos3DView } from './components/views/Cosmos3DView';
import { SunComparisonView } from './components/views/SunComparisonView';
import { MoonComparisonView } from './components/views/MoonComparisonView';
import { PlanetsComparisonView } from './components/views/PlanetsComparisonView';
import { StudyView } from './components/views/StudyView';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('cosmos');
  const {
    simDate,
    setSimDate,
    isPlaying,
    togglePlay,
    timeSpeed,
    setTimeSpeed,
    addTime,
    jumpToEpoch,
    setLiveNow,
  } = useAstroTime();

  const telemetry = useZodiacTelemetry(simDate);

  return (
    <div className="simulator-app">
      <Header />

      <TimeControlBar
        simDate={simDate}
        onDateChange={setSimDate}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        timeSpeed={timeSpeed}
        onSpeedChange={setTimeSpeed}
        onAddTime={addTime}
        onJumpToEpoch={jumpToEpoch}
        onSetLiveNow={setLiveNow}
      />

      <ZodiacBanner telemetry={telemetry} />

      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="tab-content" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        {activeTab === 'cosmos' && <CosmosView telemetry={telemetry} />}
        {activeTab === 'cosmos3d' && <Cosmos3DView simDate={simDate} />}
        {activeTab === 'sunComp' && <SunComparisonView telemetry={telemetry} />}
        {activeTab === 'moonComp' && <MoonComparisonView telemetry={telemetry} />}
        {activeTab === 'planets' && <PlanetsComparisonView telemetry={telemetry} />}
        {activeTab === 'study' && <StudyView />}
      </main>
    </div>
  );
};

export default App;
