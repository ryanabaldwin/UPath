-- Remove demo seed meetings so Sarah Johnson and Marcus Williams are bookable.
-- The seed data created meetings for mentor_id 1 and 2 tied to user_ids 1 and 2,
-- which prevented those mentors from appearing as available.
DELETE FROM meetings WHERE mentor_id IN (1, 2);
