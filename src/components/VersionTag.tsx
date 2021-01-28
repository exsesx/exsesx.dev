import React from "react";

export default function VersionTag() {
  const commitHash = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;

  return commitHash ? (
    <div
      title={commitHash}
      className="fixed bottom-4 right-4 text-gray-900 dark:text-gray-50 opacity-70 font-mono text-sm"
    >
      {commitHash.substring(0, 7)}
    </div>
  ) : (
    <React.Fragment />
  );
}
