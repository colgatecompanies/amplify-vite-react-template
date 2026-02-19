import { useState } from 'react';
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  formatDate,
  isDateInRange,
  todayStr,
} from '../utils/dateUtils';

interface ReservationSlot {
  startDate: string;
  endDate: string;
  status: string | null;
}

interface AvailabilityCalendarProps {
  reservations: ReservationSlot[];
  selectedStart?: string | null;
  selectedEnd?: string | null;
  onDateClick?: (date: string) => void;
  interactive?: boolean;
}

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDayStatus(
  dateStr: string,
  reservations: ReservationSlot[],
  today: string
): 'past' | 'approved' | 'pending' | 'available' {
  if (dateStr < today) return 'past';

  for (const r of reservations) {
    if (r.status === 'APPROVED' && isDateInRange(dateStr, r.startDate, r.endDate)) {
      return 'approved';
    }
  }

  for (const r of reservations) {
    if (r.status === 'PENDING' && isDateInRange(dateStr, r.startDate, r.endDate)) {
      return 'pending';
    }
  }

  return 'available';
}

function AvailabilityCalendar({
  reservations,
  selectedStart,
  selectedEnd,
  onDateClick,
  interactive = false,
}: AvailabilityCalendarProps) {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());

  const today = todayStr();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const monthLabel = new Date(currentYear, currentMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  function goToPrevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  }

  function goToNextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  }

  function isSelected(dateStr: string): boolean {
    if (!selectedStart) return false;
    if (!selectedEnd) return dateStr === selectedStart;
    return isDateInRange(dateStr, selectedStart, selectedEnd);
  }

  function handleDayClick(dateStr: string, status: string) {
    if (!interactive || !onDateClick) return;
    if (status === 'past' || status === 'approved') return;
    onDateClick(dateStr);
  }

  const cells: JSX.Element[] = [];

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} className="calendar-day calendar-day-empty" />);
  }

  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDate(currentYear, currentMonth, day);
    const status = getDayStatus(dateStr, reservations, today);
    const selected = isSelected(dateStr);

    let className = 'calendar-day';
    if (selected) {
      className += ' calendar-day-selected';
    } else {
      className += ` calendar-day-${status}`;
    }
    if (interactive && status !== 'past' && status !== 'approved') {
      className += ' interactive';
    }

    cells.push(
      <div
        key={dateStr}
        className={className}
        onClick={() => handleDayClick(dateStr, status)}
      >
        {day}
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button type="button" className="calendar-nav-button" onClick={goToPrevMonth}>
          &lsaquo;
        </button>
        <h3>{monthLabel}</h3>
        <button type="button" className="calendar-nav-button" onClick={goToNextMonth}>
          &rsaquo;
        </button>
      </div>

      <div className="calendar-grid">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="calendar-day-header">{d}</div>
        ))}
        {cells}
      </div>

      <div className="calendar-legend">
        <div className="calendar-legend-item">
          <span className="calendar-legend-swatch" style={{ backgroundColor: '#d4edda' }} />
          <span>Confirmed</span>
        </div>
        <div className="calendar-legend-item">
          <span className="calendar-legend-swatch" style={{ backgroundColor: '#fff3cd' }} />
          <span>Requested</span>
        </div>
        <div className="calendar-legend-item">
          <span className="calendar-legend-swatch" style={{ backgroundColor: 'white' }} />
          <span>Available</span>
        </div>
      </div>
    </div>
  );
}

export default AvailabilityCalendar;
