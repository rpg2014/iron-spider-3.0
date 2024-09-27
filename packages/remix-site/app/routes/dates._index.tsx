import { ClientLoaderFunctionArgs, Link, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/server-runtime";
import type { DateInfo } from "iron-spider-client";
import { Plus } from "lucide-react";
import DateCard from "~/components/date_tracker/DateCard";
import { Button } from "~/components/ui/Button";
import { DateService } from "~/service/DateService";
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
  if (hasCookie && userData) {
    try {
      const response = await new DateService().listDates({
        pageSize: 10,
        headers: {
          ...request.headers,
          //@ts-ignore
          Cookie: request.headers.get("Cookie") || "",
        },
      });
      console.log(`Got ListDates response: ${JSON.stringify(response)}`);
      return { items: response.items, loggedIn: true };
    } catch (e: any) {
      console.error(e);
      throw new Response(JSON.stringify({ message: e.message }), { status: 500 });
    }
  }
  return { loggedIn: false, items: dates };
};

//populate fake data for dates response
const dates: DateInfo[] = [
  {
    id: "1",
    location: "Location 1",
    pictureId: "https://picsum.photos/400",
    note: "Note 1",
    userId: "Owner 1",
    date: new Date(),
    coordinates: undefined,
  },
  {
    id: "2",
    location: "Location 2",
    pictureId: "https://picsum.photos/400",
    note: "Note 2",
    userId: "Owner 2",
    date: new Date(),
    coordinates: undefined,
  },
  {
    id: "3",
    location: "Location 3",
    pictureId: "https://picsum.photos/100",
    note: "Note 3",
    userId: "Owner 3",
    date: new Date(),
    coordinates: undefined,
  },
];
export default function Index() {
  const dates = useLoaderData<typeof loader>();
  console.log(dates);
  return (
    // message and link to create new date
    <div>
      <p>There doesn't seem to be anything here</p>
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
          return <DateCard key={date.id} date={date as DateInfo} />;
        })}
      </div>
    </div>
  );
}
