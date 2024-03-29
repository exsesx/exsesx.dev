import classNames from "classnames";
import { ReactNode } from "react";

interface Props {
  renderMedia: () => ReactNode;
  renderMediaBadge?: () => ReactNode;
  badgePosition?: "left" | "center" | "right";
  link?: string;
  title: string;
  content: string;
  tags: string[];
}

export default function Card({
  title,
  content,
  tags,
  renderMedia,
  renderMediaBadge,
  badgePosition = "center",
  link,
}: Props) {
  const badgeContainerClasses = classNames("absolute flex px-4 w-full bottom-4", {
    "justify-start": badgePosition === "left",
    "justify-center": badgePosition === "center",
    "justify-end": badgePosition === "right",
  });

  return (
    <div className="max-w-sm lg:max-w-md min-w-full rounded overflow-hidden dark:bg-gray-700 bg-gray-50 shadow-xl mx-auto md:my-4 sm:my-2 transition duration-500 hover:lg:scale-105">
      <div className="relative">
        <a href={link}>
          {typeof renderMedia === "function" && renderMedia()}
          {typeof renderMediaBadge === "function" && <div className={badgeContainerClasses}>{renderMediaBadge()}</div>}
        </a>
      </div>
      <div className="px-6 py-4">
        <div className="font-bold mb-2 text-gray-900 dark:text-gray-100 prose-lg">{title}</div>
        <p className="text-gray-900 dark:text-gray-100 prose">{content}</p>
      </div>
      <div className="px-6 py-4">
        {tags.map(tag => (
          <span
            key={tag}
            className="inline-block bg-gray-100 rounded-full px-3 py-1 my-1 text-sm font-semibold text-gray-700 mr-2"
          >
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
}
