import { Route } from "react-router-dom";
import Layout from "./components/Layout.tsx";
import Login from "./components/Login.tsx";
import Signup from "./components/signup.tsx";

export const AppRoutes = (
  <Route element={<Layout />} path={"/"}>
    <Route index element={<Login />} />
    <Route path={"/signup"} element={<Signup />} />
  </Route>
);
