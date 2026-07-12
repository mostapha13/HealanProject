namespace Healan.Application.Portal;

public static class RagSearchTextBuilder
{
    public static string Build(
        string question,
        string? questionSummary,
        string? keywords,
        string? topic,
        string? similarQuestions)
    {
        var parts = new List<string>();
        void Add(string? value)
        {
            if (!string.IsNullOrWhiteSpace(value))
                parts.Add(value.Trim());
        }

        Add(question);
        Add(questionSummary);
        Add(keywords);
        Add(topic);
        if (!string.IsNullOrWhiteSpace(similarQuestions))
        {
            foreach (var line in similarQuestions.Split(['\n', '|', '؛', ';'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                Add(line);
        }

        return string.Join(" | ", parts.Distinct(StringComparer.Ordinal));
    }
}
