-- Migration: iter-5-rental-request-flow
-- Work Unit 1: DB schema for equipment rental request flow
-- Created: 2026-05-11

CREATE TYPE rental_status AS ENUM ('pending', 'confirmed', 'denied', 'cancelled');

CREATE TABLE rentals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  band_or_event_name text,
  details text,
  start_datetime timestamptz NOT NULL,
  end_datetime timestamptz NOT NULL,
  status rental_status NOT NULL DEFAULT 'pending',
  total_price numeric NOT NULL DEFAULT 0,
  owner_message text,
  cancellation_reason text,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE rental_request_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id uuid NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id),
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rentals_user_id ON rentals(user_id);
CREATE INDEX idx_rentals_status ON rentals(status);
CREATE INDEX idx_rentals_start_datetime ON rentals(start_datetime);
CREATE INDEX idx_rental_request_items_rental_id ON rental_request_items(rental_id);

ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_request_items ENABLE ROW LEVEL SECURITY;

-- RLS: rentals
CREATE POLICY "Users select own rentals" ON rentals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own rentals" ON rentals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own rentals" ON rentals
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owners select all rentals" ON rentals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );
CREATE POLICY "Owners update all rentals" ON rentals
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- RLS: rental_request_items
CREATE POLICY "Users select own rental_request_items" ON rental_request_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM rentals WHERE id = rental_id AND user_id = auth.uid())
  );
CREATE POLICY "Users insert own rental_request_items" ON rental_request_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM rentals WHERE id = rental_id AND user_id = auth.uid())
  );
CREATE POLICY "Owners select all rental_request_items" ON rental_request_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );