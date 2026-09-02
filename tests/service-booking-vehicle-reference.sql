begin;
create temporary table booking_fix_test (like public.service_bookings including defaults including constraints) on commit drop;
create trigger test_prepare before insert or update of car_id,user_vehicle_id,user_id,customer_notes,service_type,service_date
on booking_fix_test for each row execute function private.manfix_prepare_service_booking();
create temporary table booking_test_results (test text,passed boolean) on commit drop;
do $test$
declare v record; c record; bid uuid; label_before text; rejected boolean;
begin
 select * into v from public.user_vehicles limit 1;
 if v.id is null then raise exception 'No vehicle available for test'; end if;
 insert into booking_fix_test(user_id,user_vehicle_id,workshop_owner_id,service_type,service_date)
 values(v.user_id,v.id,v.user_id,'TEST ONLY',now()+interval '1 day') returning id,vehicle_label into bid,label_before;
 if label_before is null then raise exception 'Missing label'; end if;
 insert into booking_test_results values('modern owner vehicle accepted and label generated',true);
 rejected:=false;
 begin
  insert into booking_fix_test(user_id,user_vehicle_id,workshop_owner_id,service_type,service_date)
  values(gen_random_uuid(),v.id,v.user_id,'TEST ONLY',now()+interval '1 day');
 exception when raise_exception then
  if sqlerrm <> 'The selected vehicle does not belong to this customer.' then raise; end if;
  rejected:=true;
 end;
 if not rejected then raise exception 'Cross-owner booking allowed'; end if;
 insert into booking_test_results values('different customer rejected',true);
 rejected:=false;
 begin
  update booking_fix_test set user_vehicle_id=gen_random_uuid() where id=bid;
 exception when raise_exception then
  if sqlerrm <> 'The selected vehicle does not belong to this customer.' then raise; end if;
  rejected:=true;
 end;
 if not rejected then raise exception 'Invalid vehicle update allowed'; end if;
 insert into booking_test_results values('vehicle change revalidated',true);
 update booking_fix_test set user_vehicle_id=null where id=bid;
 if (select vehicle_label from booking_fix_test where id=bid) is distinct from label_before then raise exception 'Historical label lost'; end if;
 insert into booking_test_results values('detached vehicle keeps historical booking label',true);
 rejected:=false;
 begin
  insert into booking_fix_test(user_id,workshop_owner_id,service_type,service_date)
  values(v.user_id,v.user_id,'TEST ONLY',now()+interval '1 day');
 exception when raise_exception then
  if sqlerrm <> 'Select a vehicle belonging to this customer.' then raise; end if;
  rejected:=true;
 end;
 if not rejected then raise exception 'Missing vehicle accepted'; end if;
 insert into booking_test_results values('new booking without vehicle rejected',true);
 select * into c from public.cars limit 1;
 if c.id is not null then
  insert into booking_fix_test(user_id,car_id,workshop_owner_id,service_type,service_date)
  values(c.user_id,c.id,c.user_id,'TEST ONLY',now()+interval '1 day');
  insert into booking_test_results values('legacy owner vehicle accepted',true);
 end if;
end;
$test$;
select * from booking_test_results;
rollback;