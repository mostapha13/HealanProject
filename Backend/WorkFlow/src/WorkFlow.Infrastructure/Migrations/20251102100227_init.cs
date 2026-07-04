using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WorkFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class init : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Form",
                columns: table => new
                {
                    FormId = table.Column<int>(type: "Int", nullable: false),
                    FormName = table.Column<string>(type: "nvarchar(100)", nullable: false),
                    FormUrl = table.Column<string>(type: "nvarchar(200)", nullable: false),
                    ForwardClass = table.Column<string>(type: "nvarchar(200)", nullable: false),
                    BackwardClass = table.Column<string>(type: "nvarchar(200)", nullable: false),
                    FormStateId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Form", x => x.FormId);
                });

            migrationBuilder.CreateTable(
                name: "Fund",
                columns: table => new
                {
                    FundId = table.Column<Guid>(type: "UniqueIdentifier", nullable: false),
                    FundName = table.Column<string>(type: "nvarchar(100)", nullable: false),
                    BrokerId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Fund", x => x.FundId);
                });

            migrationBuilder.CreateTable(
                name: "OrderStatus",
                columns: table => new
                {
                    OrderStatusId = table.Column<byte>(type: "TinyInt", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderStatus", x => x.OrderStatusId);
                });

            migrationBuilder.CreateTable(
                name: "WorkFlowUserGroup",
                columns: table => new
                {
                    WorkFlowUserGroupId = table.Column<int>(type: "Int", nullable: false),
                    GroupName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkFlowUserGroup", x => x.WorkFlowUserGroupId);
                });

            migrationBuilder.CreateTable(
                name: "WorkFlowType",
                columns: table => new
                {
                    WorkFlowTypeId = table.Column<int>(type: "Int", nullable: false),
                    WorkFlowName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    RecordFormId = table.Column<int>(type: "Int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkFlowType", x => x.WorkFlowTypeId);
                    table.ForeignKey(
                        name: "FK_WorkFlowType_Form_RecordFormId",
                        column: x => x.RecordFormId,
                        principalTable: "Form",
                        principalColumn: "FormId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "WorkFlowUser",
                columns: table => new
                {
                    WorkFlowUserId = table.Column<Guid>(type: "UniqueIdentifier", nullable: false),
                    IdentityUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    FundId = table.Column<Guid>(type: "UniqueIdentifier", nullable: true),
                    BrokerId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    FirstName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsActive = table.Column<bool>(type: "Bit", nullable: false),
                    IsConfirmed = table.Column<bool>(type: "Bit", nullable: false, defaultValue: true),
                    WorkFlowUserGroupId = table.Column<int>(type: "Int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkFlowUser", x => x.WorkFlowUserId);
                    table.ForeignKey(
                        name: "FK_WorkFlowUser_Fund_FundId",
                        column: x => x.FundId,
                        principalTable: "Fund",
                        principalColumn: "FundId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkFlowUser_WorkFlowUserGroup_WorkFlowUserGroupId",
                        column: x => x.WorkFlowUserGroupId,
                        principalTable: "WorkFlowUserGroup",
                        principalColumn: "WorkFlowUserGroupId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "WorkFlowGuide",
                columns: table => new
                {
                    WorkFlowGuideId = table.Column<Guid>(type: "UniqueIdentifier", nullable: false),
                    SenderGroupId = table.Column<int>(type: "Int", nullable: false),
                    ReceiverGroupId = table.Column<int>(type: "Int", nullable: false),
                    FormId = table.Column<int>(type: "Int", nullable: false),
                    WorkFlowTypeId = table.Column<int>(type: "Int", nullable: false),
                    ParentId = table.Column<Guid>(type: "UniqueIdentifier", nullable: true),
                    Weight = table.Column<int>(type: "Int", nullable: false),
                    OrderStatusId = table.Column<byte>(type: "TinyInt", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkFlowGuide", x => x.WorkFlowGuideId);
                    table.ForeignKey(
                        name: "FK_WorkFlowGuide_Form_FormId",
                        column: x => x.FormId,
                        principalTable: "Form",
                        principalColumn: "FormId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkFlowGuide_OrderStatus_OrderStatusId",
                        column: x => x.OrderStatusId,
                        principalTable: "OrderStatus",
                        principalColumn: "OrderStatusId");
                    table.ForeignKey(
                        name: "FK_WorkFlowGuide_WorkFlowGuide_ParentId",
                        column: x => x.ParentId,
                        principalTable: "WorkFlowGuide",
                        principalColumn: "WorkFlowGuideId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkFlowGuide_WorkFlowType_WorkFlowTypeId",
                        column: x => x.WorkFlowTypeId,
                        principalTable: "WorkFlowType",
                        principalColumn: "WorkFlowTypeId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkFlowGuide_WorkFlowUserGroup_ReceiverGroupId",
                        column: x => x.ReceiverGroupId,
                        principalTable: "WorkFlowUserGroup",
                        principalColumn: "WorkFlowUserGroupId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkFlowGuide_WorkFlowUserGroup_SenderGroupId",
                        column: x => x.SenderGroupId,
                        principalTable: "WorkFlowUserGroup",
                        principalColumn: "WorkFlowUserGroupId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ORDERS",
                columns: table => new
                {
                    OrderId = table.Column<Guid>(type: "UniqueIdentifier", nullable: false),
                    OrderParentId = table.Column<Guid>(type: "UniqueIdentifier", nullable: true),
                    FundId = table.Column<Guid>(type: "UniqueIdentifier", nullable: true),
                    OrderStatusId = table.Column<byte>(type: "TinyInt", nullable: false),
                    TrackingNumber = table.Column<string>(type: "varchar(50)", nullable: false, defaultValue: "1000000"),
                    IsDeleted = table.Column<bool>(type: "Bit", nullable: false, defaultValue: false),
                    IsDeny = table.Column<bool>(type: "bit", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    WorkFlowUserId = table.Column<Guid>(type: "UniqueIdentifier", nullable: true),
                    CreateDate = table.Column<DateTime>(type: "DateTime", nullable: true),
                    ExtraInfo = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ORDERS", x => x.OrderId);
                    table.ForeignKey(
                        name: "FK_ORDERS_Fund_FundId",
                        column: x => x.FundId,
                        principalTable: "Fund",
                        principalColumn: "FundId");
                    table.ForeignKey(
                        name: "FK_ORDERS_ORDERS_OrderParentId",
                        column: x => x.OrderParentId,
                        principalTable: "ORDERS",
                        principalColumn: "OrderId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ORDERS_OrderStatus_OrderStatusId",
                        column: x => x.OrderStatusId,
                        principalTable: "OrderStatus",
                        principalColumn: "OrderStatusId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ORDERS_WorkFlowUser_WorkFlowUserId",
                        column: x => x.WorkFlowUserId,
                        principalTable: "WorkFlowUser",
                        principalColumn: "WorkFlowUserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "WorkFlowStatusGuide",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GuideId = table.Column<Guid>(type: "UniqueIdentifier", nullable: false),
                    OrderStatusId = table.Column<byte>(type: "TinyInt", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkFlowStatusGuide", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkFlowStatusGuide_OrderStatus_OrderStatusId",
                        column: x => x.OrderStatusId,
                        principalTable: "OrderStatus",
                        principalColumn: "OrderStatusId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WorkFlowStatusGuide_WorkFlowGuide_GuideId",
                        column: x => x.GuideId,
                        principalTable: "WorkFlowGuide",
                        principalColumn: "WorkFlowGuideId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OrderComment",
                columns: table => new
                {
                    OrderCommentId = table.Column<Guid>(type: "UniqueIdentifier", nullable: false),
                    OrderId = table.Column<Guid>(type: "UniqueIdentifier", nullable: false),
                    WorkFlowGuidId = table.Column<Guid>(type: "UniqueIdentifier", nullable: false),
                    WorkFlowUserId = table.Column<Guid>(type: "UniqueIdentifier", nullable: false),
                    Comment = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsPrivate = table.Column<bool>(type: "Bit", nullable: false),
                    CommentDate = table.Column<DateTime>(type: "DateTime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderComment", x => x.OrderCommentId);
                    table.ForeignKey(
                        name: "FK_OrderComment_ORDERS_OrderId",
                        column: x => x.OrderId,
                        principalTable: "ORDERS",
                        principalColumn: "OrderId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OrderComment_WorkFlowGuide_WorkFlowGuidId",
                        column: x => x.WorkFlowGuidId,
                        principalTable: "WorkFlowGuide",
                        principalColumn: "WorkFlowGuideId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OrderComment_WorkFlowUser_WorkFlowUserId",
                        column: x => x.WorkFlowUserId,
                        principalTable: "WorkFlowUser",
                        principalColumn: "WorkFlowUserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "WorkFlowArchive",
                columns: table => new
                {
                    WorkFlowArchiveId = table.Column<Guid>(type: "UniqueIdentifier", nullable: false),
                    WorkFlowItemId = table.Column<Guid>(type: "UniqueIdentifier", nullable: false),
                    OrderId = table.Column<Guid>(type: "UniqueIdentifier", nullable: false),
                    WorkFlowGuidId = table.Column<Guid>(type: "UniqueIdentifier", nullable: false),
                    WorkFlowDate = table.Column<DateTime>(type: "DateTime", nullable: false),
                    WorkFlowArchiveDate = table.Column<DateTime>(type: "DateTime", nullable: false),
                    UserId = table.Column<Guid>(type: "UniqueIdentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkFlowArchive", x => x.WorkFlowArchiveId);
                    table.ForeignKey(
                        name: "FK_WorkFlowArchive_ORDERS_OrderId",
                        column: x => x.OrderId,
                        principalTable: "ORDERS",
                        principalColumn: "OrderId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkFlowArchive_WorkFlowGuide_WorkFlowGuidId",
                        column: x => x.WorkFlowGuidId,
                        principalTable: "WorkFlowGuide",
                        principalColumn: "WorkFlowGuideId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "WorkFlowItem",
                columns: table => new
                {
                    WorkFlowItemId = table.Column<Guid>(type: "UniqueIdentifier", nullable: false),
                    OrderId = table.Column<Guid>(type: "UniqueIdentifier", nullable: false),
                    WorkFlowGuideId = table.Column<Guid>(type: "UniqueIdentifier", nullable: false),
                    WorkFlowDate = table.Column<DateTime>(type: "DateTime", nullable: false),
                    HasObserved = table.Column<bool>(type: "Bit", nullable: false),
                    UserId = table.Column<Guid>(type: "UniqueIdentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkFlowItem", x => x.WorkFlowItemId);
                    table.ForeignKey(
                        name: "FK_WorkFlowItem_ORDERS_OrderId",
                        column: x => x.OrderId,
                        principalTable: "ORDERS",
                        principalColumn: "OrderId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkFlowItem_WorkFlowGuide_WorkFlowGuideId",
                        column: x => x.WorkFlowGuideId,
                        principalTable: "WorkFlowGuide",
                        principalColumn: "WorkFlowGuideId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OrderComment_OrderId",
                table: "OrderComment",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderComment_WorkFlowGuidId",
                table: "OrderComment",
                column: "WorkFlowGuidId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderComment_WorkFlowUserId",
                table: "OrderComment",
                column: "WorkFlowUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ORDERS_FundId",
                table: "ORDERS",
                column: "FundId");

            migrationBuilder.CreateIndex(
                name: "IX_ORDERS_OrderParentId",
                table: "ORDERS",
                column: "OrderParentId");

            migrationBuilder.CreateIndex(
                name: "IX_ORDERS_OrderStatusId",
                table: "ORDERS",
                column: "OrderStatusId");

            migrationBuilder.CreateIndex(
                name: "IX_ORDERS_WorkFlowUserId",
                table: "ORDERS",
                column: "WorkFlowUserId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkFlowArchive_OrderId",
                table: "WorkFlowArchive",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkFlowArchive_WorkFlowGuidId",
                table: "WorkFlowArchive",
                column: "WorkFlowGuidId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkFlowGuide_FormId",
                table: "WorkFlowGuide",
                column: "FormId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkFlowGuide_OrderStatusId",
                table: "WorkFlowGuide",
                column: "OrderStatusId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkFlowGuide_ParentId",
                table: "WorkFlowGuide",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkFlowGuide_ReceiverGroupId",
                table: "WorkFlowGuide",
                column: "ReceiverGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkFlowGuide_SenderGroupId",
                table: "WorkFlowGuide",
                column: "SenderGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkFlowGuide_WorkFlowTypeId",
                table: "WorkFlowGuide",
                column: "WorkFlowTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkFlowItem_OrderId",
                table: "WorkFlowItem",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkFlowItem_WorkFlowGuideId",
                table: "WorkFlowItem",
                column: "WorkFlowGuideId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkFlowStatusGuide_GuideId",
                table: "WorkFlowStatusGuide",
                column: "GuideId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkFlowStatusGuide_OrderStatusId",
                table: "WorkFlowStatusGuide",
                column: "OrderStatusId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkFlowType_RecordFormId",
                table: "WorkFlowType",
                column: "RecordFormId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkFlowUser_FundId",
                table: "WorkFlowUser",
                column: "FundId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkFlowUser_WorkFlowUserGroupId",
                table: "WorkFlowUser",
                column: "WorkFlowUserGroupId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OrderComment");

            migrationBuilder.DropTable(
                name: "WorkFlowArchive");

            migrationBuilder.DropTable(
                name: "WorkFlowItem");

            migrationBuilder.DropTable(
                name: "WorkFlowStatusGuide");

            migrationBuilder.DropTable(
                name: "ORDERS");

            migrationBuilder.DropTable(
                name: "WorkFlowGuide");

            migrationBuilder.DropTable(
                name: "WorkFlowUser");

            migrationBuilder.DropTable(
                name: "OrderStatus");

            migrationBuilder.DropTable(
                name: "WorkFlowType");

            migrationBuilder.DropTable(
                name: "Fund");

            migrationBuilder.DropTable(
                name: "WorkFlowUserGroup");

            migrationBuilder.DropTable(
                name: "Form");
        }
    }
}
