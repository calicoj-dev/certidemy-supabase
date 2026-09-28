# The six recovered ISO/IEC 27001 Annex A controls, checked for misattachment

`scripts/verify-recovered-27001-controls.mjs`, read-only.

**A statement under the wrong control number is worse than a missing control**: the address resolves,
the gate passes, and an item quotes the wrong requirement with the library agreeing. The recovery
reads the right column of the lines FOLLOWING the title line, so off-by-one attachment is its one
real failure mode and it is what this checks.

**The verdicts do not depend on the cutoff.** Re-decided at every threshold from 4 to 12 words: **1 verdict(s) move** (A.8.1). The own-against-neighbour margins are 9-31 words against 0-4, so the
comparison decides and the number does not. That matters because this instrument was changed after it
called A.8.15 misattached, and a threshold adjusted on sight of its own result is worth nothing.

| control | title | verdict | basis |
|---|---|---|---|
| `A.5.1` | Policies for information secu | **CORRECT** | ISO/IEC 27002 clause 5.1 carries 35 of the same words in a row against 7 for the best neighbour |
| `A.5.2` | Information security roles and | **CORRECT** | ISO/IEC 27002 clause 5.2 carries 15 of the same words in a row |
| `A.5.3` | Segregation of duties | **CORRECT** | ISO/IEC 27002 clause 5.3 carries 10 of the same words in a row |
| `A.5.4` | Management responsibilities | **CORRECT** | ISO/IEC 27002 clause 5.4 carries 25 of the same words in a row |
| `A.5.5` | Contact with authorities | **CORRECT** | ISO/IEC 27002 clause 5.5 carries 10 of the same words in a row against 8 for the best neighbour |
| `A.5.6` | Contact with special interest | **CORRECT** | ISO/IEC 27002 clause 5.6 carries 19 of the same words in a row against 8 for the best neighbour |
| `A.5.7` | Threat intelligence | **CORRECT** | ISO/IEC 27002 clause 5.7 carries 15 of the same words in a row |
| `A.5.8` | Information security in project | **CORRECT** | ISO/IEC 27002 clause 5.8 carries 8 of the same words in a row against 4 for the best neighbour |
| `A.5.9` | Inventory of information and | **CORRECT** | ISO/IEC 27002 clause 5.9 carries 15 of the same words in a row against 6 for the best neighbour |
| `A.5.10` | Acceptable use of information | **CORRECT** | ISO/IEC 27002 clause 5.10 carries 20 of the same words in a row against 7 for the best neighbour |
| `A.5.11` | Return of assets | **CORRECT** | ISO/IEC 27002 clause 5.11 carries 27 of the same words in a row |
| `A.5.12` | Classification of information | **CORRECT** | ISO/IEC 27002 clause 5.12 carries 23 of the same words in a row |
| `A.5.13` | Labelling of information | **MISATTACHED** | ISO/IEC 27002's PREVIOUS (A.5.12) clause matches better (23 words in a row against 0 for its own number) |
| `A.5.14` | Information transfer | **CORRECT** | ISO/IEC 27002 clause 5.14 carries 26 of the same words in a row |
| `A.5.15` | Access control | **CORRECT** | ISO/IEC 27002 clause 5.15 carries 25 of the same words in a row against 7 for the best neighbour |
| `A.5.16` | Identity management Rules to control physical and logical access to information and other  | **MISATTACHED** | ISO/IEC 27002's NEXT (A.5.17) clause matches better (18 words in a row against 9 for its own number) |
| `A.5.17` | Authentication information | **CORRECT** | ISO/IEC 27002 clause 5.17 carries 17 of the same words in a row |
| `A.5.18` | Access rights | **CORRECT** | ISO/IEC 27002 clause 5.18 carries 30 of the same words in a row against 6 for the best neighbour |
| `A.5.19` | Information security in supplier | **CORRECT** | ISO/IEC 27002 clause 5.19 carries 24 of the same words in a row |
| `A.5.20` | Addressing information security | **CORRECT** | ISO/IEC 27002 clause 5.20 carries 19 of the same words in a row against 6 for the best neighbour |
| `A.5.21` | Managing information security | **CORRECT** | ISO/IEC 27002 clause 5.21 carries 10 of the same words in a row |
| `A.5.22` | Monitoring, review and change | **CORRECT** | ISO/IEC 27002 clause 5.22 carries 18 of the same words in a row against 4 for the best neighbour |
| `A.5.23` | Information security for use of | **CORRECT** | ISO/IEC 27002 clause 5.23 carries 22 of the same words in a row |
| `A.5.24` | Information security incident | **CORRECT** | ISO/IEC 27002 clause 5.24 carries 14 of the same words in a row |
| `A.5.25` | Assessment and decision on in | **CORRECT** | ISO/IEC 27002 clause 5.25 carries 19 of the same words in a row against 4 for the best neighbour |
| `A.5.26` | Response to information security | **CORRECT** | ISO/IEC 27002 clause 5.26 carries 13 of the same words in a row against 5 for the best neighbour |
| `A.5.27` | Learning from information se | **CORRECT** | ISO/IEC 27002 clause 5.27 carries 17 of the same words in a row against 5 for the best neighbour |
| `A.5.28` | Collection of evidence | **CORRECT** | ISO/IEC 27002 clause 5.28 carries 21 of the same words in a row against 4 for the best neighbour |
| `A.5.29` | Information security during | **CORRECT** | ISO/IEC 27002 clause 5.29 carries 15 of the same words in a row |
| `A.5.30` | ICT readiness for business con | **CORRECT** | ISO/IEC 27002 clause 5.30 carries 18 of the same words in a row |
| `A.5.31` | Legal, statutory, regulatory and | **CORRECT** | ISO/IEC 27002 clause 5.31 carries 28 of the same words in a row against 6 for the best neighbour |
| `A.5.32` | Intellectual property rights | **CORRECT** | ISO/IEC 27002 clause 5.32 carries 11 of the same words in a row against 11 for the best neighbour |
| `A.5.33` | Protection of records | **CORRECT** | ISO/IEC 27002 clause 5.33 carries 13 of the same words in a row |
| `A.5.34` | Privacy and protection of person | **CORRECT** | ISO/IEC 27002 clause 5.34 carries 26 of the same words in a row |
| `A.5.35` | Independent review of informa | **CORRECT** | ISO/IEC 27002 clause 5.35 carries 28 of the same words in a row |
| `A.5.36` | Compliance with policies, rules | **CORRECT** | ISO/IEC 27002 clause 5.36 carries 9 of the same words in a row |
| `A.5.37` | Documented operating proce | **CORRECT** | ISO/IEC 27002 clause 5.37 carries 17 of the same words in a row |
| `A.6.1` | Screening | **CORRECT** | ISO/IEC 27002 clause 6.1 carries 50 of the same words in a row |
| `A.6.2` | Terms and conditions of em | **CORRECT** | ISO/IEC 27002 clause 6.2 carries 17 of the same words in a row against 4 for the best neighbour |
| `A.6.3` | Information security awareness | **CORRECT** | ISO/IEC 27002 clause 6.3 carries 38 of the same words in a row against 8 for the best neighbour |
| `A.6.4` | Disciplinary process | **CORRECT** | ISO/IEC 27002 clause 6.4 carries 26 of the same words in a row |
| `A.6.5` | Responsibilities after termination | **CORRECT** | ISO/IEC 27002 clause 6.5 carries 27 of the same words in a row |
| `A.6.6` | Confidentiality or non-disclosure | **CORRECT** | ISO/IEC 27002 clause 6.6 carries 30 of the same words in a row |
| `A.6.7` | Remote working | **CORRECT** | ISO/IEC 27002 clause 6.7 carries 22 of the same words in a row |
| `A.6.8` | Information security event re | **CORRECT** | ISO/IEC 27002 clause 6.8 carries 23 of the same words in a row |
| `A.7.1` | Physical security perimeters | **CORRECT** | ISO/IEC 27002 clause 7.1 carries 17 of the same words in a row against 5 for the best neighbour |
| `A.7.2` | Physical entry | **CORRECT** | ISO/IEC 27002 clause 7.2 carries 12 of the same words in a row |
| `A.7.3` | Securing offices, rooms and fa | **CORRECT** | ISO/IEC 27002 clause 7.3 carries 12 of the same words in a row against 4 for the best neighbour |
| `A.7.4` | Physical security monitoring | **CORRECT** | ISO/IEC 27002 clause 7.4 carries 9 of the same words in a row |
| `A.7.5` | Protecting against physical and | **CORRECT** | ISO/IEC 27002 clause 7.5 carries 24 of the same words in a row against 5 for the best neighbour |
| `A.7.6` | Working in secure areas | **CORRECT** | ISO/IEC 27002 clause 7.6 carries 12 of the same words in a row against 5 for the best neighbour |
| `A.7.7` | Clear desk and clear screen | **CORRECT** | ISO/IEC 27002 clause 7.7 carries 23 of the same words in a row |
| `A.7.8` | Equipment siting and protection | **CORRECT** | ISO/IEC 27002 clause 7.8 carries 7 of the same words in a row |
| `A.7.9` | Security of assets off-premises | **MISATTACHED** | ISO/IEC 27002's NEXT (A.7.10) clause matches better (27 words in a row against 7 for its own number) |
| `A.7.10` | Storage media | **CORRECT** | ISO/IEC 27002 clause 7.10 carries 26 of the same words in a row against 4 for the best neighbour |
| `A.7.11` | Supporting utilities | **CORRECT** | ISO/IEC 27002 clause 7.11 carries 18 of the same words in a row against 4 for the best neighbour |
| `A.7.12` | Cabling security | **MISATTACHED** | ISO/IEC 27002's PREVIOUS (A.7.11) clause matches better (18 words in a row against 4 for its own number) |
| `A.7.13` | Equipment maintenance | **CORRECT** | ISO/IEC 27002 clause 7.13 carries 13 of the same words in a row |
| `A.7.14` | Secure disposal or re-use of | **CORRECT** | ISO/IEC 27002 clause 7.14 carries 30 of the same words in a row against 4 for the best neighbour |
| `A.8.1` | User end point devices | **CORRECT** | ISO/IEC 27002 clause 8.1 carries 9 of the same words in a row |
| `A.8.2` | Privileged access rights | **CORRECT** | ISO/IEC 27002 clause 8.2 carries 13 of the same words in a row |
| `A.8.3` | Information access restriction | **CORRECT** | ISO/IEC 27002 clause 8.3 carries 21 of the same words in a row against 6 for the best neighbour |
| `A.8.4` | Access to source code | **CORRECT** | ISO/IEC 27002 clause 8.4 carries 16 of the same words in a row |
| `A.8.5` | Secure authentication | **CORRECT** | ISO/IEC 27002 clause 8.5 carries 21 of the same words in a row |
| `A.8.6` | Capacity management | **CORRECT** | ISO/IEC 27002 clause 8.6 carries 17 of the same words in a row |
| `A.8.7` | Protection against malware | **CORRECT** | ISO/IEC 27002 clause 8.7 carries 12 of the same words in a row |
| `A.8.8` | Management of technical vul | **CORRECT** | ISO/IEC 27002 clause 8.8 carries 28 of the same words in a row |
| `A.8.9` | Configuration management | **CORRECT** | ISO/IEC 27002 clause 8.9 carries 19 of the same words in a row |
| `A.8.10` | Information deletion | **CORRECT** | ISO/IEC 27002 clause 8.10 carries 19 of the same words in a row |
| `A.8.11` | Data masking | **CORRECT** | ISO/IEC 27002 clause 8.11 carries 31 of the same words in a row against 10 for the best neighbour |
| `A.8.12` | - | **MISATTACHED** | ISO/IEC 27002's PREVIOUS (A.8.11) clause matches better (31 words in a row against 4 for its own number) |
| `A.8.13` | Information backup | **CORRECT** | ISO/IEC 27002 clause 8.13 carries 23 of the same words in a row |
| `A.8.14` | Redundancy of information pro | **CORRECT** | ISO/IEC 27002 clause 8.14 carries 13 of the same words in a row |
| `A.8.15` | Logging | **CORRECT** | ISO/IEC 27002 clause 8.15 carries 17 of the same words in a row |
| `A.8.16` | Monitoring activities | **CORRECT** | ISO/IEC 27002 clause 8.16 carries 20 of the same words in a row |
| `A.8.17` | Clock synchronization | **CORRECT** | ISO/IEC 27002 clause 8.17 carries 17 of the same words in a row |
| `A.8.18` | Use of privileged utility programs | **CORRECT** | ISO/IEC 27002 clause 8.18 carries 21 of the same words in a row |
| `A.8.19` | Installation of software on op | **CORRECT** | ISO/IEC 27002 clause 8.19 carries 14 of the same words in a row against 4 for the best neighbour |
| `A.8.20` | Networks security | **CORRECT** | ISO/IEC 27002 clause 8.20 carries 17 of the same words in a row |
| `A.8.21` | Security of network services | **CORRECT** | ISO/IEC 27002 clause 8.21 carries 16 of the same words in a row |
| `A.8.22` | - | **MISATTACHED** | ISO/IEC 27002's PREVIOUS (A.8.21) clause matches better (16 words in a row against 0 for its own number) |
| `A.8.23` | Web filtering | **CORRECT** | ISO/IEC 27002 clause 8.23 carries 13 of the same words in a row |
| `A.8.24` | Use of cryptography | **CORRECT** | ISO/IEC 27002 clause 8.24 carries 16 of the same words in a row |
| `A.8.25` | Secure development life cycle | **CORRECT** | ISO/IEC 27002 clause 8.25 carries 14 of the same words in a row |
| `A.8.26` | Application security require | **CORRECT** | ISO/IEC 27002 clause 8.26 carries 14 of the same words in a row |
| `A.8.27` | Secure system architecture and | **CORRECT** | ISO/IEC 27002 clause 8.27 carries 18 of the same words in a row |
| `A.8.28` | Secure coding | **CORRECT** | ISO/IEC 27002 clause 8.28 carries 9 of the same words in a row against 4 for the best neighbour |
| `A.8.29` | Security testing in development | **CORRECT** | ISO/IEC 27002 clause 8.29 carries 13 of the same words in a row |
| `A.8.30` | Outsourced development | **CORRECT** | ISO/IEC 27002 clause 8.30 carries 14 of the same words in a row |
| `A.8.31` | Separation of development, test | **CORRECT** | ISO/IEC 27002 clause 8.31 carries 10 of the same words in a row |
| `A.8.32` | Change management | **CORRECT** | ISO/IEC 27002 clause 8.32 carries 15 of the same words in a row |
| `A.8.33` | Test information | **CORRECT** | ISO/IEC 27002 clause 8.33 carries 9 of the same words in a row |
| `A.8.34` | Protection of information sys | **CORRECT** | ISO/IEC 27002 clause 8.34 carries 22 of the same words in a row |

