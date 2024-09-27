import { LocationClient, GetPlaceCommand, SearchPlaceIndexForSuggestionsCommand } from "@aws-sdk/client-location";
import { LocationAccessor } from "./AccessorInterfaces";
import { Coordinates, Place, SearchResult } from "iron-spider-ssdk";

export class AWSLocationAccessor implements LocationAccessor {
  locationClient: LocationClient;
  constructor() {
    this.locationClient = new LocationClient();
  }
  async getPlaceDetails(placeId: string): Promise<Place | null> {
    let command: GetPlaceCommand = new GetPlaceCommand({
      IndexName: process.env.PLACE_INDEX_NAME || "",
      PlaceId: placeId,
      Language: "en",
    });
    const result = await this.locationClient.send(command);

    if (!result.Place) {
      return null;
    }
    const coordsArray = result.Place.Geometry?.Point;
    return {
      label: result.Place?.Label,
      coordinates: {
        long: coordsArray?.at(0)?.toString() || "0",
        lat: coordsArray?.at(1)?.toString() || "0",
      },
    };
  }
  // uses the SearchPlaceIndesxForSuggestions API to return search results
  async searchForPlace(text: string, biasPosition?: Coordinates): Promise<SearchResult[]> {
    let command = new SearchPlaceIndexForSuggestionsCommand({
      Text: text,
      IndexName: process.env.PLACE_INDEX_NAME || "",
      MaxResults: 5,
      Language: "en",
      BiasPosition:
        biasPosition && biasPosition.lat && biasPosition.long ? [Number.parseFloat(biasPosition.long), Number.parseFloat(biasPosition.lat)] : undefined,
    });
    const result = await this.locationClient.send(command);
    if (!result.Results || result.Results.length == 0) return [];

    return result.Results.map(r => {
      return {
        placeId: r.PlaceId,
        text: r.Text,
      };
    });
  }
}
