import { data, Link, useActionData, useFetcher, useNavigate, useSubmit } from "react-router";
import { Input } from "~/components/ui/Input";
import { LocationService } from "~/service/DateService";
import * as EB from "~/components/ErrorBoundary";
import { Button } from "~/components/ui/Button";
import { Route } from "./+types/dates.create";
import { getSession } from "~/sessions/sessions.server";

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const session = await getSession(request.headers.get("Cookie"));
  const searchText = formData.get("searchText");
  if (!searchText) {
    throw data("Search text is required", { status: 400 });
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
    throw data(JSON.stringify({ message: e.message }), { status: 500, statusText: "Internal Server Error" });
  }
};

export default function StartDateCreation({ actionData }: Route.ComponentProps) {
  const { Form, data, state } = useFetcher<typeof action>({ key: "location-data" });
  const isSubmitting = state === "submitting";
  return (
    <>
      <h1>1. Start by searching for the date location</h1>
      <div className="m-3 h-auto">
        <div className="border-light h-auto rounded-md border-2">
          <Form method="post">
            <div className="border-light flex items-center border-b px-4 py-2">
              <Input className="flex-1 border-none focus:outline-none" name="searchText" id="searchText" placeholder="Search for a location..." required />
              <Button
                variant={"secondary"}
                type="submit"
                className={`ml-2 px-4 py-2 ${isSubmitting ? "cursor-not-allowed opacity-50" : ""}`}
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
                <div key={searchResult.placeId} className="border-light border-b py-2">
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
