import { Link } from "react-router";
import { Button } from "~/components/ui/Button";

const ShareTarget = () => {
  return (
    <>
      <h1>Click a link to share with an agent</h1>
      <ul className="flex flex-col items-center justify-center">
        <li className="pb-2">
          <Link to="/chat/summarize">
            <Button>Summarizer</Button>
          </Link>
        </li>
        <li>
          <Link to="/chat/agent">
            <Button>Agent</Button>
          </Link>
        </li>
      </ul>
    </>
  );
};

export default ShareTarget;
