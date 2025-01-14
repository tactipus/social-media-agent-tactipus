import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { generateThreadPlan } from "./nodes/generate-thread-plan.js";
import { generateThreadPosts } from "./nodes/generate-thread-posts.js";
import { ThreadPost } from "./types.js";

export const GenerateThreadAnnotation = Annotation.Root({
  /**
   * The reports to use for generating the thread.
   */
  reports: Annotation<string[]>,
  /**
   * The total number of posts to generate.
   */
  totalPosts: Annotation<number>,
  /**
   * Whether or not to rewrite the posts.
   */
  shouldRewritePosts: Annotation<boolean>,
  /**
   * The number of times the posts have been rewritten.
   */
  rewritePostsCount: Annotation<number>({
    reducer: (_state, update) => update,
    default: () => 0,
  }),
  /**
   * The plan generated for the thread.
   */
  threadPlan: Annotation<string>,
  /**
   * The posts generated for the thread.
   */
  threadPosts: Annotation<ThreadPost[]>,
});

// function reviewPostsOrEnd(state: typeof GenerateThreadAnnotation.State): "rewritePosts" | typeof END {
//   if (state.shouldRewritePosts && state.rewritePostsCount < 3) {
//     return "rewritePosts";
//   }
//   return END;
// }

const generateThreadWorkflow = new StateGraph(GenerateThreadAnnotation)
  // .addNode("generateThreadPlan", generateThreadPlan)
  // .addNode("generateThreadPosts", generateThreadPosts)
  // .addNode("reviewPosts", reviewPosts)
  // .addNode("rewritePosts", rewritePosts)
  // .addEdge(START, "generateThreadPlan")
  // .addEdge("generateThreadPlan", "generateThreadPosts")
  // .addEdge("generateThreadPosts", "reviewPosts")
  // .addConditionalEdges("reviewPosts", reviewPostsOrEnd, [
  //   "rewritePosts",
  //   END,
  // ])
  // .addEdge("rewritePosts", "reviewPosts")

  .addNode("generateThreadPlan", generateThreadPlan)
  .addNode("generateThreadPosts", generateThreadPosts)
  .addEdge(START, "generateThreadPlan")
  .addEdge("generateThreadPlan", "generateThreadPosts")
  .addEdge("generateThreadPosts", END);

export const generateThreadGraph = generateThreadWorkflow.compile();
generateThreadGraph.name = "Generate Thread Graph";
