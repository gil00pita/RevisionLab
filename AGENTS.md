# Repository instructions

These rules apply to all authored application code in this repository.

## Component authoring: Chakra UI only

- Treat Chakra UI as the canonical implementation for every new or modified UI component. Do not write raw intrinsic HTML or SVG JSX in `src/` when Chakra provides an equivalent primitive or component.
- These repository rules take precedence over generic examples. Use the installed `@chakra-ui/react` package and its provider rather than introducing another component or styling library.
- Prefer Chakra controls such as `Button`, `Input`, `Textarea`, `Checkbox`, and `Tag` over hand-built equivalents.
- Import standard primitives from `@chakra-ui/react`, including `Box`, `Text`, `Heading`, `Link`, `Image`, and compound `List` and `Table` components. Use `Flex`, `Grid`, `SimpleGrid`, `Stack`, `HStack`, or `VStack` when their layout behavior fits.
- Use semantic polymorphism where needed, such as `Box as="main"` or `Heading as="h1"`. Preserve the correct DOM element and accessibility attributes.
- Do not use raw Chakra factory tags such as `<chakra.li>` or other `<chakra.*>` elements. Prefer the corresponding Chakra component, compound API, or a shared typed component built with semantic polymorphism; for example, build lists with `List.Root` and `List.Item`.
- Do not use generic containers in place of real buttons, links, headings, or table elements. Do not bypass this policy with `React.createElement("div")`, injected HTML, or local wrappers around raw JSX/TSX.
- Use TypeScript.
- Before using a Chakra component or compound part, check the installed Chakra UI version, exported types, and the Chakra UI v3 documentation. Do not assume that v2 examples or remembered APIs are still valid, and do not guess compound part names.
- Before creating a custom UI component, check whether Chakra UI already provides the component, pattern, or compound API. Compose Chakra's implementation when one exists; create a custom component only when Chakra has no suitable equivalent or the project requires behavior it cannot provide.
- Reuse project components built from Chakra instead of duplicating controls.
- Do not add another styling library or a hand-rolled component to work around a missing Chakra API. First compose exported Chakra primitives; if Chakra genuinely cannot support the requirement, document the gap before changing the dependency boundary.
- Do not use CSS classes to style authored components. Put visual styles directly on Chakra components with style props, including responsive values, pseudo-selectors, and state props such as `_hover`, `_focusVisible`, `_open`, and `_disabled`.
- Do not add component-specific selectors to `src/app/globals.css`, CSS modules, or other stylesheets, and do not use React's `style` prop as a substitute. A `className` is permitted only as a non-visual integration, testing, or DOM hook when unavoidable; it must not be used by authored CSS for presentation.
- Do not declare project CSS custom properties or use `var(...)` in authored application code, including Chakra style props. Chakra may emit internal CSS variables at runtime; do not depend on or override those implementation details.
- Keep components small and focused. Break large pages or components into descriptive subcomponents when they contain distinct sections, repeated UI, or substantial conditional logic; move reusable pieces into `src/components/` and keep page-specific pieces colocated with their route.
- Do not collect every icon into one large component file. Icons may be separated into individual, descriptively named component files; use a small barrel export only when it improves import organization without hiding implementation ownership.

```tsx
import { Box, Button, Heading, List, Text } from "@chakra-ui/react";

interface ExamplePanelProps {
  onContinue: () => void;
}

export function ExamplePanel({ onContinue }: ExamplePanelProps) {
  return (
    <Box as="section">
      <Heading as="h2">Revision details</Heading>
      <Text>Review the material before continuing.</Text>
      <List.Root>
        <List.Item>Check the revision information</List.Item>
        <List.Item>Confirm the next action</List.Item>
      </List.Root>
      <Button onClick={onContinue}>Continue</Button>
    </Box>
  );
}
```

### Scope exceptions

- Next.js root layouts must contain native document markup such as `html` and `body`. Framework-required document structure and metadata are infrastructure, not application UI components.
- Static or imported image and SVG assets may remain in their native formats. Do not rewrite third-party or generated assets merely to satisfy the component rule.
- Chakra components render semantic HTML in the browser. The restriction applies to authored application JSX, not the browser's resulting DOM.

## Chakra UI v3 standards

This project uses Chakra UI v3. Do not generate Chakra UI v2 syntax.

### Version guardrails

