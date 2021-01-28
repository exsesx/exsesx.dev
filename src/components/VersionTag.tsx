import React from "react";

export default function VersionTag() {
  const version = process.env.GIT_REVISION;

  if (!version) return <React.Fragment />;

  return (
    <div className="fixed bottom-4 right-4 text-gray-900 dark:text-gray-50 opacity-70 font-mono text-sm">{version}</div>
  );
}
