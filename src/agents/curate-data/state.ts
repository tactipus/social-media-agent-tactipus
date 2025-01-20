import { Annotation } from "@langchain/langgraph";
import {
  GitHubTrendingData,
  PageContentData,
  TweetsGroupedByContent,
} from "./types.js";
import { TweetV2 } from "twitter-api-v2";
import { SimpleRedditPostWithComments } from "../../clients/reddit/types.js";
import { RedditPostsWithExternalData } from "../verify-reddit-post/types.js";

export const CurateDataAnnotation = Annotation.Root({
  /**
   * Array of page content data scraped from various sources.
   * This data serves as the raw input for generating reports.
   * Each item contains structured content extracted from a webpage.
   */
  pageContentData: Annotation<PageContentData[]>({
    reducer: (_state, update) => update,
    default: () => [],
  }),
  /**
   * Collection of generated reports based on the analyzed content.
   * Each report contains processed and summarized information from various sources.
   */
  reports: Annotation<Report[]>,

  /**
   * Collection of saved tweets from a Twitter list.
   * Each tweet contains metadata like ID, creation time, text content, and media references.
   */
  rawTweets: Annotation<TweetV2[]>,
  /**
   * A list of validated tweets.
   */
  validatedTweets: Annotation<TweetV2[]>,
  /**
   * Tweets which have been grouped by their external URLs.
   * Each group contains a list of tweets which reference the same external URL.
   */
  tweetsGroupedByContent: Annotation<TweetsGroupedByContent[]>,
  /**
   * Array of indices of similar groups of tweets to re-evaluate the grouping of.
   */
  similarGroupIndices: Annotation<number[]>,

  /**
   * List of trending GitHub repository names/paths.
   */
  rawTrendingRepos: Annotation<string[]>,
  /**
   * A list of trending GitHub repositories & README contents which have been
   * validated.
   */
  githubTrendingData: Annotation<GitHubTrendingData[]>,

  /**
   * A list of new Latent Space posts.
   */
  latentSpacePosts: Annotation<string[]>,
  /**
   * A list of new AI Newsletter posts.
   */
  aiNewsPosts: Annotation<string[]>,
  /**
   * Collection of saved Reddit posts and their associated comments.
   * Each post contains the original content and relevant discussion threads.
   */
  rawRedditPosts: Annotation<SimpleRedditPostWithComments[]>,
  /**
   * A list of verified Reddit posts.
   */
  redditPosts: Annotation<RedditPostsWithExternalData[]>,
});

export type Source =
  | "github"
  | "twitter"
  | "latent_space"
  | "ai_news"
  | "reddit";

export const CurateDataConfigurableAnnotation = Annotation.Root({
  /**
   * The sources to ingest from.
   */
  sources: Annotation<Source[]>,
});

export type CurateDataState = typeof CurateDataAnnotation.State;
export type CurateDataConfigurable =
  typeof CurateDataConfigurableAnnotation.State;
