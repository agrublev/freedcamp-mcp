// Render the bundled Freedcamp MCP Docs design in headless Chrome,
// wait for the dc-runtime to hydrate, then dump:
//  1. All computed CSS custom properties on :root (the light theme tokens)
//  2. The rendered DOM's outerHTML for structural reference
const { execSync } = require('child_process');
const fs = require('fs');

// Use Chrome headless --dump-dom is not enough (JS may not finish).
// Instead use a tiny puppeteer-free approach: Chrome headless with a script.
// Simplest robust option: use Playwright if available, else CDP via chrome remote debugging.

(async () => {
  let pw;
  try {
    pw = require('/Users/me3n/WebstormProjects/freedcamp-mcp/freedcamp-mcp-website/node_modules/playwright');
  } catch (e) {
    try {
      pw = require('playwright');
    } catch (e2) {
      console.error('NO_PLAYWRIGHT');
      process.exit(2);
    }
  }

  const browser = await pw.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const src = '/Users/me3n/WebstormProjects/freedcamp-mcp/Freedcamp MCP Documentation.html';
  await page.goto('file://' + src, { waitUntil: 'load', timeout: 60000 });
  // The runtime hydrates on DOMContentLoaded; give it a moment.
  await page.waitForTimeout(3000);

  // Dump all CSS custom properties on :root
  const tokens = await page.evaluate(() => {
    const out = {};
    const styles = getComputedStyle(document.documentElement);
    // Iterate all stylesheets for --var definitions since getComputedStyle
    // doesn't enumerate custom props. Collect from stylesheet rules.
    const fromRules = {};
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.selectorText && rule.selectorText.includes(':root')) {
            for (const prop of rule.style) {
              if (prop.startsWith('--')) {
                fromRules[prop] = rule.style.getPropertyValue(prop).trim();
              }
            }
          }
        }
      } catch (e) { /* cross-origin */ }
    }
    // Also read computed values for known vars
    const names = [
      '--font-sans','--font-mono',
      '--fs-xs','--fs-sm','--fs-md','--fs-base','--fs-xl','--fs-2xl',
      '--fw-regular','--fw-semibold','--fw-bold',
      '--lh-tight','--lh-snug','--lh-normal',
      '--radius-sm','--radius-md','--radius-lg','--radius-xl','--radius-2xl','--radius-pill',
      '--shadow-xs','--shadow-sm','--shadow-md','--shadow-lg',
      '--dur-fast','--dur-base','--ease-standard',
      '--surface-app','--surface-card','--surface-sunken','--surface-hover','--surface-selected',
      '--border-subtle','--border-default','--border-strong','--ring-border',
      '--text-primary','--text-secondary','--text-muted',
      '--color-primary','--color-primary-hover','--color-primary-tint','--color-accent',
      '--color-danger','--color-danger-tint',
      '--gray-50','--gray-100','--gray-150','--gray-200','--gray-250','--gray-300','--gray-400','--gray-500','--gray-700','--gray-900',
      '--blue-100','--blue-200','--blue-500','--blue-600','--blue-700',
      '--red-100','--red-500','--red-700',
      '--green-100','--green-500','--green-600','--green-700',
      '--orange-100','--orange-500','--orange-600',
      '--cyan-100','--cyan-500','--white',
      '--sp-1','--sp-2','--sp-3','--sp-4','--sp-5','--sp-6','--sp-8','--sp-10','--sp-12',
      '--content-max','--sidebar-w',
    ];
    const computed = {};
    for (const n of names) {
      const v = styles.getPropertyValue(n).trim();
      if (v) computed[n] = v;
    }
    return { fromRules, computed };
  });

  fs.writeFileSync('/Users/me3n/WebstormProjects/freedcamp-mcp/freedcamp-mcp-website/_design_ref/tokens-dump.json', JSON.stringify(tokens, null, 2));

  // Dump rendered body HTML (the hydrated result)
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);
  fs.writeFileSync('/Users/me3n/WebstormProjects/freedcamp-mcp/freedcamp-mcp-website/_design_ref/rendered-body.html', bodyHTML);

  // Full page screenshot for visual reference
  await page.screenshot({ path: '/Users/me3n/WebstormProjects/freedcamp-mcp/freedcamp-mcp-website/_design_ref/screenshot-top.png', fullPage: false });
  await page.screenshot({ path: '/Users/me3n/WebstormProjects/freedcamp-mcp/freedcamp-mcp-website/_design_ref/screenshot-full.png', fullPage: true });

  console.log('Tokens from :root rules:', Object.keys(tokens.fromRules).length);
  console.log('Computed token values:', Object.keys(tokens.computed).length);
  console.log('Body HTML:', bodyHTML.length, 'chars');

  await browser.close();
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
