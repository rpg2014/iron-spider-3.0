import { Link } from "@remix-run/react";

const ShareTarget = () => {
  return (
    <>
      <h1>Click a link to share with an agent</h1>
      <ul>
        <li>
          <Link to="/chat/summarize">Summarizer</Link>
        </li>
        <li>
          <Link to="/chat/agent">Agent</Link>
        </li>
      </ul>
    </>
  );
};

export default ShareTarget;
