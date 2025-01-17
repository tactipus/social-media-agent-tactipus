import { extractUrls } from "../../utils.js";
import { VerifyRedditGraphState } from "../types.js";

export async function getExternalUrls(
  state: VerifyRedditGraphState,
): Promise<Partial<VerifyRedditGraphState>> {
  if (!state.redditPost) {
    throw new Error("No reddit post found");
  }
  const urls = extractUrls(state.redditPost.post.selftext);
  return {
    externalURLs: urls,
  };
}
