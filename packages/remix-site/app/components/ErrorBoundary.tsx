import { isRouteErrorResponse, useRouteError } from "react-router";
import * as React from "react";

type ErrorMessage = {
  message: string;
};

export type APIError = ErrorMessage;
type ErrorResponseGeneric<T> = {
  status: number;
  statusText: string;
  data: T;
};
export const ErrorBoundary = () => {
  const error = useRouteError();
  //Http error branch
  if (isRouteErrorResponse(error)) {
    console.error(`Got Route Error Response: `, error);
    // if error.data is a string, JSON parse it
    if (typeof error.data === "string") {
      error.data = JSON.parse(error.data) as ErrorMessage;
    }
    const errorCast = error as ErrorResponseGeneric<ErrorMessage>;

    let message;
    switch (errorCast.status) {
      case 401:
        message = <p>Oops! Looks like you tried to visit a page that you do not have access to.</p>;
        break;
      case 404:
        message = <p>Oops! Looks like you tried to visit a page that does not exist.</p>;
        break;
      case 500:
        message = (
          <p>
            Something went wrong, status: {errorCast.status}, message: {errorCast.data.message}
          </p>
        );
        break;
      default:
        message = <p>Recieved Error: {errorCast.data.message}</p>;
    }
    return (
      <>
        <h1>
          Recived Error code {error.status}: {error.statusText}
        </h1>
        <p>{message}</p>
      </>
    );
  }
  //JS error branch
  console.error(error);
  return (
    <div>
      <h1>There was an error: {error?.toString()}</h1>
      <p>{(error as Error).message}</p>
      <hr />
    </div>
  );
};
