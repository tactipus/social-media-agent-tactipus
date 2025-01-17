import { TweetV2, TweetV2ListTweetsPaginator } from "twitter-api-v2";
import { TwitterClient } from "../../../clients/twitter/client.js";
import { createdAtAfter } from "../utils/created-at-after.js";
import { TweetV2WithURLs } from "../types.js";
import { resolveAndReplaceTweetTextLinks } from "../../../clients/twitter/utils.js";

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
      maxResults: 100,
      paginationToken,
    });
  } catch (error) {
    console.error(`Error fetching tweets: ${error}`);
    return undefined;
  }
}

async function resolveTweetsWithUrls(
  tweets: TweetV2[],
): Promise<TweetV2WithURLs[]> {
  const resolvedTweets: TweetV2WithURLs[] = [];

  for (const tweet of tweets) {
    const tweetText = tweet.note_tweet?.text || tweet.text || "";
    if (!tweetText) {
      continue;
    }

    const contentAndUrls = await resolveAndReplaceTweetTextLinks(tweetText);

    if (tweet.note_tweet?.text) {
      resolvedTweets.push({
        ...tweet,
        note_tweet: {
          ...tweet.note_tweet,
          text: contentAndUrls.content,
        },
        external_urls: contentAndUrls.externalUrls,
      });
    } else {
      if (tweet.note_tweet?.text) {
        resolvedTweets.push({
          ...tweet,
          text: contentAndUrls.content,
          external_urls: contentAndUrls.externalUrls,
        });
      }
    }
  }

  return resolvedTweets;
}

export async function twitterLoader(): Promise<TweetV2WithURLs[]> {
  const client = TwitterClient.fromBasicTwitterAuth();

  // Initialize variables for pagination
  let paginationToken: string | undefined;
  let allTweets: TweetV2WithURLs[] = [];
  let requestCount = 0;
  const maxRequests = 5;

  // Calculate 24 hours ago once, using the provided current time
  const oneDayAgo = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
  const oneDayAgoUTC = new Date(oneDayAgo.toISOString());

  while (requestCount < maxRequests) {
    requestCount += 1;

    const tweets = await fetchListTweetsWrapper(client, paginationToken);
    if (tweets === undefined || !tweets?.data?.data?.length) {
      // No more tweets to fetch
      break;
    }

    const filteredTweets: TweetV2[] = tweets?.data.data.filter(
      (tweet) =>
        tweet.created_at && createdAtAfter(tweet.created_at, oneDayAgoUTC),
    );
    const tweetsWithUrls: TweetV2WithURLs[] =
      await resolveTweetsWithUrls(filteredTweets);

    allTweets = [...allTweets, ...tweetsWithUrls];

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
