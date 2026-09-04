import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import SEO from '../components/SEO.jsx';
import { TOOL_GROUPS, TOTAL_TOOLS, TOTAL_TOOLS_DESCRIBED, APP_IDS, TASK_STATUSES, PRIORITIES } from '../data/content.js';

export default function ToolsPage() {
    return (
        <Layout breadcrumb="Tool reference">
            <SEO
                path="/tools/"
                title={`Tool reference — all ${TOTAL_TOOLS_DESCRIBED} Freedcamp MCP tools`}
                description="Complete reference for every tool exposed by the Freedcamp MCP server, grouped by app: tasks, lists, comments, events, discussions, issues, milestones, time, wikis, projects, CRM, users, notifications, files, and misc."
            />

            <section className="section" aria-labelledby="tools-title">
                <div className="section__head">
                    <div className="section__eyebrow">
                        <span className="section__num">05</span> Reference
                    </div>
                    <h1 className="section__title" id="tools-title">
                        {TOTAL_TOOLS}+ tools across every Freedcamp app.
                    </h1>
                    <p className="section__lead">
                        Live parameter schemas appear inline in any MCP client via <code>tools/list</code> —
                        nothing to memorize. Every <code>fc_fetch_*</code> tool is marked{' '}
                        <code>readOnlyHint: true</code>, every <code>fc_delete_*</code>{' '}
                        <code>destructiveHint: true</code>.
                    </p>
                </div>

                <div className="grid grid--3">
                    {TOOL_GROUPS.map((g) => (
                        <article key={g.slug} className="toolgroup" aria-labelledby={`tg-${g.slug}`}>
                            <div className="toolgroup__head">
                                <h2 className="toolgroup__name" id={`tg-${g.slug}`}>
                                    <Link to={`/tools/${g.slug}/`} style={{ color: 'inherit' }}>{g.name}</Link>
                                </h2>
                                <span className="toolgroup__count">{g.tools.length}</span>
                            </div>
                            <p className="toolgroup__desc">{g.desc}</p>
                            <ul className="toolgroup__list" aria-label={`${g.name} tool names`}>
                                {g.tools.map((t) => (
                                    <li key={t}><code>{t}</code></li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>

                <div className="constants">
                    <h2 className="section__title" style={{ fontSize: 22 }}>Constants the AI is taught</h2>
                    <p className="constants__lead">
                        Inlined in tool descriptions so the model picks the right IDs without you reminding it.
                    </p>

                    <div className="grid grid--3">
                        <article className="card">
                            <div className="card__icon" aria-hidden="true">🆔</div>
                            <h3 className="card__title">App IDs</h3>
                            <p className="card__body">
                                {APP_IDS.map((a) => (
                                    <span key={a.id} style={{ display: 'inline-block', marginRight: 12, marginBottom: 4 }}>
                                        <code>{a.id}</code> {a.name}
                                    </span>
                                ))}
                            </p>
                        </article>

                        <article className="card">
                            <div className="card__icon" aria-hidden="true">📍</div>
                            <h3 className="card__title">Task statuses</h3>
                            <p className="card__body">
                                {TASK_STATUSES.map((s) => (
                                    <span key={s.id} style={{ display: 'block', marginBottom: 4 }}>
                                        <code>{s.id}</code> = {s.name}
                                    </span>
                                ))}
                            </p>
                        </article>

                        <article className="card">
                            <div className="card__icon" aria-hidden="true">🚩</div>
                            <h3 className="card__title">Priorities</h3>
                            <p className="card__body">
                                {PRIORITIES.map((p) => (
                                    <span key={p.id} style={{ display: 'block', marginBottom: 4 }}>
                                        <code>{p.id}</code> = {p.name}
                                    </span>
                                ))}
                            </p>
                        </article>
                    </div>
                </div>
            </section>
        </Layout>
    );
}
