using AutoMapper;
using System;
using System.Linq;
using System.Reflection;

namespace Healan.Application.Common.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            ApplyMappingsFromAssembly(Assembly.GetExecutingAssembly());
        }

        private void ApplyMappingsFromAssembly(Assembly assembly)
        {

            var types = assembly.GetExportedTypes()
                   .Where(t => t.GetInterfaces().Any(i =>
                       i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IMapFrom<>)))
                   .ToList();

            foreach (var type in types)
            {
                var instance = Activator.CreateInstance(type);

                var methodInfo = type.GetMethod("Mapping")
                    ?? type.GetInterface("IMapFrom`1").GetMethod("Mapping");

                methodInfo?.Invoke(instance, new object[] { this });

            }



            #region with constructor

            //       var types = assembly.GetExportedTypes()
            //.Where(t => t.GetInterfaces().Any(i =>
            //    i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IMapFrom<>)))
            //.ToList();

            //       foreach (var type in types)
            //       {
            //           var methodInfo = type.GetMethod("Mapping")
            //               ?? type.GetInterface("IMapFrom`1")?.GetMethod("Mapping");

            //           if (methodInfo != null)
            //           {
            //               object instance;

            //               // Try to find a constructor with no parameters
            //               var constructor = type.GetConstructor(Type.EmptyTypes);
            //               if (constructor != null)
            //               {
            //                   instance = Activator.CreateInstance(type);
            //               }
            //               else
            //               {
            //                   // If no constructor, create a proxy using FormatterServices
            //                   instance = System.Runtime.Serialization.FormatterServices.GetUninitializedObject(type);
            //               }

            //               methodInfo.Invoke(instance, new object[] { this });
            //           }
            //       }

            #endregion
        }
    }
}