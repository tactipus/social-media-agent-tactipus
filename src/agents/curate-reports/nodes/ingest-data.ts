import { CurateReportsConfigurable, CurateReportsState } from "../state.js";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { aiNewsBlogLoader } from "../loaders/ai-news-blog.js";
import { twitterLoader } from "../loaders/twitter.js";
import { getLatentSpaceLinks } from "../utils/stores/latent-space-links.js";
import { getRedditPosts } from "../loaders/reddit.js";
import { githubTrendingLoader } from "../loaders/github-trending.js";
import { SavedRedditPost } from "../types.js";
import { TweetV2 } from "twitter-api-v2";

export async function ingestData(
  _state: CurateReportsState,
  config: LangGraphRunnableConfig,
): Promise<Partial<CurateReportsState>> {
  const sources = (config.configurable as CurateReportsConfigurable | undefined)
    ?.sources;
  if (!sources) {
    throw new Error("No sources provided");
  }

  let tweets: TweetV2[] = [];
  let trendingRepos: string[] = [];
  let latentSpaceLinks: string[] = [];
  let aiNewsPosts: string[] = [];
  let redditPosts: SavedRedditPost[] = [];

  if (sources.includes("twitter")) {
    tweets = await twitterLoader();
  }
  if (sources.includes("github")) {
    trendingRepos = await githubTrendingLoader(config);
  }
  if (sources.includes("latent_space")) {
    latentSpaceLinks = await getLatentSpaceLinks(config);
  }
  if (sources.includes("ai_news")) {
    aiNewsPosts = await aiNewsBlogLoader();
  }
  if (sources.includes("reddit")) {
    redditPosts = await getRedditPosts(config);
  }

  return {
    tweets,
    trendingRepos,
    latentSpaceLinks,
    aiNewsPosts,
    redditPosts,
  };
}
