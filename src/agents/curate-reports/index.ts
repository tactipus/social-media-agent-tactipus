import { END, Send, START, StateGraph } from "@langchain/langgraph";
import { CurateReportsAnnotation, CurateReportsState } from "./state.js";
import { ingestData } from "./nodes/ingest-data.js";
import { verifyGitHubWrapper } from "./nodes/verify-github-wrapper.js";
import { verifyRedditWrapper } from "./nodes/verify-reddit-wrapper.js";
import { verifyGeneralContent } from "../shared/nodes/verify-general.js";
import { VerifyContentAnnotation } from "../shared/shared-state.js";
import { validateBulkTweets } from "./nodes/validate-bulk-tweets.js";
import { generateReports } from "./nodes/generate-reports.js";

function verifyContentWrapper(state: CurateReportsState): Send[] {
  const latentSpaceSends = state.latentSpacePosts.map((post) => {
    return new Send("verifyGeneralContent", {
      link: post,
    });
  });

  const githubSends = state.rawTrendingRepos?.length
    ? [
        new Send("verifyGitHubContent", {
          rawTrendingRepos: state.rawTrendingRepos,
        }),
      ]
    : [];

  const redditSends = state.rawRedditPosts?.length
    ? [
        new Send("verifyRedditPost", {
          rawRedditPosts: state.rawRedditPosts,
        }),
      ]
    : [];

  const twitterSends = state.rawTweets?.length
    ? [
        new Send("verifyBulkTweets", {
          rawTweets: state.rawTweets,
        }),
      ]
    : [];

  return [...latentSpaceSends, ...githubSends, ...redditSends, ...twitterSends];
}

const curateReportsWorkflow = new StateGraph(CurateReportsAnnotation)
  .addNode("ingestData", ingestData)
  .addNode("verifyGitHubContent", verifyGitHubWrapper)
  .addNode("verifyRedditPost", verifyRedditWrapper)
  .addNode("verifyGeneralContent", verifyGeneralContent, {
    input: VerifyContentAnnotation,
  })
  .addNode("verifyBulkTweets", validateBulkTweets)

  .addNode("generateReports", generateReports)
  .addEdge(START, "ingestData")
  .addConditionalEdges("ingestData", verifyContentWrapper, [
    "verifyGeneralContent",
    "verifyGitHubContent",
    "verifyRedditPost",
    "verifyBulkTweets",
  ])
  .addEdge("verifyGeneralContent", "generateReports")
  .addEdge("verifyGitHubContent", "generateReports")
  .addEdge("verifyRedditPost", "generateReports")
  .addEdge("verifyBulkTweets", "generateReports")

  // TODO: Will need to add a node & edge for routing to generate tweet/thread graphs
  .addEdge("generateReports", END);

export const curateReportsGraph = curateReportsWorkflow.compile();
curateReportsGraph.name = "Curate Reports Graph";
