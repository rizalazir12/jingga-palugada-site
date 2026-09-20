// Fungsi ini jalan di server (Netlify Functions), bukan di browser klien.
// Tujuannya: ambil data jasa dari Notion, simpan sementara di cache,
// supaya traffic ramai gak langsung nembak API Notion tiap kunjungan
// (Notion rate limit ~3 request/detik dibagi ke SEMUA pengunjung situs).

const { Client } = require("@notionhq/client");

// Cache di memori. CATATAN JUJUR: ini bukan cache yang dijamin selalu ada —
// kalau serverless function "cold start" (gak dipanggil beberapa saat),
// cache ini reset dan fetch pertama abis cold start tetap manggil Notion.
// Tapi selama traffic terus mengalir, instance function biasanya "warm"
// dan cache ini efektif menyerap sebagian besar request.
let cache = { data: null, timestamp: 0 };
const CACHE_DURATION_MS = 3 * 60 * 1000; // 3 menit — sesuaikan sesuai kebutuhan

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
      database_id: process.env.NOTION_DATABASE_ID,
    });

    const services = response.results.map((page) => {
      const props = page.properties;
      return {
        id: page.id,
        nama: props.Nama?.title?.[0]?.plain_text || "",
        kategori: props.Kategori?.select?.name || "",
        harga: props.Harga?.rich_text?.[0]?.plain_text || "",
        deskripsi: props.Deskripsi?.rich_text?.[0]?.plain_text || "",
        radius: props.Radius?.rich_text?.[0]?.plain_text || "",
        foto:
          props.Foto?.files?.[0]?.file?.url ||
          props.Foto?.files?.[0]?.external?.url ||
          "",
      };
    });

    cache = { data: services, timestamp: now };
    return { statusCode: 200, headers, body: JSON.stringify(services) };
  } catch (err) {
    // Kalau Notion gagal (rate limit, error, dll) tapi kita masih punya
    // cache lama, lebih baik tampilin data agak basi daripada situs error.
    if (cache.data) {
      return { statusCode: 200, headers, body: JSON.stringify(cache.data) };
    }
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Gagal ambil data dari Notion", detail: err.message }),
    };
  }
};
