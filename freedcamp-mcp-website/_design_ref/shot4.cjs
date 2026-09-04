
const pw = require('playwright');
(async () => {
    const browser = await pw.chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(process.argv[2], { waitUntil: 'networkidle', timeout: 60000 });
    await page.addStyleTag({ content: 'html{scroll-behavior:auto !important}' });
    await page.waitForTimeout(500);
    for (const [id, out] of [['tools','/tmp/mcp-tools2.png'],['claude-walkthrough','/tmp/mcp-walk2.png'],['recipes','/tmp/mcp-recipes.png']]) {
        await page.evaluate((id) => {
            const el = document.getElementById(id);
            window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 70);
        }, id);
        await page.waitForTimeout(300);
        await page.screenshot({ path: out });
        console.log('saved', out);
    }
    await browser.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
