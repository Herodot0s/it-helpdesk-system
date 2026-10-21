# IT Help Desk Ticketing System

A desktop IT service desk application built with **Electron**, **Tailwind CSS / DaisyUI**, and **local JSON file persistence** for Quezon City University (QCU) Systems Integration and Architecture 1 (SIA 1).

---

## 🎯 Features

- **Role-Separated Access**:
  - **Student & Faculty Support Portal**: Auto-resolves requester credentials, validates problem descriptions, assigns unique auto-incrementing Ticket IDs (`T001`, `T002`, ...), and displays personal ticket submission history with status badges.
  - **IT Support Operations Center**: Full queue overview with real-time statistics (Total, Open, In Progress, Resolved), keyword search, category/status filters, and live triage inspector with resolution notes.
- **Local JSON File Persistence**: All ticket records and user accounts persist across app restarts using local `tickets.json` and `accounts.json` stores.
- **Zero Heavy Frameworks**: Pure Vanilla JavaScript with safe IPC boundaries using Electron `contextBridge` (`preload.js`).
- **Automated Self-Check Suite**: Assert-based regression tests verifying backend logic, ID generation, file persistence, accessibility, and UI contracts.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)

### Installation & Run

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Herodot0s/it-helpdesk-system.git
   cd it-helpdesk-system
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the application**:
   ```bash
   npm start
   ```

4. **Run automated self-checks**:
   ```bash
   npm test
   ```

---

## 📂 Project Structure

```text
├── main.js                  # Electron main process (IPC handlers & JSON persistence)
├── preload.js               # Secure contextBridge API exposing safe methods to renderer
├── index.html               # User interface layout (User Portal + IT Operations Center)
├── renderer.js              # DOM interactions, validation, filters, modal management
├── styles.css               # Tailwind CSS & DaisyUI styling definitions
├── tickets.json             # Persistent ticket records data store
├── accounts.json            # Student, faculty, and staff user directory
├── qcu-logo.png             # Quezon City University branding logo
├── test-selfcheck.js        # Automated assert-based verification test suite
├── IT_HelpDesk_Architecture.drawio # Architecture diagrams (Use Case & Process Flowchart)
└── archive/                 # Assignment specifications and reference backups
```

---

## 🧪 Demo Credentials

| Role | Account ID | Password / Access |
|---|---|---|
| **Student** | `24-1766` | One-click demo login (Carlos James Martinez) |
| **Faculty** | `FAC-101` | One-click demo login (Stephen Marion Gregory) |
| **IT Staff** | `admin` | Password: `admin` |

---

## 📄 License

Academic project for QCU SIA 1 (Systems Integration & Architecture). Provided under the [ISC License](package.json).
