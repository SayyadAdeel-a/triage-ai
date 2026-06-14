# TriageAI

## What This Is

TriageAI is an AI-powered email decision layer specifically designed for **founders and freelancers** who are overwhelmed by inbound noise (sales, inquiries, admin). It helps them process inbox overload by turning raw emails into structured actions without forcing them to switch from Gmail/Outlook.

## Core Value

A 60-second inbox clarity generator for overwhelmed founders.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Connect email via IMAP or MCP email backend
- [ ] Fetch unread and recent emails, store them in a database, and maintain sync state to avoid duplicates
- [ ] Process emails via AI to categorize (urgent/reply-needed/later/ignore), assign priority score, summarize (max 2 lines), and suggest action
- [ ] Generate contextual draft email replies based on email content, sender intent, and user tone (stored, not sent)
- [ ] Provide a simple Dashboard UI showing inbox feed and tabs (Urgent, Reply Needed, Later, Ignore)
- [ ] Display email cards on the dashboard with subject, sender, AI category, summary, and expandable draft reply

### Out of Scope

- Send emails on behalf of users — the AI only generates drafts; we never auto-send replies.
- Replace Gmail or Outlook — not building a full email client or competing with inbox UI systems.
- Real-time sync guarantee for all providers — MVP focuses on core ingestion and processing.

## Context

- **CRITICAL READING:** See `.planning/FOUNDER_REVIEW.md` for the core product philosophy and adoption constraints. All agents must align with this document.
- Target users: Founders and freelancers (the sharp wedge), as well as professionals with high email volume, support inbox handlers, and small business operators.
- Core user pain: Overwhelming email volume leading to wasted time deciding what to respond to.
- Strategic Positioning: It is a decision layer, not an email client, Gmail replacement, or automation tool.
- **Conversion Risk**: Adoption friction is the #1 killer. Users will not easily configure IMAP, create app passwords, or trust an unknown system. A frictionless onboarding strategy (e.g., demo mode) is critical.

## Constraints

- **Technical**: Avoid over-engineering the backend (live IMAP sync, etc.) early on.
- **Product**: MVP success depends more on the demo experience than real integration.
- **AI Behavior**: Must prioritize clarity over verbosity, always classify into the three simple buckets (Reply Needed, Important, Ignore), never auto-send, and produce max 2-line summaries. Advanced AI features (confidence scoring, feedback loop) are deferred to v2.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use existing Email MCP Server (Option A) as a temporary acceleration layer | Handles IMAP/SMTP and provides email tools API for fast MVP development, but is NOT a core long-term dependency due to maintenance/stability risks. | — Pending |
| Database storage for processed emails | Required to maintain state, categorize, and store generated drafts | — Pending |
| "Try without connecting" onboarding | Lowers the massive adoption friction barrier, allowing users to experience the "aha" moment before committing their credentials. | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-12 after initialization*
