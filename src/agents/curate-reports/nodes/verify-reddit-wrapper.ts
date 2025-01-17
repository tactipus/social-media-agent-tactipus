import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { CurateReportsState } from "../state.js";
import { verifyRedditPostGraph } from "../../verify-reddit-post/verify-reddit-post-graph.js";
import { RedditPostsWithExternalData } from "../../verify-reddit-post/types.js";

export async function verifyRedditWrapper(
  state: CurateReportsState,
  config: LangGraphRunnableConfig,
): Promise<Partial<CurateReportsState>> {
  const verifiedRedditPosts: RedditPostsWithExternalData[] = [];

  for (const post of state.rawRedditPosts) {
    try {
      const result = await verifyRedditPostGraph.invoke(
        {
          redditPost: post,
        },
        config,
      );

      if (result.relevantLinks.length > 0 && result.pageContents.length > 0) {
        verifiedRedditPosts.push({
          ...post,
          externalData: result.pageContents.map((pageContent, idx) => ({
            pageContent,
            url: result.relevantLinks[idx],
          })),
        });
      }
    } catch (e) {
      console.error("Failed to verify Reddit post", e);
    }
  }

  return {
    redditPosts: verifiedRedditPosts,
  };
}
