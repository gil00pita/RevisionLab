import { Skeleton, type SkeletonProps } from "@chakra-ui/react";

export function LoadingBar(props: SkeletonProps) {
  return <Skeleton {...props} _motionReduce={{ animation: "none" }} />;
}
