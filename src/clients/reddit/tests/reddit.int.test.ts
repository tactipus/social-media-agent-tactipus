import { test, expect } from "@jest/globals";
import { RedditClient } from "../client.js";

test("Reddit client can fetch posts from subreddit", async () => {
  const subredditName = "LocalLLaMA";

  const client = await RedditClient.fromUserless();
  const posts = await client.getTopPosts(subredditName, { limit: 10 });
  console.log("Posts:\n");
  console.dir(posts.map(client.simplifyPost), { depth: null });
  expect(posts.length).toBe(10);
});

test("Reddit client can fetch comments from post", async () => {
  const subredditName = "LocalLLaMA";
  const client = await RedditClient.fromUserless();
  const posts = await client.getTopPosts(subredditName, { limit: 1 });

  const postId = posts[0].id;
  const comments = await client.getPostComments(postId);
  console.log("Comments:\n");
  console.dir(comments.map(client.simplifyComment), { depth: null });
  expect(comments.length).toBeGreaterThan(0);
});
