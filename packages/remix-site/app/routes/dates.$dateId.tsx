import { useParams } from "@remix-run/react";

export default function DateDetails() {
  const { dateId } = useParams();

  return (
    <div>
      <h2>Date Details</h2>
      <p>Date ID: {dateId}</p>
      <p>Date: [Placeholder for date]</p>
      <p>Description: [Placeholder for description]</p>
    </div>
  );
}
