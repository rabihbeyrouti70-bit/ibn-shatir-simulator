import React from 'react';
import { TabId } from '../types/astronomy';

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="tabs">
      <button
        className={`tab-btn ${activeTab === 'cosmos' ? 'active' : ''}`}
        onClick={() => onTabChange('cosmos')}
      >
        🌌 1. هيأة الأفلاك التسعة
      </button>
      <button
        className={`tab-btn ${activeTab === 'cosmos3d' ? 'active' : ''}`}
        onClick={() => onTabChange('cosmos3d')}
      >
        🌐 2. المحاكي ثلاثي الأبعاد (3D)
      </button>
      <button
        className={`tab-btn ${activeTab === 'sunComp' ? 'active' : ''}`}
        onClick={() => onTabChange('sunComp')}
      >
        ☀️ 2. مقارنة نموذج الشمس
      </button>
      <button
        className={`tab-btn ${activeTab === 'moonComp' ? 'active' : ''}`}
        onClick={() => onTabChange('moonComp')}
      >
        🌙 3. مقارنة نموذج القمر
      </button>
      <button
        className={`tab-btn ${activeTab === 'planets' ? 'active' : ''}`}
        onClick={() => onTabChange('planets')}
      >
        🪐 4. الكواكب ومعادل بطلميوس
      </button>
      <button
        className={`tab-btn ${activeTab === 'study' ? 'active' : ''}`}
        onClick={() => onTabChange('study')}
      >
        📚 5. الدراسة المقارنة والوثائق
      </button>
    </div>
  );
};
