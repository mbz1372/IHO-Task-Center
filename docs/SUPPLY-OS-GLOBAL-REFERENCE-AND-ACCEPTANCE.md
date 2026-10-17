# IHO Supply Operating System — Product Direction & Acceptance Gates (2026-10-17)

## Principle
A manager should answer five questions without switching tools:
**Which hotel is losing supply opportunity? Why? Who owns the action? What happened? Did supply and sales improve afterward?**

The user-facing navigation stays compact: **Today → Follow-ups → Hotels**. Revenue, commercial, supplier, data and leadership functions live under advanced tools.

## Practical global reference patterns
- SiteMinder / Cloudbeds: a single hotel-distribution truth for sellable room, rate, restriction and availability, with synchronization evidence and failed-update logs.
- Duetto: forecast-led profitability, segmented pricing, revenue vs contribution, optimization with approval guardrails.
- Lighthouse: timestamped price intelligence and valid same-condition comparisons; don't compare different room, occupancy, board, cancellation, stay date.
- Hotel enterprise operations: action register, SLA, accountable owners, escalation, provider/API quality, daily cadence and auditability.
**These are patterns, not claims of product integration or feature parity.**

## Portfolio model (current real data)
About 9.2k hotel master records are currently present in the new dataset. IHO and IHO Provider properties are the first direct-supply control scope. CaringCategory separates strategic, driver, growth, supporting and out-of-service categories.
For each hotel preserve:
HotelCode, City/Province, CaringCategory, Provider/PMS, operational/cooperation/contract status, direct/reservation phone, commercial owner, capacity owner, rate owner, online capacity and rate, calendar freshness, current sellable availability, revenue, gross profit, room nights, qualified traffic, conversion, lost and unconfirmed bookings, bookings by channel, parity and supplier fallback, active actions, last outcome and next due date.

## Top operational loops
1. **Demand and inventory**: missing/zero sellable capacity → priority by demand + hotel tier → named capacity owner → request allotment/free-sale → confirm in system → verify sellable dates and sales uplift.
2. **Rate**: missing/expired net rates, competitor undercut or destructive discount → compare matching room/board/occupancy/refund policy/stay date with freshness → rate owner investigates → manager approves exception → verify price and margin.
3. **Lost reservation**: segment by failed funnel stage; record reason, provider response/API error, fallback attempt and recovery result → accountable task → independent booking success verification.
4. **API Out/B2B**: rate mismatch, stale inventory, overbooking, credit block or slow provider → P0/P1 case with SLA and incident owner → escalation → resolution and partner notification. Rank by successful bookings, contribution per 1,000 qualified calls, mismatch, failure, latency p95 — never raw request count alone.
5. **Commercial**: Segment × Hotel × Date proposals, hotel-funded vs IHO-funded budget, hypothesis, owner, KPI, expected incremental contribution, reviewer approval → approved actions remain separate from actually applied rates → before/after or holdout verification.
6. **Ownership and execution**: Commercial, Rate and Capacity owner IDs for every strategic hotel; playbook-linked tasks, mandatory outcome note, reopen/escalation, SLA clocks, hotel audit timeline and team output KPIs.

## Cadence
08:45 Morning Pack of actionable exceptions, 09:15 operations war room, 13:00 P0/P1 check, 18:00 sweep and tomorrow planning. Each operational card has hotel, issue, evidence timestamp, severity, consequence, owner, SLA, next action, outcome.

## KPI Definitions
- Active hotel online share (target >= 80% when scope & freshness are known). Separate IHO-provider direct supply vs connected providers; *unknown is not offline*.
- Demand-weighted available room nights 7/14/30 days and weekend/peak periods.
- Rate availability and parity by valid comparison only; net margin and funding responsibility.
- Reservation success/recovery %, lost by reason, provider error & booking-success %, qualified conversion.
- Gross contribution (not only gross bookings), nights and booking velocity / time-to-resolution.
- Individual: owner portfolio, action SLA, verified resolution, reopened incidents, stable online improvement, confirmed sales outcomes. Counting clicks/tasks alone is not a success KPI.
- City and Provider scorecards; rate/capacity exception aging.
- Business targets mentioned in team discussions (80% online and 10 hotels where IHO is #1 seller per expert) require true seller-share data before automated enforcement.

## Source priority
A. Current hotel master is already in new database — **do not reupload by default**.
B. Next: Hotel Assignment by HotelCode, task roles and user ID mapping; known rate + inventory status 7/14/30 by hotel and date.
C. Daily dated confirmed/unconfirmed/lost booking files with reason/stage, nights, amount, profit and channel/Provider; traffic + conversion.
D. Competition: timestamped Hotel×Room×StayDate×Occupancy×Board×Cancellation×FinalPrice×Source rate checks; approved mapping.
E. Provider/API OUT/B2B logs: attempts, successes, p95, error class, mismatches, credit, profit.
Data ingestion should validate mappings, deduplicate by HotelCode and source/dimension/date, and be resumable. Never silently treat a yearly export as one daily aggregate.

## Delivered and connected today
- Independent Supabase hotel master, daily metrics, user/member ownership, task and immutable audit action events.
- Password-login route and logged-in account password setup to avoid dependence on email OTP.
- Visible operational queue, transparent risk/opportunity with unknown-data separation, rapid assignment, call links, user-owner references, dashboard KPIs, exports and CEO brief.
- Incident case taxonomy, P0/P1/P2/P3 SLA, one-step accountable task, atomic result write and case-close trigger.
- Market rate snapshots with conditioned 24-hour parity comparison; provider/API OUT/B2B 30-day operational scorecard.
- Proposed vs approved discounts and independent contribution/funding approval guardrails.
- Authenticated manager-only on-demand AI briefing with bounded input; no autonomous rate changes.
- Old tables and UI are preserved under legacy; not used as the new system of record.

## Not delivered: cannot be claimed
- Certified real-time PMS/channel-manager two-way rate/availability sync, OTA competitor scraping with hotel-room mapping, reservations webhook and true API Out booking-gateway integration.
- Continuous real-time monitoring/cron, push/SMS/Bale alerting, full negotiation/contract renewal workflow and settlement credit automation.
- Forecasting / causal ROI / holdout experimentation over actual channel data.
- Full support for scoped City Manager/Lead roles beyond manager & expert and SSO/MFA rollout.
- Organization-wide signed-in E2E acceptance test, custom SMTP, production incident load and backup/PITR policy.
These require provider endpoints/credentials, sample error payloads, operational approvals, trusted booking event schemas and additional implementation/test cycles.

## Acceptance gates (no 'fully ready' until passed)
- Admin with existing verified Supabase account can sign in with password, set password while signed in and keep session; unauthorized access is rejected.
- Manager imports one known source and its counts match independently queried DB counts; duplicate input does not double-count.
- Manager assigns one hotel case P0, assigned user sees it, logs evidence, case closes only upon resolved task; history and SLA persist.
- Owner-role reassignment changes the expert portfolio KPI.
- Booking failures and parity samples use real source dates and comparable dimensions, no fabricated claims.
- Traffic and revenue figures reconcile with the source system; conversion math accounts for qualified visits and channel attribution.
- Two production builds succeed, rate/inventory/partner scenarios run on staging with access checks, no sensitive credentials in client logs.
