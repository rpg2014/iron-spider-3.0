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
  GetConnectedUsersOutput,
  ConnectedUser,
  InternalServerError,
  NotFoundError,
} from "iron-spider-ssdk";

import { Operation } from "@aws-smithy/server-common";

import { randomUUID } from "node:crypto";
import { HandlerContext } from "src/model/common";
import { getDateAccessor, getLocationAccessor } from "../accessors/AccessorFactory";

const dateAccessor = getDateAccessor();

export const CreateDate: Operation<CreateDateInput, CreateDateOutput, HandlerContext> = async (input, context) => {
  console.log(`Got request for create date: ${JSON.stringify(input)}`);
  const newDate: DateInfo = {
    id: randomUUID(),
    title: input.title,
    note: input.note,
    dateThrower: input.dateThrower,
    userId: context.userId,
    location: input.location,
    coordinates: input.coordinates,
    date: input.date || new Date(),
  };
  console.log(`Creating date: ${JSON.stringify(newDate)}`);
  try {
    const date = await dateAccessor.createDate(newDate);
    return { outing: date };
  } catch (e) {
    console.log(e);
    throw new InternalServerError({ message: "Failed to create date: " + (e as Error).message });
  }
};
export const GetDate: Operation<GetDateInput, GetDateOutput, HandlerContext> = async (input, context) => {
  // Implementation using StubDateDB
  //verify id
  if (!context.userId) throw new BadRequestError({ message: "Auth is required" });
  if (!input.dateId) throw new BadRequestError({ message: "id is required" });
  const connectedUsers = await dateAccessor.getConnectedUsers(context.userId);
  //verify date is owned by one of the connected users
  const date = await dateAccessor.getDate(input.dateId);
  if (!date) throw new NotFoundError({ message: "Date not found" });
  if (date.userId !== context.userId && !connectedUsers.find((user: ConnectedUser) => user.userId === date.userId))
    throw new BadRequestError({ message: "You do not have access to this date" });
  // convert the dateThrower to their username
  // if (date?.dateThrower) {
  //   const dateThrowerStr: string =
  //     date.dateThrower === context.userId
  //       ? context.displayName ?? "You"
  //       : connectedUsers.find((user: ConnectedUser) => user.userId === date.dateThrower)?.displayName ?? "Unknown";

  //   date.dateThrower = dateThrowerStr;
  // }
  return { outing: date };
};

export const UpdateDate: Operation<UpdateDateInput, UpdateDateOutput, HandlerContext> = async (input, context) => {
  console.log(`Got request from user ${context.displayName} for update date: ${JSON.stringify(input)}`);
  if (!input.dateId) throw new BadRequestError({ message: "id is required" });
  const dateToUpdate = await dateAccessor.getDate(input.dateId);
  if (!dateToUpdate) throw new NotFoundError({ message: "Date not found" });
  if (dateToUpdate.userId !== context.userId) throw new BadRequestError({ message: "You can only update your own dates" });

  const updatedDate: DateInfo = {
    id: input.dateId,
    title: input.title,
    userId: context.userId,
    location: input.location,
    coordinates: input.coordinates,
    dateThrower: input.dateThrower,
    date: input.date,
    note: input.note,
  };
  try {
    const outing = await dateAccessor.updateDate(updatedDate);
    console.log(`Updated date: ${JSON.stringify(outing)}`);
    return { outing: outing };
  } catch (e) {
    console.log(e);
    throw new InternalServerError({ message: "Failed to update date: " + (e as Error).message });
  }
};

export const DeleteDate: Operation<DeleteDateInput, DeleteDateOutput, HandlerContext> = async (input, context) => {
  // Implementation using StubDateDB
  //verify id
  if (!input.dateId) throw new BadRequestError({ message: "id is required" });
  const date = await dateAccessor.getDate(input.dateId);
  if (date.userId !== context.userId) throw new BadRequestError({ message: "You can only delete your own dates" });
  await dateAccessor.deleteDate(input.dateId);
  return { success: true };
};

export const ListDates: Operation<ListDatesInput, ListDatesOutput, HandlerContext> = async (input, context) => {
  console.log(`Got request for list dates: ${JSON.stringify(input)}`);
  // Implementation using StubDateDB
  if (!context.userId) throw new BadRequestError({ message: "Auth is required" });
  // get all mutually connected users
  const connectedUsers = await dateAccessor.getConnectedUsers(context.userId);
  console.log(`Getting dates for additional connected users: ${JSON.stringify(connectedUsers.map(user => user.displayName))}`);
  const userIds = connectedUsers.map(user => user.userId);
  // add current authed user
  userIds.push(context.userId);

  // throw if any userIds are undefined
  if (userIds.some(userId => userId === undefined))
    throw new BadRequestError({ message: `Bad data in the connected user db for authed user: ${context.userId}` });
  //@ts-ignore: checked for undefiend user id above
  const dates = (await Promise.all(userIds.map(userId => dateAccessor.listDates(userId)))).flat(1);
  // sort by date, newest first
  dates.sort((a, b) => {
    // undefiend sort them to the back
    if (a.date === undefined) return 1;
    if (b.date === undefined) return -1;
    return b.date.getTime() - a.date.getTime();
  });

  // pagination logic
  const pageSize = input.pageSize || 20;
  const startIndex = input.nextToken ? parseInt(Buffer.from(input.nextToken, 'base64').toString('utf-8')) : 0;
  const endIndex = startIndex + pageSize;
  
  const paginatedItems = dates.slice(startIndex, endIndex);
  const nextToken = endIndex < dates.length 
    ? Buffer.from(endIndex.toString()).toString('base64') 
    : undefined;

  // map connected user id to user name of date thrower
  const datesToReturn = paginatedItems.map(date => {
    const dateThrowerUser = connectedUsers.find(user => user.userId === date.dateThrower);
    return {
      ...date,
      dateThrower: dateThrowerUser?.displayName ?? context.displayName,
    };
  });
  return { items: datesToReturn, nextToken };
};

export const GetConnectedUsers: Operation<{}, GetConnectedUsersOutput, HandlerContext> = async (input, context) => {
  const userId = context.userId;
  if (!userId) throw new BadRequestError({ message: "userId is required" });
  const otherUsers = await dateAccessor.getConnectedUsers(userId);
  //add current user to list
  const users: ConnectedUser[] = [{ userId, displayName: context.displayName }, ...otherUsers];
  console.log(`connected users: ${JSON.stringify(users)}`);
  return { users: users };
};

// location operations
export const SearchForLocation: Operation<SearchForLocationInput, SearchForLocationOutput, HandlerContext> = async (input, context) => {
  console.log(`Got request for search location: ${input.searchText}`);
  // use the aws sdk to search for location
  if (!input.searchText) throw new BadRequestError({ message: "searchText is required" });
  const results = await getLocationAccessor().searchForPlace(input.searchText, input.biasPosition);
  console.log(`Got aws response for search location: ${JSON.stringify(results)}`);
  return {
    results: results,
  };
};

export const GetLocationByPlaceId: Operation<GetLocationByPlaceIdInput, GetLocationByPlaceIdOutput, HandlerContext> = async (input, context) => {
  console.log(`Got request for get location by place id: ${input.placeId}`);
  // use the aws sdk to get place by id
  if (!input.placeId) throw new BadRequestError({ message: "placeId is required" });
  const result = await getLocationAccessor().getPlaceDetails(input.placeId);
  console.log(`Got aws response for get location by place id: ${JSON.stringify(result)}`);
  return {
    place: result,
  };
};
