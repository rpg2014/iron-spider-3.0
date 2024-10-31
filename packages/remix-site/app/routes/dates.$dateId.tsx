import { isRouteErrorResponse, useRouteError, useLoaderData, useParams, useNavigate, Form, useActionData, redirect, useNavigation } from "@remix-run/react";
import type { ClientLoaderFunctionArgs } from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/server-runtime";
import { redirectDocument } from "@remix-run/server-runtime";
import DateCard from "~/components/date_tracker/DateCard";
import { NewDateFormV2 } from "~/components/date_tracker/NewDateForm";
import { DateService, getDateService } from "~/service/DateService";
import { getHeaders, getLoginRedirect } from "~/utils";
import { checkCookieAuth } from "~/utils.server";
import * as EB from "~/components/ErrorBoundary";
import type { DateInfo } from "iron-spider-client";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/Button";
import { Alert } from "~/components/ui/Alert";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { hasCookie, userData } = await checkCookieAuth(request);
  if (!hasCookie && import.meta.env.PROD) {
    console.log("redirecting to " + request.url);
    return redirectDocument(getLoginRedirect(request.url));
  }
  if (!params.dateId) {
    return redirectDocument(`/dates`, 303);
  }
  try {
    const date = await new DateService().getDate({
      id: params.dateId,
      headers: {
        ...request.headers,
        //@ts-ignore
        Cookie: request.headers.get("Cookie") || "",
      },
    });
    return { date, userData };
  } catch (e: any) {
    console.error(e);
    throw new Response(JSON.stringify({ message: e.message }), { status: 500 });
  }
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { dateId } = params;
  if (!dateId) {
    return { error: "No date id provided" };
  }

  try {
    const { success } = await getDateService().delete({ id: dateId, headers: getHeaders(request) });
    if (success) {
      return redirect("/dates");
    } else {
      return { error: "Failed to delete date" };
    }
  } catch (error: any) {
    return { error: error.message };
  }
};

export default function DateDetails() {
  const { dateId } = useParams();
  const { date, userData } = useLoaderData<typeof loader>();
  const [editMode, setEditMode] = useState(false);
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  return (
    <div className="container">
      {userData && date && userData.userId === date.userId && (
        <Form method="post" className="flex flex-row-reverse">
          <Button variant={"destructive"} type="submit" disabled={navigation.state !== "idle"}>
            {actionData?.error ? "Error Deleting Date" : "Delete Date"}
          </Button>
        </Form>
      )}
      {date && <DateCard date={date as DateInfo} />}
      {actionData?.error && <Alert variant={"light_destructive"}>Error deleting date: {actionData.error}</Alert>}
    </div>
  );
}

export const ErrorBoundary = EB.ErrorBoundary;
