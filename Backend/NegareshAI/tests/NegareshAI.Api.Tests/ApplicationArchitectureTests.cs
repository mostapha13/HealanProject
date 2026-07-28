using AutoMapper;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using NegareshAI.Api.Application;
using NegareshAI.Api.Application.Documents.Commands;
using NegareshAI.Api.Application.Documents.Queries;
using NegareshAI.Api.Application.Dashboard.Queries;
using NegareshAI.Api.Application.Settings.Commands;
using NegareshAI.Api.Application.Settings.Queries;
using NegareshAI.Api.Application.Contracts.Commands;
using NegareshAI.Api.Application.Contracts.Queries;
using NegareshAI.Api.Contracts;
using Xunit;

namespace NegareshAI.Api.Tests;

public sealed class ApplicationArchitectureTests
{
    [Fact]
    public void Application_registers_mediatr_handlers_and_valid_automapper_profiles()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddApplication();

        using var provider = services.BuildServiceProvider();
        provider.GetRequiredService<IMapper>().ConfigurationProvider.AssertConfigurationIsValid();

        Assert.Contains(
            services,
            descriptor => descriptor.ServiceType ==
                typeof(IRequestHandler<RegisterDocumentCommand, DocumentResponse>));
        Assert.Contains(
            services,
            descriptor => descriptor.ServiceType ==
                typeof(IRequestHandler<UploadDocumentCommand, DocumentResponse>));
        Assert.Contains(
            services,
            descriptor => descriptor.ServiceType ==
                typeof(IRequestHandler<DeleteDocumentCommand, bool>));
        Assert.Contains(
            services,
            descriptor => descriptor.ServiceType ==
                typeof(IRequestHandler<GetDocumentQuery, DocumentResponse?>));
        Assert.Contains(
            services,
            descriptor => descriptor.ServiceType ==
                typeof(IRequestHandler<ListDocumentsQuery, DocumentListResponse>));
        Assert.Contains(
            services,
            descriptor => descriptor.ServiceType ==
                typeof(IRequestHandler<UpdateDocumentCommand, DocumentResponse?>));
        Assert.Contains(
            services,
            descriptor => descriptor.ServiceType ==
                typeof(IRequestHandler<UploadDocumentVersionCommand, DocumentResponse?>));
        Assert.Contains(
            services,
            descriptor => descriptor.ServiceType ==
                typeof(IRequestHandler<GetDashboardQuery, DashboardResponse>));
        Assert.Contains(
            services,
            descriptor => descriptor.ServiceType ==
                typeof(IRequestHandler<ListRuntimeSettingsQuery,
                    IReadOnlyList<RuntimeSettingResponse>>));
        Assert.Contains(
            services,
            descriptor => descriptor.ServiceType ==
                typeof(IRequestHandler<UpsertRuntimeSettingCommand,
                    RuntimeSettingResponse>));
        Assert.Contains(
            services,
            descriptor => descriptor.ServiceType ==
                typeof(IRequestHandler<ListContractsQuery, ContractListResponse>));
        Assert.Contains(
            services,
            descriptor => descriptor.ServiceType ==
                typeof(IRequestHandler<GetContractQuery, ContractDetailResponse?>));
        Assert.Contains(
            services,
            descriptor => descriptor.ServiceType ==
                typeof(IRequestHandler<CreateContractCommand, ContractDetailResponse?>));
        Assert.Contains(
            services,
            descriptor => descriptor.ServiceType ==
                typeof(IRequestHandler<RestoreDocumentCommand, bool>));
    }
}
