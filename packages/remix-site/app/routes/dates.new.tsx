import type { LoaderFunctionArgs } from "@remix-run/node";
import type { ActionFunction, ActionFunctionArgs } from "@remix-run/node";
import { Form, json, redirect, useLoaderData } from "@remix-run/react";
import type { Coordinates, CreateDateCommandInput, Place } from "iron-spider-client";
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

// export const action = async ({ request }: ActionFunctionArgs) => {
//   //create Date
//   const formData = await request.formData();

//   const location = formData.get("location")?.toString();
//   const coordinates = formData.get("coordinates")?.toString();
//   const date = formData.get("date")?.toString();
//   const pictureId = formData.get("pictureId")?.toString();
//   const note = formData.get("note")?.toString();

//   // validate data, all fields to be non null
//   if (!location || !coordinates || !date || !pictureId || !note) {
//     return { errors: "All fields are required" };
//   }

//   const newDate = await new DateService().createDate({
//     date: {
//       location,
//       coordinates: JSON.parse(coordinates),
//       date,
//       pictureId,
//       note,
//     },
//     headers: request.headers,
//   });
//   return { date: newDate };
// };
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  throw new Response(JSON.stringify({ message: `Function not implemented. Got Form data: ${JSON.stringify(formData)}` }), { status: 500 });
  const dateService = new DateService(); // Assume this is properly initialized

  const dateInfo: CreateDateCommandInput = {
    location: formData.get("location") as string,
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
  if (!dateInfo.location || !dateInfo.coordinates) {
    return json({ success: false, error: "All fields are required except date" });
  }

  try {
    // Upload picture first
    let pictureId: string = "testId";
    if (pictureFile.size > 0) {
      // pictureId = await uploadPicture(pictureFile);
    }

    // Create date with picture ID
    const createdDate = await dateService.createDate({
      date: { ...dateInfo, pictureId } as unknown as ICreateDateInput,
      headers: {
        ...request.headers,
        //@ts-ignore
        Cookie: request.headers.get("Cookie") || "",
      },
    });

    return json({ success: true, date: createdDate });
  } catch (error) {
    return json({ success: false, error: (error as Error).message });
  }
};

export const loader = async ({ request, context, params }: LoaderFunctionArgs) => {
  try {
    const url = new URL(request.url);
    const placeId = url.searchParams.get("placeId");
    const headers = {...request.headers, "cookie": request.headers.get("cookie")}
    if (placeId) {
      const location = await new LocationService().getLocationByPlaceId(placeId, headers);
      if (location) {
        return { location };
      }
    }
    return redirect("/dates/create");
  } catch (e) {
    console.log(e);
    throw new Response(JSON.stringify({ message: (e as Error).message }), { status: 500 });
  }
};

export default function Index() {
  const { location } = useLoaderData<typeof loader>();
  return (
    <>
      <Form method="post" encType="multipart/form-data">
        <Card>
          <div className="flex flex-col gap-4">
            <NewDateFormV2 location={location as Place} />
          </div>
          <CardFooter>
            <Button type="submit">Create</Button>
          </CardFooter>
        </Card>
      </Form>
    </>
  );
}
