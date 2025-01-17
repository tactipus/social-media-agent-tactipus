import { END, START, StateGraph } from "@langchain/langgraph";
import { CurateReportsAnnotation } from "./state.js";
import { ingestData } from "./nodes/ingest-data.js";
import { classifyContent } from "./nodes/classify-content.js";

const curateReportsWorkflow = new StateGraph(CurateReportsAnnotation)
  .addNode("ingestData", ingestData)
  .addNode("classifyContent", classifyContent)
  .addEdge(START, "ingestData")
  .addEdge("ingestData", "classifyContent")
  .addEdge("classifyContent", END);

export const curateReportsGraph = curateReportsWorkflow.compile();
curateReportsGraph.name = "Curate Reports Graph";
