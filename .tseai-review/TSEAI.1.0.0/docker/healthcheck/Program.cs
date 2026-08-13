if (args.Length != 1 || !Uri.TryCreate(args[0], UriKind.Absolute, out var endpoint))
    return 2;

using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(3) };
try
{
    using var response = await client.GetAsync(endpoint);
    return response.IsSuccessStatusCode ? 0 : 1;
}
catch
{
    return 1;
}
