import { data, Link, useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import type { DateInfo } from "iron-spider-client";
import { Plus } from "lucide-react";
import DateCard from "~/components/date_tracker/DateCard";
import { Button } from "~/components/ui/Button";
import { getDateService } from "~/service/DateService";
import { getHeaders } from "~/utils";
import { checkCookieAuth, checkIdTokenAuth } from "~/utils.server";
import { Route } from "./+types/dates._index";
import { commitSession, getSession } from "~/sessions.server";

/**
 *
 * Move to client loader to ease auth? free cookie auth from client side
 * /
 * @param param0
 * @returns
 */
export const loader = async ({ request }: Route.LoaderArgs) => {
  const { verified, userData } = await checkCookieAuth(request);
  const { verified: newVerified, userData: newUserData, oauthDetails } = await checkIdTokenAuth(request);
  const session = await getSession(request.headers.get("Cookie"));
  // set oauthDetails
  if (oauthDetails) {
    session.set("oauthTokens", oauthDetails);
  }
  const dateService = getDateService();
  if ((newVerified && newUserData) || (verified && userData)) {
    try {
      const userDates = await dateService.listDates({
        pageSize: 10,
        headers: getHeaders(request, { accessToken: session.get("oauthTokens")?.accessToken }),
      });
      if (userDates.items === undefined) throw data({ message: `userDates.items is undefined` }, { status: 500 });

      const items = userDates.items;
      console.log(`Got user ListDates response: ${JSON.stringify(userDates)}`);
      return data({ items: items, loggedIn: true }, { headers: { "Set-Cookie": await commitSession(session) } });
    } catch (e: any) {
      console.error(e);
      throw new Response(JSON.stringify({ message: e.message }), { status: 500 });
    }
  }
  return { loggedIn: false, items: [] };
};

export default function Index({ loaderData }: Route.ComponentProps) {
  const dates = loaderData;

  return (
    <div className="min-h-[100%] bg-gradient-to-b from-inherit to-gray-800 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header Section */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Your Dates</h1>
          <Link to="create">
            <Button variant={"outline"} className="flex items-center gap-2 shadow-lg transition-all duration-300 hover:shadow-xl">
              <Plus className="h-5 w-5" />
              Create New Date
            </Button>
          </Link>
        </div>

        {/* Empty State */}
        {!dates || dates.items.length === 0 ? (
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 py-16 text-center">
            <p className="mb-4 text-lg text-gray-400">There doesn't seem to be anything here</p>
            <p className="text-gray-500">Create your first date to get started!</p>
          </div>
        ) : (
          /* Date Cards Grid */
          <div className="grid animate-fade-in gap-6">
            {dates.items?.map(date => {
              if (!date) return null;
              return (
                <div key={date.id} className="mx-auto w-fit transform transition-all duration-300 hover:-translate-y-1">
                  <DateCard date={date as DateInfo} onClickNav />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
