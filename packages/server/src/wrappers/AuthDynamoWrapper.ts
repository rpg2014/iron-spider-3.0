import { DynamoDBClient, GetItemCommand, PutItemCommand, AttributeValue } from "@aws-sdk/client-dynamodb";

interface AuthorizationDetails {
  numberOfStarts: number;
  allowedToStartServer: boolean;
  username: string;
}

const USER_NAME = "username";
const HAS_ACCESS_VALUE_KEY = "hasAccess";
const NUM_OF_STARTS_VALUE_KEY = "numberOfStarts";
const TABLE_NAME = "MinecraftAuthZTable";

const client = new DynamoDBClient({ region: "us-east-1" });

export async function isAuthorized(userName: string): Promise<AuthorizationDetails> {
  const itemMap = await getItem(userName);
  if (!itemMap) {
    const authDetails = await createEntryForUser(userName);
    return authDetails;
  }
  console.log(`User ${userName}, Has access: ${itemMap[HAS_ACCESS_VALUE_KEY].BOOL}`);
  return createAuthDetails(itemMap);
}

async function getItem(username: string): Promise<Record<string, AttributeValue> | undefined> {
  const map: Record<string, AttributeValue> = {};
  map[USER_NAME] = { S: username };
  const request = new GetItemCommand({ Key: map, TableName: TABLE_NAME });
  try {
    const response = await client.send(request);
    return response.Item;
  } catch (err) {
    console.error(err);
    throw new Error(`Unable to get item: ${err}`);
  }
}

async function createEntryForUser(username: string): Promise<AuthorizationDetails> {
  console.log(`Creating dynamo entry for user: ${username}`);
  const item: Record<string, AttributeValue> = {};
  item[USER_NAME] = { S: username };
  item[HAS_ACCESS_VALUE_KEY] = { BOOL: false };
  item[NUM_OF_STARTS_VALUE_KEY] = { N: "0" };
  const request = new PutItemCommand({ Item: item, TableName: TABLE_NAME });
  try {
    await client.send(request);
    return { username, allowedToStartServer: false, numberOfStarts: 0 };
  } catch (err) {
    console.error(err);
    throw new Error("Unable to create entry");
  }
}

function createAuthDetails(itemMap: Record<string, AttributeValue>): AuthorizationDetails {
  return {
    username: itemMap[USER_NAME].S!,
    allowedToStartServer: itemMap[HAS_ACCESS_VALUE_KEY].BOOL!,
    numberOfStarts: parseInt(itemMap[NUM_OF_STARTS_VALUE_KEY].N!),
  };
}

export async function startedServer(authDetails: AuthorizationDetails): Promise<void> {
  authDetails.numberOfStarts += 1;
  console.log(`Updating dynamo entry for user: ${authDetails.username}, number of server starts = ${authDetails.numberOfStarts}`);

  const item: Record<string, AttributeValue> = {};
  item[USER_NAME] = { S: authDetails.username };
  item[HAS_ACCESS_VALUE_KEY] = { BOOL: authDetails.allowedToStartServer };
  item[NUM_OF_STARTS_VALUE_KEY] = { N: authDetails.numberOfStarts.toString() };

  const request = new PutItemCommand({ Item: item, TableName: TABLE_NAME });
  try {
    await client.send(request);
  } catch (err) {
    console.error(err);
    throw new Error("Unable to update entry");
  }
}
