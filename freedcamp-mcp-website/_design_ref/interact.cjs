
const pw = require('playwright');
(async () => {
    const browser = await pw.chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://localhost:8766/', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(600);

    // 1. search filter
    await page.fill('.ds-search__input', 'wiki');
    await page.waitForTimeout(400);
    const label = await page.textContent('.dc-ec20e509');
    const groupCount = await page.evaluate(() => document.querySelectorAll('.dc-89fa13b5').length);
    console.log('search "wiki" ->', label, '| groups shown:', groupCount);

    // clear
    await page.click('.ds-search__clear');
    await page.waitForTimeout(300);
    const label2 = await page.textContent('.dc-ec20e509');
    console.log('after clear ->', label2);

    // 2. client tab switch
    await page.evaluate(() => document.getElementById('quickstart').scrollIntoView());
    const segBtns = await page.$$('.ds-seg__btn');
    console.log('segmented buttons:', segBtns.length);
    await segBtns[3].click(); // codex
    await page.waitForTimeout(300);
    const codexVisible = await page.evaluate(() => {
        const el = document.querySelector('[data-client="codex"]');
        return getComputedStyle(el).display;
    });
    const desktopVisible = await page.evaluate(() => {
        const el = document.querySelector('[data-client="claude-desktop"]');
        return getComputedStyle(el).display;
    });
    console.log('codex display:', codexVisible, '| claude-desktop display:', desktopVisible);

    // 3. theme toggle
    await page.click('.ds-theme');
    await page.waitForTimeout(300);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    console.log('dark theme body bg:', bg);
    await page.click('.ds-theme'); // back to light

    // 4. copy button
    const copyBtn = await page.$('.dc-69650e29 button, button.dc-69650e29');
    if (copyBtn) {
        await copyBtn.click();
        await page.waitForTimeout(200);
        console.log('copy button text after click:', (await copyBtn.textContent()).trim());
    } else {
        console.log('hero copy button not found by class; trying any');
    }

    // 5. walkthrough next
    await page.evaluate(() => document.getElementById('claude-walkthrough').scrollIntoView());
    await page.waitForTimeout(200);
    const nextBtn = await page.$('button.dc-fe80385b');
    if (nextBtn) {
        await nextBtn.click();
        await page.waitForTimeout(200);
        const stepLabel = await page.textContent('.dc-a6782c2c');
        console.log('after Next ->', stepLabel);
    }

    await browser.close();
    console.log('DONE');
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
