# Re-extraction diff

**2 passage(s) changed**, 0 added, 0 removed,
of 2417 held.

A changed passage must be the same text minus the noise. Both sides are reduced to a NOISE-INVARIANT
form -- letters and digits only -- and compared, because comparing the strings directly cannot answer
the question: removing noise changes the string, which is the point.

| verdict | passages | meaning |
|---|---|---|
| `pure-join` | 0 | only spaces and hyphens moved; safe by construction |
| `text-moved` | 1 | a title prefix or column tail moved; shown for a human |
| **`WORDING`** | **1** | **the letter sequence differs with nothing to account for it -- a FAILURE** |

## `WORDING` -- 1, first 10

### `ISO/IEC 42001|2023|3.16`   (the letter sequence differs and nothing accounts for it)

- title BEFORE: "nonconformity non-fulfilment of a requirement (3.14)"
- title AFTER : "nonconformity"
- text BEFORE: "3.17 corrective action action to eliminate the cause(s) of a nonconformity (3.16) and to prevent recurrence 3.18 audit systematic and independent process (3.8) for obtaining evidence and evaluating it objectively to determine the extent to which the audit criteria are fulfilled Note 1 to entry: An a"
- text AFTER : "nonconformity non-fulfilment of a requirement (3.14)"

## `text-moved` -- 1, first 10

### `ISO/IEC 42001|2023|3.26`   (a span was removed from the statement)

- title BEFORE: "statement of applicability documentation"
- title AFTER : "statement of applicability"
- text BEFORE: "statement of applicability documentation of all necessary controls (3.23) and justification for inclusion or exclusion of controls Note 1 to entry: Organizations may not require all controls listed in Annex A or may even exceed the list in Annex A with additional controls established by the organiza"
- text AFTER : "statement of applicability documentation of all necessary controls (3.23) and justification for inclusion or exclusion of controls Note 1 to entry: Organizations may not require all controls listed in Annex A or may even exceed the list in Annex A with additional controls established by the organiza"

## `pure-join` -- 0, first 10

_none_

