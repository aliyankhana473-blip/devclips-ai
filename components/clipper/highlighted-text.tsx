export function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function isKeywordMatch(part: string, keywords: string[]) {
  return keywords.some((keyword) => keyword.toLowerCase() === part.toLowerCase());
}

export function HighlightedText({ text, keywords }: { text: string; keywords: string[] }) {
  if (keywords.length === 0) return <>{text}</>;

  const pattern = new RegExp(`(${keywords.map(escapeRegExp).join('|')})`, 'gi');
  return (
    <>
      {text.split(pattern).map((part, index) =>
        isKeywordMatch(part, keywords) ? (
          <mark key={index} className="rounded bg-yellow-300 px-1 font-semibold text-black">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}
