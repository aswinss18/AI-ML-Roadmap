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
Keep Next.js App Router, JavaScript, Tailwind 4, and Geist. Use the official shadcn CLI, Radix primitives, Lucide icons, and next-themes. Design authority comes from the user's request to redesign the whole application. The final direction is a compact workbench: ink tool rail, white or graphite surfaces, cool gray document canvas, restrained blue controls, and integrated panes. Token values live in app/globals.css.

## Page composition
- Shared shell: 76px tool rail with short labels and tooltips; one compact header; search, help, and persistent appearance controls; mobile Sheet navigation. A hidden desktop rail can be restored from the header.
- Brochure: source/model inspector, functional Editorial/Minimal presentation controls, output outline, document preview or plain text, and copy/Markdown export. The submitted source remains attached to its generated document. Layout is a preview presentation preference; Markdown export contains the content.
- Tutor: focused question composer with model selection and prompt starters; streamed explanation above the composer; immediate stop feedback and a stable answer-model identity.
- Model conversations: participant model inspector, central topic composer, prompt starters, actual session state/turn count, and a scrollable alternating transcript. Model settings become a compact strip on mobile.
- Genie: model toolbar, composer beside the introductory prompt in the empty state, then a scrollable conversation with the composer below. User messages stay right aligned. No unsupported reset or history controls.

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

- ESLint and the production build passed.
- All 14 Playwright tests passed against the production build with controlled API responses.
- Automated WCAG A/AA checks found no violations on the four entry screens in light and dark themes.
- Desktop and 375px mobile screenshots were inspected, including provider selectors.
- A long tutor response at 1280x720 scrolls while the composer remains visible; a 375x667 assistant viewport has no horizontal overflow and keeps Send visible.
- Stop behavior includes a regression assertion that cancellation does not submit a second request.
- Document layout controls, source focus, copy/download, theme persistence, command search, and restoring collapsed navigation were exercised.
- Live model inference was not part of the controlled browser suite.
