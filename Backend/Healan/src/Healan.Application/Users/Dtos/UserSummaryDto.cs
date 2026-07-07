namespace Healan.Application.Users.Dtos;

public class UserSummaryDto
{
    public string UserId { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public List<RoleInfoDto> RoleInfos { get; set; } = new();
}

public class RoleInfoDto
{
    public string RoleName { get; set; } = string.Empty;
    public string RoleTitle { get; set; } = string.Empty;
}
