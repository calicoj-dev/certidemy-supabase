# PATCH — ISO/IEC 17024 edition pin + UUID convention retirement

**Date:** 4 August 2026
**Scope:** Two catalog-wide documents. Neither is owned by `ISMS-F`; both block it.
**Blocking:** Patch A blocks `SCHEME-ISMS-F.md`. Patch B blocks the `ISMS-F` scaffold.

---

## Patch A — `CLAIMS-POLICY.md`: pin the 17024 claim to the 2026 edition

### Why

ISO/IEC 17024:2026 was published in March 2026, replacing the 2012 edition
(verified 4 August 2026). With two editions in circulation, the unversioned
phrase "the ISO/IEC 17024 framework" has an ambiguous referent — and the
structured data carrying it is read literally by machines that cannot hear the
difference.

Pinning is the **stronger** claim, not the riskier one. Every accredited body in
this market is transitioning off 2012; a body designed to the current edition
from scratch is in the better position. The claim remains Class A — checkable,
and *designed to* rather than *accredited*.

**Cost accepted:** a dated claim carries a maintenance obligation. When 17024
revises again, these surfaces must move. That is the correct trade against an
ambiguous referent today.

### A1 — Section 3, Class A table (line 69)

```
-| Designed to the ISO/IEC 17024 framework for bodies certifying persons | **This exact formulation only** — see §5 |
+| Designed to the ISO/IEC 17024:2026 framework for bodies certifying persons | **This exact formulation only** — see §5. Edition pinned deliberately; see §4 note |
```

### A2 — Section 4, approved texts (lines 142–144)

```
-| **en** | Designed to the ISO/IEC 17024 framework for bodies certifying persons. |
-| **es** | Diseñada conforme al marco ISO/IEC 17024 para organismos que certifican personas. |
-| **pt** | Projetada conforme a estrutura ISO/IEC 17024 para organismos que certificam pessoas. |
+| **en** | Designed to the ISO/IEC 17024:2026 framework for bodies certifying persons. |
+| **es** | Diseñada conforme al marco ISO/IEC 17024:2026 para organismos que certifican personas. |
+| **pt** | Projetada conforme a estrutura ISO/IEC 17024:2026 para organismos que certificam pessoas. |
```

Append immediately after the table:

> **Edition note.** ISO/IEC 17024:2026 replaced the 2012 edition in March 2026.
> The edition is named because two are in circulation and the referent would
> otherwise be ambiguous. The claim is unchanged in kind: *designed to*, never
> *accredited to*. Re-check on the next revision.

### A3 — Section 5, forbidden formulations (line 170)

```
-| Accredited to ISO/IEC 17024 · Acreditada según ISO 17024 · Acreditada conforme ISO 17024 | Designed to the ISO/IEC 17024 framework (§4) |
+| Accredited to ISO/IEC 17024 · Acreditada según ISO 17024 · Acreditada conforme ISO 17024 | Designed to the ISO/IEC 17024:2026 framework (§4) |
```

### A4 — New Class C entry, section 3

Clause 6.5 of the 2026 edition governs AI use in the certification process.
Certidemy generates items, lessons and translations with AI and can already
evidence most of what 6.5 asks — but conformance is assessed by an accreditation
body, and the candidate-disclosure requirement is **not yet met**.

Add under Class C (forbidden until earned):

```
+- Conforms to / complies with ISO/IEC 17024:2026 clause 6.5, or any claim that
+  our use of AI in the certification process has been assessed. Becomes
+  permitted only if and when assessed. *"Designed to"* remains available; a
+  claim about our AI governance in certification is separately unearned until
+  the documented AI-in-certification policy and candidate-facing disclosure
+  both exist.
```

### CRITICAL — how these strings reach the database

The **es** and **pt** strings carry accented characters. Per the documented
mojibake source on this project, they must reach any database row through an
API-based loader script, **never through a paste into the Supabase SQL editor.**
Migrations that must carry them use SQL unicode escapes (`U&'...'`).

### Surfaces to sweep after the policy edit

The policy is the source; these are the places the string may already live.

