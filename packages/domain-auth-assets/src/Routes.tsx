import { Route } from "react-router-dom";
import Layout from "./pages/Layout.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/signup.tsx";
import { Verify } from "./pages/Verify.tsx";

export const AppRoutes = (
  <Route element={<Layout />} path={"/"}>
    <Route index element={<Login />} />
    <Route path={"/signup"} element={<Signup />} />
    <Route path="/verify" element={<Verify />} />
  </Route>
);
