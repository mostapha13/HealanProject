using Share.Domain.Exceptions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web;

namespace Share.Infrastructure.SecurityMiddlewares
{
    public static class Validation
    {
        static string patternOn = @"\s+on\w*\s*=";
        public static void ValidateInput(this string value)
        {
            if (string.IsNullOrEmpty(value))
                return;
            value = HttpUtility.HtmlDecode(value.Normalize());
            var jsEventHandler = JsEventHandlers();
            value = Regex.Unescape(value);
            value = value.Normalize().ToLower();

            jsEventHandler.ForEach((a) =>
            {
                if (value.Contains(a.ToLower()))
                    throw new BadRequestExceptions("در ارسال درخواست از تگ غیر مجاز استفاده شده است");
            });
            bool matchFound = Regex.IsMatch(value, patternOn, RegexOptions.IgnoreCase);
            if (matchFound)
            {
                throw new BadRequestExceptions("در ارسال درخواست از تگ غیر مجاز استفاده شده است.");
            }
            //if (!(value.Contains("</") || value.Contains("body")))
            //{

            //    var sanitized = _htmlSanitizer.Sanitize(value);
            //    sanitized = HttpUtility.HtmlDecode(sanitized.Normalize());
            //    var v = value.ToLower().Replace("\r", "").Trim();
            //    var s = sanitized.Replace("\r", "").ToLower().Trim();
            //    if (string.Compare(v,s ) != 0)
            //    {
            //        throw new BadRequestExceptions("در ارسال درخواست از تگ غیر مجاز استفاده شده است");
            //    }
            //}

        }
        private static List<string> JsEventHandlers()
        {
            List<string> ls = new List<string>();
            ls.Add("<script");
            ls.Add("javascript");
            ls.Add("prompt(");
            ls.Add("eval(");
            ls.Add("alert(");
            ls.Add("<embed");
            ls.Add("<object");
            ls.Add("jscript");
            ls.Add("content:url(");
            ls.Add("background:url(");
            ls.Add("behavior:url(");
            ls.Add("<iframe>");
            ls.Add("document.write()");

            //ls.Add("onAbort");
            //ls.Add("onBlur");
            //ls.Add("onChange");
            //ls.Add("onClick");
            //ls.Add("onDblClick");
            //ls.Add("onDragDrop");
            //ls.Add("onError");
            //ls.Add("onFocus");
            //ls.Add("onKeyDown");
            //ls.Add("onKeyPress");
            //ls.Add("onKeyUp");
            //ls.Add("onLoad");
            //ls.Add("onMouseDown");
            //ls.Add("onMouseMove");
            //ls.Add("onMouseOut");
            //ls.Add("onMouseOver");
            //ls.Add("onMouseUp");
            //ls.Add("onMouseEnter");
            //ls.Add("onScroll");
            //ls.Add("onMove");
            //ls.Add("onReset");
            //ls.Add("onResize");
            //ls.Add("onSelect");
            //ls.Add("onSubmit");
            //ls.Add("onUnload");
            //ls.Add("onPropertyChange");
            //ls.Add("onScroll");
            //ls.Add("onReadyStateChange");
            //ls.Add("onPageHide");
            //ls.Add("onMouseLeave");
            //ls.Add("onMouseWheel");
            //ls.Add("onPageShow");
            //ls.Add("onStart");
            //ls.Add("onBeforeUnload");
            //ls.Add("onPopState");

            //ls.Add("onInput");
            //ls.Add("onInvalid");
            //ls.Add("onContextMenu");
            //ls.Add("onTouchStart");
            //ls.Add("onTouchEnd");
            //ls.Add("onTouchMove");
            //ls.Add("onTouchCancel");
            //ls.Add("onPointerDown");
            //ls.Add("onPointerUp");
            //ls.Add("onPointerMove");
            //ls.Add("onPointerCancel");
            //ls.Add("onDragStart");
            //ls.Add("onDrag");
            //ls.Add("onDragEnter");
            //ls.Add("onDragLeave");
            //ls.Add("onDragOver");
            //ls.Add("onDrop");
            //ls.Add("onFocusIn");
            //ls.Add("onFocusOut");
            //ls.Add("onActivate");
            //ls.Add("onBeforeActivate");
            //ls.Add("onBeforeCopy");
            //ls.Add("onBeforeCut");
            //ls.Add("onBeforePaste");
            //ls.Add("onCopy");
            //ls.Add("onCut");
            //ls.Add("onPaste");
            //ls.Add("onHashChange");
            //ls.Add("onInput");
            //ls.Add("onPopState");
            //ls.Add("onShow");
            //ls.Add("onToggle");
            //ls.Add("onTouchEnter");
            //ls.Add("onTouchLeave");

            //ls.Add("onBeforePrint");
            //ls.Add("onAfterPrint");
            //ls.Add("onCanPlay");
            //ls.Add("onCanPlayThrough");
            //ls.Add("onDurationChange");
            //ls.Add("onEmptied"); 
            //ls.Add("onEnded");


            //ls.Add("onLoadedData");
            //ls.Add("onLoadedMetadata");
            //ls.Add("onLoadStart");
            //ls.Add("onPause");
            //ls.Add("onPlay");
            //ls.Add("onPlaying");
            //ls.Add("onProgress");
            //ls.Add("onRateChange");
            //ls.Add("onSeeked");
            //ls.Add("onSeeking");
            //ls.Add("onStalled");
            //ls.Add("onSuspend");
            //ls.Add("onTimeUpdate");
            //ls.Add("onVolumeChange");
            //ls.Add("onWaiting");

            return ls;
        }
    }
}
