// Convert _design_ref/design-body.html into src/components/DocsPage.jsx.
// Static markup is preserved verbatim (class -> className); dynamic blocks
// (sc-for / sc-if / x-import / {{ }}) become React state + maps.

const fs = require('fs');
const path = require('path');

const REF = path.resolve(__dirname);
const OUT = path.resolve(__dirname, '..', 'src', 'components', 'DocsPage.jsx');

let body = fs.readFileSync(path.join(REF, 'design-body.html'), 'utf8').trim();

// ── generic attribute fixes ────────────────────────────────────
body = body.replace(/\bclass="/g, 'className="');

// Self-close void elements (JSX requirement)
body = body.replace(/<img([^>]*?)>/g, '<img$1 />');
body = body.replace(/<br([^>]*?)>/g, '<br$1 />');
body = body.replace(/<hr([^>]*?)>/g, '<hr$1 />');

// Wrap <pre> text content in a JS string so braces stay literal
body = body.replace(/<pre className="([^"]*)">([\s\S]*?)<\/pre>/g, (m, cls, inner) => {
    const escaped = inner.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
    return `<pre className="${cls}">{\`${escaped.trim()}\`}</pre>`;
});

// sc-camel-on-click handlers -> React onClick
const CLICK_MAP = {
    copy: 'onCopy',
    copyAsk: 'onCopyAsk',
    goStep: 'goStep',
    prevStep: 'prevStep',
    nextStep: 'nextStep',
};
body = body.replace(/sc-camel-on-click="\{\{\s*(\w+)\s*\}\}"/g, (m, name) =>
    `onClick={${CLICK_MAP[name] || name}}`
);

// ── 0a. sidebar guide links: wire scroll-spy style ─────────────
const GUIDE_LINKS = ['overview', 'quickstart', 'claude-walkthrough', 'auth', 'workflow', 'tools'];
for (const id of GUIDE_LINKS) {
    body = body.replace(
        new RegExp(`<a href="#${id}" className="([^"]*)">`),
        (m, cls) => `<a href="#${id}" className="${cls}" style={navLinkStyle('#${id}', ${id === 'tools'})}>`
    );
}
// tool-group nav links (count badges)
body = body.replace(
    /<a href="\{\{ g\.href \}\}" className="([^"]*)">/g,
    (m, cls) => `<a href={g.href} className="${cls}" style={navLinkStyle(g.href, false)}>`
);
// practice links
const PRACTICE_LINKS = ['recipes', 'security', 'errors', 'faq'];
for (const id of PRACTICE_LINKS) {
    body = body.replace(
        new RegExp(`<a href="#${id}" className="([^"]*)">`),
        (m, cls) => `<a href="#${id}" className="${cls}" style={navLinkStyle('#${id}', false)}>`
    );
}

// ── 0b. walkthrough step buttons + numbers: active styling ─────
body = body.replace(
    /<button data-step="(\d)" onClick=\{goStep\} className="([^"]*)">/g,
    (m, n, cls) => `<button data-step="${n}" onClick={goStep} className="${cls}" style={stepBtnStyle(${n})}>`
);
body = body.replace(
    /<span data-step-num="(\d)" className="([^"]*)">/g,
    (m, n, cls) => `<span data-step-num="${n}" className="${cls}" style={stepNumStyle(${n})}>`
);

// ── 1. sidebar nav groups loop ─────────────────────────────────
body = body.replace(
    /<sc-for list="\{\{ navGroups \}\}" as="g"[^>]*>([\s\S]*?)<\/sc-for>/,
    (m, inner) => {
        const item = inner
            .replace('href="{{ g.href }}"', 'href={g.href}')
            .replace('>{{ g.name }}</span>', '>{g.name}</span>')
            .replace('>{{ g.count }}</span>', '>{g.count}</span>');
        return `{NAV_GROUPS.map((g) => (\n        ${item.trim()}\n      ))}`;
    }
);

