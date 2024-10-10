import type { ActionFunctionArgs } from "@remix-run/node";
import type { ClientActionFunctionArgs } from "@remix-run/react";
import { Link, useActionData, useFetcher, useNavigate, useSubmit } from "@remix-run/react";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "~/components/ui/Command";
import { Input } from "~/components/ui/Input";
import { LocationService } from "~/service/DateService";
import * as EB from "~/components/ErrorBoundary";
import { useEffect } from "react";

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
    throw new Response(JSON.stringify({ message: e.message }), { status: 500 });
  }
};

export default function StartDateCreation() {
  const { Form, data, state } = useFetcher<typeof clientAction>({ key: "location-data" });
  useEffect(() => {
    console.log(data);
  }, [data]);
  return (
    <>
      <h1>1. Start by searching for the date location</h1>
      <div className="m-3 h-auto">
        <Command className="border-2 border-light rounded-md h-auto">
          <Form method="post">
            <CommandInput className="border-none" name="searchText" id="searchText" placeholder="Search for a location..." required />
            <Input className="cursor-pointer" type="submit"></Input>
          </Form>
          <CommandList>
            {state === "loading" ? <CommandEmpty>Loading...</CommandEmpty> : null}
            {!data ? <CommandEmpty>No results found.</CommandEmpty> : null}
            {data?.map(searchResult => {
              console.log(`rendering`, searchResult);
              return (
                // <CommandItem>
                <div style={{ border: "white solid 1px" }}>
                  <Link to={`/dates/new?placeId=${searchResult.placeId}`}>{searchResult.text}</Link>
                </div>
                // </CommandItem>
              );
            })}
          </CommandList>
          {/* <Input type="submit" value="Search" /> */}
        </Command>
      </div>
    </>
  );
}

export const ErrorBoundary = EB.ErrorBoundary;
