// Transactional email templates.
//
// ============================ WHY THESE LIVE IN GIT ========================
//
// Not in the database. A template ships with the code that populates it and
// gets reviewed like code. A template in a table can be edited by anyone with
// console access, at any time, with no diff and no review -- and what it says
// is a claim made on a partner's behalf.
//
// ============================ THE CLAIMS RULE ==============================
//
// Certidemy hosts credentials for partners. The platform must never assert
// something the issuer did not.
//
// So: the subject names the ISSUER. The body says the ISSUER issued it.
// Certidemy appears exactly twice, both times as infrastructure -- the domain
// where the credential verifies, and a footer line saying the mail was sent on
// the issuer's behalf. Nowhere does it say Certidemy issued, taught, assessed
// or awarded anything.
//
// The fallback direction is asymmetric: wording that is modest for our own
// schemes is reckless when applied to somebody else's.
//
// ============================ RENDERING FROM PAYLOAD ONLY ==================
//
// render() is a pure function of (key, locale, payload). It does not read the
// database. The queue row is a point-in-time snapshot, so editing an
// achievement tomorrow does not retroactively change what an email already
// queued says. That is the OPPOSITE of the credential document, which is read
// live on every request -- deliberately. A credential is a live assertion; a
// notification is a record of what was said at the time.

export type Locale = "en" | "es-419" | "pt-BR";

export interface Rendered {
  subject: string;
  html: string;
  /** Display name for the From header. The issuer's name, not ours. */
  fromName: string;
}

/**
 * Every interpolated value is partner-controlled: achievement titles and
 * issuer names are typed into a console by someone we do not employ. An
 * unescaped apostrophe is a cosmetic bug; an unescaped angle bracket is an
 * injection into a document that lands in someone's inbox.
 */
