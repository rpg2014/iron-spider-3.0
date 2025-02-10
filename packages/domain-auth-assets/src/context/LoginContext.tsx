import React, { createContext, useContext, ReactNode, useState } from "react";
import { useLogin, generateAuthOptions, GenerateAuthOptionsResults } from "../hooks/useLogin";

// Define the shape of the context
interface LoginContextType {
  // Auth states
  state: "INIT" | "AUTO_FETCH_OPTS" | "GEN_OPTS" | "AUTHING" | "VERIFY" | "ERROR" | "DONE" | "REDIRECTING";
  // setState: React.Dispatch<React.SetStateAction<"INIT" | "AUTO_FETCH_OPTS" | "GEN_OPTS" | "AUTHING" | "VERIFY" | "ERROR" | "DONE" | "REDIRECTING">>;

  // Status flags
  loading: boolean;
  success: boolean;
  error: string | undefined;
  autocompleteSupported: boolean | undefined;

  // User data
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  user: { displayName?: string; siteAccess?: string[]; userId: string } | undefined;

  // Navigation
  redirectUrl: string | null | undefined;

  // Actions
  generateOptions: () => Promise<void>;
  setGeneratedAuthOptions: (options: GenerateAuthOptionsResults) => void;
}

// Create the context
const LoginContext = createContext<LoginContextType | undefined>(undefined);

// Provider component
export const LoginProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [generateAuthOptions, setGenerateAuthOptions] = useState<undefined | GenerateAuthOptionsResults>();
  const loginHook = useLogin(generateAuthOptions);

  return <LoginContext.Provider value={{ ...loginHook, setGeneratedAuthOptions: setGenerateAuthOptions }}>{children}</LoginContext.Provider>;
};

// Custom hook to use the login context
export const useLoginContext = () => {
  const context = useContext(LoginContext);
  if (context === undefined) {
    throw new Error("useLoginContext must be used within a LoginProvider");
  }
  return context;
};

// Utility export for generating authentication options
export { generateAuthOptions };
