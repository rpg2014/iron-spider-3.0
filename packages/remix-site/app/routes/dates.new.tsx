import type { LoaderFunctionArgs, ActionFunction } from "react-router";
import { data, Form, redirect, useActionData, useLoaderData, useNavigation } from "react-router";
import type { ConnectedUser, Coordinates, CreateDateCommandInput, Place } from "iron-spider-client";
import { NewDateFormV2 } from "~/components/date_tracker/DateForm";
import type { APIError } from "~/components/ErrorBoundary";
import { Alert } from "~/components/ui/Alert";
import { Button } from "~/components/ui/Button";
import { Card, CardFooter } from "~/components/ui/Card";
import { DateService, getDateService, LocationService } from "~/service/DateService";
import type { Route } from "./+types/dates.new";
import { getSession } from "~/sessions/sessions.server";

export interface DateModel {
  id?: string;
  ownerId?: string;
  location: string;
  coordinates: Coordinates;
  date: string;
  pictureId: string;
  note: string;
}

export const action = async ({ request }: Route.ActionArgs) => {
  console.log("Saving new date");
  try {
    const session = await getSession(request.headers.get("Cookie"));
    const formData = await request.formData();

    // const objectFormData = Object.fromEntries(formData.entries());
    // throw data({ message: `Function not implemented. Got Form data: ${JSON.stringify(objectFormData, null, 2)}` }, { status: 500 });
    const dateService = getDateService();
    // console.log(`Got form data ${JSON.stringify(objectFormData, null, 2)}`);
    const dateInfo: CreateDateCommandInput = {
      location: formData.get("location") as string,
      dateThrower: formData.get("dateThrower") as string,
      coordinates: {
        lat: formData.get("lat") as string,
        long: formData.get("long") as string,
        alt: (formData.get("alt") as string) || "0",
      },
      title: formData.get("title") as string,
      date: new Date(formData.get("date") as string),
      note: formData.get("note") as string,
    } as CreateDateCommandInput;
    console.log(`Date Info: ${JSON.stringify(dateInfo, null, 2)}`);

    // TODO: implement pictures
    // const pictureFile = formData.get("picture") as File;

    // validations
    if (!dateInfo.location || !dateInfo.coordinates || !dateInfo.dateThrower || !dateInfo.title || !dateInfo.note) {
      return { success: false, error: "All fields are required except date" };
    }

    const createdDate = await dateService.createDate({
      date: { ...dateInfo },
    });
    console.log("createdDate: ", createdDate);
    // Upload picture second: TODO
    // let pictureId: string = "testId";
    // if (pictureFile.size > 0) {
    //   // pictureId = await uploadPicture(pictureFile);

    // }
    return redirect(`/dates/${createdDate.id}`, 303);

    // redirect to posts page on success
    // return json({ success: true, date: createdDate });
  } catch (error) {
    console.error("error: ", error);
    // returning instead of throwing b/c i want to handle the error within this component, rather than the error boundary
    return { success: false, error: (error as Error).message, totalError: error };
  }
};

export const loader = async ({ request, context, params }: Route.LoaderArgs) => {
  try {
    const session = await getSession(request.headers.get("Cookie"));
    const url = new URL(request.url);
    const placeId = url.searchParams.get("placeId");
    if (placeId) {
      try {
        const location = await new LocationService().getLocationByPlaceId(placeId);
        const connectedUsersRes = await getDateService().getConnectedUsers({});
        if (location) {
          return data({ location, connectedUsers: connectedUsersRes.users });
        }
      } catch (e) {
        console.log(e);
        // if dev return test data
        if (!import.meta.env.PROD)
          return data({
            location: { label: "test place", coordinates: { lat: "0", long: "0", alt: "0" } },
            connectedUsers: [{ displayName: "testUser", userId: "1" }] as ConnectedUser[],
          });
      }
      console.log(`Location not found for place, redirecting back.`);
    }
    // return null;
    return redirect("/dates/create");
  } catch (e) {
    console.log(e);
    throw data({ message: (e as Error).message } as APIError, { status: 500 });
  }
};

export default function Index({ loaderData, actionData }: Route.ComponentProps) {
  const { location, connectedUsers } = loaderData as { location: Place; connectedUsers: ConnectedUser[] };
  // const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  return (
    <>
      <Form method="post" encType="multipart/form-data">
        <Card>
          <div className="flex flex-col gap-4">
            <NewDateFormV2 place={location as Place} connectedUsers={connectedUsers as ConnectedUser[]} />
          </div>
          <CardFooter className="flex-row-reverse">
            <Button type="submit" disabled={navigation.state !== "idle"}>
              Create
            </Button>
          </CardFooter>
        </Card>
      </Form>
      {(actionData as { error: string })?.error && <Alert variant="light_destructive">{(actionData as { error: string }).error}</Alert>}
    </>
  );
}
