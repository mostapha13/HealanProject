using AutoMapper;
using NegareshAI.Api.Application.Documents.Commands;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Application.Common.Mappings;

public sealed class DocumentMappingProfile : Profile
{
    public DocumentMappingProfile()
    {
        CreateMap<RegisterDocumentCommand, Document>(MemberList.None);

        CreateMap<Document, DocumentResponse>()
            .ForCtorParam(
                nameof(DocumentResponse.FileId),
                options => options.MapFrom(source =>
                    source.Versions
                        .OrderByDescending(version => version.VersionNumber)
                        .Select(version => version.FileId)
                        .FirstOrDefault() ?? string.Empty));
    }
}
