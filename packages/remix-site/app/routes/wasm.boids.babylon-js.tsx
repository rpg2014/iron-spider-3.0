import { Suspense, lazy } from "react";
import BabylonjsRenderer from "~/components/Boids/renderers/BabylonjsRenderer.client";
import { Skeleton } from "~/components/ui";
import { isServer } from "~/utils/utils";

export default function BabylonJsRendererRoute() {
  if (isServer) {
    return <Skeleton className="h-full w-full" />;
  }
  return (
    <Suspense fallback={<Skeleton className="h-full w-full" />}>
      <BabylonjsRenderer />
    </Suspense>
  );
}
