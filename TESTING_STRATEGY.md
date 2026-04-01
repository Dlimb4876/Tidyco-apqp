# Testing Strategy — Tidyco APQP Quality Tool

## Overview

This document outlines the comprehensive testing strategy for the Tidyco APQP application. Our goal is to ensure code quality, prevent regressions, and maintain confidence during refactoring and feature additions.

**Testing Philosophy:**
- Test behavior, not implementation
- Mock external dependencies (Supabase, DOM, global state)
- Keep tests fast, isolated, and deterministic
- Prioritize critical paths and complex logic
- **ESM-First**: All new tests MUST use modern ESM imports and `jest.unstable_mockModule`

**Documentation Sync Rule:**
- If a change affects behavior, workflow, or test status, update both `README.md` and `TESTING_STRATEGY.md` in the same logical change.

### Quality Assurance Scripts

This project includes custom Node.js scripts in the `scripts/` directory to enforce code quality and architecture rules.

```bash
npm run check:syntax         # Validates JS syntax across the codebase
npm run check:imports        # Verifies ESM import/export wiring and discourages global leakage
npm run check:esm-coverage   # Tracks remaining non-ESM files
npm run check:subscriptions # Audits real-time subscription cleanup (integrated in check:imports)
npm run check:state         # Tracks state.js variables and undeclared globals (integrated in check:imports)
npm run check:rls           # Audits Supabase tables for RLS policy coverage
npm run check:mobile        # Verifies CSS breakpoints for responsive design
npm run check:modals        # Audits modal state handling
npm run check:coverage      # Generates Jest coverage summary with recommendations
```

---

## Test Framework

**Jest 30** with **jsdom** environment.

**→ For comprehensive command reference, see AGENTS.md "Quick Commands" section under "Validation & Checks".**

### Quality Assurance Scripts

This project includes custom Node.js scripts in the `scripts/` directory to enforce code quality and architecture rules. All validation and testing commands are documented in AGENTS.md (Quick Commands).
