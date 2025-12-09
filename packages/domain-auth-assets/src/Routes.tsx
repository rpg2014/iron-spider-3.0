import { Route } from "react-router";
import Layout from "./pages/Layout.tsx";
import Login, { loader as LoginLoader } from "./pages/Login.tsx";
import Signup from "./pages/signup.tsx";
import { Verify } from "./pages/Verify.tsx";
import AccountInfo from "./pages/AccountInfo.tsx";
import Authorize from "./pages/Authorize.tsx";

export const AppRoutes = (
  <Route element={<Layout />} path={"/"}>
    <Route index loader={LoginLoader} element={<Login />} />
    <Route path={"/signup"} element={<Signup />} />
    <Route path="/verify" element={<Verify />} />
    <Route path="/account" element={<AccountInfo />} />
    <Route path="/authorize" element={<Authorize />} />
  </Route>
);
