import { LangGraphRunnableConfig } from "@langchain/langgraph";

export const NAMESPACE = ["saved_data", "twitter"];
export const IDS_KEY = "ids";
export const IDS_OBJECT_KEY = "data";

export const DATE_KEY = "date";
export const DATE_OBJECT_KEY = "data";

export async function putTweetIds(
  tweetIds: string[],
  config: LangGraphRunnableConfig,
) {
  const store = config.store;
  if (!store) {
    throw new Error("No store provided");
  }
  await store.put(NAMESPACE, IDS_KEY, {
    [IDS_OBJECT_KEY]: tweetIds,
  });
}

export async function getTweetIds(
  config: LangGraphRunnableConfig,
): Promise<string[]> {
  const store = config.store;
  if (!store) {
    throw new Error("No store provided");
  }
  const tweetIds = await store.get(NAMESPACE, IDS_KEY);
  if (!tweetIds) {
    return [];
  }
  return tweetIds.value?.[IDS_OBJECT_KEY] || [];
}

export async function putLastIngestedTweetDate(
  date: string,
  config: LangGraphRunnableConfig,
) {
  const store = config.store;
  if (!store) {
    throw new Error("No store provided");
  }
  await store.put(NAMESPACE, DATE_KEY, {
    [DATE_OBJECT_KEY]: date,
  });
}

export async function getLastIngestedTweetDate(
  config: LangGraphRunnableConfig,
): Promise<string> {
  const store = config.store;
  if (!store) {
    throw new Error("No store provided");
  }
  const date = await store.get(NAMESPACE, DATE_KEY);
  if (!date) {
    return "";
  }
  return date.value?.[DATE_OBJECT_KEY] || "";
}
