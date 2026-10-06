import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { ArrowRight, Boxes, Check, CircleAlert, KeyRound, LayoutDashboard, PackageCheck, ShieldCheck, Truck } from 'lucide-react'
import { hasSupabaseConfig, supabase } from './lib/supabase'
import {
  advanceRecordStage,
  createRecord,
  DEFAULT_WORKFLOWS,
  getCourierAgents,
  getDepartments,
  getRecords,
  getWorkflows,
  seedInitialDatabase,
} from './lib/fmsService'
import type { CourierAgent, Department, RecordWithDetails, Workflow, WorkflowStage } from './lib/fmsService'
import { Sidebar, FmsRoute } from './components/Sidebar'
import { StatsCards } from './components/StatsCards'
import { StagePipeline } from './components/StagePipeline'
import { RecordsTable } from './components/RecordsTable'
import { CreateRecordModal } from './components/CreateRecordModal'
import type { RecordFormValues } from './components/CreateRecordModal'
import { AdvanceStageModal } from './components/AdvanceStageModal'
import { RecordDetailsModal } from './components/RecordDetailsModal'
import { CourierAgentsView } from './components/CourierAgentsView'
import { SetupView } from './components/SetupView'

const workflowsList = [
  { title: 'Outward Courier', count: '7 stages', icon: Truck, stages: ['Request', 'Assign', 'Prepare', 'Dispatch Planning', 'Pick Up', 'Tracking', 'Acknowledgement'] },
  { title: 'Inward Tracking', count: '3 stages', icon: PackageCheck, stages: ['Docket Received', 'Track Shipment', 'Hand Over Material'] },
]

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, value) => setSession(value))
    return () => subscription.unsubscribe()
  }, [])

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError('')
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (authError) setError('Sign in failed. Check your credentials or contact your administrator.')
  }

  async function resetPassword() {
    if (!supabase || !email) {
      setError('Enter your email address first.')
      return
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email)
    setError(resetError ? 'Could not send the reset email. Please try again.' : 'Password reset email sent.')
  }

  if (!hasSupabaseConfig) return <SetupScreen />
  if (loading) return <main className="loading-screen"><span className="spinner" />Restoring your session…</main>
  if (!session) {
    return (
      <LoginScreen
        email={email}
        password={password}
        setEmail={setEmail}
        setPassword={setPassword}
        onSubmit={signIn}
        onReset={resetPassword}
        busy={busy}
        error={error}
      />
    )
  }

  return (
    <WorkspaceScreen
      email={session.user.email ?? 'Signed in'}
      userId={session.user.id}
      onSignOut={() => void supabase?.auth.signOut()}
    />
  )
}

