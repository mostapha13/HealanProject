SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

DECLARE @AdminRoleId uniqueidentifier;
DECLARE @AdminUserId uniqueidentifier;

SELECT @AdminRoleId = Id FROM AspNetRoles WHERE Name = N'Admin';
SELECT @AdminUserId = Id FROM AspNetUsers WHERE UserName = N'AdminUser';

IF @AdminRoleId IS NULL
BEGIN
  RAISERROR('Admin role not found', 16, 1);
  RETURN;
END

IF @AdminUserId IS NULL
BEGIN
  RAISERROR('AdminUser not found', 16, 1);
  RETURN;
END

UPDATE AspNetUsers SET IsActive = 1 WHERE Id = @AdminUserId;

IF NOT EXISTS (SELECT 1 FROM AspNetUserRoles WHERE UserId = @AdminUserId AND RoleId = @AdminRoleId)
  INSERT INTO AspNetUserRoles (UserId, RoleId) VALUES (@AdminUserId, @AdminRoleId);

IF NOT EXISTS (SELECT 1 FROM AccessSystemRole WHERE RoleId = @AdminRoleId AND AccessSystemId = 11)
  INSERT INTO AccessSystemRole (RoleId, AccessSystemId) VALUES (@AdminRoleId, 11);

INSERT INTO AccessRole (RoleId, AccessMenuId, HasPersianAccess)
SELECT @AdminRoleId, m.AccessMenuId, 1
FROM AccessMenu m
WHERE m.AccessMenuId >= 5101 AND m.AccessMenuId < 5200
  AND NOT EXISTS (
    SELECT 1 FROM AccessRole ar
    WHERE ar.RoleId = @AdminRoleId AND ar.AccessMenuId = m.AccessMenuId
  );

-- also refresh HasPersianAccess for existing rows
UPDATE ar
SET HasPersianAccess = 1
FROM AccessRole ar
WHERE ar.RoleId = @AdminRoleId
  AND ar.AccessMenuId >= 5101 AND ar.AccessMenuId < 5200;

SELECT u.UserName, u.IsActive, r.Name AS RoleName,
       (SELECT COUNT(*) FROM AccessRole ar WHERE ar.RoleId = r.Id AND ar.AccessMenuId BETWEEN 5101 AND 5199) AS HealanMenus
FROM AspNetUsers u
JOIN AspNetUserRoles ur ON ur.UserId = u.Id
JOIN AspNetRoles r ON r.Id = ur.RoleId
WHERE u.UserName = N'AdminUser';
