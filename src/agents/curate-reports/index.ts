import { END, START, StateGraph } from "@langchain/langgraph";
import { CurateReportsAnnotation } from "./state.js";
import { ingestData } from "./nodes/ingest-data.js";
import { verifyGitHubWrapper } from "./nodes/verify-github-wrapper.js";
import { verifyRedditWrapper } from "./nodes/verify-reddit-wrapper.js";

const curateReportsWorkflow = new StateGraph(CurateReportsAnnotation)
  .addNode("ingestData", ingestData)
  .addNode("verifyGitHubContent", verifyGitHubWrapper)
  .addNode("verifyRedditPost", verifyRedditWrapper)
  .addEdge(START, "ingestData")
  .addEdge("ingestData", END);

export const curateReportsGraph = curateReportsWorkflow.compile();
curateReportsGraph.name = "Curate Reports Graph";
