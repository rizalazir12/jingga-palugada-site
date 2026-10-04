// Sama pola kayak get-services.js & get-testimonials.js — ambil data dari
// database Notion terpisah khusus galeri hasil kerja, dengan cache.

const { Client } = require("@notionhq/client");

let cache = { data: null, timestamp: 0 };
const CACHE_DURATION_MS = 3 * 60 * 1000; // 3 menit

exports.handler = async function (event) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  const now = Date.now();
  if (cache.data && now - cache.timestamp < CACHE_DURATION_MS) {
    return { statusCode: 200, headers, body: JSON.stringify(cache.data) };
  }

  try {
    const notion = new Client({ auth: process.env.NOTION_TOKEN });
    const response = await notion.databases.query({
      database_id: process.env.NOTION_GALERI_DATABASE_ID,
    });

    const gallery = response.results.map((page) => {
      const props = page.properties;
      return {
        id: page.id,
        keterangan: props.Keterangan?.title?.[0]?.plain_text || "",
        gambar:
          props.Gambar?.files?.[0]?.file?.url ||
          props.Gambar?.files?.[0]?.external?.url ||
          "",
      };
    }).filter(g => g.gambar); // skip baris yang belum ada gambarnya

    cache = { data: gallery, timestamp: now };
    return { statusCode: 200, headers, body: JSON.stringify(gallery) };
  } catch (err) {
    if (cache.data) {
      return { statusCode: 200, headers, body: JSON.stringify(cache.data) };
    }
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Gagal ambil galeri dari Notion", detail: err.message }),
    };
  }
};
