import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { RedditClient } from "../../../clients/reddit/client.js";
import {
  getRedditPostIds,
  putRedditPostIds,
} from "../utils/stores/reddit-post-ids.js";
import { getUniqueArrayItems } from "../utils/get-unique-array.js";
import { SimpleRedditPostWithComments } from "../../../clients/reddit/types.js";

export async function getRedditPosts(
  config: LangGraphRunnableConfig,
): Promise<SimpleRedditPostWithComments[]> {
  const client = await RedditClient.fromUserless();
  const topPosts = await client.getTopPosts("LocalLLaMA", { limit: 15 });
  const data: SimpleRedditPostWithComments[] = [];
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

  const processedPostIds = await getRedditPostIds(config);
  const postIds = data.map((post) => post.post.id);
  const uniquePostIds = getUniqueArrayItems(processedPostIds, postIds);
  const allPostIds = Array.from(
    new Set([...processedPostIds, ...uniquePostIds]),
  );

  await putRedditPostIds(allPostIds, config);

  return data.filter((post) => uniquePostIds.includes(post.post.id));
}
