-- ============================================================================
-- 275_notify_partner_lead.sql
--
-- WIRE public.partner_leads TO A NOTIFICATION.
--
-- Migration 229 created partner_leads on 2026-08-04 and connected it to
-- nothing. The public contact form wrote rows, the endpoint returned
-- {ok:true} truthfully, and NOTHING TOLD ANYONE A LEAD HAD ARRIVED.
--
--   FIVE LEADS SAT UNREAD FROM 2026-08-18 UNTIL 2026-09-02.
--
-- Six consecutive handoffs (v7.6 through v8.1) carried the open item
-- "229_partner_leads not wired". This is that wiring.
--
-- The failure was not a bug in any component. submit-partner-lead validates
-- and inserts and is loud on failure -- its insert-error path logs the code
-- and returns 500 on purpose, so a write failure was never silent. There was
-- simply no step after the insert. Nothing to fix; something to build.
--
-- ---------------------------------------------------------------------------
-- THIS WAS THE FIRST EXERCISE OF THE ENTIRE QUEUE-TO-RESEND PATH.
--
-- enqueue_email has existed since migration 243 and HAD NEVER BEEN CALLED BY
-- ANYTHING. email_queue had never held a row. dispatch-emails had run on its
-- one-minute pg_cron since 243 shipped, claiming nothing every minute.
--
-- So RESEND_API_KEY and the sending domain were both unproven -- not suspected
-- broken, simply never exercised. Both are now proven by a real send:
--
--   email_queue id       bf8bc42e-4196-42fd-9e4a-ca41e78c070a
--   template_key         lead.received
--   to_email             info@certidemy.com
--   status               sent
--   attempts             1          (first try, no retry)
--   provider_message_id  dc77af88-563a-4f59-8f6a-990a305f08d8
--   delivery_status      delivered  (via the Resend webhook)
--   last_error           none
--   created_at           2026-09-02 14:04:34.953645+00
--   sent_at              2026-09-02 14:05:00.882132+00
--
-- mail.certidemy.com is verified in Resend and RESEND_API_KEY is set. Recorded
-- because neither could be confirmed from the repository, and an unverified
-- subdomain would have returned 403 -- which dispatch-emails classifies as
-- TERMINAL and walks straight to 'abandoned' after one attempt. That would have
-- been the same silence one layer down.
--
-- ---------------------------------------------------------------------------
-- WHY AFTER INSERT, AND WHY THE EXCEPTION HANDLER. Both are load-bearing.
--
-- enqueue_email RAISES on a malformed address:
--
--   if v_email = '' or v_email not like '%@%' then
--     raise exception 'enqueue_email: invalid address';
--
-- A trigger that let that propagate would ABORT THE LEAD INSERT. The contact
-- form would return 500, the visitor would see a retry, and the lead would be
-- gone -- turning a notification bug into a LOST LEAD. The lead is the thing
-- that matters; the email about it is not.
--
-- So: AFTER INSERT, so the row is already committed to the statement; and the
-- perform is wrapped in its own begin/exception block that downgrades any
-- failure to a warning. If the queue breaks, leads still land.
--
-- The recipient is a hardcoded constant and cannot be malformed today. The
-- handler is not defending against today.
--
-- RETURN NULL is correct for an AFTER trigger -- the return value is ignored.
--
-- dedupe_key is 'lead:' || new.id, so a replayed insert of the same row cannot
-- mail twice. enqueue_email's on-conflict-do-nothing makes the second call a
-- no-op that returns the already-queued id.
--
-- The 'en' argument is the RECIPIENT's locale, not the lead's. This mail always
-- goes to one internal inbox and is always English; the lead's own locale rides
-- in the payload as data about them, and four of the first five leads came in
-- es-419.
--
-- whatsapp_ok is passed as a raw boolean, not coalesced to text. The template
-- tests `p.whatsapp_ok === true`, so the string "true" would silently suppress
-- the badge. jsonb_build_object preserves the type.
--
-- ---------------------------------------------------------------------------
-- THE FUNCTION BODY BELOW IS THE LIVE ONE, WITHOUT ITS COMMENTS.
--
-- The version handed over carried the reasoning above as inline comments. What
-- ran does not, and pg_proc is what this file records -- CLAUDE.md: "When the
-- human edits the SQL before running it, the file records THEIR version. Read
-- the body back from pg_proc.prosrc and md5 it." That is why the reasoning is
-- in this header rather than in the body: a file whose md5 does not match the
-- live function is a record that lies.
--
--   notify_partner_lead   957 bytes   8f98e47517741db2317b3b43935b93b2
--                         SECURITY DEFINER, VOLATILE, search_path=public
--
-- (md5 of prosrc with CRs stripped, as 244/245/249/270 do.)
--
-- ---------------------------------------------------------------------------
-- FORWARD ONLY. NO BACKFILL, AND THE OLD LEADS WILL NEVER BE MAILED.
--
-- Measured 2026-09-02, eight leads exist and exactly ONE has a queue row:
--
--   14:04:34  Wiring test 3     sent
--   14:01:19  Wiring test       no queue row   <- inserted before the trigger
--   13:58:31  Wiring test       no queue row   <- inserted before the trigger
--   00:25:19  Juan Test         no queue row
--   Aug 18 x4                   no queue row
--
-- The trigger went live between 14:01:19 and 14:04:34. The seven rows above it
-- predate it and no backfill was run: enqueueing them now would send seven
-- emails about leads that are two weeks old, and the point of the notification
-- is timeliness. Reading them is a console job, not a mail job -- see the
-- /console/leads gap, which is still open.
--
-- THE THREE "Wiring test" ROWS ARE LEFT IN PLACE ON PURPOSE. They are the
-- evidence that this path works, and the two without queue rows are the
-- evidence of exactly when it started working. Deleting them would remove the
-- only proof that the first end-to-end send happened.
--
-- ---------------------------------------------------------------------------
-- COMPANION CHANGE, IN THE SAME COMMIT: functions/_shared/email-templates.ts
-- gains the lead.received template, and dispatch-emails must be deployed with
-- it. render() previously knew ONE key and threw on anything else, and
-- dispatch-emails treats that throw as TERMINAL. A trigger shipped before the
-- template would have enqueued every lead straight to 'abandoned' -- one
-- attempt, no retry, no email, and the only trace in a last_error column
-- nothing surfaces. Template first, trigger second. That order is not
-- cosmetic.
--
-- MIGRATION REPLAY FROM ZERO HAS NEVER WORKED IN THIS REPOSITORY AND 275 DOES
-- NOT CHANGE THAT; see 268.
-- ============================================================================

