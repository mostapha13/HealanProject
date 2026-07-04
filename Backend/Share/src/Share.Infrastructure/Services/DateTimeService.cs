using Share.Application.Common.Interfaces;
using System;

namespace Share.Infrastructure.Services
{
    public class DateTimeService : IDateTime
    {
        public DateTime Now => DateTime.Now;
    }
}