import { Avatar } from "@chakra-ui/react";
import { personaAvatarImages } from "./assets.js";

export function PersonaAvatar({
  name,
  avatar,
  size = "sm",
}: {
  name: string;
  avatar?: string | null;
  size?: "sm" | "lg";
}) {
  const image = avatar ? personaAvatarImages[avatar] : undefined;
  return (
    <Avatar.Root size={size} flexShrink="0">
      <Avatar.Fallback name={name} />
      {image && (
        <Avatar.Image
          src={image.src}
          srcSet={image.srcSet}
          alt=""
          decoding="async"
        />
      )}
    </Avatar.Root>
  );
}
