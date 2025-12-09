const axios = require("axios");

class Service {
    async checkWebsite(url) {
        try {
            const res = await axios.get(url, { timeout: 5000 });

            return {
                ok: true,
                url,
                status: res.status,
                message: "Website hoạt động bình thường"
            };
        } catch (err) {
            if (err.response) {
                return {
                    ok: false,
                    url,
                    status: err.response.status,
                    message: `Website trả về mã lỗi ${err.response.status}`
                };
            }

            if (err.request) {
                return {
                    ok: false,
                    url,
                    status: null,
                    message: "Không truy cập được (timeout hoặc mất kết nối)"
                };
            }

            return {
                ok: false,
                url,
                status: null,
                message: `Lỗi khác: ${err.message}`
            };
        }
    }
}

module.exports = Service;
