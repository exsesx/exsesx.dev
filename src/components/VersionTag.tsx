import React from "react";

export default function VersionTag() {
  const commitHash = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;

  if (!commitHash) {
    return <React.Fragment />;
  }

  const owner = process.env.NEXT_PUBLIC_VERCEL_GIT_REPO_OWNER;
  const slug = process.env.NEXT_PUBLIC_VERCEL_GIT_REPO_SLUG;
  const short = commitHash.substring(0, 7);

  const mark = (
    <React.Fragment>
      <span className="version-tag-node" aria-hidden="true" />
      {short}
    </React.Fragment>
  );

  return (
    <div className="flex w-full justify-center px-4 py-4">
      {owner && slug ? (
        <a
          href={`https://github.com/${owner}/${slug}/commit/${commitHash}`}
          target="_blank"
          rel="noreferrer"
          title={commitHash}
          className="version-tag rounded-full"
        >
          {mark}
        </a>
      ) : (
        <span title={commitHash} className="version-tag">
          {mark}
        </span>
      )}
    </div>
  );
}
