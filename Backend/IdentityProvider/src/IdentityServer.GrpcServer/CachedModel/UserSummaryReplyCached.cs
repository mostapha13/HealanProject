using IdentityServer.GrpcClient;
using Share.Application.Common.Cache;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace IdentityServer.GrpcServer.CachedModel
{
    public class UserSummaryReplyCached //: ICacheKeyGenerator
    {
        public UserSummaryReplyCached(Guid userId)
        {
            UserId = userId;
        }
        public Guid UserId { get; init; }
        public UserSummaryReply UserSummaryReply { get; set; }
        //public string GetKey()
        //{
        //    return $"UserSummaryReplyCached-{UserId}";    
        //}
        //public int GetCashTimeInterval()
        //{
        //    return 30;
        //}
    }
}
