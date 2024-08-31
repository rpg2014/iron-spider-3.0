import {  GetDateInput, CreateDateInput, CreateDateOutput, DateInfo, GetDateOutput, BadRequestError, UpdateDateInput, UpdateDateOutput, DeleteDateInput, DeleteDateOutput, ListDatesInput, ListDatesOutput } from "iron-spider-ssdk";

import { IDateDB, InMemoryDb } from "../wrappers/DateDBWrapper";
import { Operation } from "@aws-smithy/server-common";

import { randomUUID } from "node:crypto";
import { HandlerContext } from "src/model/common";

const dateDB: IDateDB = new InMemoryDb();

export const CreateDate: Operation<CreateDateInput, CreateDateOutput, HandlerContext> = async (input, context) => { 
  // Implementation using StubDateDB
  const newDate: DateInfo = {
    id: randomUUID(),
    ownerId: context.userId ?? "1",
    location: input.location,
    pictures: input.pictures,
  };
  return {outing: await dateDB.createDate(newDate)};
}
export const GetDate: Operation<GetDateInput, GetDateOutput, HandlerContext> = async (input, context) => {
  // Implementation using StubDateDB
  //verify id
  if(!input.id) throw new BadRequestError({message: "id is required"})
  return {outing: await dateDB.getDate(input.id)};
}

export const UpdateDate: Operation<UpdateDateInput, UpdateDateOutput, HandlerContext> = async (input, context) => {
  // Implementation using StubDateDB
  const updatedDate: DateInfo = {
    id: input.id,
    ownerId: "1",
    location: input.location,
    pictures: input.pictures,
  };
  return {outing: await dateDB.updateDate(updatedDate)};
}

export const DeleteDate: Operation<DeleteDateInput, DeleteDateOutput, HandlerContext> = async (input, context) => {
  // Implementation using StubDateDB
  //verify id
  if(!input.id) throw new BadRequestError({message: "id is required"})
  await dateDB.deleteDate(input.id)
  return {success: true}
}

export const ListDates: Operation<ListDatesInput, ListDatesOutput, HandlerContext> = async (input, context) => {
  // Implementation using StubDateDB
  return {items: await dateDB.listDates("1")}
}
