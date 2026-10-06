-- Migration: Auto Transition Engine for Courier FMS
-- Description: Automatically checks for expired TATs and advances workflow stages where configured.
-- Instructions: Run this in the Supabase SQL Editor, or apply via Supabase CLI.
-- Requires pg_cron extension if you want to run it on a schedule.

-- 1. Create the function to evaluate TAT and advance records
CREATE OR REPLACE FUNCTION public.evaluate_and_advance_tats()
RETURNS integer AS $$
DECLARE
  advanced_count integer := 0;
  instance RECORD;
  next_stage RECORD;
  current_now timestamp with time zone;
BEGIN
  current_now := now();

  -- Find all active stage instances that are overdue
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
  LOOP
    -- Mark current as completed (AUTO-TRANSITION)
    UPDATE fms_stage_instances
    SET status = 'completed',
        completed_at = current_now,
        completed_by = NULL,
        completion_notes = 'Auto-transitioned due to TAT expiration.'
    WHERE id = instance.instance_id;

    -- Audit log
    INSERT INTO audit_logs (record_id, action, old_value, new_value)
    VALUES (instance.record_id, 'AUTO_STAGE_COMPLETED', jsonb_build_object('stage_id', instance.stage_id), '{"reason": "TAT expired"}');

    -- Find next stage
    SELECT * INTO next_stage 
    FROM workflow_stages 
    WHERE workflow_id = instance.workflow_id 
      AND stage_number > instance.stage_number 
    ORDER BY stage_number ASC 
    LIMIT 1;

    IF next_stage.id IS NOT NULL THEN
      -- Advance record
      UPDATE fms_records
      SET current_stage_id = next_stage.id,
          updated_at = current_now
      WHERE id = instance.record_id;

      -- Create new instance
      INSERT INTO fms_stage_instances (record_id, stage_id, status, started_at, planned_at, tat_hours)
      VALUES (
        instance.record_id, 
        next_stage.id, 
        'active', 
        current_now, 
        current_now + (COALESCE(next_stage.tat_hours, 24) || ' hours')::interval,
        next_stage.tat_hours
      );

      -- Log history
      INSERT INTO fms_stage_history (record_id, stage_id, action, old_status, new_status, notes)
      VALUES (instance.record_id, next_stage.id, 'STAGE_ADVANCED', 'active', 'active', 'Automatically transitioned due to TAT timeout.');

    ELSE
      -- Complete workflow
      UPDATE fms_records
      SET status = 'completed',
          completed_at = current_now,
          updated_at = current_now
      WHERE id = instance.record_id;

      INSERT INTO fms_stage_history (record_id, stage_id, action, old_status, new_status, notes)
      VALUES (instance.record_id, instance.stage_id, 'WORKFLOW_COMPLETED', 'active', 'completed', 'Automatically completed. No further stages.');
    END IF;

    advanced_count := advanced_count + 1;
  END LOOP;

  RETURN advanced_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Optional: Schedule the function to run every 15 minutes using pg_cron
-- IMPORTANT: pg_cron must be enabled in Supabase Database Extensions
-- Uncomment the following block if pg_cron is enabled:

/*
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('fms_tat_auto_advance', '*/15 * * * *', 'SELECT public.evaluate_and_advance_tats();');
*/
