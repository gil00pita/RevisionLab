"use client";

import { Image } from "@chakra-ui/react";

// Keep the asset relative to the package in both src/ and dist/ builds.
const logoUrl = new URL("../../../assets/revisionlab-logo.svg", import.meta.url)
  .href;

export function RevisionLabLogo({
  decorative = false,
}: {
  decorative?: boolean;
}) {
  return (
    <Image
      src={logoUrl}
      alt={decorative ? "" : "RevisionLab"}
      htmlWidth={222}
      htmlHeight={227}
      h="8"
      w="auto"
      objectFit="contain"
      flexShrink="0"
      draggable={false}
    />
  );
}
