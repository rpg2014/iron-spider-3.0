import type { ActionFunctionArgs } from "@remix-run/node";
import { Form, Link, redirect, useActionData, useNavigation, useOutletContext } from "@remix-run/react";
import { ConnectedUser, DateInfo, UpdateDateCommandInput } from "iron-spider-client";
import { NewDateFormV2 } from "~/components/date_tracker/DateForm";
import { Alert } from "~/components/ui";
import { Button } from "~/components/ui/Button";
import { Card, CardFooter } from "~/components/ui/Card";
import { getDateService } from "~/service/DateService";
import { getHeaders } from "~/utils";

export const action = async ({ request }: ActionFunctionArgs) => {
  console.log("Updating Date");
  try {
    const formData = await request.formData();

    // const objectFormData = Object.fromEntries(formData.entries());
    // throw json({ message: `Function not implemented. Got Form data: ${JSON.stringify(objectFormData, null, 2)}` }, { status: 500 });
    const dateService = getDateService();
    // console.log(`Got form data ${JSON.stringify(objectFormData, null, 2)}`);
    const dateInfo: UpdateDateCommandInput = {
      // get dateId from the url path. "/dates/{dateId}/edit"
      dateId: formData.get("dateId") as string,
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
    } as UpdateDateCommandInput;
    console.log("Updating date: ", dateInfo);
    const updatedDate = await dateService.updateDate({ date: dateInfo, headers: getHeaders(request) });
    console.log("Updated date: ", updatedDate);
    return redirect(`/dates/${updatedDate.id}`);
  } catch (error) {
    console.error(error);
    return { error: { message: (error as Error).message } };
  }
};

const EditeDateForm = () => {
  const { date, connectedUsers } = useOutletContext<{ date: DateInfo; connectedUsers: ConnectedUser[] }>();
  const navigation = useNavigation();
  const actionData = useActionData<typeof action>();
  return (
    <>
      <Form method="post">
        <input type="hidden" name="dateId" value={date.id} />
        <Card>
          <div className="flex flex-col gap-4">
            <NewDateFormV2 place={null} date={date} connectedUsers={connectedUsers} />
          </div>
          <CardFooter className="flex flex-row-reverse gap-x-10">
            <Button type="submit" disabled={navigation.state !== "idle"}>
              Update
            </Button>
            <Button variant={"outline"} disabled={navigation.state !== "idle"}>
              <Link to={`/dates/${date.id}`}>Cancel</Link>
            </Button>
          </CardFooter>
        </Card>
      </Form>
      {actionData?.error && (
        <Alert className="animate-fade-in" variant={"destructive"}>
          Error: {actionData.error.message}
        </Alert>
      )}
    </>
  );
};

export default EditeDateForm;
