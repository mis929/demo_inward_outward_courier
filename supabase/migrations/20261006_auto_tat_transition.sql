-- Migration: Escalation Engine for Courier FMS
-- Description: Automatically checks for expired TATs and records escalations (does not auto-complete).
-- Instructions: Run this in the Supabase SQL Editor, or apply via Supabase CLI.
-- Requires pg_cron extension if you want to run it on a schedule.

-- Ensure escalation tracking column exists in fms_stage_instances
ALTER TABLE public.fms_stage_instances ADD COLUMN IF NOT EXISTS escalated_at timestamp with time zone;
ALTER TABLE public.fms_stage_instances ADD COLUMN IF NOT EXISTS escalation_level integer DEFAULT 0;

-- 1. Create the function to evaluate TAT and record escalations
CREATE OR REPLACE FUNCTION public.evaluate_and_escalate_tats()
RETURNS integer AS $$
DECLARE
  escalated_count integer := 0;
  instance RECORD;
  current_now timestamp with time zone;
BEGIN
  current_now := now();

  -- Find all active stage instances that are overdue and haven't been escalated yet (or ready for next escalation level)
  FOR instance IN
    SELECT 
      fsi.id as instance_id,
      fsi.record_id,
      fsi.stage_id,
      fsi.planned_at,
      ws.workflow_id,
      ws.stage_number
    FROM fms_stage_instances fsi
    JOIN workflow_stages ws ON ws.id = fsi.stage_id
    WHERE fsi.status = 'active'
      AND fsi.planned_at IS NOT NULL
      AND fsi.planned_at < current_now
      AND (fsi.escalated_at IS NULL OR fsi.escalated_at < current_now - interval '4 hours')
  LOOP
    -- Mark current as escalated (DOES NOT AUTO-TRANSITION)
    UPDATE fms_stage_instances
    SET escalated_at = current_now,
        escalation_level = COALESCE(escalation_level, 0) + 1
    WHERE id = instance.instance_id;

    -- Audit log
    INSERT INTO audit_logs (record_id, action, old_value, new_value)
    VALUES (
      instance.record_id, 
      'STAGE_ESCALATED', 
      jsonb_build_object('stage_id', instance.stage_id), 
      jsonb_build_object('reason', 'TAT expired', 'planned_at', instance.planned_at)
    );

    -- Log history
    INSERT INTO fms_stage_history (record_id, stage_id, action, old_status, new_status, notes)
    VALUES (
      instance.record_id, 
      instance.stage_id, 
      'ESCALATION_TRIGGERED', 
      'active', 
      'active', 
      'TAT threshold crossed. Escalation recorded. User must manually complete the stage.'
    );

    escalated_count := escalated_count + 1;
  END LOOP;

  RETURN escalated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Optional: Schedule the function to run every 15 minutes using pg_cron
-- IMPORTANT: pg_cron must be enabled in Supabase Database Extensions
-- Uncomment the following block if pg_cron is enabled:

/*
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('fms_tat_escalation', '*/15 * * * *', 'SELECT public.evaluate_and_escalate_tats();');
*/
