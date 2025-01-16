import { CurateReportsState } from "../state.js";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { getTwitterListPosts } from "./get-twitter-list-posts.js";

export async function ingestData(
  state: CurateReportsState,
  config: LangGraphRunnableConfig,
): Promise<Partial<CurateReportsState>> {
  if (state.sources.includes("twitter")) {
    await getTwitterListPosts(state, config);
  }

  return {};
}
