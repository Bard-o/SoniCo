-- Migration: create maintenance_blocks table
-- Created: 2026-06-16

CREATE TABLE IF NOT EXISTS maintenance_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id) ON DELETE CASCADE,
  start_datetime timestamptz NOT NULL,
  end_datetime timestamptz NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT exactly_one_target CHECK (
    (room_id IS NOT NULL AND item_id IS NULL) OR
    (room_id IS NULL AND item_id IS NOT NULL)
  ),
  CONSTRAINT valid_time_range CHECK (end_datetime > start_datetime)
);

CREATE INDEX idx_maintenance_blocks_room_id ON maintenance_blocks(room_id);
CREATE INDEX idx_maintenance_blocks_item_id ON maintenance_blocks(item_id);
CREATE INDEX idx_maintenance_blocks_time ON maintenance_blocks(start_datetime, end_datetime);

ALTER TABLE maintenance_blocks ENABLE ROW LEVEL SECURITY;

-- Owners can do everything with maintenance blocks
CREATE POLICY "Owners manage maintenance blocks" ON maintenance_blocks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- Anyone can read maintenance blocks (for availability checks)
CREATE POLICY "Users read maintenance blocks" ON maintenance_blocks
  FOR SELECT USING (true);
