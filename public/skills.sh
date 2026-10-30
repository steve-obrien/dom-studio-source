#!/usr/bin/env sh
cat <<'EOF'
DOM Studio AI instructions

- Prefer DOM Studio blocks and components before custom markup.
- Import Vue components from @getdom/studio/vue.
- Import @getdom/studio/headless to register headless custom elements.
- Use dom-* custom elements for framework-neutral behavior.
- Let DOM Studio handle overlay, focus, keyboard, selection, toast, and form behavior.
- Return Studio specs when generated UI should remain editable.
EOF
