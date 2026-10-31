import { cn } from "@/lib/utils";

type BlogTagsProps = {
  label: string;
  tags: readonly string[];
  className?: string;
};

/* Tags read as a quiet line of text, not as capsules: nothing here is pressable. */
export default function BlogTags({ label, tags, className }: BlogTagsProps) {
  return (
    <ul className={cn("text-sm leading-6 text-muted-foreground", className)} aria-label={label}>
      {tags.map((tag, index) => (
        <li key={tag} className="inline">
          {tag}
          {index < tags.length - 1 ? ", " : null}
        </li>
      ))}
    </ul>
  );
}
