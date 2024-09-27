import type { ActionFunction, ActionFunctionArgs } from "@remix-run/node";
import { Form, json } from "@remix-run/react";
import type { Coordinates, CreateDateCommandInput } from "iron-spider-client";
import { DateInfo } from "iron-spider-client";
import { NewDateForm, NewDateFormV2 } from "~/components/date_tracker/NewDateForm";
import { Button } from "~/components/ui/Button";
import { Card, CardFooter } from "~/components/ui/Card";
import { Input } from "~/components/ui/Input";
import { Label } from "~/components/ui/Label";
import { Textarea } from "~/components/ui/TextArea";
import type { ICreateDateInput } from "~/service/DateService";
import { DateService } from "~/service/DateService";

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
  const dateService = new DateService(); // Assume this is properly initialized

  const dateInfo: CreateDateCommandInput = {
    location: formData.get("location") as string,
    coordinates: {
      lat: formData.get("lat") as string,
      long: formData.get("long") as string,
      alt: formData.get("alt") as string,
    },
    date: new Date(formData.get("date") as string),
    note: formData.get("note") as string,
    pictureId: "TBD",
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
export default function Index() {
  return (
    <>
      <Form method="post" encType="multipart/form-data">
        <Card>
          <div className="flex flex-col gap-4">
            <NewDateFormV2 />
          </div>
          <CardFooter>
            <Button type="submit">Create</Button>
          </CardFooter>
        </Card>
      </Form>
    </>
  );
}
