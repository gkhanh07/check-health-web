const cron = require("node-cron");
const Service = require("../service/checkHealthService");
require('dotenv').config();

const service = new Service();

function startHealthCheckJob() {
    const url = process.env.URL_CHECK_WEB;

    if (!url) {
        console.error("Thiếu URL_CHECK_WEB trong .env");
        return;
    }

    // Chạy mỗi 10 phút
    cron.schedule("*/10 * * * *", async () => {
        console.log("[HealthCheck] Bắt đầu kiểm tra:", new Date().toISOString());

        const result = await service.checkWebsite(url);
        console.log("[HealthCheck Result]:", result);
    });

    console.log("Health-check job started (10 minutes interval).");
}

module.exports = startHealthCheckJob;
