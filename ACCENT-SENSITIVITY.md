# Search is accent-sensitive — exposure and proposal

**Report only. Nothing deployed.** Found while chasing a test bug that turned out not to
be a product defect; this is the product defect underneath it.

---

## What it is

`search` matches with a word-boundary regex, `~* '\y<term>'`, against the raw text. There is
no normalisation on either side, so **a query without accents does not match text with them**.

Measured at the deployed endpoint, unauthenticated:

| language | query | rows | | query | rows |
|---|---|---|---|---|---|
| es-419 | `auditoría` | **69** | | `auditoria` | **0** |
| es-419 | `gestión` | **33** | | `gestion` | **5** |
| es-419 | `información` | **26** | | `informacion` | **0** |
| pt-BR | `avaliação` | **14** | | `avaliacao` | **0** |
| pt-BR | `seção` | **59** | | `secao` | **0** |
| en | `audit` | **80** | | — | — |

**`gestion` returning 5 of 33 is the worst shape here.** Zero results might make a user
question their spelling. Five results looks like an answer, and nothing tells them that
twenty-eight were missed.

The failure mode for a real user is exactly the one that fooled this investigation: **fewer
results or none, no error, no suggestion.**

---

## Exposure

Searchable Spanish and Portuguese text — `mcp.task.statement`, `mcp.concept.name` and
`mcp.concept.description`, words of four characters or more:

| language | distinct accented words | share of vocabulary | occurrences |
|---|---|---|---|
| es-419 | **751** | 12.9% | 5,057 |
| pt-BR | **1,008** | 16.9% | 6,954 |

The most frequent are precisely the words a user would type as a query:

**es-419** — `auditoría` (347), `organización` (215), `gestión` (137), `evaluación` (127),
`información` (120), `revisión` (70), `declaración` (63), `acción` (62), `dirección` (52),
`decisión` (49), `propósito` (44), `política` (44), `certificación` (41)

**pt-BR** — `seção` (347), `organização` (210), `evidência` (146), `serviço` (141),
`avaliação` (129), `gestão` (121), `critérios` (96), `informação` (92), `análise` (74),
`competência` (66), `declaração` (65), `governança` (62), `direção` (61)

**Every one of the top fourteen in both languages is a plausible query term**, and every one
fails or under-returns when typed plainly. This is a mobile-first Android product in LATAM,
where the accent is two taps away.

---

## Proposal

### Unaccent both sides

```sql
extensions.unaccent(<field>) ~* ('\y' || extensions.unaccent(<term>))
```

### What it costs

**The extension is available and not installed.** `unaccent` 1.1 is in
`pg_available_extensions`; `pg_extension` has `citext` only. So step one is a migration:

```sql
create extension if not exists unaccent with schema extensions;
```

**It must be schema-qualified at every call site.** Several functions here run with
`search_path = ''`, and CLAUDE.md already records what an unqualified lookup costs under that
setting — `translation_hash` resolving `public.ksa_en_hash` at runtime took every non-English
concept read down for four migrations.

**No index is affected, because there is no index.** `courseware-query`'s own comment argues
this deliberately: a search is certification-scoped, the corpus is a few hundred rows, and the
scan is microseconds. That reasoning survives `unaccent` — it adds a per-row function call to a
scan that was already sequential.

**It would matter if an index were ever added.** `unaccent()` is STABLE rather than IMMUTABLE,
because its behaviour depends on a dictionary file, so it cannot appear in an index expression
without an IMMUTABLE wrapper. Worth recording now so the next person reaching for a GIN index
does not discover it then.

**English should be unchanged** — `unaccent` maps accented characters to ASCII and passes ASCII
through. **That is documented behaviour and it has not been verified on this database**, so it
is an assertion the deployment must make rather than a claim this report gets to make.

### What moves

The change reveals more rows from `mcp.task` and `mcp.concept`. **It bypasses no gate**: those
views already apply every withholding rule, and the rows in question were always servable and
merely unmatched. So this is a recall improvement over already-cleared content, not a release of
withheld content — but it does change what an unauthenticated surface returns, and it gets the
same treatment as anything else: enumerate, control, deploy.

### Controls the deployment owes

1. **Both directions on English.** `audit` must still return 80 on AIMS-IA, and a query that
   should match nothing must still match nothing. A normalisation that widens everything would
   pass a one-sided check.
2. **The accented form must not regress.** `auditoría` returns 69 today; it must after.
3. **The unaccented form must reach parity.** `auditoria` 0 → 69, `informacion` 0 → 26,
   `secao` 0 → 59. Stated as expectations before the change, not read off it afterwards.
4. **A term that is genuinely absent must still return zero** — otherwise the control cannot
   distinguish "unaccent worked" from "the matcher stopped discriminating".

---

## The wire matrix

`QUERY` is now `auditoría` for es-419. **That fixes the test and not the product**: a user
typing `auditoria` still gets nothing until the above lands.

Worth keeping both forms in the matrix afterwards — the accented one as the correctness floor,
the unaccented one as the accent-insensitivity assertion.
