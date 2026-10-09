# Intro component with sign up form

An implementation of the [Frontend Mentor intro component with sign up form challenge](https://www.frontendmentor.io/challenges/intro-component-with-signup-form-5cf91bd49edda32581d28fd1), using its supplied images, copy and design references.

The form is an honest demo: it validates in the browser and sends nothing. "Demo only: nothing is sent." stays visible under the button, and a successful claim says so again in a status message. There are no accounts, storage or network writes.

## Development

Node 22.13 or later. Use `npm ci`, `npm run dev`, `npm run lint`, `npm run typecheck`, `npm run build` and `npm test`. Browser tests use installed Chrome and own port 4561.

Next 16.3.6, React 19.2.8, TypeScript 5.9.3 and Tailwind 4.2.1 are pinned to the family baseline. The form uses TanStack Form 1.33.5 with a Zod 4.4.3 schema for validation only.

## Sources

Original challenge files are preserved under `reference/`; supplied images moved byte-for-byte to `public/images/`. Layout, spacing, colours, the 8px lift shadow and the three arrangements (mobile stack, tablet stack at 540px, desktop two columns) follow the decoded Figma frames. Poppins 400/500/600/700 and 500 italic are served through `next/font`.

## Implementation choices

- Validation runs on submit, then again on every change once a submit has been attempted, so fixed fields clear right away. Messages are the challenge's own ("First Name cannot be empty", "Looks like this is not an email"). On an invalid submit, focus moves to the first invalid field in form order; each input points at its message with `aria-describedby`.
- Creating a password asks for it twice ("Confirm Password", added beyond the design at Royer's request) and shows its one requirement, "At least 15 characters" (NIST SP 800-63B-4 for password-only sign-up), before anything is typed. The requirement is linked to the field, ticks over to a check with "(done)" once met, and is not a live region, so it is read with the field rather than on every keystroke. A mismatch says "Passwords do not match" on the confirmation field.
- Each input has a real (visually hidden) label as well as the design's placeholder. Placeholders stay visible in the error state so the field name never disappears.
- The submit button stays enabled and focusable while the simulated request runs. It shows a spinner and `aria-busy`, and a second submit is ignored.
- The design sets the banner and inputs at 15px and the terms and errors at 11px. The family 16px floor raises them all to 16px.
- Contrast: the error text, the "Terms and Services" emphasis and the terms copy use darker shades of the design's red and lavender (5.1:1 and 5.2:1 on white) because the originals fall under 2.6:1. The error border and icon keep the design's #ff7979. The intro copy uses the existing dark footer ink over the supplied coral image background, and the green button uses the existing input ink in both its default and hover states. Footer links keep dark text on hover with an underline; inline-block targets prevent wrapped links from intercepting one another.
- One site name, "Intro component with sign up form", appears in the footer, `og:site_name` and `WebSite` JSON-LD. The canonical URL is the attached `intro-component-with-signup-form-fm.royeradames.com` production domain.
