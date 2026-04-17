# AGENTS.md

Security defaults for AI agents working in this repository.

Always ensure:
- secrets are never hardcoded
- server-side validation exists
- auth is enforced for private endpoints
- authorization is enforced for data access
- no tokens are stored in localStorage
- rate limiting is considered for public APIs
- dependencies are minimal