// ── 2. header: SearchInput + resultLabel + ThemeSwitch ─────────
body = body.replace(
    /<x-import component-from-global-scope="DesignSystem_bccc6d\.SearchInput"[^>]*(?:\/>|><\/x-import>)/,
    `<SearchInput value={query} onChange={onSearch} onClear={onClearSearch} placeholder="Search 102 tools" />`
);
body = body.replace(/\{\{ resultLabel \}\}/g, '{resultLabel}');
body = body.replace(
    /<x-import component-from-global-scope="DesignSystem_bccc6d\.ThemeSwitch"[^>]*(?:\/>|><\/x-import>)/,
    `<ThemeSwitch theme={theme} onChange={onTheme} />`
);

// ── 3. quickstart SegmentedControl ─────────────────────────────
body = body.replace(
    /<x-import component-from-global-scope="DesignSystem_bccc6d\.SegmentedControl"[^>]*(?:\/>|><\/x-import>)/,
    `<SegmentedControl options={CLIENTS} value={client} onChange={onClient} />`
);

// ── 4. client panels: show only the active one ─────────────────
body = body.replace(
    /<div (data-client="([^"]+)") className="([^"]*)">/g,
    (m, attr, id, cls) =>
        `<div ${attr} className="${cls}" style={{ display: client === '${id}' ? 'flex' : undefined }}>`
);

// ── 5. walkthrough step panels: show only the active one ───────
let stepIdx = 0;
body = body.replace(
    /<div className="dc-f6836f6a">/g,
    () => {
        stepIdx += 1;
        return `<div className="dc-f6836f6a" style={{ display: step === ${stepIdx} ? 'flex' : undefined }}>`;
    }
);
body = body.replace(/\{\{ stepLabel \}\}/g, '{stepLabel}');

// ── 6. tools reference loops ───────────────────────────────────
body = body.replace(
    /<sc-for list="\{\{ groups \}\}" as="g"[^>]*>([\s\S]*?)\n        <\/sc-for>/,
    (m, inner) => `{groups.map((g) => (\n          <GroupBlock key={g.anchor} g={g} showExamples={showExamples} showAnnotations={showAnnotations} onCopy={onCopy} />\n        ))}`
);
body = body.replace(
    /<sc-if value="\{\{ noResults \}\}"[^>]*>([\s\S]*?)<\/sc-if>/,
    (m, inner) => `{noResults && (\n          ${inner.trim()}\n        )}`
);

// ── 7. recipes / errors / faq loops ────────────────────────────
body = body.replace(
    /<sc-for list="\{\{ recipes \}\}" as="r"[^>]*>([\s\S]*?)<\/sc-for>/,
    (m, inner) => {
        const item = inner
            .replace(/\{\{ r\.label \}\}/g, '{r.label}')
            .replace(/\{\{ r\.ask \}\}/g, '{r.ask}')
            .replace(/\{\{ r\.tools \}\}/g, '{r.tools}');
        return `{RECIPES.map((r) => (\n            ${item.trim()}\n          ))}`;
    }
);
body = body.replace(
    /<sc-for list="\{\{ errors \}\}" as="e"[^>]*>([\s\S]*?)<\/sc-for>/,
    (m, inner) => {
        const item = inner
            .replace(/\{\{ e\.msg \}\}/g, '{e.msg}')
            .replace(/\{\{ e\.fix \}\}/g, '{e.fix}');
        return `{ERRORS.map((e) => (\n            ${item.trim()}\n          ))}`;
    }
);
body = body.replace(
    /<sc-for list="\{\{ faq \}\}" as="f"[^>]*>([\s\S]*?)<\/sc-for>/,
    (m, inner) => {
        const item = inner
            .replace(/\{\{ f\.q \}\}/g, '{f.q}')
            .replace(/\{\{ f\.a \}\}/g, '{f.a}');
        return `{FAQ.map((f) => (\n            ${item.trim()}\n          ))}`;
    }
);

// ── assemble the component ─────────────────────────────────────
const jsx = `// GENERATED from Freedcamp MCP Docs.dc.html (claude_design import).
// Static markup + class names are the design itself; dynamic behaviour
// (search, client tabs, walkthrough steps, theme, copy) is React state.

import { useEffect, useRef, useState } from 'react';
import { Head } from 'vite-react-ssg';
import {
    NAV_GROUPS, CLIENTS, RECIPES, ERRORS, FAQ, DARK,
    filterCatalog, TOTAL_TOOLS, MCP_URL, REPO_URL, API_KEYS_URL,
} from '../data/content.js';
import { SearchInput, SegmentedControl, ThemeSwitch } from './ds-widgets.jsx';

function GroupBlock({ g, showExamples, showAnnotations, onCopy }) {
    return (
      <div id={g.anchor} className="dc-89fa13b5">
        <div className="dc-6bc8ab6b">
          <h3 className="dc-343d15b4">{g.name}</h3>
          <span className="dc-04f0c4dc">{g.countLabel}</span>
          <span className="dc-3524551e"></span>
        </div>
        <p className="dc-73cab02d">{g.blurb}</p>

        <div className="dc-3e7f6ac1">
          {g.tools.map((t) => (
            <div id={t.name} key={t.name} className="dc-59e44a87 dc-0901074a">
              <div className="dc-202e0f67">
                <code className="dc-3f093f06">{t.name}</code>
                {showAnnotations && (
                  <span className={\`ds-badge ds-badge--\${t.tone}\`}>{t.badge}</span>
                )}
                <p className="dc-27fd3b3a">{t.desc}</p>
              </div>

              {t.hasParams && (
                <div className="dc-ecb022f0">
                  <div className="dc-7e5941ec">
                    <span>PARAMETER</span><span>TYPE</span><span>NOTES</span>
                  </div>
                  {t.params.map((p) => (
                    <div className="dc-5ec8f3be" key={p.name}>
                      <code className="dc-346104d8">{p.name}</code>
                      <span className="dc-941dbc5b">{p.type}</span>
                      <span className="dc-589ac059">{p.note}</span>
                    </div>
                  ))}
                </div>
              )}

              {t.noParams && <div className="dc-7db983cb">Takes no arguments.</div>}

              {showExamples && (
                <div className="dc-9aa2e741">
                  <button onClick={onCopy} className="dc-12e253c5 dc-56448dda">Copy</button>
                  <pre className="dc-8c98b666">{t.example}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
}

export default function DocsPage() {
    const [query, setQuery] = useState('');
    const [client, setClient] = useState('claude-desktop');
    const [theme, setTheme] = useState('light');
    const [step, setStep] = useState(1);
    const [activeSection, setActiveSection] = useState('overview');
    const [showExamples] = useState(true);
    const [showAnnotations] = useState(true);

    const { groups, total } = filterCatalog(query);
    const noResults = groups.length === 0;
    const resultLabel = query.trim()
        ? total + (total === 1 ? ' tool' : ' tools') + ' matching'
        : '102 tools';
    const stepLabel = 'Step ' + step + ' of 6';

    // theme
    useEffect(() => {
        const root = document.documentElement;
        Object.keys(DARK).forEach((k) => {
            if (theme === 'dark') root.style.setProperty(k, DARK[k]);
            else root.style.removeProperty(k);
        });
        root.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
    }, [theme]);

    // scroll spy for the sidebar
    useEffect(() => {
        const onScroll = () => {
            const links = document.querySelectorAll('aside nav a[href^="#"]');
            let active = null;
            let bestTop = -Infinity;
            links.forEach((a) => {
                const el = document.getElementById(a.getAttribute('href').slice(1));
                if (!el) return;
                const top = el.getBoundingClientRect().top - 120;
                if (top <= 0 && top > bestTop) { bestTop = top; active = a; }
            });
            if (!active) active = links[0];
            if (active) setActiveSection(active.getAttribute('href').slice(1));
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const onSearch = (e) => setQuery(e.target.value);
    const onClearSearch = () => setQuery('');
    const onClient = (id) => setClient(id);
    const onTheme = (next) => setTheme(next);
    const goStep = (e) => {
        const n = parseInt(e.currentTarget.getAttribute('data-step'), 10);
        if (n) setStep(n);
    };
    const nextStep = () => setStep((s) => (s >= 6 ? 1 : s + 1));
    const prevStep = () => setStep((s) => (s <= 1 ? 6 : s - 1));

    const onCopy = (e) => {
        const btn = e.currentTarget;
        const pre = btn.parentElement && btn.parentElement.querySelector('pre');
        if (!pre) return;
        const text = pre.innerText;
        const done = () => {
            btn.textContent = 'Copied';
            window.setTimeout(() => { btn.textContent = 'Copy'; }, 1400);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, done);
        } else {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); } catch (err) { /* ignore */ }
            document.body.removeChild(ta);
            done();
        }
    };
    const onCopyAsk = (e) => {
        const btn = e.currentTarget;
        const card = btn.closest('[data-recipe]');
        const p = card && card.querySelector('p');
        if (!p) return;
        const text = p.innerText;
        const done = () => {
            btn.textContent = 'Copied';
            window.setTimeout(() => { btn.textContent = 'Copy'; }, 1400);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, done);
        } else {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); } catch (err) { /* ignore */ }
            document.body.removeChild(ta);
            done();
        }
    };

    const navLinkStyle = (href, bold) => {
        const on = activeSection === href.slice(1);
        return {
            background: on ? 'var(--color-primary-tint)' : 'transparent',
            color: on ? 'var(--color-primary)' : bold ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: on || bold ? 600 : 500,
            boxShadow: on ? 'inset 2px 0 0 0 var(--color-primary)' : 'none',
        };
    };
    const stepBtnStyle = (n) => ({
        background: step === n ? 'var(--color-primary-tint)' : 'transparent',
        boxShadow: step === n ? 'inset 2px 0 0 0 var(--color-primary)' : 'none',
    });
    const stepNumStyle = (n) => ({
        background: step === n ? 'var(--color-primary)' : 'var(--surface-sunken)',
        color: step === n ? '#fff' : 'var(--text-secondary)',
    });

    return (
        <>
            <Head>
                <title>Freedcamp MCP — run your whole workspace by asking</title>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
                <meta name="theme-color" content="#4a86f7" />
                <meta name="color-scheme" content="light dark" />
                <meta name="generator" content="vite-react-ssg + claude_design import" />
                <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
                <meta
                    name="description"
                    content="Freedcamp MCP exposes tasks, lists, milestones, time tracking, the Issue Tracker, discussions, wikis, files, the calendar and CRM as 102 tools any MCP client can call. Point Claude, Cursor or Codex CLI at it and ask for what you want in plain language."
                />
                <link rel="canonical" href="https://mcp-docs.freedcamp.top/" />
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content="Freedcamp MCP" />
                <meta property="og:title" content="Freedcamp MCP — run your whole workspace by asking" />
                <meta
                    property="og:description"
                    content="102 Freedcamp tools for any MCP client. Hosted endpoint, OAuth only — nothing to install."
                />
                <meta property="og:url" content="https://mcp-docs.freedcamp.top/" />
                <meta property="og:image" content="https://mcp-docs.freedcamp.top/og-image.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <link rel="icon" type="image/svg+xml" href="/assets/img/logo.svg" />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'SoftwareApplication',
                            name: 'Freedcamp MCP',
                            applicationCategory: 'DeveloperApplication',
                            operatingSystem: 'Any (hosted)',
                            description:
                                'Hosted Model Context Protocol server exposing the Freedcamp API as 102 tools for Claude, Cursor, Codex CLI and any MCP client. OAuth 2.1 only.',
                            url: 'https://mcp-docs.freedcamp.top/',
                            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
                            featureList:
                                '102 MCP tools for tasks, projects, lists, comments, calendar, discussions, issues, milestones, time, wikis, CRM, users, notifications, files',
                        }),
                    }}
                />
            </Head>
${body}
        </>
    );
}
`;

fs.writeFileSync(OUT, jsx);
console.log('wrote', OUT, jsx.length, 'bytes');
