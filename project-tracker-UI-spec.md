# PROJECT-TRACKER-UI-SPEC.md

## Project
UI enhancement for the Project Tracker kanban board.

## Objective
Modernize the existing Project Tracker UI to create a cleaner, more polished, and more intuitive kanban experience while preserving the current workflow and simplicity of the application.

The enhancement should improve:
- visual hierarchy
- task state recognition
- spacing and readability
- affordance for interaction
- overall aesthetic consistency

The resulting UI should feel similar to a modern SaaS application, with a look inspired by products such as Linear, Vercel, and other minimalist project management tools.

---

## Current State
The current board contains:
- a left sidebar listing projects
- a project board view for the selected project
- sprint/task filtering controls at the top
- four task columns:
  - Backlog
  - In Progress
  - In Review
  - Done
- task cards displayed within the columns

The current design is functional but visually flat, uses very little color, and does not provide strong visual cues for status.

---

## Design Goals
1. Introduce a tasteful, modern color system that improves recognition of task status.
2. Preserve a clean and professional interface; avoid loud or overly saturated colors.
3. Keep the page background and main layout mostly neutral.
4. Use color primarily as a semantic indicator for workflow state.
5. Increase visual distinction between board sections, column headers, and task cards.
6. Improve perceived interactivity through spacing, hover states, and elevation.
7. Ensure the design remains accessible and readable.

---

## Core UX Direction
### General Principles
- The overall page background should remain light and neutral.
- Board columns should be visually grouped using soft containers.
- Task cards should remain primarily white for readability.
- Each workflow state should be indicated using a distinct accent color.
- Color should be applied through column header tinting, status dots, badges, and card left borders rather than full heavy card backgrounds.

### Preferred Visual Style
- minimalist
- modern SaaS
- soft shadows
- large rounded corners
- restrained, semantic color usage
- high readability
- spacious layout

---

## Required Board Layout
The board must continue to support four workflow columns in this order:
1. Backlog
2. In Progress
3. In Review
4. Done

Each column should contain:
- a styled column header
- a task count indicator
- task cards
- an optional add-task button/area at the bottom

---

## Color Requirements
### Status Color Mapping
Use the following semantic color mapping:

#### Backlog
- meaning: not started / queued / low immediacy
- color family: slate / gray
- recommended examples:
  - header background: `slate-100`
  - header text: `slate-700`
  - accent dot: `slate-400`
  - card left border: `slate-300`
  - badge background: `slate-100`
  - badge text: `slate-600`

#### In Progress
- meaning: actively being worked on
- color family: blue
- recommended examples:
  - header background: `blue-50`
  - header text: `blue-700`
  - accent dot: `blue-500`
  - card left border: `blue-400`
  - badge background: `blue-100`
  - badge text: `blue-700`

#### In Review
- meaning: pending review / waiting on feedback / attention needed
- color family: amber
- recommended examples:
  - header background: `amber-50`
  - header text: `amber-700`
  - accent dot: `amber-500`
  - card left border: `amber-400`
  - badge background: `amber-100`
  - badge text: `amber-700`

#### Done
- meaning: completed / accepted
- color family: emerald / green
- recommended examples:
  - header background: `emerald-50`
  - header text: `emerald-700`
  - accent dot: `emerald-500`
  - card left border: `emerald-400`
  - badge background: `emerald-100`
  - badge text: `emerald-700`

### Color Usage Rules
- Do not use highly saturated backgrounds for entire columns.
- Do not make the whole board colorful; keep the structure neutral.
- Use color sparingly and consistently.
- Task cards should remain white or near-white.
- Any tinted surfaces must be subtle.

---

## Page-Level UI Requirements
### Background
- Use a light neutral page background, such as `slate-50`.
- Avoid plain stark white for the entire page if it makes the interface feel flat.

### Container Width
- The board should be centered within a max-width container.
- Recommended max width: approximately `max-w-7xl`.

### Spacing
- Add generous padding around the board.
- Recommended page padding:
  - mobile: `p-4` to `p-6`
  - desktop: `p-6` to `p-8`

### Typography
- The project title should be visually prominent.
- Use clear hierarchy for:
  - app/section label
  - project title
  - supporting description or context text
  - column titles
  - card titles
  - badge labels

---

## Header Area Requirements
The board header area should include:
- a small label such as “Project Tracker”
- the selected project name
- optional supporting text describing the board/sprint context
- top-level controls such as:
  - task filter selector
  - sprint selector or current sprint control
  - a primary “New Task” action

### Header Styling
- Layout should support responsive stacking on smaller screens.
- Desktop layout should place title/context on the left and actions on the right.
- Buttons should use rounded corners and subtle borders/shadows.
- The primary action should be visually distinct from secondary actions.

---

## Sidebar Requirements
The left project sidebar should also be visually refreshed to match the board.

### Sidebar Expectations
- selected project should be clearly highlighted
- project list rows should have better hover/active states
- add-project action should be visually aligned with the rest of the design system
- spacing and typography should match the updated board style

### Sidebar Style Direction
- neutral background
- subtle dividers or section labels
- active item with light tinted or elevated state
- consistent rounded corners where appropriate

---

## Column Requirements
Each column should be rendered as a soft container.

### Column Container Style
- rounded corners
- subtle border
- light background or translucent white background
- optional light blur effect if supported by the design system
- spacing between columns should be visually comfortable

### Column Header Style
Each column header must include:
- colored/tinted header background
- status dot indicator
- column title
- task count badge

Recommended style direction:
- rounded header container
- small, bold title text
- compact numeric pill for task count

