# Thirteen paragraphs for a human

Generated from `held-triage.json` and `modal-sweep-final.json`. Full text, no truncation.

---

## A. Five the language guard can never certify

The guard scores each of these **0 want / 0 avoid** on the existing translation:
a tie, and `looksLikeLanguage` requires want to WIN. The line carries no token
distinctive to either language, so no re-translation can pass. Edit by hand or
accept as-is.

### A1. `isms-ia-01-02-principles-in-tension` / pt-BR  (block 1, line 5)

**English now:**

```
- **Independence** - the ground on which the audit's impartiality and its conclusions' objectivity both rest.
```

**Translation now:**

```
- **Independência** - a base para a imparcialidade da auditoria e a objetividade de suas conclusões.
```

### A2. `isms-ia-02-06-testing-the-programme` / pt-BR  (block 2, line 14)

**English now:**

```
**And clause 9.2.2's closing requirement:**
```

**Translation now:**

```
**E o requisito final:**
```

### A3. `isms-ia-04-07-two-sentences` / pt-BR  (block 1, line 1)

**English now:**

```
Its normative body, in full, as ISO/IEC 27001:2022 now carries it:
```

**Translation now:**

```
Seu corpo normativo, na íntegra:
```

### A4. `aims-ia-04-03-leadership-in-artifacts` / pt-BR  (block 2, line 8)

**English now:**

```
- **point to other organizational policies where relevant**;
```

**Translation now:**

```
- **fazer referência, conforme pertinente, a outras políticas organizacionais**;
```

### A5. `isms-ia-04-07-two-sentences` / es-419  (block 1, line 1)

**English now:**

```
Its normative body, in full, as ISO/IEC 27001:2022 now carries it:
```

**Translation now:**

```
Su cuerpo normativo, en su totalidad:
```

---

## B. Eight `should` rendered as a strong modal

Each needs one word changed. Spanish: `debe` -> `deberia` (or `conviene que`).
Portuguese: `deve` -> `deveria` (or `convem que` + subjunctive). The fixer
re-rendered these correctly but its language guard would not certify the result,
so nothing was written.

### B1. `02-08-acceptable-ai-use` / pt-BR  (block 4, line 3)

**English:**

```
The alternative is not to abandon the rule. It is to write one whose compliance is visible, and to accept that a narrower enforceable rule beats a broader unenforceable one. "Use only the enterprise assistant for any work information; personal accounts are not to be used for work purposes" is narrower, and a person can tell whether they are complying.
```

**Translation now:**

```
A alternativa não é abandonar a regra. É escrever uma cujo cumprimento seja visível, e aceitar que uma regra mais estreita e aplicável supera uma mais ampla e inaplicável. "Use apenas o assistente empresarial para qualquer informação de trabalho; contas pessoais não devem ser usadas para fins profissionais" é mais estreita, e uma pessoa consegue dizer se está cumprindo.
```

**Change: NONE. This one is a false positive -- leave it alone.**

The flagged `devem` is inside a QUOTED example policy -- *"contas pessoais nao
devem ser usadas"* -- and the English it renders is *"personal accounts **are
not to be** used"*, a prohibition. `nao devem` is the correct rendering.

The check fired because it compares modal COUNTS across a whole paragraph and
cannot align one modal to another. The English `should` it believes was inflated
is actually the `can` in *"a person **can** tell whether they are complying"*,
rendered as *"consegue dizer"* -- a construction on neither list.

**It also exposes a real gap in the English strong list:** `is/are (not) to be`
is an obligation form and is not on it, which is why this paragraph scored
English strong 0. That is the seventh gap of the family, and it was deliberately
NOT added today -- `is to be` appears in benign prose too, including *"what is to
be done"* in this pass's own clause 6.2 recast, so it needs its own measurement
rather than a same-day patch.

### B2. `02-07-roles-and-authorities` / pt-BR  (block 3, line 4)

**English:**

```
Domain 3 develops the mechanics. What matters here is the principle: **the person who accepts a risk should be the person the consequence lands on.**
```

**Translation now:**

```
O Domínio 3 desenvolve a mecânica. O que importa aqui é o princípio: **a pessoa que aceita um risco deve ser aquela sobre quem recai a consequência.**
```

**Change:** `deve` -> `deveria` / `convem que`

### B3. `05-06-certification-and-accreditation` / es-419  (block 1, line 3)

**English:**

```
Two consequences a practitioner should be able to state.
```

**Translation now:**

```
Dos consecuencias que un profesional debe ser capaz de enunciar.
```

**Change:** `debe` -> `deberia` / `conviene que`

### B4. `05-06-certification-and-accreditation` / pt-BR  (block 1, line 3)

**English:**

```
Two consequences a practitioner should be able to state.
```

**Translation now:**

```
Duas consequências que um profissional deve ser capaz de enunciar.
```

**Change:** `deve` -> `deveria` / `convem que`

### B5. `04-03-governing-apparatus-controls` / es-419  (block 2, line 3)

**English:**

```
The guidance lists seven properties this mechanism should have, and they read like a whistleblowing standard because that is essentially what it is:
```

**Translation now:**

```
La guía enumera siete propiedades que debe tener este mecanismo, y se leen como un estándar de denuncia porque eso es esencialmente lo que es:
```

**Change:** `debe` -> `deberia` / `conviene que`

### B6. `aims-ia-05-05-a-report-for-someone-not-in-the-room` / pt-BR  (block 5, line 0)

**English:**

```
Clause 4.5 describes confidentiality as the security and privacy of information. Auditors should use **discretion in handling and protecting what they learn while auditing**, audit information should not be turned to personal gain or used in ways that damage the auditee's legitimate interests, and the principle covers the **proper handling of sensitive or confidential material**.
```

**Translation now:**

```
A Cláusula 4.5 descreve a confidencialidade como segurança e privacidade das informações. Os auditores devem exercer **discrição no manuseio e na proteção do que aprendem durante a auditoria**, as informações de auditoria não devem ser usadas para ganho pessoal ou de maneira prejudicial aos interesses legítimos do auditado, e o princípio inclui o **manuseio adequado de material sensível ou confidencial**.
```

**Change:** `devem` -> `deveria` / `convem que`

### B7. `aims-ia-03-08-opening-and-closing` / es-419  (block 1, line 2)

**English:**

```
What it should still achieve, however brief:
```

**Translation now:**

```
Lo que debe lograr, por breve que sea:
```

**Change:** `debe` -> `deberia` / `conviene que`

**Second defect in the same line:** the English reads "What it should **still**
achieve" and the Spanish dropped `still` altogether. B8's Portuguese kept it
("ainda"). Worth fixing while you are in there.

### B8. `aims-ia-03-08-opening-and-closing` / pt-BR  (block 1, line 2)

**English:**

```
What it should still achieve, however brief:
```

**Translation now:**

```
O que ela ainda deve alcançar, por mais breve que seja:
```

**Change:** `deve` -> `deveria` / `convem que`
