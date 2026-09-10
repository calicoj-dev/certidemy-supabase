-- 285: D3's knowledge lines, before module 3 is authored
--
-- Seven corrections to SM-AI-II domain D3, found by the pre-authoring recon
-- that caught three in D2. Every defect that reached module 1's lessons was in
-- the tasks first, which is why this runs before a word of module 3 exists.
--
-- FIVE TASKS (3.2, 3.3, 3.5, 3.7, 3.8) and SIX CONCEPTS change. Three tasks
-- and eighteen concepts must not. Both halves are asserted at the bottom.
--
-- NO SCHEMA CHANGE, so the NOT NULL writer-list discipline does not apply.
-- NO bloom_level is touched, so v_cognitive_profile does not move and
-- exam_blueprint needs no re-derivation. 283 existed only to re-derive that
-- profile after the 1.2 rewrite; nothing here repeats it.
--
-- NONE OF THE ELEVEN NEW STRINGS CONTAINS AN APOSTROPHE. Written that way on
-- purpose: it removes the escaping hazard entirely, and a mangled literal that
-- pastes cleanly is the failure this repo keeps paying for.
--
-- WHAT WAS WRONG, verified against the 2020 Scrum Guide by reproducing the
-- Product Owner, Developers, Scrum Team, Scrum Master, Product Backlog and
-- Product Goal sections verbatim rather than by searching them.
--
--   3.7 is the consequential one. "One product has one Product Backlog,
--   however many teams work on it" states as a rule what the Guide recommends,
--   in a scope it does not cover. The text: "If Scrum Teams become too large,
--   they should consider reorganizing into multiple cohesive Scrum Teams, each
--   focused on the same product. Therefore, they should share the same Product
--   Goal, Product Backlog, and Product Owner." Recommendation, not
--   requirement, and scoped to a route two teams may not have taken. SM-AI-I
--   05-04 already overstates it the same way, so the Level I floor was
--   carrying the error upward.
--
--   product-goal-singularity was wrong twice over. It attached the Product
--   Goal to a product where the Guide attaches it to the Scrum Team - "The
--   Product Goal is the long-term objective for the Scrum Team" - and it
--   converted "They must fulfill (or abandon) one objective before taking on
--   the next", a sequencing rule about one team over time, into a cardinality
--   rule about one product across teams. Two different claims, neither
--   supporting the other.
--
--   3.2 said the Developers decide who does what. The Guide says the Scrum
--   Team does: "They are also self-managing, meaning they internally decide
--   who does what, when, and how." The Developers own accountability list does
--   not contain it. SM-AI-I is inconsistent on this inside its own content -
--   02-05 has it right, 02-03 has it wrong - and the task inherited the wrong
--   half.
--
--   work-assignment-boundary asserted "no one assigns work to them", a
--   prohibition the Guide does not state anywhere. It now states the provision
--   positively and marks the prohibition as what follows from it.
--
--   absence-handling rested on "no interim arrangement is prescribed", an
--   absence claim. Replaced by the positive half, which is stated text: the
--   Developers are accountable for "Creating a plan for the Sprint, the Sprint
--   Backlog", and that does not depend on who is present.
--
--   3.8 said "the accountability is not divisible". That is not in the text.
--
--   THREE SITES carried the same quotation drift on the Scrum Master service
--   to the organization - "adopt an empirical approach" for the Guide's
--   "Helping employees and stakeholders understand and enact an empirical
--   approach for complex work": task 3.3, task 3.5, and the
--   organizational-service concept. A fourth, stakeholder-influence, hardened
--   "Those wanting to change the Product Backlog can do so by trying to
--   convince the Product Owner" into an exclusive channel, which is how
--   SM-AI-I 02-02 phrases it. Not inherited.
--
-- 3.8'S REPLACEMENT IS ITSELF AN ABSENCE CLAIM, DELIBERATELY. It names the
-- sections read, which is what makes an absence checkable rather than merely
-- unfalsified, and a task whose subject is the Guide's silence has to be able
-- to say so. It still needs marking wherever a lesson renders it.
--
-- Run one statement at a time.

-- 1. task 3.2 - self-management belongs to the Scrum Team
update public.tasks t
set knowledge = 'Self-management belongs to the Scrum Team, which internally decides who does what, when and how; an assignment from outside displaces a Scrum Team decision, and the Scrum Master serves the organization in its Scrum adoption'
from public.certifications c, public.domains d
where t.certification_id = c.id and t.domain_id = d.id
  and c.code = 'SM-AI-II' and d.code = 'D3' and t.code = '3.2';

