import { Annotation } from "@langchain/langgraph";
import { PageContentData, SavedRedditPost } from "./types.js";
import { TweetV2 } from "twitter-api-v2";

export const CurateReportsAnnotation = Annotation.Root({
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
  tweets: Annotation<TweetV2[]>,
  /**
   * List of trending GitHub repository names/paths.
   */
  trendingRepos: Annotation<string[]>,
  /**
   * A list of new Latent Space posts.
   */
  latentSpaceLinks: Annotation<string[]>,
  /**
   * A list of new AI Newsletter posts.
   */
  aiNewsPosts: Annotation<string[]>,
  /**
   * Collection of saved Reddit posts and their associated comments.
   * Each post contains the original content and relevant discussion threads.
   */
  redditPosts: Annotation<SavedRedditPost[]>,
});

export type Source =
  | "github"
  | "twitter"
  | "latent_space"
  | "ai_news"
  | "reddit";

export const CurateReportsConfigurableAnnotation = Annotation.Root({
  /**
   * The sources to ingest from.
   */
  sources: Annotation<Source[]>,
});

export type CurateReportsState = typeof CurateReportsAnnotation.State;
export type CurateReportsConfigurable =
  typeof CurateReportsConfigurableAnnotation.State;
