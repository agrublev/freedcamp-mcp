// <SEO> — populates document head with canonical URL, Open Graph, Twitter,
// JSON-LD structured data, and per-route title/description.
//
// Uses `Head` from `vite-react-ssg` (which is a wrapper around React Helmet
// Async). vite-react-ssg flushes the Head's children into <head> in each
// pre-rendered HTML file at build time.

import { Head } from 'vite-react-ssg';
import { SITE_URL, SITE_NAME, MCP_URL, TOTAL_TOOLS } from '../data/content.js';

export default function SEO({
    title,
    description,
    path = '/',
    type = 'website',
    image = '/og-image.png',
    jsonLd,
}) {
    const url = `${SITE_URL}${path === '/' ? '/' : path}`;
    const fullTitle = title || `${SITE_NAME} — project management for any AI assistant`;
    const desc =
        description ||
        `A hosted Model Context Protocol server that exposes ${TOTAL_TOOLS}+ Freedcamp tools to Claude Desktop, Claude Code, ChatGPT, Cursor, Cline, Codex, and any MCP-compatible AI. Sign in once with OAuth.`;
    const ogImage = image.startsWith('http') ? image : `${SITE_URL}${image}`;

    const ld = jsonLd || {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: SITE_NAME,
        applicationCategory: 'DeveloperApplication',
        applicationSubCategory: 'Model Context Protocol Server',
        operatingSystem: 'Any (hosted)',
        description: desc,
        url,
        image: ogImage,
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
        },
        featureList: `${TOTAL_TOOLS}+ MCP tools for tasks, projects, time, files, wikis, CRM, calendar, issues, milestones, notifications`,
        softwareRequirements: 'Any MCP-compatible AI client',
        permissions: 'OAuth 2.1 — Freedcamp API key + secret',
    };

    return (
        <Head>
            <title>{fullTitle}</title>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
            <meta name="theme-color" content="#1f6feb" />
            <meta name="color-scheme" content="light" />
            <meta name="generator" content="vite-react-ssg + Freedcamp MCP" />
            <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
            <meta name="description" content={desc} />
            <link rel="canonical" href={url} />

            {/* Open Graph */}
            <meta property="og:type" content={type} />
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={desc} />
            <meta property="og:url" content={url} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:image:alt" content={SITE_NAME} />
            <meta property="og:locale" content="en_US" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={desc} />
            <meta name="twitter:image" content={ogImage} />

            {/* Icons */}
            <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
            <link rel="apple-touch-icon" href="/og-image.png" />

            {/* Structured data */}
            <script
                type="application/ld+json"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
            />
        </Head>
    );
}

// Per-page JSON-LD factories (call from pages, pass result to <SEO jsonLd={...}>)
export function breadcrumbJsonLd(crumbs) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((c, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: c.name,
            item: `${SITE_URL}${c.path}`,
        })),
    };
}

export function techArticleJsonLd({ title, description, path }) {
    return {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: title,
        description,
        url: `${SITE_URL}${path}`,
        author: { '@type': 'Organization', name: 'Freedcamp MCP' },
        publisher: {
            '@type': 'Organization',
            name: 'Freedcamp MCP',
            logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon.svg` },
        },
        mainEntityOfPage: `${SITE_URL}${path}`,
        about: [
            { '@type': 'Thing', name: 'Model Context Protocol' },
            { '@type': 'Thing', name: 'Freedcamp' },
            { '@type': 'Thing', name: 'OAuth 2.1' },
        ],
        dependencies: MCP_URL,
    };
}

export function faqJsonLd(faq) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: {
                '@type': 'Answer',
                text: f.a,
            },
        })),
    };
}
