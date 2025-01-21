import { RedditClient } from "../../../clients/reddit/client.js";
import { VerifyRedditGraphState } from "../types.js";

export async function getPost(
  state: VerifyRedditGraphState,
): Promise<Partial<VerifyRedditGraphState>> {
  if (state.redditPost) {
    // Post already exists, don't do anything
    return {};
  }

  const client = await RedditClient.fromUserless();

  if (state.link) {
    const post = await client.getPostByURL(state.link);
    const comments = await client.getPostComments(post.id, {
      limit: 10, // default
      depth: 3, // default
    });
    return {
      redditPost: {
        post: client.simplifyPost(post),
        comments: comments.map(client.simplifyComment),
      },
    };
  } else if (state.postID) {
    const post = await client.getPostById(state.postID);
    const comments = await client.getPostComments(post.id, {
      limit: 10, // default
      depth: 3, // default
    });
    return {
      redditPost: {
        post: client.simplifyPost(post),
        comments: comments.map(client.simplifyComment),
      },
    };
  }

  throw new Error("Must provide either a reddit post, link or ID.");
}
