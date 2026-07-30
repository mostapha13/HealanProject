using System.Net.Http.Headers;
using System.Text.Json;

namespace NegareshAI.Api.Security;

public static class NegareshAIAccessFormIds
{
    public const int Dashboard = 6001, Documents = 6002, DocumentsCreate = 6003,
        DocumentsEdit = 6004, DocumentsDelete = 6005, Contracts = 6006,
        ContractsCreate = 6007, ContractsEdit = 6008, ContractsDelete = 6009,
        Comparisons = 6010, ContractGeneration = 6011, Knowledge = 6012,
        Reports = 6013, ContractStatuses = 6014, BaseDocuments = 6015,
        ContractParties = 6016, OtherCatalogs = 6017, Users = 6018,
        Roles = 6019, AccessDefinitions = 6020, RolePermissions = 6021,
        UserPermissions = 6022, RuntimeSettings = 6023,
        Workflows = 6025, WorkflowDecision = 6026, Risk = 6027,
        Operations = 6028, OperationsManage = 6029, ManagementDashboard = 6030,
        ContractExpertReview = 6031, ContractFinalize = 6032,
        ComparisonReview = 6033, DocumentFinalizeRag = 6034,
        ContractGroupAccess = 6035, DocumentGroupAccess = 6036;
}

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public sealed class NegareshAccessAttribute(int accessFormId) : Attribute
{
    public int AccessFormId { get; } = accessFormId;
}

public sealed class NegareshAccessMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, IHttpClientFactory clients, IConfiguration configuration)
    {
        var requirements = context.GetEndpoint()?.Metadata.GetOrderedMetadata<NegareshAccessAttribute>() ?? [];
        if (requirements.Count == 0)
        {
            await next(context);
            return;
        }
        if (context.User.Identity?.IsAuthenticated != true)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return;
        }
        var token = context.Request.Headers.Authorization.ToString();
        var client = clients.CreateClient("IdentityUserManager");
        using var request = new HttpRequestMessage(HttpMethod.Get,
            "UserManager/api/v1/UserAccess/MyMenus?AccessSystemId=12");
        request.Headers.Authorization = AuthenticationHeaderValue.Parse(token);
        using var response = await client.SendAsync(request, context.RequestAborted);
        if (!response.IsSuccessStatusCode)
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return;
        }
        await using var stream = await response.Content.ReadAsStreamAsync(context.RequestAborted);
        using var json = await JsonDocument.ParseAsync(stream, cancellationToken: context.RequestAborted);
        var formIds = new HashSet<int>();
        Collect(json.RootElement, formIds);
        if (requirements.Any(x => !formIds.Contains(x.AccessFormId)))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsJsonAsync(new { title = "Access denied." }, context.RequestAborted);
            return;
        }
        await next(context);
    }

    private static void Collect(JsonElement element, HashSet<int> ids)
    {
        if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (var child in element.EnumerateArray()) Collect(child, ids);
            return;
        }
        if (element.ValueKind != JsonValueKind.Object) return;
        if (element.TryGetProperty("accessForm", out var form)
            && form.ValueKind == JsonValueKind.Object
            && form.TryGetProperty("accessFormId", out var id)
            && id.TryGetInt32(out var value)) ids.Add(value);
        if (element.TryGetProperty("children", out var children)) Collect(children, ids);
    }
}
