import { extractUrls, getUrlType } from "../../utils.js";
import { VerifyRedditGraphState } from "../types.js";

export async function getExternalUrls(
  state: VerifyRedditGraphState,
): Promise<Partial<VerifyRedditGraphState>> {
  if (!state.redditPost) {
    throw new Error("No reddit post found");
  }
  const urls = extractUrls(state.redditPost.post.selftext);
  const filteredUrls = urls.filter((url) => getUrlType(url) !== "reddit");
  return {
    externalURLs: filteredUrls,
  };
}
