import { v4 as uuidv4 } from "uuid";
import * as ls from "langsmith/jest";
import { type SimpleEvaluator } from "langsmith/jest";
import { InMemoryStore, MemorySaver } from "@langchain/langgraph";
import { INPUTS } from "./data/inputs-outputs.js";
import { verifyRedditPostGraph } from "../verify-reddit-post-graph.js";
import { VerifyRedditGraphState } from "../types.js";

const checkVerifyPostResult: SimpleEvaluator = ({ expected, actual }) => {
  const { pageContents, relevantLinks } = actual as VerifyRedditGraphState;
  const { relevant } = expected as { relevant: boolean };

  const hasPageContentsAndLinks = Boolean(
    pageContents?.length && relevantLinks?.length,
  );

  return {
    key: "validation_result_expected",
    score: Number(hasPageContentsAndLinks === relevant),
  };
};

ls.describe("SMA - Verify Reddit Post - E2E", () => {
  ls.test.each(INPUTS)(
    "Evaluates the verify reddit post agent",
    async ({ inputs, expected }) => {
      verifyRedditPostGraph.checkpointer = new MemorySaver();
      verifyRedditPostGraph.store = new InMemoryStore();

      const threadId = uuidv4();
      const config = {
        configurable: {
          thread_id: threadId,
        },
      };

      const results = await verifyRedditPostGraph.invoke(inputs, config);
      console.log("Finished invoking graph with URL", inputs.link);
      await ls
        .expect(results)
        .evaluatedBy(checkVerifyPostResult)
        .toBe(expected.relevant ? 1 : 0);
      return results;
    },
  );
});
