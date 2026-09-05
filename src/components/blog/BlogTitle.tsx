type BlogTitleProps = {
  title: string;
  codeWords?: readonly string[];
};

export default function BlogTitle({ title, codeWords = [] }: BlogTitleProps) {
  return Array.from(title.matchAll(/\s+|\S+/g), match =>
    codeWords.includes(match[0]) ? (
      <code key={match.index} className="font-mono text-[0.88em]">
        {match[0]}
      </code>
    ) : (
      match[0]
    ),
  );
}
