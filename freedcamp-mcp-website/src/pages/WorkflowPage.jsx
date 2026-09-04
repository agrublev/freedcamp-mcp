import Layout from '../components/Layout.jsx';
import SEO, { techArticleJsonLd } from '../components/SEO.jsx';

const CARDS = [
    {
        icon: '🧭',
        title: 'Names over IDs',
        body: (
            <>
                <p>
                    Prefer the project and app names from that first call when talking to the user.{' '}
                    <code>fc_add_item_by_names</code> and <code>fc_add_comment_by_names</code> accept names
                    directly.
                </p>
            </>
        ),
    },
    {
        icon: '🏷️',
        title: 'Tool annotations',
        body: (
            <>
                <p>
                    Every <code>fc_fetch_*</code> tool is marked <code>readOnlyHint: true</code>, every{' '}
                    <code>fc_delete_*</code> is marked <code>destructiveHint: true</code>. Clients use those
                    hints to decide what to confirm with you.
                </p>
            </>
        ),
    },
    {
        icon: '🚫',
        title: 'No false successes',
        body: (
            <>
                <p>
                    Silent no-ops are treated as failures. Starting an already-running timer returns{' '}
                    <code>isError: true</code> with the entry state, not a cheerful &ldquo;done&rdquo;.
                </p>
            </>
        ),
    },
    {
        icon: '🆔',
        title: 'App IDs',
        body: (
            <>
                <p>
                    Comments, links and files are addressed by app: <code>2</code> Tasks, <code>3</code>{' '}
                    Discussions, <code>4</code> Milestones, <code>5</code> Time, <code>6</code> Files,{' '}
                    <code>13</code> Issue Tracker, <code>14</code> Wikis, <code>16</code> CRM,{' '}
                    <code>19</code> Calendar, <code>37</code> Overview.
                </p>
            </>
        ),
    },
];

export default function WorkflowPage() {
    return (
        <Layout breadcrumb="How the AI should work">
            <SEO
                path="/workflow/"
                title="How the AI should work — Freedcamp MCP behaviour notes"
                description="Server-shipped instructions that MCP clients read on connect: prefer names over IDs, honour tool annotations, treat silent no-ops as errors."
                jsonLd={techArticleJsonLd({
                    title: 'How the AI should work — Freedcamp MCP',
                    description: 'Behaviour notes the server teaches to clients.',
                    path: '/workflow/',
                })}
            />

            <section className="section" aria-labelledby="wf-title">
                <div className="section__head">
                    <div className="section__eyebrow">
                        <span className="section__num">04</span> Behaviour
                    </div>
                    <h1 className="section__title" id="wf-title">How the AI should work.</h1>
                    <p className="section__lead">
                        The server ships instructions that MCP clients read on connect. Worth knowing,
                        because it explains why your assistant behaves the way it does.
                    </p>
                </div>

                <article className="card" style={{ marginBottom: 24 }}>
                    <h3 className="card__title">The one rule that matters</h3>
                    <p className="card__body">
                        Call <code>fc_get_groups_projects</code> once at the start of a conversation to get
                        groups, projects and their apps by human-readable name — then reuse that result
                        instead of re-fetching. Only refresh if the user asks, or after creating or deleting
                        a project.
                    </p>
                </article>

                <div className="grid grid--2">
                    {CARDS.map((c) => (
                        <article key={c.title} className="card">
                            <div className="card__icon" aria-hidden="true">{c.icon}</div>
                            <h3 className="card__title">{c.title}</h3>
                            <div className="card__body">{c.body}</div>
                        </article>
                    ))}
                </div>
            </section>
        </Layout>
    );
}