- Use `createSystem` and `defineConfig` for custom theming.
- Use compound namespace components such as `Dialog.Root`, `Select.Root`, `Menu.Root`, and `Field.Root`.
- Use `colorPalette` for component coloring.
- Use `gap` for spacing in `Stack`, `HStack`, and `VStack`.
- Use plain boolean props: `disabled`, `open`, `invalid`, `required`, `readOnly`, and `loading`.
- Use `asChild` for polymorphic rendering on interactive components; use `as` for semantic polymorphism on layout and typographic primitives.
- Do not introduce color-mode infrastructure unless the task requires it. If color mode is added, use `next-themes` through a compatible color-mode provider and preserve the root Chakra provider.

Do not use these Chakra UI v2 APIs or patterns:

- `extendTheme`; use `createSystem(defaultConfig, config)`.
- `theme={...}` on `ChakraProvider`; pass the system with `value={system}`.
- `colorScheme`; use `colorPalette`.
- `spacing` on Stack components; use `gap`.
- `isOpen`, `isDisabled`, `isInvalid`, or `isLoading`; use `open`, `disabled`, `invalid`, or `loading`.
- `Modal`, `FormControl`, `FormLabel`, `FormErrorMessage`, `Divider`, or `Collapse`; use `Dialog`, `Field`, `Separator`, and `Collapsible`.
- Responsive `Show` or `Hide` component patterns; use responsive style props such as `hideFrom` and `hideBelow`. Chakra v3's conditional-rendering `Show` utility is unrelated and must not be used as a responsive visibility substitute.
- `sx`; use direct Chakra style props.
- `noOfLines` or `isTruncated`; use `lineClamp` or `truncate`.
- `useToast`, `@chakra-ui/icons`, or Chakra core's `useColorMode` and `useColorModeValue`.
- `styleConfig`, `multiStyleConfig`, or v2 gradient strings such as `linear(to-r, ...)`; use v3 recipes and `bgGradient` with `gradientFrom` and `gradientTo`.

### Provider and theming

- Keep the existing `ChakraProvider value={defaultSystem}` setup in `src/components/provider.tsx` unless the task explicitly requires a custom system. Do not replace it with a v2 provider pattern.
- Keep provider components marked with `"use client"`; import and use them from the root layout so server-rendered routes remain server components by default.
- Every custom token value must use `{ value: ... }`.
- Pass theme token names directly to Chakra color props instead of hardcoded values or custom properties.
- Prefer semantic tokens for light and dark mode using `base` and `_dark` values. Do not scatter color-mode ternaries through components.
- Define complete color scales when introducing a palette used by `colorPalette`, including semantic slots such as `solid`, `contrast`, `fg`, `muted`, `subtle`, `emphasized`, and `focusRing` where appropriate.
- Prefer existing Chakra semantic tokens such as `bg`, `fg`, `border`, `colorPalette.solid`, and their variants before introducing project-owned theme tokens.
- Express colors only through Chakra's token-aware color props, such as `color`, `bg`, `borderColor`, `outlineColor`, `boxShadowColor`, `fill`, `stroke`, and `focusRingColor`. Split composite declarations into width, style, and color props; for example, use `borderWidth="1px"`, `borderStyle="solid"`, and `borderColor="border"` instead of embedding a color in `border`.
- Use token opacity modifiers such as `blackAlpha.500` when transparency is required. Do not write hex, `rgb()`, `rgba()`, `hsl()`, named CSS colors, or color-bearing composite strings in authored components.
- After changing a project-owned theme extension, regenerate its types with `npx @chakra-ui/cli typegen <theme-file>` when the CLI is available. Do not edit generated types inside `node_modules`.

### Component composition

Use the v3 namespace and compound component APIs. Controlled callbacks receive a details object, not the raw value:

```tsx
import { Button, CloseButton, Dialog, Portal } from "@chakra-ui/react";

<Dialog.Root open={open} onOpenChange={(event) => setOpen(event.open)}>
  <Dialog.Trigger asChild>
    <Button variant="outline">Open</Button>
  </Dialog.Trigger>
  <Portal>
    <Dialog.Backdrop />
    <Dialog.Positioner>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Title</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>Content</Dialog.Body>
        <Dialog.Footer>
          <Dialog.ActionTrigger asChild>
            <Button variant="ghost">Cancel</Button>
          </Dialog.ActionTrigger>
          <Button colorPalette="blue">Save</Button>
        </Dialog.Footer>
        <Dialog.CloseTrigger asChild>
          <CloseButton size="sm" />
        </Dialog.CloseTrigger>
      </Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog.Root>;
```

