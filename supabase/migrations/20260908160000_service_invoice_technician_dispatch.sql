-- Service payment invoices and first-come technician dispatch.

alter table public.service_bookings
  add column if not exists technician_dispatch_expires_at timestamptz;

alter table public.lift_bookings
  add column if not exists technician_dispatch_expires_at timestamptz;

alter table public.repair_jobs
  add column if not exists estimated_amount numeric(12,2) not null default 0,
  add column if not exists final_amount numeric(12,2),
  add constraint repair_jobs_final_amount_positive
    check (final_amount is null or final_amount > 0);

create table if not exists public.repair_job_offers (
  id uuid primary key default gen_random_uuid(),
  service_booking_id uuid not null references public.service_bookings(id) on delete cascade,
  workshop_owner_id uuid not null references auth.users(id) on delete cascade,
  technician_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired')),
  expires_at timestamptz not null,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (service_booking_id, technician_user_id)
);

create index if not exists repair_job_offers_technician_status_idx
  on public.repair_job_offers(technician_user_id, status, expires_at desc);
create index if not exists repair_job_offers_booking_status_idx
  on public.repair_job_offers(service_booking_id, status);
create index if not exists repair_job_offers_workshop_owner_idx
  on public.repair_job_offers(workshop_owner_id);

create table if not exists public.service_invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  repair_job_id uuid not null unique references public.repair_jobs(id) on delete restrict,
  service_booking_id uuid unique references public.service_bookings(id) on delete set null,
  customer_id uuid not null references auth.users(id) on delete restrict,
  workshop_owner_id uuid not null references auth.users(id) on delete restrict,
  vehicle_label text not null,
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  platform_fee_rate numeric(5,2) not null default 10 check (platform_fee_rate between 0 and 100),
  platform_fee_amount numeric(12,2) generated always as (round(amount * platform_fee_rate / 100, 2)) stored,
  workshop_net_amount numeric(12,2) generated always as (amount - round(amount * platform_fee_rate / 100, 2)) stored,
  currency text not null default 'MYR',
  payment_method text,
  status text not null default 'Pending' check (status in ('Pending', 'Awaiting confirmation', 'Paid', 'Cancelled', 'Refunded')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists service_invoices_customer_status_idx
  on public.service_invoices(customer_id, status, created_at desc);
create index if not exists service_invoices_workshop_status_idx
  on public.service_invoices(workshop_owner_id, status, created_at desc);

create or replace function private.manfix_copy_repair_estimate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.booking_kind = 'service' then
    select estimated_price into new.estimated_amount
    from public.service_bookings where id = new.service_booking_id;
  else
    select estimated_price into new.estimated_amount
    from public.lift_bookings where id = new.lift_booking_id;
  end if;
  new.estimated_amount := coalesce(new.estimated_amount, 0);
  return new;
end;
$$;

revoke all on function private.manfix_copy_repair_estimate() from public, anon, authenticated;
drop trigger if exists manfix_copy_repair_estimate on public.repair_jobs;
create trigger manfix_copy_repair_estimate
before insert or update of service_booking_id, lift_booking_id on public.repair_jobs
for each row execute function private.manfix_copy_repair_estimate();

alter table public.repair_job_offers enable row level security;
alter table public.service_invoices enable row level security;

create policy "Technicians view own repair offers"
on public.repair_job_offers for select to authenticated
using (
  technician_user_id = (select auth.uid())
  and private.manfix_has_approved_role('technician')
);

create policy "Workshops view own repair offers"
on public.repair_job_offers for select to authenticated
using (
  workshop_owner_id = (select auth.uid())
  and private.manfix_has_approved_role('workshop')
);

create policy "Admins view repair offers"
on public.repair_job_offers for select to authenticated
using (private.manfix_has_approved_role('admin'));

create policy "Customers view own service invoices"
on public.service_invoices for select to authenticated
using (customer_id = (select auth.uid()));

create policy "Workshops view own service invoices"
on public.service_invoices for select to authenticated
using (
  workshop_owner_id = (select auth.uid())
  and private.manfix_has_approved_role('workshop')
);

create policy "Admins manage service invoices"
on public.service_invoices for all to authenticated
using (private.manfix_has_approved_role('admin'))
with check (private.manfix_has_approved_role('admin'));

revoke all on public.repair_job_offers from anon;
revoke all on public.service_invoices from anon;
grant select on public.repair_job_offers to authenticated;
grant select on public.service_invoices to authenticated;

create or replace function private.manfix_prepare_technician_dispatch()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.workshop_owner_id is not null and exists (
    select 1 from public.technicians t
    where t.workshop_owner_id = new.workshop_owner_id
      and t.user_id is not null
      and lower(t.status) = 'available'
  ) then
    new.technician_dispatch_expires_at := now() + interval '2 minutes';
  else
    new.technician_dispatch_expires_at := now();
  end if;
  return new;
end;
$$;

create or replace function private.manfix_create_technician_offers()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  technician record;
begin
  if new.technician_dispatch_expires_at <= now() then return new; end if;
  for technician in
    select user_id, name from public.technicians
    where workshop_owner_id = new.workshop_owner_id
      and user_id is not null
      and lower(status) = 'available'
  loop
    insert into public.repair_job_offers (
      service_booking_id, workshop_owner_id, technician_user_id, expires_at
    ) values (
      new.id, new.workshop_owner_id, technician.user_id, new.technician_dispatch_expires_at
    ) on conflict do nothing;
    perform private.manfix_notify(
      technician.user_id, 'New repair job available',
      new.vehicle_label || ': ' || coalesce(new.symptom, new.service_type) || '. Accept within 2 minutes.',
      'repair_offer', 'service_booking', new.id::text, new.user_id
    );
  end loop;
  return new;
end;
$$;

revoke all on function private.manfix_prepare_technician_dispatch() from public, anon, authenticated;
revoke all on function private.manfix_create_technician_offers() from public, anon, authenticated;

drop trigger if exists manfix_prepare_technician_dispatch on public.service_bookings;
create trigger manfix_prepare_technician_dispatch
before insert on public.service_bookings
for each row execute function private.manfix_prepare_technician_dispatch();

drop trigger if exists manfix_create_technician_offers on public.service_bookings;
create trigger manfix_create_technician_offers
after insert on public.service_bookings
for each row execute function private.manfix_create_technician_offers();

create or replace function private.manfix_notify_booking_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  booking_label text := coalesce(new.vehicle_label, 'Vehicle booking');
begin
  if tg_op = 'INSERT' then
    perform private.manfix_notify(
      new.user_id, 'Booking submitted',
      booking_label || ' was submitted for ' || to_char(new.scheduled_at, 'DD Mon YYYY HH24:MI') || '.',
      'booking', tg_table_name, new.id::text, new.user_id
    );
    if new.workshop_owner_id is not null
       and (tg_table_name <> 'service_bookings' or new.technician_dispatch_expires_at <= now()) then
      perform private.manfix_notify(
        new.workshop_owner_id, 'New workshop booking',
        booking_label || ' is awaiting review.',
        'booking', tg_table_name, new.id::text, new.user_id
      );
    end if;
  elsif old.status is distinct from new.status then
    perform private.manfix_notify(
      new.user_id, 'Booking status updated',
      booking_label || ' is now ' || new.status || '.',
      'booking', tg_table_name, new.id::text, new.workshop_owner_id
    );
  end if;
  return new;
end;
$$;

create or replace function public.manfix_respond_repair_offer(target_offer_id uuid, accept_offer boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_technician uuid := auth.uid();
  offer public.repair_job_offers%rowtype;
  technician_label text;
  booking public.service_bookings%rowtype;
  created_job_id uuid;
begin
  if current_technician is null or not private.manfix_has_approved_role('technician') then
    raise exception 'Approved technician access is required.';
  end if;

  select * into offer from public.repair_job_offers
  where id = target_offer_id and technician_user_id = current_technician
  for update;
  if not found or offer.status <> 'pending' then raise exception 'This offer is no longer available.'; end if;

  if not accept_offer then
    update public.repair_job_offers set status = 'declined', responded_at = now() where id = offer.id;
    if not exists (
      select 1 from public.repair_job_offers
      where service_booking_id = offer.service_booking_id and status = 'pending' and expires_at > now()
    ) then
      update public.service_bookings set technician_dispatch_expires_at = now(), updated_at = now()
      where id = offer.service_booking_id and status = 'pending';
      perform private.manfix_notify(
        offer.workshop_owner_id, 'Booking needs workshop assignment',
        'All available technicians declined this booking.',
        'booking', 'service_booking', offer.service_booking_id::text, current_technician
      );
    end if;
    return;
  end if;

  if offer.expires_at <= now() then
    update public.repair_job_offers set status = 'expired', responded_at = now() where id = offer.id;
    raise exception 'This offer has expired.';
  end if;

  select * into booking from public.service_bookings
  where id = offer.service_booking_id and status = 'pending'
  for update;
  if not found then raise exception 'Another technician already accepted this job.'; end if;

  select name into technician_label from public.technicians
  where user_id = current_technician and workshop_owner_id = offer.workshop_owner_id;
  if technician_label is null then raise exception 'Your technician account is not assigned to this workshop.'; end if;

  update public.repair_job_offers
  set status = case when id = offer.id then 'accepted' else 'expired' end,
      responded_at = now()
  where service_booking_id = offer.service_booking_id and status = 'pending';

  update public.service_bookings set status = 'approved', updated_at = now()
  where id = booking.id;

  select id into created_job_id from public.repair_jobs where service_booking_id = booking.id;
  update public.repair_jobs
  set technician_user_id = current_technician,
      technician_name = technician_label,
      updated_at = now()
  where id = created_job_id;

  perform private.manfix_notify(
    booking.user_id, 'Technician accepted your booking',
    technician_label || ' accepted the repair for ' || booking.vehicle_label || '.',
    'repair_job', 'repair_job', created_job_id::text, current_technician
  );
  perform private.manfix_notify(
    booking.workshop_owner_id, 'Technician accepted booking',
    technician_label || ' accepted ' || booking.vehicle_label || '.',
    'repair_job', 'repair_job', created_job_id::text, current_technician
  );
end;
$$;

create or replace function public.manfix_workshop_complete_repair(target_repair_job_id uuid, charged_amount numeric)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_workshop uuid := auth.uid();
  job public.repair_jobs%rowtype;
  invoice_id uuid;
  invoice_code text;
begin
  if current_workshop is null or not private.manfix_has_approved_role('workshop') then
    raise exception 'Approved workshop access is required.';
  end if;
  if charged_amount is null or charged_amount <= 0 then raise exception 'Final amount must be greater than zero.'; end if;

  select * into job from public.repair_jobs
  where id = target_repair_job_id and workshop_owner_id = current_workshop
  for update;
  if not found then raise exception 'Repair job not found.'; end if;
  if job.status not in ('in_progress', 'ready') then raise exception 'Only an active or ready repair can be completed.'; end if;

  update public.repair_jobs set final_amount = round(charged_amount, 2), status = 'completed', updated_at = now()
  where id = job.id;

  invoice_code := 'SVC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  insert into public.service_invoices (
    invoice_number, repair_job_id, service_booking_id, customer_id, workshop_owner_id,
    vehicle_label, description, amount
  ) values (
    invoice_code, job.id, job.service_booking_id, job.customer_id, job.workshop_owner_id,
    job.vehicle_label, job.diagnosis, round(charged_amount, 2)
  ) returning id into invoice_id;

  perform private.manfix_notify(
    job.customer_id, 'Service invoice ready',
    invoice_code || ' for RM ' || to_char(round(charged_amount, 2), 'FM999999990.00') || ' is ready for payment.',
    'service_payment', 'service_invoice', invoice_id::text, current_workshop
  );
  return invoice_id;
end;
$$;

create or replace function public.manfix_choose_service_payment(target_invoice_id uuid, selected_method text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Authentication is required.'; end if;
  if selected_method not in ('Pay at workshop', 'Online banking', 'Card', 'Touch n Go eWallet') then
    raise exception 'Unsupported payment method.';
  end if;
  update public.service_invoices
  set payment_method = selected_method,
      status = 'Awaiting confirmation',
      updated_at = now()
  where id = target_invoice_id and customer_id = auth.uid() and status = 'Pending';
  if not found then raise exception 'Invoice not found or already processed.'; end if;
end;
$$;

revoke all on function public.manfix_respond_repair_offer(uuid, boolean) from public, anon;
revoke all on function public.manfix_workshop_complete_repair(uuid, numeric) from public, anon;
revoke all on function public.manfix_choose_service_payment(uuid, text) from public, anon;
grant execute on function public.manfix_respond_repair_offer(uuid, boolean) to authenticated;
grant execute on function public.manfix_workshop_complete_repair(uuid, numeric) to authenticated;
grant execute on function public.manfix_choose_service_payment(uuid, text) to authenticated;

create or replace function public.manfix_workshop_update_booking_status(
  booking_kind text,
  booking_id uuid,
  next_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_role text := private.manhub_app_role();
  own_offer_id uuid;
begin
  if next_status not in ('approved', 'cancelled', 'completed') then
    raise exception 'Unsupported booking status.';
  end if;

  if caller_role = 'technician' and private.manfix_has_approved_role('technician') then
    if booking_kind <> 'service' or next_status <> 'approved' then
      raise exception 'Technicians may only claim an available service job.';
    end if;
    select id into own_offer_id from public.repair_job_offers
    where service_booking_id = booking_id
      and technician_user_id = auth.uid()
      and status = 'pending'
      and expires_at > now();
    if own_offer_id is null then raise exception 'This repair offer is no longer available.'; end if;
    perform public.manfix_respond_repair_offer(own_offer_id, true);
    return;
  end if;

  if caller_role <> 'workshop' or not private.manfix_has_approved_role('workshop') then
    raise exception 'Approved workshop access is required.';
  end if;

  if booking_kind = 'service' then
    if next_status = 'approved' and exists (
      select 1 from public.service_bookings
      where id = booking_id
        and technician_dispatch_expires_at > now()
        and status = 'pending'
    ) then raise exception 'This booking is still being offered to technicians.'; end if;
    update public.service_bookings set status = next_status, updated_at = now()
    where id = booking_id and workshop_owner_id = auth.uid()
      and status not in ('cancelled', 'rejected', 'completed');
  elsif booking_kind = 'lift' then
    update public.lift_bookings set status = next_status, updated_at = now()
    where id = booking_id and workshop_owner_id = auth.uid()
      and status not in ('cancelled', 'rejected', 'completed');
  else
    raise exception 'Unsupported booking type.';
  end if;
  if not found then raise exception 'Booking not found or already closed.'; end if;
end;
$$;

create or replace function public.manfix_workshop_update_repair_status(repair_job_id uuid, next_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_role text := private.manhub_app_role();
begin
  if next_status not in ('queued', 'in_progress', 'ready') then
    raise exception 'Use workshop completion to set the final amount and create an invoice.';
  end if;
  if caller_role = 'workshop' and private.manfix_has_approved_role('workshop') then
    update public.repair_jobs set status = next_status, updated_at = now()
    where id = repair_job_id and workshop_owner_id = auth.uid();
  elsif caller_role = 'technician' and private.manfix_has_approved_role('technician') then
    update public.repair_jobs set status = next_status, updated_at = now()
    where id = repair_job_id and technician_user_id = auth.uid();
  else
    raise exception 'Approved workshop or technician access is required.';
  end if;
  if not found then raise exception 'Repair job not found.'; end if;
end;
$$;

revoke all on function public.manfix_workshop_update_booking_status(text, uuid, text) from public, anon;
revoke all on function public.manfix_workshop_update_repair_status(uuid, text) from public, anon;
grant execute on function public.manfix_workshop_update_booking_status(text, uuid, text) to authenticated;
grant execute on function public.manfix_workshop_update_repair_status(uuid, text) to authenticated;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='repair_job_offers') then
    alter publication supabase_realtime add table public.repair_job_offers;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='service_invoices') then
    alter publication supabase_realtime add table public.service_invoices;
  end if;
end;
$$;
