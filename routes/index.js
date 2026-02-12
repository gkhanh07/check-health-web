var express = require('express');
var router = express.Router();
var Service = require('../service/checkHealthService');
var service = new Service();

const fs = require('fs').promises;
const path = require('path');
const SITES_FILE = path.join(__dirname, '../health_sites.json');
const STATE_FILE = path.join(__dirname, '../health_state.json');
const EMAILS_FILE = path.join(__dirname, '../health_emails.json');

router.get('/', async function (req, res) {
  let urls = [];
  let statesRaw = {};
  let emails = [];

  try {
    urls = JSON.parse(await fs.readFile(SITES_FILE, 'utf-8'));
  } catch { }

  try {
    statesRaw = JSON.parse(await fs.readFile(STATE_FILE, 'utf-8'));
  } catch { }

  try {
    emails = JSON.parse(await fs.readFile(EMAILS_FILE, 'utf-8'));
  } catch { }

  const states = urls.map(url => ({
    url,
    state: statesRaw[url] || 'UNKNOWN',
    lastUpdate: statesRaw[url + '_lastUpdate'] || ''
  }));

  res.render('index', { states, emails });
});

router.get('/check', async function (req, res) {
  if (!req.query.url) {
    return res.status(400).json({ error: 'Thiếu URL' });
  }
  res.json(await service.checkWebsite(req.query.url));
});

router.post('/check-all', async function (req, res) {
  try {
    const results = await service.checkAll();
    res.json({ ok: true, results });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});


router.post('/add-site', async function (req, res) {
  let url = req.body.url && req.body.url.trim();
  if (!url) return res.status(400).send('Thiếu URL');

  if (!url.startsWith('http')) {
    url = 'https://' + url;
  }

  let sites = [];
  try {
    sites = JSON.parse(await fs.readFile(SITES_FILE, 'utf-8'));
  } catch { }

  if (sites.length >= 10) {
    return res.status(400).send('Đã đạt giới hạn tối đa 10 website!');
  }

  if (!sites.includes(url)) {
    sites.push(url);
    await fs.writeFile(SITES_FILE, JSON.stringify(sites, null, 2));
  }

  res.redirect('/');
});

router.post('/delete-site', async function (req, res) {
  const url = req.body.url && req.body.url.trim();
  if (!url) return res.status(400).send('Thiếu URL');

  let sites = [];
  try {
    sites = JSON.parse(await fs.readFile(SITES_FILE, 'utf-8'));
  } catch { }

  sites = sites.filter(s => s !== url);
  await fs.writeFile(SITES_FILE, JSON.stringify(sites, null, 2));

  let statesRaw = {};
  try {
    statesRaw = JSON.parse(await fs.readFile(STATE_FILE, 'utf-8'));
  } catch { }
  delete statesRaw[url];
  delete statesRaw[url + '_lastUpdate'];
  await fs.writeFile(STATE_FILE, JSON.stringify(statesRaw, null, 2));

  res.redirect('/');
});


router.post('/add-email', async function (req, res) {
  const email = req.body.email && req.body.email.trim().toLowerCase();
  if (!email) return res.status(400).send('Thiếu email');

  let emails = [];
  try {
    emails = JSON.parse(await fs.readFile(EMAILS_FILE, 'utf-8'));
  } catch { }

  if (emails.length >= 3) {
    return res.status(400).send('Đã đạt giới hạn tối đa 3 email!');
  }

  if (!emails.includes(email)) {
    emails.push(email);
    await fs.writeFile(EMAILS_FILE, JSON.stringify(emails, null, 2));
  }

  res.redirect('/');
});

router.post('/delete-email', async function (req, res) {
  const email = req.body.email && req.body.email.trim().toLowerCase();
  if (!email) return res.status(400).send('Thiếu email');

  let emails = [];
  try {
    emails = JSON.parse(await fs.readFile(EMAILS_FILE, 'utf-8'));
  } catch { }

  emails = emails.filter(e => e !== email);
  await fs.writeFile(EMAILS_FILE, JSON.stringify(emails, null, 2));

  res.redirect('/');
});

module.exports = router;
