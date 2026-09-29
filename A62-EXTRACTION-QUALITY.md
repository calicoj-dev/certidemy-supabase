# Extraction quality of the clauses task 1.3 can now anchor in

**Report only.** These seven were SUPPORTING until 2026-09-29, so their text only fed explanations and
distractors. They are now anchorable: a key's `key_support` is copied verbatim out of them and the
verbatim gate compares character for character, so extraction noise becomes the text of an item.

Detectors name a SHAPE the extractor produces, never a spelling -- a word list would miss the next
duplicated pair.

| clause | promoted today | words | findings |
|---|---|---|---|
| `A.6.2.2` | yes | 24 | hyphenation break mid-word; title bleeding into the text |
| `A.6.2.3` | yes | 27 | duplicated adjacent word; hyphenation break mid-word; title bleeding into the text |
| `A.6.2.4` | yes | 26 | hyphenation break mid-word; title bleeding into the text |
| `A.6.2.5` | yes | 23 | title bleeding into the text |
| `A.6.2.6` | yes | 37 | hyphenation break mid-word; title bleeding into the text |
| `A.6.2.7` | yes | 40 | hyphenation break mid-word; title bleeding into the text |
| `A.6.2.8` | yes | 38 | title bleeding into the text |
| `A.6.1.2` | - | 39 | hyphenation break mid-word; title bleeding into the text |
| `A.6.1.3` | - | 28 | hyphenation break mid-word; title bleeding into the text |
| `B.6.1.1` | - | 21 | clean |
| `B.6.2.1` | - | 15 | clean |
| `C.3.6` | - | 24 | clean |
| `8.1` | - | 169 | a lone letter between words |

**10 of 13 carry at least one finding.**

### `A.6.2.2`   (promoted today)

- **hyphenation break mid-word** -- ...AI system requirements and spec- The organization shall specify and document require- ific...
- **title bleeding into the text** -- ...AI system requirements and spec- The organization shall spec...

Full text as held:

> AI system requirements and spec- The organization shall specify and document require- ification ments for new AI systems or material enhancements to existing systems.

### `A.6.2.3`   (promoted today)

- **duplicated adjacent word** -- ...document the AI system design and and development development based on organizational obje...
- **hyphenation break mid-word** -- ...organizational objectives, docu- mented requirements and specification criteria....
- **title bleeding into the text** -- ...Documentation of AI system design The organization shall doc...

Full text as held:

> Documentation of AI system design The organization shall document the AI system design and and development development based on organizational objectives, docu- mented requirements and specification criteria.

### `A.6.2.4`   (promoted today)

- **hyphenation break mid-word** -- ... system verification and valida- The organization shall define and document verification t...
- **title bleeding into the text** -- ...AI system verification and valida- The organization shall de...

Full text as held:

> AI system verification and valida- The organization shall define and document verification tion and validation measures for the AI system and specify criteria for their use.

### `A.6.2.5`   (promoted today)

- **title bleeding into the text** -- ...AI system deployment The organization shall document a deplo...

Full text as held:

> AI system deployment The organization shall document a deployment plan and ensure that appropriate requirements are met prior to deployment. Table A.1 (continued)

### `A.6.2.6`   (promoted today)

- **hyphenation break mid-word** -- ...AI system operation and monitor- The organization shall define and document the necessary ...
- **title bleeding into the text** -- ...AI system operation and monitor- The organization shall defi...

Full text as held:

> AI system operation and monitor- The organization shall define and document the necessary ing elements for the ongoing operation of the AI system. At the minimum, this should include system and performance monitoring, repairs, updates and support.

### `A.6.2.7`   (promoted today)

- **hyphenation break mid-word** -- ...determine what AI system techni- cal documentation is needed for each relevant category of...
- **title bleeding into the text** -- ...AI system technical documentation The organization shall det...

Full text as held:

> AI system technical documentation The organization shall determine what AI system techni- cal documentation is needed for each relevant category of interested parties, such as users, partners, supervisory authorities, and provide the technical documentation to them in the appropriate form.

### `A.6.2.8`   (promoted today)

- **title bleeding into the text** -- ...AI system recording of event logs The organization shall det...

Full text as held:

> AI system recording of event logs The organization shall determine at which phases of the AI system life cycle, record keeping of event logs should be enabled, but at the minimum when the AI system is in use.

### `A.6.1.2`

- **hyphenation break mid-word** -- ...ectives for responsible develop- The organization shall identify and document objectives m...
- **title bleeding into the text** -- ...Objectives for responsible develop- The organization shall i...

Full text as held:

> Objectives for responsible develop- The organization shall identify and document objectives ment of AI system to guide the responsible development AI systems, and take those objectives into account and integrate measures to achieve them in the development life cycle.

### `A.6.1.3`

- **hyphenation break mid-word** -- ...rocesses for responsible AI sys- The organization shall define and document the specific t...
- **title bleeding into the text** -- ...Processes for responsible AI sys- The organization shall def...

Full text as held:

> Processes for responsible AI sys- The organization shall define and document the specific tem design and development processes for the responsible design and development of the AI system.

### `8.1`

- **a lone letter between words** -- ...s reference controls and Annex B provides implementation guidance for them. Documented inf...

Full text as held:

> The organization shall plan, implement and control the processes needed to meet requirements, and to implement the actions determined in Clause 6, by: — establishing criteria for the processes; — implementing control of the processes in accordance with the criteria. The organization shall implement the controls determined according to 6.1.3 that are related to the operation of the AI management system (e.g. AI system development and usage life cycle related controls). The effectiveness of these controls shall be monitored and corrective actions shall be considered if the intended results are not achieved. Annex A lists reference controls and Annex B provides implementation guidance for them. Documented information shall be available to the extent necessary to have confidence that the processes have been carried out as planned. The organization shall control planned changes and review the consequences of unintended changes, taking action to mitigate any adverse effects, as necessary. The organization shall ensure that externally provided processes, products or services that are relevant to the AI management system are controlled.

## What this does and does not mean

A key quoting mangled text would still PASS the verbatim gate, because the gate asks whether the quote
matches the passage -- and it does. It would fail nothing and read wrong to a candidate. That is the
dangerous direction: the gate cannot see it.

Not repaired here. Re-extracting a source is a re-calibration, and this repository records that
changing an index moves error rates everywhere and must be measured rather than slipped in beside
another change.

