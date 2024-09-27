import {
  GetDateInput,
  CreateDateInput,
  CreateDateOutput,
  DateInfo,
  GetDateOutput,
  BadRequestError,
  UpdateDateInput,
  UpdateDateOutput,
  DeleteDateInput,
  DeleteDateOutput,
  ListDatesInput,
  ListDatesOutput,
  SearchForLocationInput,
  SearchForLocationOutput,
  GetLocationByPlaceIdInput,
  GetLocationByPlaceIdOutput,
} from "iron-spider-ssdk";

import { Operation } from "@aws-smithy/server-common";

import { randomUUID } from "node:crypto";
import { HandlerContext } from "src/model/common";
import { getDateAccessor, getLocationAccessor } from "../accessors/AccessorFactory";

const dateAccessor = getDateAccessor();

export const CreateDate: Operation<CreateDateInput, CreateDateOutput, HandlerContext> = async (input, context) => {
  // Implementation using StubDateDB
  const newDate: DateInfo = {
    id: randomUUID(),
    userId: context.userId ?? "1",
    location: input.location,
    pictureId: input.pictureId,
    coordinates: input.coordinates,
    date: new Date(),
  };
  return { outing: await dateAccessor.createDate(newDate) };
};
export const GetDate: Operation<GetDateInput, GetDateOutput, HandlerContext> = async (input, context) => {
  // Implementation using StubDateDB
  //verify id
  if (!input.dateId) throw new BadRequestError({ message: "id is required" });
  return { outing: await dateAccessor.getDate(input.dateId) };
};

export const UpdateDate: Operation<UpdateDateInput, UpdateDateOutput, HandlerContext> = async (input, context) => {
  // Implementation using StubDateDB
  const updatedDate: DateInfo = {
    id: input.dateId,
    userId: "1",
    location: input.location,
    pictureId: input.picture,
    coordinates: input.coordinates,
    date: undefined,
  };
  return { outing: await dateAccessor.updateDate(updatedDate) };
};

export const DeleteDate: Operation<DeleteDateInput, DeleteDateOutput, HandlerContext> = async (input, context) => {
  // Implementation using StubDateDB
  //verify id
  if (!input.dateId) throw new BadRequestError({ message: "id is required" });
  await dateAccessor.deleteDate(input.dateId);
  return { success: true };
};

export const ListDates: Operation<ListDatesInput, ListDatesOutput, HandlerContext> = async (input, context) => {
  // Implementation using StubDateDB
  return { items: await dateAccessor.listDates(context.userId ?? "1") };
};

// location operations
export const SearchForLocation: Operation<SearchForLocationInput, SearchForLocationOutput, HandlerContext> = async (input, context) => {
  console.log(`Got request for search location: ${input.searchText}`)
  // use the aws sdk to search for location
  if (!input.searchText) throw new BadRequestError({ message: "searchText is required" });
  const results = await getLocationAccessor().searchForPlace(input.searchText, input.biasPosition);
  console.log(`Got aws response for search location: ${JSON.stringify(results)}`)
  return {
    results: results,
  };
};

export const GetLocationByPlaceId: Operation<GetLocationByPlaceIdInput, GetLocationByPlaceIdOutput, HandlerContext> = async (input, context) => {
  console.log(`Got request for get location by place id: ${input.placeId}`)
  // use the aws sdk to get place by id
  if (!input.placeId) throw new BadRequestError({ message: "placeId is required" });
  const result = await getLocationAccessor().getPlaceDetails(input.placeId);
  console.log(`Got aws response for get location by place id: ${JSON.stringify(result)}`)
  return {
    place: result,
  };
};
