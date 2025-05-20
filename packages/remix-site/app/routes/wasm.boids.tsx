import { Outlet, redirect } from "react-router";
import { BoidLayout } from "~/components/Boids/BoidLayout";

export default function BoidsRoute() {
  return (
    <BoidLayout>
      <Outlet />
    </BoidLayout>
  );
}

// // Redirect to canvas renderer by default
// export function loader() {
//   return redirect("/wasm/boids/canvas");
// }
