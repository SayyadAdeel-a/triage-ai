# Proposed Roadmap

**2 phases** | **8 requirements mapped** | All v1 requirements covered ✓

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | The Demo Wedge | Build the frictionless "try it" demo inbox with static data and core UI. | ONB-01, UI-01, UI-02 | 3 |
| 2 | AI Triage & Connection | Wire up AI categorization, reply generation, and real email OAuth connection. | ONB-02, PROC-01, PROC-02, PROC-03, REP-01 | 3 |

### Phase Details

**Phase 1: The Demo Wedge**
**Goal:** Deliver the 60-second clarity experience immediately using a preloaded founder inbox without requiring login.
**Requirements:** ONB-01, UI-01, UI-02
**Success criteria:**
1. User lands on the dashboard and sees a populated, realistic inbox immediately.
2. The UI clearly highlights "What needs my attention today" in a simple view.
3. Users can interact with the email cards (expand to see dummy summaries and drafts).
**UI hint**: yes

**Phase 2: AI Triage & Connection**
**Goal:** Implement the real AI processing (categorization to 3 buckets, summarization, reply drafting) and allow users to connect their real email via OAuth.
**Requirements:** ONB-02, PROC-01, PROC-02, PROC-03, REP-01
**Success criteria:**
1. AI accurately classifies real incoming emails into "Reply Needed", "Important", and "Ignore".
2. AI generates concise summaries and drafts for "Reply Needed" items.
3. Users can successfully connect their real email accounts after trusting the demo.
