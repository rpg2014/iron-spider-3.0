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
      <div className=" flex items-center justify-center p-4 bg-background text-foreground">
        <div className="bg-card p-8 rounded-xl shadow-lg max-w-md w-full space-y-6 border border-border">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-destructive mb-4">
              {errorTitle}
            </h1>
            <p className="text-xl font-semibold text-muted-foreground mb-2">
              Error code {error.status}: {error.statusText}
            </p>
          </div>
          
          <div className="bg-muted p-4 rounded-md">
            <p className="text-foreground text-base">
              {message}
            </p>
          </div>
          
          <Link 
              to="/" 
              className="inline-block  w-[100%] text-center"
            ><Button className="text-center  px-6 py-3" variant='outline'>
            
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
      <div className="bg-card p-8 rounded-xl shadow-lg max-w-md w-full space-y-6 border border-border">
        <h1 className="text-4xl font-bold text-destructive text-center">
          Unexpected Error
        </h1>
        
        <div className="bg-muted p-4 rounded-md">
          <p className="text-foreground mb-2">
            <span className="font-semibold">Error:</span> {error?.toString()}
          </p>
          <p className="text-muted-foreground">
            {(error as Error).message}
          </p>
        </div>
        
        <div className="text-center">
          <a 
            href="/" 
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Return to Home
          </a>
        </div>
      </div>
    </div>
  );
};
