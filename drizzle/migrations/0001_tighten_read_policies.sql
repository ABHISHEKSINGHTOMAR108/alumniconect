-- profiles: keep directory visible to signed-in members, hide email column
DROP POLICY IF EXISTS "Authenticated can view profiles" ON public.profiles;
CREATE POLICY "Signed-in members can view profiles"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (id, full_name, batch_year, branch, company, job_title, location, bio, created_at, updated_at)
  ON public.profiles TO authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;

-- events: signed-in members only
DROP POLICY IF EXISTS "Authenticated can view events" ON public.events;
CREATE POLICY "Signed-in members can view events"
ON public.events FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- jobs: signed-in members only
DROP POLICY IF EXISTS "Authenticated can view jobs" ON public.jobs;
CREATE POLICY "Signed-in members can view jobs"
ON public.jobs FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- event_rsvps: own rows only; aggregate counts via function
DROP POLICY IF EXISTS "Authenticated can view rsvps" ON public.event_rsvps;
CREATE POLICY "Users view own rsvps"
ON public.event_rsvps FOR SELECT TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "Admins view all rsvps"
ON public.event_rsvps FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.event_rsvp_counts()
RETURNS TABLE (event_id uuid, attendees bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.event_id, count(*)::bigint
  FROM public.event_rsvps r
  WHERE auth.uid() IS NOT NULL
  GROUP BY r.event_id
$$;
GRANT EXECUTE ON FUNCTION public.event_rsvp_counts() TO authenticated;

-- donations: own rows only; totals via function
DROP POLICY IF EXISTS "Authenticated can view donations" ON public.donations;
CREATE POLICY "Users view own donations"
ON public.donations FOR SELECT TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "Admins view all donations"
ON public.donations FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.donation_totals()
RETURNS TABLE (total numeric, contributions bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(sum(d.amount), 0)::numeric, count(*)::bigint
  FROM public.donations d
  WHERE auth.uid() IS NOT NULL
$$;
GRANT EXECUTE ON FUNCTION public.donation_totals() TO authenticated;
