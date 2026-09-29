# AIMS-F task 1.3 -- scope verdict per candidate clause

Printed BEFORE any promotion, as ruled. The verdicts are a human reading of each clause against the
task; anything out of scope is reported and NOT promoted.

## The task

**1.3** Describe the AI system life cycle and why it anchors AIMS obligations

**Knowledge**

> Obligations attach across the whole life cycle rather than at release. Systems that learn continuously change their behaviour during use and need specific consideration for that reason. Performance can also shift without continuous learning, through concept or data drift in production data, which is what triggers retraining. ISO/IEC 5338 describes life cycle processes, and the organization may define its own stages.

**Skills**

> Place a described activity at its life-cycle stage.

**Abilities**

> Rejection of the deploy-and-forget model.

## The candidates

### `A.6.2.2`  AI system requirements and spec- The organization shall specify and document require-   [shall]

*current role:* supporting · *length:* 24 words

> AI system requirements and spec- The organization shall specify and document require- ification ments for new AI systems or material enhancements to existing systems.

**IN SCOPE** -- AI system requirements and specification is the life-cycle stage where obligations first attach, and the task is about why the life cycle anchors AIMS obligations.

### `A.6.2.3`  Documentation of AI system design The organization shall document the AI system design and   [shall]

*current role:* supporting · *length:* 27 words

> Documentation of AI system design The organization shall document the AI system design and and development development based on organizational objectives, docu- mented requirements and specification criteria.

**IN SCOPE** -- Documentation of AI system design and development is a life-cycle-stage control: it is one of the stages the task asks a candidate to describe.

### `A.6.2.4`  AI system verification and valida- The organization shall define and document verification   [shall]

*current role:* supporting · *length:* 26 words

> AI system verification and valida- The organization shall define and document verification tion and validation measures for the AI system and specify criteria for their use.

**IN SCOPE** -- Verification and validation is a named life-cycle stage and carries its own requirement text, which is what an item needs to anchor in.

### `A.6.2.5`  AI system deployment               The organization shall document a deployment plan and   [shall]

*current role:* supporting · *length:* 23 words

> AI system deployment The organization shall document a deployment plan and ensure that appropriate requirements are met prior to deployment. Table A.1 (continued)

**IN SCOPE** -- Deployment is the stage C.3.6 names as a risk source ('inadequate deployment'), so the control is the requirement behind the example the task currently leans on.

### `A.6.2.6`  AI system operation and monitor-  The organization shall define and document the necessary   [shall]

*current role:* supporting · *length:* 37 words

> AI system operation and monitor- The organization shall define and document the necessary ing elements for the ongoing operation of the AI system. At the minimum, this should include system and performance monitoring, repairs, updates and support.

**IN SCOPE** -- Operation and monitoring is the post-release stage, and the task's whole point is that obligations do not stop when a system ships.

### `A.6.2.7`  AI system technical documentation The organization shall determine what AI system techni-   [shall]

*current role:* supporting · *length:* 40 words

> AI system technical documentation The organization shall determine what AI system techni- cal documentation is needed for each relevant category of interested parties, such as users, partners, supervisory authorities, and provide the technical documentation to them in the appropriate form.

**IN SCOPE** -- Technical documentation and information for users spans the life cycle and is a control in its own right, not guidance about another control.

### `A.6.2.8`  AI system recording of event logs The organization shall determine at which phases of the   [shall]

*current role:* supporting · *length:* 38 words

> AI system recording of event logs The organization shall determine at which phases of the AI system life cycle, record keeping of event logs should be enabled, but at the minimum when the AI system is in use.

**IN SCOPE** -- Event logs are the operating-stage record, which is part of the life cycle the task covers.

## Verdict summary

| clause | verdict | current role | words |
|---|---|---|---|
| `A.6.2.2` | in scope, PROMOTE to primary | supporting | 24 |
| `A.6.2.3` | in scope, PROMOTE to primary | supporting | 27 |
| `A.6.2.4` | in scope, PROMOTE to primary | supporting | 26 |
| `A.6.2.5` | in scope, PROMOTE to primary | supporting | 23 |
| `A.6.2.6` | in scope, PROMOTE to primary | supporting | 37 |
| `A.6.2.7` | in scope, PROMOTE to primary | supporting | 40 |
| `A.6.2.8` | in scope, PROMOTE to primary | supporting | 38 |

**7 to promote, 0 withheld, 0 absent.**

B.6.2.2 to B.6.2.8 stay SUPPORTING by ruling: they are implementation guidance for these controls, so
an item anchors on the control text while the guidance feeds the explanation and the distractors. That
also keeps `should` guidance from being keyed as a requirement. C.3.6 stays primary, capped by the
within-task anchor cap rather than by demotion.

