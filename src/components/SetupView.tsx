import { useState } from 'react'
import { Check, Database, ExternalLink, Globe, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react'
import { seedInitialDatabase } from '../lib/fmsService'

interface SetupViewProps {
  onRefreshAll: () => void
}

export function SetupView({ onRefreshAll }: SetupViewProps) {
  const [seeding, setSeeding] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleSeed() {
    setSeeding(true)
    setResult(null)
    try {
      const res = await seedInitialDatabase()
      setResult(res.message)
      if (res.success) {
        onRefreshAll()
      }
    } finally {
      setSeeding(false)
    }
  }

  const tables = [
    { name: 'workflows', desc: 'Outward & Inward flow templates and definitions' },
    { name: 'workflow_stages', desc: '7 Outward stages & 3 Inward tracking stages with TAT' },
    { name: 'workflow_fields', desc: 'Dynamic form field definitions and validation rules' },
    { name: 'fms_records', desc: 'Primary shipment / dispatch records table' },
    { name: 'fms_stage_instances', desc: 'Per-record stage lifecycle tracking and timestamps' },
    { name: 'fms_stage_history', desc: 'Full audit history of stage transitions' },
    { name: 'courier_agents', desc: 'Blue Dart, DTDC, DHL, Delhivery, Speed Post, FedEx' },
    { name: 'departments', desc: 'Internal departments (Finance, HR, Legal, Ops, IT)' },
    { name: 'profiles', desc: 'User profiles and authenticated operators' },
    { name: 'roles & permissions', desc: 'Role-based access control and security policies' },
    { name: 'attachments', desc: 'Uploaded dockets, airway bills, and delivery receipts' },
    { name: 'audit_logs', desc: 'Security and system change logs' },
  ]

  return (
    <div className="setup-view-wrap">
      <div className="section-header-row">
        <div>
          <h2>Database Schema & System Setup</h2>
          <p>
            Connected to Supabase project <code className="project-code">upmmsgvbtkxbjjnttrzn</code> with full TypeScript type safety.
          </p>
          <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
            <Globe size={14} style={{ color: '#2563eb' }} />
            <span style={{ color: '#64748b' }}>Live Deployment:</span>
            <a
              href="https://courierfms.vercel.app"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#2563eb', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
            >
              https://courierfms.vercel.app
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        <button className="btn-primary" onClick={handleSeed} disabled={seeding}>
          <Sparkles size={16} />
          <span>{seeding ? 'Initializing…' : 'Initialize Default Workflows & Data'}</span>
        </button>
      </div>

      {result && (
        <div className="alert-banner">
          <Check size={18} />
          <span>{result}</span>
        </div>
      )}

      <div className="schema-summary-grid">
        <div className="schema-card">
          <div className="schema-card-top">
            <Database size={18} />
            <span>Database Architecture</span>
          </div>
          <h3>Public Schema Tables</h3>
          <p>All tables are mapped directly to <code>src/types/database.ts</code>.</p>
          <div className="table-list-items">
            {tables.map(t => (
              <div key={t.name} className="table-row-item">
                <div className="table-name-tag">
                  <Check size={12} />
                  <strong>{t.name}</strong>
                </div>
                <span>{t.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="schema-card">
          <div className="schema-card-top">
            <ShieldCheck size={18} />
            <span>Type Safety & Security</span>
          </div>
          <h3>Database Types Ready</h3>
          <p>
            TypeScript definitions generated via Supabase API (52 KB / 1,795 lines).
            Full IntelliSense and type checking are enabled for all queries, inserts, and mutations.
          </p>

          <div className="code-box">
            <pre>
{`import { supabase } from './lib/supabase'
import type { Database } from './types/database'

// 100% Type-Safe Supabase Client
const { data, error } = await supabase
  .from('fms_records')
  .select('*, workflow_stages(*)')`}
            </pre>
          </div>

          <div style={{ marginTop: '20px' }}>
            <button className="btn-secondary" onClick={onRefreshAll} style={{ width: '100%' }}>
              <RefreshCw size={15} />
              <span>Refresh Workspace Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
