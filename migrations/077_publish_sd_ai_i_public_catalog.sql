-- Migration 077: publish SD-AI-I to the public catalog + file under Certidemy Scrum
--
-- SD-AI-I was content-complete / exam-proven with status='available', but its
-- is_published bridge flag was never flipped (the pending "publish" step), so the
-- anon policy (catalog read certifications: is_published OR is_platform_admin())
-- hid it from logged-out visitors while admins still saw it. category_slug was
-- also NULL, dropping it into the "Other certifications" safety-net bucket instead
-- of the Certidemy Scrum group.
--
-- This is the deliberate go-live for SD-AI-I. The broader is_published -> status
-- RLS migration stays a separate planned item (cert lifecycle hardening); here we
-- only reconcile this cert's bridge flag so it behaves consistently on every
-- is_published-gated path.

update public.certifications
set is_published = true,
    category_slug = 'scrum',
    sort_order = 3
where code = 'SD-AI-I'
returning code, status, is_published, category_slug, sort_order;
