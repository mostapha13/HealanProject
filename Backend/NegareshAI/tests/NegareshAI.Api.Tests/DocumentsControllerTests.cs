using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Controllers;
using Xunit;

namespace NegareshAI.Api.Tests;

public sealed class DocumentsControllerTests
{
    [Fact]
    public async Task Upload_rejects_an_empty_file_before_calling_file_manager()
    {
        var sender = new RecordingSender();
        var controller = new DocumentsController(sender);
        var upload = CreateUpload(Stream.Null, 0, "application/pdf");

        var result = await controller.Upload(upload);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal("A non-empty file is required.", badRequest.Value);
        Assert.Equal(0, sender.SendCount);
    }

    [Fact]
    public async Task Upload_rejects_an_unsupported_content_type_before_calling_file_manager()
    {
        var sender = new RecordingSender();
        var controller = new DocumentsController(sender);
        var upload = CreateUpload(new MemoryStream([1]), 1, "text/plain");

        var result = await controller.Upload(upload);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal("Only PDF and DOCX files are supported.", badRequest.Value);
        Assert.Equal(0, sender.SendCount);
    }

    [Fact]
    public async Task Batch_upload_rejects_duplicate_image_page_numbers()
    {
        var sender = new RecordingSender();
        var controller = new DocumentsController(sender);
        var request = new UploadDocumentBatchRequest
        {
            Files = [CreateFile("1.jpg", "image/jpeg"), CreateFile("2.png", "image/png")],
            PageNumbers = [1, 1]
        };

        var result = await controller.UploadBatch(request);

        Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal(0, sender.SendCount);
    }

    [Fact]
    public async Task Batch_upload_rejects_page_number_for_pdf()
    {
        var sender = new RecordingSender();
        var controller = new DocumentsController(sender);
        var request = new UploadDocumentBatchRequest
        {
            Files = [CreateFile("document.pdf", "application/pdf")], PageNumbers = [1]
        };

        var result = await controller.UploadBatch(request);

        Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal(0, sender.SendCount);
    }

    private static IFormFile CreateFile(string name, string contentType) =>
        new FormFile(new MemoryStream([1]), 0, 1, "files", name)
        { Headers = new HeaderDictionary(), ContentType = contentType };

    private static UploadDocumentRequest CreateUpload(Stream content, long length, string contentType)
    {
        return new UploadDocumentRequest
        {
            File = new FormFile(content, 0, length, "file", "sample.bin")
            {
                Headers = new HeaderDictionary(),
                ContentType = contentType
            }
        };
    }

    private sealed class RecordingSender : ISender
    {
        public int SendCount { get; private set; }

        public Task<TResponse> Send<TResponse>(
            IRequest<TResponse> request,
            CancellationToken cancellationToken = default)
        {
            SendCount++;
            throw new InvalidOperationException("Sender should not be called for invalid uploads.");
        }

        public Task<object?> Send(object request, CancellationToken cancellationToken = default)
        {
            SendCount++;
            throw new InvalidOperationException("Sender should not be called for invalid uploads.");
        }

        public IAsyncEnumerable<TResponse> CreateStream<TResponse>(
            IStreamRequest<TResponse> request,
            CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        public IAsyncEnumerable<object?> CreateStream(
            object request,
            CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();
    }
}