- Wrap overlay content such as Dialog, Select, Menu, Tooltip, and Popover in `Portal` with the complete part composition.
- Compose form controls inside `Field.Root`. Use `Field.Label`, `Field.HelperText`, and `Field.ErrorText` to preserve accessible associations.
- Use collection-based `Select` components. For a truly simple native select, use `NativeSelect.Root` and `NativeSelect.Field`.
- Use `Icon` with `lucide-react`; icon-only buttons must be `IconButton` and include an `aria-label`.
- Use real interactive components for controls. Do not attach click handlers to generic layout containers.
- Controlled component callbacks receive a details object. Read the appropriate field, such as `event.open`, `event.value`, or `event.checked`, rather than treating the callback argument as the raw value.
- For notifications, use `createToaster` and `Toaster`, mount the toaster once near the application root, and call its `.create()` method. Do not use the removed v2 `useToast` hook.

### Styling and layout

- Use Chakra style props and existing theme tokens for all component styling. Do not use `className`, stylesheet selectors, the React `style` prop, Chakra's `css` prop, CSS custom properties, or `var(...)` for visual presentation.
- Prefer spacing, sizing, color, typography, radius, and shadow tokens over arbitrary pixel or hex values when an appropriate token exists.
- Use `Stack`, `HStack`, and `VStack` with `gap` for one-dimensional layouts; use `Grid` or `SimpleGrid` for two-dimensional layouts.
- Use responsive style props for presentation changes. Use `useBreakpointValue` only when behavior, rather than styling, changes by breakpoint.
- Use `focusRing` or `_focusVisible` and retain a visible focus indicator with sufficient contrast.
- Use `colorPalette.*` virtual tokens for palette-agnostic components.
- Use `_open`, `_closed`, `_selected`, `_invalid`, `_disabled`, and related data-state conditions for declarative state styling.
- Respect reduced motion with `_motionReduce` or `prefers-reduced-motion`.
- Use Chakra's existing recipes through their documented component props. Keep project-authored component styling inline with Chakra style props rather than creating new visual classes, stylesheet selectors, or local recipes.

### Accessibility and validation

- Preserve semantic elements, heading levels, labels, names, table semantics, `aria-*` attributes, keyboard focus, and reduced-motion behavior.
- Keep color contrast at WCAG 2.1 AA levels: at least 4.5:1 for normal text and 3:1 for large text, focus indicators, and essential UI boundaries. Validate every supported color mode.
- Test interactive components through user-visible behavior and accessible roles or names, not generated Chakra class names.
- Run the lightest relevant check after changes. Use `npm run lint` and `npm run build` when the changed surface warrants them.

Before finishing a Chakra UI change, verify that the diff contains no avoidable raw intrinsic UI elements, avoidable `<chakra.*>` elements, new visual `className` usage or component CSS selectors, React `style` props, Chakra `css` props, authored CSS custom properties or `var(...)`, raw color literals, color-bearing composite strings, v2 boolean props, `extendTheme`, `colorScheme`, `sx`, `useToast`, or guessed compound parts; that custom theme tokens use `{ value: ... }`; and that overlay, form, focus, icon-button, toaster, and controlled-component patterns follow the rules above.

## Preserve the interface

- `PRODUCT.md`, `PLAN.md`, the rendered interface, and the existing `src/app/globals.css` define the current reference appearance. Preserve that appearance when migrating styles, but treat existing class-based CSS and custom properties as legacy implementation rather than a pattern to extend.
- When modifying a component that relies on visual CSS classes, migrate the affected styles to Chakra style props on that component. Use `unstyled` where needed to prevent recipe defaults, then reproduce the reference appearance with style props rather than class selectors.
- Keep heading levels, input labels, names, table semantics, `aria-*`, keyboard focus, and reduced-motion behavior.
- SVG dimensions must use explicit CSS units where passed as Chakra style props; numeric strings can resolve to theme spacing tokens.
- Retain product copy and sample data unless the task explicitly changes them. Do not imply that prototype-only operations are backed by live services.

## Source organization

- `src/app/layout.tsx`: root document layout, metadata, and provider composition.
- `src/app/page.tsx`: home route composition. Keep it a server component unless browser-only behavior is required.
- `src/app/**/page.tsx`: route entry points. Load data, enforce access, and compose focused components.
- `src/app/globals.css`: document-level baseline rules only. Do not add component-specific styling here.
- `src/components/provider.tsx`: client-side Chakra provider boundary.
- `src/components/`: reusable controls, feature components, and application chrome.

### Component folder structure

