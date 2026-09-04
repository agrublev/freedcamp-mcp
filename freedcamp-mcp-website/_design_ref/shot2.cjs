const path = require('path');

(async () => {
    const pw = require('playwright');
    const browser = await pw.chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('console', (m) => console.log('[console]', m.type(), m.text().slice(0, 200)));
    page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 300)));
    page.on('requestfailed', (r) => console.log('[requestfailed]', r.url(), r.failure() && r.failure().errorText));

    const url = process.argv[2];
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(1000);

    // check computed style of body
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const sidebarW = await page.evaluate(() => {
        const a = document.querySelector('aside');
        return a ? getComputedStyle(a).width : 'no aside';
    });
    console.log('body bg:', bg, '| aside width:', sidebarW);

    await page.screenshot({ path: process.argv[3], fullPage: false });
    console.log('saved', process.argv[3]);
    await browser.close();
})().catch((e) => {
    console.error('FAIL:', e.message);
    process.exit(1);
});
