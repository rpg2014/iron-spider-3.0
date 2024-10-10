import { Label } from "@radix-ui/react-label";
import { Form } from "@remix-run/react";
import { Button } from "../ui/Button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/Card";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/TextArea";
import { Place } from "iron-spider-client";

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

export const NewDateFormV2 = ({ title, location }: { title?: string; location: Place }) => {
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
          <Label htmlFor="location">Location</Label>
          <Input type="text" id="location" name="location" defaultValue={location.label} />
        </div>
        <div>
          <Label htmlFor="lat">Latitude:</Label>
          <Input type="text" id="lat" name="lat" defaultValue={location.coordinates?.lat} />
        </div>
        <div>
          <Label htmlFor="long">Longitude:</Label>
          <Input type="text" id="long" name="long" defaultValue={location.coordinates?.long} />
        </div>
        <div>
          <Label htmlFor="alt">Altitude:</Label>
          <Input type="text" id="alt" name="alt" defaultValue={location.coordinates?.alt} />
        </div>
        <div>
          <Label htmlFor="date">Date:</Label>
          <Input type="date" id="date" name="date" required />
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
