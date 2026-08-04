export const SOCIAL_IMAGE_VERSION = "1";

export function versionSocialImageId(id: string) {
  return `${id}-v${SOCIAL_IMAGE_VERSION}`;
}

export function versionSocialImageUrl(url: string) {
  const separator = url.includes("?") ? "&" : "?";

  return `${url}${separator}v=${SOCIAL_IMAGE_VERSION}`;
}
