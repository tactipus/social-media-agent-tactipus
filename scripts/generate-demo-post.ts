import "dotenv/config";
import { Client } from "@langchain/langgraph-sdk";
import { TEXT_ONLY_MODE } from "../src/agents/generate-post/constants.js";

/**
 * Generate a post based on a LangChain blog post.
 * This may be modified to generate posts for other content.
 */
async function invokeGraph() {
  const link = "https://x.com/";

  const client = new Client({
    apiUrl: process.env.LANGGRAPH_API_URL || "http://localhost:2024",
  });

  const { thread_id } = await client.threads.create();
  await client.runs.create(thread_id, "generate_post", {
    input: {
      links: [link],
    },
    config: {
      configurable: {
        // By default, the graph will read these values from the environment
        // [TWITTER_USER_ID]: process.env.TWITTER_USER_ID,
        // [LINKEDIN_USER_ID]: process.env.LINKEDIN_USER_ID,
        // This ensures the graph runs in a basic text only mode.
        // If you followed the full setup instructions, you may remove this line.
        [TEXT_ONLY_MODE]: true,
      },
    },
  });
}

invokeGraph().catch(console.error);
