-- One automatically generated overdue-response alert per communication.
-- The backend also de-duplicates in code; this index guards concurrent requests.
create unique index if not exists alerts_overdue_response_comm_uniq
  on alerts (communication_id)
  where details->>'kind' = 'overdue_response';
