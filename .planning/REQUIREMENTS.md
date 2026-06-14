# Requirements: TriageAI

## v1 Requirements (Ultra-lean MVP)

### Onboarding & Demo (The Wedge)
- [ ] **ONB-01**: Provide an instant "try it" mode with a preloaded realistic founder demo inbox (no login required).
- [ ] **ONB-02**: Connect real email via OAuth (or MCP) only AFTER trust is built in demo mode.

### Processing (Simplified)
- [ ] **PROC-01**: Categorize incoming emails into exactly three buckets: "Reply Needed", "Important", and "Ignore".
- [ ] **PROC-02**: Generate a single output feed: "What needs my attention today".
- [ ] **PROC-03**: Provide a concise summary (max 2 lines) per attention-needing email.

### Reply Generation
- [ ] **REP-01**: Generate draft email replies only for the "Reply Needed" bucket.

### Dashboard UI (Killer Loop)
- [ ] **UI-01**: Show a "60-second inbox clarity" view highlighting only the daily attention list.
- [ ] **UI-02**: Provide a quick action layer to expand summaries and copy drafts.

## v2 Requirements (Deferred)
- Live email ingestion sync pipelines and IMAP connection fallback.
- AI confidence scoring, correction loops, and feedback logging.
- Support multiple email accounts.
- Custom user tone settings.

## Out of Scope
- Fully automated sending of emails without user review (never auto-send replies).
- Building a full email client replacement.
- Real-time sync guarantee.
