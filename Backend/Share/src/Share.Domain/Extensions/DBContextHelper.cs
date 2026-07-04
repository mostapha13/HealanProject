using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;

namespace Share.Domain.Extensions
{
    public static class DBContextHelper
    {
        public static void TemporarySaveCollection<RequestModel, Entity>(
            this DbContext _appDbContext,
            IEnumerable<RequestModel> requestModels,
            IEnumerable<Entity> entities,
            //Func<Entity, bool> storedEntityCondition,
            Func<RequestModel, Entity, bool> compareCondition_deleted,
            Func<Entity, RequestModel, bool> compareCondition_inserted,
            Action<IEnumerable<RequestModel>> insertAction,
            Action<Entity, RequestModel> updateEntityAction)
            where RequestModel : class
            where Entity : class
        {

            if (requestModels == null || !requestModels.Any())
            {
                foreach (var item in entities)
                {
                    _appDbContext.Set<Entity>().Remove(item);
                }
            }
            List<Entity> mustInsertedList = new List<Entity>();
            var allSavedItem = entities;// _appDbContext.Set<Entity>().Where(storedEntityCondition);

            var deletedList = allSavedItem.Where(w => !requestModels.Any(FixCondition(compareCondition_deleted, w))).ToList();
            _appDbContext.Set<Entity>().RemoveRange(deletedList);

            var storedListForUpdate = allSavedItem.Where(w => requestModels.Any(FixCondition(compareCondition_deleted, w))).ToList();
            foreach (var storedItem in storedListForUpdate)
            {
                var requestModel_EquivalentStoredItem = requestModels.FirstOrDefault(FixCondition(compareCondition_deleted, storedItem));
                if (requestModel_EquivalentStoredItem != null)
                {
                    updateEntityAction(storedItem, requestModel_EquivalentStoredItem);
                    _appDbContext.Entry(storedItem).State = EntityState.Modified;
                }
            }
            if (requestModels != null)
            {

                var insertedList = requestModels.Where(w => !allSavedItem.Any(FixCondition(compareCondition_inserted, w)));
                insertAction(insertedList);

            }

        }



        private static Func<T1, bool> FixCondition<T1, T2>(Func<T1, T2, bool> func, T2 model)
        {
            return new Func<T1, bool>(a => func(a, model));
        }
    }
}
