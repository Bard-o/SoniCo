-- Migration: add missing notification types and delete policies
-- Adds the notification types that were missing from the initial enum
-- Adds DELETE policies so users can delete their own notifications
-- Created: 2026-06-16

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'reservation_requested';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'rental_requested';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'reservation_cancelled';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'rental_cancelled';

-- Users can delete their own notifications
CREATE POLICY "Users delete own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Owners can delete any notification
CREATE POLICY "Owners delete any notification" ON notifications
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );
