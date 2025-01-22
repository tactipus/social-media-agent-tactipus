import { VerifyTweetAnnotation } from "../verify-tweet-state.js";
import { extractTweetId, extractUrls } from "../../utils.js";
import { TwitterClient } from "../../../clients/twitter/client.js";
import { resolveTwitterUrl } from "../../../clients/twitter/utils.js";
import { delayRun } from "../../../utils/delay-run.js";
import { TweetV2SingleResult } from "twitter-api-v2";
import { LangGraphRunnableConfig } from "@langchain/langgraph";

export async function getTweetContent(
  state: typeof VerifyTweetAnnotation.State,
  config: LangGraphRunnableConfig,
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

  let tweetContent: TweetV2SingleResult | undefined;

  try {
    tweetContent = await twitterClient.getTweet(tweetId);
  } catch (e: any) {
    console.error("Failed to get tweet content", e);
    const graphDelayed = config.configurable?.graphDelayed;
    if (graphDelayed) {
      // Graph already has been delayed. Do not attempt to delay again.
      throw new Error(
        "Failed to fetch tweet. Graph already delayed." + e.message,
      );
    }

    const { thread_id, assistant_id, run_id, ...restOfConfigurable } =
      config.configurable || {};
    if (!thread_id || !assistant_id || !run_id) {
      console.warn(
        "Can not delay run because one of thread_id, assistant_id, run_id is missing.",
        {
          thread_id,
          assistant_id,
          run_id,
        },
      );
      throw new Error(
        "Failed to fetch tweet. One of thread_id, assistant_id, run_id is missing." +
          `thread_id: ${thread_id}, assistant_id: ${assistant_id}, run_id: ${run_id}` +
          "Error message:" +
          e.message,
      );
    }
    await delayRun({
      seconds: 60 * 15, // 15 min delay for Twitter API rate limits
      resumeNode: "verifyTweetSubGraph",
      threadId: thread_id,
      assistantId: assistant_id,
      runId: run_id,
      state: {
        // Since we're resuming from the start of the subgraph, only pass the input the subgraph expects.
        link: state.link,
      },
      configurable: {
        ...restOfConfigurable,
        graphDelayed: true,
      },
    });
    return {};
  }

  if (!tweetContent) {
    throw new Error("Failed to get tweet content");
  }

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
