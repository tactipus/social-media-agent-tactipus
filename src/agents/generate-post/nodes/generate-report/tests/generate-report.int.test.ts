import "dotenv/config";
import fs from "fs/promises";
import { test } from "@jest/globals";
import { generateContentReport } from "../index.js";

test("Can generate reports", async () => {
  const introducing_openai_o1 = await fs.readFile(
    "src/agents/generate-post/nodes/generate-report/tests/data/introducing_openai_o1.txt",
    "utf-8",
  );
  const o1_isnt_chat_model = await fs.readFile(
    "src/agents/generate-post/nodes/generate-report/tests/data/o1_isnt_chat_model.txt",
    "utf-8",
  );
  const o1_thoughts_scale_ai = await fs.readFile(
    "src/agents/generate-post/nodes/generate-report/tests/data/o1_thoughts_scale_ai.txt",
    "utf-8",
  );
  const openai_o1_vs_recent_leetcode_questions = await fs.readFile(
    "src/agents/generate-post/nodes/generate-report/tests/data/openai_o1_vs_recent_leetcode_questions.txt",
    "utf-8",
  );
  const thoughts_on_openai_o1 = await fs.readFile(
    "src/agents/generate-post/nodes/generate-report/tests/data/thoughts_on_openai_o1.txt",
    "utf-8",
  );

  console.log("STARTING REPORTS");
  const introducing_openai_o1_report = (
    await generateContentReport(
      {
        pageContents: [introducing_openai_o1],
      } as any,
      {},
    )
  ).report;
  console.log("introducing_openai_o1_report");

  const o1_isnt_chat_model_report = (
    await generateContentReport(
      {
        pageContents: [o1_isnt_chat_model],
      } as any,
      {},
    )
  ).report;

  console.log("o1_isnt_chat_model_report");

  const o1_thoughts_scale_ai_report = (
    await generateContentReport(
      {
        pageContents: [o1_thoughts_scale_ai],
      } as any,
      {},
    )
  ).report;
  console.log("o1_thoughts_scale_ai_report");

  const openai_o1_vs_recent_leetcode_questions_report = (
    await generateContentReport(
      {
        pageContents: [openai_o1_vs_recent_leetcode_questions],
      } as any,
      {},
    )
  ).report;

  console.log("openai_o1_vs_recent_leetcode_questions_report");

  const thoughts_on_openai_o1_report = (
    await generateContentReport(
      {
        pageContents: [thoughts_on_openai_o1],
      } as any,
      {},
    )
  ).report;

  console.log("thoughts_on_openai_o1_report");

  await fs.writeFile(
    "src/agents/generate-post/nodes/generate-report/tests/data/reports.json",
    JSON.stringify([
      introducing_openai_o1_report,
      o1_isnt_chat_model_report,
      o1_thoughts_scale_ai_report,
      openai_o1_vs_recent_leetcode_questions_report,
      thoughts_on_openai_o1_report,
    ]),
  );
});
