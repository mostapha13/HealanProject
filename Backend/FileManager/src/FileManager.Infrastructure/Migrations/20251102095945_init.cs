using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FileManager.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class init : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FileType",
                columns: table => new
                {
                    Id = table.Column<short>(type: "smallint", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FileType", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PdfSignature",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AttachmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CertificationLevel = table.Column<int>(type: "int", nullable: true, defaultValue: 0),
                    RequestDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Reason = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    Location = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    ImageDataUrl = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    Page = table.Column<int>(type: "int", nullable: true, defaultValue: 1),
                    LowerLeftX = table.Column<float>(type: "real", nullable: true),
                    LowerLeftY = table.Column<float>(type: "real", nullable: true),
                    UpperRightX = table.Column<float>(type: "real", nullable: true),
                    UpperRightY = table.Column<float>(type: "real", nullable: true),
                    FileName = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    HashAlgorithm = table.Column<int>(type: "int", nullable: true, defaultValue: 0),
                    SignatureAttachmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Digest = table.Column<byte[]>(type: "varbinary(max)", nullable: true),
                    Certificate = table.Column<byte[]>(type: "varbinary(max)", nullable: true),
                    ParentPdfSignatureId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DepartmentId = table.Column<short>(type: "smallint", nullable: false),
                    LastModifiedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LastModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PdfSignature", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PdfSignature_PdfSignature_ParentPdfSignatureId",
                        column: x => x.ParentPdfSignatureId,
                        principalTable: "PdfSignature",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "File",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Link = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Filename = table.Column<string>(type: "varchar(512)", unicode: false, maxLength: 512, nullable: false),
                    SavedFileName = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false),
                    FileExtension = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    OriginalFilename = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false),
                    FileSize = table.Column<double>(type: "float", nullable: false),
                    IsEncrypted = table.Column<bool>(type: "bit", nullable: false),
                    RequestIP = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FileTypeId = table.Column<short>(type: "smallint", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "DateTime", nullable: false),
                    JsonInfo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DownloadedCount = table.Column<long>(type: "BigInt", nullable: false, defaultValue: 0L)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_File", x => x.Id);
                    table.ForeignKey(
                        name: "FK_File_FileType",
                        column: x => x.FileTypeId,
                        principalTable: "FileType",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "FileType",
                columns: new[] { "Id", "Name" },
                values: new object[,]
                {
                    { (short)1, "Image" },
                    { (short)2, "Video" },
                    { (short)3, "Document" },
                    { (short)4, "Excel" },
                    { (short)5, "PDF" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_File_FileTypeId",
                table: "File",
                column: "FileTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_PdfSignature_ParentPdfSignatureId",
                table: "PdfSignature",
                column: "ParentPdfSignatureId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "File");

            migrationBuilder.DropTable(
                name: "PdfSignature");

            migrationBuilder.DropTable(
                name: "FileType");
        }
    }
}
