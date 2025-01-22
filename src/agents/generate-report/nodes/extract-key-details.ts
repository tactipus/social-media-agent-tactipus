import { ChatOpenAI } from "@langchain/openai";
import { GenerateReportState } from "../state.js";
import { EXTRACT_KEY_DETAILS_PROMPT } from "../prompts.js";
import { TweetsGroupedByContent } from "../../curate-data/types.js";

const formatKeyDetailsPrompt = (
  pageContents: string[],
  tweetGroup: TweetsGroupedByContent | undefined,
): string => {
  let tweetGroupText = "";
  if (tweetGroup) {
    tweetGroupText = `Here is a group of tweets I extracted which are relevant to this content:
<tweet-group>
${tweetGroup.explanation}

${tweetGroup.tweets
  .map((tweet) => {
    const tweetText = tweet.note_tweet?.text || tweet.text || "";
    return `<tweet>\n${tweetText}\n</tweet>`;
  })
  .join("\n\n")}
</tweet-group>
`;
  }

  return `The following text contains summaries, or entire pages from the content I submitted to you. Please review the content and extract ALL of the key details from it.
${pageContents.map((content, index) => `<Content index={${index + 1}}>\n${content}\n</Content>`).join("\n\n")}

${tweetGroupText}`;
};

export async function extractKeyDetails(
  state: GenerateReportState,
): Promise<Partial<GenerateReportState>> {
  const keyDetailsPrompt = formatKeyDetailsPrompt(
    state.pageContents,
    state.tweetGroup,
  );

  const model = new ChatOpenAI({
    model: "o1",
    streaming: false,
  });

  const keyDetailsRes = await model.invoke([
    {
      role: "system",
      content: EXTRACT_KEY_DETAILS_PROMPT,
    },
    {
      role: "user",
      content: keyDetailsPrompt,
    },
  ]);

  return {
    keyReportDetails: keyDetailsRes.content as string,
  };
}
