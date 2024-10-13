import { Label } from "@radix-ui/react-label";
import { Form } from "@remix-run/react";
import { Button } from "../ui/Button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/Card";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/TextArea";
import { ConnectedUser, Place } from "iron-spider-client";
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from "../ui/Select";

export const NewDateForm = ({ dateId }: { dateId?: string }) => {
  return (
    <Card>
      <Form method="post">
        <CardHeader>
          <CardTitle>
            <h2>Add New Date</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="date">Date:</Label>
            <Input type="date" id="date" name="date" required />
          </div>
          <div>
            <Label htmlFor="description">Description:</Label>
            <Textarea id="description" name="description" required></Textarea>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit">Save Date</Button>
        </CardFooter>
      </Form>
    </Card>
  );
};

export const NewDateFormV2 = ({ title, location, connectedUsers }: { title?: string; location: Place; connectedUsers: ConnectedUser[] }) => {
  return (
    <>
      <CardHeader>
        <CardTitle>
          <h2>{title || "Record a date"}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <Label htmlFor="title">Date Title</Label>
          <Input type="text" id="title" name="title" required />
        </div>
        <div>
          <Label htmlFor="dateThrower">Who threw the date?</Label>
          {/* first entry in array should be current user */}
          <Select defaultValue={connectedUsers[0]?.userId || "Error"} name="dateThrower">
            <SelectTrigger>
              <SelectValue defaultValue={connectedUsers[0]?.userId || "Error"} placeholder="Who threw the date?" />
            </SelectTrigger>
            <SelectContent>
              {connectedUsers.length > 0 &&
                connectedUsers.map(user => (
                  <SelectItem className="cursor-pointer" value={user.userId || "Error"}>
                    {user.displayName}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="date">Date:</Label>
          <Input type="date" id="date" name="date" required />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input type="text" id="location" name="location" defaultValue={location.label} />
        </div>
        <div>
          Coords: 
          {/* pretty print coords */}
          <p>{`Lat: ${location.coordinates?.lat}, Long: ${location.coordinates?.long}, Alt: ${location.coordinates?.alt || 0}`}</p>
        </div>
        <div>
          <Label hidden htmlFor="lat">
            Latitude:
          </Label>
          <Input type="hidden" id="lat" name="lat" defaultValue={location.coordinates?.lat} />
        </div>
        <div>
          <Label hidden htmlFor="long">
            Longitude:
          </Label>
          <Input type="hidden" id="long" name="long" defaultValue={location.coordinates?.long} />
        </div>
        <div>
          <Label hidden htmlFor="alt">
            Altitude:
          </Label>
          <Input type="hidden" id="alt" name="alt" defaultValue={location.coordinates?.alt} />
        </div>
        
        
        <div>
          <Label htmlFor="note">Note:</Label>
          <Textarea id="note" name="note"></Textarea>
        </div>
        <div>
          <Label htmlFor="picture">Picture:</Label>
          <Input type="file" id="picture" name="picture" accept="image/*" />
        </div>
      </CardContent>
    </>
  );
};
