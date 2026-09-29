# Re-extraction diff

**17 passage(s) changed**, 0 added, 0 removed,
of 2417 held.

A changed passage must be the same text minus the noise. Both sides are reduced to a NOISE-INVARIANT
form -- letters and digits only -- and compared, because comparing the strings directly cannot answer
the question: removing noise changes the string, which is the point.

| verdict | passages | meaning |
|---|---|---|
| `pure-join` | 7 | only spaces and hyphens moved; safe by construction |
| `text-moved` | 9 | a title prefix or column tail moved; shown for a human |
| **`WORDING`** | **1** | **the letter sequence differs with nothing to account for it -- a FAILURE** |

## `WORDING` -- 1, first 10

### `ISO/IEC 42001|2023|A.6.2`   (the letter sequence differs and nothing accounts for it)

- title BEFORE: "AI system life cycle Objective: To define the criteria and requirements for each stage of "
- title AFTER : "A.6.2.5 AI system deployment 18"
- text BEFORE: "A.6.2.2 AI system requirements and specThe organization shall specify and document requireification ments for new AI systems or material enhancements to existing systems. A.6.2.3 Documentation of AI system design The organization shall document the AI system design and and development development ba"
- text AFTER : "A.6.2.2 AI system requirements and spec- The organization shall specify and document requireification ments for new AI systems or material enhancements to existing systems. A.6.2.3 Documentation of AI system design The organization shall document the AI system design and and development development "

## `text-moved` -- 9, first 10

### `ISO/IEC 42001|2023|A.10.4`   (a span was removed from the statement)

- title BEFORE: "Customers"
- title AFTER : "Customers 20 22 24 26 28 30 32 34 36 38 40 42 44 46 48 50 52"
- text BEFORE: "The organization shall ensure that its responsible approach to the development and use of AI systems considers their customer expectations and needs. 20"
- text AFTER : "The organization shall ensure that its responsible approach to the development and use of AI systems considers their customer expectations and needs."

### `ISO/IEC 27001|2022|A.5.30`   (a span was removed from the statement)

- title BEFORE: "ICT readiness for business con"
- title AFTER : "ICT readiness for business continuity"
- text BEFORE: "tinuity ICT readiness shall be planned, implemented, maintained and tested based on business continuity objectives and ICT continuity requirements."
- text AFTER : "ICT readiness shall be planned, implemented, maintained and tested based on business continuity objectives and ICT continuity requirements."

### `ISO/IEC 27001|2022|A.5.37`   (a span was removed from the statement)

- title BEFORE: "Documented operating proce"
- title AFTER : "Documented operating procedures"
- text BEFORE: "dures Operating procedures for information processing facilities shall be documented and made available to personnel who need them. 6 People controls"
- text AFTER : "Operating procedures for information processing facilities shall be documented and made available to personnel who need them. 6 People controls"

### `ISO/IEC 27001|2022|A.6.2`   (a span was removed from the statement)

- title BEFORE: "Terms and conditions of em"
- title AFTER : "Terms and conditions of employment"
- text BEFORE: "ployment The employment contractual agreements shall state the personnel’s and the organization’s responsibilities for information security."
- text AFTER : "The employment contractual agreements shall state the personnel’s and the organization’s responsibilities for information security."

### `ISO/IEC 27001|2022|A.6.8`   (a span was removed from the statement)

- title BEFORE: "Information security event re"
- title AFTER : "Information security event reporting"
- text BEFORE: "porting The organization shall provide a mechanism for personnel to report observed or suspected information security events through appropriate channels in a timely manner. 7 Physical controls"
- text AFTER : "The organization shall provide a mechanism for personnel to report observed or suspected information security events through appropriate channels in a timely manner. 7 Physical controls"

### `ISO/IEC 27001|2022|A.7.3`   (a span was removed from the statement)

- title BEFORE: "Securing offices, rooms and fa"
- title AFTER : "Securing offices, rooms and facilities"
- text BEFORE: "cilities Physical security for offices, rooms and facilities shall be designed and implemented."
- text AFTER : "Physical security for offices, rooms and facilities shall be designed and implemented."

### `ISO/IEC 27001|2022|A.8.8`   (a span was removed from the statement)

