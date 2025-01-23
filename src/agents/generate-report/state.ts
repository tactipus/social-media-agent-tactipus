import { Annotation } from "@langchain/langgraph";
import { TweetsGroupedByContent } from "../curate-data/types.js";
import { VerifyLinksResultAnnotation } from "../verify-links/verify-links-state.js";

export const GenerateReportAnnotation = Annotation.Root({
  ...VerifyLinksResultAnnotation.spec,
  tweetGroup: Annotation<TweetsGroupedByContent>,
  keyReportDetails: Annotation<string>,
  report: Annotation<string>,
});

export type GenerateReportState = typeof GenerateReportAnnotation.State;
