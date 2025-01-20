import { Annotation } from "@langchain/langgraph";
import { TweetsGroupedByContent } from "../curate-data/types.js";

export const GenerateReportAnnotation = Annotation.Root({
  pageContents: Annotation<string[]>,
  relevantLinks: Annotation<string[]>,
  tweetGroup: Annotation<TweetsGroupedByContent>,
  keyReportDetails: Annotation<string>,
  report: Annotation<string>,
});

export type GenerateReportState = typeof GenerateReportAnnotation.State;
