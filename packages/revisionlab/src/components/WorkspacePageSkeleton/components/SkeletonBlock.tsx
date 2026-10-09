import { Skeleton, type SkeletonProps } from "@chakra-ui/react";

export function SkeletonBlock(props: SkeletonProps) {
  return <Skeleton maxW="full" {...props} _motionReduce={{ animation: "none" }} />;
}
