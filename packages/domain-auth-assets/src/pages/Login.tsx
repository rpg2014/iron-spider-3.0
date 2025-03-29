import { useEffect } from "react";
import { useLoaderData } from "react-router-dom";
import { GenerateAuthOptionsResults } from "../hooks/useLogin.ts";
import { LoginForm } from "../components/LoginForm.tsx";
import { generateAuthOptions, useLoginContext } from "../context/LoginContext.tsx";

export const loader = async () => {
  return await generateAuthOptions();
};

const LoginV2 = () => {
  const data = useLoaderData() as GenerateAuthOptionsResults;
  const { setGeneratedAuthOptions } = useLoginContext();
  useEffect(() => {
    if (data) {
      setGeneratedAuthOptions(data);
    }
  }, [data]);
  return <LoginForm />;
};
export default LoginV2;
