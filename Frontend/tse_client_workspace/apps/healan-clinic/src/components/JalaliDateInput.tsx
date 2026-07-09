import React, { useEffect, useState } from 'react';
import Calendar, { type Day, type DayValue } from '@hassanmojab/react-modern-calendar-datepicker';
import '@hassanmojab/react-modern-calendar-datepicker/lib/DatePicker.css';
import { formatJalaliDate, jalaliDayToDateInput, toJalaliDay } from '../utils/formatJalali';

export interface JalaliDateInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function JalaliDateInput({
  value,
  onChange,
  disabled,
  placeholder = 'انتخاب تاریخ تولد',
}: JalaliDateInputProps) {
  const [selectedDay, setSelectedDay] = useState<DayValue>(() => toJalaliDay(value));

  useEffect(() => {
    setSelectedDay(toJalaliDay(value));
  }, [value]);

  const handleDayChange = (day: DayValue) => {
    if (!day) {
      setSelectedDay(null);
      onChange('');
      return;
    }
    setSelectedDay(day);
    onChange(jalaliDayToDateInput(day));
  };

  const dateLabel = value ? formatJalaliDate(value) : '';

  return (
    <div className="healan-jalali-date">
      <Calendar
        locale="fa"
        value={selectedDay}
        onChange={disabled ? () => {} : handleDayChange}
        shouldHighlightWeekends
        calendarPopperPosition="bottom"
        renderInput={({ ref }) => (
          <input
            ref={ref as React.RefObject<HTMLInputElement>}
            readOnly
            disabled={disabled}
            className="healan-jalali-date__input"
            placeholder={placeholder}
            value={dateLabel}
          />
        )}
      />
      {value && !disabled ? (
        <button type="button" className="healan-jalali-date__clear" onClick={() => handleDayChange(null)} aria-label="پاک کردن تاریخ">
          ×
        </button>
      ) : null}
    </div>
  );
}
