import React from 'react';

interface TimeControlBarProps {
  simDate: Date;
  onDateChange: (d: Date) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  timeSpeed: number;
  onSpeedChange: (speed: number) => void;
  onAddTime: (amount: number, unit: 'day' | 'month' | 'year') => void;
  onJumpToEpoch: (year: number) => void;
  onSetLiveNow: () => void;
}

export const TimeControlBar: React.FC<TimeControlBarProps> = ({
  simDate,
  onDateChange,
  isPlaying,
  onTogglePlay,
  timeSpeed,
  onSpeedChange,
  onAddTime,
  onJumpToEpoch,
  onSetLiveNow,
}) => {
  // تحويل التاريخ إلى صيغة datetime-local
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateStr = `${simDate.getFullYear()}-${pad(simDate.getMonth() + 1)}-${pad(simDate.getDate())}T${pad(simDate.getHours())}:${pad(simDate.getMinutes())}`;

  return (
    <div className="time-control-bar">
      <div className="time-row">
        <div className="time-group">
          <label htmlFor="astroDateTime">📅 التاريخ والوقت:</label>
          <input
            type="datetime-local"
            id="astroDateTime"
            value={dateStr}
            onChange={(e) => {
              const d = new Date(e.target.value);
              if (!isNaN(d.getTime())) onDateChange(d);
            }}
          />
          <button className="btn-time btn-now" onClick={onSetLiveNow}>⏱️ الآن</button>
          <button
            id="btnPlayClock"
            className="btn-play-clock"
            onClick={onTogglePlay}
          >
            {isPlaying ? '⏸️ إيقاف التدفق' : '▶️ بدء تدفق الزمن'}
          </button>
        </div>

        <div className="time-group">
          <button className="btn-time" onClick={() => onAddTime(-1, 'day')}>⏪ -يوم</button>
          <button className="btn-time" onClick={() => onAddTime(1, 'day')}>⏩ +يوم</button>
          <button className="btn-time" onClick={() => onAddTime(-1, 'month')}>⏪ -شهر</button>
          <button className="btn-time" onClick={() => onAddTime(1, 'month')}>⏩ +شهر</button>
          <button className="btn-time" onClick={() => onAddTime(-1, 'year')}>⏪ -سنة</button>
          <button className="btn-time" onClick={() => onAddTime(1, 'year')}>⏩ +سنة</button>
        </div>

        <div className="time-group">
          <button className="btn-time" onClick={() => onJumpToEpoch(150)}>عصر بطلميوس (150م)</button>
          <button className="btn-time" onClick={() => onJumpToEpoch(1363)}>عصر ابن الشاطر (1363م)</button>
          <button className="btn-time" onClick={() => onJumpToEpoch(2026)}>العصر الحاضر (2026م)</button>
        </div>
      </div>

      <div className="time-row" style={{ borderTop: '1px solid rgba(99,102,241,0.3)', paddingTop: '10px' }}>
        <div className="time-group">
          <label>⚡ سرعة الزمن:</label>
          <button className={`btn-time ${Math.abs(timeSpeed - 0.0417) < 0.01 ? 'active-speed' : ''}`} onClick={() => onSpeedChange(0.0417)}>1 ساعة/ث</button>
          <button className={`btn-time ${timeSpeed === 1 ? 'active-speed' : ''}`} onClick={() => onSpeedChange(1)}>1 يوم/ث</button>
          <button className={`btn-time ${timeSpeed === 7 ? 'active-speed' : ''}`} onClick={() => onSpeedChange(7)}>أسبوع/ث</button>
          <button className={`btn-time ${timeSpeed === 30 ? 'active-speed' : ''}`} onClick={() => onSpeedChange(30)}>شهر/ث</button>
          <button className={`btn-time ${timeSpeed === 365.25 ? 'active-speed' : ''}`} onClick={() => onSpeedChange(365.25)}>سنة/ث</button>
          <button className={`btn-time ${timeSpeed === 3652.5 ? 'active-speed' : ''}`} onClick={() => onSpeedChange(3652.5)}>عقد/ث</button>
          <button className={`btn-time ${timeSpeed < 0 ? 'active-speed' : ''}`} onClick={() => onSpeedChange(-Math.abs(timeSpeed || 30))}>⏪ عكسي</button>
        </div>

        <div className="time-group">
          <span style={{ color: 'var(--gold)', fontWeight: 'bold', fontSize: '0.92em' }}>
            ⏱️ التدفق: {timeSpeed > 0 ? '+' : ''}{timeSpeed.toFixed(1)} يوم/ث
          </span>
          <input
            type="range"
            min="-365"
            max="365"
            step="1"
            value={timeSpeed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            style={{ width: '130px', cursor: 'pointer' }}
          />
        </div>
      </div>
    </div>
  );
};
