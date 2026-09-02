create or replace function private.manfix_prepare_service_booking()
returns trigger language plpgsql security definer set search_path = ''
as $function$
declare
  car_record record;
  selected_label text;
begin
  if new.user_vehicle_id is not null then
    select b.name as make, m.model_name as model, v.plate_number as license_plate, v.legacy_car_id
      into car_record
      from public.user_vehicles v
      join public.vehicle_variants vv on vv.id=v.vehicle_variant_id
      join public.vehicle_models m on m.id=vv.vehicle_model_id
      join public.brands b on b.id=m.brand_id
      where v.id=new.user_vehicle_id and v.user_id=new.user_id;
    if not found then
      raise exception 'The selected vehicle does not belong to this customer.';
    end if;
    if new.car_id is not null and new.car_id is distinct from car_record.legacy_car_id then
      raise exception 'The selected vehicle references do not match.';
    end if;
    if new.car_id is not null and not exists(select 1 from public.cars c where c.id=new.car_id and c.user_id=new.user_id) then
      raise exception 'The selected vehicle does not belong to this customer.';
    end if;
    selected_label := trim(concat_ws(' ',car_record.make,car_record.model))
      || coalesce(' (' || nullif(car_record.license_plate,'') || ')','');
  elsif new.car_id is not null then
    select make,model,license_plate into car_record from public.cars
      where id=new.car_id and user_id=new.user_id;
    if not found then
      raise exception 'The selected vehicle does not belong to this customer.';
    end if;
    selected_label := trim(concat_ws(' ',car_record.make,car_record.model))
      || coalesce(' (' || nullif(car_record.license_plate,'') || ')','');
  elsif tg_op='UPDATE' then
    -- ON DELETE SET NULL must preserve the historical booking's label.
    if new.user_id is distinct from old.user_id or old.vehicle_label is null then
      raise exception 'Select a vehicle belonging to this customer.';
    end if;
    selected_label := old.vehicle_label;
  else
    raise exception 'Select a vehicle belonging to this customer.';
  end if;
  new.workshop_owner_id := coalesce(new.workshop_owner_id,private.manfix_default_workshop_owner());
  if new.workshop_owner_id is null then
    raise exception 'No approved workshop is available for this booking.';
  end if;
  new.vehicle_label := selected_label;
  new.symptom := coalesce(nullif(new.customer_notes,''),new.service_type);
  new.scheduled_at := new.service_date;
  new.updated_at := now();
  return new;
end;
$function$;
drop trigger if exists manfix_prepare_service_booking on public.service_bookings;
create trigger manfix_prepare_service_booking
before insert or update of car_id,user_vehicle_id,user_id,customer_notes,service_type,service_date
on public.service_bookings for each row execute function private.manfix_prepare_service_booking();
notify pgrst, 'reload schema';
