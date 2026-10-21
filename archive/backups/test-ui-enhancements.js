const assert = require('assert');
const fs = require('fs');

const html = fs.readFileSync('./index.html', 'utf-8');
const css = fs.readFileSync('./styles.css', 'utf-8');
const js = fs.readFileSync('./renderer.js', 'utf-8');

// 1. Accessibility Checks: Label association
const requiredLabelFors = [
  'authUserId',
  'authStaffId',
  'authStaffPassword',
  'selectCategory',
  'selectPriority',
  'textareaDescription'
];

requiredLabelFors.forEach(id => {
  assert.ok(html.includes(`for="${id}"`), `Label with for="${id}" must exist in index.html`);
  assert.ok(html.includes(`id="${id}"`), `Element with id="${id}" must exist in index.html`);
});

// 2. Portal Header Badges, SVG Icons & Role Type Removal
assert.ok(!html.includes('name="authRoleType"'), 'Role type radio inputs must be removed from student & faculty portal');
assert.ok(html.includes('Students &amp; Faculty Only') || html.includes('Students & Faculty Only'), 'Badge must say Students & Faculty Only');
assert.ok(html.includes('IT Staff Only'), 'Badge must say IT Staff Only');
assert.ok(!html.includes('>User Role<'), 'Old "User Role" badge must not be present');
assert.ok(!html.includes('>IT Staff Role<'), 'Old "IT Staff Role" badge must not be present');
assert.ok(!html.includes('🎓') && !html.includes('🛠️'), 'Card emojis must be replaced with real SVG icons');
assert.ok(html.includes('id="sessionDivider"'), 'sessionDivider element must exist');
assert.ok(!js.includes('sessionUserText.textContent = profile.name || profile.staffId'), 'Staff session badge must not display admin username');
assert.ok(html.includes('id="authResolvedName"'), 'Auto-resolved name non-textbox display must exist');
assert.ok(html.includes('Carlos James Martinez'), 'Carlos James Martinez student demo account must exist');
assert.ok(html.includes('Stephen Marion Gregory'), 'Stephen Marion Gregory faculty demo account must exist');
assert.ok(!html.includes('id="authUserName"'), 'authUserName input textbox must be removed');
assert.ok(js.includes("authResolvedName.textContent = 'Unregistered ID'"), 'Account display must show simple Unregistered ID text');
assert.ok(js.includes('Error invoking remote method'), 'Error sanitizer must strip remote method prefix');

// 3. Accessibility Checks: Dialog roles & ARIA
assert.ok(html.includes('id="confirmationModal"') && html.includes('role="dialog"'), 'confirmationModal must have role="dialog"');
assert.ok(html.includes('id="ticketDetailModal"') && html.includes('role="dialog"'), 'ticketDetailModal must have role="dialog"');
assert.ok(!html.includes('id="integrationModal"'), 'integrationModal must be removed');
assert.ok(!html.includes('id="btnOpenIntegrationModal"'), 'btnOpenIntegrationModal must be removed');
assert.ok(html.includes('id="detailModalTitle"'), 'ticketDetailModal must have element with id="detailModalTitle"');
assert.ok(html.includes('aria-modal="true"'), 'Modals must have aria-modal="true"');

// 3b. Table semantics & Focus Management
assert.ok(!js.includes("tr.setAttribute('role', 'button')"), 'Table rows must not override native tr role with button');
assert.ok(js.includes('function showModal(') && js.includes('function closeModal('), 'Modal focus trap helpers must exist');

// 3c. Master-Detail Split Pane
assert.ok(html.includes('id="staffInspectorCard"'), 'Live Triage Inspector card must exist');
assert.ok(html.includes('id="paneActionButtons"'), 'Live Triage Inspector action buttons container must exist');
assert.ok(js.includes('inspectTicketInStaffPane'), 'renderer.js must have inspectTicketInStaffPane');

// 4. Copy Cleanliness: No implementation leakage in confirmation modal
assert.ok(!html.includes('Recorded in tickets.json'), 'Confirmation modal must not expose tickets.json filename to users');
assert.ok(!html.includes('SIA 1 Laboratory Activity • Role-Based Authentication & JSON Persistence'), 'Header must not show raw lab assignment subtitle');

// 5. Layout & Timestamps: Columns and Detail Inspector
assert.ok(html.includes('Submitted'), 'Tables must include Submitted date column');
assert.ok(html.includes('id="ticketDetailModal"'), 'Ticket detail inspector modal must exist');
assert.ok(js.includes('openTicketDetail'), 'renderer.js must have openTicketDetail function');
assert.ok(js.includes('formatRelativeTime'), 'renderer.js must have relative time formatter');

// 6. Contrast & Polish
assert.ok(!html.includes('text-slate-400'), 'Low-contrast text-slate-400 should be elevated to >= text-slate-600');
assert.ok(css.includes('--bc-muted: #475569;'), 'CSS muted text token must meet 4.5:1 contrast floor');
assert.ok(css.includes('white-space: nowrap !important;'), 'Badges must have white-space: nowrap to prevent text wrapping/overflow');
assert.ok(css.includes('height: auto !important;'), 'Badges must have height: auto to prevent vertical text clipping');
assert.ok(js.includes('btnSubmit.disabled = true;'), 'Submit button must be disabled during async ticket creation');
assert.ok(js.includes("e.key === 'Escape'"), 'Escape key must close modals');

// 7. QCU Branding
assert.ok(fs.existsSync('./qcu-logo.png'), 'qcu-logo.png must exist');
assert.ok(html.includes('src="qcu-logo.png"'), 'Navbar must include QCU logo image');
assert.ok(html.includes('QCU (Quezon City University)'), 'Navbar must display QCU (Quezon City University)');

// 8. Select Input Polish
assert.ok(css.includes('padding-right: 2.25rem !important;'), 'Selects must have sufficient right padding to avoid arrow collision');
assert.ok(html.includes('min-w-[125px]'), 'Status selects must have adequate minimum width');

// 9. IT Staff Quick Demo Account (1 account only)
assert.ok(html.includes("fillDemoStaff('admin'"), 'Staff demo button for admin must exist');
assert.ok(!html.includes("fillDemoStaff('IT-101'"), 'Only 1 IT Staff account button must be present');
assert.ok(js.includes('window.fillDemoStaff'), 'renderer.js must implement window.fillDemoStaff');

console.log('✓ All UI/UX overhaul self-checks passed successfully!');
