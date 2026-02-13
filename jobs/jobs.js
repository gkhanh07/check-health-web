const cron = require("node-cron");
const Service = require("../service/checkHealthService");
const fs = require("fs").promises;
const path = require("path");

const service = new Service();
const SITES_FILE = path.join(__dirname, "../health_sites.json");

async function getUrls() {
  try {
    const data = await fs.readFile(SITES_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function startHealthCheckJob() {
  cron.schedule("*/10 * * * * *", async () => {
    console.log("[HealthCheck] Bắt đầu kiểm tra:", new Date().toISOString());
    const urls = await getUrls();
    for (const url of urls) {
      const result = await service.checkWebsite(url);
    }
  });
  console.log("Health-check job started.");
}

module.exports = startHealthCheckJob;
