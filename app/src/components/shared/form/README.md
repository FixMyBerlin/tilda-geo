# Form components

TanStack Form–based form wrapper and field components.

## Core usage

- **Form** ([Form.tsx](./Form.tsx)) — `defaultValues`, `schema` (Zod), `onSubmit`, `children(form)`.
- **Fields** — `TextField`, `Textarea`, `Select`, `RadioGroup` in [fields/](./fields/). Each takes `form` + `name` and uses `form.Field` internally.

## Errors

- **Form-level** — Return `{ success: false, message: string, errors?: Record<field, string[]> }` from `onSubmit`. `message` is shown as a red banner; `errors` are applied to each field’s `meta.errors` (see [applyFieldErrors](Form.tsx)).
- **Form state errors** — `form.state.errors` (e.g. from validators) are rendered below the form fields in a red block.

## Submit message (banner)

Controlled by **SubmitResult** from `onSubmit`: `{ success: true, message?, redirect? }` shows a green banner (and optional redirect); `{ success: false, message }` shows a red banner. See [SubmitResult](Form.tsx) type.

## Action bar / submit button

- **`submitLabel`** — Renders `FormActionBar` with a standard submit button (label + disabled when invalid/submitting). Use for most forms.
- **Omit `submitLabel`** — No action bar; put your submit button (and any UI, e.g. spinner) in `children`. See [OsmNotesNewForm](../../regionen/[regionSlug]/_components/notes/OsmNotes/OsmNotesNewForm.tsx) or [QaEvaluationForm](../../regionen/[regionSlug]/_components/SidebarInspector/InspectorQa/QaEvaluationForm.tsx).

**FormActionBar** ([FormActionBar.tsx](./FormActionBar.tsx)) is layout only: `left` / `right` slots.

## More

- [TanStack Form — React](https://tanstack.com/form/latest/docs/framework/react/overview)
- [TanStack Form — Validation](https://tanstack.com/form/latest/docs/framework/react/guides/validation)
