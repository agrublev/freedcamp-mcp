# freedcamp-mcp-website

SEO-friendly documentation site for the **Freedcamp MCP** server, styled
**exactly like the claude_design source** — `Freedcamp MCP Docs.dc.html`.

The design was imported from the bundled `.dc.html` artifact: its inline
styles were converted to a class-based stylesheet (`src/styles/design.css`,
157 classes + hover rules), its 131 light-theme design tokens were captured
from the rendered `:root`, its embedded assets (logo, six walkthrough
screenshots, Inter woff2 fonts) were extracted and self-hosted, and its live
data (17 tool groups / 102 tools with parameters + examples, 8 recipes,
7 errors, 8 FAQ) was evaluated from the document's own script and frozen into
`src/data/design-data.json`.

## Stack

- **React 18 + Vite 5**, pre-rendered at build time by `vite-react-ssg`
  (single-page mode) → `dist/index.html` contains the FULL document in the
  HTML source (no JS needed to read it).
- **Class-based CSS** (`design.css` = converted design styles,
  `components.css` = ports of the 4 design-system widgets, `fonts.css` =
  self-hosted Inter).
- Interactivity (search filter, client tabs, walkthrough stepper, dark/light
  theme, copy buttons, scroll-spy) is React state on top of the static markup.

## Commands

```bash
npm install
npm run dev       # http://localhost:5174
npm run build     # SSG → dist/ + sitemap.xml + robots.txt + llms.txt
npm run preview   # serve dist/
```

## Verified

- Rendered output visually matches the design (sidebar with count badges,
  topbar search + theme switch, hero with endpoint pill, stats row, quote
  cards, walkthrough, tool reference with Read-only/Writes/Destructive
  badges, parameter tables and copyable examples).
- Search "wiki" → "6 tools matching"; client tabs switch panels; theme
  toggle applies the design's dark token set; copy buttons work;
  walkthrough Next/Back step through 6 screens.
- `dist/index.html` is fully indexable: title, meta description, canonical,
  Open Graph, JSON-LD, and every section/tool in the HTML source.

## Regenerating the design import

`_design_ref/` holds the extraction pipeline (run after changing the source
document):

```bash
cd _design_ref
node render-design.cjs     # headless Chrome: tokens + rendered DOM + screenshots
node convert-design.cjs    # inline styles → design.css + class-based body
node dump-data.cjs         # live data → src/data/design-data.json
node gen-jsx.cjs           # body → src/components/DocsPage.jsx
```

## Endpoints referenced

| What | URL |
|---|---|
| MCP endpoint | `https://mcp.freedcamp.com/mcp` |
| OAuth metadata | `https://mcp.freedcamp.com/.well-known/oauth-authorization-server` |
| Sign-in page | `https://mcp.freedcamp.com/authorize` |
| Source | `https://github.com/agrublev/freedcamp-mcp` |
