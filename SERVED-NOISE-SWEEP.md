# Has extraction noise already reached candidates?

**Read-only.** Ruled PROMPT-88 s0. Served fields only: stems, options, and PRACTICE explanations.
A secure explanation is not served (migration 378) and is reported separately as internal.

Every language is swept: a translated stem is served too, and noise carried into a translation is
served three times.

| certification | rows | served spans | rows with a served hit | hyphen-break | doubled-word | run-together |
|---|---|---|---|---|---|---|
| AIE-I | 1145 | 6320 | **0** | 0 | 0 | 0 |
| AIGRM-I | 2907 | 16065 | **0** | 0 | 0 | 0 |
| AIHR-I | 1535 | 8485 | **0** | 0 | 0 | 0 |
| AIMS-F | 1927 | 10688 | **0** | 0 | 0 | 0 |
| AIMS-IA | 2160 | 12000 | **2** | 0 | 5 | 0 |
| AISM-I | 3312 | 18366 | **1** | 0 | 1 | 0 |
| ISMS-F | 2667 | 14775 | **1** | 0 | 1 | 0 |
| ISMS-IA | 2052 | 11400 | **3** | 0 | 3 | 0 |
| SD-AI-I | 2481 | 13671 | **1** | 0 | 1 | 0 |
| SM-AI-I | 3025 | 16597 | **0** | 0 | 0 | 0 |
| SM-AI-II | 2386 | 13256 | **1** | 0 | 1 | 0 |
| SPO-AI-I | 2583 | 14235 | **0** | 0 | 0 | 0 |
| ZZ-TEST-I | 1 | 5 | **0** | 0 | 0 | 0 |
| **all** | **28181** | **155863** | **9** | **0** | **12** | **0** |

**9 of 28181 rows carry noise in a served field.**

## `hyphen-break` in a served field -- 0 hit(s), first 10

_none_

## `doubled-word` in a served field -- 12 hit(s), first 10

- **AIMS-IA** `54a9aaa8` es-419 practice/approved · option[0] · matched "muestra muestra" -- ...La muestra muestra que seis de las 18 tarjetas de modelo examinadas carec...
- **AIMS-IA** `54a9aaa8` es-419 practice/approved · option[1] · matched "muestra muestra" -- ...La muestra muestra que seis de las 18 tarjetas de modelo examinadas carec...
- **AIMS-IA** `54a9aaa8` es-419 practice/approved · option[2] · matched "muestra muestra" -- ...La muestra muestra que seis de las 18 tarjetas de modelo examinadas carec...
- **AIMS-IA** `54a9aaa8` es-419 practice/approved · option[3] · matched "muestra muestra" -- ...La muestra muestra que seis de las 18 tarjetas de modelo examinadas carec...
- **AIMS-IA** `bc6dfe22` pt-BR secure/approved · option[1] · matched "não não" -- ... no máximo, observações de auditoria, e não não conformidades....
- **AISM-I** `72082029` pt-BR secure/approved · option[2] · matched "prática prática" -- ...to diagnóstico desenvolvido por meio de prática prática repetida....
- **ISMS-F** `e7e3ba7b` pt-BR practice/approved · option[3] · matched "não não" -- ...ervações são oportunidades de melhoria, não não conformidades....
- **ISMS-IA** `1998288c` pt-BR practice/approved · option[3] · matched "não não" -- ...dados organizacionais são observações e não não conformidades contra o Anexo A 5.9, pois nenhum ativo de infor...
- **ISMS-IA** `4a33e2be` es-419 secure/approved · option[2] · matched "una una" -- ...Las Unidades A y B tienen cada una una no conformidad con la cláusula 8.1, pero sus diferentes causas...
- **ISMS-IA** `df21b605` es-419 practice/approved · option[1] · matched "muestra muestra" -- ...al con la confiabilidad del proceso. La muestra muestra que 20 contratos contenían la cláusula; no evalúa si e...

## `run-together` in a served field -- 0 hit(s), first 10

_none_

## Internal: secure explanations carrying noise (not served)

1 row(s). Reported apart because a secure explanation is unreachable to a
candidate; it still corrupts the audit trail and any text gate that reads it.

- **SM-AI-II** `2aa4ad77` es-419 · doubled-word · "pregunta pregunta"

