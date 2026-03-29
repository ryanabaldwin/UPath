-- 011: Seed an admin user for user management
-- Username: admin | Password: admin1234

INSERT INTO users (username, password, role, first_name, last_name, email, streak_count)
VALUES ('admin', 'admin1234', 'admin', 'Admin', 'User', 'admin@upath.dev', 0)
ON CONFLICT DO NOTHING;
