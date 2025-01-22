import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { GeneratePostAnnotation } from "../../generate-post-state.js";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import {
  EXTRACT_KEY_DETAILS_PROMPT,
  GENERATE_REPORT_PROMPT,
  GENERATE_REPORT_PROMPT_O1,
} from "./prompts.js";

/**
 * Parse the LLM generation to extract the report from inside the <report> tag.
 * If the report can not be parsed, the original generation is returned.
 * @param generation The text generation to parse
 * @returns The parsed generation, or the unmodified generation if it cannot be parsed
 */
function parseGeneration(generation: string): string {
  const reportMatch = generation.match(/<report>([\s\S]*?)<\/report>/);
  if (!reportMatch) {
    console.warn(
      "Could not parse report from generation:\nSTART OF GENERATION\n\n",
      generation,
      "\n\nEND OF GENERATION",
    );
  }
  return reportMatch ? reportMatch[1].trim() : generation;
}

const formatReportPrompt = (pageContents: string[]): string => {
  return `The following text contains summaries, or entire pages from the content I submitted to you. Please review the content and generate a report on it.
${pageContents.map((content, index) => `<Content index={${index + 1}}>\n${content}\n</Content>`).join("\n\n")}`;
};

const formatKeyDetailsPrompt = (pageContents: string[]): string => {
  return `The following text contains summaries, or entire pages from the content I submitted to you. Please review the content and extract ALL of the key details from it.
${pageContents.map((content, index) => `<Content index={${index + 1}}>\n${content}\n</Content>`).join("\n\n")}`;
};

async function generateReportWithO1(
  state: typeof GeneratePostAnnotation.State,
) {
  const prompt = formatReportPrompt(state.pageContents);
  const keyDetailsPrompt = formatKeyDetailsPrompt(state.pageContents);

  const reportO1Model = new ChatOpenAI({
    model: "o1",
    streaming: false,
  });

  const keyDetails = (
    await reportO1Model.invoke([
      {
        role: "system",
        content: EXTRACT_KEY_DETAILS_PROMPT,
      },
      {
        role: "user",
        content: keyDetailsPrompt,
      },
    ])
  ).content as string;

  const formattedReportPrompt = GENERATE_REPORT_PROMPT_O1.replace(
    "{keyDetails}",
    keyDetails,
  );

  const report = await reportO1Model.invoke([
    {
      role: "system",
      content: formattedReportPrompt,
    },
    {
      role: "user",
      content: prompt,
    },
  ]);

  return {
    report: parseGeneration(report.content as string),
  };
}

export async function generateContentReport(
  state: typeof GeneratePostAnnotation.State,
  _config: LangGraphRunnableConfig,
): Promise<Partial<typeof GeneratePostAnnotation.State>> {
  if (process.env.USE_O1_REPORT_GENERATION === "true") {
    return generateReportWithO1(state);
  }

  const reportModel = new ChatAnthropic({
    model: "claude-3-5-sonnet-20241022",
    temperature: 0,
  });

  const result = await reportModel.invoke([
    {
      role: "system",
      content: GENERATE_REPORT_PROMPT,
    },
    {
      role: "user",
      content: formatReportPrompt(state.pageContents),
    },
  ]);

  return {
    report: parseGeneration(result.content as string),
  };
}
