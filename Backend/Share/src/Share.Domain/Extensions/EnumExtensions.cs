using Share.Domain.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Reflection;

namespace Share.Domain.Extensions
{
    public static class EnumExtensions
    {
        public static string GetDescription(this Enum enumValue)
        {
            return enumValue.GetAttribute<DescriptionAttribute>()?.Description;
        }
        public static string GetDisplayName(this Enum enumValue)
        {
            return enumValue.GetAttribute<DisplayAttribute>()?.Name;
        }
        public static int GetDisplayOrder(this Enum enumValue)
        {
            return enumValue.GetAttribute<DisplayAttribute>()?.Order??0;
        }
        public static List<EnumInfo> GetEnumInfo<T>() where T : Enum
        {
            List<EnumInfo> enumInfos = new List<EnumInfo>();
            foreach (var item in Enum.GetValues(typeof(T)).Cast<T>())
            {
                var value = Convert.ToInt32(item);
                enumInfos.Add(new EnumInfo() { Key = value, DisplayName = (item).GetDisplayName(), Name = item.ToString() });
            }
            return enumInfos;
        }
        public static List<EnumInfo> GetEnumInfo(this Type enumType)
        {
            var enumValues = Enum.GetValues(enumType);

            List<EnumInfo> enumInfos = new List<EnumInfo>();
            foreach (Enum ev in enumValues)
            {
                var value = Convert.ToInt32(ev);
                enumInfos.Add(new EnumInfo() { Key = value, DisplayName = (ev).GetDisplayName(), Name = ev.ToString(),DisplayOrder= (ev).GetDisplayOrder() });
            }
            return enumInfos;
        }
        public static TAttribute GetAttribute<TAttribute>(this Enum enumValue)
           where TAttribute : Attribute
        {
            // Undefined DB enum values (e.g. 0) have no named member — First() threw
            // "Sequence contains no elements" and broke UserList / other ProjectTo/Map paths.
            var member = enumValue.GetType()
                .GetMember(enumValue.ToString())
                .FirstOrDefault();
            return member?.GetCustomAttribute<TAttribute>();
        }
    }
}
