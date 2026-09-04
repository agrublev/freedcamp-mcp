import Layout from '../components/Layout.jsx';
import SEO, { techArticleJsonLd } from '../components/SEO.jsx';
import { MCP_URL } from '../data/content.js';

const SECURITY_CARDS = [
    {
        icon: '🔑',
        title: 'PKCE + Dynamic Client Registration',
        body: 'A standard OAuth 2.1 authorization-code flow. No manual client setup for any client that speaks MCP OAuth.',
    },
    {
        icon: '🗝️',
        title: 'No server-side session to leak',
        body: 'Bearer tokens carry your Freedcamp credentials, AES-256-GCM encrypted with a key derived from a server secret — nothing is stored in a database to look up or leak.',
    },
    {
        icon: '⏳',
        title: '30-day expiry',
        body: 'Tokens expire automatically after 30 days; your client re-authenticates transparently.',
    },
    {
        icon: '🔒',
        title: 'TLS end to end',
        body: 'Client → server is TLS. Server → Freedcamp is HMAC-signed HTTPS.',
    },
];

export default function AuthPage() {
    return (
        <Layout breadcrumb="Authentication">
            <SEO
                path="/auth/"
                title="Authentication — how Freedcamp MCP signs you in"
                description="OAuth 2.1 with PKCE + Dynamic Client Registration. 30-day tokens, no plaintext secrets, AES-256-GCM encrypted at rest."
                jsonLd={techArticleJsonLd({
                    title: 'Authentication — Freedcamp MCP',
                    description: 'Standard OAuth 2.1 with PKCE and DCR.',
                    path: '/auth/',
                })}
            />

            <section className="section" aria-labelledby="auth-title">
                <div className="section__head">
                    <div className="section__eyebrow">
                        <span className="section__num">03</span> Step 3
                    </div>
                    <h1 className="section__title" id="auth-title">Authentication & security.</h1>
                    <p className="section__lead">
                        Standard OAuth 2.1 — sign in once in your browser, your client handles the rest from there.
                    </p>
                </div>

                <ol className="steps" aria-label="OAuth flow steps">
                    <li>
                        Your client requests <code>{MCP_URL}</code> and gets a 401 pointing at this
                        server&apos;s OAuth metadata.
                    </li>
                    <li>
                        The client registers itself dynamically (DCR) and opens your browser to{' '}
                        <code>/authorize</code>.
                    </li>
                    <li>
                        You enter your Freedcamp API key + secret — verified against the real Freedcamp API
                        before anything is issued.
                    </li>
                    <li>
                        The server returns a bearer token; your client stores it and refreshes it
                        automatically from then on.
                    </li>
                </ol>

                <div className="grid grid--2 mt-2">
                    {SECURITY_CARDS.map((c) => (
                        <article key={c.title} className="card">
                            <div className="card__icon" aria-hidden="true">{c.icon}</div>
                            <h3 className="card__title">{c.title}</h3>
                            <p className="card__body">{c.body}</p>
                        </article>
                    ))}
                </div>
            </section>
        </Layout>
    );
}
