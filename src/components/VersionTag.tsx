import { execSync } from "node:child_process";
import { cn } from "../lib/utils";

function getCommitHash() {
  const deploymentCommitHash = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;

  if (deploymentCommitHash) {
    return deploymentCommitHash;
  }

  try {
    return execSync("git rev-parse HEAD", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return undefined;
  }
}

export default function VersionTag({ className }: { className?: string }) {
  const commitHash = getCommitHash();

  return commitHash ? (
    <div
      title={commitHash}
      className={cn(
        "version-tag liquid-glass relative inline-flex h-8 items-center overflow-hidden rounded-full px-3 font-mono text-[0.72rem] font-black text-muted-foreground",
        className,
      )}
    >
      {commitHash.substring(0, 7)}
    </div>
  ) : (
    <></>
  );
}
