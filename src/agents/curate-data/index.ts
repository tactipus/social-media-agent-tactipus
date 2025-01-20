import { END, Send, START, StateGraph } from "@langchain/langgraph";
import { CurateDataAnnotation, CurateDataState } from "./state.js";
import { ingestData } from "./nodes/ingest-data.js";
import { verifyGitHubWrapper } from "./nodes/verify-github-wrapper.js";
import { verifyRedditWrapper } from "./nodes/verify-reddit-wrapper.js";
import { verifyGeneralContent } from "../shared/nodes/verify-general.js";
import { VerifyContentAnnotation } from "../shared/shared-state.js";
import { validateBulkTweets } from "./nodes/validate-bulk-tweets.js";
import { generateReports } from "./nodes/generate-reports.js";
import { groupTweetsByContent } from "./nodes/group-tweets-by-content.js";

function verifyContentWrapper(state: CurateDataState): Send[] {
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

const curateDataWorkflow = new StateGraph(CurateDataAnnotation)
  .addNode("ingestData", ingestData)
  .addNode("verifyGitHubContent", verifyGitHubWrapper)
  .addNode("verifyRedditPost", verifyRedditWrapper)
  .addNode("verifyGeneralContent", verifyGeneralContent, {
    input: VerifyContentAnnotation,
  })
  .addNode("verifyBulkTweets", validateBulkTweets)
  .addNode("groupTweetsByContent", groupTweetsByContent)

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
  .addEdge("verifyBulkTweets", "groupTweetsByContent")
  .addEdge("groupTweetsByContent", "generateReports")

  // TODO: Will need to add a node & edge for routing to generate tweet/thread graphs
  .addEdge("generateReports", END);

export const curateDataGraph = curateDataWorkflow.compile();
curateDataGraph.name = "Curate Data Graph";
