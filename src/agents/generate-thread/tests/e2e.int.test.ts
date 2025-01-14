import fs from "fs";
import * as ls from "langsmith/jest";
import { generateThreadGraph } from "../index.js";
import { type SimpleEvaluator } from "langsmith/jest";

/**
 * Links:
 * https://www.reddit.com/r/LocalLLaMA/comments/1fmketf/openai_o1_vs_recent_leetcode_questions.json
 * https://www.latent.space/p/o1-skill-issue
 * https://scale.com/blog/first-impression-openai-o1
 * https://openai.com/index/introducing-openai-o1-preview/
 * https://www.reddit.com/r/dataengineering/comments/1ffeo0g/thoughts_on_openai_o1.json
 */

const reports: string[] = JSON.parse(
  fs.readFileSync(
    "src/agents/generate-post/nodes/generate-report/tests/data/reports.json",
    "utf-8",
  ),
);

const threadEvaluator: SimpleEvaluator = () => {
  return {
    key: "thread_generation",
    score: 1,
  };
};

ls.describe("SMA - Generate Thread", () => {
  ls.test(
    "Can generate a thread on O1",
    // You can pass an "iterations" parameter or other LS config here if desired
    {
      inputs: { reports },
      expected: { foo: true },
    },
    async ({ inputs }) => {
      // Import and run your app, or some part of it here
      // This dummy example just returns your expected output
      const result = await generateThreadGraph.invoke(inputs);
      console.log(result.threadPosts.map((p) => p.text).join("\n---\n"));
      await ls.expect(result).evaluatedBy(threadEvaluator).toBe(1);
      return result;
    },
  );
});
