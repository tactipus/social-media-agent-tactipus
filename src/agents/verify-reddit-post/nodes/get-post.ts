import { Submission } from "snoowrap";
import { RedditClient } from "../../../clients/reddit/client.js";
import { VerifyRedditGraphState } from "../types.js";

const REDDIT_POST_URL_REGEX = /^\/r\/[\w-]+\/comments\/[\w-]+\/.+/;

function isRedditPostUrl(url: string): boolean {
  return REDDIT_POST_URL_REGEX.test(url);
}

export async function getPost(
  state: VerifyRedditGraphState,
): Promise<Partial<VerifyRedditGraphState>> {
  if (state.redditPost) {
    // Post already exists, don't do anything
    return {};
  }

  const client = await RedditClient.fromUserless();

  let post: Submission | undefined;
  if (state.link) {
    post = await client.getPostByURL(state.link);
  } else if (state.postID) {
    post = await client.getPostById(state.postID);
  }

  if (!post) {
    throw new Error("No post found");
  }

  // Check if this post is linking to another Reddit post
  if (post.url && isRedditPostUrl(post.url)) {
    const linkedPost = await client.getPostByURL(
      `https://reddit.com${post.url}`,
    );
    if (linkedPost) {
      const [comments, linkedComments] = await Promise.all([
        client.getPostComments(post.id, {
          limit: 10,
          depth: 3,
        }),
        client.getPostComments(linkedPost.id, {
          limit: 10,
          depth: 3,
        }),
      ]);

      const simplePost = client.simplifyPost(post);
      simplePost.selftext += `\n\nLinked post:\n${linkedPost.title}\n${linkedPost.selftext}`;
      if (linkedPost.url) {
        // The original post URL was linking to this post, so replace it with the linked post URL, if exists
        simplePost.url = linkedPost.url;
      }

      return {
        redditPost: {
          post: simplePost,
          // Simply concatenate comments from both posts.
          comments: comments
            .map(client.simplifyComment)
            .concat(linkedComments.map(client.simplifyComment)),
        },
      };
    }
  }

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
