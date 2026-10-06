import { useState } from 'react'
import { ArrowRight, Eye, Filter, Plus, Search } from 'lucide-react'
import type { RecordWithDetails, WorkflowStage } from '../lib/fmsService'
import { determineOverdueStatus } from '../lib/tatEngine'

interface RecordsTableProps {
  records: RecordWithDetails[]
  stages: WorkflowStage[]
  selectedStage: number | null
  workflowTitle: string
  onOpenCreate: () => void
  onOpenAdvance: (record: RecordWithDetails) => void
  onOpenDetails: (record: RecordWithDetails) => void
}

export function RecordsTable({
  records,
  stages,
  selectedStage,
  workflowTitle,
  onOpenCreate,
  onOpenAdvance,
  onOpenDetails,
}: RecordsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all')

  const stageMap = new Map(stages.map(s => [s.id, s]))

  // Filter records
  const filtered = records.filter(r => {
    // Stage filter
    if (selectedStage !== null) {
      const curStage = r.current_stage_id ? stageMap.get(r.current_stage_id) : null
      if (curStage?.stage_number !== selectedStage) return false
    }

    // Status filter
    if (statusFilter !== 'all' && r.status !== statusFilter) return false

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      const match =
        (r.display_record_number?.toString().includes(q) ?? false) ||
        r.record_number.toString().includes(q) ||
        r.recipient_name?.toLowerCase().includes(q) ||
        r.sender_name?.toLowerCase().includes(q) ||
        r.tracking_number?.toLowerCase().includes(q) ||
        r.courier_agent_name?.toLowerCase().includes(q) ||
        r.item_description?.toLowerCase().includes(q) ||
        r.department_name?.toLowerCase().includes(q)
      if (!match) return false
    }

    return true
  })

  return (
    <div className="table-card">
      <div className="table-toolbar">
        <div className="table-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by docket, sender, recipient, carrier, item..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="table-filters">
          <div className="filter-select-wrap">
            <Filter size={14} />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'completed')}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="completed">Completed Only</option>
            </select>
          </div>

          <button className="btn-primary" onClick={onOpenCreate}>
            <Plus size={16} />
            <span>New {workflowTitle.includes('Outward') ? 'Outward Request' : 'Inward Docket'}</span>
          </button>
        </div>
      </div>

      <div className="table-container">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <p className="empty-title">No matching courier records found</p>
            <p className="empty-desc">
              {records.length === 0
                ? 'Your workflow is ready! Create your first record or run database initialization.'
                : 'Try adjusting your search query or stage filters.'}
            </p>
            {records.length === 0 && (
              <button className="btn-primary" onClick={onOpenCreate}>
                <Plus size={16} />
                <span>Create First Record</span>
              </button>
            )}
          </div>
        ) : (
          <table className="fms-table">
            <thead>
              <tr>
                <th>Record #</th>
                <th>Sender / Dept</th>
                <th>Recipient</th>
                <th>Contents / Item</th>
                <th>Carrier & Docket</th>
                <th>Current Stage</th>
                <th>TAT / SLA</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const stage = r.current_stage_id ? stageMap.get(r.current_stage_id) : null
                const isCompleted = r.status === 'completed'
                const curInstance = r.stage_instances?.find(i => i.stage_id === stage?.id)
                let tatStatus = 'Active'
                if (curInstance) {
                  tatStatus = determineOverdueStatus(curInstance.planned_at, curInstance.completed_at)
                }

                return (
                  <tr key={r.id}>
                    <td>
                      <span className="record-num-tag">#{r.display_record_number || r.record_number || '1'}</span>
                    </td>
                    <td>
                      <div className="table-sender">
                        <strong>{r.sender_name}</strong>
                        <small>{r.department_name}</small>
                      </div>
                    </td>
                    <td>
                      <div className="table-recipient">
                        <strong>{r.recipient_name}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="item-text" title={r.item_description}>
                        {r.item_description}
                      </span>
                    </td>
                    <td>
                      <div className="carrier-docket">
                        <span>{r.courier_agent_name}</span>
                        {r.tracking_number ? (
                          <span className="docket-num font-mono">{r.tracking_number}</span>
                        ) : (
                          <span className="docket-pending">Pending</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {isCompleted ? (
                        <span className="stage-pill completed">Workflow Complete</span>
                      ) : stage ? (
                        <span className="stage-pill active">
                          Stage {stage.stage_number}: {stage.stage_name}
                        </span>
                      ) : (
                        <span className="stage-pill">Initial Stage</span>
                      )}
                    </td>
                    <td>
                      {!isCompleted && tatStatus !== 'Active' && (
                        <span className={`status-pill ${tatStatus.replace(/\s+/g, '-').toLowerCase()}`} style={{ whiteSpace: 'nowrap', padding: '4px 8px', fontSize: '11px', borderRadius: '12px' }}>
                          {tatStatus}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`status-pill ${r.status}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <small className="date-cell">
                        {new Date(r.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </small>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-cell">
                        {!isCompleted && (
                          <button
                            className="action-btn advance"
                            onClick={() => onOpenAdvance(r)}
                            title="Advance to Next Stage"
                          >
                            <span>Advance</span>
                            <ArrowRight size={13} />
                          </button>
                        )}
                        <button
                          className="action-btn view"
                          onClick={() => onOpenDetails(r)}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
