const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");

const sendErrorEmail = require("./sendMailTrap");

const SITES_FILE = path.join(__dirname, "../health_sites.json");
const STATE_FILE = path.join(__dirname, "../health_state.json");

class Service {
  async getUrlsToCheck() {
    try {
      const data = await fs.readFile(SITES_FILE, "utf-8");
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async getState(url) {
    try {
      const data = await fs.readFile(STATE_FILE, "utf-8");
      const states = JSON.parse(data);
      return states[url] || "UP";
    } catch {
      return "UP";
    }
  }

  async setState(url, state) {
    try {
      let states = {};
      try {
        const data = await fs.readFile(STATE_FILE, "utf-8");
        states = JSON.parse(data);
      } catch { }

      states[url] = state;
      states[`${url}_lastUpdate`] = new Date().toISOString();

      await fs.writeFile(
        STATE_FILE,
        JSON.stringify(states, null, 2),
        "utf-8"
      );
    } catch (err) {
      console.error("Lỗi khi ghi file trạng thái:", err.message);
    }
  }

  async checkWebsite(url) {
    const previousState = await this.getState(url);

    try {
      const res = await axios.get(url, {
        timeout: 5000,
        validateStatus: () => true,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml",
        },
      });

      if (res.status >= 200 && res.status < 400) {
        if (previousState === "DOWN") {
          await sendErrorEmail(
            `✅ Website phục hồi: ${url}`,
            `Website đã hoạt động trở lại (HTTP ${res.status})`,
            url,
            "recovery"
          );
        }

        await this.setState(url, "UP");

        return {
          ok: true,
          url,
          status: res.status,
          prevState: previousState,
          newState: "UP",
          message:
            previousState === "DOWN"
              ? "Website đã phục hồi"
              : "Website hoạt động bình thường",
        };
      }

      throw { response: res };
    } catch (err) {
      let message = "";
      let subject = "";

      if (err.response) {
        message = `Website trả về mã lỗi ${err.response.status}`;
        subject = `Website lỗi: ${url} - HTTP ${err.response.status}`;
      } else if (err.request) {
        message = "Không truy cập được (timeout hoặc mất kết nối)";
        subject = `Website lỗi: ${url} - Lỗi kết nối`;
      } else {
        message = `Lỗi khác: ${err.message}`;
        subject = `Website lỗi: ${url} - ${err.message}`;
      }

      if (previousState === "UP") {
        await sendErrorEmail(subject, message, url, "error");
      }

      await this.setState(url, "DOWN");

      return {
        ok: false,
        url,
        status: err.response ? err.response.status : null,
        prevState: previousState,
        newState: "DOWN",
        mailed: previousState === "UP",
        message,
      };
    }
  }

  async checkAll() {
    const urls = await this.getUrlsToCheck();
    const results = [];

    for (const url of urls) {
      results.push(await this.checkWebsite(url));
    }

    return results;
  }
}

module.exports = Service;
