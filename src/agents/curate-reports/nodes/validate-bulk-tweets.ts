import { ChatAnthropic } from "@langchain/anthropic";
import { CurateReportsState } from "../state.js";
import { z } from "zod";
import { SavedTweet } from "../types.js";
import { chunkArray } from "../../utils.js";

const VALIDATE_BULK_TWEETS_PROMPT = `You are an AI assistant tasked with curating a dataset of tweets about AI. Your job is to review a series of tweets and determine which ones are relevant to AI, LLMs, and related topics. The tweets are provided from a 'Twitter List' of users who primarily tweet about AI.

Here are the rules for determining whether a tweet is relevant:
1. The tweet discusses AI, LLMs, or anything interesting related to AI.
2. The tweet is a retweet of content about AI, LLMs, or anything interesting related to AI.
3. The tweet mentions a research paper on AI, LLMs, or related topics.
4. The tweet is about a new product, tool, or service related to AI, LLMs, or anything interesting related to AI.
5. The tweet references a blog post, video, or other content related to AI, LLMs, or anything interesting related to AI.

Additionally, ensure that the tweet has enough content to be interesting and engaging. Avoid short tweets that merely reference AI without providing substantial information that could be used to create longer content or posts about AI.

You will be provided with a list of tweets, each associated with an index number. Your task is to analyze these tweets and identify which ones are relevant according to the rules above.

Here are the tweets to analyze:

<tweets>
{TWEETS}
</tweets>

Use a scratchpad to analyze each tweet. In your scratchpad, briefly explain why each tweet is relevant or not relevant based on the rules provided. Then, create a list of the index numbers for the relevant tweets.

<scratchpad>
[Analyze each tweet here, explaining your reasoning]
</scratchpad>

After your analysis, provide your final answer to the 'answer' tool.

Begin!`;

const answerSchema = z
  .object({
    answer: z
      .array(z.number())
      .describe("The index numbers of the relevant tweets."),
  })
  .describe("Your final answer to what tweets are relevant.");

function formatTweets(tweets: SavedTweet[]): string {
  return tweets
    .map((t, index) => `<tweet index="${index}">\n${t.fullText}\n</tweet>`)
    .join("\n");
}

/**
 * Validates a batch of tweets to determine which ones are relevant to AI-related topics.
 * This function processes tweets in chunks of 25 and uses Claude 3 Sonnet to analyze each tweet
 * against a set of predefined relevance criteria.
 *
 * The relevance criteria includes:
 * - Discussions about AI, LLMs, or AI-related topics
 * - Retweets of AI-related content
 * - Mentions of AI research papers
 * - Information about AI products, tools, or services
 * - References to AI-related blog posts, videos, or other content
 *
 * @param {CurateReportsState} state - The current state containing tweets to be validated
 * @returns {Promise<Partial<CurateReportsState>>} A promise that resolves to an updated state
 *                                                 containing only the relevant tweets
 */
export async function validateBulkTweets(
  state: CurateReportsState,
): Promise<Partial<CurateReportsState>> {
  const model = new ChatAnthropic({
    model: "claude-3-5-sonnet-latest",
    temperature: 0,
  }).withStructuredOutput(answerSchema, { name: "answer" });

  // Chunk the tweets into groups of 25
  const chunkedTweets = chunkArray(state.tweets, 25);
  const allRelevantTweets: SavedTweet[] = [];

  for (const chunk of chunkedTweets) {
    console.log("Starting chunk");
    const formattedPrompt = VALIDATE_BULK_TWEETS_PROMPT.replace(
      "{TWEETS}",
      formatTweets(chunk),
    );

    const { answer } = await model.invoke([["user", formattedPrompt]]);

    const answerSet = new Set(answer);
    console.log("answerSet", Array.from(answerSet));
    const relevantTweets = chunk.filter((_, index) => answerSet.has(index));
    allRelevantTweets.push(...relevantTweets);
  }

  return {
    tweets: allRelevantTweets,
  };
}
