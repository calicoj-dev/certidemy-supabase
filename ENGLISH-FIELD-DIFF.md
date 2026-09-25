# Which English checkpoint fields moved

The field rule is keyed on the **English** diff, never on what the regeneration changed.
A field whose English never moved has no warrant to be rewritten, so its old translation
is written back byte for byte -- which discards any drift the regeneration introduced
without anyone hand-fixing it.

| block | English fields | moved | held |
|---|---|---|---|
| `01-03-the-ai-system-life-cycle es-419 b21` | 24 | **0** | 24 |
| `01-03-the-ai-system-life-cycle pt-BR b21` | 24 | **0** | 24 |
| `05-02-aims-internal-audit es-419 b28` | 24 | **1** | 23 |
| `05-02-aims-internal-audit pt-BR b28` | 24 | **1** | 23 |

**2 moved, 94 held.**

## `05-02-aims-internal-audit es-419 b28`

- `q2.explanation`

## `05-02-aims-internal-audit pt-BR b28`

- `q2.explanation`
