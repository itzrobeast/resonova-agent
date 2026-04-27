import fetch from "node-fetch";
import cheerio from "cheerio";

export async function findSupervisors() {
  const url = "https://www.imdb.com/search/name/?job_type=music_supervisor";

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const html = await res.text();
  const $ = cheerio.load(html);

  const leads = [];

  $(".lister-item").each((i, el) => {
    const name = $(el).find("h3 a").text().trim();
    const link = "https://www.imdb.com" + $(el).find("h3 a").attr("href");

    leads.push({ name, link });
  });

  return leads;
}
