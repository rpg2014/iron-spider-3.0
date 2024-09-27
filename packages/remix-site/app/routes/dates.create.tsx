import type { ActionFunctionArgs } from "@remix-run/node";
import type { ClientActionFunctionArgs } from "@remix-run/react";
import { Form, Link, useActionData, useFetcher, useNavigate, useSubmit } from "@remix-run/react";
import { Button } from "~/components/ui/Button";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "~/components/ui/Command";
import { Input } from "~/components/ui/Input";
import { Label } from "~/components/ui/Label";
import { LocationService } from "~/service/DateService";
import * as EB from "~/components/ErrorBoundary";
import { useEffect } from "react";

export const clientAction = async ({ request }: ClientActionFunctionArgs) => {
  const formData = await request.formData();
  const searchText = formData.get("searchText");
  if (!searchText) {
    throw new Response("Search text is required", { status: 400 });
  }
  try {
    const response = await new LocationService().searchForLocation(searchText.toString()); //, {
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
  const actionData = useActionData<typeof clientAction>();
  useEffect(() => {
    console.log(`actionData: ${JSON.stringify(actionData)}`);
  });
  const thing = useFetcher({ key: "location-data" });
  //   const submit = useSubmit();
  // if(ac)
  return (
    <>
      <h1>1. Start by searching for the date location</h1>
      <div className="m-3">
        <Command className="border-2 border-light rounded-md">
          <thing.Form method="post">
            <CommandInput className="border-none" name="searchText" id="searchText" placeholder="Search for a location..." required />
            <Input type="submit"></Input>
          </thing.Form>
          <CommandList>
            {!actionData ? <CommandEmpty>No results found.</CommandEmpty> : null}
            {actionData?.map(searchResult => {
              return (
                <CommandItem>
                  <Link to={`/dates/new?placeId=${searchResult.placeId}`}>{searchResult.text}</Link>
                </CommandItem>
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
