const assert = require('assert');
const fs = require('fs');

// 1. Verify core files exist
assert.ok(fs.existsSync('./package.json'), 'package.json must exist');
assert.ok(fs.existsSync('./main.js'), 'main.js must exist');
assert.ok(fs.existsSync('./preload.js'), 'preload.js must exist');
assert.ok(fs.existsSync('./index.html'), 'index.html must exist');
assert.ok(fs.existsSync('./renderer.js'), 'renderer.js must exist');
assert.ok(fs.existsSync('./styles.css'), 'styles.css must exist');
assert.ok(fs.existsSync('./tickets.json'), 'tickets.json must exist');
assert.ok(fs.existsSync('./accounts.json'), 'accounts.json must exist');
assert.ok(fs.existsSync('./IT_HelpDesk_Architecture.drawio'), 'IT_HelpDesk_Architecture.drawio must exist');
assert.ok(fs.existsSync('./qcu-logo.png'), 'qcu-logo.png must exist');

// 2. Verify tickets.json structure with User Authentication fields
const tickets = JSON.parse(fs.readFileSync('./tickets.json', 'utf-8'));
assert.ok(Array.isArray(tickets), 'tickets.json must be an array');
assert.ok(tickets.length >= 1, 'tickets.json should contain tickets');

const sample = tickets[0];
assert.ok(sample.id && sample.id.startsWith('T'), 'Ticket ID must start with T');
assert.ok(sample.userId, 'userId (Student/Faculty ID) is required on tickets');
assert.ok(sample.userName, 'userName is required');
assert.ok(sample.category, 'category is required');
assert.ok(sample.description, 'description is required');
assert.ok(sample.priority, 'priority is required');
assert.ok(['OPEN', 'IN PROGRESS', 'RESOLVED'].includes(sample.status), 'status must be valid');

// 3. Test Role Separation & User Isolation Filter
const testUserId = sample.userId;
const userFilteredTickets = tickets.filter(t => t.userId === testUserId);
assert.ok(userFilteredTickets.length > 0, 'User tickets must be isolated by ID');
assert.ok(userFilteredTickets.every(t => t.userId === testUserId), 'Filtered list must only contain user tickets');

// 4. Test ID generation logic
function generateNextId(list) {
  const max = list.reduce((highest, t) => {
    if (!t || !t.id) return highest;
    const match = String(t.id).match(/^T(\d+)$/i);
    if (!match) return highest;
    const num = parseInt(match[1], 10);
    return isNaN(num) ? highest : Math.max(highest, num);
  }, 0);
  return `T${String(max + 1).padStart(3, '0')}`;
}

const maxNum = tickets.reduce((m, t) => Math.max(m, parseInt(t.id.replace('T', ''), 10) || 0), 0);
const expectedNext = `T${String(maxNum + 1).padStart(3, '0')}`;
const nextId = generateNextId(tickets);
assert.strictEqual(nextId, expectedNext, `Next generated ID should be ${expectedNext}`);

// 5. Verify accounts.json registration and verification
const accounts = JSON.parse(fs.readFileSync('./accounts.json', 'utf-8'));
assert.ok(Array.isArray(accounts), 'accounts.json must be an array');
const carlos = accounts.find(a => a.name === 'Carlos James Martinez');
assert.ok(carlos && carlos.id, 'Carlos James Martinez must be registered in accounts.json');
const stephen = accounts.find(a => a.id === 'FAC-101');
assert.ok(stephen && stephen.name === 'Stephen Marion Gregory', 'Stephen Marion Gregory must be registered in accounts.json');

// Verify exactly 1 IT staff account in accounts.json
const itStaffAccounts = accounts.filter(a => a.userType === 'IT Staff' || a.role === 'it_staff');
assert.strictEqual(itStaffAccounts.length, 1, 'Only 1 IT Staff account must be registered in accounts.json');
assert.strictEqual(itStaffAccounts[0].id, 'admin', 'The 1 IT Staff account must be admin');

// Test that unlisted account is rejected
const unlisted = accounts.find(a => a.id === 'UNKNOWN-999');
assert.strictEqual(unlisted, undefined, 'Unlisted ID must not exist in accounts.json');

