import { useState } from 'react'
import { ArrowRight, CheckCircle, Clock, Info, X } from 'lucide-react'
import type { RecordWithDetails, WorkflowStage } from '../lib/fmsService'
import { calculatePlannedDate } from '../lib/tatEngine'

interface AdvanceStageModalProps {
  record: RecordWithDetails | null
  stages: WorkflowStage[]
  isOpen: boolean
  onClose: () => void
  onAdvance: (recordId: string, currentStageId: string, nextStageId: string | null, notes: string) => Promise<void>
}

export function AdvanceStageModal({
  record,
  stages,
  isOpen,
  onClose,
  onAdvance,
}: AdvanceStageModalProps) {
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen || !record) return null

  const sortedStages = [...stages].sort((a, b) => a.stage_number - b.stage_number)
  const currentStageIndex = sortedStages.findIndex(s => s.id === record.current_stage_id)
  const currentStage = currentStageIndex >= 0 ? sortedStages[currentStageIndex] : null
  const nextStage = currentStageIndex >= 0 && currentStageIndex + 1 < sortedStages.length
    ? sortedStages[currentStageIndex + 1]
    : null

  const isFinalStage = !nextStage

  const currentInstance = record.stage_instances?.find(i => i.stage_id === currentStage?.id)
  const plannedAt = currentInstance?.planned_at || null

  const nextPlanned = nextStage ? new Date(calculatePlannedDate(new Date(), nextStage.tat_hours || 24)).toLocaleString() : null

  async function handleConfirm() {
    if (!record || !record.current_stage_id) return
    setLoading(true)
    try {
      await onAdvance(record.id, record.current_stage_id, nextStage ? nextStage.id : null, notes)
      setNotes('')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div>
            <h2>Complete Stage: {currentStage?.stage_name}</h2>
            <p>{record.item_description} • {record.courier_agent_name}</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="stage-transition-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'stretch' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} /> {currentStage?.stage_name} Planned
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 500, color: '#0f172a', marginTop: '4px' }}>
                {plannedAt ? new Date(plannedAt).toLocaleString() : 'Not calculated'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Info size={12} /> Automatically calculated from TAT
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                <CheckCircle size={14} /> {currentStage?.stage_name} Actual
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 500, color: '#0f172a', marginTop: '4px' }}>
                [Automatically recorded upon submission]
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                <Info size={12} /> Server timestamp will be used
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '8px' }}>
            <ArrowRight size={20} style={{ color: '#94a3b8', margin: '0 auto' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} /> {isFinalStage ? 'Workflow Completed' : `${nextStage?.stage_name} Planned`}
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 500, color: '#14532d', marginTop: '4px' }}>
                {isFinalStage ? 'Completed' : nextPlanned}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Info size={12} /> {isFinalStage ? 'Final stage sign-off' : `Automatically calculated using ${nextStage?.tat_hours}h TAT`}
              </div>
            </div>
          </div>

        </div>

        <div className="form-group" style={{ marginTop: '24px' }}>
          <label>Transition Notes / Handoff Memo</label>
          <textarea
            rows={3}
            placeholder={
              isFinalStage
                ? 'e.g., Package received and acknowledged by recipient with digital sign.'
                : 'e.g., Manifest verified and handed over to logistics partner.'
            }
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleConfirm}
            disabled={loading}
          >
            {isFinalStage ? <CheckCircle size={16} /> : <ArrowRight size={16} />}
            <span>{loading ? 'Processing...' : isFinalStage ? 'Complete Workflow' : 'Complete & Advance'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
