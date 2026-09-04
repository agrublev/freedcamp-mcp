// Evaluate the dc-script data constants and dump them as JSON.
const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(path.join(__dirname, 'dc-script.js'), 'utf8');
// Strip the <script ...> opening tag and any trailing </script>.
const src = raw
  .replace(/^<script[^>]*>/, '')
  .replace(/<\/script>\s*$/, '');

// Cut everything from "class Component" onward (needs DCLogic/window).
const cut = src.indexOf('class Component');
const dataSrc = src.slice(0, cut);

// Stub the browser-ish globals the data section might touch (it shouldn't).
const window = undefined;

// Provide g/t helpers
function g(name, anchor, blurb, tools) { return { name, anchor, blurb, tools }; }
function t(name, desc, params, exampleOverride) { return { name, desc, params: params || [], exampleOverride }; }

const fn = new Function('g', 't', dataSrc + `
return { DARK, SAMPLE, PG, CATALOG, CLIENTS, ENV_VARS, RECIPES, ERRORS, FAQ };
`);
const out = fn(g, t);

const ws = path.join(__dirname, '..', 'src', 'data');
fs.mkdirSync(ws, { recursive: true });
fs.writeFileSync(path.join(ws, 'design-data.json'), JSON.stringify(out, null, 1));
console.log('wrote design-data.json:',
  'groups', out.CATALOG.length,
  'tools', out.CATALOG.reduce((n, g) => n + g.tools.length, 0),
  'recipes', out.RECIPES.length,
  'errors', out.ERRORS.length,
  'faq', out.FAQ.length);
