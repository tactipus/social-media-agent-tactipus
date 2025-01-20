import fs from "fs";
import { test } from "@jest/globals";
import { TweetV2 } from "twitter-api-v2";

test("get len", async () => {
  const data: TweetV2[] = JSON.parse(
    fs.readFileSync(
      "src/agents/curate-reports/nodes/tests/data/relevant-tweets/relevant-01-19-2025-12-59.json",
      "utf-8",
    ),
  );

  let totalLen = 0;
  for (const tweet of data) {
    const text = tweet.note_tweet?.text || tweet.text || "";
    totalLen += text.length;
  }
  console.log("total len", totalLen);
});
