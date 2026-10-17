create policy "Public can insert tours"
  on tours for insert
  with check (true);

create policy "Public can update tours"
  on tours for update
  using (true)
  with check (true);

create policy "Public can delete tours"
  on tours for delete
  using (true);
