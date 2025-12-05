-- Insert a default public study room if none exists
INSERT INTO study_rooms (name, topic, description, type, is_active)
SELECT 'General Lounge', 'General', 'A place for everyone to hang out.', 'public', true
WHERE NOT EXISTS (SELECT 1 FROM study_rooms WHERE name = 'General Lounge');

-- Insert another one
INSERT INTO study_rooms (name, topic, description, type, is_active)
SELECT 'Physics Club', 'Physics', 'Thermodynamics and Quantum Mechanics discussion.', 'public', true
WHERE NOT EXISTS (SELECT 1 FROM study_rooms WHERE name = 'Physics Club');

-- Insert another one
INSERT INTO study_rooms (name, topic, description, type, is_active)
SELECT 'Coding Den', 'Computer Science', 'Algorithms, Data Structures, and Web Dev.', 'public', true
WHERE NOT EXISTS (SELECT 1 FROM study_rooms WHERE name = 'Coding Den');
