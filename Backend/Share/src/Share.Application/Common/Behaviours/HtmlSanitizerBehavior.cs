using AngleSharp.Io;
using Ganss.Xss;
using MediatR;
using Newtonsoft.Json;
using Share.Application.Common.Cache;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web;

namespace Share.Application.Common.Behaviours
{
    public class HtmlSanitizerBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
        where TRequest : IRequest<TResponse>
    {
        private readonly IHtmlSanitizer _sanitizer;

        public HtmlSanitizerBehavior(IHtmlSanitizer sanitizer)
        {
            _sanitizer = sanitizer;
        }
        //public HtmlSanitizerBehavior()
        //{
        //    _sanitizer = new HtmlSanitizer();

        //    // تنظیم تگ‌ها و ویژگی‌های مجاز
        //    _sanitizer.AllowedTags.Clear();
        //    _sanitizer.AllowedTags.Add("p");
        //    _sanitizer.AllowedTags.Add("a");
        //    _sanitizer.AllowedTags.Add("strong");
        //    _sanitizer.AllowedTags.Add("img");

        //    _sanitizer.AllowedAttributes.Clear();
        //    _sanitizer.AllowedAttributes.Add("href");
        //    _sanitizer.AllowedAttributes.Add("src");
        //}

          public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
        {

            //string jsonRequest = JsonConvert.SerializeObject(request);
            if (!request.GetType().Name.EndsWith("Command"))
                return await next();

            List<string> htmlSigns = new List<string>() { "</", "body" };
            SanitizeProperties(request, htmlSigns);

            return await next();
        }
        private void SanitizeProperties(object obj, List<string> htmlSigns)
        {
            if (obj == null) return;
            if (obj is IEnumerable enumerable)
            {
                foreach (var item in enumerable)
                {
                    // پردازش تک تک اعضای مجموعه
                    SanitizeProperties(item, htmlSigns);
                }
                return;
            }
            var properties = obj.GetType().GetProperties();

            foreach (var property in properties)
            {
                if (property.CanRead && property.CanWrite)
                {
                    var value = property.GetValue(obj);

                    // اگر فیلد از نوع string باشد، پاکسازی می‌شود
                    if (value is string stringValue)
                    {
                        var val = HttpUtility.HtmlDecode(value.ToString().Normalize());
                        if (htmlSigns.Any(a => val.Contains(a)))
                        {
                            var sanitizedValue = _sanitizer.Sanitize(val);
                            property.SetValue(obj, sanitizedValue);
                        }
                    }
                    else if (value != null && IsComplexType(value.GetType()))
                    {
                        // اگر فیلد یک شیء پیچیده است، به‌صورت بازگشتی بررسی می‌شود
                        SanitizeProperties(value, htmlSigns);
                    }
                }
            }
        }

        private bool IsComplexType(System.Type type)
        {
            return type != typeof(string) && !type.IsPrimitive;
        }
    }
}