-- 2. work-assignment-boundary - provision positive, prohibition as consequence
update public.concepts co
set description = 'The Scrum Team internally decides who does what, when and how. The Guide states the provision and no prohibition; that an outside assignment displaces it follows from the provision and is not text.'
from public.certifications c
where co.certification_id = c.id and c.code = 'SM-AI-II'
  and co.slug = 'work-assignment-boundary';

-- 3. task 3.3 - the third site of the organizational-service drift
update public.tasks t
set knowledge = 'The Scrum Master helps employees and stakeholders understand and enact an empirical approach for complex work'
from public.certifications c, public.domains d
where t.certification_id = c.id and t.domain_id = d.id
  and c.code = 'SM-AI-II' and d.code = 'D3' and t.code = '3.3';

-- 4. task 3.5 - the Guide's wording, and the channel that may fail
update public.tasks t
set knowledge = 'The Product Owner is one person, not a committee; those wanting to change the Product Backlog can do so by trying to convince the Product Owner'
from public.certifications c, public.domains d
where t.certification_id = c.id and t.domain_id = d.id
  and c.code = 'SM-AI-II' and d.code = 'D3' and t.code = '3.5';

-- 5. task 3.7 - recommendation, not requirement
update public.tasks t
set knowledge = 'The Guide recommends that Scrum Teams working on the same product share a Product Goal, Product Backlog and Product Owner; where they do not, no single order of value exists'
from public.certifications c, public.domains d
where t.certification_id = c.id and t.domain_id = d.id
  and c.code = 'SM-AI-II' and d.code = 'D3' and t.code = '3.7';

-- 6. task 3.8 - what the Guide covers, and where it stops
update public.tasks t
set knowledge = 'The Guide recommends teams on one product share a Product Owner, and says nothing in the Product Owner or Scrum Team sections about how that attention is apportioned'
from public.certifications c, public.domains d
where t.certification_id = c.id and t.domain_id = d.id
  and c.code = 'SM-AI-II' and d.code = 'D3' and t.code = '3.8';

-- 7. single-product-backlog
update public.concepts co
set description = 'The Guide recommends teams on one product share a Product Backlog. A split is not forbidden; it costs the single ordered source of work.'
from public.certifications c
where co.certification_id = c.id and c.code = 'SM-AI-II'
  and co.slug = 'single-product-backlog';

-- 8. product-goal-singularity - the two claims separated
update public.concepts co
set description = 'The Guide recommends teams on one product share a Product Goal. Its separate rule - fulfill or abandon one objective before the next - is about a Scrum Team over time, not about a product.'
from public.certifications c
where co.certification_id = c.id and c.code = 'SM-AI-II'
  and co.slug = 'product-goal-singularity';

-- 9. absence-handling - the positive half
update public.concepts co
set description = 'Proceeding when an accountable party is unavailable. The Developers are accountable for creating a plan for the Sprint, and that does not depend on who is present.'
from public.certifications c
where co.certification_id = c.id and c.code = 'SM-AI-II'
  and co.slug = 'absence-handling';

-- 10. organizational-service - the Guide's wording
update public.concepts co
set description = 'The Scrum Master helps employees and stakeholders understand and enact an empirical approach for complex work.'
from public.certifications c
where co.certification_id = c.id and c.code = 'SM-AI-II'
  and co.slug = 'organizational-service';

-- 11. stakeholder-influence - a channel that may fail, not an exclusive one
update public.concepts co
set description = 'Those wanting to change the Product Backlog can do so by trying to convince the Product Owner. The Guide offers a channel that may fail, not an exclusive one.'
from public.certifications c
where co.certification_id = c.id and c.code = 'SM-AI-II'
  and co.slug = 'stakeholder-influence';

