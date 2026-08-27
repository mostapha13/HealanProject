using System.Text.Json;
using TSEAI.Application.Chat.Context;

namespace TSEAI.Application.Chat.Agentic;

public sealed record ChatReflectionRequest(
    string Question,
    string Answer,
    ChatIntent Intent,
    double Confidence,
    int EvidenceCount,
    IReadOnlyList<string> FailedTools,
    IReadOnlyList<string>? Evidence = null,
    bool ExactCanonical = false);

public sealed record ChatReflectionResult(
    string Action,
    string? ImprovedQuery,
    string? Clarification,
    IReadOnlyList<string> Reasons);

public interface IChatReflector
{
    Task<ChatReflectionResult> ReviewAsync(ChatReflectionRequest request, CancellationToken ct);
}

public sealed record GroundedSynthesisEvidence(
    string SourceId,
    string? PublishedAt,
    string Text);

public sealed record GroundedAnswerSynthesisRequest(
    string Question,
    string StructuredAnswer,
    IReadOnlyList<CanonicalReferenceFact> StructuredFacts,
    IReadOnlyList<GroundedSynthesisEvidence> Evidence,
    IReadOnlyList<string> MissingFacets,
    IReadOnlyList<ConversationMemoryTurn> RecentTurns);

public interface IChatAnswerSynthesizer
{
    Task<string?> SynthesizeAsync(GroundedAnswerSynthesisRequest request,CancellationToken ct);
}

public interface IChatToolPolicy
{
    void Demand(string toolName);
    bool IsAllowed(string toolName);
}

public sealed record McpToolDescriptor(string Server, string Name, string? Description);
public sealed record McpToolCallResult(bool Success, JsonElement? Result, string? Error);

public interface IMcpToolGateway
{
    Task<IReadOnlyList<McpToolDescriptor>> ListToolsAsync(string server, CancellationToken ct);
    Task<McpToolCallResult> CallAsync(string server, string toolName, JsonElement arguments, CancellationToken ct);
}
