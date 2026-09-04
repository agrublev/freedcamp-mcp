const path = require('path');

(async () => {
    const pw = require('playwright');
    const browser = await pw.chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const url = process.argv[2];
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(800);

    // scroll to #tools and screenshot
    await page.evaluate(() => document.getElementById('tools').scrollIntoView());
    await page.waitForTimeout(400);
    await page.screenshot({ path: '/tmp/mcp-tools.png' });

    // scroll to #claude-walkthrough
    await page.evaluate(() => document.getElementById('claude-walkthrough').scrollIntoView());
    await page.waitForTimeout(400);
    await page.screenshot({ path: '/tmp/mcp-walkthrough.png' });

    // bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    await page.screenshot({ path: '/tmp/mcp-bottom.png' });

    console.log('saved 3 screenshots');
    await browser.close();
})().catch((e) => {
    console.error('FAIL:', e.message);
    process.exit(1);
});
