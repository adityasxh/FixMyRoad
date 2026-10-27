-- Make Gemini, not the reporter, the source of pothole severity.
-- Keep severity=3 only as a temporary valid fallback while AI is pending/failed.
alter table public.pothole_reports
  drop constraint if exists pothole_reports_severity_source_check;

alter table public.pothole_reports
  add constraint pothole_reports_severity_source_check
  check (severity_source = any (array['ai_pending'::text, 'user_reported'::text, 'ai_assessed'::text, 'moderator_verified'::text]));

create or replace function public.protect_pothole_severity_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if tg_op = 'INSERT' then
    new.user_reported_severity := null;
    new.ai_assessed_severity := null;
    new.ai_confidence := null;
    new.ai_model := null;
    new.ai_assessment_status := 'pending';
    new.ai_assessment_notes := null;
    new.verified_severity := null;
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.severity_source := 'ai_pending';
    new.severity := coalesce(new.severity, 3);
  elsif tg_op = 'UPDATE' then
    if auth.role() = 'service_role' then
      if old.verified_severity is not null then
        new.severity := old.verified_severity;
        new.severity_source := 'moderator_verified';
      elsif new.ai_assessed_severity is not null then
        new.severity := new.ai_assessed_severity;
        new.severity_source := 'ai_assessed';
      elsif old.user_reported_severity is not null then
        new.severity := old.user_reported_severity;
        new.severity_source := 'user_reported';
      else
        new.severity := coalesce(old.severity, 3);
        new.severity_source := 'ai_pending';
      end if;
      new.verified_severity := old.verified_severity;
      new.reviewed_by := old.reviewed_by;
      new.reviewed_at := old.reviewed_at;
      new.user_reported_severity := old.user_reported_severity;
    elsif coalesce(auth.jwt()->'app_metadata'->>'role','') <> 'moderator' then
      new.user_reported_severity := old.user_reported_severity;
      new.ai_assessed_severity := old.ai_assessed_severity;
      new.ai_confidence := old.ai_confidence;
      new.ai_model := old.ai_model;
      new.ai_assessment_status := old.ai_assessment_status;
      new.ai_assessment_notes := old.ai_assessment_notes;
      new.verified_severity := old.verified_severity;
      new.reviewed_by := old.reviewed_by;
      new.reviewed_at := old.reviewed_at;
      new.severity_source := old.severity_source;
      new.severity := coalesce(old.verified_severity, old.ai_assessed_severity, old.user_reported_severity, old.severity, 3);
    else
      if new.verified_severity is distinct from old.verified_severity then
        new.reviewed_by := auth.uid();
        new.reviewed_at := now();
        if new.verified_severity is not null then
          new.severity_source := 'moderator_verified';
          new.severity := new.verified_severity;
        elsif new.ai_assessed_severity is not null then
          new.severity_source := 'ai_assessed';
          new.severity := new.ai_assessed_severity;
        elsif new.user_reported_severity is not null then
          new.severity_source := 'user_reported';
          new.severity := new.user_reported_severity;
        else
          new.severity_source := 'ai_pending';
          new.severity := coalesce(old.severity, 3);
        end if;
      end if;
    end if;
  end if;
  return new;
end;
$function$;
