using System.Text.RegularExpressions;
namespace TSEAI.Application.Security;
public sealed record SecurityDecision(bool Allowed,string Code,IReadOnlyList<string> Signals);
public interface IAgenticSecurityGuard { SecurityDecision Inspect(string input); }
public sealed class DeterministicAgenticSecurityGuard : IAgenticSecurityGuard
{
    private static readonly Regex[] Patterns={
      new(@"(?i)ignore (all|previous) instructions|system prompt|developer message",RegexOptions.Compiled),
      new(@"(?i)drop\s+table|delete\s+from|insert\s+into|update\s+.+set",RegexOptions.Compiled),
      new(@"(?i)(curl|wget|powershell|cmd\.exe|/bin/sh|bash)\b",RegexOptions.Compiled),
      new(@"(?i)mcp\s*:\s*[^\s]+|file://|169\.254\.169\.254",RegexOptions.Compiled)
    };
    public SecurityDecision Inspect(string input){var signals=Patterns.Select((p,i)=>(p,i)).Where(x=>x.p.IsMatch(input)).Select(x=>$"pattern_{x.i+1}").ToArray();return new(signals.Length==0,signals.Length==0?"allowed":"prompt_or_tool_injection_detected",signals);}
}
