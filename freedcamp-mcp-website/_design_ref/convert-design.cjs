// Convert the claude_design x-dc HTML (inline styles + style-hover) into:
//   design.css   — tokens + class-based CSS (incl. :hover rules)
//   design-body.html — class-based semantic markup with real asset paths
//
// The converter hashes each unique inline style string to a stable class
// name (dc-<hash>) so the generated CSS is deterministic across builds.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REF = path.resolve(__dirname);
const WS = path.resolve(__dirname, '..');

const ASSET_MAP = {
    '26a5af5d-f2f6-490f-b5b6-eac0ceaafca6': '/assets/img/logo.svg',
    '1157d573-752b-468f-a47f-ef817be8df98': '/assets/img/step1.png',
    '517e67b5-d32b-49ed-a240-956018be1b8e': '/assets/img/step2.png',
    '40a5a677-a159-48b8-b917-bcbd38f68c6c': '/assets/img/step3.png',
    '739d9279-4701-4d97-85cf-bd908fb1a959': '/assets/img/step4.png',
    '7b3115c6-db67-4eae-8bdf-e43e48b0c2d4': '/assets/img/step5.png',
    'd7c6572c-f58d-401f-9388-04b0d4ff0d7c': '/assets/img/step6.png',
};

function hashStyle(s) {
    return 'dc-' + crypto.createHash('md5').update(s).digest('hex').slice(0, 8);
}

// Parse a style attribute into ordered [prop, value] pairs.
function parseStyle(style) {
    const out = [];
    for (const part of style.split(';')) {
        const idx = part.indexOf(':');
        if (idx === -1) continue;
        const prop = part.slice(0, idx).trim();
        const val = part.slice(idx + 1).trim();
        if (prop && val) out.push([prop, val]);
    }
    return out;
}

function main() {
    const xdc = fs.readFileSync(path.join(REF, 'xdc.html'), 'utf8');
    const tokens = JSON.parse(fs.readFileSync(path.join(REF, 'tokens-dump.json'), 'utf8'));

    const cssRules = new Map(); // className -> style string
    const hoverRules = new Map(); // className -> hover style string

    let html = xdc;

    // Replace asset UUIDs
    for (const [uuid, real] of Object.entries(ASSET_MAP)) {
        html = html.split(uuid).join(real);
    }

    // Convert style-hover="..." attributes first (collect + strip)
    html = html.replace(/\s+style-hover="([^"]*)"/g, (m, hoverStyle) => {
        // We need the element's class; handle in a second pass via marker.
        return ` data-hover="${hoverStyle.replace(/"/g, '&quot;')}"`;
    });

    // Convert style="..." to class="dc-xxxx"
    html = html.replace(/\s+style="([^"]*)"/g, (m, styleStr) => {
        // Dynamic display toggles ({{ showX }}) default to hidden; React
        // overrides the inline display on the active panel.
        styleStr = styleStr.replace(/display:\s*\{\{[^}]*\}\}\s*;?/, 'display: none;');
        const cls = hashStyle(styleStr);
        if (!cssRules.has(cls)) cssRules.set(cls, styleStr);
        return ` class="${cls}"`;
    });

    // Now attach hover rules: find elements with class + data-hover
    html = html.replace(/class="([^"]*)"(\s+data-hover="([^"]*)")?/g, (m, cls, hm, hoverStyle) => {
        if (!hm) return m;
        const unescaped = hoverStyle.replace(/&quot;/g, '"');
        const hcls = hashStyle('hover:' + unescaped);
        if (!hoverRules.has(hcls)) hoverRules.set(hcls, unescaped);
        return `class="${cls} ${hcls}"`;
    });

    // Build CSS
    const lines = [];
    lines.push('/* GENERATED from Freedcamp MCP Docs.dc.html — do not edit by hand. */');
    lines.push('/* Design tokens (light theme, exact values from the design). */');
    lines.push(':root {');
    for (const [k, v] of Object.entries(tokens.fromRules)) {
        lines.push(`  ${k}: ${v};`);
    }
    lines.push('}');
    lines.push('');
    lines.push('/* Component styles converted from inline style attributes. */');
    for (const [cls, styleStr] of cssRules) {
        const decls = parseStyle(styleStr)
            .map(([p, v]) => `  ${p}: ${v};`)
            .join('\n');
        lines.push(`.${cls} {\n${decls}\n}`);
    }
    lines.push('');
    lines.push('/* Hover states converted from style-hover attributes. */');
    for (const [cls, styleStr] of hoverRules) {
        const decls = parseStyle(styleStr)
            .map(([p, v]) => `  ${p}: ${v};`)
            .join('\n');
        lines.push(`.${cls}:hover {\n${decls}\n}`);
    }

    fs.writeFileSync(path.join(WS, 'src/styles/design.css'), lines.join('\n') + '\n');
    fs.writeFileSync(path.join(REF, 'design-body.html'), html);

    console.log(`classes: ${cssRules.size}, hover rules: ${hoverRules.size}`);
    console.log(`design.css: ${fs.statSync(path.join(WS, 'src/styles/design.css')).size} bytes`);
    console.log(`design-body.html: ${html.length} bytes`);
}

main();
