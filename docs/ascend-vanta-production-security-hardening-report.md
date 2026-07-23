# Ascend Vanta Production Security Hardening Report

Date: July 22, 2026

Status: Local hardening complete; production deployment and live WAF changes intentionally not applied

Security branch: `security/production-hardening`

Baseline commit: `3f59f315dc952f61805d89fe79ad125ad1dad650`

Production domain: `https://www.ascendvanta.com`

## Executive summary

The initial application attack surface was small and comparatively safe: Ascend Vanta is a statically rendered public portfolio with no authentication, cookies, forms, API routes, Route Handlers, Server Actions, webhooks, database, CMS, or mutation endpoints. Production previews and generated deployment URLs were already protected by Vercel Authentication, GitHub secret scanning and push protection were enabled, and passive probes for sensitive or development routes did not expose an application surface.

The most serious initial issue was the dependency baseline. The lockfile reported three vulnerabilities: two High and one Moderate, including Next.js advisories fixed by the July 2026 Active LTS patch. The initial production response also lacked a Content Security Policy and most defense-in-depth response headers.

The security branch upgrades Next.js to `16.2.11`, React and React DOM to `19.2.8`, and constrains the affected transitive `sharp` and `postcss` versions. Both complete and production-only npm audits now report zero vulnerabilities. A tested, enforced allow-list CSP and a complete defensive header set were added without converting the static site to dynamic rendering. The branch also hardens canonical-origin handling, safely serializes JSON-LD, disables public production browser source maps, restricts Next Image to local non-SVG sources, redirects the public canonical Vercel alias, adds a public vulnerability-reporting policy, and adds pinned, least-privilege security CI plus Dependabot configuration.

Final local posture is materially improved, with no unresolved reachable Critical or High dependency finding and no discovered secret in the current source, Git history scan, generated client assets, or public directory. This does not make a public website impossible to inspect, scrape, or copy. Public HTML, JavaScript, media, and visual designs remain downloadable by design.

No commit has been pushed, no deployment has been created, and no production firewall rule has been published. A comparable Vercel preview and live-domain validation remain required before production promotion.

## Baseline

| Item | Recorded value |
| --- | --- |
| Branch / commit | `main` / `3f59f315dc952f61805d89fe79ad125ad1dad650` |
| Dedicated work | Clean worktree on `security/production-hardening`; unrelated local edits in the primary worktree were not touched |
| Node / npm | Node `24.16.0`; npm `11.13.0`; npm lockfile v3 |
| Framework | Next.js `16.2.10`; React and React DOM `19.2.7` |
| Build | `next build`; static prerendered output for `/`, `/_not-found`, `/icon.jpg`, `/robots.txt`, and `/sitemap.xml` |
| Hosting | Vercel project `prj_3WHfRTq8zaC551X1xmhZ0ECMt2ys`, team `team_Zokh5ea7i4qWOQaYZI2DRRoA` |
| Baseline production deployment | `dpl_C5X4z8JY2kdYVT4omyb2sLQUJWKR`, Git SHA `3f59f315dc952f61805d89fe79ad125ad1dad650` |
| Environment variables | Only `NEXT_PUBLIC_SITE_URL`; public canonical origin, stored as Sensitive for Production; no secret value is client-exposed |
| Initial validation | Lockfile install, typecheck, lint, build, and production-like start passed; no repository test script exists |
| Initial npm audit | 3 vulnerabilities: 2 High, 1 Moderate |
| Initial production headers | HSTS present; CSP, nosniff, referrer policy, permissions policy, clickjacking headers, COOP, and CORP absent |

