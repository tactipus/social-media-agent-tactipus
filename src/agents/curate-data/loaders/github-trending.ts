import { LangGraphRunnableConfig } from "@langchain/langgraph";
import {
  getGitHubRepoURLs,
  putGitHubRepoURLs,
} from "../utils/stores/github-repos.js";
import { getUniqueArrayItems } from "../utils/get-unique-array.js";
import * as cheerio from "cheerio";
import { Octokit } from "@octokit/rest";

const TYPESCRIPT_TRENDING_URL =
  "https://github.com/trending/typescript?since=daily";
const PYTHON_TRENDING_URL = "https://github.com/trending/python?since=daily";

// Check github dependabot for depending on langchain
// Check for github langchain tags
export async function githubTrendingLoader(config: LangGraphRunnableConfig) {
  const fetchRepos = async (url: string) => {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    return $("h2.h3.lh-condensed")
      .map((_, element) => {
        const repoPath = $(element).find("a").attr("href");
        return repoPath ? `https://github.com${repoPath}` : null;
      })
      .get()
      .filter((url): url is string => url !== null);
  };

  const [pythonRepos, typescriptRepos] = await Promise.all([
    fetchRepos(PYTHON_TRENDING_URL),
    fetchRepos(TYPESCRIPT_TRENDING_URL),
  ]);

  const processedRepos = await getGitHubRepoURLs(config);
  const uniqueRepos = getUniqueArrayItems(processedRepos, [
    ...pythonRepos,
    ...typescriptRepos,
  ]);
  const allRepos = Array.from(new Set([...processedRepos, ...uniqueRepos]));

  await putGitHubRepoURLs(allRepos, config);

  return uniqueRepos;
}

export async function getLangChainGitHubRepos(config: LangGraphRunnableConfig) {
  const octokit = new Octokit();
  const processedRepos = await getGitHubRepoURLs(config);
  let newRepoUrls: string[] = [];
  let page = 1;
  const maxAttempts = 5;

  while (newRepoUrls.length < 5 && page <= maxAttempts) {
    const [langchainData, langgraphData] = await Promise.all([
      octokit.search.repos({
        q: "topic:langchain",
        sort: "stars",
        order: "desc",
        per_page: 100,
        page,
      }),
      octokit.search.repos({
        q: "topic:langgraph",
        sort: "stars",
        order: "desc",
        per_page: 100,
        page,
      }),
    ]);

    const repoUrls = [
      ...langchainData.data.items.map((repo) => repo.html_url),
      ...langgraphData.data.items.map((repo) => repo.html_url),
    ];

    // Filter out already processed repos
    const unprocessedUrls = repoUrls.filter(
      (url) => !processedRepos.includes(url),
    );
    newRepoUrls = [...new Set([...newRepoUrls, ...unprocessedUrls])];
    page += 1;

    if (
      langchainData.data.items.length === 0 &&
      langgraphData.data.items.length === 0
    ) {
      break; // No more results available from either search
    }
  }

  return newRepoUrls;
}