1. All seven `SCHEME-*.md` documents.
2. `certification_i18n` rows, if the phrase appears in any claim or description.
3. The JSON-LD — `EducationalOrganization` / `EducationalOccupationalCredential`.
4. Marketing copy in all three locales. **Note:** HANDOFF v4.8 records that
   "ISO/IEC 17024 framework" is *not* in marketing copy and remains unclear for
   it, with a `CLAIMS-POLICY` check still owed. **That check is this patch.**
   Confirm by sweep rather than by memory.

**Sweep discipline (`CLAIMS-POLICY` §1):** a keyword sweep proves the absence of
the searched spelling and nothing else. Search `17024` alone — not
`ISO/IEC 17024`, which misses `ISO 17024`, and not the full sentence, which
misses every reflow.

---

## Patch B — `CERT-SCHEMA-GUIDE.md` §7: retire the repeating-digit UUID rule

### Why

The convention is exhausted (two slots left) and it was never load-bearing — the
UUID is an opaque internal identifier. Retiring it also removes the trap
recorded in HANDOFF v2.1 (*"never infer a new certification's UUID from how many
certs exist"*) by removing anything to infer from.

### B1 — Replace §7 entirely

```
-## 7. UUID convention (repeating-digit)
-
-Human-readable, collision-free by inspection:
-
-| Cert | UUID |
-|---|---|
-| SM-AI-I | `11111111-…` |
-| GAIPC stub | `22222222-…` (CertiProf-era; not ours) |
-| SPO-AI-I | `33333333-…` |
-| SD-AI-I | `44444444-…` |
-| **AIGRM-I** | `55555555-…` |
-| *next cert* | `66666666-…` |
-
-Module ids reuse the cert's digit: `a<digit×7>-0000-0000-0000-00000000000K`.
+## 7. UUID convention — RETIRED, generate instead
+
+**The repeating-digit convention is retired as of cert #8 (`ISMS-F`).** It ran
+out of readable slots and it was never load-bearing: the UUID is an opaque
+internal identifier and nothing in the platform reads meaning from it.
+
+**New certs:** generate a UUID at scaffold time, hardcode it into the seed
+migration, and record it in the migration header comment. The migration stays
+idempotent (`on conflict (id) do update`) exactly as before — the id is fixed
+in the file, it is simply no longer patterned.
+
+```sql
+-- at authoring time, once:
+select gen_random_uuid();
+-- paste the result into the migration as a literal. Do NOT call
+-- gen_random_uuid() inside the migration itself: the migration must be
+-- idempotent and a fresh uuid on re-run would duplicate the cert.
+```
+
+**Module ids** no longer mirror a cert digit. Generate five and hardcode them
+the same way, keeping `order_index` 1..N aligned to the domains. The module id
+pattern was cosmetic; `order_index` is what carries the domain alignment and it
+is unchanged.
+
+**Existing certs keep their repeating digits.** They are opaque identifiers;
+renaming would touch every migration, script and content folder for no gain.
+
+| Cert | UUID |
+|---|---|
+| SM-AI-I | `11111111-…` |
+| GAIPC stub | `22222222-…` (CertiProf-era; not ours) |
+| SPO-AI-I | `33333333-…` |
+| SD-AI-I | `44444444-…` |
+| AIGRM-I | `55555555-…` |
+| AISM-I | `66666666-…` |
+| AIHR-I | `77777777-…` |
+| **ISMS-F and later** | **generated — read the migration header** |
+
+**The old trap is closed.** HANDOFF v2.1's rule — *never infer a new
+certification's UUID from how many certs exist* — no longer has anything to
+infer from. The free-slot query in migration 105 is now vestigial for new certs.
```

### B2 — Consequential check

`gen_random_uuid()` requires `pgcrypto`, which is standard on Supabase but worth
confirming once: `select gen_random_uuid();` in the SQL editor. It is run at
authoring time only, never inside a migration.

---

## Order of operations

1. **Patch B** — unblocks the `ISMS-F` scaffold.
2. **Patch A1–A4** — the policy document itself.
3. **A sweep** — the four surface classes above. Search `17024` bare.
4. Then `SCHEME-ISMS-F.md` may be written.

Patches A and B are independent and can land in either order relative to each
other; both precede the scheme document, and B precedes the scaffold.

**Commit separately per repo.** `CLAIMS-POLICY.md` and `CERT-SCHEMA-GUIDE.md`
live in the supabase repo; any web-side string changes found by the sweep are a
separate commit in `certidemy-web`, with `npm run build` green before push.
