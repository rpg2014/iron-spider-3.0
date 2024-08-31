import { Form } from "@remix-run/react";

export default function NewDateForm() {
  return (
    <Form method="post">
      <h2>Add New Date</h2>
      <div>
        <label htmlFor="date">Date:</label>
        <input type="date" id="date" name="date" required />
      </div>
      <div>
        <label htmlFor="description">Description:</label>
        <textarea id="description" name="description" required></textarea>
      </div>
      <button type="submit">Save Date</button>
    </Form>
  );
}