- title BEFORE: "Management of technical vul"
- title AFTER : "Management of technical vulnerabilities"
- text BEFORE: "nerabilities Information about technical vulnerabilities of information systems in use shall be obtained, the organization’s exposure to such vulnerabilities shall be evaluated and appropriate measures shall be taken."
- text AFTER : "Information about technical vulnerabilities of information systems in use shall be obtained, the organization’s exposure to such vulnerabilities shall be evaluated and appropriate measures shall be taken."

### `ISO/IEC 27001|2022|A.8.26`   (a span was removed from the statement)

- title BEFORE: "Application security require"
- title AFTER : "Application security requirements"
- text BEFORE: "ments Information security requirements shall be identified, specified and approved when developing or acquiring applications."
- text AFTER : "Information security requirements shall be identified, specified and approved when developing or acquiring applications."

### `ISO/IEC 27001|2022|A.5.1`   (a span was removed from the statement)

- title BEFORE: "Policies for information secu"
- title AFTER : "Policies for information security"
- text BEFORE: "rity Information security policy and topic-specific policies shall be defined, approved by management, published, communicated to and acknowledged by relevant personnel and relevant interested parties, and reviewed at planned intervals and if significant changes occur."
- text AFTER : "Information security policy and topic-specific policies shall be defined, approved by management, published, communicated to and acknowledged by relevant personnel and relevant interested parties, and reviewed at planned intervals and if significant changes occur."

## `pure-join` -- 7, first 10

### `ISO/IEC 42001|2023|A.2.3`   (only spaces and hyphens moved)

- text BEFORE: "Alignment with other organizaThe organization shall determine where other policies can tional policies be affected by or apply to, the organization’s objectives with respect to AI systems."
- text AFTER : "Alignment with other organiza- The organization shall determine where other policies can tional policies be affected by or apply to, the organization’s objectives with respect to AI systems."

### `ISO/IEC 42001|2023|A.5.4`   (only spaces and hyphens moved)

- text BEFORE: "Assessing AI system impact on inThe organization shall assess and document the potential dividuals or groups of individuals impacts of AI systems to individuals or groups of individuals throughout the system’s life cycle."
- text AFTER : "Assessing AI system impact on in- The organization shall assess and document the potential dividuals or groups of individuals impacts of AI systems to individuals or groups of individuals throughout the system’s life cycle."

### `ISO/IEC 42001|2023|A.6.1`   (only spaces and hyphens moved)

- text BEFORE: "A.6.1.2 Objectives for responsible developThe organization shall identify and document objectives ment of AI system to guide the responsible development AI systems, and take those objectives into account and integrate measures to achieve them in the development life cycle. A.6.1.3 Processes for resp"
- text AFTER : "A.6.1.2 Objectives for responsible develop- The organization shall identify and document objectives ment of AI system to guide the responsible development AI systems, and take those objectives into account and integrate measures to achieve them in the development life cycle. A.6.1.3 Processes for re"

### `ISO/IEC 42001|2023|A.7.2`   (only spaces and hyphens moved)

- text BEFORE: "Data for development and enhanceThe organization shall define, document and implement ment of AI system data management processes related to the development of AI systems."
- text AFTER : "Data for development and enhance- The organization shall define, document and implement ment of AI system data management processes related to the development of AI systems."

### `ISO/IEC 42001|2023|A.8.2`   (only spaces and hyphens moved)

- text BEFORE: "System documentation and inforThe organization shall determine and provide the necesmation for users sary information to users of the AI system."
- text AFTER : "System documentation and infor- The organization shall determine and provide the necesmation for users sary information to users of the AI system."

### `ISO/IEC 27001|2022|A.5.21`   (only spaces and hyphens moved)

- text BEFORE: "in the information and commuProcesses and procedures shall be defined and implemented to manage nication technology (ICT) supply the information security risks associated with the ICT products and chain services supply chain."
- text AFTER : "in the information and commu- Processes and procedures shall be defined and implemented to manage nication technology (ICT) supply the information security risks associated with the ICT products and chain services supply chain."

### `ISO/IEC 27001|2022|A.5.24`   (only spaces and hyphens moved)

- text BEFORE: "management planning and prepaThe organization shall plan and prepare for managing information securation rity incidents by defining, establishing and communicating information security incident management processes, roles and responsibilities. 12"
- text AFTER : "management planning and prepa- The organization shall plan and prepare for managing information securation rity incidents by defining, establishing and communicating information security incident management processes, roles and responsibilities. 12"