**6 control(s) are NOT confirmed: A.5.13, A.5.16, A.7.9, A.7.12, A.8.12, A.8.22.**

---

## `A.5.1` — Policies for information secu

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.1 carries 35 of the same words in a row against 7 for the best neighbour

**Recovered statement, as the library now holds it:**

> rity Information security policy and topic-specific policies shall be defined, approved by management, published, communicated to and acknowledged by relevant personnel and relevant interested parties, and reviewed at planned intervals and if significant changes occur.

| test | result |
|---|---|
| opens with its OWN title (`Policies for information secu`) | 2 of 3 words: policies, information |
| opens with the NEXT control's title (`Information security roles and`) | 2 of 3 words: information, security |
| ISO/IEC 27002 clause `5.1` (SENTENCE match) | "Policies for information security" -- longest shared run 35 words |
| ISO/IEC 27002 clause `5.2` (the neighbour) | "Information security roles and responsibilities" -- longest shared run 7 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Governance_and_Eco- #Confidentiality #Identify #Governance system #Resilience #Integrity #Availability Control Information security policy and topic-specific policies should be defined, approved by management, published, communicated to and acknowledged by relevant personnel a ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 5.1	​Leadership and commitment

                                                                                                                                                 Top management shall demonstrate leadership and commitm
                                                                                                                                                 security management system by:
                                                                                                                                                 a) ensuring the information security policy and the inf

```

---

## `A.5.2` — Information security roles and

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.2 carries 15 of the same words in a row

**Recovered statement, as the library now holds it:**

> responsibilities Information security roles and responsibilities shall be defined and allocated according to the organization needs.

| test | result |
|---|---|
| opens with its OWN title (`Information security roles and`) | 3 of 3 words: information, security, roles |
| opens with the NEXT control's title (`Segregation of duties`) | 0 of 2 words: none |
| ISO/IEC 27002 clause `5.2` (SENTENCE match) | "Information security roles and responsibilities" -- longest shared run 15 words |
| ISO/IEC 27002 clause `5.3` (the neighbour) | "Segregation of duties" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive capabilities security properties concepts #Governance_and_Ecosys- #Governance tem #Protection #Resilience #Confidentiality #Identify #Integrity #Availability Control Information security roles and responsibilities should be defined and allocated according to the organization needs. Purpose To establish a defined, appro ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    5.2  Information security roles and Control

                                                                                                                                                         responsibilities              Information secur

                                                                                                                                                                                       allocated accordi

```

---

## `A.5.3` — Segregation of duties

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.3 carries 10 of the same words in a row

**Recovered statement, as the library now holds it:**

> Conflicting duties and conflicting areas of responsibility shall be segregated.

| test | result |
|---|---|
| opens with its OWN title (`Segregation of duties`) | 1 of 2 words: duties |
| opens with the NEXT control's title (`Management responsibilities`) | 0 of 2 words: none |
| ISO/IEC 27002 clause `5.3` (SENTENCE match) | "Segregation of duties" -- longest shared run 10 words |
| ISO/IEC 27002 clause `5.4` (the neighbour) | "Management responsibilities" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive capabilities security properties concepts #Governance_and_Ecosys- #Governance tem #Confidentiality #Protect #Identity_and_ac- #Integrity cess_management #Availability Control Conflicting duties and conflicting areas of responsibility should be segregated. Purpose To reduce the risk of fraud, error and bypassing of info ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    5.3  Segregation of duties         Control

                                                                                                                                                                                       Conflicting dutie
                                                                                                                                                                                       regated.

                                                                                                                                                    5.4  Management responsibilities Control
```

---

## `A.5.4` — Management responsibilities

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.4 carries 25 of the same words in a row

**Recovered statement, as the library now holds it:**

> Management shall require all personnel to apply information security in accordance with the established information security policy, topic-specific policies and procedures of the organization.

| test | result |
|---|---|
| opens with its OWN title (`Management responsibilities`) | 1 of 2 words: management |
| opens with the NEXT control's title (`Contact with authorities`) | 1 of 3 words: with |
| ISO/IEC 27002 clause `5.4` (SENTENCE match) | "Management responsibilities" -- longest shared run 25 words |
| ISO/IEC 27002 clause `5.5` (the neighbour) | "Contact with authorities" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Governance_and_Ecosys- #Confidentiality #Identify #Governance tem #Integrity #Availability Control Management should require all personnel to apply information security in accordance with the established information security policy, topic-specific policies and procedures of th ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    5.4  Management responsibilities Control

                                                                                                                                                                                       Management shall 
                                                                                                                                                                                       in accordance wit
                                                                                                                                                                                       ic-specific polic

```

---

## `A.5.5` — Contact with authorities

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.5 carries 10 of the same words in a row against 8 for the best neighbour

**Recovered statement, as the library now holds it:**

> The organization shall establish and maintain contact with relevant authorities.

| test | result |
|---|---|
| opens with its OWN title (`Contact with authorities`) | 3 of 3 words: contact, with, authorities |
| opens with the NEXT control's title (`Contact with special interest`) | 2 of 4 words: contact, with |
| ISO/IEC 27002 clause `5.5` (SENTENCE match) | "Contact with authorities" -- longest shared run 10 words |
| ISO/IEC 27002 clause `5.6` (the neighbour) | "Contact with special interest groups" -- longest shared run 8 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains security properties concepts capabilities #Preventive #Defence #Corrective #Confidentiality #Identify #Protect #Governance #Resilience #Integrity #Respond #Recover #Availability Control The organization should establish and maintain contact with relevant authorities. Purpose To ensure appropriate flow of information takes place wi ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    5.5  Contact with authorities      Control

                                                                                                                                                                                       The organization 
                                                                                                                                                                                       authorities.

                                                                                                                                                    5.6  Contact with special interest Control
```

---

## `A.5.6` — Contact with special interest

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.6 carries 19 of the same words in a row against 8 for the best neighbour

**Recovered statement, as the library now holds it:**

> groups The organization shall establish and maintain contact with special interest groups or other specialist security forums and professional associations.

| test | result |
|---|---|
| opens with its OWN title (`Contact with special interest`) | 4 of 4 words: contact, with, special, interest |
| opens with the NEXT control's title (`Threat intelligence`) | 0 of 2 words: none |
| ISO/IEC 27002 clause `5.6` (SENTENCE match) | "Contact with special interest groups" -- longest shared run 19 words |
| ISO/IEC 27002 clause `5.7` (the neighbour) | "Threat intelligence" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains security properties concepts capabilities #Defence #Preventive #Corrective #Confidentiality #Protect #Respond #Governance #Integrity #Recover #Availability Control The organization should establish and maintain contact with special interest groups or other specialist security forums and professional associations. Purpose To ensure ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    5.6  Contact with special interest Control

                                                                                                                                                         groups                        The organization 

                                                                                                                                                                                       interest groups o

```

---

## `A.5.7` — Threat intelligence

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.7 carries 15 of the same words in a row

**Recovered statement, as the library now holds it:**

> Information relating to information security threats shall be collected and analysed to produce threat intelligence.

| test | result |
|---|---|
| opens with its OWN title (`Threat intelligence`) | 1 of 2 words: threat |
| opens with the NEXT control's title (`Information security in project`) | 2 of 3 words: information, security |
| ISO/IEC 27002 clause `5.7` (SENTENCE match) | "Threat intelligence" -- longest shared run 15 words |
| ISO/IEC 27002 clause `5.8` (the neighbour) | "Information security in project management" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains security properties concepts capabilities #Preventive #Detective #Confidentiality #Identify #Detect #Threat_and_vulner- #Defence #Corrective #Integrity #Respond ability_management #Resilience #Availability Control Information relating to information security threats should be collected and analysed to produce threat intelligence. ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    5.7  Threat intelligence           Control

                                                                                                                                                                                       Information relat
                                                                                                                                                                                       and analysed to p

                                                                                                                                                    5.8  Information security in project Control
```

---

## `A.5.8` — Information security in project

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.8 carries 8 of the same words in a row against 4 for the best neighbour

**Recovered statement, as the library now holds it:**

> management Information security shall be integrated into project management.

| test | result |
|---|---|
| opens with its OWN title (`Information security in project`) | 3 of 3 words: information, security, project |
| opens with the NEXT control's title (`Inventory of information and`) | 1 of 2 words: information |
| ISO/IEC 27002 clause `5.8` (SENTENCE match) | "Information security in project management" -- longest shared run 8 words |
| ISO/IEC 27002 clause `5.9` (the neighbour) | "Inventory of information and other associated assets" -- longest shared run 4 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Governance_and_Ecosys- #Confidentiality #Identify #Protect #Governance tem #Protection #Integrity #Availability Control Information security should be integrated into project management. Purpose To ensure information security risks related to projects and deliverables are effe ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    5.8  Information security in project Control

                                                                                                                                                         management                    Information secur

                                                                                                                                                    5.9  Inventory of information and Control

```

---

## `A.5.9` — Inventory of information and

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.9 carries 15 of the same words in a row against 6 for the best neighbour

**Recovered statement, as the library now holds it:**

> other associated assets An inventory of information and other associated assets, including owners, shall be developed and maintained.

| test | result |
|---|---|
| opens with its OWN title (`Inventory of information and`) | 2 of 2 words: inventory, information |
| opens with the NEXT control's title (`Acceptable use of information`) | 1 of 2 words: information |
| ISO/IEC 27002 clause `5.9` (SENTENCE match) | "Inventory of information and other associated assets" -- longest shared run 15 words |
| ISO/IEC 27002 clause `5.10` (the neighbour) | "Acceptable use of information and other associated assets" -- longest shared run 6 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Governance_and_Eco- #Confidentiality #Identify #Asset_manage- system #Protection #Integrity ment #Availability Control An inventory of information and other associated assets, including owners, should be developed and maintained. Purpose To identify the organization’s informat ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    5.9  Inventory of information and Control

                                                                                                                                                         other associated assets       An inventory of i

                                                                                                                                                                                       owners, shall be 

```

---

## `A.5.10` — Acceptable use of information

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.10 carries 20 of the same words in a row against 7 for the best neighbour

**Recovered statement, as the library now holds it:**

> and other associated assets Rules for the acceptable use and procedures for handling information and other associated assets shall be identified, documented and implemented.

| test | result |
|---|---|
| opens with its OWN title (`Acceptable use of information`) | 1 of 2 words: acceptable |
| opens with the NEXT control's title (`Return of assets`) | 1 of 2 words: assets |
| ISO/IEC 27002 clause `5.10` (SENTENCE match) | "Acceptable use of information and other associated assets" -- longest shared run 20 words |
| ISO/IEC 27002 clause `5.11` (the neighbour) | "Return of assets" -- longest shared run 5 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Governance_and_Ecosys- #Confidentiality #Protect #Asset_management tem #Protection #Integrity #Information_pro- #Availability tection Control Rules for the acceptable use and procedures for handling information and other associated assets should be identified, documented and i ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    5.10 Acceptable use of information Control
                                                                                                                                                                and other associated assets Rules for th
                                                                                                                                                                                                        

                                                                                                                                                    5.11 Return of assets              Control

```

---

## `A.5.11` — Return of assets

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.11 carries 27 of the same words in a row

**Recovered statement, as the library now holds it:**

> Personnel and other interested parties as appropriate shall return all the organization’s assets in their possession upon change or termination of their employment, contract or agreement.

| test | result |
|---|---|
| opens with its OWN title (`Return of assets`) | 1 of 2 words: return |
| opens with the NEXT control's title (`Classification of information`) | 0 of 2 words: none |
| ISO/IEC 27002 clause `5.11` (SENTENCE match) | "Return of assets" -- longest shared run 27 words |
| ISO/IEC 27002 clause `5.12` (the neighbour) | "Classification of information" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Protection #Confidentiality #Protect #Asset_manage- #Integrity ment #Availability Control Personnel and other interested parties as appropriate should return all the organization’s assets in their possession upon change or termination of their employment, contract or agreement ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    5.11 Return of assets              Control

                                                                                                                                                                                       Personnel and oth
                                                                                                                                                                                       the organization’
                                                                                                                                                                                       of their employme

```

---

## `A.5.12` — Classification of information

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.12 carries 23 of the same words in a row

**Recovered statement, as the library now holds it:**

> Information shall be classified according to the information security needs of the organization based on confidentiality, integrity, availability and relevant interested party requirements.

| test | result |
|---|---|
| opens with its OWN title (`Classification of information`) | 1 of 2 words: information |
| opens with the NEXT control's title (`Labelling of information`) | 1 of 2 words: information |
| ISO/IEC 27002 clause `5.12` (SENTENCE match) | "Classification of information" -- longest shared run 23 words |
| ISO/IEC 27002 clause `5.13` (the neighbour) | "Labelling of information" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Protection #Confidentiality #Identify #Information_pro- #Defence #Integrity tection #Availability Control Information should be classified according to the information security needs of the organization based on confidentiality, integrity, availability and relevant interested ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 5.12 Classification of information Control

                                                                                                                                                 5.13 Labelling of information         Information shall
                                                                                                                                                                                       needs of the orga
                                                                                                                                                                                       and relevant inte

```

---

## `A.5.13` — Labelling of information

**Verdict: MISATTACHED** — ISO/IEC 27002's PREVIOUS (A.5.12) clause matches better (23 words in a row against 0 for its own number)

**Recovered statement, as the library now holds it:**

> Labelling of information Information shall be classified according to the information security needs of the organization based on confidentiality, integrity, availability and relevant interested party requirements. Control