-- ---------------------------------------------------------------------------
-- VERIFY. Both halves, and the property is named rather than counted.
--
-- FIVE tasks must carry the new wording and THREE must be untouched. Asserting
-- only that the rewrites landed would pass a sweep that also rewrote 3.1, 3.4
-- or 3.6, and over-application is the failure the negative half exists to
-- catch.
-- ---------------------------------------------------------------------------
do $$
declare bad text;
begin
  select string_agg(t.code, ', ' order by t.code) into bad
  from public.tasks t
  join public.domains d on d.id = t.domain_id
  join public.certifications c on c.id = t.certification_id
  where c.code = 'SM-AI-II' and d.code = 'D3'
    and (   (t.code = '3.2' and t.knowledge not like 'Self-management belongs%')
         or (t.code = '3.3' and t.knowledge not like '%understand and enact%')
         or (t.code = '3.5' and t.knowledge not like '%trying to convince%')
         or (t.code = '3.7' and t.knowledge not like 'The Guide recommends%')
         or (t.code = '3.8' and t.knowledge not like '%apportioned')
         or (t.code = '3.1' and t.knowledge not like '%remains accountable')
         or (t.code = '3.4' and t.knowledge not like '%not necessarily removing')
         or (t.code = '3.6' and t.knowledge not like '%remain accountable for a plan'));
  if bad is not null then
    raise exception 'D3 knowledge check failed'
      using detail = 'tasks: ' || bad,
            hint = 'five rewritten, three must be untouched';
  end if;
end $$;

-- SIX concepts rewritten. The six named after them are this credential's own
-- constructs with no Guide text behind them - correct as they stand, and a
-- sweep must not touch them. They are named, not counted, because a total of
-- eighteen unchanged would pass on the wrong eighteen.
do $$
declare bad text;
begin
  select string_agg(co.slug, ', ' order by co.slug) into bad
  from public.concepts co
  join public.certifications c on c.id = co.certification_id
  where c.code = 'SM-AI-II'
    and (   (co.slug = 'work-assignment-boundary'   and co.description not like '%is not text.')
         or (co.slug = 'organizational-service'     and co.description not like '%understand and enact%')
         or (co.slug = 'single-product-backlog'     and co.description not like 'The Guide recommends%')
         or (co.slug = 'product-goal-singularity'   and co.description not like 'The Guide recommends%')
         or (co.slug = 'absence-handling'           and co.description not like '%who is present.')
         or (co.slug = 'stakeholder-influence'      and co.description not like '%not an exclusive one.')
         or (co.slug = 'empiricism-prerequisites'   and co.description not like 'Conditions outside the team%')
         or (co.slug = 'escalation-proportionality' and co.description not like 'Escalating no further%')
         or (co.slug = 'po-capacity'                and co.description not like 'The limit on how much%')
         or (co.slug = 'cross-team-equity'          and co.description not like 'Uneven access%')
         or (co.slug = 'decision-diffusion'         and co.description not like 'A single accountability%')
         or (co.slug = 'role-vacancy-pressure'      and co.description not like 'The pull on a Scrum Master%'));
  if bad is not null then
    raise exception 'D3 concept check failed'
      using detail = 'concepts: ' || bad,
            hint = 'six rewritten, six constructs untouched';
  end if;
end $$;

-- No retired phrasing may survive anywhere in the certification. This is a
-- sweep and not a read: a correction applied to one of three sites looks
-- correct at the site it was applied to. The drift on the Scrum Master service
-- to the organization sat in three places and the recon found two of them.
do $$
declare n int;
begin
  select count(*) into n
  from public.tasks t
  join public.certifications c on c.id = t.certification_id
  where c.code = 'SM-AI-II'
    and t.knowledge ~ '(adopt an empirical approach|persuading the Product Owner|persuade the Product Owner|not divisible|One product has one|no one assigns work|no interim arrangement)';
  if n > 0 then
    raise exception 'retired phrasing survives in tasks'
      using detail = n || ' task(s) still match',
            hint = 'a fix applied to one of three sites looks correct there';
  end if;

  select count(*) into n
  from public.concepts co
  join public.certifications c on c.id = co.certification_id
  where c.code = 'SM-AI-II'
    and co.description ~ '(adopt an empirical approach|persuading the Product Owner|persuade the Product Owner|not divisible|One product has one|no one assigns work|no interim arrangement)';
  if n > 0 then
    raise exception 'retired phrasing survives in concepts'
      using detail = n || ' concept(s) still match',
            hint = 'a fix applied to one of three sites looks correct there';
  end if;
end $$;

-- Profile must not have moved. No bloom_level appears in any statement above.
select v.bloom_level, v.tasks, round(v.pct_of_form::numeric, 2) as pct
from public.v_cognitive_profile v
join public.certifications c on c.id = v.certification_id
where c.code = 'SM-AI-II'
order by v.bloom_level;
