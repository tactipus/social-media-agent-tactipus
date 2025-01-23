import { Annotation } from "@langchain/langgraph";
import { SimpleRedditPostWithComments } from "../../clients/reddit/types.js";

export const VerifyRedditPostAnnotation = Annotation.Root({
  /**
   * The reddit post to verify. Optional, if not provided then a `link`, or `postID` must be provided.
   */
  redditPost: Annotation<SimpleRedditPostWithComments | undefined>,
  /**
   * A link to a Reddit post. Optional, if not provided then a `redditPost` or `postID` must be provided.
   */
  link: Annotation<string | undefined>,
  /**
   * The ID of a Reddit post. Optional, if not provided then a `redditPost` or `link` must be provided.
   */
  postID: Annotation<string | undefined>,
  /**
   * The external URLs found in the body of the Reddit post.
   */
  externalURLs: Annotation<string[]>({
    reducer: (state, update) => state.concat(update),
    default: () => [],
  }),
  // REQUIRED DUE TO USING SHARED NODES
  relevantLinks: Annotation<string[] | undefined>({
    reducer: (state, update) => {
      if (update === undefined) return undefined;
      // Use a set to ensure no duplicate links are added.
      const stateSet = new Set(state || []);
      update.forEach((link) => stateSet.add(link));
      return Array.from(stateSet);
    },
    default: () => [],
  }),
  pageContents: Annotation<string[] | undefined>({
    reducer: (state, update) => {
      if (update === undefined) return undefined;
      return (state || []).concat(update);
    },
    default: () => [],
  }),
  imageOptions: Annotation<string[] | undefined>({
    reducer: (state, update) => {
      if (update === undefined) return undefined;
      // Use a set to ensure no duplicate links are added.
      const stateSet = new Set(state || []);
      update.forEach((link) => stateSet.add(link));
      return Array.from(stateSet);
    },
    default: () => [],
  }),
});
