using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WorkFlow.Domain.Entities
{
    public class Fund
    {
        public Fund()
        {
            Orders = new List<Order>();
        }
        public Guid FundId { get; set; }
        public string FundName { get; set; }
        //طبق درخواست سلیمی برای ثبت کاربر در سامانه سیبا قسمت عملیات نقد
        public Guid? BrokerId { get; set; }
        public ICollection<WorkFlowUser> WorkFlowUsers { get; set; }
        public ICollection<Order> Orders { get; set; }
    }
}
