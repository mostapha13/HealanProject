SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;

USE [NegareshAI];

BEGIN TRANSACTION;

DECLARE @table nvarchar(517);
DECLARE @sql nvarchar(max);

DECLARE table_cursor CURSOR LOCAL FAST_FORWARD FOR
SELECT QUOTENAME(SCHEMA_NAME(schema_id)) + N'.' + QUOTENAME(name)
FROM sys.tables
WHERE name <> N'__EFMigrationsHistory'
ORDER BY name;

OPEN table_cursor;
FETCH NEXT FROM table_cursor INTO @table;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @sql = N'ALTER TABLE ' + @table + N' NOCHECK CONSTRAINT ALL;';
    EXEC sys.sp_executesql @sql;
    FETCH NEXT FROM table_cursor INTO @table;
END;

CLOSE table_cursor;
DEALLOCATE table_cursor;

DECLARE delete_cursor CURSOR LOCAL FAST_FORWARD FOR
SELECT QUOTENAME(SCHEMA_NAME(schema_id)) + N'.' + QUOTENAME(name)
FROM sys.tables
WHERE name <> N'__EFMigrationsHistory'
ORDER BY name;

OPEN delete_cursor;
FETCH NEXT FROM delete_cursor INTO @table;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @sql = N'DELETE FROM ' + @table + N';';
    EXEC sys.sp_executesql @sql;
    FETCH NEXT FROM delete_cursor INTO @table;
END;

CLOSE delete_cursor;
DEALLOCATE delete_cursor;

DECLARE check_cursor CURSOR LOCAL FAST_FORWARD FOR
SELECT QUOTENAME(SCHEMA_NAME(schema_id)) + N'.' + QUOTENAME(name)
FROM sys.tables
WHERE name <> N'__EFMigrationsHistory'
ORDER BY name;

OPEN check_cursor;
FETCH NEXT FROM check_cursor INTO @table;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @sql = N'ALTER TABLE ' + @table + N' WITH CHECK CHECK CONSTRAINT ALL;';
    EXEC sys.sp_executesql @sql;
    FETCH NEXT FROM check_cursor INTO @table;
END;

CLOSE check_cursor;
DEALLOCATE check_cursor;

-- Runtime configuration is infrastructure, not user-entered product data.
INSERT INTO [dbo].[Organizations] ([Id], [Name], [CreatedAtUtc])
VALUES ('11111111-1111-1111-1111-111111111111',
        N'NegareshAI Development Organization', '1970-01-01T00:00:00Z');

INSERT INTO [dbo].[RuntimeSettings]
    ([Id], [OrganizationId], [Category], [Key], [ValueJson], [Version], [IsActive], [UpdatedByUserId], [UpdatedAtUtc])
VALUES
    ('29000000-0000-0000-0000-000000000001',
     '11111111-1111-1111-1111-111111111111', N'ai', N'embedding.model',
     N'{"modelId":"BAAI/bge-m3","retrievalMode":"hybrid","normalizePersianDigits":true,"numericExactBoost":0.5}',
     1, 1, N'system-reset', SYSUTCDATETIME());

COMMIT TRANSACTION;

SELECT COALESCE(SUM(product_tables.rows), 0) AS RemainingRows
FROM (
    SELECT p.rows
    FROM sys.tables AS t
    INNER JOIN sys.partitions AS p ON p.object_id = t.object_id AND p.index_id IN (0, 1)
    WHERE t.name NOT IN (N'__EFMigrationsHistory', N'Organizations', N'RuntimeSettings')
) AS product_tables;
