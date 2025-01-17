import { Annotation } from "@langchain/langgraph";
import { SimpleRedditPostWithComments } from "../../clients/reddit/types.js";

export const VerifyRedditPostAnnotation = Annotation.Root({
  /**
   * The reddit post to verify
   */
  redditPost: Annotation<SimpleRedditPostWithComments | undefined>,
  /**
   * The external URLs found in the body of the Reddit post.
   */
  externalURLs: Annotation<string[]>,

  // REQUIRED DUE TO USING SHARED NODES
  relevantLinks: Annotation<string[]>,
  pageContents: Annotation<string[]>,
  imageOptions: Annotation<string[]>,
});
