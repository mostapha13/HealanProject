"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  JALALI_MONTH_NAMES,
  JALALI_WEEKDAY_NAMES,
  formatJalaliDate,
  gregorianYmdToJalali,
  jalaliMonthLength,
  jalaliToGregorianYmd,
  jalaliWeekday,
  shiftJalaliMonth,
  toJalali,
  toPersianDigits,
} from "../lib/jalali";

type Props = {
  value?: string;
  onChange: (gregorianYmd: string) => void;
  placeholder?: string;
};

export default function PersianCalendar({ value = "", onChange, placeholder = "انتخاب تاریخ" }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const now = new Date();
  const today = toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const selected = gregorianYmdToJalali(value);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(selected ?? today);

  useEffect(() => {
    if (open) setView(selected ?? today);
  }, [open, value]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const cells = useMemo(() => {
    const blanks = Array.from({ length: jalaliWeekday(view.jy, view.jm, 1) }, () => null);
    const days = Array.from({ length: jalaliMonthLength(view.jy, view.jm) }, (_, index) => index + 1);
    return [...blanks, ...days];
  }, [view.jy, view.jm]);

  const move = (delta: number) => setView(current => ({ ...current, ...shiftJalaliMonth(current.jy, current.jm, delta) }));
  const choose = (jy: number, jm: number, jd: number) => {
    onChange(jalaliToGregorianYmd(jy, jm, jd));
    setOpen(false);
  };

  return <div className="persian-date-picker" ref={root}>
    <button type="button" className={`persian-date-trigger ${value ? "has-value" : ""}`} onClick={() => setOpen(current => !current)} aria-haspopup="dialog" aria-expanded={open}>
      <span>{value ? formatJalaliDate(value) : placeholder}</span>
      <span aria-hidden="true">▾</span>
    </button>
    {open && <div className="persian-calendar" role="dialog" aria-label="تقویم شمسی">
      <header>
        <button type="button" onClick={() => move(1)} aria-label="ماه بعد">‹</button>
        <strong>{JALALI_MONTH_NAMES[view.jm - 1]} {toPersianDigits(view.jy)}</strong>
        <button type="button" onClick={() => move(-1)} aria-label="ماه قبل">›</button>
      </header>
      <div className="persian-calendar-grid weekdays">
        {JALALI_WEEKDAY_NAMES.map(day => <span key={day}>{day}</span>)}
      </div>
      <div className="persian-calendar-grid days">
        {cells.map((day, index) => day === null
          ? <span key={`blank-${index}`} />
          : <button
              type="button"
              key={day}
              className={[
                selected?.jy === view.jy && selected.jm === view.jm && selected.jd === day ? "selected" : "",
                today.jy === view.jy && today.jm === view.jm && today.jd === day ? "today" : "",
              ].join(" ")}
              onClick={() => choose(view.jy, view.jm, day)}
            >{toPersianDigits(day)}</button>)}
      </div>
      <footer>
        <button type="button" onClick={() => choose(today.jy, today.jm, today.jd)}>امروز</button>
        {value && <button type="button" onClick={() => { onChange(""); setOpen(false); }}>پاک‌کردن</button>}
      </footer>
    </div>}
  </div>;
}