function WorkspaceScreen({
  email,
  userId,
  onSignOut,
}: {
  email: string
  userId: string
  onSignOut: () => void
}) {
  const [activeRoute, setActiveRoute] = useState<FmsRoute>('outward_all')
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [stages, setStages] = useState<WorkflowStage[]>([])
  const [courierAgents, setCourierAgents] = useState<CourierAgent[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [records, setRecords] = useState<RecordWithDetails[]>([])
  const [selectedStage, setSelectedStage] = useState<number | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [advanceRecord, setAdvanceRecord] = useState<RecordWithDetails | null>(null)
  const [detailsRecord, setDetailsRecord] = useState<RecordWithDetails | null>(null)

  // Load initial workspace data
  async function loadData() {
    setRefreshing(true)
    try {
      const [{ workflows: wf, stages: st }, agents, depts, recs] = await Promise.all([
        getWorkflows(),
        getCourierAgents(),
        getDepartments(),
        getRecords(),
      ])

      setWorkflows(wf)
      setStages(st)
      setCourierAgents(agents)
      setDepartments(depts)
      setRecords(recs)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  // Current active workflow and its stages
  const currentWorkflowDef = activeRoute.includes('outward') ? DEFAULT_WORKFLOWS[0] : DEFAULT_WORKFLOWS[1]
  const currentDbWorkflow = workflows.find(w =>
    activeRoute.includes('outward') ? w.name.toLowerCase().includes('outward') : w.name.toLowerCase().includes('inward')
  )

  const currentWorkflowStages = stages.filter(s =>
    currentDbWorkflow ? s.workflow_id === currentDbWorkflow.id : true
  )

  // Map stages display info
  const stageInfoList = currentWorkflowDef.stages.map(defStage => {
    const dbStage = currentWorkflowStages.find(s => s.stage_number === defStage.number)
    return {
      number: defStage.number,
      name: dbStage?.stage_name || defStage.name,
      tat: dbStage?.tat_hours ?? defStage.tat,
      desc: dbStage?.description || defStage.desc,
    }
  })

  // Filter records by current workflow type
  const workflowRecords = records.filter(r => {
    if (currentDbWorkflow) return r.workflow_id === currentDbWorkflow.id
    // Fallback: check metadata type
    const meta = (typeof r.metadata === 'object' && r.metadata !== null) ? (r.metadata as Record<string, unknown>) : {}
    return (meta.workflow_type as string) === (activeRoute.includes('inward') ? 'inward' : 'outward')
  })

  // Compute stage counts
  const stageCounts: Record<number, number> = {}
  const stageIdToNum = new Map(currentWorkflowStages.map(s => [s.id, s.stage_number]))
  for (const r of workflowRecords) {
    if (r.status === 'completed') continue
    const num = r.current_stage_id ? stageIdToNum.get(r.current_stage_id) || 1 : 1
    stageCounts[num] = (stageCounts[num] || 0) + 1
  }

  // Summary statistics
  const totalCount = workflowRecords.length
  const activeCount = workflowRecords.filter(r => r.status === 'active').length
  const completedCount = workflowRecords.filter(r => r.status === 'completed').length
  const overdueCount = workflowRecords.filter(r => r.status === 'overdue' || r.status === 'draft').length

  // Create record handler
  async function handleCreateRecord(formValues: RecordFormValues) {
    let wfId = currentDbWorkflow?.id
    let stId = currentWorkflowStages.find(s => s.stage_number === 1)?.id
    let fmsTypeId = currentDbWorkflow?.fms_type_id

    // If database hasn't been seeded yet, auto-seed first!
    if (!wfId || !stId || !fmsTypeId) {
      await seedInitialDatabase()
      const { workflows: newWf, stages: newSt } = await getWorkflows()
      setWorkflows(newWf)
      setStages(newSt)
      const targetWf = newWf.find(w =>
        activeRoute.includes('outward') ? w.name.toLowerCase().includes('outward') : w.name.toLowerCase().includes('inward')
      )
      wfId = targetWf?.id
      fmsTypeId = targetWf?.fms_type_id
      stId = newSt.find(s => s.workflow_id === wfId && s.stage_number === 1)?.id
    }

    if (!wfId || !stId || !fmsTypeId) {
      alert('Workflow configuration could not be determined. Please run Database Setup initialization.')
      return
    }

    const matchedDept = departments.find(d => d.name === formValues.department_name)

    const existingNumbers = workflowRecords.map(r => {
      const num = Number(r.display_record_number)
      return isNaN(num) ? 0 : num
    })
    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : (activeRoute.includes('outward') ? 616 : 927)

    const res = await createRecord({
      workflow_id: wfId,
      initial_stage_id: stId,
      fms_type_id: fmsTypeId,
      department_id: matchedDept?.id,
      user_id: userId,
      metadata: {
        ...formValues,
        sheet_record_number: nextNumber,
        workflow_type: activeRoute.includes('inward') ? 'inward' : 'outward',
        created_at_client: new Date().toISOString(),
      },
    })

    if (!res.success) {
      alert(`Error creating record: ${res.error}`)
      return
    }

    await loadData()
  }

  // Advance stage handler
  async function handleAdvanceStage(
    recordId: string,
    currentStageId: string,
    nextStageId: string | null,
    notes: string
  ) {
    const res = await advanceRecordStage({
      record_id: recordId,
      current_stage_id: currentStageId,
      next_stage_id: nextStageId,
      notes,
      user_id: userId,
    })

    if (!res.success) {
      alert(`Error advancing stage: ${res.error}`)
      return
    }

    await loadData()
  }

  return (
    <div className="fms-app-layout-grid">
      <Sidebar
        activeRoute={activeRoute}
        onSelectRoute={route => {
          setActiveRoute(route)
          setSelectedStage(null)
          if (route === 'outward_new' || route === 'inward_new') {
            setIsCreateOpen(true)
            setActiveRoute(route === 'outward_new' ? 'outward_all' : 'inward_all')
          }
        }}
        userEmail={email}
        onSignOut={onSignOut}
        onRefresh={loadData}
        refreshing={refreshing}
      />

      <main className="fms-main-content-grid">
        {activeRoute === 'admin_setup' ? (
          <SetupView onRefreshAll={loadData} />
        ) : activeRoute === 'agents' ? (
          <CourierAgentsView agents={courierAgents} onRefresh={loadData} />
        ) : (
          <>
            {/* KPI Summary Cards */}
            <StatsCards
              total={totalCount}
              active={activeCount}
              completed={completedCount}
              overdue={overdueCount}
            />

            {/* Visual Workflow Pipeline Stepper */}
            <StagePipeline
              stages={stageInfoList}
              selectedStage={selectedStage}
              onSelectStage={setSelectedStage}
              stageCounts={stageCounts}
            />

            {/* Records Data Table */}
            <RecordsTable
              records={workflowRecords}
              stages={currentWorkflowStages}
              selectedStage={selectedStage}
              workflowTitle={currentWorkflowDef.name}
              onOpenCreate={() => setIsCreateOpen(true)}
              onOpenAdvance={r => setAdvanceRecord(r)}
              onOpenDetails={r => setDetailsRecord(r)}
            />
          </>
        )}
      </main>

      {/* New Record Modal */}
      <CreateRecordModal
        workflowType={activeRoute.includes('inward') ? 'inward' : 'outward'}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateRecord}
        courierAgents={courierAgents}
        departments={departments}
      />

      {/* Advance Stage Modal */}
      <AdvanceStageModal
        record={advanceRecord}
        stages={currentWorkflowStages}
        isOpen={Boolean(advanceRecord)}
        onClose={() => setAdvanceRecord(null)}
        onAdvance={handleAdvanceStage}
      />

      {/* Record Details Modal */}
      <RecordDetailsModal
        record={detailsRecord}
        stages={currentWorkflowStages}
        isOpen={Boolean(detailsRecord)}
        onClose={() => setDetailsRecord(null)}
      />
    </div>
  )
}

function SetupScreen() {
  return (
    <main className="setup-wrap">
      <header className="brand-row">
        <div className="brand-icon">
          <Boxes size={21} />
        </div>
        <div>
          <b>Courier FMS</b>
          <small>FLOW MANAGEMENT SYSTEM</small>
        </div>
        <span className="environment-pill">
          <span /> Setup required
        </span>
      </header>
      <section className="setup-hero">
        <div className="eyebrow">
          <span className="eyebrow-mark" /> IMPLEMENTATION WORKSPACE
        </div>
        <h1>
          Your courier workflows,
          <br />
          <span>ready for the next step.</span>
        </h1>
        <p className="hero-copy">
          The application foundation is in place. Connect the existing Supabase project and share its schema map so the
          workflows can be wired to your real data and permissions.
        </p>
        <div className="notice">
          <CircleAlert size={18} />
          <div>
            <strong>Backend connection is not configured</strong>
            <p>No Supabase URL or public anon key was found in this workspace.</p>
          </div>
        </div>
        <div className="workflow-grid">
          {workflowsList.map(({ title, count, icon: Icon, stages }) => (
            <article className="workflow-card" key={title}>
              <div className="workflow-top">
                <div className="workflow-icon">
                  <Icon size={19} />
                </div>
                <span>{count}</span>
              </div>
              <h2>{title}</h2>
              <div className="stage-list">
                {stages.map((stage, i) => (
                  <div className="stage" key={stage}>
                    <span className={i === 0 ? 'stage-dot current' : 'stage-dot'}>
                      {i === 0 ? <Check size={10} /> : null}
                    </span>
                    <span>{stage}</span>
                    {i < stages.length - 1 && <i />}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
        <div className="next-step">
          <div className="next-icon">
            <KeyRound size={18} />
          </div>
          <div>
            <strong>Connect the existing Supabase project</strong>
            <p>
              Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> to a local <code>.env</code>.
            </p>
          </div>
          <ArrowRight className="next-arrow" size={19} />
        </div>
      </section>
      <footer className="page-footer">
        <span>
          SECURE BY DESIGN <ShieldCheck size={14} />
        </span>
        <span>INDIA · ASIA/KOLKATA</span>
      </footer>
    </main>
  )
}

function LoginScreen({
  email,
  password,
  setEmail,
  setPassword,
  onSubmit,
  onReset,
  busy,
  error,
}: {
  email: string
  password: string
  setEmail: (value: string) => void
  setPassword: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onReset: () => void
  busy: boolean
  error: string
}) {
  return (
    <main className="login-layout">
      <section className="login-brand">
        <div className="brand-row">
          <div className="brand-icon">
            <Boxes size={21} />
          </div>
          <div>
            <b>Courier FMS</b>
            <small>FLOW MANAGEMENT SYSTEM</small>
          </div>
        </div>
        <div className="login-brand-copy">
          <span>ONE FLOW, FULL VISIBILITY</span>
          <h1>
            Every dispatch.
            <br />
            Every handover.
            <br />
            <em>One clear view.</em>
          </h1>
          <p>Manage your courier operations from the first request through final acknowledgement.</p>
        </div>
        <span className="login-footer">OPERATIONS · TRACKING · CONTROL</span>
      </section>
      <section className="login-panel">
        <form onSubmit={onSubmit} className="login-form">
          <div className="form-symbol">
            <LayoutDashboard size={20} />
          </div>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h2>Welcome back</h2>
          <p className="login-intro">Sign in to continue to your operations.</p>
          <label>
            Email address
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </label>
          {error && <div className="form-message">{error}</div>}
          <button className="primary-button" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
            <ArrowRight size={16} />
          </button>
          <button type="button" className="text-button" onClick={onReset}>
            Forgot password?
          </button>
          <div className="login-security">
            <ShieldCheck size={15} /> Protected with Supabase authentication
          </div>
        </form>
      </section>
    </main>
  )
}
