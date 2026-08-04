import { createHash } from "node:crypto";
import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/projects";
import { buildSocialImageMetadata, createSocialImage, projectSocialAccents } from "@/lib/social-image";

type ProjectImageParams = Awaited<PageProps<"/project/[slug]">["params"]>;
type ProjectImageProps = PageProps<"/project/[slug]"> & { id: Promise<string | number> };

function getProject({ slug }: ProjectImageParams) {
  return getProjectBySlug(slug) ?? notFound();
}

export function generateImageMetadata({ params }: { params?: Partial<ProjectImageParams> }) {
  if (!params?.slug) {
    return [];
  }

  const project = getProject({ slug: params.slug });
  const id = createHash("sha256")
    .update(JSON.stringify([project.name, project.role, project.detail.headline, project.tags, project.accent]))
    .digest("hex")
    .slice(0, 12);

  return [
    buildSocialImageMetadata({
      id,
      alt: `Stylized social preview for the ${project.name} project by Oleh Vanin`,
    }),
  ];
}

export default async function OpenGraphImage({ params }: ProjectImageProps) {
  const project = getProject(await params);

  return createSocialImage({
    eyebrow: project.role,
    title: project.name,
    description: project.detail.headline,
    path: `exsesx.dev/project/${project.slug}`,
    context: "Project",
    accent: projectSocialAccents[project.accent],
    tags: project.tags,
  });
}
