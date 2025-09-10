# Editor/User View Toggle (Lightweight)

This project now supports two modes:
- **Editor mode**: shows your editing UI and keeps `contenteditable` zones unlocked.
- **User mode**: hides editor/admin controls and locks editing.

## How to switch
- Open `mode.html` in the project root and use the buttons.
- Or add URL params to any page:
  - `?mode=editor&key=BananaTua23`
  - `?mode=user`

## Markup helpers
- Show only to editor: `class="only-editor"` or `data-editor-only`
- Show only to users:  `class="only-user"`
- Disable a control in user view: add `data-lockable`
- Editable zones (for editor view): `contenteditable="true"` and optionally `class="edit-outline"`

> Note: This is a **static-site toggle** and not secure authentication. For real auth/permissions, use a backend (e.g., Supabase Auth, Next.js middleware, or Netlify Identity) and gate editor routes server-side.