function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** A display name cannot carry quotes or commas into a From header. */
function safeDisplayName(v: unknown): string {
  return String(v ?? "")
    .replace(/["\\,<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 78);
}

function isLocale(v: string): v is Locale {
  return v === "en" || v === "es-419" || v === "pt-BR";
}

export function normalizeLocale(v: string | null | undefined): Locale {
  const s = String(v ?? "en");
  return isLocale(s) ? s : "en";
}

// ---------------------------------------------------------------- shell

const BRAND = "#9F1239";

function shell(bodyHtml: string, footerHtml: string): string {
  return [
    '<!doctype html><html><body style="margin:0;padding:0;background:#f6f6f7;">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f7;padding:32px 12px;">',
    '<tr><td align="center">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;padding:32px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;color:#18181b;font-size:15px;line-height:1.6;">',
    "<tr><td>",
    bodyHtml,
    "</td></tr>",
    '<tr><td style="padding-top:28px;border-top:1px solid #e4e4e7;margin-top:24px;color:#71717a;font-size:12px;line-height:1.5;">',
    footerHtml,
    "</td></tr>",
    "</table>",
    "</td></tr></table></body></html>",
  ].join("");
}

function button(href: string, label: string): string {
  return [
    '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td ',
    'style="background:', BRAND, ';border-radius:8px;">',
    '<a href="', esc(href), '" ',
    'style="display:inline-block;padding:12px 22px;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">',
    esc(label),
    "</a></td></tr></table>",
  ].join("");
}

// ---------------------------------------------------------------- strings

interface IssuanceStrings {
  subject: (issuer: string, achievement: string) => string;
  heading: string;
  intro: (issuer: string, achievement: string) => string;
  cta: string;
  codeLabel: string;
  shareNote: string;
  footer: (issuer: string) => string;
}

const ISSUANCE: Record<Locale, IssuanceStrings> = {
  en: {
    subject: (issuer, achievement) => `${issuer} issued you a credential: ${achievement}`,
    heading: "Your credential is ready",
    intro: (issuer, achievement) =>
      `${issuer} has issued you a verifiable credential for <strong>${achievement}</strong>.`,
    cta: "View your credential",
    codeLabel: "Credential code",
    shareNote:
      "This link is public. Anyone you share it with — an employer, a recruiter, a registry — can confirm the credential is genuine without contacting you.",
    footer: (issuer) =>
      `Sent by Certidemy on behalf of ${issuer}. Certidemy hosts and verifies this credential; ${issuer} issued it.`,
  },
  "es-419": {
    subject: (issuer, achievement) => `${issuer} te emitió una credencial: ${achievement}`,
    heading: "Tu credencial está lista",
    intro: (issuer, achievement) =>
      `${issuer} te ha emitido una credencial verificable de <strong>${achievement}</strong>.`,
    cta: "Ver tu credencial",
    codeLabel: "Código de la credencial",
    shareNote:
      "Este enlace es público. Cualquier persona con quien lo compartas — un empleador, un reclutador, un registro — puede confirmar que la credencial es auténtica sin necesidad de contactarte.",
    footer: (issuer) =>
      `Enviado por Certidemy en nombre de ${issuer}. Certidemy aloja y verifica esta credencial; ${issuer} la emitió.`,
  },
  "pt-BR": {
    subject: (issuer, achievement) => `${issuer} emitiu uma credencial para você: ${achievement}`,
    heading: "Sua credencial está pronta",
    intro: (issuer, achievement) =>
      `${issuer} emitiu para você uma credencial verificável de <strong>${achievement}</strong>.`,
    cta: "Ver sua credencial",
    codeLabel: "Código da credencial",
    shareNote:
      "Este link é público. Qualquer pessoa com quem você o compartilhar — um empregador, um recrutador, um registro — pode confirmar que a credencial é autêntica sem precisar entrar em contato com você.",
    footer: (issuer) =>
      `Enviado pela Certidemy em nome de ${issuer}. A Certidemy hospeda e verifica esta credencial; ${issuer} a emitiu.`,
  },
};

// ---------------------------------------------------------------- render

function renderIssuance(locale: Locale, p: Record<string, unknown>): Rendered {
  const t = ISSUANCE[locale];

  const issuerRaw = String(p.issuer_name ?? "");
  const achievementRaw = String(p.achievement_name ?? "");
  const code = String(p.credential_code ?? "");
  const verifyUrl = String(p.verify_url ?? "");

  if (!issuerRaw || !achievementRaw || !verifyUrl) {
    throw new Error("issuance.credential: issuer_name, achievement_name and verify_url are required");
  }
  // The link in the mail must point at the verify page and nowhere else. A
  // payload is data, and data that becomes an href is a redirect someone else
  // controls unless it is checked here.
  if (!verifyUrl.startsWith("https://certidemy.com/")) {
    throw new Error("issuance.credential: verify_url must be an https certidemy.com URL");
  }

  const issuer = esc(issuerRaw);
  const achievement = esc(achievementRaw);

  const body = [
    '<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">', esc(t.heading), "</h1>",
    "<p style=\"margin:0;\">", t.intro(issuer, achievement), "</p>",
    button(verifyUrl, t.cta),
    code
      ? `<p style="margin:0;color:#52525b;font-size:13px;">${esc(t.codeLabel)}: <code style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${esc(code)}</code></p>`
      : "",
    '<p style="margin:16px 0 0;color:#52525b;font-size:13px;">', esc(t.shareNote), "</p>",
  ].join("");

  return {
    subject: t.subject(issuerRaw, achievementRaw),
    html: shell(body, esc(t.footer(issuerRaw))),
    fromName: safeDisplayName(issuerRaw) + " via Certidemy",
  };
}

// ---------------------------------------------------------------- lead.received
//
// INTERNAL MAIL. This one goes from us to us -- to info@certidemy.com, when a
// public contact form writes a row to partner_leads.
//
// THREE DELIBERATE DEPARTURES FROM issuance.credential, none of them oversights:
//
// 1. NO LOCALE. The issuance template is Record<Locale, ...> because its
//    recipient is a learner anywhere. This recipient is always the same inbox,
//    read in English. Three translations of a string one person reads would be
//    three things to keep in step for no reader. The LEAD's own locale is in
//    the payload as data ABOUT them, which is worth seeing -- four of the first
//    five leads came in es-419.
//
// 2. NOTHING IS REQUIRED BEYOND name AND email. renderIssuance throws when its
//    fields are missing, and dispatch-emails classifies that throw as TERMINAL
//    and walks the row straight to 'abandoned' -- one attempt, no retry. For a
//    lead notification that trade is backwards: a lead with a blank
//    organization is still a lead, and an email nobody receives because a field
//    was empty is precisely the silence this template was written to end.
//    name and email are NOT NULL on partner_leads, so they cannot be absent.
//
// 3. NO LINK, AND THEREFORE NO URL VALIDATION. renderIssuance must check that
//    verify_url points at certidemy.com, because a payload that becomes an href
//    is a redirect someone else controls. This template contains no anchor at
//    all except a mailto: built from the lead's own address, so that class of
//    bug cannot arise. There is also nowhere useful to link until a
//    /console/leads screen exists.
//
// THE CLAIMS RULE DOES NOT BIND THE SAME WAY HERE. issuance.credential names
// the ISSUER in its subject and From header because Certidemy must never assert
// what a partner did not. There is no third party in this mail, so fromName is
// a flat "Certidemy".
//
// EVERY INTERPOLATED VALUE IS ATTACKER-INFLUENCED. name, organization and
// message arrive from a public, unauthenticated form. esc() covers HTML
// injection into the body. It does NOT strip CR/LF, and `name` reaches the
// SUBJECT line -- where a newline is header injection, not a cosmetic bug.
// submit-partner-lead's clean() caps length and does not strip newlines, so
// this template strips them itself rather than trusting the caller.

/** Subject lines are headers. A newline in one is an injection point. */
function headerSafe(v: unknown): string {
  return String(v ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

/** One row of the lead table. Omitted entirely when the value is empty. */
function leadRow(label: string, valueHtml: string): string {
  if (!valueHtml) return "";
  return [
    '<tr><td style="padding:6px 16px 6px 0;color:#71717a;font-size:13px;white-space:nowrap;vertical-align:top;">',
    esc(label),
    '</td><td style="padding:6px 0;font-size:14px;vertical-align:top;">',
    valueHtml,
    "</td></tr>",
  ].join("");
}

function renderLeadReceived(p: Record<string, unknown>): Rendered {
  const name = String(p.name ?? "").trim();
  const email = String(p.email ?? "").trim();

  // The only two that are NOT NULL in partner_leads. If these are missing the
  // payload did not come from that table and rendering anything would be a
  // guess.
  if (!name || !email) {
    throw new Error("lead.received: name and email are required");
  }

  const organization = String(p.organization ?? "").trim();
  const orgType = String(p.org_type ?? "").trim();
  const message = String(p.message ?? "").trim();
  const source = String(p.source ?? "").trim();
  const leadLocale = String(p.locale ?? "").trim();
  const createdAt = String(p.created_at ?? "").trim();
  const phone = String(p.phone_e164 ?? "").trim();
  const country = String(p.country_alpha2 ?? "").trim();
  const whatsappOk = p.whatsapp_ok === true;

  // WhatsApp is meaningless without a number, and whatsapp_ok is already false
  // whenever phone_e164 is null (submit-partner-lead sets it that way). Shown
  // as a badge beside the phone rather than as a row of its own.
  const phoneCell = phone
    ? esc(phone) +
      (whatsappOk
        ? ' <span style="display:inline-block;margin-left:6px;padding:1px 7px;border-radius:10px;background:#dcfce7;color:#166534;font-size:12px;font-weight:600;">WhatsApp OK</span>'
        : "")
    : "";

  const rows = [
    leadRow("Name", esc(name)),
    leadRow("Email", `<a href="mailto:${esc(email)}" style="color:${BRAND};">${esc(email)}</a>`),
    leadRow("Phone", phoneCell),
    leadRow("Country", esc(country)),
    leadRow("Organization", esc(organization)),
    leadRow("Type", esc(orgType)),
    leadRow("Source", esc(source)),
    leadRow("Lead locale", esc(leadLocale)),
    leadRow("Received", esc(createdAt)),
  ].join("");

  const messageHtml = message
    ? `<div style="margin:20px 0 0;padding:14px 16px;background:#f4f4f5;border-left:3px solid ${BRAND};border-radius:4px;white-space:pre-wrap;font-size:14px;">${esc(message).replace(/\n/g, "<br>")}</div>`
    : '<p style="margin:20px 0 0;color:#a1a1aa;font-size:13px;">(no message)</p>';

  const body = [
    '<h1 style="margin:0 0 18px;font-size:20px;line-height:1.3;">New partner lead</h1>',
    '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">',
    rows,
    "</table>",
    messageHtml,
  ].join("");

  const who = headerSafe(name);
  const org = headerSafe(organization);

  return {
    subject: org ? `New partner lead: ${who} (${org})` : `New partner lead: ${who}`,
    html: shell(body, "Sent by Certidemy because a contact form was submitted on certidemy.com."),
    fromName: "Certidemy",
  };
}

export function render(
  templateKey: string,
  locale: Locale,
  payload: Record<string, unknown>,
): Rendered {
  switch (templateKey) {
    case "issuance.credential":
      return renderIssuance(locale, payload);
    case "lead.received":
      // Locale is deliberately ignored: this mail always goes to one internal
      // inbox and is always English. See the note above renderLeadReceived.
      return renderLeadReceived(payload);
    default:
      throw new Error(`unknown template_key: ${templateKey}`);
  }
}
