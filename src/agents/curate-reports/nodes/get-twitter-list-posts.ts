import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { TwitterClient } from "../../../clients/twitter/client.js";
import { CurateReportsState } from "../state.js";
import { SavedTweet } from "../types.js";
import { putSavedTweets } from "../utils/saved-tweets-store.js";

const LIST_ID = "1585430245762441216";

function createdAtAfter(createdAt: string, referenceDate: Date) {
  return new Date(createdAt).getTime() > referenceDate.getTime();
}

export async function getTwitterListPosts(
  _state: CurateReportsState,
  config: LangGraphRunnableConfig,
): Promise<Partial<CurateReportsState>> {
  const client = TwitterClient.fromBasicTwitterAuth();
  const tweets = await client.getListTweets(LIST_ID, {
    maxResults: 100,
  });

  // Filter tweets which were created before 6 hours ago (the last time this was run)
  const sixHoursAgo = new Date(new Date().getTime() - 6 * 60 * 60 * 1000);
  const sixHoursAgoUTC = new Date(sixHoursAgo.toISOString());

  const filteredTweets: SavedTweet[] = tweets.data.data
    .filter(
      (tweet) =>
        tweet.created_at && createdAtAfter(tweet.created_at, sixHoursAgoUTC),
    )
    .map((t) => {
      const fullText = t.note_tweet?.text || t.text;
      return {
        id: t.id,
        createdAt: t.created_at || new Date().toISOString(),
        fullText,
        mediaKeys: t.attachments?.media_keys || [],
      };
    });

  await putSavedTweets(filteredTweets, config);

  return {};
}
