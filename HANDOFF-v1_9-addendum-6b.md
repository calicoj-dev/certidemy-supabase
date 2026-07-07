# HANDOFF v1.9 — Addendum 6b: Flow arc close-out + book-overlay revert
_Amends addendum-6. July 7, 2026._

## Shipped after addendum-6
- **Post-lesson quiz drawer** (`concept-quiz-button.tsx` v2): same export/props
  (zero call-site edits — Focus/Review both get it); portaled dark sheet at
  z-[60] over the light lesson; mid-quiz ESC inert; same-pathname link intercept
  closes instead of no-op nav; trilingual labels; engine path + Readiness Log
  unchanged. VERIFIED WORKING.
- **Dark scrollbars** global CSS (marker `dark scrollbars (Healix overlays)`).

## Book overlay: SHIPPED, BROKE, REVERTED (same session)
- Built as `[cert]/layout.tsx` + `@modal/default.tsx` + `@modal/(.)[lesson]/page.tsx`.
- **Failure mode (permanent lesson):** an intercepting route on a DYNAMIC
  segment — `(.)[lesson]` — matches ANY sibling on soft navigation. The rail's
  /quiz, /exam, /dashboard resolved as lesson slugs → `loadLesson("quiz")` →
  notFound → 404. Hard nav bypassed interception (why the 404's dashboard link
  worked).
- **Revert:** deleted layout + @modal folder; production healthy.
- **Correct path (prerequisite migration, next session-sized job):** move lessons
  under their own prefix `/learn/[cert]/lesson/[slug]` so the interceptor can
  only match lessons. Requires: route move, middleware redirect for ALL legacy
  URLs (completion bars, drawers, study-plan links, session-review lesson links,
  module panels), link-builder sweep, THEN re-add `@modal/(.)lesson/[slug]`.
- Known accepted gap until then: entering a lesson from the module drawer and
  returning loses drawer state (dashboard remounts).

## Flow-doctrine final scorecard
Identity ✅ · completion current ✅ · Healix drawers: sessions/modules/quizzes/
post-lesson-quiz ✅✅✅✅ · dark cockpit end-to-end ✅ (lesson reading light by
doctrine, lesson top bar dark) · book overlay ⏳ (route-prefix migration first).

## Next: GOVERNANCE CONSOLE — Phase 1 (in flight)
Admin-gated `/console/governance`: Scheme Registry · Coverage/Traceability
health · Item Bank health (incl. live guardrail checks) · Exam Telemetry ·
Audit Trail. One service-role edge function (`get-governance-snapshot`,
platform_admin-gated) feeds all panels. Phase 2 = exports/PDF + disclosure
tracker (6C) + auto-generated schema diagrams.
