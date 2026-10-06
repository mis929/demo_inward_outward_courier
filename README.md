# 📦 Courier FMS (Flow Management System)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-courierfms.vercel.app-2563eb?style=for-the-badge&logo=googlechrome&logoColor=white)](https://courierfms.vercel.app)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://courierfms.vercel.app)
[![Database](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Framework](https://img.shields.io/badge/Framework-React%2019%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)

---

## 🌐 Live Application & Deployment

- 🚀 **Live Production URL:** **[https://courierfms.vercel.app](https://courierfms.vercel.app)**
- ⚡ **One-Click Deploy to Vercel:**  
  [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmis929%2Fdemo_inward_outward_courier)

---

## 📖 Overview

**Courier FMS** is an enterprise-grade Flow Management System engineered for tracking corporate inward shipments and multi-stage outward courier dispatches with end-to-end SLA governance, real-time stage progression, and complete audit history.

Powered by **React 19**, **Vite**, **TypeScript**, and **Supabase (PostgreSQL with RLS)**.

---

## ✨ Key Features & Workflows

### 🚚 1. Outward Courier Workflow (7 Stages)
1. **Request** – Sender initiates dispatch with department code, recipient details, destination city, and priority.
2. **Assign** – Logistics team assigns courier partner (Blue Dart, DTDC, DHL, Delhivery, Speed Post, FedEx) and generates Docket / AWB number.
3. **Prepare** – Consignment packaging, labeling, weight verification, and invoice validation.
4. **Dispatch Planning** – Scheduling pickup window, transit route, and carrier manifest.
5. **Pick Up** – Courier executive pickup verification and handover stamp.
6. **Tracking** – In-transit tracking with real-time checkpoint timestamps and SLA monitoring.
7. **Acknowledgement** – Proof of Delivery (POD) signed receipt confirmation.

### 📥 2. Inward Courier Tracking (3 Stages)
1. **Docket Received** – Reception / security desk registers arriving consignment and logs docket number.
2. **Track Shipment** – Consignment logged into central mailroom inventory and tagged with destination department/employee.
3. **Hand Over Material** – Material physically handed over to recipient employee with signature/confirmation.

### 🏢 3. Courier Partner Directory
- Direct tracking integration links for major courier services (Blue Dart, DTDC, DHL Express, Delhivery, India Post / Speed Post, FedEx).
- SLA monitoring and performance metrics per vendor.

### 🔐 4. Enterprise Security & Architecture
- **Supabase PostgreSQL** with full Row-Level Security (RLS) policies.
- **Strict TypeScript Schema Mapping** (`src/types/database.ts`) generated directly from database.
- **Audit Logging** – Full lifecycle transition history stored in `fms_stage_history`.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS, Modern CSS Custom Properties
- **Icons:** Lucide React
- **Backend & Database:** Supabase (PostgreSQL, Supabase Auth, Storage)
- **Deployment:** Vercel SPA (`vercel.json`)

---

## 🚀 Getting Started Locally

### 1. Clone the repository
```bash
git clone https://github.com/mis929/demo_inward_outward_courier.git
cd demo_inward_outward_courier
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Build for production
```bash
npm run build
```

---

## 🔗 Quick Links

- **Live Application:** [https://courierfms.vercel.app](https://courierfms.vercel.app)
- **GitHub Repository:** [https://github.com/mis929/demo_inward_outward_courier](https://github.com/mis929/demo_inward_outward_courier)
