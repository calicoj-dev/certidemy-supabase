# HANDOFF v8.3 — Verify page closed, issuing panel split

**Session date:** 2026-08-22 (continuous with v8.2)
**Migration tip:** 242. Next free: 243.
**Certificate renderer: 6.**
**Read v8.2 first.** This is a short delta on top of it.

---

## 1. WHAT LANDED

| commit | what |
|---|---|
| `15c4917` | badge explanation behind the download click |
| `78d744c` | achievement editor extracted from issuing-panel.tsx |

### The badge dialog

`badgeNote` and `badgeHolderNote` were three paragraphs wedged between the
download buttons and the blueprint button. Important text — "Download badge"
reads as "save a picture", and nobody would guess a PNG carries a signed
verifiable credential unless told — but unread where it sat.

Now `components/verify/badge-download-dialog.tsx`: artwork, explanation, and the
download, behind the click. **No new message keys** — `downloadBadge`,
`badgeNote`, `badgeHolderNote` and `openBadge.close` already existed in all
three locales. The words were right; the place was wrong.

`certificationCode` is passed explicitly rather than derived from the credential
code. The first draft did `credentialCode.split("-").slice(0, -2).join("-")`,
which guesses at a string shape the code format does not promise.

### The extraction

`issuing-panel.tsx`: **1,464 → 859 lines.** New
`components/console/achievement-modal.tsx` at 630.

Moved: `OB3_TYPES`, `TaskDraft`, `GroupDraft`, `newTask`, `newGroup`,
`normalizeCode`, `suggestNextCode`, `Req`, `ESCO_FRAMEWORK`, `ESCO_URI_RE`,
`isUsableTargetUrl`, `toGroups`, `StructureEditor`, `AchievementModal`.

Stayed: `StatusPill`, `Section`, `Empty`, `NewKeyModal`, `IssuerDetail`,
`IssuingPanel` — the first three belong to `IssuerDetail` and sit in the middle
of the moved range, which is why the cut was two spans rather than one.

**The script cut live text rather than carrying a copy.** Retyping ~600 lines
from a paste is what caused three of the four anchor failures that motivated the
extraction. It also grepped every moved symbol against what remained and would
have aborted on any dangling reference. Diff was 630 insertions / 606 deletions
— what a pure move should look like.

---

## 2. THE EMAIL DECISION — RESEARCHED, NOT BUILT

Juan asked whether `info@certidemy.com` should send transactional mail.

**No, and no mailbox is needed either.** A transactional provider (Resend,
Postmark, SES) sends AS an address you own by proving domain ownership through
DNS — SPF plus a DKIM selector. No Workspace seat, no server, no per-I/O
infrastructure. Free tiers cover thousands a month.

**Sending needs no mailbox; receiving does.** MX points at Google, so a reply to
`no-reply@certidemy.com` would bounce off a mailbox that does not exist.

**Recommended: send from a subdomain**, `mail.certidemy.com`. It isolates
transactional reputation from human email, so a bounce storm cannot damage
`info@`, and the provider gets its own DKIM selector rather than sharing
`google._domainkey`.

**Open question for the next session:** whether Supabase auth email is still on
the default `noreply@mail.app.supabase.io` (heavily rate-limited, spam-prone) or
already on custom SMTP. If custom SMTP exists, use that provider for issuance
mail too — same DNS, same reputation, one fewer account.

Dashboard: `/project/pctynukndxnmnxiqpgck/auth/smtp`

### Design sketch, not yet built

- `send-issuance-email` edge function: credential code in; holder name,
  achievement, issuer and verify URL loaded from it.
- Template in three locales. **The holder's language is not obvious** —
  `credentials.locale` is stamped at mint time for Certidemy credentials, but a
  partner issuing through the API may not set it. Probably falls back to the
  issuer's locale, then English.
- **Fire-and-forget.** An email failure must never fail an issuance. The
  `dispatch-webhooks` pattern already solves this: a queue table, `pg_cron`
  every minute, `FOR UPDATE SKIP LOCKED`, exponential backoff, abandonment after
  five tries. Reusing it gives retries for free.

---

## 3. OPEN

Unchanged from v8.2 §5 except that items 1 and 4 are done. Current order:

1. **The issuance email** (§2). The last real gap in the holder story — a
   partner can issue twenty credentials and nobody is told.
2. **Console translation.** The ESCO picker is trilingual; everything around it
   is hardcoded English. v8.1 decision: console EN+ES, partner-reachable
   surfaces all three.
3. **Super admin context switcher.** Still nobody has seen the partner view;
   every screenshot to date is the admin render.
4. **JTA skills.** 6–10 job-market skill phrases per certification, hand-written,
   phrased the way Lightcast phrases them. A cert-creation change.
5. `IssuingSnapshot.error` pattern for the other ten `lib/console/*.ts` loaders.
6. `--rebuild` on `build-credential-anchor.mjs`. Load-bearing since 242 and now
   demonstrated: the Checks tab reads "not yet hashed" on the partner credential
   after skills were added.
7. Verify page: the domain header wraps and the bare item count reads as part of
   the percentage. `criteria.narrative` is still single-language.
8. `set-credential-results` UI; partner-visible credentials list;
   `upsert-issuer-webhook`; resolver-level SSRF check; SVG badge sanitiser.
9. Four certifications have no specimen: AIMS-F, AIMS-IA, ISMS-F, ISMS-IA.

---

## 4. LIVE STATE

```
issuers            2   certidemy, test-partner-02
achievements      13   11 Certidemy + 2 partner
credentials       10
migration tip    242
cert renderer      6
```

`SCRUM-BOOTCAMP-2-T7ZQ-755P` carries three alignments — one syllabus row, two
ESCO skills. Signature verifies. Anchor stale by design.

`SM-AI-I-ZZMV-JPC8` unchanged at
`366981ac5a547b6c7aa943f66eecd3c8f75ccf5078bdc30b594f4784a109a796`.
