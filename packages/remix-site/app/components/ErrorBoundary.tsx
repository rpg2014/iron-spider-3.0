import { isRouteErrorResponse, Link, useRouteError } from "react-router";
import * as React from "react";
import { Button } from "./ui";

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
    let errorTitle = "Error";
    switch (errorCast.status) {
      case 401:
        errorTitle = "Unauthorized";
        message = "Oops! Looks like you tried to visit a page that you do not have access to.";
        break;
      case 404:
        errorTitle = "Page Not Found";
        message = "Oops! Looks like you tried to visit a page that does not exist.";
        break;
      case 500:
        errorTitle = "Internal Server Error";
        message = `Something went wrong, status: ${errorCast.status}, message: ${errorCast.data.message}`;
        break;
      default:
        message = `Received Error: ${errorCast.data.message}`;
    }

    return (
      <div className=" flex items-center justify-center bg-background p-4 text-foreground">
        <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-8 shadow-lg">
          <div className="text-center">
            <h1 className="mb-4 text-3xl font-bold text-destructive">{errorTitle}</h1>
            <p className="mb-2 text-xl font-semibold text-muted-foreground">
              Error code {error.status}: {error.statusText}
            </p>
          </div>

          <div className="rounded-md bg-muted p-4">
            <p className="text-base text-foreground">{message}</p>
          </div>

          <Link to="/" className="inline-block  w-[100%] text-center">
            <Button className="px-6  py-3 text-center" variant="outline">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  //JS error branch
  console.error(error);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-8 shadow-lg">
        <h1 className="text-center text-4xl font-bold text-destructive">Unexpected Error</h1>

        <div className="rounded-md bg-muted p-4">
          <p className="mb-2 text-foreground">
            <span className="font-semibold">Error:</span> {error?.toString()}
          </p>
          <p className="text-muted-foreground">{(error as Error).message}</p>
        </div>

        <div className="text-center">
          <a href="/" className="inline-block rounded-md bg-primary px-6 py-3 text-primary-foreground transition-colors hover:bg-primary/90">
            Return to Home
          </a>
        </div>
      </div>
    </div>
  );
};
