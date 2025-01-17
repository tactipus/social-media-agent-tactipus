import { TweetV2 } from "twitter-api-v2";
import { SavedTweet } from "../../agents/curate-reports/types.js";

/**
 * Generates a link to a tweet based on its author ID and tweet ID.
 * @param authorId The ID of the author of the tweet
 * @param tweetId The ID of the tweet
 * @returns The link to the tweet
 */
export function getTweetLink(authorId: string, tweetId: string): string {
  return `https://twitter.com/${authorId}/status/${tweetId}`;
}

/**
 * Convert a TweetV2 object to a SavedTweet object
 * @param t The TweetV2 object
 * @returns The SavedTweet object
 */
export function tweetV2ToSavedTweet(t: TweetV2): SavedTweet {
  return {
    id: t.id,
    link: getTweetLink(t.author_id || "", t.id),
    createdAt: t.created_at || "",
    fullText: t.note_tweet?.text || t.text || "",
    mediaKeys: t.attachments?.media_keys || [],
    references: t.referenced_tweets || undefined,
  };
}

export function isTweetSelfReply(
  tweet: TweetV2,
  originalAuthorId: string,
): boolean {
  const referencedTweet = tweet.referenced_tweets?.[0];
  return (
    tweet.author_id === originalAuthorId &&
    referencedTweet?.type === "replied_to" &&
    tweet.in_reply_to_user_id === originalAuthorId
  );
}
