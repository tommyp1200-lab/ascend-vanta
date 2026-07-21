# Ascend Vanta SEO Authority Report

Status: the temporary multi-page authority architecture is retired. Ascend Vanta now intentionally uses one canonical content page: `https://www.ascendvanta.com/`.

The cinematic homepage is the full website. About, Work, Capabilities, Publications, Contact, capability topics, and publication entries exist as semantic, server-rendered homepage sections or anchors. Former supporting routes permanently redirect to the relevant homepage fragment and are not described as active pages.

## Current authority model

- Primary entity: Tommy Pisano
- Stable Person ID: `https://www.ascendvanta.com/about/#person`
- Canonical content URL: `https://www.ascendvanta.com/`
- Sitemap content URLs: 1
- Central schema graph: WebSite, Person, WebPage/ProfilePage, CollectionPage, CreativeWork
- Approved Person `sameAs` profiles: LinkedIn, GitHub, Instagram, Facebook, and TikTok
- Public email: not published
- Publication dates: not supplied and not invented
- Search Console and Bing verification: not claimed

The full redirect map, section inventory, schema graph, validation evidence, performance impact, and limitations are maintained in `docs/ascend-vanta-one-page-seo-report.md`.

## Historical note

Commit `bf513c7d27bdb5b56d1f7ba3d027479e4a1c3c5f` temporarily introduced 14 canonical content routes. That route architecture is no longer current. Its content was evaluated for concise reuse, the routes were removed, and their URLs now resolve through direct permanent redirects to homepage anchors.
