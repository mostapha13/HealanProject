using Share.Application.Common.Interfaces;
using System;
using System.ComponentModel.DataAnnotations;

namespace Share.Application.Common.Models
{
    public abstract class AbstractSearchRequest<TResponse> : AbstractRequestBase<TResponse>, IAbstractSearchRequest
    {
        public int PageNumber { get; set; } = 1;
        //[Range(1, 50, ErrorMessage = "Value for Page Size must be between 1 and 50.")]
        public int PageSize { get; set; } = 10;

    }
}
