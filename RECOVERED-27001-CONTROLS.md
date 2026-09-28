# The six recovered ISO/IEC 27001 Annex A controls, checked for misattachment

`scripts/verify-recovered-27001-controls.mjs`, read-only.

**A statement under the wrong control number is worse than a missing control**: the address resolves,
the gate passes, and an item quotes the wrong requirement with the library agreeing. The recovery
reads the right column of the lines FOLLOWING the title line, so off-by-one attachment is its one
real failure mode and it is what this checks.

**The verdicts do not depend on the cutoff.** Re-decided at every threshold from 4 to 12 words: no verdict moves. The own-against-neighbour margins are 9-31 words against 0-4, so the
comparison decides and the number does not. That matters because this instrument was changed after it
called A.8.15 misattached, and a threshold adjusted on sight of its own result is worth nothing.

| control | title | verdict | basis |
|---|---|---|---|
| `A.7.11` | Supporting utilities | **CORRECT** | ISO/IEC 27002 clause 7.11 carries 18 of the same words in a row against 4 for the neighbour |
| `A.8.1` | User end point devices | **CORRECT** | ISO/IEC 27002 clause 8.1 carries 9 of the same words in a row |
| `A.8.5` | Secure authentication | **CORRECT** | ISO/IEC 27002 clause 8.5 carries 21 of the same words in a row |
| `A.8.11` | Data masking | **CORRECT** | ISO/IEC 27002 clause 8.11 carries 31 of the same words in a row against 4 for the neighbour |
| `A.8.15` | Logging | **CORRECT** | ISO/IEC 27002 clause 8.15 carries 17 of the same words in a row |
| `A.8.32` | Change management | **CORRECT** | ISO/IEC 27002 clause 8.32 carries 15 of the same words in a row |

**All six attach to their own control number.** Each statement opens with its own title's subject,
and where 27002 holds the same number it agrees.

---

## `A.7.11` — Supporting utilities

**Verdict: CORRECT** — ISO/IEC 27002 clause 7.11 carries 18 of the same words in a row against 4 for the neighbour

**Recovered statement, as the library now holds it:**

> Information processing facilities shall be protected from power failures and other disruptions caused by failures in supporting utilities.

| test | result |
|---|---|
| opens with its OWN title (`Supporting utilities`) | 0 of 2 words: none |
| opens with the NEXT control's title (`Cabling security`) | 0 of 2 words: none |
| ISO/IEC 27002 clause `7.11` (SENTENCE match) | "Supporting utilities" -- longest shared run 18 words |
| ISO/IEC 27002 clause `7.12` (the neighbour) | "Cabling security" -- longest shared run 4 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains security properties concepts capabilities #Protection #Preventive #Detective #Integrity #Protect #Detect #Physical_security #Availability Control Information processing facilities should be protected from power failures and other disruptions caused by failures in supporting utilities. Purpose To prevent loss, damage or compromise ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    7.11 Supporting utilities          Control

                                                                                                                                                    7.12 Cabling security              Information proce
                                                                                                                                                                                       and other disrupt

                                                                                                                                                                                       Control
```

---

## `A.8.1` — User end point devices

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.1 carries 9 of the same words in a row

**Recovered statement, as the library now holds it:**

> Information stored on, processed by or accessible via user end point devices shall be protected.

| test | result |
|---|---|
| opens with its OWN title (`User end point devices`) | 3 of 3 words: user, point, devices |
| opens with the NEXT control's title (`Privileged access rights`) | 0 of 3 words: none |
| ISO/IEC 27002 clause `8.1` (SENTENCE match) | "User endpoint devices" -- longest shared run 9 words |
| ISO/IEC 27002 clause `8.2` (the neighbour) | "Privileged access rights" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security do- #Preventive capabilities mains security properties concepts #Asset_management #Protection #Confidentiality #Protect #Information_protection #Integrity #Availability Control Information stored on, processed by or accessible via user endpoint devices should be protected. Purpose To protect information against the risks introduced by usi ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    8.1  User end point devices        Control

                                                                                                                                                    8.2  Privileged access rights      Information store
                                                                                                                                                                                       devices shall be 

                                                                                                                                                                                       Control
```

---

## `A.8.5` — Secure authentication

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.5 carries 21 of the same words in a row

