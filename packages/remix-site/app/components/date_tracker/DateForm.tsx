import { Label } from "@radix-ui/react-label";
import { Button } from "../ui/Button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/Card";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/TextArea";
import { ConnectedUser, DateInfo, Place } from "iron-spider-client";
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from "../ui/Select";

function toDateInputValue(dateObject: Date) {
  if (dateObject instanceof Date === false) {
    console.log("dateObject is not a date", dateObject);
    return toDateInputValue(new Date(dateObject));
  }
  const local = new Date(dateObject);
  local.setMinutes(dateObject.getMinutes() - dateObject.getTimezoneOffset());
  return local.toJSON().slice(0, 10);
}

export const NewDateFormV2 = ({
  formTitle,
  place,
  connectedUsers,
  date,
}: {
  formTitle?: string;
  place: Place | null;
  connectedUsers: ConnectedUser[];
  date?: DateInfo;
}) => {
  return (
    <>
      <CardHeader>
        <CardTitle>
          <h2>{formTitle ?? "Record a date"}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <Label htmlFor="title">Date Title</Label>
          <Input type="text" id="title" name="title" required defaultValue={date?.title ?? ""} />
        </div>
        <div>
          <Label htmlFor="dateThrower">Who threw the date?</Label>
          {/* first entry in array should be current user */}
          <Select defaultValue={date?.dateThrower ?? connectedUsers[0]?.userId ?? "Error"} name="dateThrower">
            <SelectTrigger>
              <SelectValue defaultValue={date?.dateThrower ?? connectedUsers[0]?.userId ?? "Error"} placeholder="Who threw the date?" />
            </SelectTrigger>
            <SelectContent>
              {connectedUsers.length > 0 &&
                connectedUsers.map(user => (
                  <SelectItem className="cursor-pointer" value={user.userId ?? "Error"}>
                    {user.displayName}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="date">Date:</Label>
          <Input type="date" id="date" name="date" required defaultValue={date && date.date ? toDateInputValue(date.date) : ""} />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input type="text" id="location" name="location" defaultValue={place?.label ?? date?.location ?? ""} />
        </div>
        <div>
          Coords:
          {/* pretty print coords */}
          <p>
            {place?.coordinates
              ? `Lat: ${place.coordinates.lat}, Long: ${place.coordinates.long}, Alt: ${place.coordinates.alt ?? 0}`
              : date?.coordinates
              ? `Lat: ${date.coordinates.lat}, Long: ${date.coordinates.long}, Alt: ${date.coordinates.alt ?? 0}`
              : "No coordinates available"}
          </p>
        </div>
        <div>
          <Label hidden htmlFor="lat">
            Latitude:
          </Label>
          <Input type="hidden" id="lat" name="lat" defaultValue={place?.coordinates?.lat} />
        </div>
        <div>
          <Label hidden htmlFor="long">
            Longitude:
          </Label>
          <Input type="hidden" id="long" name="long" defaultValue={place?.coordinates?.long} />
        </div>
        <div>
          <Label hidden htmlFor="alt">
            Altitude:
          </Label>
          <Input type="hidden" id="alt" name="alt" defaultValue={place?.coordinates?.alt} />
        </div>

        <div>
          <Label htmlFor="note">Note:</Label>
          <Textarea id="note" name="note" defaultValue={date?.note ?? ""}></Textarea>
        </div>
        {/* <div>
          <Label htmlFor="picture">Picture:</Label>
          <Input type="file" id="picture" name="picture" accept="image/*" />
        </div> */}
      </CardContent>
    </>
  );
};
