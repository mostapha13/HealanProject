using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Constants
{
    public class RegularExpressionPattern
    {
        public const string PhoneNumberPattern = @"^((\+9|\+989|\+\+989|9|09|989|999|0989|00989)(01|02|03|04|05|10|11|12|13|14|15|16|17|18|19|20|21|22|30|31|32|33|34|35|36|37|38|39|90|99|91))(\d{7})$";
        public const string EmailAddressPattern = @"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$";
        public const string WebsitePattern = @"^(https?:\/\/)?(www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$";
        public const string PrefixNumberPattern = @"^0\d{2,4}";
        public const string LandLinePattern = @"\d{4,8}";
        public const string ExtendedNumberPattern = @"\d{2,4}";
        public const string FaxNumberPattern = @"\d{4,8}";
        public const string PrefixFaxNumberPattern = @"^0\d{2,4}";
    }

    public class RegularExpressionErrorMessage
    {
        public const string PhoneNumberErrorMessage = @"فرمت شماره همراه صحیح نیست";
        public const string EmailAddressErrorMessage = @"فرمت آدرس ایمیل صحیح نیست";
        public const string WebsiteErrorMessage = @"فرمت آدرس وب سایت صحیح نیست";
        public const string PrefixNumberErrorMessage = @"فرمت پیش شماره صحیح نیست";
        public const string LandLineErrorMessage = @"فرمت شماره تلفن صحیح نیست";
        public const string ExtendedNumberErrorMessage = @"فرمت شماره داخلی صحیح نیست";
        public const string FaxNumberErrorMessage = @"فرمت شماره فکس صحیح نیست";
        public const string PrefixFaxNumberErrorMessage = @"فرمت پیش شماره فکس صحیح نیست";
    }
}
