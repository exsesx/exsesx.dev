import React from "react";

export default function VersionTag() {
  const commitHash = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;

  return commitHash ? (
    <div className="flex w-full justify-center px-4 py-6">
      <span title={commitHash} className="font-mono text-xs text-muted-foreground opacity-40">
        {commitHash.substring(0, 7)}
      </span>
    </div>
  ) : (
    <React.Fragment />
  );
}
