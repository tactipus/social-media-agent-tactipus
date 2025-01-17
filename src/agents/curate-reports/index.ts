import { END, START, StateGraph } from "@langchain/langgraph";
import { CurateReportsAnnotation } from "./state.js";
import { ingestData } from "./nodes/ingest-data.js";

const curateReportsWorkflow = new StateGraph(CurateReportsAnnotation)
  .addNode("ingestData", ingestData)
  .addEdge(START, "ingestData")
  .addEdge("ingestData", END);

export const curateReportsGraph = curateReportsWorkflow.compile();
curateReportsGraph.name = "Curate Reports Graph";
