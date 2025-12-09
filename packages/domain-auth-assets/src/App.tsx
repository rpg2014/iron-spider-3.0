import "./App.css";
import { createBrowserRouter, createRoutesFromElements } from "react-router";
import { RouterProvider } from "react-router/dom";
import { AppRoutes } from "./Routes.tsx";

const router = createBrowserRouter(createRoutesFromElements(AppRoutes), {
  future: {
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
});

function App() {
  // todo: add react router browser router
  return (
    <RouterProvider
      router={router}
    />
  );
}

export default App;
