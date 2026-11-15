# AI Studio design

source: User commissioned application redesign, designed in this workspace.
character: Precise working application with an ink navigation rail, quiet controls, and task-specific workspaces.

## Build mandate

Use the whole viewport for the task. A 76px navigation rail and one 56px workspace header replace wide navigation and repeated page introductions. Controls live beside the content they affect. Avoid repeated card grids, decorative empty-state illustrations, promotional badges, fabricated history, and invented account data.

## Components and tokens

Use installed shadcn/ui primitives for interactive controls, navigation, tabs, menus, dialogs, and composers. Layout uses semantic HTML and CSS. Semantic tokens in app/globals.css are authoritative. Geist is the interface typeface; the editorial document uses Georgia for its generated headline. Lucide supplies interface icons. Verified provider marks in public/brands identify models, with mappings in components/model-identity.jsx. The original vector studio mark lives in components/brand-mark.jsx and public/brand/ai-studio-mark.svg.

## Workspaces

- Brochure: 300px source and presentation inspector, document toolbar, scrollable paper canvas, and export status. Editorial and Minimal layouts are functional presentation options. The paper remains white in dark mode to represent the exported document. Export is Markdown, so visual styling is preview-only.
- Tutor and Genie: composer immediately below the introduction in the empty state; scrollable answers above a stationary composer after submitting. Starter prompts are compact actions, not cards.
- Discussion: participant settings in the inspector, topic composer in the main conversation area, real session state and turn count, and a scrollable transcript. Mobile presents model selectors as a compact strip above the conversation.

## Responsive behavior

At 768px and above, the application uses the viewport height and panes scroll independently. Below 768px navigation becomes a shadcn Sheet. Brochure inspector and canvas stack in document order. Chat layouts keep input and send/stop controls accessible at 375px; long generated content scrolls independently and never widens the page. Collapsed desktop navigation can be restored using the revealed header toggle or Ctrl+B.

## Appearance and interaction

Light mode uses white surfaces and a cool gray canvas. Dark mode uses graphite surfaces. Blue is reserved for primary actions, focus, and selected presentation. Light, dark, and system preferences persist through next-themes. Focus rings, labels, live status, readable contrast, reduced motion, cancellation, and actionable error states are required.
