import {
  isRouteErrorResponse,
  useRouteError,
  useLoaderData,
  useParams,
  useNavigate,
  Form,
  useActionData,
  redirect,
  useNavigation,
  Outlet,
  Link,
  NavLink,
  useLocation,
  data,
  redirectDocument,
} from "react-router";
import { Suspense } from "react";
import type { ClientLoaderFunctionArgs, Navigation, ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import DateCard from "~/components/date_tracker/DateCard";
import { DateService, getDateService } from "~/service/DateService";
import { getHeaders, getLoginRedirect } from "~/utils";
import { checkCookieAuth, checkIdTokenAuth } from "~/utils.server";
import * as EB from "~/components/ErrorBoundary";
import type { DateInfo } from "iron-spider-client";
import { SetStateAction, useEffect, useMemo, useState } from "react";
import { Button } from "~/components/ui/Button";
import { Alert } from "~/components/ui/Alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "~/components/ui/Dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "~/components/ui/Drawer.client";
import { useMediaQueryV2 } from "~/hooks/useMediaQuery";
import { Route } from "./+types/dates.$dateId";
import { commitSession, getSession } from "~/sessions.server";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  try {
    const { verified, userData, oauthDetails } = await checkIdTokenAuth(request);
    const session = await getSession(request.headers.get("Cookie"));
    // set oauthDetails
    if (oauthDetails) {
      session.set("oauthTokens", oauthDetails);
    }
    if (!verified && import.meta.env.PROD) {
      console.log("redirecting to " + request.url);
      return redirectDocument(getLoginRedirect(request.url));
    }
    if (!params.dateId) {
      return redirect(`/dates`,  {headers: { "Set-Cookie": await commitSession(session) }, status: 303});
    }
    try {
      // if dev, return fake date
      if (import.meta.env.DEV) {
        return { date: { date: new Date(), dateThrower: "Fake User", location: "Fake Location", userId: "fake-user-id" }, userData, connectedUsers: [] };
      }
      const dateService = getDateService();
      const date = await dateService.getDate({
        id: params.dateId,
        headers: getHeaders(request,  { accessToken: session.get("oauthTokens")?.accessToken }),
      });
      const connectedUsers = await dateService.getConnectedUsers({ headers: getHeaders(request,  { accessToken: session.get("oauthTokens")?.accessToken }) });
      return data({ date, userData, connectedUsers: connectedUsers.users }, {headers: { "Set-Cookie": await commitSession(session) }});
    } catch (e: any) {
      console.error(e);
      throw data(JSON.stringify({ message: e.message }), { status: 500, headers: { "Set-Cookie": await commitSession(session) } });
    }
  } catch (e: any) {
    console.error(e);
    throw data(JSON.stringify({ message: e.message }), { status: 500 });
  }
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { dateId } = params;
  const session = await getSession(request.headers.get("Cookie"));
  if (!dateId) {
    return { error: "No date id provided", status: 400 };
  }

  try {
    const { success } = await getDateService().delete({ id: dateId, headers: getHeaders(request,  { accessToken: session.get("oauthTokens")?.accessToken }) });
    if (success) {
      return redirect("/dates");
    } else {
      return { error: "Failed to delete date", status: 400 };
    }
  } catch (error: any) {
    return { error: error.message, status: error.status ?? 500 };
  }
};

export default function DateDetails() {
  const { date, userData, connectedUsers } = useLoaderData<typeof loader>();

  const actionData = useActionData<typeof action>();

  // Create a memoized lookup map for users
  const userMap = useMemo(() => {
    if (!connectedUsers) return {};
    return connectedUsers.reduce((acc: Record<string, string>, user) => {
      if (user.userId === undefined || user.displayName === undefined) return acc;
      acc[user.userId] = user.displayName;
      return acc;
    }, {});
  }, [connectedUsers]);

  // Memoize the converted date object
  const convertedDate = useMemo(() => {
    if (!date || !connectedUsers || !date.dateThrower) return date;
    return {
      ...date,
      dateThrower: userMap[date.dateThrower] || date.dateThrower,
    };
  }, [date, userMap]);

  return (
    <div className="">
      {/* {userData && date && userData.userId === date.userId && ( */}
      <ActionButtons />
      {/* )} */}
      <Outlet context={{ date, connectedUsers }} />
      {/* TODO: Need to move this stuff to the index, the date card + error + action stuff.  */}
      {date && <DateCard date={convertedDate as DateInfo} />}
      {actionData?.error && (
        <Alert variant={"light_destructive"}>
          Error deleting date: {actionData.status} {actionData.error}
        </Alert>
      )}
    </div>
  );
}

export const ErrorBoundary = EB.ErrorBoundary;

const ActionButtons = () => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isLargeScreen = useMediaQueryV2("(min-width: 768px)", { defaultValue: false });
  const navigation = useNavigation();
  const location = useLocation();
  const { dateId } = useParams();

  const DeleteConfirmationContent = () => <DeleteDateconfirmationContentComponent setShowDeleteConfirm={setShowDeleteConfirm} navigation={navigation} />;
  return (
    <div className="flex flex-row-reverse gap-x-10">
      <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} disabled={navigation.state !== "idle"}>
        Delete Date
      </Button>
      <NavLink prefetch="intent" relative="path" to={location.pathname.includes("edit") ? `/dates/${dateId}` : `/dates/${dateId}/edit`}>
        {({ isActive }) => (
          <Button variant={"outline"} disabled={navigation.state !== "idle"}>
            {isActive ? "Close" : "Edit"}
          </Button>
        )}
      </NavLink>

      {isLargeScreen ? (
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Date</DialogTitle>
              <DialogDescription>This will permanently delete this date entry.</DialogDescription>
            </DialogHeader>
            <DeleteConfirmationContent />
          </DialogContent>
        </Dialog>
      ) : (
        <Suspense fallback={null}>
          <Drawer open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Delete Date</DrawerTitle>
                <DrawerDescription>This will permanently delete this date entry.</DrawerDescription>
              </DrawerHeader>
              <div className="px-4">
                <DeleteConfirmationContent />
              </div>
            </DrawerContent>
          </Drawer>
        </Suspense>
      )}
    </div>
  );
};

function DeleteDateconfirmationContentComponent(props: {
  setShowDeleteConfirm: { (value: SetStateAction<boolean>): void; (arg0: boolean): void };
  navigation: Navigation;
}) {
  return (
    <>
      <div className="space-y-4 py-4 pb-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Are you sure you want to delete this date? This action cannot be undone.</p>
        </div>
      </div>
      <div className="flex flex-col-reverse gap-y-10 sm:flex-row sm:justify-end sm:gap-y-0 sm:space-x-2">
        <Button className="" variant="outline" onClick={() => props.setShowDeleteConfirm(false)} disabled={props.navigation.state !== "idle"}>
          Cancel
        </Button>
        <Form method="delete">
          <Button className="w-[100%]" variant="destructive" type="submit" disabled={props.navigation.state !== "idle"}>
            Delete
          </Button>
        </Form>
      </div>
    </>
  );
}
