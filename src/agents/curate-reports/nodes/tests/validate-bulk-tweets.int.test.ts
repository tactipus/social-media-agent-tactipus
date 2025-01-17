import fs from "fs";
import * as ls from "langsmith/jest";
import { validateBulkTweets } from "../validate-bulk-tweets.js";
import { SimpleEvaluator } from "langsmith/jest";
import { TweetV2 } from "twitter-api-v2";
import { formatInTimeZone } from "date-fns-tz";

const tweetEvaluator: SimpleEvaluator = () => {
  return {
    key: "tweet_generation",
    score: 1,
  };
};

function loadTweets(): TweetV2[] {
  const tweets = JSON.parse(
    fs.readFileSync(
      "src/agents/curate-reports/nodes/tests/data/tweets.json",
      "utf-8",
    ),
  );
  return tweets;
}

function saveRelevantTweets(tweets: TweetV2[]): void {
  try {
    const currentDateUTC = new Date().toISOString();
    const formattedPSTDate = formatInTimeZone(
      currentDateUTC,
      "America/Los_Angeles",
      "MM-dd-yyyy-HH-mm",
    );
    fs.writeFileSync(
      `src/agents/curate-reports/nodes/tests/data/relevant-tweets/relevant-${formattedPSTDate}.json`,
      JSON.stringify(tweets),
    );
  } catch (e) {
    console.error("Failed to save relevant tweets:", e);
    console.log("Tweets:", tweets);
  }
}

const tweets = loadTweets();

ls.describe("SMA - Curate Reports - Validate Bulk Tweets", () => {
  ls.test(
    "Can validate tweets",
    // You can pass an "iterations" parameter or other LS config here if desired
    {
      inputs: { tweets },
      expected: {},
    },
    async ({ inputs }) => {
      console.log("Starting test with", inputs.tweets.length, "tweets");
      const result = await validateBulkTweets(inputs as any);
      if (result.tweets?.length === 0) {
        console.log("No tweets were found that are relevant to AI");
        return result;
      }

      saveRelevantTweets(result.tweets || []);
      await ls.expect(result).evaluatedBy(tweetEvaluator).toBe(1);
      return result;
    },
  );
});
