import * as cheerio from "cheerio";
import {
  getLatentSpaceLinks,
  putLatentSpaceLinks,
} from "../utils/latent-space-links.js";
import { LangGraphRunnableConfig } from "@langchain/langgraph";

export async function latentSpaceLoader(config: LangGraphRunnableConfig) {
  const siteMapUrl = "https://www.latent.space/sitemap/2025";

  const links = await fetch(siteMapUrl)
    .then((response) => response.text())
    .then((html) => {
      const $ = cheerio.load(html);

      const links = $(".sitemap-link")
        .map((_, element) => $(element).attr("href"))
        .get();

      return links;
    });

  const processedLinks = new Set(await getLatentSpaceLinks(config));
  const newLinks = Array.from(
    new Set(links.filter((link) => !processedLinks.has(link))),
  );
  const allLinks = [...processedLinks, ...newLinks];

  await putLatentSpaceLinks(allLinks, config);

  return newLinks;
}
