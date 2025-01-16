import { Annotation } from "@langchain/langgraph";
import { PageContentData } from "./types.js";

export const CurateReportsAnnotation = Annotation.Root({
  /**
   * The page content data scraped to use for generating the reports.
   */
  pageContentData: Annotation<PageContentData[]>({
    reducer: (_state, update) => update,
    default: () => [],
  }),
  /**
   * The reports to store.
   */
  reports: Annotation<Report[]>,
  /**
   * The sources to ingest data from.
   */
  sources: Annotation<Array<"twitter" | "general" | "github">>,
});

export type CurateReportsState = typeof CurateReportsAnnotation.State;
