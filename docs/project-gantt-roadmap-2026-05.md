# Moul Hanout Project Gantt Roadmap

## Planning Assumptions
- Planning start date: `2026-05-19`
- Team size: `2`
- Team members:
  - `Baakka` — backend, shared contracts, Prisma, infrastructure, release hardening
  - `Baghdad` — frontend, UX integration, validation flows, cross-module UI consistency
- Planning horizon: `8 weeks`
- Method: overlapping module delivery with backend-first sequencing on critical business flows

## Delivery Strategy
The product already contains the main MVP modules. The realistic objective is no longer greenfield delivery, but hardening, stabilization, integration cleanup, and release readiness.

The delivery plan is therefore organized in this order:
1. Secure the foundations and shared contracts
2. Stabilize the catalog flows
3. Secure inventory and alerts
4. Stabilize POS and user operations
5. Finalize reporting, observability, and release hardening

## Team Allocation
### Baakka
- Auth backend and security hardening
- Shared packages and Prisma alignment
- Categories, products, inventory, alerts, sales, reports backend stabilization
- Mail, health checks, Docker, release readiness

### Baghdad
- Auth frontend and route protection
- Category, product, inventory, alerts, POS, reports, dashboard, and profile interfaces
- UX consistency
- Frontend validation states
- End-to-end functional verification with Baakka

## Mermaid Gantt
```mermaid
gantt
    title Moul Hanout - Project Roadmap (19 May 2026 -> 10 July 2026)
    dateFormat  YYYY-MM-DD
    axisFormat  %d/%m
    excludes    weekends

    section Governance
    Kickoff, backlog alignment, milestone lock                    :milestone, ms1, 2026-05-19, 1d
    Board setup and sprint framing                                :done, gov1, 2026-05-19, 2026-05-21

    section Sprint 1 - Foundations
    Auth backend hardening - Baakka                               :crit, b1, 2026-05-19, 2026-05-27
    Auth frontend guards and session flows - Baghdad              :crit, g1, 2026-05-21, 2026-05-29
    Shared packages, Prisma, workflow checks - Baakka            :crit, b2, 2026-05-19, 2026-05-30

    section Sprint 2 - Catalog
    Categories backend stabilization - Baakka                     :b3, 2026-05-28, 2026-06-03
    Categories frontend integration - Baghdad                     :g2, 2026-05-30, 2026-06-05
    Products backend hardening - Baakka                           :crit, b4, 2026-05-28, 2026-06-06
    Products frontend forms and media flow - Baghdad              :crit, g3, 2026-05-31, 2026-06-09

    section Sprint 3 - Inventory and Alerts
    Inventory backend integrity and thresholds - Baakka           :crit, b5, 2026-06-05, 2026-06-16
    Inventory workspace and operational filters - Baghdad         :crit, g4, 2026-06-08, 2026-06-18
    Alerts backend and mail escalation - Baakka                   :b6, 2026-06-12, 2026-06-20
    Alerts UI, dropdown, and navigation - Baghdad                 :g5, 2026-06-15, 2026-06-21

    section Sprint 4 - Sales and Store Operations
    Sales backend, totals, stock sync - Baakka                    :crit, b7, 2026-06-17, 2026-06-27
    POS, receipt, and sales history UX - Baghdad                  :crit, g6, 2026-06-19, 2026-06-30
    Users and profile backend cleanup - Baakka                    :b8, 2026-06-24, 2026-06-30
    Users and profile frontend cleanup - Baghdad                  :g7, 2026-06-24, 2026-07-01

    section Sprint 5 - Reporting and Release
    Reports backend consistency - Baakka                          :b9, 2026-06-30, 2026-07-05
    Dashboard and reports frontend alignment - Baghdad            :g8, 2026-07-01, 2026-07-07
    Health checks, Docker, mail hardening - Baakka                :crit, b10, 2026-07-02, 2026-07-08
    Cross QA, regression pass, full functional review - Team      :crit, qa1, 2026-07-06, 2026-07-09
    Release candidate stabilization buffer - Team                 :crit, rc1, 2026-07-09, 2026-07-10

    section Milestones
    Catalog + inventory stabilization completed                   :milestone, ms2, 2026-06-20, 1d
    Core operations stabilized                                    :milestone, ms3, 2026-06-30, 1d
    Release candidate ready                                       :milestone, ms4, 2026-07-10, 1d
```

## Recommended Management Cadence
- `Daily`: 15-minute sync between Baakka and Baghdad
- `Weekly Monday`: sprint planning and dependency review
- `Weekly Thursday`: integration checkpoint and risk review
- `Weekly Friday`: demo, QA review, and next-week adjustment

## Main Risks
- Backend/frontend contract drift on auth, products, inventory, and sales
- Late discovery of inventory and sales edge cases
- Mail and Docker readiness not reflecting real runtime behavior
- Reports/dashboard metrics diverging from backend source of truth

## Mitigation
- Freeze shared contracts before each module integration closes
- Validate each sprint with explicit regression scenarios
- Keep release hardening inside the plan, not after the plan
- Reserve the final week buffer for integration defects only
