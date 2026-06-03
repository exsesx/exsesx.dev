import React from "react";

export default function VersionTag() {
  const commitHash = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;

  return commitHash ? (
    <div
      title={commitHash}
      className="fixed bottom-4 right-4 rounded-full border border-border bg-card/70 px-3 py-1 font-mono text-xs font-bold text-muted-foreground opacity-70 shadow-sm backdrop-blur-xl"
    >
      {commitHash.substring(0, 7)}
    </div>
  ) : (
    <React.Fragment />
  );
}
