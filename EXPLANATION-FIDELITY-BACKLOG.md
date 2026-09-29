# AIMS-F: explanation-fidelity backlog

**Not a retirement, and not a verdict on any item.** Ruled 2026-09-29 from the director's read of 20
survivors: all 20 have correct keys; these five carry minor explanation softness.

## Why it has no serving consequence today

Migration `378_revoke_explanation_and_practice_rpc.sql` revokes `quiz_questions.explanation` from
`anon` and `authenticated`, and records the measurement behind it:

> every secure item carries `visibility='secure'` which no read policy matches -- so the KEY is
> unreachable and so is every secure row

So these explanations are text no candidate can read. Checked rather than assumed, and the visibility
of each row is printed below for the same reason.

**The event that turns this from debt into exposure is a PROMOTION to practice**, where explanations
ARE served to a learner. Anything moving a secure item to the practice pool should clear this list
first -- which is why it is written down instead of remembered.

## The five

### `17b73169`   task 2.4   pool `secure`, visibility `secure`, status `approved`

*task:* Assign roles, responsibilities and authorities for AI

**Q** ISO/IEC 42001 requires top management to assign authority for two distinct AIMS functions. Which two functions are these?

**key** Ensuring the AIMS conforms to the requirements of the standard and reporting on AIMS performance to top management.

*explanation, verbatim:* ISO/IEC 42001 explicitly requires top management to assign authority for ensuring the AIMS conforms to the standard and for reporting AIMS performance to top management — two distinct, separately assignable functions. Conducting internal audits is governed by ISO 19011 practice, not these specific clauses. Managing supplier relationships and overseeing impact assessments are operational responsibilities, not the two authorities the standard singles out. Setting risk appetite and authorising deployments are governance practices not identified as the two required assigned authorities.

### `89837081`   task 2.6   pool `secure`, visibility `secure`, status `approved`

*task:* Apply the AI system impact assessment

**Q** An organization must document the results of its AI system impact assessment. Which approach conforms to ISO/IEC 42001?

**key** Produce documented results that capture identified impacts, evaluations, and how they are addressed, using a format suited to the organization's context.

*explanation, verbatim:* ISO/IEC 42001 requires that results of the AI system impact assessment be documented and, where appropriate, made available to relevant interested parties, but it does not prescribe a fixed template. Organizations choose a format appropriate to their context. A DPIA is not equivalent to an AI system impact assessment, and the standard does not exempt lower-risk findings from documentation.

### `703c8787`   task 3.4   pool `secure`, visibility `secure`, status `approved`

*task:* Explain operational planning and control

**Q** A company retrains a deployed AI system on updated demographic data without changing the model architecture. Under ISO/IEC 42001 change control, how is this best classified?

**key** A planned change requiring the organization to review consequences and control it under AIMS operational planning obligations.

*explanation, verbatim:* ISO/IEC 42001 requires the organization to control planned changes and review consequences of any change relevant to the AIMS. This explicitly includes changes to training data and deployment context, not only model architecture. Risk-tier carve-outs and blanket reliance on generic IT procedures are not supported by the standard.

### `bc001137`   task 2.5   pool `secure`, visibility `secure`, status `approved`

*task:* Apply the AI risk assessment process

**Q** An organization uses an ISO 31000-based risk identification process. When applying it to a new generative AI system, what additional step does ISO/IEC 42001 require?

**key** Supplement the generic process with AI-focused techniques to surface risks such as emergent behaviour, model drift, and unintended use.

*explanation, verbatim:* A generic ISO 31000 approach does not automatically surface AI-specific risks such as emergent behaviour, model drift, bias amplification, or misuse scenarios. ISO/IEC 42001 requires identification of risks specific to AI systems and their impact on individuals and societies, so AI-focused elicitation must supplement any general risk method. The standard does not require abandoning ISO 31000, only ensuring AI-specific considerations are addressed.

### `5bba26f8`   task 4.7   pool `secure`, visibility `secure`, status `approved`

*task:* Analyze overlap between ISO/IEC 42001 and ISO/IEC 27001 controls

**Q** Annex D.2 of ISO/IEC 42001 states an organization may implement controls that partly relate to information security through an existing ISO/IEC 27001 implementation. What does this imply for the ISO/IEC 42001 Statement of Applicability?

**key** Each 42001 control must still be assessed for its AI-specific intent, even where a 27001 control partially addresses the same risk.

*explanation, verbatim:* Annex D.2 permits leveraging existing 27001 controls where they genuinely overlap, but 'partly relates' signals that the overlap is partial, not total. The AIMS SoA must still confirm that each 42001 control's AI-specific intent is addressed. A shared control satisfies only the portion of the 42001 obligation that genuinely coincides with the 27001 control. Treating any shared control as fully addressed without that analysis is the false-equivalence error Annex D.2 is designed to prevent.

## Assertion

All five must be secure and non-served for the reasoning above to hold. Measured: all five are `secure`/`secure`, so none is served.

