import { Outlet } from "@remix-run/react";

export default function DatesLayout() {
  return (
    <div>
      <h1>Dates</h1>
      <Outlet />
    </div>
  );
}
