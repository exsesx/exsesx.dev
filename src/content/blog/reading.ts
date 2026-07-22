const WORDS_PER_MINUTE = 225;

export type ArticleHeading = {
  depth: 2 | 3;
  id: string;
  text: string;
};

export type MdxSourceAnalysis = {
  headings: ArticleHeading[];
  readingMinutes: number;
};

export function analyzeMdxSource(source: string): MdxSourceAnalysis {
  const prose = source
    .replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, " ")
    .replace(/^import\s.+$/gm, " ")
    .replace(/^export\s.+$/gm, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_>#{}|~-]/g, " ");
  const wordCount = prose.match(/[\p{L}\p{N}][\p{L}\p{N}'’.:-]*/gu)?.length ?? 0;

  return {
    headings: extractHeadings(source),
    readingMinutes: Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE)),
  };
}

function extractHeadings(source: string): ArticleHeading[] {
  const headings: ArticleHeading[] = [];
  const slugCounts = new Map<string, number>();
  let activeFence: "```" | "~~~" | null = null;

  for (const line of source.split("\n")) {
    const trimmed = line.trimStart();
    const fence = trimmed.startsWith("```") ? "```" : trimmed.startsWith("~~~") ? "~~~" : null;

    if (fence) {
      activeFence = activeFence === fence ? null : (activeFence ?? fence);
      continue;
    }

    if (activeFence) {
      continue;
    }

    const match = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(trimmed);

    if (!match) {
      continue;
    }

    const depth = match[1].length as 2 | 3;
    const text = stripInlineMarkdown(match[2]);
    const baseSlug = slugifyHeading(text);
    const duplicateIndex = slugCounts.get(baseSlug) ?? 0;

    slugCounts.set(baseSlug, duplicateIndex + 1);
    headings.push({
      depth,
      id: duplicateIndex === 0 ? baseSlug : `${baseSlug}-${duplicateIndex}`,
      text,
    });
  }

  return headings;
}

function stripInlineMarkdown(value: string) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[`*_~]/g, "")
    .trim();
}

function slugifyHeading(value: string) {
  return value
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
