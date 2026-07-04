using Share.Domain.Enums;
using Share.Domain.Models;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Extensions
{
    public static class DateTimeHelper
    {
        public static (string minDate, string maxDate) GetDateTimePeriod(DateType dateType, DateFilterRequiredYear dateFilter)
        {
            PersianCalendar pc = new PersianCalendar();
            DateTime maxFilterDate;
            DateTime minFilterDate;
            if (dateType == DateType.SolarDate)
            {
                var daysInMonth = pc.GetDaysInMonth(dateFilter.Year, dateFilter.Month ?? 12);
                maxFilterDate = pc.ToDateTime(dateFilter.Year, dateFilter.Month ?? 12, dateFilter.Day ?? daysInMonth, 20, 20, 20, 20);
                minFilterDate = pc.ToDateTime(
                    !dateFilter.FromYear.HasValue ? dateFilter.Year : dateFilter.FromYear.Value,
                    !dateFilter.FromYear.HasValue ? (dateFilter.Month ?? 1) : dateFilter.FromMonth ?? 1,
                    !dateFilter.FromYear.HasValue ? (dateFilter.Day ?? 1) : dateFilter.FromDay ?? 1,
                    2, 2, 2, 2);
            }
            else
            {
                var daysInMonth = DateTime.DaysInMonth(dateFilter.Year, dateFilter.Month ?? 12);
                maxFilterDate = new DateTime(dateFilter.Year, dateFilter.Month ?? 12, dateFilter.Day ?? daysInMonth);
                minFilterDate = new DateTime(
                    !dateFilter.FromYear.HasValue ? dateFilter.Year : dateFilter.FromYear.Value,
                    !dateFilter.FromYear.HasValue ? (dateFilter.Month ?? 1) : dateFilter.FromMonth ?? 1,
                    !dateFilter.FromYear.HasValue ? (dateFilter.Day ?? 1) : dateFilter.FromDay ?? 1);
            }
            var maxDate = maxFilterDate.ToString("yyyyMMdd");
            var minDate = minFilterDate.ToString("yyyyMMdd");
            return new(minDate, maxDate);
        }
        public static string ConvertToPersianDateTimeReverseFormat(this DateTime? dtime)
        {
            if (!dtime.HasValue)
                return String.Empty;
            PersianCalendar pc = new PersianCalendar();
            var persianDateTime = string.Format("{2}/{1}/{0}", pc.GetYear(dtime.Value), FixDayAndMonth(pc.GetMonth(dtime.Value)), FixDayAndMonth(pc.GetDayOfMonth(dtime.Value)));
            return persianDateTime;
        }

        public static string ConvertToPersianDateTime(this DateTime? dtime)
        {
            if (!dtime.HasValue)
                return String.Empty;
            PersianCalendar pc = new PersianCalendar();
            var persianDateTime = string.Format("{0}/{1}/{2}", pc.GetYear(dtime.Value), FixDayAndMonth(pc.GetMonth(dtime.Value)), FixDayAndMonth(pc.GetDayOfMonth(dtime.Value)));
            return persianDateTime;
        }
        public static string ConvertToPersianDateTime(this DateTime dtime)
        {
            PersianCalendar pc = new PersianCalendar();
            var persianDateTime = string.Format("{0}/{1}/{2}", pc.GetYear(dtime), FixDayAndMonth(pc.GetMonth(dtime)), FixDayAndMonth(pc.GetDayOfMonth(dtime)));
            return persianDateTime;
        }

        public static DateTime? ConvertNumberToDateTime(this int? dtime)
        {
            if (!dtime.HasValue)
                return null;

            if (dtime.Value.ToString().Length!=8)
                return null;

            DateTime dateValue = DateTime.ParseExact(dtime.Value.ToString(), "yyyyMMdd", System.Globalization.CultureInfo.InvariantCulture);
            return dateValue;
        }
        public static DateTime? ConvertNumberToDateTime(this decimal? dtime)
        {
            if (!dtime.HasValue)
                return null;

            if (dtime.Value.ToString().Length != 8)
                return null;

            DateTime dateValue = DateTime.ParseExact(dtime.Value.ToString(), "yyyyMMdd", System.Globalization.CultureInfo.InvariantCulture);
            return dateValue;
        }
        public static string ConvertNumberToPersianDateTime(this int? dtime)
        {
            return ConvertToPersianDateTime(ConvertNumberToDateTime(dtime));
        }
        private static string FixDayAndMonth(int value)
        {
            if (value == 0)
                return string.Empty;
            if (value < 10)
                return "0" + value.ToString();
            return value.ToString();
        }
        public static TimeSpan GetSubtractTimeAmount(this DateTime dtime)
        {
            var currentTime = GetCurrentDateTime();
            var timeSpan = currentTime.Subtract(dtime);
            return timeSpan;
        }
        public static string GetSubtractTimeDescription(this TimeSpan timeSpan)
        {
            var hasDay = timeSpan.Days > 0;
            var hasHour = timeSpan.Hours > 0;
            var hasMinute = timeSpan.Minutes > 0;
            var dayDescript = hasDay ? string.Format("{0} روز", (timeSpan.Days)) : "";
            var hourDescript = hasHour ? string.Format("{0} ساعت", timeSpan.Hours) : "";
            var minuteDescript = hasMinute ? string.Format("{0} دقیقه", timeSpan.Minutes) : "";
            var split = hasHour ? "و" : "";
            var daysplit = hasDay ? "و" : "";
            var str = string.Format("{0} {1} {2} {3} {4}", dayDescript, daysplit, hourDescript, split, minuteDescript);
            if (string.IsNullOrEmpty(str.Trim()))
                return str;
            else return (str + " " + "پیش");
        }
        public static string ConvertToFullPersianDateTime(this DateTime dtime)
        {
            return ConvertToPersianDateTime(dtime) + "  " + dtime.ToString("HH:mm");
        }

        public static string ConvertToFullStringPersianDateTime(this DateTime? dtime)
        {
            if (!dtime.HasValue)
                return string.Empty;
            return ConvertToFullStringPersianDateTime(dtime.Value);
        }
        public static string GetTime(DateTime dtime)
        {
            return dtime.ToString("HH:mm");
        }
        public static DateTime? ToGregorianDate(string seprator, string persianDate)
        {
            // validation omitted
            try
            {
                System.String[] userDateParts = persianDate.Trim().Split(new[] { seprator }, System.StringSplitOptions.None);
                int userYear = int.Parse(userDateParts[0]);
                int userMonth = int.Parse(userDateParts[1]);
                int userDay = int.Parse(userDateParts[2]);

                PersianCalendar persianCal = new PersianCalendar();
                DateTime GregorianDate = persianCal.ToDateTime(userYear, userMonth, userDay, DateTime.Now.Hour, DateTime.Now.Minute, 0, 0);

                return GregorianDate;
            }
            catch (Exception)
            {
                return null;
            }

        }
        public static DateTime? ToGregorianDate(string persianDate)
        {
            if (persianDate.Contains("-"))
                return ToGregorianDate("-", persianDate);
            else if (persianDate.Contains("_"))
                return ToGregorianDate("_", persianDate);
            else if (persianDate.Contains(":"))
                return ToGregorianDate(":", persianDate);
            return ToGregorianDate("/", persianDate);
        }
        public static string GetPersianDateTimeFormat(DateTime dtime)
        {
            try
            {
                PersianCalendar persianCal = new PersianCalendar();
                var year = persianCal.GetYear(dtime);
                var month = persianCal.GetMonth(dtime);
                var day = persianCal.GetDayOfMonth(dtime);
                var fullDateFormat = string.Format("{0} {1} {2} {3}", day, GetFarsiMonth(month), year, dtime.ToString("HH:mm"));
                return fullDateFormat;

            }
            catch (Exception)
            {
                return null;
            }

        }
        public static string GetPanelDateTimeFormat(DateTime dtime)
        {
            try
            {
                PersianCalendar persianCal = new PersianCalendar();
                var dayofWeek = GetFarsiDay(persianCal.GetDayOfWeek(dtime));
                var day = persianCal.GetDayOfMonth(dtime);
                var year = persianCal.GetYear(dtime);
                var month = persianCal.GetMonth(dtime);


                var fullDateFormat = string.Format("{0} {1} {2} {3}", (dayofWeek+"،"),day, (GetFarsiMonth(month)+" ماه"), year);
                return fullDateFormat;

            }
            catch (Exception)
            {
                return null;
            }

        }
        public static int GetDayOfDateTime(DateTime dtime)
        {
            try
            {
                PersianCalendar persianCal = new PersianCalendar();
                return persianCal.GetDayOfMonth(dtime);
            }
            catch (Exception)
            {
                return 0;
            }

        }
        public static string GetDayAndMonthOfDateTime(DateTime dtime)
        {
            try
            {
                PersianCalendar persianCal = new PersianCalendar();
                var day = persianCal.GetDayOfMonth(dtime);
                var month = GetFarsiMonth(persianCal.GetMonth(dtime));
                return $"{day} {month}";
            }
            catch (Exception)
            {
                return string.Empty;
            }

        }
        public static string GetDayAndMonthOfDateTime(string dtime)
        {
            try
            {
                if (string.IsNullOrEmpty(dtime) || dtime.Length < 8)
                    return string.Empty;
                var day = dtime.Substring(8,2);
                var month_int = dtime.Substring(5, 2).ToInt()??0;
                var month = GetFarsiMonth(month_int);
                return $"{day} {month}";
            }
            catch (Exception)
            {
                return string.Empty;
            }

        }
        public static string GetFarsiMonth(DateTime dtime)
        {
            try
            {
                return GetFarsiMonth(GetDigitFarsiMonth(dtime));
            }
            catch (Exception)
            {
                return string.Empty;
            }

        }
        public static int GetDigitFarsiMonth(DateTime dtime)
        {
            PersianCalendar persianCal = new PersianCalendar();
            return persianCal.GetMonth(dtime);
        }



        public static int GetYear(DateTime dtime)
        {
            try
            {
                PersianCalendar persianCal = new PersianCalendar();
                return persianCal.GetYear(dtime);
            }
            catch (Exception)
            {
                return 0;
            }

        }
        public static string GetFarsiMonth(int month)
        {
            switch (month)
            {
                case 1:
                    return "فروردین";
                case 2:
                    return "اردیبهشت";
                case 3:
                    return "خرداد";
                case 4:
                    return "تیر";
                case 5:
                    return "مرداد";
                case 6:
                    return "شهریور";
                case 7:
                    return "مهر";
                case 8:
                    return "آبان";
                case 9:
                    return "آذر";
                case 10:
                    return "دی";
                case 11:
                    return "بهمن";
                case 12:
                    return "اسفند";
                default:
                    break;
            }
            return string.Empty;
        }
        public static string GetFarsiDay(int day)
        {
            switch (day)
            {
                case 1:
                    return "شنبه";
                case 2:
                    return "یکشنبه";
                case 3:
                    return "دوشنبه";
                case 4:
                    return "سه شنبه";
                case 5:
                    return "چهارشنبه";
                case 6:
                    return "پنج شنبه";
                case 7:
                    return "جمعه";
                default:
                    break;
            }
            return string.Empty;
        }
        public static string GetFarsiDay(DayOfWeek day)
        {
            switch (day)
            {
                case DayOfWeek.Saturday:
                    return "شنبه";
                case DayOfWeek.Sunday:
                    return "یکشنبه";
                case DayOfWeek.Monday:
                    return "دوشنبه";
                case DayOfWeek.Tuesday:
                    return "سه شنبه";
                case DayOfWeek.Wednesday:
                    return "چهارشنبه";
                case DayOfWeek.Thursday:
                    return "پنج شنبه";
                case DayOfWeek.Friday:
                    return "جمعه";
                default:
                    break;
            }
            return string.Empty;
        }
        public static string FixMonth(int month)
        {
            switch (month)
            {
                case 1:
                    return "01";
                case 2:
                    return "02";
                case 3:
                    return "03";
                case 4:
                    return "04";
                case 5:
                    return "05";
                case 6:
                    return "06";
                case 7:
                    return "07";
                case 8:
                    return "08";
                case 9:
                    return "09";
                case 10:
                    return "10";
                case 11:
                    return "11";
                case 12:
                    return "12";
                default:
                    break;
            }
            return string.Empty;
        }

        public static DateTime GetCurrentDateTime()
        {
            return DateTime.Now;
        }
        public static int GetCurrentDateTimeInIntPersian(int beforeAfter=0)
        {
            PersianCalendar pc = new PersianCalendar();
            var dtime=GetCurrentDateTime().AddDays(beforeAfter);
            var persianDateTime = string.Format("{0}{1}{2}", pc.GetYear(dtime), FixDayAndMonth(pc.GetMonth(dtime)), FixDayAndMonth(pc.GetDayOfMonth(dtime)));
            return persianDateTime.ToInt()??0;
        }
        public static (int year, int month, int day) GetCurrentDateTime_Solar()
        {
            try
            {
                var dtime = GetCurrentDateTime();
                return ConvertToSolarDateTime(dtime);
            }
            catch (Exception)
            {
                return new(0, 0, 0);
            }

        }
        public static (int year, int month, int day) ConvertToSolarDateTime(DateTime dtime)
        {
            try
            {
                PersianCalendar persianCal = new PersianCalendar();
                return new(persianCal.GetYear(dtime), persianCal.GetMonth(dtime), persianCal.GetDayOfMonth(dtime));
            }
            catch (Exception)
            {
                return new(0, 0, 0);
            }

        }
        public static DayOfWeek GetDayOfWeek(DateTime dtime)
        {
            PersianCalendar persianCal = new PersianCalendar();
            return persianCal.GetDayOfWeek(dtime);
        }
        public static long DateTimeToUnixTimeStamp(DateTime dtime)
        {
            long unixTime = ((DateTimeOffset)dtime).ToUnixTimeSeconds();
            return unixTime;

        }
        public static DateTime UnixTimeStampToDateTime(double unixTimeStamp)
        {
            DateTime dateTime = new DateTime(1970, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc);
            dateTime = dateTime.AddSeconds(unixTimeStamp).ToLocalTime();
            return dateTime;
        }


        public static bool IsDateInFuture(this DateTime? dateTime)
        {
            if (!dateTime.HasValue)
                return false;
            if (DateTime.Now.Year == dateTime.Value.Year && DateTime.Now.Month == dateTime.Value.Month && DateTime.Now.Day == dateTime.Value.Day)
                return true;
            if (dateTime > DateTime.Now)
                return true;
            return false;
        }

        public static DateTime PersianYearStartDate(int persianYear)
        {
            var persianCalendar = new PersianCalendar();
            return persianCalendar.ToDateTime(persianYear, 1, 1, 0, 0, 0, 0);
        }
    }
}
