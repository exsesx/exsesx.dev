import { cn } from "../lib/utils";

const tagClassName =
  "flex items-center gap-2 font-mono text-[0.6875rem] font-semibold tracking-[0.18em] text-muted-foreground/55 transition-colors duration-200 hover:text-muted-foreground/80";

export default function VersionTag() {
  const commitHash = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;

  if (!commitHash) {
    return null;
  }

  const owner = process.env.NEXT_PUBLIC_VERCEL_GIT_REPO_OWNER;
  const slug = process.env.NEXT_PUBLIC_VERCEL_GIT_REPO_SLUG;
  const short = commitHash.substring(0, 7);

  const content = (
    <>
      <span aria-hidden="true" className="h-px w-7 bg-linear-to-r from-transparent to-foreground/20" />
      {short}
      <span aria-hidden="true" className="h-px w-7 bg-linear-to-l from-transparent to-foreground/20" />
    </>
  );

  return (
    <div className="flex w-full justify-center px-4 py-4">
      {owner && slug ? (
        <a
          href={`https://github.com/${owner}/${slug}/commit/${commitHash}`}
          target="_blank"
          rel="noreferrer"
          title={commitHash}
          className={cn(tagClassName, "rounded-full")}
        >
          {content}
        </a>
      ) : (
        <span title={commitHash} className={tagClassName}>
          {content}
        </span>
      )}
    </div>
  );
}
