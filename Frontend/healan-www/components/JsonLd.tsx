export function JsonLd({ data }: { data: Record<string, unknown>[] }) {
  if (!data.length) return null;
  const payload = JSON.stringify(data.length === 1 ? data[0] : data).replace(
    /</g,
    '\\u003c'
  );
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: payload }}
    />
  );
}
