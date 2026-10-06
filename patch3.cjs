const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Fix state declaration
code = code.replace(/const \[activeTab, setActiveTab\] = useState<'outward' \| 'inward' \| 'agents' \| 'setup'>\('outward'\)/, "const [activeRoute, setActiveRoute] = useState<FmsRoute>('outward_all')");

// 2. Fix remaining activeTab occurrences
code = code.replace(/activeTab === 'outward'/g, "activeRoute.includes('outward')");
code = code.replace(/activeTab === 'inward'/g, "activeRoute.includes('inward')");
code = code.replace(/activeTab/g, "activeRoute.includes('inward') ? 'inward' : 'outward'");

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx patched again');
