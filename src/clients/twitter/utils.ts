import { TweetV2 } from "twitter-api-v2";

/**
 * Generates a link to a tweet based on its author ID and tweet ID.
 * @param authorId The ID of the author of the tweet
 * @param tweetId The ID of the tweet
 * @returns The link to the tweet
 */
export function getTweetLink(authorId: string, tweetId: string): string {
  return `https://twitter.com/${authorId}/status/${tweetId}`;
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
