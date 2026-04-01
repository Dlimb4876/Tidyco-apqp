# AI Reference Map — Where to Find Everything

This document is a **quick lookup guide** for AI assistants to find the canonical source for each topic.

## 📋 Core Documentation Map

| Topic | File | Section | Why This is Canonical |
|-------|------|---------|----------------------|
| **All CLI Commands** | AGENTS.md | Quick Commands | Single source; all commands listed once |
| **Hard Rules** (10 guardrails) | AGENTS.md | Hard Rules | Authoritative; enforced by all AI assistants |
| **Code Style** | AGENTS.md | Code Style | Formatting, naming, patterns |
| **Testing** | TESTING_STRATEGY.md | Full document | Comprehensive Jest patterns + examples |
| **OpenWolf Protocol** | AGENTS.md | OpenWolf Protocol | AI workflow + constraints |
| **Project Overview** | GEMINI.md | Sections 1-8 | Complete architecture for Gemini CLI |
| **Code Style Details** | `.claude/rules/code-style.md` | Full document | Extended formatting + comment rules |
| **Security** | `.claude/rules/security.md` | Full document | XSS prevention, credential handling |
| **Database/RLS** | `.claude/rules/database.md` | Full document | RLS policies, query patterns |
| **Navigation** | `.claude/rules/navigation.md` | Full document | Route changes + realtime cleanup |
| **Realtime** | `.claude/rules/realtime.md` | Full document | Subscription lifecycle + cleanup |
| **Components** | `.claude/rules/components.md` | Full document | UI patterns + modal handling |

---

## 🚀 Quick Navigation by Task

### "I need to understand the project"
→ Start: **GEMINI.md** (full project guide)
→ Then: **AGENTS.md** (hard rules + quick commands)

### "I'm writing or reviewing code"
→ **AGENTS.md** (Hard Rules + Code Style)
→ Then: `.claude/rules/` (specific domain rules)

### "I'm writing tests"
→ **TESTING_STRATEGY.md** (patterns, examples, checklist)
→ Then: **AGENTS.md** (npm test commands)

### "I'm making a commit"
→ **AGENTS.md** (Changelog rule)
→ Then: `CHANGE_CHECKLIST.md` (pre-commit validation)

### "I'm starting a new session"
→ **AGENTS.md** (OpenWolf Protocol section)
→ Then: Check `.wolf/` files as instructed

---

## ⚠️ Removed Redundancies

**Deleted:**
- ❌ `SKILLS_SUMMARY.md` (was redundant with SKILLS_GUIDE.md + SKILLS_QUICK_REFERENCE.txt)

**Refactored:**
- ✅ `CLAUDE.md` → Now a navigation hub with table of canonical sources
- ✅ `GEMINI.md` → Removed duplicate hard rules; links to AGENTS.md
- ✅ `TESTING_STRATEGY.md` → Removed duplicate commands; links to AGENTS.md

---

## 🔒 Single Source of Truth Rules

1. **Hard Rules** live only in **AGENTS.md**
   - All other docs link to it rather than duplicating
   - If you need to enforce a rule, refer to AGENTS.md

2. **Commands** are documented only in **AGENTS.md** (Quick Commands section)
   - CHANGE_CHECKLIST.md references it
   - TESTING_STRATEGY.md references it
   - Other docs reference it

3. **OpenWolf Protocol** is defined only in **AGENTS.md**
   - CLAUDE.md and GEMINI.md link to it

4. **Testing Patterns** live only in **TESTING_STRATEGY.md**
   - Contains Jest examples, checklist, configuration
   - AGENTS.md links to it

---

## 📝 For Maintainers

When updating documentation:
- **Never duplicate content** across files
- **Add cross-references** instead (→ See FileName.md)
- **Keep AGENTS.md as the hub** for rules, commands, and protocols
- **Use specific domain files** (`.claude/rules/`) for deep dives

---

## 🔄 File Update Workflow

1. **Update source** in the canonical file (usually AGENTS.md or `.claude/rules/`)
2. **Update references** in files that link to it
3. **No need to update** files that just reference it (they pull the link, not the content)

Example: If a new Hard Rule is added:
- Edit: AGENTS.md (add rule)
- Check: CLAUDE.md, GEMINI.md (verify they link correctly)
- No need to edit: TESTING_STRATEGY.md, other files (they already link)

---

**Last Updated:** 2026-04-01
**Status:** All redundancies eliminated, cross-references established
