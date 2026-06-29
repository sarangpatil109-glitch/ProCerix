const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  console.log("Navigating to http://localhost:3000/admin");
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle' });
  
  console.log("Waiting 3 seconds just in case...");
  await page.waitForTimeout(3000);
  
  await browser.close();
})();
