# Quezon City University (QCU) IT Help Desk Design System

## 1. Brand Identity & Design Philosophy

The **Quezon City University (QCU) IT Help Desk Ticketing System** is an institutional desktop application designed for students, faculty members, and IT support personnel across all QCU campuses (San Bartolome Main, Batasan Hills, and San Francisco).

### Design Philosophy
- **Civic Institutional Authority:** Anchored in official QCU colors—QCU Royal Blue (`#1E3A8A`) and QCU Amber Gold (`#F59E0B`). The interface communicates trust, dependability, and municipal service pride.
- **High-Precision Academic Utility:** An *Operate* surface designed for rapid comprehension, error prevention, and frictionless ticket triage. Prioritizes legibility, scannable table records, and clear interaction boundaries over gratuitous decoration.
- **Accessibility by Default:** Adheres strictly to WCAG 2.1 AA standards. Every interactive element maintains at least 4.5:1 text contrast on light canvases, visible focus indicators, and comprehensive keyboard/screen-reader semantics.

---

## 2. Color System & Design Tokens

### Primary Brand Palette
| Token | Variable | Hex Value | Role & Usage | Contrast on White |
|:---|:---|:---|:---|:---:|
| **QCU Royal Blue** | `--p` | `#1E3A8A` | Primary actions, key icons, active table indicators, brand titles | **10.29:1** (AAA) |
| **Deep Civic Blue** | `--p-hover` | `#172554` | Primary hover and pressed states | **13.41:1** (AAA) |
| **QCU Amber Gold** | `--sec` | `#F59E0B` | Secondary highlights, warning states, IT Staff badges | **2.14:1** (Use with dark text) |
| **Dark Gold** | `--sec-hover` | `#D97706` | Secondary button hover, active category filters | **3.22:1** (Dark text) |
| **QCU Crimson** | `--ter` / `--er` | `#DC2626` | Destructive actions, urgent/high priority, validation errors | **4.55:1** (AA) |

### Surface & Neutral Palette
| Token | Variable | Hex Value | Role & Usage |
|:---|:---|:---|:---|
| **Base Canvas** | `--b1` / `--canvas` | `#F8FAFC` | Main application background (Slate-50) |
| **Card Surface** | `--b2` / `--canvas-elevated` | `#FFFFFF` | Panels, cards, modal dialogs, input fields |
| **Hairline Border** | `--b3` / `--hairline` | `#E2E8F0` | Structural dividers, card borders, table borders (Slate-200) |
| **Subtle Tint** | `--b4` | `#F1F5F9` | Table header backgrounds, zebra stripes, hover states (Slate-100) |
| **Ink Primary** | `--bc` / `--ink` | `#0F172A` | High-emphasis headings and body text (Slate-900, 15.8:1) |
| **Ink Muted** | `--bc-muted` | `#475569` | Secondary labels, descriptions, timestamps (Slate-600, 4.68:1 AA) |

### Status Badges & Indicators
- **OPEN / Pending:** Background `#FEF3C7` (Amber-100), Border `#FCD34D`, Text `#92400E` (Amber-800, 5.21:1 AA).
- **IN PROGRESS / Working:** Background `#DBEAFE` (Blue-100), Border `#BFDBFE`, Text `#1E3A8A` (QCU Royal Blue, 7.82:1 AAA).
- **RESOLVED / Closed:** Background `#DCFCE7` (Emerald-100), Border `#BBF7D0`, Text `#166534` (Emerald-800, 4.96:1 AA).
- **Error / Unregistered:** Background `#FEE2E2` (Red-100), Border `#FECACA`, Text `#991B1B` (Red-800, 5.86:1 AA).

---

## 3. Typography & Hierarchy

### Font Family
- **Primary Interface Font:** `Inter` (`'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`) with weights 400, 500, 600, 700, and 800 for tall x-height, open counters, and high-readability bold forms.
- **Data & Identifier Font:** `JetBrains Mono` (`'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`) with weights 500, 600, 700 for distinct, legible Ticket IDs (`T001`), Student IDs (`24-1766`), and timestamps.

