-- SUPABASE INITIALIZATION SCRIPT FOR FLOWTYM PMS
-- Run this in the Supabase SQL Editor

-- HOTELS TABLE
CREATE TABLE IF NOT EXISTS hotels (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  group_id INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO hotels (name, city) VALUES 
('Mas Provencal Aix', 'Aix-en-Provence'),
('Hôtel Rivage Cannes', 'Cannes'),
('Lyon City Center', 'Lyon')
ON CONFLICT DO NOTHING;

-- ROOMS TABLE
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  num TEXT UNIQUE NOT NULL,
  type TEXT,
  floor INT,
  status TEXT DEFAULT 'propre',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CLIENTS TABLE
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RESERVATIONS TABLE
CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  room_id UUID REFERENCES rooms(id),
  client_id INT REFERENCES clients(id),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  status TEXT DEFAULT 'confirmee',
  montant DECIMAL(10,2),
  canal TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HOUSEKEEPING TASKS
CREATE TABLE IF NOT EXISTS room_cleaning_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_num TEXT REFERENCES rooms(num),
  type TEXT,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'pending',
  assigned_to TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LOST & FOUND
CREATE TABLE IF NOT EXISTS lost_found_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_num TEXT,
  description TEXT,
  found_by TEXT,
  status TEXT DEFAULT 'lost',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CASH COUNTS (Contrôle Caisse)
CREATE TABLE IF NOT EXISTS cash_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counts JSONB,
  total_caisse DECIMAL(10,2),
  fdc DECIMAL(10,2),
  ecart DECIMAL(10,2),
  user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- REALTIME CONFIGURATION
-- Ensure the tables are added to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE clients;
ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE room_cleaning_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE lost_found_items;
ALTER PUBLICATION supabase_realtime ADD TABLE cash_counts;
ALTER PUBLICATION supabase_realtime ADD TABLE hotels;

-- DOCUMENTS & JOURNAL TABLE
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id TEXT NOT NULL, -- Using TEXT to match reservations(id) if it's text
  tenant_id UUID NOT NULL,
  event_type VARCHAR(50), -- 'creation', 'modification', 'checkin', 'checkout', 'avis', 'upload', 'note'
  description TEXT,
  user_id UUID,
  user_email TEXT,
  file_name TEXT,
  file_path TEXT,
  file_size INT,
  mime_type VARCHAR(100),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Update Realtime for documents
ALTER PUBLICATION supabase_realtime ADD TABLE documents;
