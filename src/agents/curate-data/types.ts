import { TweetV2 } from "twitter-api-v2";

export interface PageContentData {
  link: string;
  pageContent: string;
  imageUrls: string[];
}

export interface Report {
  report: string;
  link: string;
  imageUrls: string[];
}

/**
 * A list of sources to extract content from.
 * Twitter - Twitter users to fetch the last 24 hours worth of Tweets from.
 * General - A URL to scrape content from. Typically a blog or newsletter.
 * GitHub - Trending GitHub repositories. No link or username required since
 * this will only fetch trending repositories.
 */
export type Source =
  | {
      type: "twitter";
      username: string;
      link?: never;
    }
  | {
      type: "general";
      username?: never;
      link: string;
    }
  | {
      type: "github";
      username?: never;
      link?: never;
    };

export type TweetV2WithURLs = TweetV2 & {
  external_urls: string[];
};

export type GitHubTrendingData = {
  repoURL: string;
  pageContent: string;
};

export type TweetsGroupedByContent = {
  explanation: string;
  tweets: TweetV2WithURLs[];
};

export type ThreadRunId = { thread_id: string; run_id: string };