| test | result |
|---|---|
| opens with its OWN title (`Labelling of information`) | 2 of 2 words: labelling, information |
| opens with the NEXT control's title (`Information transfer`) | 1 of 2 words: information |
| ISO/IEC 27002 clause `5.13` (SENTENCE match) | "Labelling of information" -- longest shared run 0 words |
| ISO/IEC 27002 clause `5.14` (the neighbour) | "Information transfer" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive capabilities security properties concepts #Defence #Information_ #Protection #Confidentiality #Protect protection #Integrity #Availability Control An appropriate set of procedures for information labelling should be developed and implemented in accordance with the information classification scheme adopted by the organi ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 5.13 Labelling of information         Information shall
                                                                                                                                                                                       needs of the orga
                                                                                                                                                                                       and relevant inte

                                                                                                                                                                                       Control

```

---

## `A.5.14` — Information transfer

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.14 carries 26 of the same words in a row

**Recovered statement, as the library now holds it:**

> Information transfer rules, procedures, or agreements shall be in place for all types of transfer facilities within the organization and between the organization and other parties.

| test | result |
|---|---|
| opens with its OWN title (`Information transfer`) | 2 of 2 words: information, transfer |
| opens with the NEXT control's title (`Access control`) | 0 of 2 words: none |
| ISO/IEC 27002 clause `5.14` (SENTENCE match) | "Information transfer" -- longest shared run 26 words |
| ISO/IEC 27002 clause `5.15` (the neighbour) | "Access control" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive capabilities security properties concepts #Confidentiality #Protect #Asset_management #Protection #Integrity #Information_protection #Availability Control Information transfer rules, procedures, or agreements should be in place for all types of transfer facilities within the organization and between the organization an ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 5.14 Information transfer             An appropriate se
                                                                                                                                                                                       developed and imp
                                                                                                                                                                                       sification scheme

                                                                                                                                                                                       Control

```

---

## `A.5.15` — Access control

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.15 carries 25 of the same words in a row against 7 for the best neighbour

**Recovered statement, as the library now holds it:**

> Rules to control physical and logical access to information and other associated assets shall be established and implemented based on business and information security requirements.

