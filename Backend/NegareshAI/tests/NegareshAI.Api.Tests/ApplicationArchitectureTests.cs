using AutoMapper;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using NegareshAI.Api.Application;
using NegareshAI.Api.Application.Documents.Commands;
using NegareshAI.Api.Application.Documents.Queries;
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
    }
}
