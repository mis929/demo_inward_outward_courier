import { Boxes, LogOut, PackageCheck, RefreshCw, Settings, Truck, Users, LayoutDashboard, CheckSquare, Clock, AlertTriangle, Activity, Database } from 'lucide-react'

export type FmsRoute = 'dashboard' | 'outward_new' | 'outward_all' | 'outward_my' | 'inward_new' | 'inward_all' | 'inward_my' | 'tasks_my' | 'tasks_due' | 'tasks_overdue' | 'tasks_escalations' | 'control_live' | 'control_sla' | 'control_exceptions' | 'reports' | 'admin_master' | 'admin_setup' | 'agents'

interface SidebarProps {
  activeRoute: FmsRoute
  onSelectRoute: (route: FmsRoute) => void
  userEmail: string
  onSignOut: () => void
  onRefresh?: () => void
  refreshing?: boolean
}

export function Sidebar({ activeRoute, onSelectRoute, userEmail, onSignOut, onRefresh, refreshing }: SidebarProps) {
  return (
    <aside className="fms-sidebar">
      <div className="sidebar-brand">
        <Boxes size={22} color="#3b82f6" />
        <div>
          <b>PLANT COURIER</b>
          <small>FMS CONTROL SYSTEM</small>
        </div>
      </div>

      <nav className="sidebar-nav">
        
        <div className="sidebar-group">
          <button className={`sidebar-item ${activeRoute === 'dashboard' ? 'active' : ''}`} onClick={() => onSelectRoute('dashboard')}>
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </button>
        </div>

        <div className="sidebar-group">
          <div className="sidebar-group-title">Outward</div>
          <button className={`sidebar-item ${activeRoute === 'outward_new' ? 'active' : ''}`} onClick={() => onSelectRoute('outward_new')}>
            <Truck size={16} /><span>New Request</span>
          </button>
          <button className={`sidebar-item ${activeRoute === 'outward_all' ? 'active' : ''}`} onClick={() => onSelectRoute('outward_all')}>
            <Database size={16} /><span>All Outward</span>
          </button>
        </div>

        <div className="sidebar-group">
          <div className="sidebar-group-title">Inward</div>
          <button className={`sidebar-item ${activeRoute === 'inward_new' ? 'active' : ''}`} onClick={() => onSelectRoute('inward_new')}>
            <PackageCheck size={16} /><span>New Inward</span>
          </button>
          <button className={`sidebar-item ${activeRoute === 'inward_all' ? 'active' : ''}`} onClick={() => onSelectRoute('inward_all')}>
            <Database size={16} /><span>All Inward</span>
          </button>
        </div>

        <div className="sidebar-group">
          <div className="sidebar-group-title">Tasks</div>
          <button className={`sidebar-item ${activeRoute === 'tasks_my' ? 'active' : ''}`} onClick={() => onSelectRoute('tasks_my')}>
            <CheckSquare size={16} /><span>My Tasks</span>
          </button>
          <button className={`sidebar-item ${activeRoute === 'tasks_overdue' ? 'active' : ''}`} onClick={() => onSelectRoute('tasks_overdue')}>
            <AlertTriangle size={16} /><span>Overdue</span>
          </button>
        </div>

        <div className="sidebar-group">
          <div className="sidebar-group-title">Control Tower</div>
          <button className={`sidebar-item ${activeRoute === 'control_live' ? 'active' : ''}`} onClick={() => onSelectRoute('control_live')}>
            <Activity size={16} /><span>Live Operations</span>
          </button>
          <button className={`sidebar-item ${activeRoute === 'control_sla' ? 'active' : ''}`} onClick={() => onSelectRoute('control_sla')}>
            <Clock size={16} /><span>SLA / TAT</span>
          </button>
        </div>

        <div className="sidebar-group">
          <div className="sidebar-group-title">Admin</div>
          <button className={`sidebar-item ${activeRoute === 'agents' ? 'active' : ''}`} onClick={() => onSelectRoute('agents')}>
            <Users size={16} /><span>Courier Partners</span>
          </button>
          <button className={`sidebar-item ${activeRoute === 'admin_setup' ? 'active' : ''}`} onClick={() => onSelectRoute('admin_setup')}>
            <Settings size={16} /><span>Database Setup</span>
          </button>
        </div>
      </nav>

      <div className="sidebar-user">
        {onRefresh && (
          <button className="sidebar-item" onClick={onRefresh} disabled={refreshing} style={{ color: '#60a5fa' }}>
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Sync Database'}</span>
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', padding: '0 12px' }}>
          <span style={{ width: '24px', height: '24px', background: '#334155', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
            {userEmail.charAt(0).toUpperCase()}
          </span>
          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{userEmail}</span>
        </div>
        <button className="sidebar-item" onClick={onSignOut}>
          <LogOut size={16} /><span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