| test | result |
|---|---|
| opens with its OWN title (`Access control`) | 2 of 2 words: access, control |
| opens with the NEXT control's title (`Identity management Rules to control physical and logical access to information and other `) | 7 of 9 words: rules, control, physical, logical, access, information, other |
| ISO/IEC 27002 clause `5.15` (SENTENCE match) | "Access control" -- longest shared run 25 words |
| ISO/IEC 27002 clause `5.16` (the neighbour) | "Identity management" -- longest shared run 7 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive capabilities #Protection security properties concepts #Identity_and_ac- #Confidentiality #Protect cess_management #Integrity #Availability Control Rules to control physical and logical access to information and other associated assets should be established and implemented based on business and information security requ ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
(the row's line was not located)
```

---

## `A.5.16` — Identity management Rules to control physical and logical access to information and other 

**Verdict: MISATTACHED** — ISO/IEC 27002's NEXT (A.5.17) clause matches better (18 words in a row against 9 for its own number)

**Recovered statement, as the library now holds it:**

> The full life cycle of identities shall be managed. 5.17 Authentication information Control Allocation and management of authentication information shall be controlled by a management process, including advising personnel on appropriate handling of authentication information.

| test | result |
|---|---|
| opens with its OWN title (`Identity management Rules to control physical and logical access to information and other `) | 0 of 9 words: none |
| opens with the NEXT control's title (`Authentication information`) | 1 of 2 words: authentication |
| ISO/IEC 27002 clause `5.16` (SENTENCE match) | "Identity management" -- longest shared run 9 words |
| ISO/IEC 27002 clause `5.17` (the neighbour) | "Authentication information" -- longest shared run 18 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive capabilities #Protection security properties concepts #Identity_and_ac- #Confidentiality #Protect cess_management #Integrity #Availability Control The full life cycle of identities should be managed. Purpose To allow for the unique identification of individuals and systems accessing the organization’s information and o ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 5.16 Identity management              Rules to control 
                                                                                                                                                                                       associated assets
                                                                                                                                                                                       ness and informat

                                                                                                                                                                                       Control

```

---

## `A.5.17` — Authentication information

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.17 carries 17 of the same words in a row

**Recovered statement, as the library now holds it:**

> Allocation and management of authentication information shall be controlled by a management process, including advising personnel on appropriate handling of authentication information.

| test | result |
|---|---|
| opens with its OWN title (`Authentication information`) | 2 of 2 words: authentication, information |
| opens with the NEXT control's title (`Access rights`) | 0 of 2 words: none |
| ISO/IEC 27002 clause `5.17` (SENTENCE match) | "Authentication information" -- longest shared run 17 words |
| ISO/IEC 27002 clause `5.18` (the neighbour) | "Access rights" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Protection #Confidentiality #Protect #Identity_and_ac- #Integrity cess_management #Availability Control Allocation and management of authentication information should be controlled by a management process, including advising personnel on the appropriate handling of authenticat ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 5.17 Authentication information Control

                                                                                                                                                                                       Allocation and ma
                                                                                                                                                                                       controlled by a m
                                                                                                                                                                                       appropriate handl

```

---

## `A.5.18` — Access rights

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.18 carries 30 of the same words in a row against 6 for the best neighbour

**Recovered statement, as the library now holds it:**

> Access rights to information and other associated assets shall be provisioned, reviewed, modified and removed in accordance with the organization’s topic-specific policy on and rules for access control.

| test | result |
|---|---|
| opens with its OWN title (`Access rights`) | 2 of 2 words: access, rights |
| opens with the NEXT control's title (`Information security in supplier`) | 1 of 3 words: information |
| ISO/IEC 27002 clause `5.18` (SENTENCE match) | "Access rights" -- longest shared run 30 words |
| ISO/IEC 27002 clause `5.19` (the neighbour) | "Information security in supplier relationships" -- longest shared run 6 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Protection #Confidentiality #Protect #Identity_and_ac- #Integrity cess_management #Availability Control Access rights to information and other associated assets should be provisioned, reviewed, modified and removed in accordance with the organization’s topic-specific policy on ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 5.18 Access rights                    Control

                                                                                                                                                                                       Access rights to 
                                                                                                                                                                                       provisioned, revi
                                                                                                                                                                                       organization’s to

```

---

## `A.5.19` — Information security in supplier

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.19 carries 24 of the same words in a row

**Recovered statement, as the library now holds it:**

> relationships Processes and procedures shall be defined and implemented to manage the information security risks associated with the use of supplier’s products or services.

| test | result |
|---|---|
| opens with its OWN title (`Information security in supplier`) | 0 of 3 words: none |
| opens with the NEXT control's title (`Addressing information security`) | 0 of 3 words: none |
| ISO/IEC 27002 clause `5.19` (SENTENCE match) | "Information security in supplier relationships" -- longest shared run 24 words |
| ISO/IEC 27002 clause `5.20` (the neighbour) | "Addressing information security within supplier agreements" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Governance_and_ #Confidentiality #Identify #Supplier_relation- Ecosystem #Protec- #Integrity ships_security tion #Availability Control Processes and procedures should be defined and implemented to manage the information security risks associated with the use of supplier’s prod ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 5.19 Information security in supplier Control

                                                                                                                                                     relationships                     Processes and pro

                                                                                                                                                                                       the information s

```

---

## `A.5.20` — Addressing information security

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.20 carries 19 of the same words in a row against 6 for the best neighbour

**Recovered statement, as the library now holds it:**

> within supplier agreements Relevant information security requirements shall be established and agreed with each supplier based on the type of supplier relationship.

| test | result |
|---|---|
| opens with its OWN title (`Addressing information security`) | 2 of 3 words: information, security |
| opens with the NEXT control's title (`Managing information security`) | 2 of 3 words: information, security |
| ISO/IEC 27002 clause `5.20` (SENTENCE match) | "Addressing information security within supplier agreements" -- longest shared run 19 words |
| ISO/IEC 27002 clause `5.21` (the neighbour) | "Managing information security in the ICT supply chain" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Governance_and_ #Confidentiality #Identify #Supplier_relation- Ecosystem #Protec- #Integrity ships_security tion #Availability Control Relevant information security requirements should be established and agreed with each supplier based on the type of supplier relationship. Pur ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 5.20 Addressing information security Control
                                                                                                                                                             within supplier agreements Relevant informa
                                                                                                                                                                                                       a

                                                                                                                                                 5.21 Managing information security Control

```

---

## `A.5.21` — Managing information security

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.21 carries 10 of the same words in a row

**Recovered statement, as the library now holds it:**

> in the information and commuProcesses and procedures shall be defined and implemented to manage nication technology (ICT) supply the information security risks associated with the ICT products and chain services supply chain.

| test | result |
|---|---|
| opens with its OWN title (`Managing information security`) | 1 of 3 words: information |
| opens with the NEXT control's title (`Monitoring, review and change`) | 0 of 3 words: none |
| ISO/IEC 27002 clause `5.21` (SENTENCE match) | "Managing information security in the ICT supply chain" -- longest shared run 10 words |
| ISO/IEC 27002 clause `5.22` (the neighbour) | "Monitoring, review and change management of supplier services" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Confidentiality #Identify #Supplier_relation- #Governance_and_ #Integrity #Availability ships_security Ecosystem #Protec- tion Control Processes and procedures should be defined and implemented to manage the information security risks associated with the ICT products and servi ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 5.21 Managing information security Control

                                                                                                                                                     in the information and commu-     Processes and pro
                                                                                                                                                     nication technology (ICT) supply  the information s
                                                                                                                                                     chain                             services supply c

```

---

## `A.5.22` — Monitoring, review and change

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.22 carries 18 of the same words in a row against 4 for the best neighbour

**Recovered statement, as the library now holds it:**

> management of supplier services The organization shall regularly monitor, review, evaluate and manage change in supplier information security practices and service delivery.

| test | result |
|---|---|
| opens with its OWN title (`Monitoring, review and change`) | 2 of 3 words: monitoring, review |
| opens with the NEXT control's title (`Information security for use of`) | 0 of 2 words: none |
| ISO/IEC 27002 clause `5.22` (SENTENCE match) | "Monitoring, review and change management of supplier services" -- longest shared run 18 words |
| ISO/IEC 27002 clause `5.23` (the neighbour) | "Information security for use of cloud services" -- longest shared run 4 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Governance_and_ #Confidentiality #Identify #Supplier_relation- Ecosystem #Protec- #Integrity ships_security tion #Availability #Defence #Information_secu- rity_assurance Control The organization should regularly monitor, review, evaluate and manage change in supplier informati ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 5.22 Monitoring, review and change Control
                                                                                                                                                             management of supplier services The organiz
                                                                                                                                                                                                       c

                                                                                                                                                 5.23 Information security for use of Control

```

---

## `A.5.23` — Information security for use of

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.23 carries 22 of the same words in a row

**Recovered statement, as the library now holds it:**

> cloud services Processes for acquisition, use, management and exit from cloud services shall be established in accordance with the organization’s information security requirements.

| test | result |
|---|---|
| opens with its OWN title (`Information security for use of`) | 0 of 2 words: none |
| opens with the NEXT control's title (`Information security incident`) | 0 of 3 words: none |
| ISO/IEC 27002 clause `5.23` (SENTENCE match) | "Information security for use of cloud services" -- longest shared run 22 words |
| ISO/IEC 27002 clause `5.24` (the neighbour) | "Information security incident management planning and preparation" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Governance_and_ #Confidentiality #Protect #Supplier_relation- Ecosystem #Protec- #Integrity ships_security tion #Availability Control Processes for acquisition, use, management and exit from cloud services should be established in accordance with the organization’s information ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 5.23 Information security for use of Control

                                                                                                                                                     cloud services                    Processes for acq

                                                                                                                                                                                       shall be establis

```

---

## `A.5.24` — Information security incident

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.24 carries 14 of the same words in a row

**Recovered statement, as the library now holds it:**

> management planning and prepaThe organization shall plan and prepare for managing information securation rity incidents by defining, establishing and communicating information security incident management processes, roles and responsibilities. 12

| test | result |
|---|---|
| opens with its OWN title (`Information security incident`) | 1 of 3 words: information |
| opens with the NEXT control's title (`Assessment and decision on in`) | 0 of 2 words: none |
| ISO/IEC 27002 clause `5.24` (SENTENCE match) | "Information security incident management planning and preparation" -- longest shared run 14 words |
| ISO/IEC 27002 clause `5.25` (the neighbour) | "Assessment and decision on information security events" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Corrective security properties concepts capabilities #Confidentiality #Respond #Recover #Governance #Defence #Integrity #Availability #Information_securi- ty_event_management Control The organization should plan and prepare for managing information security incidents by defining, establishing and communicating information securit ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 5.24 Information security incident Control

                                                                                                                                                     management planning and prepa-    The organization 
                                                                                                                                                     ration                            rity incidents by

                                                                                                                                                                                       security incident
```

---

## `A.5.25` — Assessment and decision on in

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.25 carries 19 of the same words in a row against 4 for the best neighbour

**Recovered statement, as the library now holds it:**

> formation security events The organization shall assess information security events and decide if they are to be categorized as information security incidents.

| test | result |
|---|---|
| opens with its OWN title (`Assessment and decision on in`) | 0 of 2 words: none |
| opens with the NEXT control's title (`Response to information security`) | 2 of 3 words: information, security |
| ISO/IEC 27002 clause `5.25` (SENTENCE match) | "Assessment and decision on information security events" -- longest shared run 19 words |
| ISO/IEC 27002 clause `5.26` (the neighbour) | "Response to information security incidents" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Detective security properties concepts capabilities #Confidentiality #Detect #Respond #Information_securi- #Defence #Integrity ty_event_management #Availability Control The organization should assess information security events and decide if they are to be categorized as information security incidents. Purpose To ensure effective ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    5.25 Assessment and decision on in- Control

                                                                                                                                                    formation security events          The organization 

                                                                                                                                                                                       they are to be ca

```

---

## `A.5.26` — Response to information security

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.26 carries 13 of the same words in a row against 5 for the best neighbour

**Recovered statement, as the library now holds it:**

> incidents Information security incidents shall be responded to in accordance with the documented procedures.

| test | result |
|---|---|
| opens with its OWN title (`Response to information security`) | 2 of 3 words: information, security |
| opens with the NEXT control's title (`Learning from information se`) | 1 of 3 words: information |
| ISO/IEC 27002 clause `5.26` (SENTENCE match) | "Response to information security incidents" -- longest shared run 13 words |
| ISO/IEC 27002 clause `5.27` (the neighbour) | "Learning from information security incidents" -- longest shared run 5 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Corrective security properties concepts capabilities #Confidentiality #Respond #Recover #Information_securi- #Defence #Integrity ty_event_management #Availability Control Information security incidents should be responded to in accordance with the documented procedures. Purpose To ensure efficient and effective response to inform ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    5.26 Response to information security Control

                                                                                                                                                    incidents                          Information secur

                                                                                                                                                                                       the documented pr

```

---

## `A.5.27` — Learning from information se

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.27 carries 17 of the same words in a row against 5 for the best neighbour

**Recovered statement, as the library now holds it:**

> curity incidents Knowledge gained from information security incidents shall be used to strengthen and improve the information security controls.

| test | result |
|---|---|
| opens with its OWN title (`Learning from information se`) | 2 of 3 words: from, information |
| opens with the NEXT control's title (`Collection of evidence`) | 0 of 2 words: none |
| ISO/IEC 27002 clause `5.27` (SENTENCE match) | "Learning from information security incidents" -- longest shared run 17 words |
| ISO/IEC 27002 clause `5.28` (the neighbour) | "Collection of evidence" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Defence #Confidentiality #Identify #Protect #Information_secu- #Integrity rity_event_manage- #Availability ment Control Knowledge gained from information security incidents should be used to strengthen and improve the information security controls. Purpose To reduce the likeli ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    5.27 Learning from information se- Control

                                                                                                                                                    curity incidents                   Knowledge gained 

                                                                                                                                                                                       strengthen and im

```

---

## `A.5.28` — Collection of evidence

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.28 carries 21 of the same words in a row against 4 for the best neighbour

**Recovered statement, as the library now holds it:**

> The organization shall establish and implement procedures for the identification, collection, acquisition and preservation of evidence related to information security events.

| test | result |
|---|---|
| opens with its OWN title (`Collection of evidence`) | 1 of 2 words: collection |
| opens with the NEXT control's title (`Information security during`) | 0 of 3 words: none |
| ISO/IEC 27002 clause `5.28` (SENTENCE match) | "Collection of evidence" -- longest shared run 21 words |
| ISO/IEC 27002 clause `5.29` (the neighbour) | "Information security during disruption" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Corrective security properties concepts capabilities #Defence #Confidentiality #Detect #Respond #Information_secu- #Integrity rity_event_manage- #Availability ment Control The organization should establish and implement procedures for the identification, collection, acquisition and preservation of evidence related to information ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    5.28 Collection of evidence        Control

SNV / licensed to 14955111 - Schweiz. Vereinigung für Qualitäts- und Management-Systeme (SQS) / S105748 / 2022-10-31_12:56 / ISO/IEC 27001:2022                                        The organization 
                                                                                                                                                                                       tification, colle
                                                                                                                                                                                       to information se

```

---

## `A.5.29` — Information security during

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.29 carries 15 of the same words in a row

**Recovered statement, as the library now holds it:**

> disruption The organization shall plan how to maintain information security at an appropriate level during disruption.

| test | result |
|---|---|
| opens with its OWN title (`Information security during`) | 2 of 3 words: information, security |
| opens with the NEXT control's title (`ICT readiness for business con`) | 0 of 2 words: none |
| ISO/IEC 27002 clause `5.29` (SENTENCE match) | "Information security during disruption" -- longest shared run 15 words |
| ISO/IEC 27002 clause `5.30` (the neighbour) | "ICT readiness for business continuity" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains security properties concepts capabilities #Protection #Preventive #Cor- #Confidentiality #Protect #Respond #Continuity #Resilience rective #Integrity #Availability Control The organization should plan how to maintain information security at an appropriate level during disruption. Purpose To protect information and other associated ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    5.29 Information security during Control

                                                                                                                                                    disruption                         The organization 

                                                                                                                                                                                       appropriate level

```

---

## `A.5.30` — ICT readiness for business con

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.30 carries 18 of the same words in a row

**Recovered statement, as the library now holds it:**

> tinuity ICT readiness shall be planned, implemented, maintained and tested based on business continuity objectives and ICT continuity requirements.

| test | result |
|---|---|
| opens with its OWN title (`ICT readiness for business con`) | 1 of 2 words: readiness |
| opens with the NEXT control's title (`Legal, statutory, regulatory and`) | 0 of 3 words: none |
| ISO/IEC 27002 clause `5.30` (SENTENCE match) | "ICT readiness for business continuity" -- longest shared run 18 words |
| ISO/IEC 27002 clause `5.31` (the neighbour) | "Legal, statutory, regulatory and contractual requirements" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Corrective capabilities #Resilience security properties concepts #Continuity #Availability #Respond Control ICT readiness should be planned, implemented, maintained and tested based on business continuity objectives and ICT continuity requirements. Purpose To ensure the availability of the organization’s information and other ass ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    5.30 ICT readiness for business con- Control

                                                                                                                                                    tinuity                            ICT readiness sha

                                                                                                                                                                                       based on business

```

---

## `A.5.31` — Legal, statutory, regulatory and

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.31 carries 28 of the same words in a row against 6 for the best neighbour

**Recovered statement, as the library now holds it:**

> contractual requirements Legal, statutory, regulatory and contractual requirements relevant to information security and the organization’s approach to meet these requirements shall be identified, documented and kept up to date.

| test | result |
|---|---|
| opens with its OWN title (`Legal, statutory, regulatory and`) | 3 of 3 words: legal, statutory, regulatory |
| opens with the NEXT control's title (`Intellectual property rights`) | 0 of 3 words: none |
| ISO/IEC 27002 clause `5.31` (SENTENCE match) | "Legal, statutory, regulatory and contractual requirements" -- longest shared run 28 words |
| ISO/IEC 27002 clause `5.32` (the neighbour) | "Intellectual property rights" -- longest shared run 6 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Governance_and_ #Confidentiality #Identify #Legal_and_compli- Ecosystem #Protec- #Integrity ance tion #Availability Control Legal, statutory, regulatory and contractual requirements relevant to information security and the organization’s approach to meet these requirements sho ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    5.31 Legal, statutory, regulatory and Control

                                                                                                                                                    contractual requirements           Legal, statutory,

                                                                                                                                                                                       information secur

```

---

## `A.5.32` — Intellectual property rights

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.32 carries 11 of the same words in a row against 11 for the best neighbour

**Recovered statement, as the library now holds it:**

> The organization shall implement appropriate procedures to protect intellectual property rights.

| test | result |
|---|---|
| opens with its OWN title (`Intellectual property rights`) | 3 of 3 words: intellectual, property, rights |
| opens with the NEXT control's title (`Protection of records`) | 0 of 2 words: none |
| ISO/IEC 27002 clause `5.32` (SENTENCE match) | "Intellectual property rights" -- longest shared run 11 words |
| ISO/IEC 27002 clause `5.33` (the neighbour) | "Protection of records" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type #Preventive Information security properties Cybersecurity concepts #Confidentiality #Integrity #Availability #Identify Operational capabilities Security domains #Legal_and_compli- #Governance_and_ ance Ecosystem Control The organization should implement appropriate procedures to protect intellectual property rights. Purpose To ensure compliance with legal, statutory, regulatory and co ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    5.32 Intellectual property rights Control

                                                                                                                                                    5.33 Protection of records         The organization 
                                                                                                                                                                                       intellectual prop

                                                                                                                                                                                       Control
```

---

## `A.5.33` — Protection of records

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.33 carries 13 of the same words in a row

**Recovered statement, as the library now holds it:**

> Records shall be protected from loss, destruction, falsification, unauthorized access and unauthorized release.

| test | result |
|---|---|
| opens with its OWN title (`Protection of records`) | 1 of 2 words: records |
| opens with the NEXT control's title (`Privacy and protection of person`) | 0 of 3 words: none |
| ISO/IEC 27002 clause `5.33` (SENTENCE match) | "Protection of records" -- longest shared run 13 words |
| ISO/IEC 27002 clause `5.34` (the neighbour) | "Privacy and protection of PII" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security do- #Preventive capabilities mains security properties concepts #Confidentiality #Identify #Protect #Legal_and_compliance #Defence #Integrity #Asset_management #Availability #Information_protec- tion Control Records should be protected from loss, destruction, falsification, unauthorized access and unauthorized release. Purpose To ensure c ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    5.33 Protection of records         The organization 
                                                                                                                                                                                       intellectual prop

                                                                                                                                                                                       Control

                                                                                                                                                                                       Records shall be 
```

---

## `A.5.34` — Privacy and protection of person

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.34 carries 26 of the same words in a row

**Recovered statement, as the library now holds it:**

> al identifiable information (PII) The organization shall identify and meet the requirements regarding the preservation of privacy and protection of PII according to applicable laws and regulations and contractual requirements.

| test | result |
|---|---|
| opens with its OWN title (`Privacy and protection of person`) | 0 of 3 words: none |
| opens with the NEXT control's title (`Independent review of informa`) | 0 of 3 words: none |
| ISO/IEC 27002 clause `5.34` (SENTENCE match) | "Privacy and protection of PII" -- longest shared run 26 words |
| ISO/IEC 27002 clause `5.35` (the neighbour) | "Independent review of information security" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security do- #Preventive security properties concepts capabilities mains #Confidentiality #Identify #Protect #Information_protection #Protection #Integrity #Legal_and_compliance #Availability Control The organization should identify and meet the requirements regarding the preservation of privacy and protection of PII according to applicable laws a ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    5.34 Privacy and protection of person- Control
                                                                                                                                                                al identifiable information (PII) The or
                                                                                                                                                                                                        
                                                                                                                                                                                                        

                                                                                                                                                    5.35 Independent review of informa- Control
```

---

## `A.5.35` — Independent review of informa

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.35 carries 28 of the same words in a row

**Recovered statement, as the library now holds it:**

> tion security The organization’s approach to managing information security and its implementation including people, processes and technologies shall be reviewed independently at planned intervals, or when significant changes occur.

| test | result |
|---|---|
| opens with its OWN title (`Independent review of informa`) | 0 of 3 words: none |
| opens with the NEXT control's title (`Compliance with policies, rules`) | 0 of 4 words: none |
| ISO/IEC 27002 clause `5.35` (SENTENCE match) | "Independent review of information security" -- longest shared run 28 words |
| ISO/IEC 27002 clause `5.36` (the neighbour) | "Compliance with policies, rules and standards for information security" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains security properties concepts capabilities #Preventive #Cor- #Governance_and_ rective #Confidentiality #Identify #Protect #Information_secu- Ecosystem #Integrity rity_assurance #Availability Control The organization’s approach to managing information security and its implementation including people, processes and technologies shoul ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    5.35 Independent review of informa- Control

                                                                                                                                                    tion security                      The organization’

                                                                                                                                                                                       its implementatio

```

---

## `A.5.36` — Compliance with policies, rules

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.36 carries 9 of the same words in a row

**Recovered statement, as the library now holds it:**

> and standards for information Compliance with the organization’s information security policy, topsecurity ic-specific policies, rules and standards shall be regularly reviewed.

| test | result |
|---|---|
| opens with its OWN title (`Compliance with policies, rules`) | 2 of 4 words: compliance, with |
| opens with the NEXT control's title (`Documented operating proce`) | 0 of 3 words: none |
| ISO/IEC 27002 clause `5.36` (SENTENCE match) | "Compliance with policies, rules and standards for information security" -- longest shared run 9 words |
| ISO/IEC 27002 clause `5.37` (the neighbour) | "Documented operating procedures" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational capabil- Security domains #Preventive security properties concepts ities #Confidentiality #Identify #Protect #Legal_and_compli- #Governance_and_ #Integrity ance Ecosystem #Availability #Information_securi- ty_assurance Control Compliance with the organization’s information security policy, topic-specific policies, rules and standards should be reg ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    5.36 Compliance with policies, rules Control

                                                                                                                                                    and standards for information      Compliance with t
                                                                                                                                                    security                           ic-specific polic

                                                                                                                                                    5.37 Documented operating proce- Control
```

---

## `A.5.37` — Documented operating proce

**Verdict: CORRECT** — ISO/IEC 27002 clause 5.37 carries 17 of the same words in a row

**Recovered statement, as the library now holds it:**

> dures Operating procedures for information processing facilities shall be documented and made available to personnel who need them. 6 People controls

| test | result |
|---|---|
| opens with its OWN title (`Documented operating proce`) | 2 of 3 words: documented, operating |
| opens with the NEXT control's title (`-`) | next not held |
| ISO/IEC 27002 clause `5.37` (SENTENCE match) | "Documented operating procedures" -- longest shared run 17 words |
| ISO/IEC 27002 clause `5.38` (the neighbour) | not held |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains security properties concepts capabilities #Preventive #Corrective #Confidentiality #Protect #Recover #Asset_management #Governance_and_ #Integrity #Availability #Physical_security Ecosystem #Protec- #System_and_net- tion work_security #Defence #Application_security #Secure_configuration #Identity_and_access_ management #Threat_and ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    5.37 Documented operating proce- Control

                                                                                                                                                    dures                              Operating procedu

                                                                                                                                                                                       documented and ma

```

---

## `A.6.1` — Screening

**Verdict: CORRECT** — ISO/IEC 27002 clause 6.1 carries 50 of the same words in a row

**Recovered statement, as the library now holds it:**

> Background verification checks on all candidates to become personnel shall be carried out prior to joining the organization and on an ongoing basis taking into consideration applicable laws, regulations and ethics and be proportional to the business requirements, the classification of the information to be accessed and the perceived risks.

| test | result |
|---|---|
| opens with its OWN title (`Screening`) | 0 of 1 words: none |
| opens with the NEXT control's title (`Terms and conditions of em`) | 0 of 2 words: none |
| ISO/IEC 27002 clause `6.1` (SENTENCE match) | "Screening" -- longest shared run 50 words |
| ISO/IEC 27002 clause `6.2` (the neighbour) | "Terms and conditions of employment" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Governance_and_ #Confidentiality #Protect #Human_resource_ Ecosystem #Integrity security #Availability Control Background verification checks on all candidates to become personnel should be carried out prior to joining the organization and on an ongoing basis taking into consi ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 6.1  Screening                Control

                                                                                                                                                                               Background verification c
                                                                                                                                                                               shall be carried out prio
                                                                                                                                                                               basis taking into conside
                                                                                                                                                                               and be proportional to th
```

---

## `A.6.2` — Terms and conditions of em

**Verdict: CORRECT** — ISO/IEC 27002 clause 6.2 carries 17 of the same words in a row against 4 for the best neighbour

**Recovered statement, as the library now holds it:**

> ployment The employment contractual agreements shall state the personnel’s and the organization’s responsibilities for information security.

| test | result |
|---|---|
| opens with its OWN title (`Terms and conditions of em`) | 0 of 2 words: none |
| opens with the NEXT control's title (`Information security awareness`) | 0 of 3 words: none |
| ISO/IEC 27002 clause `6.2` (SENTENCE match) | "Terms and conditions of employment" -- longest shared run 17 words |
| ISO/IEC 27002 clause `6.3` (the neighbour) | "Information security awareness, education and training" -- longest shared run 4 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type #Preventive Information security properties Cybersecurity concepts #Confidentiality #Integrity #Availability #Protect Operational capabilities #Human_resource_ security Security domains #Governance_and_ Ecosystem Control The employment contractual agreements should state the personnel’s and the organization’s responsibilities for information security. Purpose To ensure personnel under ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 6.2  Terms and conditions of em- Control

                                                                                                                                                      ployment                 The employment contractua

                                                                                                                                                                               the organization’s respon

```

---

## `A.6.3` — Information security awareness

**Verdict: CORRECT** — ISO/IEC 27002 clause 6.3 carries 38 of the same words in a row against 8 for the best neighbour

**Recovered statement, as the library now holds it:**

> education and training Personnel of the organization and relevant interested parties shall receive appropriate information security awareness, education and training and regular updates of the organization's information security policy, topic-specific policies and procedures, as relevant for their job function.

| test | result |
|---|---|
| opens with its OWN title (`Information security awareness`) | 0 of 3 words: none |
| opens with the NEXT control's title (`Disciplinary process`) | 0 of 2 words: none |
| ISO/IEC 27002 clause `6.3` (SENTENCE match) | "Information security awareness, education and training" -- longest shared run 38 words |
| ISO/IEC 27002 clause `6.4` (the neighbour) | "Disciplinary process" -- longest shared run 8 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Governance_and_ #Confidentiality #Protect #Human_resource_ Ecosystem #Integrity security #Availability Control Personnel of the organization and relevant interested parties should receive appropriate information security awareness, education and training and regular updates of ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 6.3  Information security awareness, Control

                                                                                                                                                      education and training   Personnel of the organiza

SNV / licensed to 14955111 - Schweiz. Vereinigung für Qualitäts- und Management-Systeme (SQS) / S105748 / 2022-10-31_12:56 / ISO/IEC 27001:2022                                appropriate information s

```

---

## `A.6.4` — Disciplinary process

**Verdict: CORRECT** — ISO/IEC 27002 clause 6.4 carries 26 of the same words in a row

**Recovered statement, as the library now holds it:**

> A disciplinary process shall be formalized and communicated to take actions against personnel and other relevant interested parties who have committed an information security policy violation.

| test | result |
|---|---|
| opens with its OWN title (`Disciplinary process`) | 2 of 2 words: disciplinary, process |
| opens with the NEXT control's title (`Responsibilities after termination`) | 0 of 3 words: none |
| ISO/IEC 27002 clause `6.4` (SENTENCE match) | "Disciplinary process" -- longest shared run 26 words |
| ISO/IEC 27002 clause `6.5` (the neighbour) | "Responsibilities after termination or change of employment" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains security properties concepts capabilities #Preventive #Cor- #Governance_and_ rective #Confidentiality #Protect #Respond #Human_resource_ Ecosystem #Integrity security #Availability Control A disciplinary process should be formalized and communicated to take actions against personnel and other relevant interested parties who have c ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 6.4  Disciplinary process     Control

                                                                                                                                                                               A disciplinary process sh
                                                                                                                                                                               actions against personnel
                                                                                                                                                                               have committed an informa

```

---

## `A.6.5` — Responsibilities after termination

**Verdict: CORRECT** — ISO/IEC 27002 clause 6.5 carries 27 of the same words in a row

**Recovered statement, as the library now holds it:**

> or change of employment Information security responsibilities and duties that remain valid after termination or change of employment shall be defined, enforced and communicated to relevant personnel and other interested parties.

| test | result |
|---|---|
| opens with its OWN title (`Responsibilities after termination`) | 1 of 3 words: responsibilities |
| opens with the NEXT control's title (`Confidentiality or non-disclosure`) | 0 of 2 words: none |
| ISO/IEC 27002 clause `6.5` (SENTENCE match) | "Responsibilities after termination or change of employment" -- longest shared run 27 words |
| ISO/IEC 27002 clause `6.6` (the neighbour) | "Confidentiality or non-disclosure agreements" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive capabilities security properties concepts #Confidentiality #Protect #Human_resource_ #Governance_and_ #Integrity #Availability security Ecosystem #Asset_management Control Information security responsibilities and duties that remain valid after termination or change of employment should be defined, enforced and communi ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 6.5  Responsibilities after termination Control

                                                                                                                                                      or change of employment  Information security resp

                                                                                                                                                                               termination or change of 

```

---

## `A.6.6` — Confidentiality or non-disclosure

**Verdict: CORRECT** — ISO/IEC 27002 clause 6.6 carries 30 of the same words in a row

**Recovered statement, as the library now holds it:**

> agreements Confidentiality or non-disclosure agreements reflecting the organization’s needs for the protection of information shall be identified, documented, regularly reviewed and signed by personnel and other relevant interested parties.

| test | result |
|---|---|
| opens with its OWN title (`Confidentiality or non-disclosure`) | 2 of 2 words: confidentiality, disclosure |
| opens with the NEXT control's title (`Remote working`) | 0 of 2 words: none |
| ISO/IEC 27002 clause `6.6` (SENTENCE match) | "Confidentiality or non-disclosure agreements" -- longest shared run 30 words |
| ISO/IEC 27002 clause `6.7` (the neighbour) | "Remote working" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive capabilities security properties concepts #Confidentiality #Protect #Human_resource_security #Governance_and_ #Information_protection Ecosystem #Supplier_relationships Control Confidentiality or non-disclosure agreements reflecting the organization’s needs for the protection of information should be identified, documen ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 6.6  Confidentiality or non-disclosure Control

                                                                                                                                                      agreements               Confidentiality or non-di

                                                                                                                                                                               ization’s needs for the p

```

---

## `A.6.7` — Remote working

**Verdict: CORRECT** — ISO/IEC 27002 clause 6.7 carries 22 of the same words in a row

**Recovered statement, as the library now holds it:**

> Security measures shall be implemented when personnel are working remotely to protect information accessed, processed or stored outside the organization’s premises.

| test | result |
|---|---|
| opens with its OWN title (`Remote working`) | 1 of 2 words: working |
| opens with the NEXT control's title (`Information security event re`) | 1 of 3 words: security |
| ISO/IEC 27002 clause `6.7` (SENTENCE match) | "Remote working" -- longest shared run 22 words |
| ISO/IEC 27002 clause `6.8` (the neighbour) | "Information security event reporting" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive capabilities #Protection security properties concepts #Asset_management #Confidentiality #Protect #Information_protec- #Integrity tion #Availability #Physical_security #System_and_net- work_security Control Security measures should be implemented when personnel are working remotely to protect information accessed, proc ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 6.7  Remote working           Control

                                                                                                                                                                               Security measures shall b
                                                                                                                                                                               remotely to protect infor
                                                                                                                                                                               the organization’s premis

```

---

## `A.6.8` — Information security event re

**Verdict: CORRECT** — ISO/IEC 27002 clause 6.8 carries 23 of the same words in a row

**Recovered statement, as the library now holds it:**

> porting The organization shall provide a mechanism for personnel to report observed or suspected information security events through appropriate channels in a timely manner. 7 Physical controls

| test | result |
|---|---|
| opens with its OWN title (`Information security event re`) | 0 of 3 words: none |
| opens with the NEXT control's title (`-`) | next not held |
| ISO/IEC 27002 clause `6.8` (SENTENCE match) | "Information security event reporting" -- longest shared run 23 words |
| ISO/IEC 27002 clause `6.9` (the neighbour) | not held |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Detective capabilities #Defence security properties concepts #Information_secu- #Confidentiality #Detect rity_event_manage- #Integrity ment #Availability Control The organization should provide a mechanism for personnel to report observed or suspected information security events through appropriate channels in a timely manner. Pu ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 6.8  Information security event re- Control

                                                                                                                                                      porting                  The organization shall pr

                                                                                                                                                                               observed or suspected inf

```

---

## `A.7.1` — Physical security perimeters

**Verdict: CORRECT** — ISO/IEC 27002 clause 7.1 carries 17 of the same words in a row against 5 for the best neighbour

**Recovered statement, as the library now holds it:**

> Physical security perimeters Control 7.2 Physical entry Security perimeters shall be defined and used to protect areas that contain information and other associated assets.

| test | result |
|---|---|
| opens with its OWN title (`Physical security perimeters`) | 3 of 3 words: physical, security, perimeters |
| opens with the NEXT control's title (`Physical entry`) | 2 of 2 words: physical, entry |
| ISO/IEC 27002 clause `7.1` (SENTENCE match) | "Physical security perimeters" -- longest shared run 17 words |
| ISO/IEC 27002 clause `7.2` (the neighbour) | "Physical entry" -- longest shared run 5 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive capabilities #Protection security properties concepts #Physical_security #Confidentiality #Protect #Integrity #Availability Control Security perimeters should be defined and used to protect areas that contain information and other associated assets. Purpose To prevent unauthorized physical access, damage and interferen ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 7.1  Physical security perimeters Control

                                                                                                                                                 7.2  Physical entry           Security perimeters shall
                                                                                                                                                                               contain information and o

                                                                                                                                                                               Control
```

---

## `A.7.2` — Physical entry

**Verdict: CORRECT** — ISO/IEC 27002 clause 7.2 carries 12 of the same words in a row

**Recovered statement, as the library now holds it:**

> Secure areas shall be protected by appropriate entry controls and access points.

| test | result |
|---|---|
| opens with its OWN title (`Physical entry`) | 1 of 2 words: entry |
| opens with the NEXT control's title (`Securing offices, rooms and fa`) | 0 of 3 words: none |
| ISO/IEC 27002 clause `7.2` (SENTENCE match) | "Physical entry" -- longest shared run 12 words |
| ISO/IEC 27002 clause `7.3` (the neighbour) | "Securing offices, rooms and facilities" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive capabilities #Protection security properties concepts #Physical_security #Confidentiality #Protect #Identity_and_Ac- #Integrity cess_Management #Availability Control Secure areas should be protected by appropriate entry controls and access points. Purpose To ensure only authorized physical access to the organization’s ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 7.2  Physical entry           Security perimeters shall
                                                                                                                                                                               contain information and o

                                                                                                                                                                               Control

                                                                                                                                                                               Secure areas shall be pro
```

---

## `A.7.3` — Securing offices, rooms and fa

**Verdict: CORRECT** — ISO/IEC 27002 clause 7.3 carries 12 of the same words in a row against 4 for the best neighbour

**Recovered statement, as the library now holds it:**

> cilities Physical security for offices, rooms and facilities shall be designed and implemented.

| test | result |
|---|---|
| opens with its OWN title (`Securing offices, rooms and fa`) | 2 of 3 words: offices, rooms |
| opens with the NEXT control's title (`Physical security monitoring`) | 2 of 3 words: physical, security |
| ISO/IEC 27002 clause `7.3` (SENTENCE match) | "Securing offices, rooms and facilities" -- longest shared run 12 words |
| ISO/IEC 27002 clause `7.4` (the neighbour) | "Physical security monitoring" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Confidentiality #Protect #Physical_security #Protection #Integrity #Asset_management #Availability Control Physical security for offices, rooms and facilities should be designed and implemented. Purpose To prevent unauthorized physical access, damage and interference to the or ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 7.3  Securing offices, rooms and fa- Control

                                                                                                                                                      cilities                 Physical security for off

                                                                                                                                                                               implemented.

```

---

## `A.7.4` — Physical security monitoring

**Verdict: CORRECT** — ISO/IEC 27002 clause 7.4 carries 9 of the same words in a row

**Recovered statement, as the library now holds it:**

> Premises shall be continuously monitored for unauthorized physical access. 14

| test | result |
|---|---|
| opens with its OWN title (`Physical security monitoring`) | 2 of 3 words: physical, monitoring |
| opens with the NEXT control's title (`Protecting against physical and`) | 1 of 3 words: physical |
| ISO/IEC 27002 clause `7.4` (SENTENCE match) | "Physical security monitoring" -- longest shared run 9 words |
| ISO/IEC 27002 clause `7.5` (the neighbour) | "Protecting against physical and environmental threats" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains security properties concepts capabilities #Preventive #Protection #Detective #Confidentiality #Protect #Detect #Physical_security #Defence #Integrity #Availability Control Premises should be continuously monitored for unauthorized physical access. Purpose To detect and deter unauthorized physical access. Guidance Physical premises ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 7.4  Physical security monitoring Control

                                                                                                                                                                               Premises shall be continu
                                                                                                                                                                               access.

                                                                                                                                                 14                                               ﻿    
```

---

## `A.7.5` — Protecting against physical and

**Verdict: CORRECT** — ISO/IEC 27002 clause 7.5 carries 24 of the same words in a row against 5 for the best neighbour

**Recovered statement, as the library now holds it:**

> environmental threats Protection against physical and environmental threats, such as natural disasters and other intentional or unintentional physical threats to infrastructure shall be designed and implemented.

| test | result |
|---|---|
| opens with its OWN title (`Protecting against physical and`) | 2 of 3 words: against, physical |
| opens with the NEXT control's title (`Working in secure areas`) | 0 of 3 words: none |
| ISO/IEC 27002 clause `7.5` (SENTENCE match) | "Protecting against physical and environmental threats" -- longest shared run 24 words |
| ISO/IEC 27002 clause `7.6` (the neighbour) | "Working in secure areas" -- longest shared run 5 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive capabilities #Protection security properties concepts #Physical_security #Confidentiality #Protect #Integrity #Availability Control Protection against physical and environmental threats, such as natural disasters and other intentional or unintentional physical threats to infrastructure should be designed and implemente ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    7.5  Protecting against physical and Control

                                                                                                                                                         environmental threats         Protection agains

                                                                                                                                                                                       disasters and oth

```

---

## `A.7.6` — Working in secure areas

**Verdict: CORRECT** — ISO/IEC 27002 clause 7.6 carries 12 of the same words in a row against 5 for the best neighbour

**Recovered statement, as the library now holds it:**

> Security measures for working in secure areas shall be designed and implemented.

| test | result |
|---|---|
| opens with its OWN title (`Working in secure areas`) | 3 of 3 words: working, secure, areas |
| opens with the NEXT control's title (`Clear desk and clear screen`) | 0 of 4 words: none |
| ISO/IEC 27002 clause `7.6` (SENTENCE match) | "Working in secure areas" -- longest shared run 12 words |
| ISO/IEC 27002 clause `7.7` (the neighbour) | "Clear desk and clear screen" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive capabilities #Protection security properties concepts #Physical_security #Confidentiality #Protect #Integrity #Availability Control Security measures for working in secure areas should be designed and implemented. Purpose To protect information and other associated assets in secure areas from damage and unauthorized in ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    7.6  Working in secure areas       Control

                                                                                                                                                                                       Security measures
                                                                                                                                                                                       implemented.

                                                                                                                                                    7.7  Clear desk and clear screen Control
```

---

## `A.7.7` — Clear desk and clear screen

**Verdict: CORRECT** — ISO/IEC 27002 clause 7.7 carries 23 of the same words in a row

**Recovered statement, as the library now holds it:**

> Clear desk rules for papers and removable storage media and clear screen rules for information processing facilities shall be defined and appropriately enforced.

| test | result |
|---|---|
| opens with its OWN title (`Clear desk and clear screen`) | 4 of 4 words: clear, desk, clear, screen |
| opens with the NEXT control's title (`Equipment siting and protection`) | 0 of 3 words: none |
| ISO/IEC 27002 clause `7.7` (SENTENCE match) | "Clear desk and clear screen" -- longest shared run 23 words |
| ISO/IEC 27002 clause `7.8` (the neighbour) | "Equipment siting and protection" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Protection #Confidentiality #Protect #Physical_security Control Clear desk rules for papers and removable storage media and clear screen rules for information processing facilities should be defined and appropriately enforced. Purpose To reduce the risks of unauthorized access ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    7.7  Clear desk and clear screen Control

                                                                                                                                                                                       Clear desk rules 
                                                                                                                                                                                       screen rules for 
                                                                                                                                                                                       appropriately enf

```

---

## `A.7.8` — Equipment siting and protection

**Verdict: CORRECT** — ISO/IEC 27002 clause 7.8 carries 7 of the same words in a row

**Recovered statement, as the library now holds it:**

> Equipment shall be sited securely and protected.

| test | result |
|---|---|
| opens with its OWN title (`Equipment siting and protection`) | 2 of 3 words: equipment, siting |
| opens with the NEXT control's title (`Security of assets off-premises`) | 0 of 3 words: none |
| ISO/IEC 27002 clause `7.8` (SENTENCE match) | "Equipment siting and protection" -- longest shared run 7 words |
| ISO/IEC 27002 clause `7.9` (the neighbour) | "Security of assets off-premises" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive capabilities security properties concepts #Confidentiality #Protect #Physical_security #Protection #Integrity #Asset_management #Availability Control Equipment should be sited securely and protected. Purpose To reduce the risks from physical and environmental threats, and from unauthorized access and damage. Guidance T ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    7.8  Equipment siting and protection Control

SNV / licensed to 14955111 - Schweiz. Vereinigung für Qualitäts- und Management-Systeme (SQS) / S105748 / 2022-10-31_12:56 / ISO/IEC 27001:2022                                        Equipment shall b

                                                                                                                                                    7.9  Security of assets off-premises Control

```

---

## `A.7.9` — Security of assets off-premises

**Verdict: MISATTACHED** — ISO/IEC 27002's NEXT (A.7.10) clause matches better (27 words in a row against 7 for its own number)

**Recovered statement, as the library now holds it:**

> Security of assets off-premises Control Off-site assets shall be protected. Control Storage media shall be managed through their life cycle of acquisition, use, transportation and disposal in accordance with the organization’s classification scheme and handling requirements.

| test | result |
|---|---|
| opens with its OWN title (`Security of assets off-premises`) | 3 of 3 words: security, assets, premises |
| opens with the NEXT control's title (`Storage media`) | 0 of 2 words: none |
| ISO/IEC 27002 clause `7.9` (SENTENCE match) | "Security of assets off-premises" -- longest shared run 7 words |
| ISO/IEC 27002 clause `7.10` (the neighbour) | "Storage media" -- longest shared run 27 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive capabilities security properties concepts #Confidentiality #Protect #Physical_security #Protection #Integrity #Asset_management #Availability Control Off-site assets should be protected. Purpose To prevent loss, damage, theft or compromise of off-site devices and interruption to the organization’s operations. Guidance ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    7.9  Security of assets off-premises Control

                                                                                                                                                    7.10 Storage media                 Off-site assets s
                                                                                                                                                                                       Control

                                                                                                                                                                                       Storage media sha
```

---

## `A.7.10` — Storage media

**Verdict: CORRECT** — ISO/IEC 27002 clause 7.10 carries 26 of the same words in a row against 4 for the best neighbour

**Recovered statement, as the library now holds it:**

> Storage media shall be managed through their life cycle of acquisition, use, transportation and disposal in accordance with the organization’s classification scheme and handling requirements.

| test | result |
|---|---|
| opens with its OWN title (`Storage media`) | 2 of 2 words: storage, media |
| opens with the NEXT control's title (`Supporting utilities`) | 0 of 2 words: none |
| ISO/IEC 27002 clause `7.10` (SENTENCE match) | "Storage media" -- longest shared run 26 words |
| ISO/IEC 27002 clause `7.11` (the neighbour) | "Supporting utilities" -- longest shared run 4 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Confidentiality #Protect #Physical_security #Protection #Integrity #Asset_management #Availability Control Storage media should be managed through their life cycle of acquisition, use, transportation and disposal in accordance with the organization’s classification scheme and ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    7.10 Storage media                 Off-site assets s
                                                                                                                                                                                       Control

                                                                                                                                                                                       Storage media sha
                                                                                                                                                                                       use, transportati
                                                                                                                                                                                       classification sc
```

---

## `A.7.11` — Supporting utilities

**Verdict: CORRECT** — ISO/IEC 27002 clause 7.11 carries 18 of the same words in a row against 4 for the best neighbour

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

## `A.7.12` — Cabling security

**Verdict: MISATTACHED** — ISO/IEC 27002's PREVIOUS (A.7.11) clause matches better (18 words in a row against 4 for its own number)

**Recovered statement, as the library now holds it:**

> Cabling security Information processing facilities shall be protected from power failures and other disruptions caused by failures in supporting utilities. Control

| test | result |
|---|---|
| opens with its OWN title (`Cabling security`) | 2 of 2 words: cabling, security |
| opens with the NEXT control's title (`Equipment maintenance`) | 0 of 2 words: none |
| ISO/IEC 27002 clause `7.12` (SENTENCE match) | "Cabling security" -- longest shared run 4 words |
| ISO/IEC 27002 clause `7.13` (the neighbour) | "Equipment maintenance" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Protection #Confidentiality #Protect #Physical_security #Availability Control Cables carrying power, data or supporting information services should be protected from interception, interference or damage. Purpose To prevent loss, damage, theft or compromise of information and o ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    7.12 Cabling security              Information proce
                                                                                                                                                                                       and other disrupt

                                                                                                                                                                                       Control

                                                                                                                                                    7.13 Equipment maintenance         Cables carrying p
```

---

## `A.7.13` — Equipment maintenance

**Verdict: CORRECT** — ISO/IEC 27002 clause 7.13 carries 13 of the same words in a row

**Recovered statement, as the library now holds it:**

> Equipment shall be maintained correctly to ensure availability, integrity and confidentiality of information.

| test | result |
|---|---|
| opens with its OWN title (`Equipment maintenance`) | 1 of 2 words: equipment |
| opens with the NEXT control's title (`Secure disposal or re-use of`) | 0 of 2 words: none |
| ISO/IEC 27002 clause `7.13` (SENTENCE match) | "Equipment maintenance" -- longest shared run 13 words |
| ISO/IEC 27002 clause `7.14` (the neighbour) | "Secure disposal or re-use of equipment" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive capabilities security properties concepts #Protection #Physical_security #Resilience #Confidentiality #Protect #Asset_management #Integrity #Availability Control Equipment should be maintained correctly to ensure availability, integrity and confidentiality of information. Purpose To prevent loss, damage, theft or compr ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    7.13 Equipment maintenance         Cables carrying p
                                                                                                                                                                                       be protected from

                                                                                                                                                                                       Control

                                                                                                                                                                                       Equipment shall b
```

---

## `A.7.14` — Secure disposal or re-use of

**Verdict: CORRECT** — ISO/IEC 27002 clause 7.14 carries 30 of the same words in a row against 4 for the best neighbour

**Recovered statement, as the library now holds it:**

> equipment Items of equipment containing storage media shall be verified to ensure that any sensitive data and licensed software has been removed or securely overwritten prior to disposal or re-use. 8 Technological controls

| test | result |
|---|---|
| opens with its OWN title (`Secure disposal or re-use of`) | 0 of 2 words: none |
| opens with the NEXT control's title (`-`) | next not held |
| ISO/IEC 27002 clause `7.14` (SENTENCE match) | "Secure disposal or re-use of equipment" -- longest shared run 30 words |
| ISO/IEC 27002 clause `7.15` (the neighbour) | not held |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive capabilities #Protection security properties concepts #Physical_security #Confidentiality #Protect #Asset_management Control Items of equipment containing storage media should be verified to ensure that any sensitive data and licensed software has been removed or securely overwritten prior to disposal or re-use. Purpos ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    7.14 Secure disposal or re-use of Control

                                                                                                                                                         equipment                     Items of equipmen

                                                                                                                                                                                       sure that any sen

```

---

## `A.8.1` — User end point devices

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.1 carries 9 of the same words in a row

**Recovered statement, as the library now holds it:**

> 8.2 Privileged access rights Information stored on, processed by or accessible via user end point devices shall be protected.

| test | result |
|---|---|
| opens with its OWN title (`User end point devices`) | 0 of 3 words: none |
| opens with the NEXT control's title (`Privileged access rights`) | 3 of 3 words: privileged, access, rights |
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

## `A.8.2` — Privileged access rights

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.2 carries 13 of the same words in a row

**Recovered statement, as the library now holds it:**

> The allocation and use of privileged access rights shall be restricted and managed.

| test | result |
|---|---|
| opens with its OWN title (`Privileged access rights`) | 3 of 3 words: privileged, access, rights |
| opens with the NEXT control's title (`Information access restriction`) | 1 of 3 words: access |
| ISO/IEC 27002 clause `8.2` (SENTENCE match) | "Privileged access rights" -- longest shared run 13 words |
| ISO/IEC 27002 clause `8.3` (the neighbour) | "Information access restriction" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational capa- Security domains #Preventive security properties concepts bilities #Protection #Confidentiality #Protect #Identity_and_ac- #Integrity cess_management #Availability Control The allocation and use of privileged access rights should be restricted and managed. Purpose To ensure only authorized users, software components and services are provided ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    8.2  Privileged access rights      Information store
                                                                                                                                                                                       devices shall be 

                                                                                                                                                                                       Control

                                                                                                                                                                                       The allocation an
```

---

## `A.8.3` — Information access restriction

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.3 carries 21 of the same words in a row against 6 for the best neighbour

**Recovered statement, as the library now holds it:**

> Access to information and other associated assets shall be restricted in accordance with the established topic-specific policy on access control.

| test | result |
|---|---|
| opens with its OWN title (`Information access restriction`) | 2 of 3 words: information, access |
| opens with the NEXT control's title (`Access to source code`) | 1 of 3 words: access |
| ISO/IEC 27002 clause `8.3` (SENTENCE match) | "Information access restriction" -- longest shared run 21 words |
| ISO/IEC 27002 clause `8.4` (the neighbour) | "Access to source code" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Protection #Confidentiality #Protect #Identity_and_ac- #Integrity cess_management #Availability Control Access to information and other associated assets should be restricted in accordance with the established topic-specific policy on access control. Purpose To ensure only aut ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    8.3  Information access restriction Control

                                                                                                                                                                                       Access to informa
                                                                                                                                                                                       accordance with t

                                                                                                                                                    8.4  Access to source code         Control
```

---

## `A.8.4` — Access to source code

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.4 carries 16 of the same words in a row

**Recovered statement, as the library now holds it:**

> Read and write access to source code, development tools and software libraries shall be appropriately managed.

| test | result |
|---|---|
| opens with its OWN title (`Access to source code`) | 3 of 3 words: access, source, code |
| opens with the NEXT control's title (`Secure authentication`) | 0 of 2 words: none |
| ISO/IEC 27002 clause `8.4` (SENTENCE match) | "Access to source code" -- longest shared run 16 words |
| ISO/IEC 27002 clause `8.5` (the neighbour) | "Secure authentication" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Confidentiality #Protect #Identity_and_access_ #Protection #Integrity management #Availability #Application_security #Secure_configura- tion Control Read and write access to source code, development tools and software libraries should be appropriately managed. Purpose To preve ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    8.4  Access to source code         Control

                                                                                                                                                                                       Read and write ac
                                                                                                                                                                                       libraries shall b

                                                                                                                                                 © ISO/IEC 2022 – All rights reserved             ﻿     
```

---

## `A.8.5` — Secure authentication

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.5 carries 21 of the same words in a row

**Recovered statement, as the library now holds it:**

> 8.6 Capacity management Secure authentication technologies and procedures shall be implemented based on information access restrictions and the topic-specific policy on access control.

| test | result |
|---|---|
| opens with its OWN title (`Secure authentication`) | 2 of 2 words: secure, authentication |
| opens with the NEXT control's title (`Capacity management`) | 2 of 2 words: capacity, management |
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

## `A.8.6` — Capacity management

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.6 carries 17 of the same words in a row

**Recovered statement, as the library now holds it:**

> The use of resources shall be monitored and adjusted in line with current and expected capacity requirements.

| test | result |
|---|---|
| opens with its OWN title (`Capacity management`) | 0 of 2 words: none |
| opens with the NEXT control's title (`Protection against malware`) | 0 of 3 words: none |
| ISO/IEC 27002 clause `8.6` (SENTENCE match) | "Capacity management" -- longest shared run 17 words |
| ISO/IEC 27002 clause `8.7` (the neighbour) | "Protection against malware" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains capabilities #Preventive security properties concepts #Governance_and_ #Detective #Continuity Ecosystem #Protec- #Integrity #Identify #Protect tion #Availability #Detect Control The use of resources should be monitored and adjusted in line with current and expected capacity requirements. Purpose To ensure the required capacity of ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 8.6  Capacity management      Secure authentication tec
                                                                                                                                                                               based on information acce
                                                                                                                                                                               on access control.

                                                                                                                                                                               Control

```

---

## `A.8.7` — Protection against malware

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.7 carries 12 of the same words in a row

**Recovered statement, as the library now holds it:**

> Protection against malware shall be implemented and supported by appropriate user awareness.

| test | result |
|---|---|
| opens with its OWN title (`Protection against malware`) | 3 of 3 words: protection, against, malware |
| opens with the NEXT control's title (`Management of technical vul`) | 0 of 2 words: none |
| ISO/IEC 27002 clause `8.7` (SENTENCE match) | "Protection against malware" -- longest shared run 12 words |
| ISO/IEC 27002 clause `8.8` (the neighbour) | "Management of technical vulnerabilities" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains capabilities #Preventive security properties concepts #Detective #Corrective #Confidentiality #Protect #Detect #System_and_network_ #Protection #Integrity #Availability security #Defence #Information_protec- tion Control Protection against malware should be implemented and supported by appropriate user awareness. Purpose To ensure ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 8.7  Protection against malware Control

                                                                                                                                                                               Protection against malwar
                                                                                                                                                                               appropriate user awarenes

                                                                                                                                                 8.8  Management of technical vul- Control
```

---

## `A.8.8` — Management of technical vul

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.8 carries 28 of the same words in a row

**Recovered statement, as the library now holds it:**

> nerabilities Information about technical vulnerabilities of information systems in use shall be obtained, the organization’s exposure to such vulnerabilities shall be evaluated and appropriate measures shall be taken.

| test | result |
|---|---|
| opens with its OWN title (`Management of technical vul`) | 1 of 2 words: technical |
| opens with the NEXT control's title (`Configuration management`) | 0 of 2 words: none |
| ISO/IEC 27002 clause `8.8` (SENTENCE match) | "Management of technical vulnerabilities" -- longest shared run 28 words |
| ISO/IEC 27002 clause `8.9` (the neighbour) | "Configuration management" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Governance_and_Ecosys- #Confidentiality #Identify #Threat_and_ tem #Integrity #Protect vulnerability_ #Protection #Defence #Availability management Control Information about technical vulnerabilities of information systems in use should be obtained, the organization’s exposure ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 8.8  Management of technical vul- Control

                                                                                                                                                      nerabilities             Information about technic

SNV / licensed to 14955111 - Schweiz. Vereinigung für Qualitäts- und Management-Systeme (SQS) / S105748 / 2022-10-31_12:56 / ISO/IEC 27001:2022                                use shall be obtained, th

```

---

## `A.8.9` — Configuration management

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.9 carries 19 of the same words in a row

**Recovered statement, as the library now holds it:**

> Configuration management Control Configurations, including security configurations, of hardware, software, services and networks shall be established, documented, implemented, monitored and reviewed.

| test | result |
|---|---|
| opens with its OWN title (`Configuration management`) | 2 of 2 words: configuration, management |
| opens with the NEXT control's title (`Information deletion`) | 0 of 2 words: none |
| ISO/IEC 27002 clause `8.9` (SENTENCE match) | "Configuration management" -- longest shared run 19 words |
| ISO/IEC 27002 clause `8.10` (the neighbour) | "Information deletion" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Confidentiality #Protect #Secure_configuration #Protection #Integrity #Availability Control Configurations, including security configurations, of hardware, software, services and networks should be established, documented, implemented, monitored and reviewed. Purpose To ensure ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 8.9  Configuration management Control

                                                                                                                                                 8.10 Information deletion     Configurations, including
                                                                                                                                                                               services and networks sha
                                                                                                                                                                               monitored and reviewed.

```

---

## `A.8.10` — Information deletion

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.10 carries 19 of the same words in a row

**Recovered statement, as the library now holds it:**

> Information stored in information systems, devices or in any other storage media shall be deleted when no longer required.

| test | result |
|---|---|
| opens with its OWN title (`Information deletion`) | 1 of 2 words: information |
| opens with the NEXT control's title (`Data masking`) | 0 of 2 words: none |
| ISO/IEC 27002 clause `8.10` (SENTENCE match) | "Information deletion" -- longest shared run 19 words |
| ISO/IEC 27002 clause `8.11` (the neighbour) | "Data masking" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Protection #Confidentiality #Protect #Information_pro- tection #Legal_and_compli- ance Control Information stored in information systems, devices or in any other storage media should be deleted when no longer required. Purpose To prevent unnecessary exposure of sensitive infor ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 8.10 Information deletion     Configurations, including
                                                                                                                                                                               services and networks sha
                                                                                                                                                                               monitored and reviewed.

                                                                                                                                                                               Control

```

---

## `A.8.11` — Data masking

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.11 carries 31 of the same words in a row against 10 for the best neighbour

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

## `A.8.12` — (no title)

**Verdict: MISATTACHED** — ISO/IEC 27002's PREVIOUS (A.8.11) clause matches better (31 words in a row against 4 for its own number)

**Recovered statement, as the library now holds it:**

> Data leakage prevention Data masking shall be used in accordance with the organization’s topic-specific policy on access control and other related topic-specific policies, and business requirements, taking applicable legislation into consideration. Control

| test | result |
|---|---|
| opens with its OWN title (`-`) | no title |
| opens with the NEXT control's title (`Information backup`) | 0 of 2 words: none |
| ISO/IEC 27002 clause `8.12` (SENTENCE match) | "Data leakage prevention" -- longest shared run 4 words |
| ISO/IEC 27002 clause `8.13` (the neighbour) | "Information backup" -- longest shared run 4 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains security properties concepts capabilities #Preventive #Protection #Detective #Confidentiality #Protect #Detect #Information_pro- #Defence tection Control Data leakage prevention measures should be applied to systems, networks and any other devices that process, store or transmit sensitive information. Purpose To detect and prevent ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 8.12 Data leakage prevention  Data masking shall be use
                                                                                                                                                                               topic-specific policy on 
                                                                                                                                                                               policies, and business re
                                                                                                                                                                               consideration.

                                                                                                                                                                               Control
```

---

## `A.8.13` — Information backup

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.13 carries 23 of the same words in a row

**Recovered statement, as the library now holds it:**

> Backup copies of information, software and systems shall be maintained and regularly tested in accordance with the agreed topic-specific policy on backup.

| test | result |
|---|---|
| opens with its OWN title (`Information backup`) | 2 of 2 words: information, backup |
| opens with the NEXT control's title (`Redundancy of information pro`) | 1 of 2 words: information |
| ISO/IEC 27002 clause `8.13` (SENTENCE match) | "Information backup" -- longest shared run 23 words |
| ISO/IEC 27002 clause `8.14` (the neighbour) | "Redundancy of information processing facilities" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Corrective security properties concepts capabilities #Protection #Integrity #Recover #Continuity #Availability Control Backup copies of information, software and systems should be maintained and regularly tested in accordance with the agreed topic-specific policy on backup. Purpose To enable recovery from loss of data or systems. ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 8.13 Information backup       Data leakage prevention m
                                                                                                                                                                               works and any other devic
                                                                                                                                                                               information.

                                                                                                                                                                               Control

```

---

## `A.8.14` — Redundancy of information pro

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.14 carries 13 of the same words in a row

**Recovered statement, as the library now holds it:**

> cessing facilities Information processing facilities shall be implemented with redundancy sufficient to meet availability requirements.

| test | result |
|---|---|
| opens with its OWN title (`Redundancy of information pro`) | 2 of 2 words: redundancy, information |
| opens with the NEXT control's title (`Logging`) | 0 of 1 words: none |
| ISO/IEC 27002 clause `8.14` (SENTENCE match) | "Redundancy of information processing facilities" -- longest shared run 13 words |
| ISO/IEC 27002 clause `8.15` (the neighbour) | "Logging" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Protection #Availability #Protect #Continuity #Resilience #Asset_management Control Information processing facilities should be implemented with redundancy sufficient to meet availability requirements. Purpose To ensure the continuous operation of information processing facili ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 8.14 Redundancy of information pro- Control

                                                                                                                                                      cessing facilities       Information processing fa

                                                                                                                                                                               sufficient to meet availa

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

## `A.8.16` — Monitoring activities

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.16 carries 20 of the same words in a row

**Recovered statement, as the library now holds it:**

> Networks, systems and applications shall be monitored for anomalous behaviour and appropriate actions taken to evaluate potential information security incidents.

| test | result |
|---|---|
| opens with its OWN title (`Monitoring activities`) | 1 of 2 words: monitoring |
| opens with the NEXT control's title (`Clock synchronization`) | 0 of 2 words: none |
| ISO/IEC 27002 clause `8.16` (SENTENCE match) | "Monitoring activities" -- longest shared run 20 words |
| ISO/IEC 27002 clause `8.17` (the neighbour) | "Clock synchronization" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains security properties concepts capabilities #Detective #Corrective #Confidentiality #Detect #Respond #Information_securi- #Defence ty_event_management #Integrity #Availability Control Networks, systems and applications should be monitored for anomalous behaviour and appropriate actions taken to evaluate potential information securit ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 8.16 Monitoring activities    Logs that record activiti
                                                                                                                                                                               shall be produced, stored

                                                                                                                                                                               Control

                                                                                                                                                                               Networks, systems and app
```

---

## `A.8.17` — Clock synchronization

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.17 carries 17 of the same words in a row

**Recovered statement, as the library now holds it:**

> The clocks of information processing systems used by the organization shall be synchronized to approved time sources. 16

| test | result |
|---|---|
| opens with its OWN title (`Clock synchronization`) | 1 of 2 words: clock |
| opens with the NEXT control's title (`Use of privileged utility programs`) | 0 of 3 words: none |
| ISO/IEC 27002 clause `8.17` (SENTENCE match) | "Clock synchronization" -- longest shared run 17 words |
| ISO/IEC 27002 clause `8.18` (the neighbour) | "Use of privileged utility programs" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Detective security properties concepts capabilities #Integrity #Protect #Detect #Information_securi- #Protection ty_event_management #Defence Control The clocks of information processing systems used by the organization should be synchronized to approved time sources. Purpose To enable the correlation and analysis of security-rel ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 8.17 Clock synchronization    Control

                                                                                                                                                                               The clocks of information
                                                                                                                                                                               shall be synchronized to 

                                                                                                                                                 16                                           ﻿      © 
```

---

## `A.8.18` — Use of privileged utility programs

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.18 carries 21 of the same words in a row

**Recovered statement, as the library now holds it:**

> The use of utility programs that can be capable of overriding system and application controls shall be restricted and tightly controlled.

| test | result |
|---|---|
| opens with its OWN title (`Use of privileged utility programs`) | 2 of 3 words: utility, programs |
| opens with the NEXT control's title (`Installation of software on op`) | 0 of 2 words: none |
| ISO/IEC 27002 clause `8.18` (SENTENCE match) | "Use of privileged utility programs" -- longest shared run 21 words |
| ISO/IEC 27002 clause `8.19` (the neighbour) | "Installation of software on operational systems" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Confidentiality #Protect #System_and_net- #Protection #Integrity work_security #Availability #Secure_configura- tion #Application_security Control The use of utility programs that can be capable of overriding system and application controls should be restricted and tightly con ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    8.18 Use of privileged utility programs Control

                                                                                                                                                                                       The use of utilit
                                                                                                                                                                                       and application c

                                                                                                                                                    8.19 Installation of software on op- Control
```

---

## `A.8.19` — Installation of software on op

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.19 carries 14 of the same words in a row against 4 for the best neighbour

**Recovered statement, as the library now holds it:**

> erational systems Procedures and measures shall be implemented to securely manage software installation on operational systems.

| test | result |
|---|---|
| opens with its OWN title (`Installation of software on op`) | 1 of 2 words: software |
| opens with the NEXT control's title (`Networks security`) | 0 of 2 words: none |
| ISO/IEC 27002 clause `8.19` (SENTENCE match) | "Installation of software on operational systems" -- longest shared run 14 words |
| ISO/IEC 27002 clause `8.20` (the neighbour) | "Networks security" -- longest shared run 4 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security do- #Preventive security properties concepts capabilities mains #Confidentiality #Protect #Secure_configuration #Protection #Integrity #Application_security #Availability Control Procedures and measures should be implemented to securely manage software installation on operational systems. Purpose To ensure the integrity of operational sys ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    8.19 Installation of software on op- Control

                                                                                                                                                    erational systems                  Procedures and me

                                                                                                                                                                                       software installa

```

---

## `A.8.20` — Networks security

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.20 carries 17 of the same words in a row

**Recovered statement, as the library now holds it:**

> Networks and network devices shall be secured, managed and controlled to protect information in systems and applications.

| test | result |
|---|---|
| opens with its OWN title (`Networks security`) | 1 of 2 words: networks |
| opens with the NEXT control's title (`Security of network services`) | 1 of 3 words: network |
| ISO/IEC 27002 clause `8.20` (SENTENCE match) | "Networks security" -- longest shared run 17 words |
| ISO/IEC 27002 clause `8.21` (the neighbour) | "Security of network services" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains capabilities #Protection #Preventive security properties concepts #Detective #System_and_net- #Confidentiality #Protect #Detect work_security #Integrity #Availability Control Networks and network devices should be secured, managed and controlled to protect information in systems and applications. Purpose To protect information in ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    8.20 Networks security             Control

                                                                                                                                                                                       Networks and netw
                                                                                                                                                                                       to protect inform

                                                                                                                                                    8.21 Security of network services Control
```

---

## `A.8.21` — Security of network services

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.21 carries 16 of the same words in a row

**Recovered statement, as the library now holds it:**

> Security mechanisms, service levels and service requirements of network services shall be identified, implemented and monitored.

| test | result |
|---|---|
| opens with its OWN title (`Security of network services`) | 3 of 3 words: security, network, services |
| opens with the NEXT control's title (`-`) | next not held |
| ISO/IEC 27002 clause `8.21` (SENTENCE match) | "Security of network services" -- longest shared run 16 words |
| ISO/IEC 27002 clause `8.22` (the neighbour) | "Segregation of networks" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive capabilities #Protection security properties concepts #System_and_net- #Confidentiality #Protect work_security #Integrity #Availability Control Security mechanisms, service levels and service requirements of network services should be identified, implemented and monitored. Purpose To ensure security in the use of netwo ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    8.21 Security of network services Control

SNV / licensed to 14955111 - Schweiz. Vereinigung für Qualitäts- und Management-Systeme (SQS) / S105748 / 2022-10-31_12:56 / ISO/IEC 27001:2022     8.22 Segregation of networks       Security mechanis
                                                                                                                                                                                       services shall be

                                                                                                                                                                                       Control
```

---

## `A.8.22` — (no title)

**Verdict: MISATTACHED** — ISO/IEC 27002's PREVIOUS (A.8.21) clause matches better (16 words in a row against 0 for its own number)

**Recovered statement, as the library now holds it:**

> Segregation of networks Security mechanisms, service levels and service requirements of network services shall be identified, implemented and monitored. Control

| test | result |
|---|---|
| opens with its OWN title (`-`) | no title |
| opens with the NEXT control's title (`Web filtering`) | 0 of 1 words: none |
| ISO/IEC 27002 clause `8.22` (SENTENCE match) | "Segregation of networks" -- longest shared run 0 words |
| ISO/IEC 27002 clause `8.23` (the neighbour) | "Web filtering" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Protection #Confidentiality #Protect #System_and_net- #Integrity work_security #Availability Control Groups of information services, users and information systems should be segregated in the organization’s networks. Purpose To split the network in security boundaries and to co ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
(the row's line was not located)
```

---

## `A.8.23` — Web filtering

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.23 carries 13 of the same words in a row

**Recovered statement, as the library now holds it:**

> Access to external websites shall be managed to reduce exposure to malicious content.

| test | result |
|---|---|
| opens with its OWN title (`Web filtering`) | 0 of 1 words: none |
| opens with the NEXT control's title (`Use of cryptography`) | 0 of 1 words: none |
| ISO/IEC 27002 clause `8.23` (SENTENCE match) | "Web filtering" -- longest shared run 13 words |
| ISO/IEC 27002 clause `8.24` (the neighbour) | "Use of cryptography" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Protection #Confidentiality #Protect #System_and_net- #Integrity work_security #Availability Control Access to external websites should be managed to reduce exposure to malicious content. Purpose To protect systems from being compromised by malware and to prevent access to una ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    8.23 Web filtering                 Groups of informa
                                                                                                                                                                                       be segregated in 

                                                                                                                                                                                       Control

                                                                                                                                                                                       Access to externa
```

---

## `A.8.24` — Use of cryptography

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.24 carries 16 of the same words in a row

**Recovered statement, as the library now holds it:**

> Rules for the effective use of cryptography, including cryptographic key management, shall be defined and implemented.

| test | result |
|---|---|
| opens with its OWN title (`Use of cryptography`) | 1 of 1 words: cryptography |
| opens with the NEXT control's title (`Secure development life cycle`) | 0 of 4 words: none |
| ISO/IEC 27002 clause `8.24` (SENTENCE match) | "Use of cryptography" -- longest shared run 16 words |
| ISO/IEC 27002 clause `8.25` (the neighbour) | "Secure development life cycle" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security do- #Preventive security properties concepts capabilities mains #Confidentiality #Protect #Secure_configuration #Protection #Integrity #Availability Control Rules for the effective use of cryptography, including cryptographic key management, should be defined and implemented. Purpose To ensure proper and effective use of cryptography to p ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    8.24 Use of cryptography           Control

                                                                                                                                                                                                        
                                                                                                                                                                                                        

                                                                                                                                                    8.25 Secure development life cycle Control
```

---

## `A.8.25` — Secure development life cycle

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.25 carries 14 of the same words in a row

**Recovered statement, as the library now holds it:**

> Rules for the secure development of software and systems shall be established and applied.

| test | result |
|---|---|
| opens with its OWN title (`Secure development life cycle`) | 2 of 4 words: secure, development |
| opens with the NEXT control's title (`Application security require`) | 0 of 3 words: none |
| ISO/IEC 27002 clause `8.25` (SENTENCE match) | "Secure development life cycle" -- longest shared run 14 words |
| ISO/IEC 27002 clause `8.26` (the neighbour) | "Application security requirements" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive capabilities security properties concepts #Confidentiality #Protect #Application_security #Protection #Integrity #System_and_net- #Availability work_security Control Rules for the secure development of software and systems should be established and applied. Purpose To ensure information security is designed and impleme ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    8.25 Secure development life cycle Control

                                                                                                                                                                                       Rules for the sec
                                                                                                                                                                                       established and a

                                                                                                                                                    8.26 Application security require- Control
```

---

## `A.8.26` — Application security require

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.26 carries 14 of the same words in a row

**Recovered statement, as the library now holds it:**

> ments Information security requirements shall be identified, specified and approved when developing or acquiring applications.

| test | result |
|---|---|
| opens with its OWN title (`Application security require`) | 1 of 3 words: security |
| opens with the NEXT control's title (`Secure system architecture and`) | 0 of 3 words: none |
| ISO/IEC 27002 clause `8.26` (SENTENCE match) | "Application security requirements" -- longest shared run 14 words |
| ISO/IEC 27002 clause `8.27` (the neighbour) | "Secure system architecture and engineering principles" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Confidentiality #Protect #Application_security #Protection #Integrity #System_and_net- #Defence #Availability work_security Control Information security requirements should be identified, specified and approved when developing or acquiring applications. Purpose To ensure all i ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    8.26 Application security require- Control

                                                                                                                                                    ments                              Information secur

                                                                                                                                                                                       approved when dev

```

---

## `A.8.27` — Secure system architecture and

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.27 carries 18 of the same words in a row

**Recovered statement, as the library now holds it:**

> engineering principles Principles for engineering secure systems shall be established, documented, maintained and applied to any information system development activities.

| test | result |
|---|---|
| opens with its OWN title (`Secure system architecture and`) | 2 of 3 words: secure, system |
| opens with the NEXT control's title (`Secure coding`) | 1 of 2 words: secure |
| ISO/IEC 27002 clause `8.27` (SENTENCE match) | "Secure system architecture and engineering principles" -- longest shared run 18 words |
| ISO/IEC 27002 clause `8.28` (the neighbour) | "Secure coding" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Confidentiality #Protect #Application_security #Protection #Integrity #System_and_net- #Availability work_security Control Principles for engineering secure systems should be established, documented, maintained and applied to any information system development activities. Purp ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    8.27 Secure system architecture and Control

                                                                                                                                                    engineering principles             Principles for en

                                                                                                                                                                                       mented, maintaine

```

---

## `A.8.28` — Secure coding

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.28 carries 9 of the same words in a row against 4 for the best neighbour

**Recovered statement, as the library now holds it:**

> Secure coding principles shall be applied to software development.

| test | result |
|---|---|
| opens with its OWN title (`Secure coding`) | 2 of 2 words: secure, coding |
| opens with the NEXT control's title (`Security testing in development`) | 1 of 3 words: development |
| ISO/IEC 27002 clause `8.28` (SENTENCE match) | "Secure coding" -- longest shared run 9 words |
| ISO/IEC 27002 clause `8.29` (the neighbour) | "Security testing in development and acceptance" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security do- #Preventive security properties concepts capabilities mains #Confidentiality #Protect #Application_security #Protection #Integrity #System_and_network_ #Availability security Control Secure coding principles should be applied to software development. Purpose To ensure software is written securely thereby reducing the number of potenti ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    8.28 Secure coding                 Control

                                                                                                                                                                                       Secure coding pri

                                                                                                                                                    8.29 Security testing in development Control

```

---

## `A.8.29` — Security testing in development

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.29 carries 13 of the same words in a row

**Recovered statement, as the library now holds it:**

> and acceptance Security testing processes shall be defined and implemented in the development life cycle.

| test | result |
|---|---|
| opens with its OWN title (`Security testing in development`) | 2 of 3 words: security, testing |
| opens with the NEXT control's title (`Outsourced development`) | 0 of 2 words: none |
| ISO/IEC 27002 clause `8.29` (SENTENCE match) | "Security testing in development and acceptance" -- longest shared run 13 words |
| ISO/IEC 27002 clause `8.30` (the neighbour) | "Outsourced development" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Confidentiality #Identify #Application_security #Protection #Integrity #Information_securi- #Availability ty_assurance #System_and_net- work_security Control Security testing processes should be defined and implemented in the development life cycle. Purpose To validate if info ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    8.29 Security testing in development Control

                                                                                                                                                    and acceptance                     Security testing 

                                                                                                                                                                                       development life 

```

---

## `A.8.30` — Outsourced development

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.30 carries 14 of the same words in a row

**Recovered statement, as the library now holds it:**

> The organization shall direct, monitor and review the activities related to outsourced system development.

| test | result |
|---|---|
| opens with its OWN title (`Outsourced development`) | 1 of 2 words: outsourced |
| opens with the NEXT control's title (`Separation of development, test`) | 0 of 3 words: none |
| ISO/IEC 27002 clause `8.30` (SENTENCE match) | "Outsourced development" -- longest shared run 14 words |
| ISO/IEC 27002 clause `8.31` (the neighbour) | "Separation of development, test and production environments" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains security properties concepts capabilities #Preventive #Detective #Confidentiality #Identify #Protect #System_and_network_ #Governance_and_ #Integrity #Availability #Detect security Ecosystem #Application_security #Protection #Supplier_relationships_ security Control The organization should direct, monitor and review the activities ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    8.30 Outsourced development        Control

                                                                                                                                                                                       The organization 
                                                                                                                                                                                       to outsourced sys

                                                                                                                                                    8.31 Separation of development, test Control
```

---

## `A.8.31` — Separation of development, test

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.31 carries 10 of the same words in a row

**Recovered statement, as the library now holds it:**

> and production environments Development, testing and production environments shall be separated and secured.

| test | result |
|---|---|
| opens with its OWN title (`Separation of development, test`) | 2 of 3 words: development, test |
| opens with the NEXT control's title (`Change management`) | 0 of 2 words: none |
| ISO/IEC 27002 clause `8.31` (SENTENCE match) | "Separation of development, test and production environments" -- longest shared run 10 words |
| ISO/IEC 27002 clause `8.32` (the neighbour) | "Change management" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Confidentiality #Protect #Application_security #Protection #Integrity #System_and_net- #Availability work_security Control Development, testing and production environments should be separated and secured. Purpose To protect the production environment and data from compromise b ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    8.31 Separation of development, test Control
                                                                                                                                                                and production environments Development,
                                                                                                                                                                                                        

                                                                                                                                                    8.32 Change management             Control

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

---

## `A.8.33` — Test information

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.33 carries 9 of the same words in a row

**Recovered statement, as the library now holds it:**

> Test information shall be appropriately selected, protected and managed.

| test | result |
|---|---|
| opens with its OWN title (`Test information`) | 2 of 2 words: test, information |
| opens with the NEXT control's title (`Protection of information sys`) | 1 of 2 words: information |
| ISO/IEC 27002 clause `8.33` (SENTENCE match) | "Test information" -- longest shared run 9 words |
| ISO/IEC 27002 clause `8.34` (the neighbour) | "Protection of information systems during audit testing" -- longest shared run 0 words |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Protection #Confidentiality #Protect #Information_protection #Integrity Control Test information should be appropriately selected, protected and managed. Purpose To ensure relevance of testing and protection of operational information used for testing. Guidance Test informatio ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                    8.33 Test information              Changes to inform
                                                                                                                                                                                       shall be subject 

                                                                                                                                                                                       Control

                                                                                                                                                                                       Test information 
```

---

## `A.8.34` — Protection of information sys

**Verdict: CORRECT** — ISO/IEC 27002 clause 8.34 carries 22 of the same words in a row

**Recovered statement, as the library now holds it:**

> tems during audit testing Audit tests and other assurance activities involving assessment of operational systems shall be planned and agreed between the tester and appropriate management.

| test | result |
|---|---|
| opens with its OWN title (`Protection of information sys`) | 0 of 2 words: none |
| opens with the NEXT control's title (`-`) | next not held |
| ISO/IEC 27002 clause `8.34` (SENTENCE match) | "Protection of information systems during audit testing" -- longest shared run 22 words |
| ISO/IEC 27002 clause `8.35` (the neighbour) | not held |

**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):

> Control type Information Cybersecurity Operational Security domains #Preventive security properties concepts capabilities #Confidentiality #Protect #System_and_network_ #Governance_and_ #Integrity #Availability security Ecosystem #Protec- #Information_protection tion Control Audit tests and other assurance activities involving assessment of operational systems should be planned and agreed between ...

**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the
two-column interleaving is visible:

```
                                                                                                                                                 8.34 Protection of information sys- Control

                                                                                                                                                     tems during audit testing  Audit tests and other as

                                                                                                                                                                                erational systems shall 

```

