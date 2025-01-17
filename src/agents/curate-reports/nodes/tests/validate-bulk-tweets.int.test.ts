import fs from "fs";
import * as ls from "langsmith/jest";
import { validateBulkTweets } from "../validate-bulk-tweets.js";
import { SimpleEvaluator } from "langsmith/jest";
import { SavedTweet } from "../../types.js";

const tweetEvaluator: SimpleEvaluator = () => {
  return {
    key: "tweet_generation",
    score: 1,
  };
};

function loadTweets(): SavedTweet[] {
  const tweets = JSON.parse(
    fs.readFileSync(
      "src/agents/curate-reports/nodes/tests/data/tweets.json",
      "utf-8",
    ),
  );
  return tweets;
}

ls.describe("SMA - Curate Reports - Validate Bulk Tweets", () => {
  ls.test(
    "Can validate tweets",
    // You can pass an "iterations" parameter or other LS config here if desired
    {
      inputs: {},
      expected: {},
    },
    async () => {
      const tweets = loadTweets();
      // Import and run your app, or some part of it here
      // This dummy example just returns your expected output
      const result = await validateBulkTweets({ tweets } as any);
      console.log(result.tweets?.map((p) => p.fullText).join("\n---\n"));
      await ls.expect(result).evaluatedBy(tweetEvaluator).toBe(1);
      return result;
    },
  );
});
