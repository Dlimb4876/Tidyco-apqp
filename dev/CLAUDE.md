# Tidyco APQP Core Router

## Quick Navigation Guide

**All canonical documentation is centralized for AI assistants:**

| Topic | Primary Source | Purpose |
|-------|----------------|---------|
| **Commands** (tests, validation, wiki, linting) | AGENTS.md | Single source for all CLI commands |
| **Hard Rules** (ESM, state, security, etc.) | AGENTS.md | Architectural guardrails for all AI assistants |
| **Testing Strategy** (Jest patterns, examples) | TESTING_STRATEGY.md | Comprehensive testing patterns and best practices |
| **OpenWolf Protocol** | AGENTS.md | AI assistant workflow and constraints |
| **Project Overview** (for Gemini) | GEMINI.md | Complete architecture guide for Gemini CLI |
| **Code Style Details** | `.claude/rules/code-style.md` | Formatting, naming, error handling |
| **Database/RLS** | `.claude/rules/database.md` | RLS policies and query patterns |
| **Security** | `.claude/rules/security.md` | XSS, sanitization, credentials |

---

## OpenWolf Protocol

**See AGENTS.md "OpenWolf Protocol" section for the definitive reference.**

- Check `.wolf/anatomy.md` before reading project files.
- Check `.wolf/cerebrum.md` (Do-Not-Repeat list) before generating code.
- Update `.wolf/anatomy.md` and append to `.wolf/memory.md` after writing files.
- Log bugs to `.wolf/buglog.json` after fixes.
- Run `openwolf designqc` when asked to evaluate UI design.

---

## User Context

The primary user is non-technical. Use plain language and avoid jargon. Keep error messages and inline comments clear and actionable.
