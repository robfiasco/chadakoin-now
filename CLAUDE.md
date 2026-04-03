# CLAUDE.md

This repo uses AI-assisted development. Security basics must be applied before shipping.

Key rules:
- Never expose secrets in code, logs, screenshots, prompts, or bundles.
- Validate all input server-side.
- Require authentication for non-public endpoints.
- Enforce authorization for every resource action.
- Never store auth tokens in localStorage.
- Add rate limiting to public or expensive endpoints.
- Do not expose stack traces or internal errors in production.
- Keep dependencies minimal and reviewed.
- Treat AI-generated code as untrusted until reviewed.
- Assume every public app will be attacked.
