using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using TSEAI.Application.Chat.Agentic;

namespace TSEAI.Infrastructure.Mcp;

public sealed class HttpMcpToolGateway(IHttpClientFactory clients, IConfiguration cfg) : IMcpToolGateway
{
    public async Task<IReadOnlyList<McpToolDescriptor>> ListToolsAsync(string server, CancellationToken ct)
    {
        var endpoint = Resolve(server);
        if (endpoint is null) return [];
        var result = await RpcAsync(endpoint, "tools/list", null, ct);
        if (!result.Success || result.Result is null) return [];
        if (!result.Result.Value.TryGetProperty("tools", out var tools) || tools.ValueKind != JsonValueKind.Array) return [];
        var allowed = AllowedTools(server);
        return tools.EnumerateArray()
            .Select(x => new McpToolDescriptor(server,
                x.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "",
                x.TryGetProperty("description", out var d) ? d.GetString() : null))
            .Where(x => x.Name.Length > 0 && allowed.Contains(x.Name))
            .ToArray();
    }

    public async Task<McpToolCallResult> CallAsync(string server, string toolName, JsonElement arguments, CancellationToken ct)
    {
        var endpoint = Resolve(server);
        if (endpoint is null) return new(false, null, "mcp_server_disabled_or_unknown");
        if (!AllowedTools(server).Contains(toolName)) return new(false, null, "mcp_tool_not_allowlisted");
        return await RpcAsync(endpoint, "tools/call", new { name = toolName, arguments }, ct);
    }

    private string? Resolve(string server)
    {
        if (!string.Equals(cfg["Mcp:Enabled"], "true", StringComparison.OrdinalIgnoreCase)) return null;
        if (server.Any(c => !(char.IsLetterOrDigit(c) || c is '-' or '_'))) return null;
        var url = cfg[$"Mcp:Servers:{server}:BaseUrl"];
        return Uri.TryCreate(url, UriKind.Absolute, out var uri) && uri.Scheme is "http" or "https" ? uri.ToString() : null;
    }

    private HashSet<string> AllowedTools(string server) => cfg.GetSection($"Mcp:Servers:{server}:AllowedTools")
        .GetChildren().Select(x => x.Value).Where(x => !string.IsNullOrWhiteSpace(x))
        .Select(x => x!).ToHashSet(StringComparer.OrdinalIgnoreCase);

    private async Task<McpToolCallResult> RpcAsync(string endpoint, string method, object? parameters, CancellationToken ct)
    {
        var client = clients.CreateClient("mcp");
        using var req = new HttpRequestMessage(HttpMethod.Post, endpoint)
        {
            Content = JsonContent.Create(new { jsonrpc = "2.0", id = Guid.NewGuid().ToString("N"), method, @params = parameters })
        };
        req.Headers.Accept.ParseAdd("application/json");
        using var res = await client.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, ct);
        if (!res.IsSuccessStatusCode) return new(false, null, $"mcp_http_{(int)res.StatusCode}");
        using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
        var root = doc.RootElement;
        if (root.TryGetProperty("error", out var error)) return new(false, null, error.ToString());
        return root.TryGetProperty("result", out var result)
            ? new(true, result.Clone(), null)
            : new(false, null, "mcp_missing_result");
    }
}
