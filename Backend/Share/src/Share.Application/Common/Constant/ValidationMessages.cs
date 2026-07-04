using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Application.Common.Constant
{
    public static class ValidationMessages
    {
        public const string CantDeleteUserGroup = "گروه مورد نظر در بخش تعریف کاربران استفاده شده و قابل حذف نیست.";

        public const string LanguageIsRequired = "زبان سیستم مشخص نشده است.";
        public const string PageNumberGreaterThanOrEqualTo = "شماره صفحه باید بزرگتر یا مساوی با یک باشد.";
        public const string PageSizeGreaterThanOrEqualTo = "تعداد صفحات در هر صفحه باید بزرگتر یا مساوی با یک باشد.";
        public const string PageSizeLessThanOrEqualTo = "تعداد صفحات در هر صفحه باید کوچکتر از 20 باشد.";

    }
}
