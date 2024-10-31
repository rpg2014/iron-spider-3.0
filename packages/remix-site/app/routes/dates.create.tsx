import type { ActionFunctionArgs } from "@remix-run/node";
import type { ClientActionFunctionArgs } from "@remix-run/react";
import { Link, useActionData, useFetcher, useNavigate, useSubmit } from "@remix-run/react";
import { Input } from "~/components/ui/Input";
import { LocationService } from "~/service/DateService";
import * as EB from "~/components/ErrorBoundary";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/Button";

export const clientAction = async ({ request, context }: ClientActionFunctionArgs) => {
  const formData = await request.formData();
  const searchText = formData.get("searchText");
  if (!searchText) {
    throw new Response("Search text is required", { status: 400 });
  }
  try {
    const response = await new LocationService().searchForLocation(searchText.toString(), request.headers); //, {
    // ...request.headers,
    // //@ts-ignore
    // Cookie: request.headers.get("Cookie") || "",});
    //todo: it's good practice to implement a redirect on a sucessfully call.  This means I should probably
    // not be using a full form here, and instead use a fetcher until i jump to the next form to finish the date.
    // Actions should only return when there's validations errors, otherwise redirect to the successfully created page,
    // in this case, we are navigating on click, therefore should use fetcher
    return response;
  } catch (e: any) {
    console.log(e);
    throw new Response(JSON.stringify({ message: e.message }), { status: 500, statusText: "Internal Server Error" });
  }
};

export default function StartDateCreation() {
  const { Form, data, state } = useFetcher<typeof clientAction>({ key: "location-data" });
  const isSubmitting = state === "submitting";
  return (
    <>
      <h1>1. Start by searching for the date location</h1>
      <div className="m-3 h-auto">
        <div className="border-2 border-light rounded-md h-auto">
          <Form method="post">
            <div className="flex items-center border-b border-light px-4 py-2">
              <Input className="border-none flex-1 focus:outline-none" name="searchText" id="searchText" placeholder="Search for a location..." required />
              <Button
                variant={"secondary"}
                type="submit"
                className={`py-2 px-4 ml-2 ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={isSubmitting}
              >
                Search
              </Button>
            </div>
          </Form>
          <div className="px-4 py-2">
            {state === "loading" ? (
              <div>Loading...</div>
            ) : !data ? (
              <div>No results found.</div>
            ) : (
              data.map(searchResult => (
                <div key={searchResult.placeId} className="border-b border-light py-2">
                  <Link to={`/dates/new?placeId=${searchResult.placeId}`}>{searchResult.text}</Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export const ErrorBoundary = EB.ErrorBoundary;
