import React, { useEffect, useState } from 'react';
import moment from 'moment-jalaali';
import Calendar, { type Day, type DayValue } from '@hassanmojab/react-modern-calendar-datepicker';
import '@hassanmojab/react-modern-calendar-datepicker/lib/DatePicker.css';
import {
  jalaliDayAndTimeToLocal,
  localDateTimeToTime,
  toJalaliDay,
} from '../utils/formatJalali';

export interface JalaliDateTimeInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  datePlaceholder?: string;
  calendarPopperPosition?: 'auto' | 'top' | 'bottom';
}

export function JalaliDateTimeInput({
  value,
  onChange,
  disabled,
  datePlaceholder = 'انتخاب تاریخ',
  calendarPopperPosition = 'auto',
}: JalaliDateTimeInputProps) {
  const [selectedDay, setSelectedDay] = useState<DayValue>(() => toJalaliDay(value));
  const [time, setTime] = useState(() => localDateTimeToTime(value));

  useEffect(() => {
    setSelectedDay(toJalaliDay(value));
    setTime(localDateTimeToTime(value));
  }, [value]);

  const emit = (day: Day, timeValue: string) => {
    const safeTime = timeValue?.trim() || localDateTimeToTime(new Date());
    const next = jalaliDayAndTimeToLocal(day, safeTime);
    if (next) onChange(next);
  };

  const handleDayChange = (day: DayValue) => {
    if (!day) return;
    setSelectedDay(day);
    emit(day, time);
  };

  const dateLabel = selectedDay
    ? moment(`${selectedDay.year}/${selectedDay.month}/${selectedDay.day}`, 'jYYYY/jM/jD').format('jYYYY/jMM/jDD')
    : '';

  return (
    <div className="healan-jalali-datetime">
      <div className="healan-jalali-datetime__date">
        <Calendar
          locale="fa"
          value={selectedDay}
          onChange={disabled ? () => {} : handleDayChange}
          shouldHighlightWeekends
          calendarPopperPosition={calendarPopperPosition}
          wrapperClassName="healan-jalali-datetime__picker"
          renderInput={({ ref }) => (
            <input
              ref={ref as React.RefObject<HTMLInputElement>}
              readOnly
              disabled={disabled}
              className="healan-jalali-datetime__date-input"
              placeholder={datePlaceholder}
              value={dateLabel}
            />
          )}
        />
      </div>
      <input
        type="time"
        className="healan-jalali-datetime__time"
        value={time}
        disabled={disabled}
        onChange={(e) => {
          const nextTime = e.target.value;
          setTime(nextTime);
          if (selectedDay) emit(selectedDay, nextTime);
        }}
      />
    </div>
  );
}
