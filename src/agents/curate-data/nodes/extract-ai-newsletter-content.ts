import { FireCrawlLoader } from "@langchain/community/document_loaders/web/firecrawl";
import { CurateDataState } from "../state.js";
import { extractTweetId, extractUrls, getUrlType, sleep } from "../../utils.js";
import { RedditPostsWithExternalData } from "../../verify-reddit-post/types.js";
import { TwitterClient } from "../../../clients/twitter/client.js";
import { TweetV2 } from "twitter-api-v2";
import { RedditClient } from "../../../clients/reddit/client.js";
import { SimpleRedditPostWithComments } from "../../../clients/reddit/types.js";

function checkTwitterURLExists(url: string, validatedTweets: TweetV2[]) {
  const tweetId = extractTweetId(url);

  return validatedTweets.some((tweet) => tweet.id === tweetId);
}

function checkRedditURLExists(
  url: string,
  redditPosts: RedditPostsWithExternalData[],
): boolean {
  return redditPosts.some((post) => post.post.url === url);
}

// MUST BE CALLED BEFORE GENERATING TWITTER GROUPS, AND BEFORE VERIFYING REDDIT POSTS
export async function extractAINewsletterContent(
  state: CurateDataState,
): Promise<Partial<CurateDataState>> {
  const relevantTwitterURLs: string[] = [];
  const relevantRedditURLs: string[] = [];
  const arxivURLs: string[] = [];

  for await (const url of state.aiNewsPosts) {
    const loader = new FireCrawlLoader({
      url,
      mode: "scrape",
      params: {
        formats: ["markdown"],
      },
    });

    const docs = await loader.load();

    const docsText = docs.map((d) => d.pageContent).join("\n");

    const urls = extractUrls(docsText);

    const twitterURLsInText = urls
      .filter((url) => getUrlType(url) === "twitter")
      .filter((url) => !checkTwitterURLExists(url, state.validatedTweets));
    relevantTwitterURLs.push(...twitterURLsInText);

    const redditURLsInText = urls
      // Do not include media links
      .filter((url) => getUrlType(url) === "reddit" && !url.includes("/media"))
      .filter((url) => !checkRedditURLExists(url, state.redditPosts));
    relevantRedditURLs.push(...redditURLsInText);

    arxivURLs.push(
      ...urls.filter(
        (url) =>
          getUrlType(url, { includeArxiv: true }) === "arxiv" &&
          url.includes("arxiv.org/"),
      ),
    );
  }

  const tweets: TweetV2[] = [];
  const twitterClient = TwitterClient.fromBasicTwitterAuth();
  for await (const twitterURL of relevantTwitterURLs) {
    // Sleep for 30/s between requests to avoid rate limits
    await sleep(30000);
    const tweetId = extractTweetId(twitterURL);
    if (!tweetId) {
      console.warn("Failed to extract tweet ID from URL:", twitterURL);
      continue;
    }
    const tweetContent = await twitterClient.getTweet(tweetId);
    tweets.push(tweetContent.data);
  }

  const redditPosts: SimpleRedditPostWithComments[] = [];
  const client = await RedditClient.fromUserless();
  for await (const redditURL of relevantRedditURLs) {
    const post = await client.getPostByURL(redditURL);
    const comments = await client.getPostComments(post.id, {
      limit: 10, // default
      depth: 3, // default
    });
    redditPosts.push({
      post: client.simplifyPost(post),
      comments: comments.map(client.simplifyComment),
    });
  }

  return {
    validatedTweets: [...state.validatedTweets, ...tweets],
    rawRedditPosts: [...state.rawRedditPosts, ...redditPosts],
  };
}
