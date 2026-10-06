const fs = require('fs');
let code = fs.readFileSync('src/styles.css', 'utf8');

if (!code.includes('.fms-app-layout-grid')) {
  const newCss = `
/* --- NEW SIDEBAR LAYOUT --- */
.fms-app-layout-grid {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
}
.fms-sidebar {
  width: 260px;
  background: #0f172a;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  border-right: 1px solid #1e293b;
}
.sidebar-brand {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #fff;
  border-bottom: 1px solid #1e293b;
  background: #020617;
}
.sidebar-brand b { font-size: 15px; font-weight: 700; letter-spacing: 0.5px; }
.sidebar-brand small { display: block; font-size: 9px; color: #64748b; letter-spacing: 1px; }

.sidebar-nav {
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
  flex-grow: 1;
}
.sidebar-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sidebar-group-title {
  font-size: 10px;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 6px;
  padding: 0 8px;
}
.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 6px;
  color: #cbd5e1;
  font-size: 13px;
  cursor: pointer;
  border: 0;
  background: transparent;
  width: 100%;
  text-align: left;
  transition: all 0.2s;
}
.sidebar-item:hover { background: #1e293b; color: #fff; }
.sidebar-item.active { background: #3b82f6; color: #fff; font-weight: 500; }
.sidebar-user {
  padding: 16px;
  border-top: 1px solid #1e293b;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.fms-main-content-grid {
  flex-grow: 1;
  max-width: none;
  overflow-y: auto;
  padding: 24px 32px 60px;
  display: flex;
  flex-direction: column;
}
`;
  fs.writeFileSync('src/styles.css', code + newCss);
  console.log('CSS updated');
}
