/**
 * A partner's issuing allowance (migration 389): the on/off switch from 331 and
 * the yearly limit. One reader for every caller, so the console, the API, the
 * batch and the offers all refuse for the same reasons.
 */

// deno-lint-ignore no-explicit-any
type Svc = any;

export interface Allowance {
  /** False while a platform_admin has issuing switched off for this partner. */
  enabled: boolean;
  disabledAt: string | null;
  package: "partner_network" | "custom" | null;
  /** NULL = no limit (no package set, or Certidemy's own issuer). */
  annualCap: number | null;
  windowStart: string;
  windowEnd: string;
  /** Real credentials minted this contract year; specimens excluded. */
  used: number;
  /** Open, unexpired offers: each already holds a slot. */
  reserved: number;
  /** NULL when there is no limit. Never negative. */
  remaining: number | null;
}

type Row = {
  o_status: string;
  o_enabled: boolean;
  o_disabled_at: string | null;
  o_package: Allowance["package"];
  o_annual_cap: number | null;
  o_window_start: string;
  o_window_end: string;
  o_used: number;
  o_reserved: number;
};

/** Throws unless the resolver answered. Its read fails OPEN (331), so no answer means refuse. */
export async function readAllowance(svc: Svc, issuerId: string): Promise<Allowance> {
  const { data, error } = await svc.rpc("issuing_allowance", { p_issuer_id: issuerId });
  if (error) throw new Error(`issuing_allowance: ${error.message}`);
  const row = (Array.isArray(data) ? data[0] : data) as Row | undefined;
  if (!row || (row.o_status !== "ok" && row.o_status !== "no_company")) {
    throw new Error(`issuing_allowance: status ${row?.o_status ?? "no row"}`);
  }
  const cap = row.o_annual_cap;
  return {
    enabled: row.o_enabled === true,
    disabledAt: row.o_disabled_at,
    package: row.o_package,
    annualCap: cap,
    windowStart: row.o_window_start,
    windowEnd: row.o_window_end,
    used: row.o_used,
    reserved: row.o_reserved,
    remaining: cap === null ? null : Math.max(0, cap - row.o_used - row.o_reserved),
  };
}

/** The shape both console surfaces read. snake_case, as every function response is. */
export function allowanceJson(a: Allowance) {
  return {
    enabled: a.enabled,
    disabled_at: a.disabledAt,
    package: a.package,
    annual_cap: a.annualCap,
    window_start: a.windowStart,
    window_end: a.windowEnd,
    used: a.used,
    reserved: a.reserved,
    remaining: a.remaining,
  };
}
