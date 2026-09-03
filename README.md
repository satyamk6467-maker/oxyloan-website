# OxyLoan

A premium, dark-themed marketing website for **OxyLoan**, a decentralized
lending protocol concept. Built with Next.js 16 (App Router), React 19,
TypeScript, Tailwind CSS, and Framer Motion.

## Getting Started

```bash
npm install
cp .env.example .env.local   # then fill in real values
npm run dev
```

Visit `http://localhost:3000`.

## Project Structure

```
src/
  app/                  # Next.js App Router pages
    page.tsx            # Home
    about/
    tokenomics/
    roadmap/
    whitepaper/
    faq/
    contact/
    legal/
      privacy-policy/
      terms-of-service/
    api/contact/        # Contact form submission endpoint (server-only)
    layout.tsx           # Root layout: fonts, metadata, Navbar/Footer
    globals.css
    sitemap.ts
    robots.ts
  components/
    layout/             # Navbar, Footer
    home/                # Hero, Features, TokenomicsChart, RoadmapTimeline,
                          # SecuritySection, FAQAccordion, ContactForm, CtaSection
    ui/                  # GlassCard, AnimatedButton, SectionHeading,
                          # ParticleBackground
  lib/
    constants.ts         # ALL editable placeholder content lives here
    types.ts
    utils.ts
```

## Editing Content

Nearly all placeholder copy — feature descriptions, tokenomics percentages,
roadmap milestones, FAQ items, social links — lives in a single file:
**`src/lib/constants.ts`**. Update the exported arrays there rather than
hunting through components.

## Environment Variables

See `.env.example`. Everything prefixed `NEXT_PUBLIC_` is exposed to the
browser — never put secret keys there. If you wire up the contact form to a
real email/CRM provider, add a **server-only** variable (e.g.
`CONTACT_API_KEY`) and reference it only inside
`src/app/api/contact/route.ts`.

## Assets To Replace Before Launch

- `public/favicon.ico`
- `public/og-image.png` (1200×630 social preview image)
- `public/OxyLoan-Whitepaper.pdf` (linked from the Whitepaper page)

## Scripts

| Command           | Description                       |
| ------------------ | ---------------------------------- |
| `npm run dev`       | Start local dev server             |
| `npm run build`     | Production build                   |
| `npm run start`     | Serve the production build         |
| `npm run lint`      | Run ESLint                         |
| `npm run format`    | Run Prettier                       |

## Notes

- No secrets are hardcoded anywhere in this repository.
- Tokenomics and roadmap figures are **placeholders** — clearly marked in
  code comments — and must be finalized before public launch.
- Legal pages (`/legal/privacy-policy`, `/legal/terms-of-service`) contain
  placeholder text and require review by qualified counsel.
