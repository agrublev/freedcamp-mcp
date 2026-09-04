import Layout from '../components/Layout.jsx';
import SEO from '../components/SEO.jsx';
import { ERRORS } from '../data/content.js';

export default function ErrorsPage() {
    return (
        <Layout breadcrumb="Errors & troubleshooting">
            <SEO
                path="/errors/"
                title="Errors & troubleshooting — common Freedcamp MCP errors and how to fix them"
                description="Every error the Freedcamp MCP server returns, what it means, and the fix."
            />

            <section className="section" aria-labelledby="err-title">
                <div className="section__head">
                    <div className="section__eyebrow">
                        <span className="section__num">07</span> When it breaks
                    </div>
                    <h1 className="section__title" id="err-title">Errors & troubleshooting.</h1>
                    <p className="section__lead">
                        Failures come back as a tool result with <code>isError: true</code> and a plain-text
                        message, so your assistant can read and explain them. Here is what the common ones
                        mean.
                    </p>
                </div>

                <ul className="errors-list">
                    {ERRORS.map((e, i) => (
                        <li key={e.msg} className="error-item">
                            <h2 className="error-item__msg">{e.msg}</h2>
                            <p className="error-item__fix">
                                <strong>Fix:</strong> {e.fix}
                            </p>
                        </li>
                    ))}
                </ul>
            </section>
        </Layout>
    );
}
