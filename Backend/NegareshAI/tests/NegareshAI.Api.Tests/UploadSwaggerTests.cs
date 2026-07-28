using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using NegareshAI.Api.Controllers;
using Swashbuckle.AspNetCore.Swagger;
using Xunit;

namespace NegareshAI.Api.Tests;

public sealed class UploadSwaggerTests
{
    [Fact]
    public void Swagger_document_describes_upload_as_multipart_form()
    {
        using var host = CreateHost();
        var swagger = host.Services.GetRequiredService<ISwaggerProvider>().GetSwagger("v1");

        var operation = swagger.Paths["/api/documents/upload"].Operations[
            Microsoft.OpenApi.Models.OperationType.Post];
        var multipart = operation.RequestBody.Content["multipart/form-data"];
        var properties = multipart.Schema.Properties;

        var file = GetProperty(properties, "file");
        GetProperty(properties, "title");
        GetProperty(properties, "documentType");
        GetProperty(properties, "confidentialityLevel");
        Assert.DoesNotContain(properties.Keys, key =>
            string.Equals(key, "organizationId", StringComparison.OrdinalIgnoreCase));
        Assert.Equal("string", file.Type);
        Assert.Equal("binary", file.Format);
    }

    private static IWebHost CreateHost()
    {
        return new WebHostBuilder()
            .UseEnvironment("Development")
            .ConfigureServices(services =>
            {
                services.AddRouting();
                services.AddControllers()
                    .AddApplicationPart(typeof(DocumentsController).Assembly);
                services.AddEndpointsApiExplorer();
                services.AddSwaggerGen();
            })
            .Configure(_ => { })
            .Build();
    }

    private static Microsoft.OpenApi.Models.OpenApiSchema GetProperty(
        IDictionary<string, Microsoft.OpenApi.Models.OpenApiSchema> properties,
        string name)
    {
        return properties.Single(property =>
            string.Equals(property.Key, name, StringComparison.OrdinalIgnoreCase)).Value;
    }
}
