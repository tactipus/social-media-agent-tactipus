import { VerifyTweetAnnotation } from "../verify-tweet-state.js";
import { extractTweetId, extractUrls } from "../../utils.js";
import { TwitterClient } from "../../../clients/twitter/client.js";
import { resolveTwitterUrl } from "../../../clients/twitter/utils.js";

export async function getTweetContent(
  state: typeof VerifyTweetAnnotation.State,
) {
  const tweetId = extractTweetId(state.link);
  if (!tweetId) {
    return {};
  }

  let twitterClient: TwitterClient;
  const useArcadeAuth = process.env.USE_ARCADE_AUTH;
  const useTwitterApiOnly = process.env.USE_TWITTER_API_ONLY;

  if (useTwitterApiOnly === "true" || useArcadeAuth !== "true") {
    twitterClient = TwitterClient.fromBasicTwitterAuth();
  } else {
    const twitterUserId = process.env.TWITTER_USER_ID;
    if (!twitterUserId) {
      throw new Error("Twitter user ID not found in configurable fields.");
    }

    const twitterToken = process.env.TWITTER_USER_TOKEN;
    const twitterTokenSecret = process.env.TWITTER_USER_TOKEN_SECRET;

    twitterClient = await TwitterClient.fromArcade(twitterUserId, {
      twitterToken,
      twitterTokenSecret,
    });
  }

  const tweetContent = await twitterClient.getTweet(tweetId);
  const mediaUrls: string[] =
    tweetContent.includes?.media
      ?.filter((m) => (m.url && m.type === "photo") || m.type.includes("gif"))
      .flatMap((m) => (m.url ? [m.url] : [])) || [];

  let tweetContentText = "";
  if (tweetContent.data.note_tweet?.text) {
    tweetContentText = tweetContent.data.note_tweet.text;
  } else {
    tweetContentText = tweetContent.data.text;
  }

  // Extract any links from inside the tweet content.
  // Then, fetch the content of those links to include in the main content.
  const urlsInTweet = extractUrls(tweetContentText);

  if (!urlsInTweet.length) {
    return {
      tweetContent: tweetContentText,
      imageOptions: mediaUrls,
    };
  }

  const cleanedUrls = (
    await Promise.all(
      urlsInTweet.map(async (url) => {
        if (
          !url.includes("https://t.co") &&
          !url.includes("https://x.com") &&
          !url.includes("https://twitter.com")
        ) {
          return url;
        }
        const resolvedUrl = await resolveTwitterUrl(url);
        if (
          !resolvedUrl ||
          resolvedUrl.includes("https://t.co") ||
          resolvedUrl.includes("https://twitter.com") ||
          resolvedUrl.includes("https://x.com")
        ) {
          // Do not return twitter URLs.
          return [];
        }
        return resolvedUrl;
      }),
    )
  ).flat();

  return {
    tweetContent: tweetContentText,
    tweetContentUrls: cleanedUrls,
    imageOptions: mediaUrls,
  };
}
