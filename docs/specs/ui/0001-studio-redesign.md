# Studio interface redesign

**Status**: Accepted
**Date**: 2026-11-15

## Summary
Rebuild all four AI Studio tools with shadcn/ui. A cohesive studio shell, clear task hierarchy, responsive layouts, and persistent light, dark, and system appearance replace the current separate visual styles.

## Requirements
- AC-1: Install shadcn/ui and use its components for all controls, panels, menus, and overlays.
- AC-2: All existing tool routes and API contracts continue working, including streaming, cancellation, model selection, retries, copy, and error states.
- AC-3: Provide light, dark, and system themes persisted through reloads.
- AC-4: Navigation works on desktop and mobile; forms and responses fit a 375px viewport and keyboard users can operate all controls.
- AC-6: Model selectors show correct brand assets and provider labels while keeping exact API identifiers. The studio has an original vector mark.
- AC-5: Every tool has considered empty, working, success, and error states, without fabricated account or usage data.

## Decision
Keep Next.js App Router, JavaScript, Tailwind 4, and Geist. Use the official shadcn CLI, Radix primitives, Lucide icons, and next-themes. Design authority comes from the user's request to make a complete premium redesign. The visual direction is a precise creative studio with warm neutral surfaces, graphite dark mode, monochrome controls and warm neutral accents, fine dividers, and strong typographic hierarchy. The user requested a second refinement toward standard professional UI, a custom studio logo, and correct provider marks in model selectors. Token values live in app/globals.css.

## Page composition
- Shared shell: brand, tool navigation, tool descriptions, appearance control, help dialog, and responsive sidebar. Breadcrumb header and workspace search provide consistent orientation.
- Brochure: page heading, split configuration and preview workspace, model selector, URL field, generation action, illustrative document empty state, real generated brochure, copy and Markdown download.
- Tutor: page heading, question composer and model selector, response area, starter questions and learning guidance. Streaming and stop states remain visible.
- Model conversations: topic setup, two participant cards and model selectors, conversation transcript with clearly separated speakers and lifecycle status.
- Genie: centered welcome, prompt starters, model toolbar, bottom composer, and readable conversation with user messages aligned right.

## Value sourcing
| Value | Source |
| --- | --- |
| Theme | next-themes local preference or OS preference |
| Navigation and prompts | Local static content |
| Brochure | POST /generate-brochure with {url, model} |
| Tutor response | POST /teach-stream with {question, model}, SSE |
| Genie models and answer | GET /models and POST /chat-assistant with {message, model}, raw text stream |
| Conversation models and turns | GET /models and POST /mutimodel-chat with {topic, liz_model, jarviz_model}, NDJSON |
| API addresses | Existing NEXT_PUBLIC_* variables and current fallback ports |

## Build plan
1. Install shadcn and establish semantic tokens and shared shell.
2. Rebuild each page around its existing API behavior.
3. Check lint, production build, real browser rendering, keyboard interaction, responsive layouts, themes, and controlled API success/error/stream states.

## Consequences
Generated shadcn components are owned source files. Layouts use semantic HTML and CSS; all interactive primitives use shadcn. No database or backend migration is needed. Model inference still depends on the existing local APIs and Ollama. User edits to the multi chat port and Genie message alignment are retained.

## Rationale
A shared shell and consistent controls reduce the learning cost across the tools. Distinct page compositions make their purpose clear without multiplying visual systems. Recoloring the existing CSS would retain its structural problems.

## References
- https://ui.shadcn.com/docs/installation/next
- https://ui.shadcn.com/docs/dark-mode/next
- Installed Next.js documentation in node_modules/next/dist/docs/


## Verification
Completed on 2026-11-15. No existing scope row matched this UI redesign.

- ESLint passed.
- Production build passed for all routes.
- All 13 Playwright browser tests passed against the production build with controlled API responses.
- Automated WCAG A and AA checks found no violations on all four entry screens in light and dark themes.
- Desktop and 375px mobile screenshots were inspected, including the model dropdown.
- Live model inference was not part of the controlled browser suite.
