-- Migration: iter-6-owner-approval-flow
-- Work Unit 1: DB schema for owner approval flow + notifications
-- Created: 2026-05-11

-- 1. Add owner_message column to reservations
ALTER TABLE reservations ADD COLUMN owner_message text DEFAULT NULL;

-- 2. Create notification_type enum
CREATE TYPE notification_type AS ENUM (
  'reservation_confirmed',
  'reservation_denied',
  'rental_confirmed',
  'rental_denied'
);

-- 3. Create notifications table
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  type notification_type NOT NULL,
  message text NOT NULL,
  owner_message text DEFAULT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Create indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_id_is_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- 5. Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 6. RLS policies for notifications
-- Users can SELECT their own notifications
CREATE POLICY "Users select own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can UPDATE (mark as read) their own notifications
CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Owners can SELECT all notifications
CREATE POLICY "Owners select all notifications" ON notifications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- Owners can UPDATE all notifications (mark as read for any user)
CREATE POLICY "Owners update all notifications" ON notifications
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );