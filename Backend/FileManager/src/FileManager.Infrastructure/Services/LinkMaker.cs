using FileManager.Domain.Configs;
using FileManager.Domain.Services;
using Microsoft.Extensions.Options;
using Share.Domain.Exceptions;
using Share.Domain.Extensions;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FileManager.Infrastructure.Services
{
    public class LinkMaker : ILinkMaker
    {
        private readonly IOptionsMonitor<GatewayInfoConfig> _configuration;
        public LinkMaker(IOptionsMonitor<GatewayInfoConfig> configuration)
        {
            _configuration = configuration;
        }
        public Guid GetFileIdFromLink(string link)
        {
            if (!Uri.IsWellFormedUriString(link, UriKind.Absolute))
                throw new BadRequestExceptions(string.Format("لینک {0} معتبر نیست.", link));
            Uri myUri = new Uri(link);
            var urlSegmentCount = myUri.Segments.Count();
            string id = myUri.Segments[urlSegmentCount - 1];
            return id.ToGuid() ?? Guid.Empty;
        }
        public string MakeLink(string fileId, string relativeUri)
        {

            var link = string.Format("{0}/{1}/{2}", _configuration.CurrentValue.Url, relativeUri, fileId);
            if (!string.IsNullOrEmpty(link) && link[link.Length - 1] == '/')
                link = link.Substring(0, link.Length - 1);
            if (!Uri.IsWellFormedUriString(link, UriKind.Absolute))
                throw new BadRequestExceptions(string.Format("لینک {0} معتبر نیست.", link));
            return link;
        }

    }
}
