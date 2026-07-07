import moment from 'moment-jalaali';

export const getQueryParams = (params: string, url: string) => {
  const href = url;
  //this expression is to get the query strings
  const reg = new RegExp('[?&]' + params + '=([^&#]*)', 'i');
  const queryString = reg.exec(href);
  return queryString ? queryString[1] : null;
};

export const convertDateAndTimeToJalali = (date?: string | Date | null) => {
  if (date == null || date === '') return '';
  const m = moment(date);
  return m.isValid() ? m.format('HH:mm  jYYYY/jMM/jDD') : '';
};

export const convertDateToJalali = (date?: string | Date | null) => {
  if (date == null || date === '') return '';
  const m = moment(date);
  return m.isValid() ? m.format('jYYYY/jMM/jDD') : '';
};

export const convertDateAndTime = (date?: string) => {
  if (date) {
    return moment(date, 'YYYYMMDD').format('YYYY-MM-DDTHH:mm:ss');
  }
  return '';
};

export const convertDateAndTimeJalali = (date?: string) => {
  if (date) {
    return moment(date, 'YYYY-MM-DDTHH:mm:ss').format('HH:mm   jYYYY/jMM/jDD');
  }
  return '';
};

export const convertDateToJalaliYear = (date?: string) => {
  if (date) {
    return moment(date, 'YYYY').format('jYYYY');
  }
  return '';
};

export const convertDateToDate = (date?: string) => {
  if (date) {
    return moment(date, 'YYYY-MM-DD').format('YYYY-MM-DD');
  }
  return '';
};

export const convertDate = (date?: string) => {
  if (date) {
    return moment(date, 'YYYY/MM/DD').format('YYYY-MM-DD');
  }
  return '';
};

export const convertJalaliDateToGregorian = (date?: string) => {
  if (date) {
    return moment(date, 'jYYYY/jMM/jDD').format('YYYY-MM-DD');
  }
  return '';
};

export const convertDateToJalaliHour = (date?: string) => {
  if (date) {
    return moment(date).format('HH:mm');
  }
  return '';
};

export const separator = (num: any) => {
  return deSeparator(num)
    ?.toString()
    ?.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
};

export const deSeparator = (value: string) => {
  return value && value?.toString()?.replace(/[^0-9]/g, '');
};

export const checkIfNegative = (num: number) => (num > 0 ? false : true);

// export const generateDaysOfWeek = (date: any) => {
//   const index = moment(date).day();
//   const daysOfWeek = {
//     6: 'شنبه',
//     0: 'یکشنبه',
//     1: 'دوشنبه',
//     2: 'سه‌شنبه',
//     3: 'چهارشنبه',
//     4: 'پنج‌شنبه',
//     5: 'جمعه',
//   };
//   return daysOfWeek[index];
// };

export const generateMonths = (month = 1): string => {
  const daysOfWeek: any = {
    1: 'فروردین',
    2: 'اردیبهشت',
    3: 'خرداد',
    4: 'تیر',
    5: 'مرداد',
    6: 'شهریور',
    7: 'مهر',
    8: 'آبان',
    9: 'آذر',
    10: 'دی',
    11: 'بهمن',
    12: 'اسفند',
  };
  return daysOfWeek[month];
};

export function lastYearsGenerator(
  amount: number
): { value: any; name: any }[] {
  const foo = [];
  const date = new Date();
  const year = date.getUTCFullYear();
  const shamsi = Number(convertDateToJalaliYear(`${year}`));
  for (let i = -amount; i <= 1; i++) {
    foo.push({ value: i + shamsi, name: i + shamsi });
  }
  return foo;
}

export function monthGenerator(): { value: number | string; name: string }[] {
  const months = [
    { name: 'فروردین', value: 1 },
    { name: 'اردیبهشت', value: 2 },
    { name: 'خرداد', value: 3 },
    { name: 'تیر', value: 4 },
    { name: 'مرداد', value: 5 },
    { name: 'شهریور', value: 6 },
    { name: 'مهر', value: 7 },
    { name: 'آبان', value: 8 },
    { name: 'آذر', value: 9 },
    { name: 'دی', value: 10 },
    { name: 'بهمن', value: 11 },
    { name: 'اسفند', value: 12 },
  ];
  return months;
}

export const getClickableLink = (link: string) => {
  return link.startsWith('http://') || link.startsWith('https://')
    ? link
    : `http://${link}`;
};
export const convertTimeFormat = (time: any) => {
  return `${
    time?.hours.toString().length === 1 ? `0${time?.hours}` : time?.hours
  }:${
    time?.minutes.toString().length === 1 ? `0${time?.minutes}` : time?.minutes
  }`;
};
export const generateRandomNumber = () => {
  const min = 100000;
  const max = 999999;
  const generatedNumber: any =
    Math.floor(Math.random() * (max - min + 1)) + min;
  return generatedNumber;
};
export const deSepratorWithDot = (value: string) => {
  return value && value.toString().replace(/[^0-9.]/g, '');
};
export function yearGeneratorPast(amount: number) {
  const year = moment().jYear();
  const foo = [];
  for (let i = 0; i < amount; i++) {
    foo.push({ value: year - i, name: year - i });
  }
  return foo;
}
export function generateGuid() {
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
    (
      +c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
    ).toString(16)
  );
}
