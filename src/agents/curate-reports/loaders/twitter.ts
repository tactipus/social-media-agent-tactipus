import { TweetV2ListTweetsPaginator } from "twitter-api-v2";
import { TwitterClient } from "../../../clients/twitter/client.js";
import { SavedTweet } from "../types.js";
import { createdAtAfter } from "../utils/created-at-after.js";
import { getTweetLink } from "../utils/get-tweet-link.js";

const LIST_ID = "1585430245762441216";

/**
 * Fetches tweets from a Twitter list, handling pagination and error handling.
 * If an error occurs, the function logs the error and returns undefined.
 * @param client
 * @param paginationToken
 * @returns {Promise<TweetV2ListTweetsPaginator | undefined>}
 */
async function fetchListTweetsWrapper(
  client: TwitterClient,
  paginationToken: string | undefined,
): Promise<TweetV2ListTweetsPaginator | undefined> {
  try {
    return await client.getListTweets(LIST_ID, {
      // maxResults: 100,
      maxResults: 10,
      paginationToken,
    });
  } catch (error) {
    console.error(`Error fetching tweets: ${error}`);
    return undefined;
  }
}

export async function twitterLoader(): Promise<SavedTweet[]> {
  const client = TwitterClient.fromBasicTwitterAuth();

  // Initialize variables for pagination
  let paginationToken: string | undefined;
  let allTweets: SavedTweet[] = [];
  let requestCount = 0;
  // const maxRequests = 5;
  const maxRequests = 1;

  // Calculate 24 hours ago once, using the provided current time
  const oneDayAgo = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
  const oneDayAgoUTC = new Date(oneDayAgo.toISOString());

  while (requestCount < maxRequests) {
    requestCount += 1;
    console.log("requestCount", requestCount);

    const tweets = await fetchListTweetsWrapper(client, paginationToken);
    if (tweets === undefined || !tweets?.data?.data?.length) {
      // No more tweets to fetch
      break;
    }
    if (!allTweets.length) {
      console.log("got tweets");
      console.dir(tweets, { depth: null });
    }

    const filteredTweets: SavedTweet[] = tweets?.data.data
      .filter(
        (tweet) =>
          tweet.created_at && createdAtAfter(tweet.created_at, oneDayAgoUTC),
      )
      .map((t) => {
        const fullText = t.note_tweet?.text || t.text;
        return {
          id: t.id,
          link: t.author_id ? getTweetLink(t.author_id, t.id) : undefined,
          createdAt: t.created_at || new Date().toISOString(),
          fullText,
          mediaKeys: t.attachments?.media_keys || [],
          references: t.referenced_tweets,
        };
      });

    allTweets = [...allTweets, ...filteredTweets];

    // Get the next pagination token
    paginationToken = tweets.data.meta?.next_token;
    // If no more tweets or we got tweets older than 24 hours, stop paginating
    if (
      !paginationToken ||
      tweets.data.data.some(
        (tweet) =>
          tweet.created_at && !createdAtAfter(tweet.created_at, oneDayAgoUTC),
      )
    ) {
      break;
    }
  }

  return allTweets;
}
