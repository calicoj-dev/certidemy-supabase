# The pt-BR siblings of the Tier C items

**Nothing was written to pt-BR.** Report only, as instructed. 22 probes, one per
Tier C item, each stating what would count as the *same slip* in Portuguese and what
the correct form is.

`scripts/check-tier-c-pt-siblings.mjs` — 6 SAME SLIP, 16 clean, 0 NOT ASKED. Every
"clean" is backed by a positive control: the sibling's text was read (935–1,351
characters each), so a non-match is a fact about the text and not about the probe.

**Then I read the six, and three of them are my probe rather than the bank.** A count
of a lexical class is a draft until somebody reads its members.

---

## Genuine — the same slip, in Portuguese

**`7df0197d` #170 — `recourse` rendered as resources.** Identical to the Spanish.

> explanation: *"...suprimir indicadores de complexidade deixa os usuários **sem
> recursos**..."*

English is *"leaves users without recourse"*. Correct form: `sem recurso` or `sem via
de recurso`.

**`c699dee9` #171 — `sistema de valores`, twice, exactly as Spanish.** Option c and
the explanation both name the ITIL service value system.

> option c: *"Sustentabilidade integrada ao **sistema de valores**..."*
> explanation: *"...está incorporada em todo o **sistema de valores**."*

Correct form: `sistema de valor`.

**`40d5d539` #224 — the inserted modal, in option d only.**

> option d: *"Lembrar ao Product Owner que ele **deve** esclarecer o Sprint Goal..."*

English is *"Remind the Product Owner to clarify"* — no obligation. Same slip as the
Spanish, and it is **in the key**, which is the worst place for it.

**The stem of the same item is NOT a slip**, and my probe wrongly flagged it: *"O que
o Scrum Master **deve** fazer?"* renders *"What should the Scrum Master do?"*, where
`deve` is the ordinary Portuguese for a deliberative *should*. One probe, two fields,
opposite verdicts.

## Needs a read before it is called anything

**`5a5917ca` #309 — `deve` in the explanation, not the stem.** The Spanish slip was
in the **stem**; the Portuguese stem is clean and the explanation carries
*"O Scrum Master **deve** escalar e defender mudanças estruturais"*. Whether that is
an insertion depends on whether the English explanation says *must*, *should* or
neither, and I have not compared them field by field. **Reported as undecided rather
than guessed.**

## My probe, not the bank

**`7312ac33` #85 — clean, and better than the Spanish was.**

> option a: *"...pois uma resposta numérica **confiante** dela é suficientemente
> **confiável** para um relatório de cliente."*

`confiante` = *confident* (the English's deliberate anthropomorphising) and
`confiável` = *reliable enough*. **Both words are correct and in the right places.**
My probe searched for `confiável` and found it where it belongs. The Spanish had a
real defect here; the Portuguese never did.

**`df6bafc6` #113 — ambiguous, and probably fine.**

> option a: *"...é transferida ao **fornecedor do modelo**..."*

English is *"the model vendor"*, so `fornecedor do modelo` is a faithful rendering.
The Spanish problem was that `proveedor` served for both *vendor* and *provider* and
the distractor's contrast collapsed. Portuguese has the same one-word overlap, but
each instance here is individually correct and the qualifier (*do modelo*) does the
disambiguating the Spanish lacked. **No change recommended.**

---

## Summary for the pt pass, when it happens

| item | field | verdict |
|---|---|---|
| `7df0197d` #170 | explanation | **fix** — `sem recursos` → `sem via de recurso` |
| `c699dee9` #171 | option c + explanation | **fix** — `sistema de valores` → `sistema de valor` |
| `40d5d539` #224 | option d only | **fix** — drop `deve`; the stem is correct and must not be touched |
| `5a5917ca` #309 | explanation | **read first** — compare the modal against the English |
| `7312ac33` #85 | — | no change; the Portuguese is correct |
| `df6bafc6` #113 | — | no change recommended |
| the other 16 | — | clean, each with the character count read |

**Three fixes, one read, two dismissals.** That is a very different pass from the 22
the Spanish needed, and the difference is the point: the es-419 slips came from one
translation run and are not a property of the item.
