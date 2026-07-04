using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IdentityServer.Domain.Migrations
{
    /// <inheritdoc />
    public partial class init : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AccessSystem",
                columns: table => new
                {
                    AccessSystemId = table.Column<int>(type: "Int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SystemName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    SystemTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccessSystem", x => x.AccessSystemId);
                });

            migrationBuilder.CreateTable(
                name: "ApplicationRoleGroups",
                columns: table => new
                {
                    ApplicationRoleGroupId = table.Column<Guid>(type: "UniqueIdentifier", nullable: false),
                    ApplicationRoleGroupName = table.Column<string>(type: "nvarchar(100)", nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(100)", nullable: false),
                    DisplayOrder = table.Column<int>(type: "Int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApplicationRoleGroups", x => x.ApplicationRoleGroupId);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUsers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FirstName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ResetPasswordToken = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DepartmentId = table.Column<byte>(type: "TinyInt", nullable: false),
                    IsActive = table.Column<bool>(type: "Bit", nullable: false, defaultValueSql: "0"),
                    LastLoginIP = table.Column<string>(type: "varchar(20)", nullable: false),
                    LastLoginDate = table.Column<DateTime>(type: "DateTime", nullable: true),
                    CodeSendedDateTime = table.Column<DateTime>(type: "DateTime", nullable: true),
                    UserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SecurityStamp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "bit", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "bit", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SubSystemInfos",
                columns: table => new
                {
                    SubSystemInfoId = table.Column<int>(type: "Int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SubSystemInfoName = table.Column<string>(type: "nvarchar(100)", nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(100)", nullable: false),
                    DisplayOrder = table.Column<int>(type: "Int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubSystemInfos", x => x.SubSystemInfoId);
                });

            migrationBuilder.CreateTable(
                name: "AccessForm",
                columns: table => new
                {
                    AccessFormId = table.Column<int>(type: "Int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AccessSystemId = table.Column<int>(type: "Int", nullable: false),
                    FormTitle = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    URL = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccessForm", x => x.AccessFormId);
                    table.ForeignKey(
                        name: "FK_AccessForm_AccessSystem_AccessSystemId",
                        column: x => x.AccessSystemId,
                        principalTable: "AccessSystem",
                        principalColumn: "AccessSystemId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ApplicationRoleGroupId = table.Column<Guid>(type: "UniqueIdentifier", nullable: true),
                    AccessSystemId = table.Column<int>(type: "Int", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetRoles_AccessSystem_AccessSystemId",
                        column: x => x.AccessSystemId,
                        principalTable: "AccessSystem",
                        principalColumn: "AccessSystemId");
                    table.ForeignKey(
                        name: "FK_AspNetRoles_ApplicationRoleGroups_ApplicationRoleGroupId",
                        column: x => x.ApplicationRoleGroupId,
                        principalTable: "ApplicationRoleGroups",
                        principalColumn: "ApplicationRoleGroupId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUserClaims_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProviderKey = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_AspNetUserLogins_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserTokens",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_AspNetUserTokens_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SectionInfos",
                columns: table => new
                {
                    SectionInfoId = table.Column<int>(type: "Int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SubSystemId = table.Column<int>(type: "Int", nullable: false),
                    SectionInfoName = table.Column<string>(type: "nvarchar(100)", nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(100)", nullable: false),
                    DisplayOrder = table.Column<int>(type: "Int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SectionInfos", x => x.SectionInfoId);
                    table.ForeignKey(
                        name: "FK_SectionInfos_SubSystemInfos_SubSystemId",
                        column: x => x.SubSystemId,
                        principalTable: "SubSystemInfos",
                        principalColumn: "SubSystemInfoId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AccessMenu",
                columns: table => new
                {
                    AccessMenuId = table.Column<int>(type: "Int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AccessFormId = table.Column<int>(type: "Int", nullable: true),
                    ParentRef = table.Column<int>(type: "Int", nullable: true),
                    Order = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccessMenu", x => x.AccessMenuId);
                    table.ForeignKey(
                        name: "FK_AccessMenu_AccessForm_AccessFormId",
                        column: x => x.AccessFormId,
                        principalTable: "AccessForm",
                        principalColumn: "AccessFormId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AccessMenu_AccessMenu_ParentRef",
                        column: x => x.ParentRef,
                        principalTable: "AccessMenu",
                        principalColumn: "AccessMenuId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AccessSystemRole",
                columns: table => new
                {
                    AccessSystemRoleId = table.Column<int>(type: "Int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RoleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AccessSystemId = table.Column<int>(type: "Int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccessSystemRole", x => x.AccessSystemRoleId);
                    table.ForeignKey(
                        name: "FK_AccessSystemRole_AccessSystem_AccessSystemId",
                        column: x => x.AccessSystemId,
                        principalTable: "AccessSystem",
                        principalColumn: "AccessSystemId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AccessSystemRole_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RoleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetRoleClaims_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserRoles",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ActionInfos",
                columns: table => new
                {
                    ActionInfoId = table.Column<int>(type: "Int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SectionInfoId = table.Column<int>(type: "Int", nullable: false),
                    ActionInfoName = table.Column<string>(type: "nvarchar(100)", nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(100)", nullable: false),
                    DisplayOrder = table.Column<int>(type: "Int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActionInfos", x => x.ActionInfoId);
                    table.ForeignKey(
                        name: "FK_ActionInfos_SectionInfos_SectionInfoId",
                        column: x => x.SectionInfoId,
                        principalTable: "SectionInfos",
                        principalColumn: "SectionInfoId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AccessRole",
                columns: table => new
                {
                    AccessRoleId = table.Column<int>(type: "Int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RoleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AccessMenuId = table.Column<int>(type: "Int", nullable: false),
                    HasPersianAccess = table.Column<bool>(type: "bit", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccessRole", x => x.AccessRoleId);
                    table.ForeignKey(
                        name: "FK_AccessRole_AccessMenu_AccessMenuId",
                        column: x => x.AccessMenuId,
                        principalTable: "AccessMenu",
                        principalColumn: "AccessMenuId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ApplicationUserAccesses",
                columns: table => new
                {
                    ApplicationUserAccessId = table.Column<Guid>(type: "UniqueIdentifier", nullable: false),
                    ApplicationRoleId = table.Column<Guid>(type: "UniqueIdentifier", nullable: true),
                    ApplicationRoleGroupId = table.Column<Guid>(type: "UniqueIdentifier", nullable: true),
                    ActionInfoId = table.Column<int>(type: "Int", nullable: false),
                    AccessMode = table.Column<byte>(type: "TinyInt", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApplicationUserAccesses", x => x.ApplicationUserAccessId);
                    table.ForeignKey(
                        name: "FK_ApplicationUserAccesses_ActionInfos_ActionInfoId",
                        column: x => x.ActionInfoId,
                        principalTable: "ActionInfos",
                        principalColumn: "ActionInfoId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ApplicationUserAccesses_ApplicationRoleGroups_ApplicationRoleGroupId",
                        column: x => x.ApplicationRoleGroupId,
                        principalTable: "ApplicationRoleGroups",
                        principalColumn: "ApplicationRoleGroupId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ApplicationUserAccesses_AspNetRoles_ApplicationRoleId",
                        column: x => x.ApplicationRoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AccessForm_AccessSystemId",
                table: "AccessForm",
                column: "AccessSystemId");

            migrationBuilder.CreateIndex(
                name: "IX_AccessMenu_AccessFormId",
                table: "AccessMenu",
                column: "AccessFormId");

            migrationBuilder.CreateIndex(
                name: "IX_AccessMenu_ParentRef",
                table: "AccessMenu",
                column: "ParentRef");

            migrationBuilder.CreateIndex(
                name: "IX_AccessRole_AccessMenuId",
                table: "AccessRole",
                column: "AccessMenuId");

            migrationBuilder.CreateIndex(
                name: "IX_AccessSystemRole_AccessSystemId",
                table: "AccessSystemRole",
                column: "AccessSystemId");

            migrationBuilder.CreateIndex(
                name: "IX_AccessSystemRole_RoleId",
                table: "AccessSystemRole",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_ActionInfos_SectionInfoId",
                table: "ActionInfos",
                column: "SectionInfoId");

            migrationBuilder.CreateIndex(
                name: "IX_ApplicationUserAccesses_ActionInfoId",
                table: "ApplicationUserAccesses",
                column: "ActionInfoId");

            migrationBuilder.CreateIndex(
                name: "IX_ApplicationUserAccesses_ApplicationRoleGroupId",
                table: "ApplicationUserAccesses",
                column: "ApplicationRoleGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_ApplicationUserAccesses_ApplicationRoleId",
                table: "ApplicationUserAccesses",
                column: "ApplicationRoleId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoleClaims_RoleId",
                table: "AspNetRoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoles_AccessSystemId",
                table: "AspNetRoles",
                column: "AccessSystemId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoles_ApplicationRoleGroupId",
                table: "AspNetRoles",
                column: "ApplicationRoleGroupId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "AspNetRoles",
                column: "NormalizedName",
                unique: true,
                filter: "[NormalizedName] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserClaims_UserId",
                table: "AspNetUserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserLogins_UserId",
                table: "AspNetUserLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserRoles_RoleId",
                table: "AspNetUserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "AspNetUsers",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "AspNetUsers",
                column: "NormalizedUserName",
                unique: true,
                filter: "[NormalizedUserName] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_SectionInfos_SubSystemId",
                table: "SectionInfos",
                column: "SubSystemId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AccessRole");

            migrationBuilder.DropTable(
                name: "AccessSystemRole");

            migrationBuilder.DropTable(
                name: "ApplicationUserAccesses");

            migrationBuilder.DropTable(
                name: "AspNetRoleClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserLogins");

            migrationBuilder.DropTable(
                name: "AspNetUserRoles");

            migrationBuilder.DropTable(
                name: "AspNetUserTokens");

            migrationBuilder.DropTable(
                name: "AccessMenu");

            migrationBuilder.DropTable(
                name: "ActionInfos");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

            migrationBuilder.DropTable(
                name: "AspNetUsers");

            migrationBuilder.DropTable(
                name: "AccessForm");

            migrationBuilder.DropTable(
                name: "SectionInfos");

            migrationBuilder.DropTable(
                name: "ApplicationRoleGroups");

            migrationBuilder.DropTable(
                name: "AccessSystem");

            migrationBuilder.DropTable(
                name: "SubSystemInfos");
        }
    }
}
