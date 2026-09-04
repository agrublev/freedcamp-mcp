import { useState } from 'react';
import Layout from '../components/Layout.jsx';
import SEO from '../components/SEO.jsx';
import { TOOL_GROUPS } from '../data/content.js';

// Factory: produce a dedicated component for one tool group.
// `slug` is baked in at module-eval time, so every render — including
// vite-react-ssg's static render of `/tools/<slug>/` — has the right group.
function makeToolGroupPage(slug) {
    return function ToolGroupPage() {
        const group = TOOL_GROUPS.find((g) => g.slug === slug);
        const [copied, setCopied] = useState(null);

        const onCopy = async (name) => {
            try {
                await navigator.clipboard.writeText(name);
                setCopied(name);
                setTimeout(() => setCopied(null), 1200);
            } catch {
                // ignore
            }
        };

        if (!group) {
            return (
                <Layout breadcrumb="Tool group not found">
                    <SEO
                        path={`/tools/${slug}/`}
                        title="Tool group not found \u2014 Freedcamp MCP"
                    />
                    <section className="section">
                        <h1 className="section__title">Tool group not found</h1>
                        <p className="section__lead">
                            We could not find a tool group with the slug <code>{slug}</code>. See the{' '}
                            <a href="/tools/">full tool reference</a>.
                        </p>
                    </section>
                </Layout>
            );
        }

        return (
            <Layout breadcrumb={group.name}>
                <SEO
                    path={`/tools/${group.slug}/`}
                    title={`${group.name} \u2014 Freedcamp MCP tools`}
                    description={`${group.desc} Tools: ${group.tools.join(', ')}.`}
                />

                <section className="section" aria-labelledby="tg-title">
                    <p className="muted" style={{ fontSize: 13 }}>
                        <a href="/tools/">All tool groups</a> / {group.name}
                    </p>
                    <h1 className="section__title" id="tg-title">{group.name}</h1>
                    <p className="section__lead">{group.desc}</p>
                </section>

                <section className="section" aria-labelledby="tg-tools">
                    <h2 className="section__title" id="tg-tools" style={{ fontSize: 22 }}>
                        {group.tools.length} tool{group.tools.length === 1 ? '' : 's'}
                    </h2>

                    <ul className="toolgroup__list" style={{ marginTop: 16, gap: 10 }}>
                        {group.tools.map((t) => (
                            <li key={t}>
                                <button
                                    type="button"
                                    onClick={() => onCopy(t)}
                                    aria-label={`Copy ${t}`}
                                    style={{
                                        appearance: 'none',
                                        cursor: 'pointer',
                                        border: '1px solid var(--border-subtle)',
                                        background: 'var(--surface-card)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '10px 14px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        fontFamily: 'inherit',
                                        color: 'inherit',
                                    }}
                                >
                                    <code>{t}</code>
                                    <span className="muted" style={{ fontSize: 11 }}>
                                        {copied === t ? 'Copied' : 'Copy'}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>

                    <div className="callout mt-2">
                        <strong>Tip:</strong> clients display live parameter schemas for every tool here via{' '}
                        <code>tools/list</code>. You can also fetch them with curl once you have a bearer token \u2014
                        see the <a href="/quickstart/">Quickstart</a>.
                    </div>
                </section>
            </Layout>
        );
    };
}

// One component per tool group, exported for App.jsx to map to routes.
export const toolGroupComponents = Object.fromEntries(
    TOOL_GROUPS.map((g) => [g.slug, makeToolGroupPage(g.slug)])
);

// Default export = generic 404 (used only if a slug is missing entirely).
export default function ToolGroupPage() {
    return (
        <Layout breadcrumb="Tool group not found">
            <SEO title="Tool group not found \u2014 Freedcamp MCP" />
            <section className="section">
                <h1 className="section__title">Tool group not found</h1>
                <p className="section__lead">
                    That tool group does not exist. See the <a href="/tools/">full tool reference</a>.
                </p>
            </section>
        </Layout>
    );
}
