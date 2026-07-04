/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @nrwl/nx/enforce-module-boundaries */
/* eslint-disable-next-line */
import { useEffect, useState } from '@tse/utils';
import { Button, Input } from '@tse/components/atoms';
import moment from 'moment-jalaali';
import '@hassanmojab/react-modern-calendar-datepicker/lib/DatePicker.css';
import Calendar from '@hassanmojab/react-modern-calendar-datepicker';
import PropTypes from 'prop-types';
import './style.scss';

export interface DatePickerProps {
  onChange?: any;
  defaultValue?: any;
  placeholder?: any;
  register?: any;
  label?: string;
  wrapperClassName?: string;
  required?: boolean;
  parentClassName?: string;
  value?: string;
  className?: string;
  position?: 'bottom' | 'top' | 'auto';
  error?: boolean;
  disabled?: boolean;
  onClearDate?: any;
}

export function DatePicker(props: DatePickerProps) {
  const {
    onChange,
    defaultValue,
    placeholder = '',
    label,
    value,
    error,
    position = 'bottom',
    disabled,
    required,
    onClearDate,
  } = props;
  const [selectedDay, setSelectedDay] = useState(defaultValue || '');
  const [selectedDayVisual, setSelectedDayVisual] = useState<any>({
    year: 0,
    month: 0,
    day: 0,
  });

  const handleChange = (date: any) => {
    const newDate = `${date.year}/${date.month}/${date.day}`;
    const gregorianDate = moment(newDate, 'jYYYY/jM/jD HH:mm').format(
      'YYYY-MM-DD'
    );
    const gregorianDate2 = moment(newDate, 'jYYYY/jM/jD HH:mm').format(
      'jYYYY/jM/jDTHH:mm:00'
    );
    const newDate2 = `${date.day} / ${date.month} / ${date.year}`;
    setSelectedDay(newDate2);
    setSelectedDayVisual(date);
    onChange?.(gregorianDate, gregorianDate2);
  };

  useEffect(() => {
    let date = defaultValue || '';
    if (value) {
      date = moment(value, 'YYYY/M/D HH:mm')?.format('jYYYY/jMM/jDD');
      setSelectedDay(date);
      setSelectedDayVisual({
        year: Number(moment(value, 'YYYY/M/D HH:mm')?.format('jYYYY')),
        month: Number(moment(value, 'YYYY/M/D HH:mm')?.format('jMM')),
        day: Number(moment(value, 'YYYY/M/D HH:mm')?.format('jDD')),
      });
    } else if (defaultValue) {
      date = moment(defaultValue, 'YYYY/M/D HH:mm')?.format('jYYYY/jMM/jDD');
      const gregorianDate = moment(defaultValue, 'jYYYY/jM/jD HH:mm').format(
        'jYYYY-jMM-jDD'
      );
      onChange?.(gregorianDate);
      setSelectedDay(date);
    } else if (!value) {
      setSelectedDay('');
      setSelectedDayVisual(null);
    }
  }, [value, defaultValue]);

  const renderCustomInput = ({ ref }: any) => {
    return (
      <Input
        label={label}
        readOnly
        disabled={disabled}
        reference={ref}
        placeholder={placeholder}
        value={selectedDay}
        error={error}
        iconName={
          onClearDate && selectedDay == ''
            ? 'icon-calendar'
            : onClearDate && selectedDay != ''
            ? 'icon-close'
            : 'icon-calendar'
        }
        required={required}
        inputClassName="h-[2.29rem]"
        onIconClick={() => {
          onClearDate && (onClearDate(), setSelectedDay(''));
        }}
      />
    );
  };

  return (
    <Calendar
      locale="fa"
      onChange={disabled ? () => {} : handleChange}
      renderInput={renderCustomInput}
      shouldHighlightWeekends
      calendarPopperPosition={position}
      value={selectedDayVisual}
    />
  );
}

export default DatePicker;

DatePicker.defaultProps = {
  locale: 'fa',
};

DatePicker.propTypes = {
  onChange: PropTypes.func,
  locale: PropTypes.oneOf(['fa', 'en']),
  title: PropTypes.string,
  required: PropTypes.bool,
  error: PropTypes.string,
  secondary: PropTypes.bool,
  leftTitle: PropTypes.string,
  onSelectShowName: PropTypes.func,
  year: PropTypes.bool,
  month: PropTypes.bool,
  day: PropTypes.bool,
  classNameContainer: PropTypes.string,
  inputStyle: PropTypes.object,
  labelClassName: PropTypes.string,
  defaultValue: PropTypes.any,
  register: PropTypes.any,
};
