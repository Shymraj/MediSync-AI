# MediSync AI – Intelligent Hospital Resource Management & Clinical Coordination Platform

[![Tests](https://img.shields.io/badge/tests-134%20passed-brightgreen.svg)]()
[![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)]()
[![License](https://img.shields.io/badge/License-Proprietary%20%2F%20Hackathon-purple.svg)]()

> **MediSync AI** is a real-time, event-driven hospital operations platform connecting **Hospital Administrators**, **Attending Doctors**, **Bedside Nurses**, **Emergency Command Centers**, and **Patients**. It synchronizes bed availability, clinical orders, equipment telemetry, step-down transfers, and emergency triage to eliminate administrative friction and save lives.

---

## Table of Contents
1. [Problem Statement](#problem-statement)
2. [The MediSync AI Solution](#the-medisync-ai-solution)
3. [Key Features by Role](#key-features-by-role)
4. [Technology Stack](#technology-stack)
5. [System Architecture](#system-architecture)
6. [Prerequisites & Environment Configuration](#prerequisites--environment-configuration)
7. [Installation & Setup](#installation--setup)
8. [Running the Application](#running-the-application)
9. [Pre-Seeded Demo Accounts](#pre-seeded-demo-accounts)
10. [Automated Testing & Verification](#automated-testing--verification)
11. [Security, Privacy & RBAC](#security-privacy--rbac)
12. [Known Limitations & Future Scope](#known-limitations--future-scope)

---

## Problem Statement

Hospitals face acute operational challenges during daily operations and emergency surges:
- **Siloed Dashboards & Phantom Beds**: Admins, physicians, and nursing teams frequently look at conflicting bed occupancy numbers, leading to accidental double-booking or delays in admitting emergency patients.
- **Delayed Bed Turnover**: Discharged patients vacate beds, but nursing and housekeeping teams are not alerted in real time, leaving sanitized beds idle for hours.
- **Resource Bottlenecks**: Critical equipment like ventilators, infusion pumps, and ICU monitors are tracked through manual paperwork, causing delays during code emergencies.
- **Disconnected Handovers**: Patient step-down transfers from ICU to general wards face communication breakdowns and lack closed-loop nurse confirmations.

---

## The MediSync AI Solution

MediSync AI addresses these failures through a **single source of truth** architecture powered by an event-driven SQLite WAL database and bi-directional WebSockets:
- **Atomic Bed Locking**: Zero duplicate bed allocations via server-enforced `HTTP 409 Conflict` prevention.
- **Closed-Loop Turnaround**: Physician discharge automatically dispatches a 6-stage terminal sanitization and linen turnover task to the nursing task board.
- **Real-Time Command Dispatch**: Emergency Command Center matches incoming trauma patients with available ICU beds and calibrated ventilators in seconds.
- **Digital Twin & Clinical Deterioration Radar**: Tracks modified early warning scores (MEWS), vitals trajectory, and serial troponins to anticipate deterioration before code arrest occurs.
- **ABDM & HL7 FHIR Interoperability**: FHIR R4-ready health data exchange architecture with Ayushman Bharat Digital Mission (ABDM) consent artefact generation.

---

## Key Features by Role

### 1. Hospital Administrator
- **Operational Census Dashboard**: Real-time bed occupancy, department utilization, and nurse-to-patient staffing ratios.
- **Resource Allocation Gateway**: One-click review and physical locking of hospital equipment requisitions.
- **Hospital Digital Twin & Simulation Lab**: What-if emergency surge modeling and disaster resource buffer stress-testing.
- **Workflow Automation Center**: Configurable clinical triggers, approval gates, and automated turnover escalation rules.

### 2. Attending Doctor (31 Active Modules)
- **Clinical Intake & EMR Hub**: View assigned patients, diagnoses, allergies, and digital twin trajectories.
- **Clinical Decision Timeline & Deterioration Radar**: Serial vitals comparison (Admission vs. Current) and 4-tier MEWS risk classification.
- **Electronic Prescribing & Diagnostic Lab Intelligence**: Critical panic value alerts, ABG arterial blood gas tracking, and contraindication screening.
- **Inter-Ward Transfers & Step-Down Approvals**: Physician sign-off for ICU-to-ward transfers with automatic bed vacating.

### 3. Bedside Nurse
- **Prioritized Bedside Worklist**: STAT doctor orders, medication administration, and intake checks.
- **6-Stage Bed Turnover Engine**: `Occupied` &rarr; `Discharged` &rarr; `Cleaning` &rarr; `Equipment Check` &rarr; `Nurse Confirmation` &rarr; `Ready`.
- **Closed-Loop Telemetry Recording**: Record vitals at the bedside; system automatically updates the patient's twin and flags abnormal metrics.

### 4. Emergency Command Center
- **Code Emergency Triage**: Level 1 (Code Red), Level 2 (Code Yellow), and Level 3 incident prioritization.
- **Algorithmic Resource Matching**: Automated matching of acute trauma patients to certified ICU beds, wall $O_2$, and specialized surgeons.
- **Human-in-the-Loop Safety Gate**: Requires authenticated clinician sign-off before physical resource locking.

### 5. Patient & Citizen Portal
- **Outpatient Services**: OPD token generation, specialist appointments, and digital prescription access.
- **Emergency SOS Dispatch**: Geo-aware hospital bed availability search and direct intake requests.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite v8.4.0, Tailwind CSS v4, Lucide React Icons |
| **Backend** | Node.js (ES Modules), Express v5.3, Socket.IO v4.8 |
| **Database** | SQLite3 via `better-sqlite3` (WAL Mode, Concurrency PRAGMAs, Auto-Migrations) |
| **Authentication** | JWT (JSON Web Tokens) with Role-Based Access Control (RBAC), Google OAuth 2.0 |
| **Real-Time** | WebSocket rooms (`join_hospital`, `join_role`, `join_doctor`, `join_ward`), Heartbeat RTT latency |
| **Healthcare Standards** | HL7 FHIR R4 JSON Bundles, ABDM Consent Artefacts, ICD-10 Clinical Coding |
| **Testing** | Node.js Native Test Runner (`node:test`, `node:assert/strict`) — 134 automated tests |

---

## System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend Application (React 19 + TypeScript + Vite)"]
        UI_Admin[Hospital Admin]
        UI_Doctor[Doctor Dashboard]
        UI_Nurse[Nurse Station]
        UI_ER[Emergency Command]
        UI_Patient[Patient Portal]
    end

    subgraph ServiceLayer["State & Communication Layer"]
        AppContext[AppContext & ClinicalAudioSynthesizer]
        HospitalDataService[HospitalDataService]
        SocketClient[Socket.IO Client]
    end

    subgraph ServerLayer["Backend API Server (Express 5 + Socket.IO)"]
        AuthGate[JWT & RBAC Gatekeeper]
        REST_APIs[REST API Endpoints: Beds, Patients, Tasks, Transfers, Workflows]
        SocketServer[Socket.IO Broadcast Engine]
        AuditEngine[Persistent Audit Logger]
    end

    subgraph DataLayer["Storage & Interop Layer"]
        DB[(SQLite WAL Database / medisync.db)]
        FHIR_Engine[HL7 FHIR R4 & ABDM Consent Gateway]
    end

    ClientLayer <--> ServiceLayer
    ServiceLayer <--> |HTTP REST + WebSockets| ServerLayer
    ServerLayer <--> DataLayer
```

---

## Prerequisites & Environment Configuration

### Prerequisites
- **Node.js**: v20.x or v22.x LTS (compatible with Node 20+)
- **npm**: v10.x+
- **Operating System**: Windows, macOS, or Linux

### Environment Configuration (`.env`)
The project comes pre-configured with local development defaults in `.env`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=medisync_enterprise_jwt_secret_2026_super_secure
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/medisync
GOOGLE_CLIENT_ID=783921048192-k8h9f0a2b4c6e8g0i2k4m6o8q0s2u4w6.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=783921048192-k8h9f0a2b4c6e8g0i2k4m6o8q0s2u4w6.apps.googleusercontent.com
```

---

## Installation & Setup

1. **Clone or Navigate to the Repository**:
   ```bash
   cd D:\Medisync
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Database Initialization**:
   The database auto-seeds on first server startup via [server/db.js](file:///d:/Medisync/server/db.js). No manual migration commands are required. The SQLite database is created at `server/medisync.db`.

---

## Running the Application

### Option A: Simultaneous Start (Recommended)
Launch both the backend API server (`http://localhost:5000`) and Vite frontend (`http://localhost:5173`) in a single command:
```bash
npm start
```

### Option B: Separate Terminals
- **Terminal 1 – Backend Express Server**:
  ```bash
  npm run server
  ```
- **Terminal 2 – Frontend Development Server**:
  ```bash
  npm run dev
  ```

Open your browser to `http://localhost:5173`.

---

## Pre-Seeded Demo Accounts

For hackathon demonstrations, the login modal provides 1-click authentication for pre-configured accounts:

| Role | Name | Demo Identifier / Email | Features Accessible |
| :--- | :--- | :--- | :--- |
| **Hospital Administrator** | Dr. Vasanth Kumar | `admin.vasanth@medisync.gov.in` | Hospital Census, Bed Inventory, Resource Approvals, Digital Twin Lab, Automation |
| **Attending Physician** | Dr. Sundaramoorthy M. | `dr.sundar@medisync.gov.in` | 31 Doctor Modules, EMR, Clinical Orders, Step-Down Transfers, Discharge |
| **Bedside Nurse** | Nurse Deepa R. / Revathi S. | `deepa.nurse@medisync.gov.in` | Bedside Task List, 6-Stage Bed Turnover, Vitals Telemetry Recording |
| **Patient / Citizen** | Karthik Subramanian | `karthik.subramanian@gmail.com` | OPD Tokens, Appointments, Digital Twin Care Timeline, Emergency SOS |
| **MediSync Super Admin** | System Administrator | `medisync` (Access via `#/admin-login`) | Statewide Network Health, Hospital Onboarding Governance |

*Note: In the demo environment, clicking any account tile in the login dialog immediately authenticates via simulated Google OAuth without password entry.*

---

## Automated Testing & Verification

MediSync AI contains an enterprise-grade automated test suite with **134 passing tests**:

```bash
npm test
```

### Test Suite Structure
1. **API Health & Endpoints** (`test/api-health.test.js`): 30 tests
2. **Doctor Dashboard 15 Modules** (`test/doctor-dashboard-modules.test.js`): 15 tests
3. **Cross-Dashboard Integration** (`test/cross-dashboard-integration.test.js`): 14 tests
4. **End-to-End Clinical Workflows** (`test/workflows-e2e.test.js`): 27 tests
5. **Real-Time Socket Synchronization** (`test/realtime-socket.test.js`): 6 tests
6. **Security, RBAC & Multi-Tenant Isolation** (`test/security-isolation.test.js`): 12 tests
7. **Phase 16 E2E Quality & Workflow Suite** (`test/phase16-e2e-quality.test.js`): 30 tests

### Production Build
```bash
npm run build
```
Executes `tsc -b && vite build` verifying 0 TypeScript errors across 2,281 project modules.

---

## Security, Privacy & RBAC

- **Role-Based Authorization**: Middleware functions `authenticateToken` and `requireRole(['admin', 'doctor', 'nurse'])` guard protected REST endpoints.
- **Multi-Tenant Isolation**: Hospital IDs partition records at the database query level; requests for Hospital 1 cannot read Hospital 2 telemetry.
- **SQL Injection Prevention**: All database access uses parameterized SQL statements via `better-sqlite3`.
- **Human-in-the-Loop Safeguards**: High-risk emergency resource allocations and workflow triggers require clinician authorization.
- **HIPAA/ABDM Privacy Compliance**: Demo patient records use anonymized, synthetic identifiers (`PT-8941`, `EMG-8991`) with synthetic physiological ranges.

---

## Known Limitations & Future Scope

### Known Limitations
- **Local SQLite Storage**: Production scale with millions of daily transactions will benefit from migrating to PostgreSQL with Redis pub/sub.
- **Simulated ABDM Gateway**: Interoperability connects to local mock ABDM endpoints rather than India's production National Health Authority (NHA) Sandbox.
- **Single Active Audio Context**: Clinical chimes require user interaction on initial page load to bypass browser autoplay policies.

### Future Roadmap
1. **IoT Telemetry Hardware Connectors**: Direct MQTT ingestion from bedside GE, Philips, and Mindray patient monitors.
2. **Federated Multimodal Clinical LLM**: On-premise fine-tuned open-source medical LLMs (e.g. Med-PaLM 2 / BioMistral) for offline diagnostics.
3. **Ambulance Telematics Integration**: Live GPS tracking and real-time pre-arrival vitals streaming to the Emergency Command Center.

---

## Authors & Acknowledgments

Developed for the Healthcare AI & Resource Management Hackathon.  
Built with precision for healthcare providers, doctors, and patients.
