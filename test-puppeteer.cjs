const puppeteer = require('puppeteer');
(async () => {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    await browser.close();
    console.log("Puppeteer works");
  } catch (e) {
    console.log("Puppeteer fails:", e);
  }
})();
