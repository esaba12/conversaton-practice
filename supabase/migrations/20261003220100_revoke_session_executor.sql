-- The attribution migration grants practice_session_executor to postgres so it can
-- reassign practice_acquire, then revokes that membership. On the linked project
-- the grant remained (admin option). This repeat revoke is the repair.
revoke practice_session_executor from postgres;
revoke create on schema public from practice_session_executor;
