export const fetcher = async (
  input: RequestInfo | URL,
  init?: RequestInit,
  includeContentType: boolean = true,
) => {
  let headers: any = {
    ...init?.headers,
    "spider-access-token": "no-token",
  };
  if (includeContentType) {
    headers["content-type"] = "application/json";
  }

  const res = await fetch(input, {
    mode: "cors",
    ...init,
    headers,
  });
  const data = await res.json();
  if (res.status >= 400) {
    console.error(`Got ${res.status} error from backend`);
    throw new Error(data.message);
  }
  return data;
};

export const isSSR =
  typeof window === "undefined" || window.document === undefined;
