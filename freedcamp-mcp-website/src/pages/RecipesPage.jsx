import Layout from '../components/Layout.jsx';
import SEO from '../components/SEO.jsx';
import { RECIPES } from '../data/content.js';

export default function RecipesPage() {
    return (
        <Layout breadcrumb="Prompt recipes">
            <SEO
                path="/recipes/"
                title="Prompt recipes — what to ask your AI to do in Freedcamp"
                description="Six copy-paste prompts that show what the Freedcamp MCP tools can do, plus the tool calls each one triggers."
            />

            <section className="section" aria-labelledby="rec-title">
                <div className="section__head">
                    <div className="section__eyebrow">
                        <span className="section__num">05</span> Playbook
                    </div>
                    <h1 className="section__title" id="rec-title">Prompt recipes.</h1>
                    <p className="section__lead">
                        Things worth asking for, and the tools your assistant will reach for. Copy a line,
                        change the names.
                    </p>
                </div>

                <ul className="recipe-list">
                    {RECIPES.map((r) => (
                        <li key={r.label} className="recipe">
                            <div>
                                <h2 className="recipe__label">{r.label}</h2>
                                <p className="recipe__ask">&ldquo;{r.ask}&rdquo;</p>
                                <div className="recipe__tools">
                                    Calls <code>{r.tools}</code>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </section>
        </Layout>
    );
}
