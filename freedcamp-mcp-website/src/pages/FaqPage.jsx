import Layout from '../components/Layout.jsx';
import SEO, { faqJsonLd } from '../components/SEO.jsx';
import { FAQ } from '../data/content.js';

export default function FaqPage() {
    const jsonLd = faqJsonLd(FAQ);
    return (
        <Layout breadcrumb="FAQ">
            <SEO
                path="/faq/"
                title="FAQ — frequently asked questions about the Freedcamp MCP server"
                description="Is it official? Do I need to install anything? Where do I get credentials? How long do tokens last? Can I self-host?"
                jsonLd={jsonLd}
            />

            <section className="section" aria-labelledby="faq-title">
                <div className="section__head">
                    <div className="section__eyebrow">
                        <span className="section__num">08</span> Questions
                    </div>
                    <h1 className="section__title" id="faq-title">Frequently asked questions.</h1>
                </div>

                <ul className="faq-list" role="list">
                    {FAQ.map((f) => (
                        <li key={f.q} className="faq-item">
                            <h2 className="faq-item__q">{f.q}</h2>
                            <p className="faq-item__a">{f.a}</p>
                        </li>
                    ))}
                </ul>
            </section>
        </Layout>
    );
}
