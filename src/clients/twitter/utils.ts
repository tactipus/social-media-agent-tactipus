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

/**
 * Identifies tweets that form a valid thread with the original tweet
 * @param {TweetV2} originalTweet - The main/original tweet in the thread
 * @param {TweetV2[]} tweets - Array of tweets to check for thread membership
 * @returns {TweetV2[]} Array of tweets that form a valid thread, including the original tweet.
 * Empty array if no valid thread is found.
 *
 * A tweet is considered part of the thread if:
 * - It has referenced tweets
 * - It has a 'replied_to' reference to another tweet already in the thread
 *
 * @see {@link TweetV2} from 'twitter-api-v2' package
 */
export function getThreadTweets(
  originalTweet: TweetV2,
  tweets: TweetV2[],
): TweetV2[] {
  // Create a Set of all tweet IDs in the potential thread
  const tweetIds = new Set(tweets.map((tweet) => tweet.id));
  tweetIds.add(originalTweet.id);

  // Check each tweet (except the main tweet) references another tweet in the thread
  const validThreadTweets = [originalTweet];
  for (const tweet of tweets) {
    // Skip the main tweet
    if (tweet.id === originalTweet.id) continue;

    // Check if this tweet has referenced tweets
    if (!tweet.referenced_tweets || tweet.referenced_tweets.length === 0) {
      continue;
    }

    // Find a 'replied_to' reference that points to another tweet in the thread
    const hasValidReference = tweet.referenced_tweets.some(
      (ref) => ref.type === "replied_to" && tweetIds.has(ref.id),
    );

    if (hasValidReference) {
      validThreadTweets.push(tweet);
    }
  }

  return validThreadTweets;
}
