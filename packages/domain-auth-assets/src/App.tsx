import "./App.css";
import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
} from "react-router-dom";
import { AppRoutes } from "./Routes.tsx";

const router = createBrowserRouter(createRoutesFromElements(AppRoutes));
function App() {
  // todo: add react router browser router
  return <RouterProvider router={router} />;
}

export default App;
