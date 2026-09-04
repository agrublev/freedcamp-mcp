import { useState } from 'react';
import Layout from '../components/Layout.jsx';
import SEO, { techArticleJsonLd } from '../components/SEO.jsx';
import { CLAUDE_DESKTOP_SETUP } from '../data/content.js';

export default function WalkthroughPage() {
    const [step, setStep] = useState(1);

    return (
        <Layout breadcrumb="Claude Desktop walkthrough">
            <SEO
                path="/walkthrough/"
                title="Claude Desktop walkthrough — six clicks to a working Freedcamp connection"
                description="Visual click-by-click walkthrough for connecting Claude Desktop to the Freedcamp MCP server. Settings → Connectors → Add custom connector → OAuth."
                jsonLd={techArticleJsonLd({
                    title: 'Claude Desktop walkthrough — Freedcamp MCP',
                    description: 'Six clicks from the Claude Desktop menu bar to a working Freedcamp MCP connection.',
                    path: '/walkthrough/',
                })}
            />

            <section className="section" aria-labelledby="walk-title">
                <div className="section__head">
                    <div className="section__eyebrow">
                        <span className="section__num">01b</span> Walkthrough
                    </div>
                    <h1 className="section__title" id="walk-title">Claude Desktop, click by click.</h1>
                    <p className="section__lead">
                        No config file, no terminal — six clicks from the menu bar to a working connection.
                        Step through the screens below; each step on the left shows the matching dialog on the right.
                    </p>
                </div>

                <div className="walkthrough">
                    <ol className="walkthrough__rail" aria-label="Setup steps">
                        {CLAUDE_DESKTOP_SETUP.map((s, i) => {
                            const num = i + 1;
                            const active = step === num;
                            return (
                                <li key={s.src} style={{ listStyle: 'none' }}>
                                    <button
                                        type="button"
                                        className="walkthrough__step"
                                        aria-current={active ? 'step' : undefined}
                                        onClick={() => setStep(num)}
                                    >
                                        <span className="walkthrough__step-num" aria-hidden="true">{num}</span>
                                        <span>
                                            <span className="walkthrough__step-title">{s.title}</span>
                                            <span className="walkthrough__step-sub">{shortSub(s.body)}</span>
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ol>

                    <div className="walkthrough__panels" role="region" aria-live="polite">
                        {CLAUDE_DESKTOP_SETUP.map((s, i) => {
                            const num = i + 1;
                            return (
                                <div
                                    key={s.src}
                                    className={`walkthrough__panel ${step === num ? 'is-active' : ''}`}
                                    id={`step-panel-${num}`}
                                    role="tabpanel"
                                    aria-labelledby={`step-${num}`}
                                >
                                    <img src={s.src} alt={`Step ${num}: ${s.title}`} loading="lazy" />
                                    <h2 className="walkthrough__panel-title">{s.title}</h2>
                                    <p
                                        className="walkthrough__panel-body"
                                        dangerouslySetInnerHTML={{ __html: s.body }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </Layout>
    );
}

// Strip HTML and shorten for the rail sub-text.
function shortSub(html) {
    const text = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    return text.length > 70 ? text.slice(0, 68) + '…' : text;
}
