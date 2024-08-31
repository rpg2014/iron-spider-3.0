import { Link } from "@remix-run/react";

export default function DatesList() {
  return (
    <div>
      <h2>My Dates</h2>
      <ul>
        <li>
          <Link to="/dates/1">Date 1</Link>
        </li>
        <li>
          <Link to="/dates/2">Date 2</Link>
        </li>
      </ul>
      <Link to="/dates/new">Add New Date</Link>
    </div>
  );
}
