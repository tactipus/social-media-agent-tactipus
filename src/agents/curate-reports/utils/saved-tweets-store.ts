import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { SavedTweet } from "../types.js";

export const NAMESPACE = ["saved_data", "tweets"];
export const KEY = "saved_tweets";
export const OBJECT_KEY = "data";

export async function putSavedTweets(
  savedTweets: SavedTweet[],
  config: LangGraphRunnableConfig,
) {
  const store = config.store;
  if (!store) {
    throw new Error("No store provided");
  }
  await store.put(NAMESPACE, KEY, {
    [OBJECT_KEY]: savedTweets,
  });
}

export async function getSavedTweets(
  config: LangGraphRunnableConfig,
): Promise<SavedTweet[]> {
  const store = config.store;
  if (!store) {
    throw new Error("No store provided");
  }
  const savedTweets = await store.get(NAMESPACE, KEY);
  if (!savedTweets) {
    return [];
  }
  return savedTweets.value?.[OBJECT_KEY] || [];
}
