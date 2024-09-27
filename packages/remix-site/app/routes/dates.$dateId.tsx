import { isRouteErrorResponse, useRouteError, useLoaderData, useParams } from "@remix-run/react";
import type { ClientLoaderFunctionArgs } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/server-runtime";
import { redirectDocument } from "@remix-run/server-runtime";
import DateCard from "~/components/date_tracker/DateCard";
import { NewDateForm } from "~/components/date_tracker/NewDateForm";
import { DateService } from "~/service/DateService";
import { getLoginRedirect } from "~/utils";
import { checkCookieAuth } from "~/utils.server";
import * as EB from "~/components/ErrorBoundary";
import type { DateInfo } from "iron-spider-client";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { hasCookie } = await checkCookieAuth(request);
  //load date from service
  // const {dateId} = useParams();
  if (!params.dateId || (!hasCookie && import.meta.env.PROD)) {
    console.log("redirecting to " + request.url);
    return redirectDocument(getLoginRedirect(request.url));
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
    return { date };
  } catch (e: any) {
    console.error(e);
    throw new Response(JSON.stringify({ message: e.message }), { status: 500 });
  }
};

export default function DateDetails() {
  const { dateId } = useParams();
  const data = useLoaderData<typeof loader>();
  return (
    // <div>
    //   <h2>Date Details</h2>
    //   <p>Date ID: {dateId}</p>
    //   <p>Date: [Placeholder for date]</p>
    //   <p>Description: [Placeholder for description]</p>
    // </div>
    // or edit form
    <>
      <NewDateForm dateId={dateId} />
      {data.date.outing && <DateCard date={data.date.outing as DateInfo} />}
      {/* {data && data.message && <p>{data.message}</p>} */}
    </>
  );
}

export const ErrorBoundary = EB.ErrorBoundary;
