import Layout from '../components/Layout.jsx';
import SEO, { techArticleJsonLd } from '../components/SEO.jsx';

const TRUST_CARDS = [
    {
        title: 'Per-user credentials',
        body: 'Each bearer token carries one user’s own encrypted API credentials, and each token gets its own handler. Two people on the same endpoint never see each other’s workspace.',
    },
    {
        title: 'Nothing persisted',
        body: 'Credentials live only inside the encrypted bearer token your client holds. Nothing is written to disk, and there is no config file on your machine holding an API secret in plain text.',
    },
    {
        title: 'HMAC-signed upstream',
        body: 'Requests to Freedcamp are signed per call. Your API secret is used to compute the signature, not transmitted as a credential.',
    },
    {
        title: 'Your own account’s limits',
        body: 'There is no separate quota — you inherit the Freedcamp API’s own rate limiting and your plan’s permissions. A tool can never do more than you can.',
    },
];

export default function SecurityPage() {
    return (
        <Layout breadcrumb="Security & limits">
            <SEO
                path="/security/"
                title="Security & limits — what the Freedcamp MCP server stores (nothing) and what it can do"
                description="No server-side persistence, per-user encrypted credentials, HMAC-signed upstream calls, and inherited Freedcamp rate limits."
                jsonLd={techArticleJsonLd({
                    title: 'Security & limits — Freedcamp MCP',
                    description: 'How the server keeps your credentials safe.',
                    path: '/security/',
                })}
            />

            <section className="section" aria-labelledby="sec-title">
                <div className="section__head">
                    <div className="section__eyebrow">
                        <span className="section__num">06</span> Trust
                    </div>
                    <h1 className="section__title" id="sec-title">Security & limits.</h1>
                    <p className="section__lead">
                        The server holds no data of its own. It is a typed, annotated surface over the Freedcamp
                        REST API, running as whoever authorized it.
                    </p>
                </div>

                <div className="grid grid--2">
                    {TRUST_CARDS.map((c) => (
                        <article key={c.title} className="card">
                            <h3 className="card__title">{c.title}</h3>
                            <p className="card__body">{c.body}</p>
                        </article>
                    ))}
                </div>

                <div className="callout callout--danger mt-2">
                    <strong>Destructive tools are real.</strong>{' '}
                    <code>fc_delete_project</code>, <code>fc_delete_account</code> and the other{' '}
                    <code>fc_delete_*</code> tools act immediately and are not undoable from here. They are
                    annotated destructive so your client can ask first — leave those confirmations on.
                </div>
            </section>
        </Layout>
    );
}
