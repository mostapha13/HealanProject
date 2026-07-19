using FileManager.Domain.Configs;
using FileManager.Domain.DTOs;
using FileManager.Domain.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;
using FileManager.Infrastructure.Persistence;
using Share.Domain.Messages;
using Microsoft.Extensions.Configuration;
using System.Collections.Immutable;
using Share.Domain.Enums;
using Share.Domain.Extensions;
using Share.Infrastructure.ApiProviders.AccessFile;
using Share.Domain.Exceptions;

namespace FileManager.Infrastructure.Services
{
    public class FileService : IFileService
    {
        private readonly ILogger<FileService> _logger;
        private readonly IApplicationDbContext dbContext;
        private readonly UploadFileConfig _config;
        private readonly ILinkMaker _linkMaker;
        private readonly IFileManager _fileManager;
        private readonly IDateTime _dateTime;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ICurrentUserService _currentUserService;
        private readonly IFileAccessStatus _fileAccessStatus;
        private readonly IConfiguration _configuration;
        private readonly IRefitHasAccessApi _refitHasAccessApi;
        public FileService(ILogger<FileService> logger,
            IApplicationDbContext dbContext,
            IOptionsMonitor<UploadFileConfig> config, ILinkMaker linkMaker, IFileManager fileManager, IDateTime dateTime, IHttpContextAccessor httpContextAccessor, ICurrentUserService currentUserService, IFileAccessStatus fileAccessStatus, IConfiguration configuration, IRefitHasAccessApi refitHasAccessApi)
        {
          
            _linkMaker = linkMaker;
            _fileManager = fileManager;
            _dateTime = dateTime;
            _httpContextAccessor = httpContextAccessor;
            _currentUserService = currentUserService;
            _fileAccessStatus = fileAccessStatus;
            _configuration = configuration;
            _refitHasAccessApi = refitHasAccessApi;

            this._logger = logger ?? throw new ArgumentNullException(nameof(logger));
            this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
            this._config = config?.CurrentValue ?? throw new ArgumentNullException(nameof(config));
        }
        public async Task<UploadFileResponse> UploadFile(UploadFileRequest request)
        {
            Console.WriteLine($"[FileService] UploadFile begin name={request.Filename} sizeKb={request.Size}");
            ValidateFileName(request.Filename);

            var profiles = _config.Profiles?.ToList() ?? new List<UploadFileProfile>();
            Console.WriteLine($"[FileService] profilesCount={profiles.Count} dir={_config.DirectoryPath}");
            if (profiles.Count == 0)
                throw new BadRequestExceptions("پروفایل آپلود فایل تنظیم نشده است.");

            var fileExtension = Path.GetExtension(request.Filename).ToLowerInvariant();
            var profile = profiles.FirstOrDefault(item => item.Extension != null && item.Extension.Contains(fileExtension));
            if (profile == null)
                throw new BadRequestExceptions("فرمت فایل صحیح نیست");

            if (request.Size < profile.MinSizeKB)
                throw new BadRequestExceptions($"حجم فایل ارسالی نباید کمتر از {profile.MinSizeKB} کیلوبایت باشد");

            if (request.Size > profile.MaxSizeKB)
                throw new BadRequestExceptions($"حجم فایل ارسالی نباید بیشتر از {profile.MaxSizeKB} کیلوبایت باشد");

            await using var ms = new MemoryStream();
            await request.Stream.CopyToAsync(ms);
            ms.Position = 0;

            var meme = MimeDetective.InMemory.MimeExtensions.DetectMimeType(ms);
            Console.WriteLine($"[FileService] mime={(meme?.Mime ?? "null")} ext={fileExtension}");
            if (meme == null && fileExtension != ".txt")
                throw new BadRequestExceptions("محتوای فایل با فرمت فایل مرتبط نیست");

            if (meme != null)
            {
                if (fileExtension == ".zip")
                {
                    if (meme.Mime != "application/x-compressed" && meme.Mime != "application/zip")
                        throw new BadRequestExceptions("محتوای فایل صحیح نیست");
                }
                else if (!MimeMapping.MimeUtility.TypeMap.Any(a =>
                             a.Key == fileExtension.Replace(".", "") && a.Value == meme.Mime))
                {
                    // Soft-fail for common image MIME aliases rather than hard 500/400 noise.
                    var isImage = profile.Type == FileTypeId.Image
                                  && meme.Mime.StartsWith("image/", StringComparison.OrdinalIgnoreCase);
                    if (!isImage)
                        throw new BadRequestExceptions("محتوای فایل صحیح نیست");
                }
            }

            ms.Position = 0;

            var fileId = Guid.NewGuid();
            var fileLink = _linkMaker.MakeLink(fileId.ToString(), "File/Download");
            Console.WriteLine($"[FileService] saving fileId={fileId} link={fileLink}");
            var savedFileName = await _fileManager.SaveFile(ms, fileId, fileExtension, request.IsEncrypted);
            Console.WriteLine($"[FileService] saved as {savedFileName}");

            var file = new Domain.Entities.File()
            {
                Id = fileId,
                Filename = $"{fileId}{fileExtension}",
                FileExtension = fileExtension,
                FileTypeId = profile.Type,
                OriginalFilename = request.Filename,
                SavedFileName = savedFileName,
                Link = fileLink,
                CreatedAt = _dateTime.Now,
                FileSize = request.Size,
                IsEncrypted = request.IsEncrypted,
                RequestIP = _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString() ?? "unknown",
            };

            try
            {
                dbContext.Files.Add(file);
                await dbContext.SaveChangesAsync(CancellationToken.None);
                Console.WriteLine($"[FileService] db ok fileId={fileId}");
            }
            catch (Exception dbEx)
            {
                Console.Error.WriteLine($"[FileService] DB FAIL {dbEx.GetType().FullName}: {dbEx.Message}");
                if (dbEx.InnerException != null)
                    Console.Error.WriteLine($"[FileService] DB INNER {dbEx.InnerException.Message}");
                Console.Error.WriteLine(dbEx.ToString());
                throw;
            }

            return new UploadFileResponse()
            {
                Link = fileLink,
                FileName = request.Filename,
                FileId = file.Id.ToString(),
                FileType = file.FileTypeId
            };
        }
        //       public string GetMimeType(Stream stream, string fileExtention)
        //       {
        //           var meme = MimeDetective.InMemory.MimeExtensions.DetectMimeType(stream);
        //           if (meme == null)
        //           {
        //               return getMimeFromStream(stream, fileExtention);
        //           }
        //           return meme.Mime;
        //       }
        //       [DllImport("urlmon.dll", CharSet = CharSet.Unicode, ExactSpelling = true, SetLastError = false)]
        //       static extern int FindMimeFromData(IntPtr pBC,
        // [MarshalAs(UnmanagedType.LPWStr)] string pwzUrl,
        //[MarshalAs(UnmanagedType.LPArray, ArraySubType=UnmanagedType.I1, SizeParamIndex=3)]
        //       byte[] pBuffer,
        // int cbSize,
        //    [MarshalAs(UnmanagedType.LPWStr)] string pwzMimeProposed,
        // int dwMimeFlags,
        // out IntPtr ppwzMimeOut,
        // int dwReserved);
        //       public static string getMimeFromStream(Stream stream, string fileExtention)
        //       {
        //           IntPtr mimeout;
        //           byte[] buffer = new byte[256];
        //           if (stream.Length >= 256)
        //               stream.Read(buffer, 0, 256);
        //           else
        //               stream.Read(buffer, 0, (int)stream.Length);
        //           int result = FindMimeFromData(IntPtr.Zero, fileExtention, buffer, buffer.Length, null, 0, out mimeout, 0);