### Typographic Ladder
- **Brand Title (H1):** 20px–22px, Font Weight 800 (ExtraBold), Line Height 1.2, Letter Spacing -0.02em.
- **View Headings (H2):** 24px–30px, Font Weight 800 (ExtraBold), Line Height 1.25, Color `#0F172A`.
- **Card & Panel Titles (H3):** 18px–20px, Font Weight 800 (ExtraBold), Color `#0F172A` / `#1E3A8A`.
- **Modal Titles (H4):** 18px–20px, Font Weight 700–800, Color `#0F172A`.
- **Body Regular:** 16px (1rem), Font Weight 500 (Medium), Line Height 1.55, Color `#0F172A`.
- **Form Controls (Inputs, Selects):** 15.2px (0.95rem), Font Weight 600 (SemiBold), Color `#0F172A`.
- **Form Labels:** 14.8px–15.2px (0.925rem), Font Weight 700 (Bold), Color `#0F172A`.
- **Buttons (`.btn`):** 14.8px (0.925rem), Font Weight 700 (Bold), Letter Spacing +0.015em.
- **Table Headers (`th`):** 13px (0.8125rem), Font Weight 800 (ExtraBold), Uppercase tracking +0.05em, Color `#1E293B`.
- **Table Cells (`td`):** 14.8px (0.925rem), Font Weight 500 (Medium), Color `#0F172A`.
- **Overline / Badges:** 12.5px–13px (0.78rem–0.8125rem), Font Weight 800 (ExtraBold), Uppercase tracking +0.035em.
- **Minimum Font Floor:** 13px (0.8125rem) floor enforced via `.text-xs` override to eliminate illegible microcopy.

---

## 4. Components & Interaction Primitives

### Buttons (`.btn`)
- **Primary (`.btn-primary`):** Solid QCU Royal Blue (`#1E3A8A`), hover `#172554`. White text. Used for main form submission, login, and primary dialog confirmation.
- **Warning / Operations (`.btn-warning`):** Dark amber (`#B45309`), hover `#92400e`. White text. Used for IT staff authentication and elevated triage operations.
- **Outline (`.btn-outline`):** White surface, `#CBD5E1` border, `#334155` text. Hover `#F1F5F9`.
- **Target Size:** Standard button height is 36px–40px (`btn-sm` / default). Small actions maintain at least 28px height with adequate horizontal padding.

### Data Tables (`.table`)
- Clean zebra striping (`table-zebra`), light hairline dividers (`#E2E8F0`).
- Header row tinted `#F1F5F9` with uppercase bold 12px column labels.
- Interactive rows (`.clickable-row`) show `#EFF6FF` hover state; selected row displays `#F0F7FF` background with a 3px solid QCU Royal Blue (`var(--p)`) inset indicator.
- Keyboard accessible via focused ticket ID link and row selection events.

### Modals (`.modal-overlay`)
- Fixed full-screen backdrop (`rgba(15, 23, 42, 0.45)`) with backdrop blur.
- Centered dialog container with 12px border radius, 1px border, and soft elevation shadow (`shadow-2xl`).
- Strict focus trapping (`activeModalTrap`), Escape key dismissal, and restoration of focus to triggering element.

---

## 5. Architectural Role Separation

1. **Authentication Gateway (`#authView`):**
   - Distinct dual-card login: Student & Faculty Portal on the left, IT Support Operations on the right.
   - Real-time ID auto-resolution querying `accounts.json` via IPC before login.
2. **Student & Faculty Support Portal (`#userPortalView`):**
   - Streamlined ticket creation form prefilled with authenticated user identity.
   - Real-time ticket history table with search and status filtering.
   - Detailed inspector modal with ticket summary and turnaround service commitment.
3. **IT Support Operations Center (`#itStaffView`):**
   - Queue overview counters (Total, Open, In Progress, Resolved).
   - Master campus ticket queue with category, status, and keyword filtering.
   - Real-time Live Inspector split pane for instant ticket review and one-click status triage.