**Recovered statement, as the library now holds it:**

> Secure authentication technologies and procedures shall be implemented based on information access restrictions and the topic-specific policy on access control.

| test | result |
|---|---|
| opens with its OWN title (`Secure authentication`) | 2 of 2 words: secure, authentication |
| opens with the NEXT control's title (`Capacity management`) | 0 of 2 words: none |
| ISO/IEC 27002 clause `8.5` (SENTENCE match) | "Secure authentication" -- longest shared run 21 words |
| ISO/IEC 27002 clause `8.6` (the neighbour) | "Capacity management" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive capabilities #Protection security properties concepts #Identity_and_ac- #Confidentiality #Protect cess_management #Integrity #Availability Control Secure authentication technologies and procedures should be implemented based on information access restrictions and the topic-specific policy on access control. Purpose To ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 8.5  Secure authentication    Control

                                                                                                                                                 8.6  Capacity management      Secure authentication tec
                                                                                                                                                                               based on information acce
                                                                                                                                                                               on access control.

```

---

## `A.8.11` — Data masking

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.11 carries 31 of the same words in a row against 4 for the neighbour

**Recovered statement, as the library now holds it:**

> Data masking shall be used in accordance with the organization’s topic-specific policy on access control and other related topic-specific policies, and business requirements, taking applicable legislation into consideration.

| test | result |
|---|---|
| opens with its OWN title (`Data masking`) | 2 of 2 words: data, masking |
| opens with the NEXT control's title (`-`) | next not held |
| ISO/IEC 27002 clause `8.11` (SENTENCE match) | "Data masking" -- longest shared run 31 words |
| ISO/IEC 27002 clause `8.12` (the neighbour) | "Data leakage prevention" -- longest shared run 4 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive capabilities security properties concepts #Confidentiality #Protect #Information_protection #Protection Control Data masking should be used in accordance with the organization’s topic-specific policy on access control and other related topic-specific policies, and business requirements, taking applicable legislation in ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 8.11 Data masking             Control

                                                                                                                                                 8.12 Data leakage prevention  Data masking shall be use
                                                                                                                                                                               topic-specific policy on 
                                                                                                                                                                               policies, and business re
                                                                                                                                                                               consideration.
```

---

## `A.8.15` — Logging

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.15 carries 17 of the same words in a row

**Recovered statement, as the library now holds it:**

> Logs that record activities, exceptions, faults and other relevant events shall be produced, stored, protected and analysed.

| test | result |
|---|---|
| opens with its OWN title (`Logging`) | 0 of 1 words: none |
| opens with the NEXT control's title (`Monitoring activities`) | 1 of 2 words: activities |
| ISO/IEC 27002 clause `8.15` (SENTENCE match) | "Logging" -- longest shared run 17 words |
| ISO/IEC 27002 clause `8.16` (the neighbour) | "Monitoring activities" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Detective capabilities security properties concepts #Confidentiality #Detect #Information_securi- #Protection #Integrity ty_event_management #Defence #Availability Control Logs that record activities, exceptions, faults and other relevant events should be produced, stored, protected and analysed. Purpose To record events, generat ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 8.15 Logging                  Control

                                                                                                                                                 8.16 Monitoring activities    Logs that record activiti
                                                                                                                                                                               shall be produced, stored

                                                                                                                                                                               Control
```

---

## `A.8.32` — Change management

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.32 carries 15 of the same words in a row

**Recovered statement, as the library now holds it:**

> Changes to information processing facilities and information systems shall be subject to change management procedures.

| test | result |
|---|---|
| opens with its OWN title (`Change management`) | 0 of 2 words: none |
| opens with the NEXT control's title (`Test information`) | 1 of 2 words: information |
| ISO/IEC 27002 clause `8.32` (SENTENCE match) | "Change management" -- longest shared run 15 words |
| ISO/IEC 27002 clause `8.33` (the neighbour) | "Test information" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive capabilities security properties concepts #Confidentiality #Protect #Application_security #Protection #Integrity #System_and_net- #Availability work_security Control Changes to information processing facilities and information systems should be subject to change management procedures. Purpose To preserve information se ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    8.32 Change management             Control

                                                                                                                                                    8.33 Test information              Changes to inform
                                                                                                                                                                                       shall be subject 

                                                                                                                                                                                       Control
```

