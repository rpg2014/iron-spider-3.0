import { ClientLoaderFunctionArgs, json, Link, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/server-runtime";
import type { DateInfo } from "iron-spider-client";
import { Plus } from "lucide-react";
import DateCard from "~/components/date_tracker/DateCard";
import { Button } from "~/components/ui/Button";
import { getDateService } from "~/service/DateService";
import { getHeaders } from "~/utils";
import { checkCookieAuth } from "~/utils.server";

/**
 *
 * Move to client loader to ease auth? free cookie auth from client side
 * /
 * @param param0
 * @returns
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { hasCookie, userData } = await checkCookieAuth(request);
  const dateService = getDateService();
  if (hasCookie && userData) {
    try {
      const userDates = await dateService.listDates({
        pageSize: 10,
        headers: getHeaders(request),
      });
      if (userDates.items === undefined) throw json({ message: `userDates.items is undefined` }, { status: 500 });

      const items = userDates.items
      // moving this conversion to the  UI component
      // .map((date: DateInfo) => {
      //   // need to multiply the date epoch number by 1000 to fix the precision from the backend
      //   try {
      //     if (date.date) date.date = new Date(date.date.getTime() * 1000);
      //   } catch (e) {
      //     console.error(`Error parsing date: ${date.date}`, e);
      //   }
      //   return date;
      // });
      console.log(`Got user ListDates response: ${JSON.stringify(userDates)}`);
      return { items: items, loggedIn: true };
    } catch (e: any) {
      console.error(e);
      throw new Response(JSON.stringify({ message: e.message }), { status: 500 });
    }
  }
  return { loggedIn: false, items: [] };
};

export default function Index() {
  const dates = useLoaderData<typeof loader>();
  return (
    // message and link to create new date
    <div>
      {!dates || (dates.items.length == 0 && <p>There doesn't seem to be anything here</p>)}
      <Link to="create">
        <Button variant="outline">
          <Plus />
          Create New Date
        </Button>
      </Link>
      <br></br>
      <div className="container max-w-screen-md items-center">
        {dates.items?.map(date => {
          if (!date) return null;
          return <DateCard key={date.id} date={date as DateInfo} onClickNav />;
        })}
      </div>
    </div>
  );
}
