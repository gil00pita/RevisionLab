import { Skeleton, type SkeletonProps } from "@chakra-ui/react";

export function LoadingBar(props: SkeletonProps) {
  return <Skeleton maxW="full" {...props} _motionReduce={{ animation: "none" }} />;
}
