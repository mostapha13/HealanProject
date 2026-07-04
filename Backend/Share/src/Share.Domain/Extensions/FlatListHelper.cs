using System.Collections.Generic;

namespace Share.Domain.Extensions
{
    public static class FlatListHelper
    {

        //public static List<T> GetFlatList<T>(this IEnumerable<T> items, Func<T, IEnumerable<T>> getChildsFunction)
        //{
        //    if (items == null)
        //        return null;
        //    List<T> tempItems = new List<T>();
        //    GetFlatList(items, getChildsFunction, tempItems);
        //    return tempItems;
        //}

        //private static void GetFlatList<T>(IEnumerable<T> items, Func<T, IEnumerable<T>> getChildsFunction, List<T> list)
        //{
        //    foreach (var item in items)
        //    {
        //        list.Add(item);
        //    }
        //    var childs = items.Where((a)=>a!=null).SelectMany(getChildsFunction);
        //    if (childs!=null && childs.Any())
        //        GetFlatList(childs, getChildsFunction, list);
        //}

        public static List<T> GetFlatList<T>(this IEnumerable<T> items, Func<T, IEnumerable<T>> getChildsFunction)
        {
            if (items == null)
                return null;
            List<T> tempItems = new List<T>();
            GetFlatList(items, getChildsFunction, tempItems);
            return tempItems;
        }

        private static void GetFlatList<T>(IEnumerable<T> items, Func<T, IEnumerable<T>> getChildsFunction, List<T> list)
        {
            foreach (var item in items)
            {
                list.Add(item);
            }
            var childs = items.Select(getChildsFunction);
            foreach (var item in childs)
            {
                if (item != null)
                    foreach (var subItem in item)
                    {
                        GetFlatList(item, getChildsFunction, list);
                    }
            }
        }
    }
}
