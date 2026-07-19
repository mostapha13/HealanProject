using FileManager.Domain.DTOs;
using FileManager.Domain.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Authentication;

namespace FileManager.WebUI.Controllers
{
    /// <summary>
    /// File Controller
    /// </summary>
    ///  
    [ApiController]
    [Route("[controller]")]
#if DEBUG
    [AllowAnonymous]
#endif
#if !DEBUG
    [Authorize]
#endif
    public class FileController : ControllerBase
    {
        private readonly IFileService _fileService;
        private readonly IFileManager _fileManager;
        private readonly IConfiguration _configuration;
        private readonly IHttpContextAccessor _contextAccessor;
        private readonly ILogger<FileController> _logger;
        public FileController(IFileService fileService, IFileManager fileManager, IConfiguration configuration, IHttpContextAccessor contextAccessor, ILogger<FileController> logger)
        {
            _fileService = fileService;
            _fileManager = fileManager;
            _configuration = configuration;
            _contextAccessor = contextAccessor;
            _logger = logger;
        }
        /// <summary>
        /// Upload new file
        /// </summary>
        /// <param name="file">file to uploaded</param>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>
        /// <response code="200">file uploaded successfully</response>
        /// <response code="400">file type is invalid or file is malware.</response>
        [HttpPost("Upload")]
        [RequestSizeLimit(100 * 1024 * 1024)]   // Limit file size to 100mb
        [ProducesResponseType((int)HttpStatusCode.OK)]
        public async Task<IActionResult> Upload([FromForm] IFormFile file, CancellationToken cancellationToken)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { title = "فایل خالی است." });

                _logger.LogInformation(
                    "Upload start name={Name} size={Size} contentType={ContentType}",
                    file.FileName,
                    file.Length,
                    file.ContentType);
                Console.WriteLine(
                    $"[FileUpload] START name={file.FileName} bytes={file.Length} ct={file.ContentType}");

                var stream = file.OpenReadStream();
                var mimetype = file.ContentType;
                // Keep KB rounding consistent with profile MaxSizeKB (approx KB).
                var size = Math.Max(1, (int)(file.Length / 1024));
                var originalFilename = file.FileName;

                var model = new UploadFileRequest()
                {
                    Filename = originalFilename,
                    MimeType = mimetype,
                    Size = size,
                    Stream = stream,
                    IsEncrypted = false
                };
                var result = await _fileService.UploadFile(model);
                _logger.LogInformation("Upload ok fileId={FileId}", result.FileId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[FileUpload] FAIL name={file?.FileName} type={ex.GetType().FullName}");
                Console.Error.WriteLine($"[FileUpload] MSG {ex.Message}");
                if (ex.InnerException != null)
                    Console.Error.WriteLine($"[FileUpload] INNER {ex.InnerException.GetType().FullName}: {ex.InnerException.Message}");
                Console.Error.WriteLine(ex.ToString());
                _logger.LogError(ex, "Upload failed name={Name}", file?.FileName);
                throw;
            }
        }


        /// <summary>
        /// Upload & Encrypt new file
        /// </summary>
        /// <param name="file">file to uploaded</param>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>
        /// <response code="200">file uploaded successfully</response>
        /// <response code="400">file type is invalid or file is malware.</response>
        [HttpPost("EncryptedUpload")]
        [RequestSizeLimit(100 * 1024 * 1024)]   // Limit file size to 100mb
        [ProducesResponseType((int)HttpStatusCode.OK)]
        public async Task<IActionResult> EncryptedUpload([FromForm] IFormFile file, CancellationToken cancellationToken)
        {
            if (file == null || file.Length == 0)
                return BadRequest();
            var stream = file.OpenReadStream();
            var mimetype = file.ContentType;
            var size = file.Length / 1000;
            var originalFilename = file.FileName;


            var model = new UploadFileRequest()
            {
                Filename = originalFilename,
                MimeType = mimetype,
                Size = size,
                Stream = stream,
                IsEncrypted = true
            };
            return Ok(await _fileService.UploadFile(model));
        }



        /// <summary>
        /// Download a file by it's id
        /// </summary>
        /// <param name="fileId">File id</param>
        /// <returns></returns>
        /// <response code="200">return file if it existed</response>
        /// <response code="404">return notfound if file did not exist</response>         
        [HttpGet("Download/{fileId}")]
        [ProducesResponseType((int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [AllowAnonymous]
        public async Task<IActionResult> Download([FromRoute] Guid fileId,CancellationToken cancellationToken)
        {
            //var userClaims = _contextAccessor?.HttpContext?.User?.Claims;

            //_logger.LogInformation("Start Show Claims");
            //if (userClaims != null && userClaims.Any())
            //{
            //    _logger.LogInformation("Claims Has Result");
            //    foreach (var claim in userClaims)
            //    {
            //        _logger.LogInformation($"{claim.Type}: {claim.Value}");
            //    }
            //}

            //var accessToken = await HttpContext.GetTokenAsync("access_token");
            //var idToken = await HttpContext.GetTokenAsync("id_token");

            //_logger.LogInformation($"accessToken: {accessToken}: idToken:  {idToken}");


            var fileResponse = await _fileService.DownloadFile(fileId, cancellationToken);
            var mimeType = _fileManager.GetMimeType(fileResponse.Filename);
            return File(fileResponse.FileStream, mimeType, fileResponse.Filename, true);
        }



        /// <summary>
        /// Download a file by it's id
        /// </summary>
        /// <param name="fileId">File id</param>
        /// <returns></returns>
        /// <response code="200">return file if it existed</response>
        /// <response code="404">return notfound if file did not exist</response>         
        [HttpGet("DownloadAll/{fileId}")]
        [ProducesResponseType((int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [AllowAnonymous]
        public async Task<IActionResult> DownloadAll([FromRoute] string fileId, CancellationToken cancellationToken)
        {

            var fileResponse = await _fileService.DownloadFiles(fileId, cancellationToken);
            return File(fileResponse.ByteArray, "application/zip", fileResponse.Filename);
        }





        //[HttpGet("ConfigValue")]
        //[AllowAnonymous]
        //public async Task<IActionResult> ConfigValue([FromQuery] string key)
        //{
        //    var value = _configuration[key];
        //    return Ok(value);
        //}
    }
}