        //           if (result != 0)
        //               throw Marshal.GetExceptionForHR(result);
        //           string mime = Marshal.PtrToStringUni(mimeout);
        //           Marshal.FreeCoTaskMem(mimeout);
        //           return mime;
        //       }
        private void ValidateFileName(string value)
        {
            if (string.IsNullOrEmpty(value))
                return;
            if (value.Contains("&") || value.Contains("\"") || value.Contains("'") || value.Contains("<") || value.Contains(">"))
                throw new BadRequestExceptions("فرمت ورودی اطلاعات صحیح نیست");
        }
        public async Task<DownloadFileResponse> DownloadFile(Guid fileId, CancellationToken cancellationToken)
        {
            var file = await dbContext.Files.FirstOrDefaultAsync(item => item.Id == fileId, cancellationToken);
            if (file == null)
                throw new NotFoundExceptions($"داده ورودی معتبر نمیباشد");

            _logger.LogInformation($"Start Download File {fileId}");

            if (_configuration["CheckAccess"] == "1" && !string.IsNullOrEmpty(file.JsonInfo))
            {
                _logger.LogInformation($"file.JsonInfo Has Value");
                var fileInfo = JsonConverter.JsonToObject<FileInfoMessage>(file.JsonInfo);
                if (fileInfo != null && _currentUserService.UserId == Guid.Empty)
                {
                    _logger.LogInformation($"IdentityServer:Url {_configuration["IdentityServer:Url"]} _currentUserService.UserId {_currentUserService.UserId} ");
                    foreach (var item in _httpContextAccessor?.HttpContext?.User?.Claims)
                    {
                        _logger.LogInformation($"{item.Subject}  {item.Value}");
                    }

                    _logger.LogInformation($"_currentUserService.UserId Has Not Value And fileInfo.System Is {fileInfo.System}");
                    if (fileInfo.System == Share.Domain.Enums.SystemTypeId.MarketMaker)
                        throw new BadRequestExceptions($"دسترسی برای دانلود فایل وجود ندارد");

                    var fileInfocms = JsonConverter.JsonToObject<FileInfoMessageCMS>(file.JsonInfo);

                    if (fileInfocms != null && fileInfo.System == Share.Domain.Enums.SystemTypeId.CMS && fileInfocms.ContentStatusId != ContentStatusId.Published)
                        throw new BadRequestExceptions($"دسترسی برای دانلود فایل وجود ندارد");
                }
                else if (fileInfo != null && fileInfo.System == Share.Domain.Enums.SystemTypeId.MarketMaker)
                {
                    _logger.LogInformation($"fileInfo Is Not Null And fileInfo.System Is MarketMAker");
                    try
                    {
                        _logger.LogInformation($"Start Call Api");
                        var access = await _refitHasAccessApi.HasAccess(new FileAccessBody() {FileId=fileId,UserId= _currentUserService.UserId });   //await _fileAccessStatus.HasAccess(_configuration["MarketMakerFileUrl"], fileId, _currentUserService.UserId);
                        _logger.LogInformation($"Access result Is {access}");
                        if (!access)
                        {
                            throw new BadRequestExceptions($"دسترسی برای دانلود فایل وجود ندارد");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogCritical(ex, "Exception Raised On Call FileAccess Api");
                        throw new BadRequestExceptions($"دسترسی برای دانلود فایل وجود ندارد");
                    }
                }
            }


            var stream = _fileManager.OpenFile(file.SavedFileName, file.IsEncrypted);
            if (stream == null)
            {
                _logger.LogCritical($"File[id={fileId:n}] exist in db but fileManager return null stream.");
                throw new NotFoundExceptions($"File[id={fileId:n}] does not exist.");
            }
            file.DownloadedCount++;
            await dbContext.SaveChangesAsync(cancellationToken);
            return new DownloadFileResponse()
            {
                Filename = file.OriginalFilename,
                FileStream = stream
            };
        }

        public async Task<DownloadFilesResponse> DownloadFiles(string fileId, CancellationToken cancellationToken)
        {
          
            var files = await dbContext.Files.Where(s =>ApplicationDbContext.JsonValue(s.JsonInfo, "$.ContentId") == fileId && ApplicationDbContext.JsonValue(s.JsonInfo, "$.SubSystem") == "5").ToListAsync(cancellationToken);
            if (files == null || !files.Any())
                throw new NotFoundExceptions($"File[id={fileId:n}] does not exist.");

            var stream = _fileManager.OpenMultiFile(files.Select(s => s.SavedFileName).ToList());
            if (stream == null)
            {
                _logger.LogCritical($"File[id={fileId:n}] exist in db but fileManager return null stream.");
                throw new NotFoundExceptions($"File[id={fileId:n}] does not exist.");
            }
            foreach (var file in files)
            {
                file.DownloadedCount++;
            }
            await dbContext.SaveChangesAsync(cancellationToken);
            return new DownloadFilesResponse()
            {
                Filename = "ZipFile.zip",
                ByteArray = stream
            };
        }
    }
}