The official [Next.js July 2026 Security Release](https://nextjs.org/blog/july-2026-security-release) identifies `16.2.11` as the Active LTS security release addressing four High and five Medium vulnerabilities.

## Externally reachable attack surface

| Route or component | Method | Visibility | Input | External service | Authentication | Rate limiting | Validation | Risk / action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` and section anchors | GET / HEAD | Public | URL fragment only; not sent to server | Google Analytics / Tag Manager | None required | Platform DDoS controls | No server input | Low; retain static rendering and enforce CSP |
| `/_not-found` and unknown routes | GET / HEAD | Public | Path | None | None | Platform controls | Next.js static 404 | Low; verified no stack or local-path disclosure |
| `/robots.txt` | GET / HEAD | Public | None | Search crawlers | None | Platform controls | Static metadata route | Informational; retain |
| `/sitemap.xml` | GET / HEAD | Public | None | Search crawlers | None | Platform controls | Static metadata route | Informational; retain |
| `/icon.jpg` and `/assets/**` | GET / HEAD | Public | Fixed asset path | None | None | CDN / platform controls | Fixed files only | Low; CORP reduces cross-origin embedding/hotlinking |
| Legacy `/about`, `/work`, `/capabilities`, `/publications`, `/contact` | GET / HEAD | Public redirect | Fixed path | None | None | Platform controls | Fixed allow-listed redirects | Low; no user-controlled destination |
| `ascendvanta.com/**` | GET / HEAD | Public redirect | Path | Vercel domains | None | Platform controls | Vercel-managed permanent redirect | Low; verified apex to `www` |
| `ascend-vanta.vercel.app/**` | GET / HEAD | Public alias | Path | Vercel | None | Platform controls | New fixed-host redirect to canonical origin | Low after deployment |
| Raw deployment / preview URLs | GET / HEAD | Private | URL | Vercel Authentication | Vercel account or authorized share | Platform controls | Standard Deployment Protection | Low; verified 302 to Vercel authentication and `noindex` |
| Approved social-profile links | User navigation | Public external link | None | LinkedIn, GitHub, Instagram, Facebook, TikTok | Provider-specific | Provider-specific | Fixed approved URLs | Low; safe external-link attributes already present |
| Google Analytics loader and collection | Browser request | Public third party | Standard analytics telemetry | Google | None | Provider controls | Fixed measurement ID and allow-listed origin | Medium privacy/supply-chain exposure; accepted |

No Pages Router, dynamic route, Route Handler, API route, Server Action, middleware/proxy, authentication callback, session, application cookie, form, webhook, Draft Mode endpoint, service worker, manifest, CMS connector, database client, or public mutation endpoint was found. Consequently there is no application input or mutation path that needs server-side validation, CSRF protection, origin validation, or application rate limiting.

## Security findings

| ID | Severity | Affected area | Evidence and exploit scenario | Remediation | Status / verification |
| --- | --- | --- | --- | --- | --- |
| AV-SEC-001 | High | Next.js and transitive dependencies | Initial audit returned two High and one Moderate finding. A reachable framework vulnerability could affect server rendering or build/runtime behavior. | Updated Next.js to `16.2.11`, React packages to `19.2.8`, and constrained `sharp` `0.35.0` and `postcss` `8.5.19`. | Fixed locally. `npm audit` and `npm audit --omit=dev` both return 0 vulnerabilities; build and browser regression pass. |
| AV-SEC-002 | Medium | All responses | Production lacked CSP, nosniff, referrer, permissions, clickjacking, COOP, and CORP headers, increasing injection, framing, and information-leak impact. | Added tested enforced CSP, HSTS, XFO DENY, nosniff, strict referrer policy, restrictive permissions policy, COOP, CORP, and X-XSS-Protection 0. | Fixed locally. Header inspection passed on page, metadata routes, 404, and assets. Pending deployment. |
| AV-SEC-003 | Medium | `ascend-vanta.vercel.app` | The stable project alias served the same public site, creating an unnecessary duplicate origin and impersonation/canonical ambiguity. | Added a host-specific permanent redirect to `https://www.ascendvanta.com/:path*`. | Fixed locally. Production-like host-header test returns 308 to the exact canonical path. |
| AV-SEC-004 | Medium | Build-time canonical origin | Any syntactically valid `NEXT_PUBLIC_SITE_URL` could become the metadata and schema origin at build time. A misconfigured or compromised build variable could emit hostile canonical URLs. | Fail closed unless the value is exact HTTPS `www.ascendvanta.com` with no credentials or port. | Fixed locally. Canonical, Open Graph, Twitter, and JSON-LD checks return only the production origin. |
| AV-SEC-005 | Low | JSON-LD rendering | Root layout serialized JSON-LD directly with raw `dangerouslySetInnerHTML`. Current data is static, but the pattern could become script-breakout-prone if data later became untrusted. | Reused the central serializer that escapes `<` as `\u003c`. | Fixed locally. Only the safe serializer remains. |
| AV-SEC-006 | Medium | Repository supply chain | No Dependabot configuration or security validation workflow was present. | Added weekly grouped npm/Actions updates and a least-privilege workflow running locked install, high-severity production audit, typecheck, lint, and build. Action revisions are immutable SHAs. | Fixed locally; requires push before GitHub can execute it. |
| AV-SEC-007 | Medium | GitHub `main` | Default branch is not protected; force pushes and deletion are not blocked and checks are not required. | Require PRs and the new `Security checks` job, block force pushes/deletion, and preserve an owner recovery path. | Open account-owner action. Do this only after the workflow exists on `main`. |
| AV-SEC-008 | Medium | GitHub code security | Secret scanning and push protection are enabled with zero alerts, but Dependabot alerts/security updates and CodeQL are disabled/not configured. | Enable Dependency Graph, Dependabot alerts and security updates, then enable CodeQL default setup for JavaScript/TypeScript. | Open account-owner action; not changed to avoid altering repository administration before review. |
| AV-SEC-009 | Low | Vercel WAF | No project custom rules exist. Platform controls already return 403 for common WordPress probes and 404 for absent sensitive paths. | Add the two log-first rules documented below, observe legitimate traffic, then change to deny. | Recommended, not applied. |
| AV-SEC-010 | Medium | Public Git history | Original Blender design sources and `.blend1` backups exist in historical commits. They are not in the current tree or deployment, but the public repository history remains downloadable. | If these files are proprietary, rotate to a fresh sanitized public repository or approve a coordinated history rewrite. Removing current files alone cannot erase public history. | Open decision. No history rewrite performed. |
| AV-SEC-011 | Low | CSP | Static Next.js bootstrap, analytics, GSAP/Three styles, and Draco decoding require narrowly scoped exceptions: inline script/style, `wasm-unsafe-eval`, blob sources, Google Analytics/Tag Manager, and `www.gstatic.com`. | Kept the site static, used exact origins, omitted wildcard and general `unsafe-eval`, and tested every major viewport/motion mode. | Accepted residual risk; a nonce CSP would require dynamic rendering and was not justified. |
| AV-SEC-012 | Informational | Public frontend/media | Public HTML, JavaScript, media, structured data, and visual design can be downloaded or imitated. | Frame denial, canonical metadata, structured identity, CORP, disabled public source maps, and official security reporting reduce practical abuse. | Inherent limitation; cannot be eliminated without breaking the public site. |
| AV-SEC-013 | Low | Accessibility baseline | Isolated Lighthouse accessibility score was 89. Existing issues include prohibited ARIA attributes, invalid definition-list structure, and visible-label/accessibility-name mismatch. | Address in a separate accessibility change set with visual and assistive-technology review. | Open pre-existing quality gate; not caused by security changes and not broadened into this branch. |

No Critical finding remains open.

## Secret and sensitive-file review

| Scope | Result |
| --- | --- |
| Current tracked source | No high-confidence private key, token, password, connection string, service-account file, Vercel token, GitHub token, provider secret, or private email found |
| `.env*` | Only `.env.example`, containing the public production URL; local environment files are ignored |
| Vercel variables | Only `NEXT_PUBLIC_SITE_URL`; no secret is exposed with a `NEXT_PUBLIC_` prefix |
| Git history | No credential-pattern or sensitive filename hit other than `.env.example`; historical Blender source and backup files found as documented in AV-SEC-010 |
| `public/` | 260 files, approximately 23 MB; no environment, key, certificate, log, database, archive, backup, or source-design extension found |
| Generated build/client | No private email, localhost/preview origin, credential marker, or public browser source map found; `.next/static` contains zero `.map` files |
| GitHub secret scanning | Enabled, push protection enabled, zero open alerts |
| Tool limitation | Gitleaks, TruffleHog, ExifTool, and OWASP ZAP were not available; no result is claimed for those tools |

No credential rotation is required from the evidence found. If GitHub or provider audit logs later reveal an exposed credential, revoke it first, rotate it in the provider, update only the appropriate Vercel environment, and invalidate sessions before any history cleanup.

## Code and file changes

| File | Change |
| --- | --- |
| `next.config.ts` | Enforced tested CSP and defensive headers; disabled public production browser source maps and framework identification; constrained Next Image; redirected canonical Vercel alias |
| `package.json` | Patched Next.js, React, and React DOM; added narrow transitive security overrides |
| `package-lock.json` | Preserved exact patched dependency resolution and integrity metadata |
| `src/app/layout.tsx` | Replaced raw JSON-LD serialization with the existing safe serializer |
| `src/lib/siteMetadata.ts` | Restricted metadata origin to the exact canonical production URL |
| `.github/dependabot.yml` | Added grouped weekly npm and GitHub Actions update checks |
| `.github/workflows/security-checks.yml` | Added pinned, read-only security validation CI |
| `SECURITY.md` | Added private vulnerability-reporting instructions without a personal email |
| `docs/ascend-vanta-production-security-hardening-report.md` | Added this evidence, residual-risk, platform, validation, and rollback record |

No route, page, animation, visual component, form, API, authentication system, dependency category, or public asset was added or removed.

## Content Security Policy validation

The CSP was first exercised in Report-Only mode. The first pass found no application source violation. After enforcement, browser testing exposed the Three.js Draco decoder's legitimate blob fetch, `www.gstatic.com` download, and WebAssembly compilation. Only those exact capabilities were added:

- `blob:` for required decoder/media/worker paths.
- `https://www.gstatic.com` for the Draco decoder.
- `'wasm-unsafe-eval'` for WebAssembly compilation, without general `'unsafe-eval'`.

The enforced retest completed with zero console errors, zero CSP errors, and zero failed critical requests across desktop, tablet, mobile, and reduced-motion modes.

The remaining `'unsafe-inline'` script/style exceptions are accepted because the statically generated Next.js bootstrap, analytics integration, and animation runtime use inline output. Next.js documents that nonce-based CSP requires dynamic rendering. This branch intentionally preserves static rendering and does not enable experimental SRI.

## Vercel configuration

### Verified existing controls

- Production domain is `www.ascendvanta.com`; apex returns HTTP 308 to the exact `www` URL.
- Current production homepage, robots, and sitemap return HTTP 200.
- Raw generated deployment URLs and preview/branch URLs return 302 to Vercel Authentication with `x-robots-tag: noindex`.
- The public primary custom domain remains accessible.
- Vercel-managed HTTPS is valid in browser and command-line checks; no mixed-content or browser network error was observed.
- Common sensitive/development paths return 404; common WordPress probes return Vercel 403.
- Vercel environment inventory contains only the public canonical URL variable and does not unnecessarily share a production credential.
- No custom WAF rule or pending firewall change exists.

### Changes applied in code, not yet deployed

- Full response-header policy.
- Canonical redirect for `ascend-vanta.vercel.app`.
- Patched dependency/build output.

### Recommended WAF rules

Vercel recommends beginning custom rules with `log` and observing traffic before denying. Custom rules are available on all plans; persistent actions require Pro or Enterprise. These rules were not published because they change live production immediately and should be reviewed with the branch:

| Name | Condition | Initial action | Eventual action / duration | Purpose | False-positive risk | Rollback |
| --- | --- | --- | --- | --- | --- | --- |
| Log sensitive artifact probes | Path starts with `/.env` OR `/.git` OR ends with `.bak`, `.old`, or `.sql` | Log for 24–72 hours | Deny; no persistent duration | Reject credential, repository, backup, and database-file probes | Very low for the current static site | Disable/delete the rule and publish the firewall change |
| Log obsolete PHP/CMS probes | Path starts with `/wp-admin`, `/wp-login.php`, or `/wp-content`; equals `/xmlrpc.php`; or ends with `.php` | Log for 24–72 hours | Deny; no persistent duration | Reduce noise and common automated exploit traffic against a non-PHP site | Low while the site has no PHP/download path ending in `.php` | Disable/delete the rule and publish the firewall change |

No application rate-limit rule is justified because there is no form, API, login, or mutation endpoint. Vercel's platform DDoS mitigation remains active. Scanner user-agent blocks were not recommended because they are easy to evade and have a higher crawler/accessibility-tool false-positive risk.

### Dashboard/account actions

- Keep Deployment Protection at Standard Protection. Audit and revoke stale Shareable Links.
- Review old aliases in Project Settings → Domains; remove only aliases confirmed unused.
- Review team members, project roles, integrations, webhooks, and access tokens; revoke stale access.
- Enable security notifications and review Firewall traffic before promoting log rules to deny.
- The CLI indicated IP Bypass/System Bypass is unavailable on the current plan; it is not needed for this public site.

## GitHub account/repository checklist

- Enable Dependabot alerts, Dependabot security updates, and the Dependency Graph.
- Enable CodeQL default setup for JavaScript/TypeScript after the security branch is on `main`.
- Protect `main`: require a pull request, require the `Security checks / validate` status, dismiss stale approvals if collaborators are added, block force pushes, and block deletion.
- Confirm repository-owner 2FA; prefer a passkey or two hardware keys and store recovery codes offline.
- Review collaborators, deploy keys, GitHub Apps, webhooks, fine-grained tokens, classic PATs, and OAuth grants; revoke anything unused.
- Keep Actions default token permissions read-only and allow write access only in a specifically reviewed workflow.
- Decide whether the public Git history should continue exposing historical source-design files.

Do not enable branch requirements until the new workflow has successfully run on `main`, or the owner could be locked out by a nonexistent required check.

## Registrar, DNS, and email-security checklist

Observed public DNS:

- Nameservers: GoDaddy `domaincontrol.com`.
- Apex A records resolve to Vercel.
- `www` points to Vercel.
- MX points to Microsoft/GoDaddy-hosted mail protection.
- SPF: `v=spf1 include:secureserver.net -all`.
- DMARC exists with `p=quarantine` and aggregate reporting.
- No CAA record was observed.
- No DS record was observed, so public DNSSEC delegation is not currently visible.
- Common DKIM selector probes did not resolve; the active selector must be confirmed in the Microsoft 365/GoDaddy mail dashboard.

Account-owner actions:

- Enable registrar MFA/passkey or hardware key, registrar lock, auto-renew, recovery contacts, and change notifications.
- Enable DNSSEC only after GoDaddy and the registry show compatible records and a rollback path.
- Add CAA only after inventorying every certificate authority legitimately used by Vercel and any mail or auxiliary service; do not guess.
- Confirm Microsoft 365/GoDaddy DKIM is enabled for the actual selector.
- Review DMARC aggregate reports, then consider moving from `quarantine` toward `reject` only after SPF/DKIM alignment is consistently healthy.
- Monitor certificate transparency and typo domains; reserve important brand/social handles.

## Validation results

| Check | Exact result |
| --- | --- |
| Locked install | `npm ci` passed |
| Typecheck | `npm run typecheck` passed |
| Lint | `npm run lint` passed |
| Tests | Not available: `package.json` contains no test script; no test result is fabricated |
| Production build | `npm run build` passed on Next.js `16.2.11`; five static routes, unchanged from baseline |
| Production-like start | `next start` passed on localhost |
| Complete npm audit | 0 vulnerabilities |
| Production npm audit | 0 vulnerabilities |
| Registry integrity | 424 package signatures verified; 86 provenance attestations verified |
| Outdated review | Patch/minor updates remain for Tailwind, ESLint, and meshoptimizer; Three/types and TypeScript have newer majors. They were not broadened into this security patch |
| Static source-map check | 0 files under `.next/static` |
| Header validation | All configured headers present on page, metadata routes, 404, and assets; `X-Powered-By` absent |
| CSP | Report-Only exercise completed, required sources corrected, enforced exercise passed with 0 console/CSP errors and 0 failed critical requests |
| Route validation | Source and build manifests contain only intended static routes; sensitive/development production probes returned 404 or Vercel 403 |
| Error disclosure | Custom/unknown 404 returned 404 with no stack, filesystem path, source snippet, or environment marker |
| Metadata | Canonical and Open Graph URL are `https://www.ascendvanta.com`; Open Graph/Twitter image is on the production origin; no localhost or preview origin |
| Link validation | Google loader, canonical site, GitHub, Instagram, and Facebook responded successfully. LinkedIn rejects HEAD with 405 and TikTok blocks automation with 403; browser links are fixed approved URLs, so these anti-bot responses are not classified as broken |
| Desktop interaction | Skip Sequence moved past the pin, hid, and did not block continued scroll; publication filters and pagination worked; 0 overflow, console errors, or failed requests |
| Responsive / motion matrix | 1440, 1024, and 390 px normal mode: overflow 0; desktop/tablet pin count 1, mobile 0. The same widths with reduced motion: pins 0. All six runs had 0 console errors and 0 failed requests |
| Visual/runtime coverage | Hero, Vanta/Three scene, frame sequence, ecosystem artwork, publications, prompt gallery, About, analytics loader, and 404 rendered without observed security-branch regression |
| Physical devices | Not measured by this automated pass; iOS Safari, Android Chrome, macOS Safari, Windows Chrome/Edge, keyboard-only, VoiceOver, NVDA, and long-session thermal/memory checks remain manual gates |

### Performance comparison

Final isolated local mobile Lighthouse runs used a 390 × 844 simulated viewport against production-mode `next start`:

| Run | Performance | Accessibility | Best Practices | SEO | FCP | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 90 | 89 | 100 | 100 | 0.915 s | 3.689 s | 0.000 | 19.5 ms |
| 2 | 89 | 89 | 100 | 100 | 0.905 s | 3.787 s | 0.000 | 16.5 ms |
| 3 | 90 | 89 | 100 | 100 | 0.905 s | 3.688 s | 0.000 | 18.0 ms |
| Median | 90 | 89 | 100 | 100 | 0.905 s | 3.689 s | 0.000 | 18.0 ms |

An initial exploratory trio ran while other browser processes were contending for resources and produced performance scores 70/72/89 and LCP 6.906/7.604/3.767 seconds. Those results are retained here, not hidden, but are invalid for release comparison because the environment was not isolated.

The prior real-production certification recorded median performance 96, LCP 2.731 seconds, CLS 0.000, and TBT 16 ms. Local `next start` lacks the production CDN, HTTP/2 edge path, and identical network behavior, so the local LCP is not evidence of a material production regression. Structural output, CLS, TBT, frame-request behavior, and interaction checks remain stable. A protected Vercel preview must be measured with the same production Lighthouse configuration before production promotion.

## Risk acceptance and limitations

- The CSP permits narrowly scoped inline script/style, WebAssembly compilation, blob URLs, Google Analytics/Tag Manager, and the Google-hosted Draco decoder. Removing these now would break current rendering or require dynamic nonce rendering.
- Google Analytics receives standard browser telemetry under the site's configured consent/privacy posture.
- Public frontend code, optimized media, artwork, and branding remain downloadable and can be imitated.
- CORP reduces casual cross-origin resource reuse but cannot prevent a third party from downloading and rehosting a public asset.
- Historical source-design files remain in a public Git history.
- The current Vercel plan does not expose every advanced protection feature; custom rules and platform DDoS protection are available, while persistent actions/System Bypass have plan limits.
- ZAP, Gitleaks, TruffleHog, ExifTool, real assistive technology, and physical-device labs were unavailable; their results are not claimed.
- A production deployment, preview CSP/header check, production analytics verification, and comparable production-domain Lighthouse run remain necessary.

## Rollback plan

Before deployment, rollback is simply discarding the unpushed security branch; the known-good production commit remains `3f59f315dc952f61805d89fe79ad125ad1dad650`.

After a reviewed security commit is deployed:

1. Identify the security commit and use `git revert <security-commit-sha>` on a new rollback branch. Do not rewrite `main`.
2. Run `npm ci`, typecheck, lint, and build on the revert.
3. Merge/push through the normal protected process.
4. If immediate restoration is required, promote Vercel deployment `dpl_C5X4z8JY2kdYVT4omyb2sLQUJWKR`, then follow with the Git revert so source and production converge.
5. Verify homepage, robots, sitemap, redirects, console/network, animation controls, and production SHA.

For a WAF rollback, disable or delete only the named custom rule, review the firewall diff, publish it, and confirm the previously matched path no longer appears under that rule. Deployment Protection should remain enabled.

## Release decision

The local security branch is ready for review and a protected preview. It is not yet certified for production because the branch has not been pushed, CI has not run, no comparable Vercel preview performance measurement exists, and the new headers have not been observed on a Vercel deployment.

Recommended release sequence:

1. Review and commit the isolated diff.
2. With explicit approval, push only `security/production-hardening`.
3. Verify the protected Vercel preview: deployment SHA, CSP, headers, console/network, analytics, full interaction matrix, accessibility smoke test, and three isolated mobile Lighthouse runs.
4. Merge through a protected/reviewed path only if those checks pass.
5. Recertify the custom production domain and then consider the two WAF rules in log mode.

Current verdict: materially hardened and locally validated; safe to proceed to protected preview, not yet approved for broad production deployment.
