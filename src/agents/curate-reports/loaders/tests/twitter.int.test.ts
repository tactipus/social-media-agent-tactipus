import fs from "fs/promises";
import { test, expect } from "@jest/globals";
import { twitterLoader } from "../twitter.js";

test("twitterLoader", async () => {
  const results = await twitterLoader();
  console.log("\n\nTEST COMPLETED\n\n");
  console.log("results.length", results.length);
  await fs.writeFile("tweets.json", JSON.stringify(results));
  expect(results.length).toBeGreaterThan(0);
});