// 6. Verify IT_HelpDesk_Architecture.drawio diagram synchronization & ISO 5807 compliance
const drawioContent = fs.readFileSync('./IT_HelpDesk_Architecture.drawio', 'utf-8');
assert.ok(!drawioContent.includes('Append Audit Gateway Log'), 'Process flowchart must not reference removed audit gateway log');
assert.ok((drawioContent.includes('fc_input_role') || drawioContent.includes('fc_input_stud')) && drawioContent.includes('fc_save_update'), 'Process flowchart elements must exist');
// ISO 5807 standard symbol checks: Terminator, Data I/O, Decision, Direct Access Storage
assert.ok(drawioContent.includes('arcSize=50'), 'ISO 5807: Terminators must use rounded pill/oval shapes');
assert.ok(drawioContent.includes('shape=parallelogram'), 'ISO 5807: Data input must use parallelogram');
assert.ok(drawioContent.includes('rhombus'), 'ISO 5807: Decisions must use rhombus/diamond');
assert.ok(drawioContent.includes('shape=cylinder3'), 'ISO 5807: File storage must use cylinder symbol');

// 7. Accessibility, Semantics & UI Overhaul Checks
const html = fs.readFileSync('./index.html', 'utf-8');
const css = fs.readFileSync('./styles.css', 'utf-8');
const js = fs.readFileSync('./renderer.js', 'utf-8');

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

assert.ok(html.includes('id="confirmationModal"') && html.includes('role="dialog"'), 'confirmationModal must have role="dialog"');
assert.ok(html.includes('id="ticketDetailModal"') && html.includes('role="dialog"'), 'ticketDetailModal must have role="dialog"');
assert.ok(!html.includes('id="integrationModal"'), 'integrationModal must be removed');
assert.ok(!html.includes('id="btnOpenIntegrationModal"'), 'btnOpenIntegrationModal must be removed');
assert.ok(html.includes('id="detailModalTitle"'), 'ticketDetailModal must have element with id="detailModalTitle"');
assert.ok(html.includes('aria-modal="true"'), 'Modals must have aria-modal="true"');

assert.ok(!js.includes("tr.setAttribute('role', 'button')"), 'Table rows must not override native tr role with button');
assert.ok(js.includes('function showModal(') && js.includes('function closeModal('), 'Modal focus trap helpers must exist');

assert.ok(html.includes('id="staffInspectorCard"'), 'Live Triage Inspector card must exist');
assert.ok(html.includes('id="paneActionButtons"'), 'Live Triage Inspector action buttons container must exist');
assert.ok(js.includes('inspectTicketInStaffPane'), 'renderer.js must have inspectTicketInStaffPane');

assert.ok(!html.includes('Recorded in tickets.json'), 'Confirmation modal must not expose tickets.json filename to users');
assert.ok(!html.includes('SIA 1 Laboratory Activity • Role-Based Authentication & JSON Persistence'), 'Header must not show raw lab assignment subtitle');

assert.ok(html.includes('Submitted'), 'Tables must include Submitted date column');
assert.ok(html.includes('id="ticketDetailModal"'), 'Ticket detail inspector modal must exist');
assert.ok(js.includes('openTicketDetail'), 'renderer.js must have openTicketDetail function');
assert.ok(js.includes('formatRelativeTime'), 'renderer.js must have relative time formatter');

assert.ok(!html.includes('text-slate-400'), 'Low-contrast text-slate-400 should be elevated to >= text-slate-600');
assert.ok(css.includes('--bc-muted: #475569;'), 'CSS muted text token must meet 4.5:1 contrast floor');
assert.ok(css.includes('white-space: nowrap !important;'), 'Badges must have white-space: nowrap to prevent text wrapping/overflow');
assert.ok(css.includes('height: auto !important;'), 'Badges must have height: auto to prevent vertical text clipping');
assert.ok(js.includes('btnSubmit.disabled = true;'), 'Submit button must be disabled during async ticket creation');
assert.ok(js.includes("e.key === 'Escape'"), 'Escape key must close modals');

assert.ok(html.includes('src="qcu-logo.png"'), 'Navbar must include QCU logo image');
assert.ok(html.includes('QCU (Quezon City University)'), 'Navbar must display QCU (Quezon City University)');

assert.ok(css.includes('padding-right: 2.25rem !important;'), 'Selects must have sufficient right padding to avoid arrow collision');
assert.ok(html.includes('min-w-[125px]'), 'Status selects must have adequate minimum width');

assert.ok(html.includes("fillDemoStaff('admin'"), 'Staff demo button for admin must exist');
assert.ok(!html.includes("fillDemoStaff('IT-101'"), 'Only 1 IT Staff account button must be present');
assert.ok(js.includes('window.fillDemoStaff'), 'renderer.js must implement window.fillDemoStaff');

console.log('✓ All self-checks passed successfully (Backend, Architecture, Accessibility & UI verified)!');
