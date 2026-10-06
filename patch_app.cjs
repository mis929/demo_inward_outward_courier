const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Swap Navbar import with Sidebar
code = code.replace(/import \{ Navbar \} from '\.\/components\/Navbar'/, "import { Sidebar, FmsRoute } from './components/Sidebar'");

// 2. Change activeTab type
code = code.replace(/const \[activeTab, setActiveTab\] = useState<'outward' \| 'inward' \| 'agents' \| 'setup'>\('setup'\)/, "const [activeRoute, setActiveRoute] = useState<FmsRoute>('outward_all')");

// 3. Replace <Navbar ... /> with <Sidebar ... />
const navbarRegex = /<Navbar[\s\S]*?\/>/;
const sidebarCode = `<Sidebar
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
      />`;
code = code.replace(navbarRegex, sidebarCode);

// 4. Update the render conditions
code = code.replace(/activeTab === 'setup'/g, "activeRoute === 'admin_setup'");
code = code.replace(/activeTab === 'agents'/g, "activeRoute === 'agents'");

// Update workflow title logic
code = code.replace(/const currentWorkflowDef = activeTab === 'inward' \? inwardWfDef : outwardWfDef/, "const currentWorkflowDef = activeRoute.includes('inward') ? inwardWfDef : outwardWfDef");
code = code.replace(/const currentWorkflowStages = activeTab === 'inward' \? inwardStages : outwardStages/, "const currentWorkflowStages = activeRoute.includes('inward') ? inwardStages : outwardStages");
code = code.replace(/const workflowRecords = activeTab === 'inward' \? inwardRecords : outwardRecords/, "const workflowRecords = activeRoute.includes('inward') ? inwardRecords : outwardRecords");

// 5. Change layout classes
code = code.replace(/className="fms-app-layout"/g, 'className="fms-app-layout-grid"');
code = code.replace(/className="fms-main-content"/g, 'className="fms-main-content-grid"');

// Update CreateRecordModal prop
code = code.replace(/workflowType=\{activeTab === 'inward' \? 'inward' : 'outward'\}/g, "workflowType={activeRoute.includes('inward') ? 'inward' : 'outward'}");

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx patched for Sidebar');
