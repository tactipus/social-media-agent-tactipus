import { Annotation } from "@langchain/langgraph";
import { TweetsGroupedByContent } from "../curate-data/types.js";

export const GenerateReportAnnotation = Annotation.Root({
  pageContents: Annotation<string[] | undefined>({
    reducer: (state, update) => {
      if (update === undefined) return undefined;
      return (state || []).concat(update);
    },
    default: () => [],
  }),
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
  tweetGroup: Annotation<TweetsGroupedByContent>,
  keyReportDetails: Annotation<string>,
  report: Annotation<string>,
});

export type GenerateReportState = typeof GenerateReportAnnotation.State;
