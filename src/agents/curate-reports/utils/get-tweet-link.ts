/**
 * Generates a link to a tweet based on its author ID and tweet ID.
 * @param authorId The ID of the author of the tweet
 * @param tweetId The ID of the tweet
 * @returns The link to the tweet
 */
export function getTweetLink(authorId: string, tweetId: string): string {
  return `https://twitter.com/${authorId}/status/${tweetId}`;
}
