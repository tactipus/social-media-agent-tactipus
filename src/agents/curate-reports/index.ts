import { END, START, StateGraph } from "@langchain/langgraph";
import { CurateReportsAnnotation } from "./state.js";
import { ingestData } from "./nodes/ingest-data.js";
import { SavedRedditPost, TweetV2WithURLs } from "./types.js";

/**
 * Content state field:
 * This is an array of content. Each item in the array will contain content to be used for generating tweets.
 * This will be similar content, so the tweet generation can have more context from different sources.
 * State field
 * @example
 * ```typescript
 * type State = {
 *   content: Content[];
 * }
 * ```
 */

type Content = {
  /**
   * The reports generated for each individual piece of content.
   */
  reports: Report[];
};

type Report = {
  /**
   * The generated report based on the input content.
   */
  report: string;
  /**
   * The URLs & scraped data used as context for generating the report.
   * Undefined if no URLs were used (e.g only reddit/twitter
   * content was used to generate the report).
   */
  contextURLData: ContextData[] | undefined;
  /**
   * Tweets used to generate the report.
   */
  tweets: TweetV2WithURLs[] | undefined;
  /**
   * Reddit posts used to generate the report
   */
  redditPosts: SavedRedditPost[] | undefined;
};

type ContextData = {
  /**
   * The URL for the content
   */
  url: string;
  /**
   * The content scraped from the URL
   */
  content: string;
};

/**
 * Curate reports graph.
 *
 * 1. Ingest data
 *
 * 2(a). Send to validate data subgraph (not Tweets)
 *
 * 2(b). Send tweets to a new bulk validate & sort tweets subgraph
 *
 * 3. Once validated, generate reports for each piece of content (blogs, tweet groups, etc)
 *
 * 4. (optional, can be skipped) Look for similar content. This is already done
 *  for tweets, however this step would group cross-platform.
 *  E.g referencing the same paper, produce release, etc. Write this to the content state field
 *
 * 5. Generate social media posts & interrupt. Configurable fields to generate a thread or single post.
 */

/**
 * Bulk validate tweets graph.
 * Will input all of the Tweets scraped that day. Then, it will preform the following operations on them:
 *
 * (the below steps will create lists for each category, but can contain duplicate tweets across categories)
 * 1(a). Filter tweets which reference the same external URLs
 * 1(b). Filter tweets which are replying to the same tweet, or quoting the same tweet
 * 1(c). Pass all tweets to an LLM and have it sort into categories (duplicates NOT allowed for this, but TODO: Eval that option)
 */

const curateReportsWorkflow = new StateGraph(CurateReportsAnnotation)
  .addNode("ingestData", ingestData)
  .addEdge(START, "ingestData")
  .addEdge("ingestData", END);

export const curateReportsGraph = curateReportsWorkflow.compile();
curateReportsGraph.name = "Curate Reports Graph";
