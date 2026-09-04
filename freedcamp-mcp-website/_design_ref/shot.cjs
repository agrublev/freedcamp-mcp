const { execSync } = require('child_process');
const path = require('path');

(async () => {
    let pw;
    try {
        pw = require('playwright');
    } catch (e) {
        console.error('NO_PLAYWRIGHT');
        process.exit(2);
    }
    const browser = await pw.chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const url = process.argv[2] || 'file:///Users/me3n/WebstormProjects/freedcamp-mcp/freedcamp-mcp-website/dist/index.html';
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(1500);
    const out = process.argv[3] || '/tmp/site-top.png';
    await page.screenshot({ path: out, fullPage: false });
    console.log('saved', out);
    await browser.close();
})().catch((e) => {
    console.error('FAIL:', e.message);
    process.exit(1);
});
