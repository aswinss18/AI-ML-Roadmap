# AI Studio design

source: User commissioned redesign, designed in this workspace.
character: Restrained, precise product workspace with a distinct geometric identity.

## Build mandate

Create one coherent studio for four tools. Give every page a clear task, a useful starting point, and an honest response to loading and failure. Use generous spacing around headings, dense enough controls for productive work, and restrained accent color. Use monochrome controls, warm neutral surfaces, and direct task labels. Avoid decorative gradients, tilted illustrations, promotional slogans, stock imagery, excessive badges, and invented metrics.

## Components and tokens

Use shadcn/ui primitives from components/ui for controls and surfaces. Semantic color tokens in app/globals.css are authoritative. Geist is the interface typeface. Lucide supplies interface icons. Verified provider marks in public/brands identify models; components/model-identity.jsx owns mappings. components/brand-mark.jsx and public/brand/ai-studio-mark.svg contain the custom studio monogram. Layout and simple geometric document previews use CSS, with no external assets required.

## Responsive behavior

Desktop uses a fixed width sidebar and a flexible workspace. Below 768px, navigation becomes a shadcn Sheet. Split tool workspaces stack below 1100px. Controls wrap and content remains readable at 375px. Long prose, code, and tables must not widen the viewport.

## Appearance and motion

Support light, dark, and system via next-themes. All surfaces and controls use semantic tokens. Interaction transitions are short and reduced motion is respected. Focus rings, form labels, status messages, and meaningful empty states are part of every screen.