- Use one PascalCase-named folder per substantial shared component under `src/components/`.
- Every component folder must expose an `index.ts` barrel. Consumers must import from `@/components/<ComponentName>` and must not use deep imports into the component folder's internal files.
- Name the main implementation file exactly after its folder, for example `Button/Button.tsx`. Keep `index.ts` limited to re-exports; do not place implementation code in it.
- Treat each component's `index.ts` as its public API. Export only the component, types, and helpers that outside consumers genuinely need. Keep implementation details private to the folder.
- Put subcomponents used exclusively by one component in that component's own `components/` subfolder. Do not give private subcomponents their own top-level folders under `src/components/`.
- Colocate component-specific hooks, types, constants, and utilities with their owning component. Use `hooks/`, `types.ts`, `constants.ts`, or `utils.ts` only when needed; do not create empty organizational folders.
- Colocate tests beside the implementation as `<ComponentName>.test.tsx`. Do not create a parallel `__tests__/` tree.

Use this shape as the default, omitting optional files and folders when they are unnecessary:

```text
src/components/
  ComponentName/
    index.ts
    ComponentName.tsx
    ComponentName.test.tsx
    types.ts
    constants.ts
    hooks/
      useComponentName.ts
    components/
      ComponentHeader.tsx
      ComponentRow.tsx
```

### Component boundaries and readability

- A component should have one clear responsibility and a name that describes that responsibility. Its JSX should read like an outline of the interface rather than expose every implementation detail inline.
- Keep route orchestration in `page.tsx` and layouts. Put substantial UI sections in focused components instead of allowing route files to become large page implementations.
- Keep route-specific components close to their route in a private `_components/` folder. Move a component to `src/components/` only when it is reused across routes or is part of shared application chrome or controls.
- Split a component when it contains multiple independently understandable sections, repeated markup, a substantial conditional branch, its own stateful interaction, or a block that deserves an independent test. Extract by responsibility, not merely to reduce line count.
- Reassess any component approaching roughly 150–200 lines. A longer file is acceptable only when it remains cohesive and splitting it would make behavior harder to follow; files above roughly 250 lines should be exceptional and justified by a clear constraint.
- Move complex state transitions, derived data, effects, or reusable interaction logic into a descriptively named custom hook. Keep simple state beside the JSX when extracting it would obscure the flow.
- Avoid premature abstraction. Do not create a component for a trivial one-off wrapper or a few lines that are clearer inline. Extract when the new name communicates intent, isolates behavior, removes meaningful repetition, or improves testing.
- Prefer explicit, narrowly scoped props. Avoid components with many unrelated boolean flags; when modes are genuinely distinct, use a clear variant prop, discriminated union, compound component API, or separate focused components.
- Keep data transformation outside presentation-heavy JSX. Compute named values before `return`, or move substantial domain logic into a hook or module owned by the relevant feature.
- Import another component through its barrel. Deep imports are allowed only within the same component folder for its private implementation files.
- Avoid circular dependencies. Lower-level shared controls must not import feature or route components; dependencies should flow from routes and features toward shared primitives.
- Preserve discoverability when extracting: use specific names such as `ReviewCanvas` or `RevisionHistory`, not vague names such as `Section`, `Content`, `Helper`, or `Item` without context.
- When changing an existing large component, improve the structure of the area being touched when it can be done safely, but do not turn a focused change into an unrelated whole-repository refactor.

Use explicit props, descriptive names, and focused modules. Follow the repository formatter and lint configuration. Comments should explain a constraint or decision rather than repeat the code.

## Next.js and React boundaries

- Use the App Router conventions already present in `src/app`.
- Prefer server components. Add `"use client"` only to the smallest component boundary that needs state, effects, event handlers, browser APIs, or a client-only library.
- Do not mark route layouts or whole pages as client components solely because a nested interaction needs one; extract that interaction into a focused client component.
- Use `next/image`, `next/link`, metadata APIs, and other framework primitives where they provide the appropriate optimization or behavior.
- Keep server-only data access out of client components. Pass serializable data across the server/client boundary.
- Await asynchronous `params`, `searchParams`, `cookies()`, and `headers()` where required by the installed Next.js version.

## Development and generated files

Use the Node.js version supported by the installed Next.js release, npm, and the existing `package-lock.json`.

- `npm install`: install dependencies.
- `npm run dev`: start the development server.
- `npm run lint`: run ESLint.
- `npm run build`: create a production build and run Next.js validation.
- `npm start`: serve the production build.

Edit source files, not `.next/` or other generated output. Keep the root entry runnable. Do not edit `.openai`, `.codex`, `.agents`, or `*.artifact.json` host resources. Keep credentials out of delivered files. Honor the active task's validation and delivery boundaries; never claim checks that were not run.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
