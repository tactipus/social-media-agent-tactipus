import { ChatOpenAI } from "@langchain/openai";
import { GenerateReportState } from "../state.js";
import { GENERATE_REPORT_PROMPT_O1 } from "../prompts.js";

const formatReportPrompt = (pageContents: string[]): string => {
  return `The following text contains summaries, or entire pages from the content I submitted to you. Please review the content and generate a report on it.
${pageContents.map((content, index) => `<Content index={${index + 1}}>\n${content}\n</Content>`).join("\n\n")}`;
};

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

export async function generateReport(
  state: GenerateReportState,
): Promise<Partial<GenerateReportState>> {
  if (!state.pageContents?.length) {
    throw new Error(
      "No page contents found. pageContents must be defined to generate a report.",
    );
  }
  const prompt = formatReportPrompt(state.pageContents);

  const reportO1Model = new ChatOpenAI({
    model: "o1",
    streaming: false,
  });

  const formattedReportPrompt = GENERATE_REPORT_PROMPT_O1.replace(
    "{keyDetails}",
    state.keyReportDetails,
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
    reports: [
      {
        report: parseGeneration(report.content as string),
        keyDetails: state.keyReportDetails,
      },
    ],
  };
}