begin;

create or replace function public.notify_partner_lead()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  begin
    perform public.enqueue_email(
      'lead.received',
      'info@certidemy.com',
      'en',
      jsonb_build_object(
        'name',           new.name,
        'email',          new.email,
        'organization',   coalesce(new.organization, ''),
        'org_type',       coalesce(new.org_type, ''),
        'message',        coalesce(new.message, ''),
        'source',         new.source,
        'locale',         new.locale,
        'phone_e164',     coalesce(new.phone_e164, ''),
        'whatsapp_ok',    new.whatsapp_ok,
        'country_alpha2', coalesce(new.country_alpha2, ''),
        'created_at',     to_char(new.created_at at time zone 'UTC',
                                  'YYYY-MM-DD"T"HH24:MI:SS"Z"')
      ),
      'lead:' || new.id::text
    );
  exception when others then
    raise warning 'notify_partner_lead: enqueue failed for %: %', new.id, sqlerrm;
  end;
  return null;
end;
$function$;

drop trigger if exists trg_notify_partner_lead on public.partner_leads;
create trigger trg_notify_partner_lead
  after insert on public.partner_leads
  for each row execute function public.notify_partner_lead();

commit;

-- ---------------------------------------------------------------------------
-- Verification, run separately. Property, and both directions.
--
-- select proname, prosecdef, provolatile,
--        coalesce(array_to_string(proconfig,','),'(none)') as cfg,
--        length(prosrc) as len,
--        md5(replace(prosrc, chr(13), '')) as md5
-- from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public' and proname = 'notify_partner_lead';
--
-- Expect 957 / 8f98e47517741db2317b3b43935b93b2 / true / v / search_path=public.
--
-- select tgname, tgenabled from pg_trigger t
-- join pg_class c on c.oid = t.tgrelid
-- where c.relname = 'partner_leads' and not t.tgisinternal;
--
-- Expect exactly ONE row: trg_notify_partner_lead, tgenabled 'O'.
--
-- THE NEGATIVE HALF, which the two checks above do not give. A trigger that
-- fires but enqueues nothing looks identical to one that works, until a lead
-- arrives. Insert a row and assert a queue row appears for it:
--
-- select l.created_at, l.name,
--        case when q.id is null then 'NO QUEUE ROW' else q.status end as queued
-- from public.partner_leads l
-- left join public.email_queue q on q.dedupe_key = 'lead:' || l.id::text
-- order by l.created_at desc limit 3;
--
-- Any lead inserted after 2026-09-02 14:04 with NO QUEUE ROW means the trigger
-- is present and not firing, which is the failure mode this file exists to end.
-- ============================================================================
