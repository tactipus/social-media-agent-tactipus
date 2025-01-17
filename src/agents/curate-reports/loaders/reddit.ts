import { RedditClient } from "../../../clients/reddit/client.js";
import { SavedRedditPost } from "../types.js";

export async function getRedditPosts(): Promise<SavedRedditPost[]> {
  const client = await RedditClient.fromUserless();
  const topPosts = await client.getTopPosts("LocalLLaMA", { limit: 15 });
  let data: SavedRedditPost[] = [];
  for (const post of topPosts) {
    const comments = await client.getPostComments(post.id, {
      limit: 10, // default
      depth: 3, // default
    });
    data.push({
      post: client.simplifyPost(post),
      comments: comments.map(client.simplifyComment),
    });
  }

  return data;
}
