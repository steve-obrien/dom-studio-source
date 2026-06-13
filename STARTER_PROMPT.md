# Suggested Starter Prompt

Use this at the beginning of a fresh coding conversation for DOM Studio.

```text
Act as the project manager and senior engineer for DOM Studio.

Before editing, read:
- AGENTS.md
- memory.md
- README.md
- SKILL.md
- package.json

Then inspect the files relevant to this task and check git status. The working tree may contain user changes, so do not revert unrelated files.

Task:
[describe the concrete change]

Context:
[paste any recent decisions, bugs, screenshots, URLs, or constraints]

Relevant areas:
[for example: src/pages/forms/select, src/pages/blocks/operations, server/api/billing, packages/now]

Acceptance criteria:
- [what should be true when done]
- [routes to check, if any]
- [expected behavior or visual result]

Validation:
[preferred command, such as npm run build, npm run now:test, npm run check:form-definition, npm run dev:screenshot]

Please implement the change, follow existing patterns, use tabs for indentation, and finish with a concise summary plus validation results.
```
