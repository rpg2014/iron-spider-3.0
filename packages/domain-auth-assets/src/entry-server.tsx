import { renderToString } from "react-dom/server";
import { createStaticHandler, createStaticRouter, StaticRouterProvider, createRoutesFromElements } from "react-router";
import { AppRoutes } from "./Routes.tsx";

export async function render(url: string) {
  const routes = createRoutesFromElements(AppRoutes);
  const { query, dataRoutes } = createStaticHandler(routes);

  const context = await query(new Request("https://localhost" + url, { method: "GET" }));

  let router = createStaticRouter(dataRoutes, context as any);
  return renderToString(<StaticRouterProvider router={router} context={context as any} />);
}