---

## Task Card Requirements
Task cards are the most important interactive element and must be visually improved.

### Card Styling
Each task card should have:
- white background
- rounded corners
- subtle border
- left status border using the column color
- soft shadow
- internal padding
- improved spacing between title and metadata

### Card Content
At minimum, the card should support:
- task title
- optional metadata/tags such as priority, type, or state labels
- optional overflow menu button or actions menu

### Card Interaction States
Cards should support:
- hover elevation
- hover shadow increase
- slight upward movement on hover
- cursor/state cues if draggable

Recommended interaction feel:
- subtle and polished, not exaggerated

### Done Cards
Done cards may optionally have slightly reduced visual emphasis, but they must remain readable.
Possible approaches:
- slightly softer text color
- slightly reduced contrast in metadata
- no aggressive fading

---

## Badge / Tag Requirements
Tags should be displayed as compact pill badges.

### Badge Styling
- rounded full shape
- small text size
- status-aligned tint where appropriate
- adequate contrast for readability

### Priority Support
If priorities are displayed, recommended mappings are:
- low: gray/slate
- medium: yellow/amber
- high: red/rose

Priority badges must remain visually distinct from workflow-state accents.

---

## Add Task CTA Requirements
Each column should have an add-task affordance at the bottom.

### Add Task Style
- full-width button or drop zone style area
- dashed border
- soft neutral background
- rounded corners
- hover state indicating clickability

Text example:
- `+ Add task`

---

## Responsive Requirements
The updated design must work well across screen sizes.

### Mobile / Small Screens
- columns should stack vertically
- controls should wrap cleanly
- spacing should remain comfortable
- no horizontal overflow caused by fixed-width cards where avoidable

### Tablet / Desktop
- board should display multiple columns in a row
- four-column layout should be supported on larger screens
- header controls should align horizontally when space allows

---

## Accessibility Requirements
The enhancement must be accessible.

### Accessibility Expectations
- text contrast must meet readable standards
- color must not be the only indicator of state
- status should also be represented by text labels
- interactive elements must have visible hover/focus states
- buttons and task actions must have appropriate target sizes
- keyboard navigation should not be degraded

---

## Motion and Interaction Requirements
Subtle motion should be used to improve perceived quality.

### Allowed Motion
- gentle hover elevation on cards
- button hover feedback
- subtle transitions for shadows, background, and transform

### Avoid
- excessive animation
- large movement distances
- distracting transitions

Recommended duration range:
- `150ms` to `200ms`

---

## Visual Reference Summary
The intended implementation should resemble:
- clean developer-tool UI
- kanban board with neutral structure and semantic color accents
- modern card-based workflow layout
- polished but restrained interface

The board should feel:
- clear
- premium
- modern
- lightweight
- practical

---

## Suggested Tailwind Direction
The following utility directions are acceptable reference guidance for implementation:

### Page
- `bg-slate-50`
- `text-slate-900`
- `max-w-7xl`
- `p-6 md:p-8`

### Column Shell
- `rounded-3xl`
- `border border-slate-200`
- `bg-white/70`
- `shadow-sm`

### Column Header
- `rounded-2xl`
- `border`
- `px-3 py-2`
- status-specific tinted background/text/border classes

### Cards
- `rounded-2xl`
- `border`
- `border-l-4`
- `bg-white`
- `p-4`
- `shadow-sm`
- `hover:shadow-md`
- `hover:-translate-y-0.5`
- `transition duration-150`

### Buttons
- `rounded-2xl`
- secondary: neutral border + white background
- primary: dark background + white text

---

## Functional Constraints
This enhancement is primarily visual and UX-focused.

Unless otherwise required, it should not change:
- the underlying workflow states
- task movement logic
- sprint/task filtering behavior
- project selection behavior
- existing data model semantics

The implementation should enhance presentation without introducing unnecessary complexity.

---

## Acceptance Criteria
The enhancement is complete when all of the following are true:

1. The board uses a modern neutral base with semantic colors for the four workflow states.
2. Each column has a visually distinct tinted header with a status dot and task count.
3. Task cards are redesigned as white cards with colored left borders, rounded corners, and improved shadows.
4. Hover states are added to cards and key controls.
5. The page header is improved with clearer hierarchy and better action styling.
6. The sidebar styling is refreshed to match the new design language.
7. The interface remains readable and accessible.
8. The layout is responsive across mobile, tablet, and desktop.
9. The enhanced UI preserves existing workflow behavior.
10. The final result clearly reflects a polished modern SaaS kanban experience.

---

## Nice-to-Have Enhancements
These are optional and may be implemented after the core enhancement:
- drag-and-drop visual drop indicators
- improved empty-state illustrations or messaging
- task detail drawer/modal redesign
- light/dark theme support
- column collapse/expand support
- avatar chips for assignees
- due date indicators
- sprint summary strip at the top

---

## Implementation Priority
### Phase 1: Core Visual Refresh
- update page background and layout spacing
- redesign header area
- redesign sidebar visual treatment
- redesign columns
- redesign task cards
- add semantic colors
- add hover states

### Phase 2: UX Polish
- refine badges and metadata
- improve empty states
- improve add-task affordances
- tune responsive behavior
- improve keyboard/focus visibility

### Phase 3: Optional Enhancements
- drag-and-drop polish
- animations/micro-interactions
- theme support
- additional card metadata presentation

---

## Deliverable
A fully implemented updated UI for the Project Tracker kanban board that matches the described visual system and interaction model, with the enhancement applied consistently across the board, sidebar, headers, cards, and controls.

