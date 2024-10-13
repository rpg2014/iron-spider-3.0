import type { LoaderFunctionArgs } from "@remix-run/node";
import type { ActionFunction, ActionFunctionArgs } from "@remix-run/node";
import { Form, json, redirect, useLoaderData } from "@remix-run/react";
import type { ConnectedUser, Coordinates, CreateDateCommandInput, Place } from "iron-spider-client";
import { DateInfo } from "iron-spider-client";
import { NewDateForm, NewDateFormV2 } from "~/components/date_tracker/NewDateForm";
import { Button } from "~/components/ui/Button";
import { Card, CardFooter } from "~/components/ui/Card";
import { Input } from "~/components/ui/Input";
import { Label } from "~/components/ui/Label";
import { Textarea } from "~/components/ui/TextArea";
import type { ICreateDateInput } from "~/service/DateService";
import { DateService, LocationService } from "~/service/DateService";

export interface DateModel {
  id?: String;
  ownerId?: String;
  location: String;
  coordinates: Coordinates;
  date: String;
  pictureId: String;
  note: String;
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const objectFormData = Object.fromEntries(formData.entries());
  throw json({ message: `Function not implemented. Got Form data: ${JSON.stringify(objectFormData, null, 2)}` }, { status: 500 });
  const dateService = new DateService(); // Assume this is properly initialized

  const dateInfo: CreateDateCommandInput = {
    location: formData.get("location") as string,
    dateThrower: formData.get("dateThrower") as string,
    coordinates: {
      lat: formData.get("lat") as string,
      long: formData.get("long") as string,
      alt: formData.get("alt") as string,
    },
    title: formData.get("title") as string,
    date: new Date(formData.get("date") as string),
    note: formData.get("note") as string,
  };

  const pictureFile = formData.get("picture") as File;

  // validations
  if (!dateInfo.location || !dateInfo.coordinates || !dateInfo.dateThrower || !dateInfo.title || !dateInfo.note) {
    return json({ success: false, error: "All fields are required except date" });
  }

  try {
    // Create date with picture ID
    const createdDate = await dateService.createDate({
      date: { ...dateInfo } as unknown as ICreateDateInput,
      headers: {
        ...request.headers,
        //@ts-ignore
        Cookie: request.headers.get("Cookie") || "",
      },
    });
    // Upload picture second
    let pictureId: string = "testId";
    if (pictureFile.size > 0) {
      // pictureId = await uploadPicture(pictureFile);

    }

    
    // redirect to posts page on success
    // return json({ success: true, date: createdDate });
  } catch (error) {
    return json({ success: false, error: (error as Error).message });
  }
};

export const loader = async ({ request, context, params }: LoaderFunctionArgs) => {
  try {
    const url = new URL(request.url);
    const placeId = url.searchParams.get("placeId");
    const headers = { ...request.headers, cookie: request.headers.get("cookie") };
    if (placeId) {
      const location = await new LocationService().getLocationByPlaceId(placeId, headers);
      const connectedUsersRes = await new DateService().getConnectedUsers({ headers });
      if (location) {
        return { location, connectedUsers: connectedUsersRes.users };
      }
    }
    // return null;
    return redirect("/dates/create");
  } catch (e) {
    console.log(e);
    throw json({ message: (e as Error).message }, { status: 500 });
  }
};

export default function Index() {
  const { location, connectedUsers } = useLoaderData<typeof loader>();
  return (
    <>
      <Form method="post" encType="multipart/form-data">
        <Card>
          <div className="flex flex-col gap-4">
            <NewDateFormV2 location={location as Place} connectedUsers={connectedUsers as ConnectedUser[]} />
          </div>
          <CardFooter>
            <Button type="submit">Create</Button>
          </CardFooter>
        </Card>
      </Form>
    </>
  );
}
