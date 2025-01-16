import { END, START, StateGraph, Send } from "@langchain/langgraph";
import { CurateReportsAnnotation, type CurateReportsState } from "./state.js";
import { ingestData } from "./nodes/ingest-data.js";

function generateReportsEdge(state: CurateReportsState) {
  return state.pageContentData.map((data) => {
    return new Send("generateReport", data);
  });
}

/**
 * Execute each node which is used to ingest data.
 * - github trending
 * - ingest from twitter users
 * - ai news blog
 */

const curateReportsWorkflow = new StateGraph(CurateReportsAnnotation)
  .addNode("ingestData", ingestData)
  .addNode("generateReport", generateReport)
  .addEdge(START, "ingestData")
  .addConditionalEdges("ingestData", generateReportsEdge, ["generateReport"])
  .addEdge("generateReport", END);

export const curateReportsGraph = curateReportsWorkflow.compile();
curateReportsGraph.name = "Curate Reports Graph";
