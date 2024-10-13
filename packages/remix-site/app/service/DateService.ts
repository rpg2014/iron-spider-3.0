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
} from "iron-spider-client";
import { API_DOMAIN_VERSION, DATES_PATH, LOCATIONS_PATH } from "~/constants";
import { fetcher } from "~/utils";

export interface IDateClient {
  listDates: (input: { pageSize: number; headers?: Headers }) => Promise<ListDatesCommandOutput>;
  getDate: (input: { id: string; headers?: Headers }) => Promise<GetDateCommandOutput>;
  createDate: (input: { date: ICreateDateInput; headers?: Headers }) => Promise<DateInfo>;
  delete: (input: { id: string; headers?: Headers }) => Promise<{ success: boolean }>;
  getConnectedUsers(input: { userId: string; headers?: Headers }): Promise<GetConnectedUsersOutput>;
}

export interface ICreateDateInput {
  location: string;
  pictureId: string;
  note: string;
  coordinates: Coordinates;
  date: string;
}

export class DateService implements IDateClient {
  constructor() {}

  async listDates(input: { pageSize: number; headers?: Headers }): Promise<ListDatesCommandOutput> {
    return await fetcher(`${DATES_PATH}?pageSize=${input.pageSize}`, { mode: "cors", headers: input.headers, credentials: "include" });
  }

  async getDate(input: { id: string; headers?: Headers }): Promise<GetDateCommandOutput> {
    return await fetcher(`${DATES_PATH}/${input.id}`, { mode: "cors", headers: input.headers, credentials: "include" });
  }

  async createDate(input: { date: ICreateDateInput; headers?: Headers }): Promise<DateInfo> {
    return await fetcher(`${DATES_PATH}`, {
      body: JSON.stringify({
        location: input.date.location,
        picture: input.date.pictureId,
        notes: input.date.note,
      } as Partial<DateInfo>),
      mode: "cors",
      headers: input.headers,
      credentials: "include",
      method: "POST",
    });
  }
  async delete(input: { id: string; headers?: Headers }): Promise<{ success: boolean }> {
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
