using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Share.Domain.Exceptions;

namespace Share.Application.Common.Models
{
    public class PaginatedList<T>
    {
        public List<T> Items { get; init; }
        public int PageNumber { get; set; }
        public int TotalPages { get; set; }
        public int TotalCount { get; set; }
        [JsonConstructor]
        public PaginatedList()
        {

        }

        public PaginatedList(List<T> items, int count, int pageNumber, int pageSize)
        {
            PageNumber = pageNumber;
            TotalPages = (int)Math.Ceiling(count / (double)pageSize);
            TotalCount = count;
            Items = items;
        }
        public bool HasPreviousPage => PageNumber > 1;
        public bool HasNextPage => PageNumber < TotalPages;
        public static async Task<PaginatedList<T>> CreateAsync(IQueryable<T> source, int pageNumber, int pageSize, CancellationToken cancellationToken = default)
        {
            if (source == null)
                throw new BadRequestExceptions("Source Items Is Null For Paging");
            if (pageSize > 20)
                throw new BadRequestExceptions("Page Size Should Not Be Greater Than 20");

            var count = await source.CountAsync(cancellationToken);
            var totalPageCount = (int)Math.Ceiling(count / (double)pageSize);
            if (pageNumber > totalPageCount) pageNumber = totalPageCount;
            if (pageNumber <= 0) pageNumber = 1;
            var items = await source.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
            return new PaginatedList<T>(items, count, pageNumber, pageSize);
        }
        public static async Task<PaginatedList<T>> CreateAsync(List<T> source, int pageNumber, int pageSize, CancellationToken cancellationToken = default)
        {
            if (source == null)
                throw new BadRequestExceptions("Source Items Is Null For Paging");
            if (pageSize > 20)
                throw new BadRequestExceptions("Page Size Should Not Be Greater Than 20");
            var count = source.Count;
            var totalPageCount = (int)Math.Ceiling(count / (double)pageSize);
            if (pageNumber > totalPageCount) pageNumber = totalPageCount;
            if (pageNumber <= 0) pageNumber = 1;
            var items = source.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToList();
            return new PaginatedList<T>(items, count, pageNumber, pageSize);
        }
    }
}
