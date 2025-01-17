import { test, expect } from "@jest/globals";
import { getRedditPosts } from "../reddit.js";

test("getRedditPosts", async () => {
  const results = await getRedditPosts();
  console.log("\n\nTEST COMPLETED\n\n");
  console.log("results.length", results.length);
  expect(results.length).toBeGreaterThan(0);
});
