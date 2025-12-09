var express = require('express');
var router = express.Router();
var Service = require('../service/checkHealthService');
var service = new Service();

router.get('/check', async function (req, res) {
  const url = process.env.URL_CHECK_WEB;
  console.log('quy', url);

  if (!url) {
    return res.status(400).json({ error: "Thiếu URL để kiểm tra" });
  }

  const result = await service.checkWebsite(url);
  res.json(result);
});

module.exports = router;
