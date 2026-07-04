using System;

namespace FileManager.Domain.Services
{
    public interface ILinkMaker
    {
        string MakeLink(string fileId,string RelativeUri);
        Guid GetFileIdFromLink(string link);
    }
}
