export const fetcher = async (input: RequestInfo | URL, init?: RequestInit) => {
  const res = await fetch(input, {
    ...init,
    mode: "cors",
    headers: {
      ...init?.headers,
      "spider-access-token": "no-token",
      "content-type": "application/json",
    },
  });
  const data = await res.json();
  if (res.status >= 400) {
    console.error(`Got ${res.status} error from backend`);
    throw new Error(data.message);
  }
  return data;
};


export const isSSR = (typeof window === "undefined" || window.document === undefined);