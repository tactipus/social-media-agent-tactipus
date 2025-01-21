import { Client } from "@langchain/langgraph-sdk";
import { CurateDataState } from "../state.js";
import { getTweetLink } from "../../../clients/twitter/utils.js";
import { POST_TO_LINKEDIN_ORGANIZATION } from "../../generate-post/constants.js";
import { getUrlType, shouldPostToLinkedInOrg } from "../../utils.js";
import { LangGraphRunnableConfig } from "@langchain/langgraph";

function getAfterSecondsFromLinks(links: string[]): {
  link: string;
  afterSeconds: number;
}[] {
  const baseDelaySeconds = 30;
  return links.map((link, index) => {
    const isTwitterUrl = getUrlType(link) === "twitter";
    const additionalDelay = isTwitterUrl ? baseDelaySeconds : 0;
    const afterSeconds = index * baseDelaySeconds + additionalDelay;
    return {
      link,
      afterSeconds,
    };
  });
}

export async function generatePostsSubgraph(
  state: CurateDataState,
  config: LangGraphRunnableConfig,
): Promise<Partial<CurateDataState>> {
  const postToLinkedInOrg = shouldPostToLinkedInOrg(config);

  const client = new Client({
    apiUrl: `http://localhost:${process.env.PORT}`,
  });

  const twitterURLs = state.rawTweets.flatMap((t) =>
    t.author_id ? [getTweetLink(t.author_id, t.id)] : [],
  );
  const redditURLs = state.rawRedditPosts.map((p) => p.post.url);

  const afterSecondsList = getAfterSecondsFromLinks([
    ...twitterURLs,
    ...redditURLs,
    ...state.rawTrendingRepos,
  ]);

  for (const { link, afterSeconds } of afterSecondsList) {
    const { thread_id } = await client.threads.create();
    // TODO: Handle return value
    await client.runs.create(thread_id, "generate_post", {
      input: {
        links: [link],
      },
      config: {
        configurable: {
          [POST_TO_LINKEDIN_ORGANIZATION]: postToLinkedInOrg,
        },
      },
      afterSeconds,
    });
  }

  return {};
}
