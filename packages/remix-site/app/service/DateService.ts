import type {
  Coordinates,
  DateInfo,
  GetDateCommandOutput,
  GetLocationByPlaceIdCommandOutput,
  ListDatesCommandOutput,
  Place,
  SearchForLocationCommandOutput,
  SearchResult,
  ConnectedUser,
  GetConnectedUsersOutput,
  CreateDateCommandInput,
  UpdateDateCommandInput,
  UpdateDateCommandOutput,
} from "iron-spider-client";
import { API_DOMAIN_VERSION, DATES_PATH, LOCATIONS_PATH } from "~/constants";
import { fetcher } from "~/utils";

export interface IDateClient {
  listDates: (input: { pageSize: number; headers?: Headers }) => Promise<ListDatesCommandOutput>;
  getDate: (input: { id: string; headers?: Headers }) => Promise<DateInfo>;
  createDate: (input: { date: CreateDateCommandInput; headers?: Headers }) => Promise<DateInfo>;
  updateDate: (input: { date: UpdateDateCommandInput; headers?: Headers }) => Promise<DateInfo>;
  delete: (input: { id: string; headers?: Headers }) => Promise<{ success: boolean }>;
  getConnectedUsers(input: { userId: string; headers?: Headers }): Promise<GetConnectedUsersOutput>;
}

let DateServiceSingleton: DateService | undefined = undefined;
export const getDateService = (): DateService => {
  if (!DateServiceSingleton) {
    DateServiceSingleton = new DateService();
  }
  return DateServiceSingleton;
};

export class DateService implements IDateClient {
  constructor() {}

  async listDates(input: { pageSize: number; headers?: Headers }): Promise<ListDatesCommandOutput> {
    const dates: ListDatesCommandOutput = await fetcher(`${DATES_PATH}?pageSize=${input.pageSize}`, {
      mode: "cors",
      headers: input.headers,
      credentials: "include",
    });
    // convert timestamp to Date object, they are iso formatted. This is usually done via the smithy generated client
    dates.items = dates.items?.map((date: DateInfo) => {
      return { ...date, date: date.date ? new Date(date.date) : undefined };
    });
    return dates;
  }

  async getDate(input: { id: string; headers?: Headers }): Promise<DateInfo> {
    const dateInfo: DateInfo = await fetcher(`${DATES_PATH}/${input.id}`, { mode: "cors", headers: input.headers, credentials: "include" });
    // convert dateInfo.date to a date object
    return { ...dateInfo, date: dateInfo.date ? new Date(dateInfo.date) : undefined };
  }

  async createDate(input: { date: CreateDateCommandInput; headers?: Headers }): Promise<DateInfo> {
    // the date timestamp is serialized as a ISO datetime string
    // usually this is done via the generated client
    const date = input.date.date ? input.date.date : new Date();
    const body = { ...input.date, date: date.toISOString() };
    console.log(`Creating date with body: ${JSON.stringify(body)}`);
    const dateInfo: DateInfo = await fetcher<DateInfo>(
      `${DATES_PATH}`,
      {
        body: JSON.stringify(body),
        mode: "cors",
        headers: input.headers,
        credentials: "include",
        method: "POST",
      },
      true,
    );
    // convert dateInfo.date to a date object
    return { ...dateInfo, date: dateInfo.date ? new Date(dateInfo.date) : undefined };
  }
  async updateDate(input: { date: UpdateDateCommandInput; headers?: Headers }): Promise<DateInfo> {
    const date = input.date.date ? input.date.date : new Date();
    const body = { ...input.date, date: date.toISOString() };
    console.log(`Creating date with body: ${JSON.stringify(body)}`);
    const output: DateInfo = await fetcher(
      `${DATES_PATH}/${input.date.dateId}`,
      {
        body: JSON.stringify(body),
        mode: "cors",
        headers: input.headers,
        credentials: "include",
        method: "PUT",
      },
      true,
    );
    if (!output) throw new Error("No Date returned");
    // make output.outing.date a date object
    return { ...output, date: output.date ? new Date(output.date) : undefined };
  }
  async delete(input: { id: string; headers?: Headers }): Promise<{ success: boolean }> {
    if (!input.id || input.id.length === 0) throw new Error("No id provided");
    return await fetcher(`${DATES_PATH}/${input.id}`, { mode: "cors", headers: input.headers, credentials: "include", method: "DELETE" });
  }
  async getConnectedUsers(input: { headers?: Headers }): Promise<GetConnectedUsersOutput> {
    return await fetcher(`${API_DOMAIN_VERSION}/connected-users`, { mode: "cors", headers: input.headers, credentials: "include" });
  }
}

export interface ILocationClient {
  searchForLocation(text: string, headers?: Headers): Promise<SearchResult[]>;
  getLocationByPlaceId(placeId: string, headers?: Headers): Promise<Place | undefined>;
}

export class LocationService implements ILocationClient {
  constructor() {}

  async searchForLocation(text: string, headers?: Headers): Promise<SearchResult[]> {
    const response: SearchForLocationCommandOutput = await fetcher(
      `${LOCATIONS_PATH}`,
      {
        method: "POST",
        // TODO: add bias location
        body: JSON.stringify({ searchText: text }),
        headers: headers,
        credentials: "include",
        mode: "cors", // doesn't matter, this code isn't run in the browser? if it is we do want cors tho prob
      },
      true,
    );
    if (!response.results) throw new Error("No results found");
    return response.results;
  }

  async getLocationByPlaceId(placeId: string, headers?: Headers): Promise<Place | undefined> {
    const response: GetLocationByPlaceIdCommandOutput = await fetcher(`${LOCATIONS_PATH}/${placeId}`, {
      headers: headers,
      credentials: "include",
      mode: "cors",
    });

    return response.place;
  }
}
