const iconPaths = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="5" rx="1.6"/><rect x="14" y="12" width="7" height="9" rx="1.6"/><rect x="3" y="13" width="7" height="8" rx="1.6"/>',
  book: '<path d="M4 5.4A2.4 2.4 0 0 1 6.4 3H20v16H6.4A2.4 2.4 0 0 0 4 21.4z"/><path d="M4 5.4v16M8 7h8M8 11h7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  inbox: '<path d="M4 4h16l2 10v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5z"/><path d="M2 14h5l2 3h6l2-3h5M12 4v8m-3-3 3 3 3-3"/>',
  pulse: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  arrow: '<path d="M7 17 17 7M7 7h10v10"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  upload: '<path d="M12 16V4m-5 5 5-5 5 5"/><path d="M20 16.5v2.7a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 19.2v-2.7"/>',
  file: '<path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10z"/><path d="M13 3v7h7M8 15h8m-8 4h6"/>',
  sparkle: '<path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2z"/><path d="m19 14 1.2 2.3L22.5 17l-2.3.7L19 20l-.8-2.3L16 17l2.2-.7z"/>',
  shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11"/><path d="m9 12 2 2 4-4"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="m18 6-12 12M6 6l12 12"/>',
  alert: '<path d="m10.3 3.9-8.1 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.8-3.1l-8.1-14a2 2 0 0 0-3.4 0"/><path d="M12 9v4m0 4h.01"/>',
  clockBack: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5m4-1v5l3 2"/>',
  sparkles: '<path d="m12 3 1.8 5.3L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.7z"/><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9zM5 15l.7 1.3L7 17l-1.3.7L5 19l-.7-1.3L3 17l1.3-.7z"/>',
  logout: '<path d="M10 17l5-5-5-5m5 5H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12"/><circle cx="12" cy="12" r="3"/>',
  trend: '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-5 5"/>',
};

const state = {
  user: null,
  csrfToken: null,
  aiConfigured: false,
  route: 'dashboard',
  loading: false,
  error: '',
  toast: null,
  mobileMenu: false,
  data: null,
  guideFilter: '',
  draftFilter: '',
  editorDirty: false,
};

const app = document.querySelector('#app');
const esc = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

function icon(name, size = 18) {
  return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${iconPaths[name] || iconPaths.sparkle}</svg>`;
}

function notify(message, kind = 'success') {
  state.toast = { message, kind };
  render();
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => {
    state.toast = null;
    render();
  }, 3900);
}

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && options.body !== undefined) headers.set('Content-Type', 'application/json');
  if (state.csrfToken && !['GET', 'HEAD'].includes((options.method || 'GET').toUpperCase())) {
    headers.set('X-CSRF-Token', state.csrfToken);
  }
  const response = await fetch(`/api${path}`, { credentials: 'same-origin', ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && path !== '/login') {
      state.user = null;
      state.csrfToken = null;
      state.route = 'login';
      render();
    }
    const error = new Error(payload.error || 'Something went wrong. Please try again.');
    error.status = response.status;
    error.code = payload.code;
    throw error;
  }
  return payload;
}

function navigate(route) {
  state.route = route;
  state.editorDirty = false;
  state.loading = true;
  state.error = '';
  state.data = null;
  state.mobileMenu = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  render();
  loadRoute(route).catch(handleLoadError);
}

async function loadRoute(route) {
  if (route === 'login') {
    state.loading = false;
    render();
    return;
  }
  if (route === 'dashboard') {
    const data = await api('/dashboard');
    if (state.route === route) state.data = data;
  } else if (route === 'guidelines') {
    const data = await api('/guidelines');
    if (state.route === route) state.data = data;
  } else if (route === 'queue') {
    const data = await api('/drafts');
    if (state.route === route) state.data = data;
  } else if (route === 'monitoring') {
    const [dashboard, drafts] = await Promise.all([api('/dashboard'), api('/drafts')]);
    if (state.route === route) state.data = { ...dashboard, ...drafts };
  } else if (route === 'audit') {
    const data = await api('/audit');
    if (state.route === route) state.data = data;
  } else if (route.startsWith('draft/')) {
    const id = route.slice('draft/'.length);
    const [detail, history] = await Promise.all([api(`/drafts/${encodeURIComponent(id)}`), api(`/drafts/${encodeURIComponent(id)}/audit`)]);
    if (state.route === route) state.data = { ...detail, history };
  } else if (route.startsWith('review/')) {
    const id = route.slice('review/'.length);
    const [detail, history] = await Promise.all([api(`/drafts/${encodeURIComponent(id)}`), api(`/drafts/${encodeURIComponent(id)}/audit`)]);
    if (state.route === route) state.data = { ...detail, history };
  }
  if (state.route === route) {
    state.loading = false;
    render();
  }
}

function renderLogin() {
  app.innerHTML = `<main class="login-page">
    <div class="login-left">
      <a class="brand-mark login-brand" href="#" data-action="login"><span class="brand-symbol">${icon('shield', 21)}</span><span class="brand-name">brandguard<span>AI</span></span></a>
      <div class="login-copy">
        <div class="eyebrow"><span class="live-dot"></span> YOUR BRAND'S LAST LINE OF CARE</div>
        <h1>Great work.<br>On-brand, <em>every time.</em></h1>
        <p>A more thoughtful way to make sure every message sounds like you, before the world hears it.</p>
        <div class="login-proof"><span class="proof-avatars"><b>J</b><b>M</b><b>A</b></span><span>For the people who care what their brand says.</span></div>
      </div>
      <span class="login-footnote">Thoughtful by design. Clear by default.</span>
    </div>
    <div class="login-right">
      <section class="login-card" aria-labelledby="login-title">
        <div class="mobile-login-mark">${icon('shield', 21)}</div>
        <div class="eyebrow login-eyebrow">WELCOME BACK</div>
        <h2 id="login-title">Your workspace awaits.</h2>
        <p class="login-subtitle">Sign in to pick up where you left off.</p>
        <div id="login-error" class="alert-box error-box" role="alert" hidden></div>
        <form id="login-form" class="login-form">
          <label class="field-label" for="username">Your username</label>
          <div class="input-with-icon">${icon('eye')}<input id="username" name="username" autocomplete="username" placeholder="e.g. creator" value="creator" required></div>
          <label class="field-label password-label" for="password">Password</label>
          <div class="password-wrap"><input id="password" name="password" type="password" autocomplete="current-password" placeholder="Enter your password" value="creator-demo" required><button class="password-toggle" type="button" data-action="toggle-password" aria-label="Show password">${icon('eye')}</button></div>
          <button class="button button-primary login-submit" type="submit">Step inside ${icon('arrow', 16)}</button>
        </form>
        <div class="demo-accounts"><span class="demo-title">${icon('sparkle', 15)} A LITTLE DEMO MAGIC</span><p>Try <button type="button" data-account="creator">creator</button>, <button type="button" data-account="reviewer">reviewer</button>, or <button type="button" data-account="admin">admin</button>.</p><span>Demo password: <code>creator-demo</code>, <code>reviewer-demo</code>, or <code>admin-demo</code>.</span></div>
        <div class="login-assurance">${icon('shield', 15)} Your brand data stays in your workspace.</div>
      </section>
    </div>
  </main>`;
}

const routes = [
  { id: 'dashboard', label: 'Overview', icon: 'grid', group: 'WORKSPACE' },
  { id: 'guidelines', label: 'Brand guidelines', icon: 'book', group: 'WORKSPACE' },
  { id: 'new', label: 'New review', icon: 'plus', group: 'WORKSPACE' },
  { id: 'queue', label: 'Review queue', icon: 'inbox', group: 'REVIEW' },
  { id: 'monitoring', label: 'Monitoring', icon: 'pulse', group: 'REVIEW' },
  { id: 'audit', label: 'Audit history', icon: 'clock', group: 'REVIEW' },
];

function roleLabel(role) {
  return ({ creator: 'Brand creator', reviewer: 'Brand reviewer', admin: 'Workspace admin' })[role] || role;
}

function statusLabel(status) {
  return ({ draft: 'In progress', pending_review: 'In review', changes_requested: 'Needs updates', approved: 'Approved' })[status] || status;
}

function statusClass(status) {
  return ({ draft: 'status-draft', pending_review: 'status-review', changes_requested: 'status-changes', approved: 'status-approved' })[status] || '';
}

function formattedDate(value, compact = false) {
  if (!value) return 'Not yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not yet';
  return new Intl.DateTimeFormat('en', compact
    ? { month: 'short', day: 'numeric' }
    : { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
}

function aiBanner() {
  if (state.aiConfigured) return '';
  return `<div class="ai-not-configured">${icon('sparkles', 17)}<div><strong>AI analysis isn't connected yet.</strong><span>Add <code>OPENAI_API_KEY</code> to the server's <code>.env</code> to enable grounded reviews. No sample findings are generated.</span></div><span class="not-connected">NOT CONNECTED</span></div>`;
}

function sidebarMarkup() {
  const groups = [...new Set(routes.map((item) => item.group))];
  return `<aside class="sidebar ${state.mobileMenu ? 'mobile-open' : ''}">
    <a class="brand-mark" href="#" data-route="dashboard"><span class="brand-symbol">${icon('shield', 21)}</span><span class="brand-name">brandguard<span>AI</span></span></a>
    <div class="workspace-chip"><span class="workspace-avatar">B</span><span><strong>BrightPath</strong><small>Brand workspace</small></span><span class="workspace-dots">···</span></div>
    <nav class="primary-nav" aria-label="Main navigation">
      ${groups.map((group) => `<div class="nav-group"><span class="nav-heading">${group}</span>${routes.filter((item) => item.group === group).map((item) => `<a class="nav-link ${state.route === item.id || (item.id === 'queue' && state.route.startsWith('review/')) || (item.id === 'new' && state.route.startsWith('draft/')) ? 'active' : ''}" href="#${item.id}" data-route="${item.id}">${icon(item.icon, 18)}<span>${item.label}</span>${item.id === 'queue' && state.user.role !== 'creator' && state.data?.counts?.pending ? `<span class="nav-count">${state.data.counts.pending}</span>` : ''}</a>`).join('')}</div>`).join('')}
    </nav>
    <div class="sidebar-bottom"><div class="sidebar-help">${icon('sparkle', 17)}<strong>A little brand<br>peace of mind.</strong><span>Every message matters.<br>Make it a good one.</span></div><button class="sidebar-user" data-action="logout"><span class="user-avatar">${esc(state.user.username.slice(0, 1).toUpperCase())}</span><span class="user-info"><strong>${esc(state.user.username)}</strong><small>${esc(roleLabel(state.user.role))}</small></span>${icon('logout', 17)}</button><div class="sidebar-version">BRIGHTPATH WORKSPACE · DEMO</div></div>
  </aside>`;
}

function pageHeading(eyebrow, title, subtitle, action = '') {
  return `<div class="page-heading"><div><div class="eyebrow">${esc(eyebrow)}</div><h1>${title}</h1><p>${subtitle}</p></div>${action ? `<div class="heading-action">${action}</div>` : ''}</div>`;
}

function statCard(label, value, iconName, hint, color, route = null) {
  const tag = route ? 'a' : 'div';
  const navigation = route ? `href="#${route}" data-route="${route}"` : '';
  const card = `<${tag} class="stat-card ${route ? 'stat-card-clickable' : ''}" ${navigation}><div class="stat-top"><span>${label}</span><span class="stat-icon ${color}">${icon(iconName)}</span></div><strong class="stat-value">${value}</strong><span class="stat-hint">${hint}</span></${tag}>`;
  return card;
}

function draftRow(draft) {
  return `<button class="draft-row" data-route="${state.user.role === 'reviewer' && draft.status === 'pending_review' ? `review/${draft.id}` : `draft/${draft.id}`}"><span class="draft-row-icon">${icon('file', 18)}</span><span class="draft-row-main"><strong>${esc(draft.title)}</strong><small>${esc(draft.channel)} <span>·</span> updated ${formattedDate(draft.updatedAt, true)}</small></span><span class="finding-count ${draft.findingCounts.open ? 'has-findings' : ''}">${draft.findingCounts.open ? `${draft.findingCounts.open} open` : 'No open findings'}</span><span class="status-pill ${statusClass(draft.status)}">${statusLabel(draft.status)}</span>${icon('chevron', 17)}</button>`;
}

function emptyState(illustration, title, description, action = '') {
  return `<div class="empty-state"><span class="empty-icon">${icon(illustration, 25)}</span><strong>${title}</strong><p>${description}</p>${action}</div>`;
}

function dashboardPage() {
  const { counts, drafts = [] } = state.data || { counts: {}, drafts: [] };
  const firstName = state.user.username[0].toUpperCase() + state.user.username.slice(1);
  const primaryAction = state.user.role === 'reviewer'
    ? `<button class="button button-primary" data-route="queue">${icon('inbox', 17)} Open review queue ${icon('arrow', 15)}</button>`
    : `<button class="button button-primary" data-route="new">${icon('plus', 17)} Start a new review</button>`;
  const today = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date()).toUpperCase();
  return `${pageHeading(today, `Good to have you, ${esc(firstName)} <span class="wave">✳</span>`, 'Here’s what’s happening across your brand today.', primaryAction)}
    ${aiBanner()}
    <section class="stat-grid" aria-label="Workspace counts">
      ${statCard('PENDING REVIEWS', counts.pending || 0, 'inbox', 'Drafts waiting for a second look', 'lilac', 'queue')}
      ${statCard('APPROVED DRAFTS', counts.approved || 0, 'check', 'Ready for their next chapter', 'mint')}
      ${statCard('OPEN FINDINGS', counts.openFindings || 0, 'alert', 'Across your latest analyses', 'peach')}
      ${statCard('RESOLVED FINDINGS', counts.resolvedFindings || 0, 'shield', 'Decisions captured and saved', 'blue')}
    </section>
    <div class="dashboard-lower">
      <section class="panel activity-panel"><div class="panel-head"><div><span class="eyebrow">THE LATEST</span><h2>Recent drafts</h2></div><button class="text-link" data-route="${state.user.role === 'reviewer' ? 'queue' : 'monitoring'}">See all ${icon('arrow', 14)}</button></div>
        ${drafts.length ? `<div class="draft-list">${drafts.slice(0, 5).map(draftRow).join('')}</div>` : emptyState('file', 'Your story starts here.', 'The drafts you create will find their way here.', `<button class="button button-secondary" data-route="new">${icon('plus', 16)} Create a draft</button>`)}
      </section>
      <aside class="welcome-card"><span class="welcome-orbit">${icon('sparkles', 24)}</span><div class="eyebrow">A MOMENT OF CLARITY</div><h3>Good brands<br>sound like <em>themselves.</em></h3><p>Keep your guidelines close, your message clear, and your next big idea unmistakably yours.</p><button class="text-link" data-route="guidelines">Explore your guidelines ${icon('arrow', 14)}</button><div class="welcome-decoration">BG<span>✳</span></div></aside>
    </div>`;
}

function guidelinesPage() {
  const all = state.data?.guidelines || [];
  const filtered = all.filter((item) => `${item.name} ${item.originalName}`.toLowerCase().includes(state.guideFilter.toLowerCase()));
  const creatorCanUpload = ['creator', 'admin'].includes(state.user.role);
  return `${pageHeading('YOUR BRAND, WRITTEN DOWN', 'The guide behind the brand.', 'One trusted home for the words, facts, and principles that make you unmistakably you.', creatorCanUpload ? `<button class="button button-primary" data-action="scroll-upload">${icon('upload', 16)} Add a guideline</button>` : '')}
    ${aiBanner()}
    <section class="guideline-intro panel"><div class="guideline-art"><span class="art-page">${icon('book', 34)}<span></span><span></span><span></span></span><span class="art-star">✳</span></div><div><span class="eyebrow">A NOTE ON YOUR SOURCES</span><h2>Every recommendation starts with <em>your rules.</em></h2><p>Each review uses the 8 most recently uploaded guidelines, up to 45,000 characters. Source passages are checked against the original extracted text before they're shown.</p></div></section>
    <div class="section-title-row"><div><span class="eyebrow">REFERENCE LIBRARY</span><h2>Your brand library <span class="soft-count">${all.length}</span></h2></div><label class="search-box">${icon('search', 16)}<input id="guide-filter" placeholder="Find a guideline" value="${esc(state.guideFilter)}"></label></div>
    ${filtered.length ? `<div class="guideline-grid">${filtered.map((item, index) => `<article class="guide-card"><div class="guide-card-top"><span class="guide-doc-icon ${index % 2 === 0 ? 'guide-icon-lilac' : 'guide-icon-peach'}">${icon('file', 22)}</span><span class="source-verified">${icon('check', 12)} STORED</span></div><h3>${esc(item.name)}</h3><p class="guide-filename">${esc(item.originalName)}</p><details class="guide-preview"><summary>${icon('eye', 14)} Read extracted text</summary><div class="guide-extract">${esc(item.extractedText)}</div></details><div class="guide-card-footer"><span>${icon('clock', 13)} Added ${formattedDate(item.createdAt, true)}</span><span class="file-type">${item.mimeType === 'application/pdf' ? 'PDF' : 'TXT'}</span></div></article>`).join('')}</div>` : all.length ? emptyState('search', 'No matching guidelines.', 'Try a different search, or clear the search field.') : emptyState('book', 'The first page is yours to write.', 'Add a brand guideline to give future reviews a source they can trust.', creatorCanUpload ? `<button class="button button-secondary" data-action="scroll-upload">${icon('upload', 16)} Add your first guideline</button>` : '')}
    ${creatorCanUpload ? `<section class="upload-panel panel" id="upload-panel"><div><span class="eyebrow">ADD A SOURCE</span><h2>Bring the good stuff in.</h2><p>Text or text-based PDF. 5 MB max. Your source documents and extracted text are kept private to this workspace.</p></div><form id="upload-form" class="upload-form"><label class="field-label" for="guide-name">A name you'll recognise</label><input class="text-input" id="guide-name" name="name" maxlength="100" placeholder="e.g. Brand voice guide" required><label class="field-label" for="guide-file">Choose a PDF or TXT file</label><input class="file-input" id="guide-file" name="file" type="file" accept=".txt,.pdf,text/plain,application/pdf" required><button class="button button-secondary upload-submit" type="submit">${icon('upload', 16)} Store guideline securely</button><div id="upload-feedback" class="form-feedback" role="status"></div></form></section>` : ''}`;
}

function newReviewPage() {
  if (!['creator', 'admin'].includes(state.user.role)) {
    return `${pageHeading('MAKE IT COUNT', 'Create your next draft.', 'Only creators can start a new draft.')} ${emptyState('shield', 'Reviewer access.', 'Switch to a creator account to write a new review.')}`;
  }
  return `${pageHeading('MAKE IT COUNT', 'A fresh page, a new idea.', 'Every good review begins with the words you want people to remember.')}
    ${aiBanner()}
    <form id="new-draft-form" class="editor-layout">
      <section class="panel editor-panel"><div class="editor-topline"><span class="eyebrow">THE DRAFT STUDIO</span><span class="autosave-label">${icon('shield', 14)} Your original stays untouched</span></div>
        <div class="draft-meta"><label class="field-block"><span>Give it a name</span><input class="text-input title-input" name="title" maxlength="120" placeholder="A short, memorable title" required></label><label class="field-block channel-field"><span>Where's it headed?</span><select class="text-input" name="channel" required><option value="">Choose a channel</option><option>Instagram</option><option>LinkedIn</option><option>Website</option><option>Email</option><option>Paid advertisement</option><option>Product description</option><option>Other</option></select></label></div>
        <label class="field-block editor-field"><span>Your words, as they are</span><textarea name="text" maxlength="20000" required placeholder="A caption, campaign, product description… start wherever you are."></textarea><span class="character-count"><span id="character-count">0</span> / 20,000</span></label><div id="new-draft-feedback" class="form-feedback" role="alert"></div>
      </section>
      <aside class="panel editor-aside"><span class="eyebrow">YOUR CREATIVE PROCESS</span><h3>Thoughtful beats perfect.</h3><p>Start with the draft. Compare it against your own guidelines. Decide which suggestions, if any, are right for you.</p><div class="process-step"><span>01</span><div><strong>Write freely</strong><small>Your original is preserved.</small></div></div><div class="process-step"><span>02</span><div><strong>Review with care</strong><small>Grounded in your sources.</small></div></div><div class="process-step"><span>03</span><div><strong>Send when ready</strong><small>A real person approves.</small></div></div><button class="button button-primary full-width" type="submit">Create draft & keep going ${icon('arrow', 16)}</button><p class="privacy-note">${icon('shield', 14)} Your work is saved to the workspace.</p></aside>
    </form>`;
}

function findingCard(finding, index, canEdit) {
  const severityName = { high: 'Needs attention', medium: 'Worth a look', low: 'Consider' }[finding.severity] || finding.severity;
  const statusDecision = finding.decision && finding.decision !== 'open';
  return `<article class="finding-card finding-${esc(finding.severity)} ${statusDecision ? 'finding-resolved' : ''}">
    <div class="finding-top"><span class="finding-number">${String(index + 1).padStart(2, '0')}</span><span class="severity-dot"></span><span class="finding-category">${esc(finding.category.replaceAll('_', ' '))}</span><span class="severity-label">${esc(severityName)}</span></div>
    <p class="finding-explanation">${esc(finding.explanation)}</p>
    ${finding.matchedText ? `<div class="finding-match"><span>IN YOUR DRAFT</span><q>${esc(finding.matchedText)}</q></div>` : ''}
    ${finding.sourcePassage ? `<div class="source-quote"><span>${icon('book', 13)} FROM ${esc(finding.sourceGuidelineName || 'YOUR GUIDELINES')}</span><blockquote>“${esc(finding.sourcePassage)}”</blockquote></div>` : `<div class="unverified-claim">${icon('alert', 13)} ${finding.claimStatus === 'unverifiable' ? 'This factual claim could not be verified against your uploaded guidelines. No source passage is available.' : 'Not verified against the uploaded guidelines. No supporting source passage is available.'}</div>`}
    ${finding.suggestion ? `<label class="suggestion-label" for="suggestion-${esc(finding.id)}">A SUGGESTION TO MAKE IT YOURS</label>${canEdit && statusDecision ? `<textarea class="suggestion-editor" id="suggestion-${esc(finding.id)}" data-suggestion="${esc(finding.id)}">${esc(finding.suggestion)}</textarea>` : `<div class="suggested-copy">${esc(finding.suggestion)}</div>`}` : '<div class="unverified-claim">No replacement text was suggested. Edit the draft manually if needed.</div>'}
    ${canEdit ? `<div class="finding-actions">${finding.decision === 'open' ? `<button class="button button-mini button-quiet" data-finding="${esc(finding.id)}" data-decision="rejected">Not for me</button><button class="button button-mini button-soft" data-finding="${esc(finding.id)}" data-decision="accepted">${icon('check', 14)} Sounds good</button>` : `<span class="decision-badge ${finding.decision === 'rejected' ? 'decision-rejected' : ''}">${icon(finding.decision === 'rejected' ? 'close' : 'check', 14)} ${esc(finding.decision)}</span>${finding.decision !== 'rejected' ? `<button class="button button-mini button-quiet" data-finding="${esc(finding.id)}" data-decision="edited">${icon('edit', 13)} Save edit</button><button class="text-link apply-suggestion" data-finding="${esc(finding.id)}" data-matched="${esc(finding.matchedText)}">Apply to draft ${icon('arrow', 13)}</button>` : ''}`}</div>` : `<span class="reviewer-decision">${statusDecision ? `Creator ${esc(finding.decision)} this suggestion` : 'Creator decision pending'}</span>`}
  </article>`;
}

function draftReviewPage() {
  const { draft, findings = [], history } = state.data;
  const canEdit = ['creator', 'admin'].includes(state.user.role) && ['draft', 'changes_requested'].includes(draft.status);
  const canReview = ['reviewer', 'admin'].includes(state.user.role) && draft.status === 'pending_review';
  const latestRevision = history?.revisions?.[0]?.text || draft.workingText;
  const textForEditor = canEdit ? draft.workingText : latestRevision;
  const visibleFindings = findings.filter((finding) => !state.data.analysisFilter || finding.analysisId === state.data.analysisFilter);
  const analyses = state.data.analyses || [];
  return `<div class="detail-breadcrumb"><button class="text-link" data-route="${canReview ? 'queue' : 'monitoring'}">${icon('chevron', 15)} ${canReview ? 'Review queue' : 'All drafts'}</button><span>/</span><span>${esc(draft.title)}</span></div>
    ${pageHeading(`${esc(draft.channel.toUpperCase())} · ${esc(draft.creator)}`, esc(draft.title), `Created ${formattedDate(draft.createdAt)} · ${draft.findingCounts.total} finding${draft.findingCounts.total === 1 ? '' : 's'} in the latest analysis`, `<span class="status-pill detail-status ${statusClass(draft.status)}">${statusLabel(draft.status)}</span>`)}
    ${draft.status === 'changes_requested' && canEdit ? `<div class="revision-request-note">${icon('edit', 16)}<div><strong>Your reviewer asked for another look.</strong><span>${esc((history?.events || []).find((event) => event.action === 'changes_requested')?.details?.note || 'Update the draft, then submit a new version.')}</span></div></div>` : ''}
    <div class="review-detail-layout">
      <div class="review-main-column">
        <section class="panel review-editor"><div class="editor-topline"><div><span class="eyebrow">${canEdit ? 'YOUR WORKING COPY' : 'SUBMITTED FOR REVIEW'}</span><h2>${canEdit ? 'The words in progress.' : 'The words to review.'}</h2></div>${canEdit ? `<span class="draft-preserved">${icon('shield', 14)} Original preserved</span>` : ''}</div>
          ${canEdit ? `<textarea id="working-draft" class="working-draft" maxlength="20000" aria-label="Draft text">${esc(textForEditor)}</textarea><div class="editor-bottom"><span><span id="working-count">${textForEditor.length}</span> / 20,000 characters</span><span>${icon('clock', 13)} v${history?.revisions?.[0]?.version || 1} · Original kept in history</span></div><div class="detail-actions"><button class="button button-secondary" data-action="save-draft">${icon('check', 15)} Save changes</button><button class="button button-primary" data-action="submit-draft">Submit for review ${icon('arrow', 15)}</button></div>` : `<div class="submitted-copy">${esc(textForEditor)}</div><div class="submitted-meta"><span>${icon('clock', 14)} Version ${history?.revisions?.[0]?.version || 1} · submitted ${formattedDate(draft.updatedAt)}</span><button class="text-link" data-action="show-original">See original ${icon('arrow', 13)}</button></div>`}
          <div id="draft-feedback" class="form-feedback" role="alert"></div>
        </section>
        ${canEdit ? `        <section class="analysis-section"><div class="section-title-row"><div><span class="eyebrow">YOUR GUIDELINES, YOUR CALL</span><h2>A fresh set of eyes.</h2></div>${analyses.length ? `<span class="analysis-count">${analyses.length} saved review${analyses.length === 1 ? '' : 's'}</span>` : ''}</div>${aiBanner()}<div class="analysis-action-card">${icon('sparkles', 22)}<div><strong>Review against your guidelines</strong><span>${state.aiConfigured ? 'The 8 most recent sources (up to 45,000 characters) ground each review.' : 'Connect a server-side AI key before a real analysis can run.'}</span></div><button class="button button-primary button-analysis" data-action="analyse" ${state.aiConfigured ? '' : 'aria-disabled="true"'}>${icon('sparkles', 15)} Analyse draft</button></div>
          ${analyses.length ? `<div class="analysis-selector"><label class="field-label" for="analysis-select">View findings from</label><select id="analysis-select" class="text-input">${analyses.map((analysis) => `<option value="${analysis.id}" ${!state.data.analysisFilter && analyses[0].id === analysis.id || state.data.analysisFilter === analysis.id ? 'selected' : ''}>${formattedDate(analysis.createdAt)} · ${esc(analysis.model)} · ${analysis.guidelineSources.length} sources</option>`).join('')}</select></div>` : ''}
          <div class="findings-list">${visibleFindings.length ? visibleFindings.map(findingCardForCreator).join('') : emptyState('sparkles', analyses.length ? 'A clear review.' : 'No review has been run yet.', analyses.length ? 'This analysis did not return any findings.' : 'Findings appear here only after a real analysis is configured and completed.')}</div></section>` : ''}
        ${canReview ? `<section class="panel reviewer-panel"><div class="eyebrow">A HUMAN MAKES THE CALL</div><h2>Send it on, or help it get better.</h2><p>Your decision is saved with your name, note, and the submitted version.</p><label class="field-label" for="review-note">Note for the creator <span>(required if requesting revision)</span></label><textarea class="reviewer-note" id="review-note" maxlength="1000" placeholder="A thoughtful note helps the creator know where to start…"></textarea><div id="review-feedback" class="form-feedback" role="alert"></div><div class="review-decision-buttons"><button class="button button-secondary" data-action="request-revision">${icon('edit', 15)} Request a revision</button><button class="button button-primary button-approve" data-action="approve">${icon('check', 15)} Approve draft</button></div></section>` : ''}
        <details class="history-panel panel"><summary>${icon('clockBack', 17)} <span>Versions & decision history</span><span class="history-count">${history?.events?.length || 0} recorded events</span></summary><div class="history-content"><h3>Original draft</h3><blockquote>${esc(history?.originalText || '')}</blockquote>${(history?.revisions || []).map((revision) => `<div class="version-entry"><span>VERSION ${revision.version}</span><span>${esc(revision.createdBy)} · ${formattedDate(revision.createdAt)}</span><blockquote>${esc(revision.text)}</blockquote></div>`).join('')}${(history?.events || []).map((event) => `<div class="timeline-event"><span class="timeline-dot"></span><div><strong>${esc(event.action.replaceAll('_', ' '))}</strong><small>${esc(event.actor)} · ${formattedDate(event.createdAt)}</small>${event.details?.note ? `<p>${esc(event.details.note)}</p>` : ''}</div></div>`).join('')}</div></details>
      </div>
      <aside class="review-side"><div class="side-sticky"><section class="panel finding-summary"><div class="eyebrow">A QUICK PULSE</div><h3>Latest review</h3><div class="finding-figure"><strong>${draft.findingCounts.total}</strong><span>finding${draft.findingCounts.total === 1 ? '' : 's'}</span></div><div class="summary-line"><span><i class="severity-dot dot-open"></i> Open</span><strong>${draft.findingCounts.open}</strong></div><div class="summary-line"><span><i class="severity-dot dot-resolved"></i> Resolved</span><strong>${draft.findingCounts.resolved}</strong></div><div class="summary-foot">${draft.latestAnalysisAt ? `${icon('clock', 13)} Reviewed ${formattedDate(draft.latestAnalysisAt)}` : `${icon('sparkles', 13)} No analysis recorded yet`}</div></section><section class="side-note">${icon('shield', 16)}<p>${canReview ? 'A review is a human decision, not an AI verdict. Take the time you need.' : 'Suggestions never change your original. Your next version is always yours.'}</p></section><button class="text-link audit-shortcut" data-action="open-audit">${icon('clock', 15)} Explore full audit history ${icon('arrow', 13)}</button></div></aside>
    </div>`;
}

function findingCardForCreator(finding, index) {
  return findingCard(finding, index, true);
}

function queuePage() {
  const drafts = (state.data?.drafts || []).filter((draft) => draft.status === 'pending_review');
  if (state.user.role === 'creator') {
    return `${pageHeading('A SECOND SET OF EYES', 'Your drafts in motion.', 'The review queue is reserved for reviewers; these are your own drafts to follow up on.')} ${emptyState('shield', 'For reviewer eyes only.', 'Switch to the reviewer demo account to approve or request revisions.')}`;
  }
  return `${pageHeading('THOUGHTFUL REVIEW, RIGHT ON TIME', 'The review queue.', 'A calm moment to make sure every published word is a word you stand behind.')}${aiBanner()}
    <div class="queue-toolbar"><div class="queue-count">${icon('inbox', 18)} <strong>${drafts.length}</strong> waiting for your review</div><span>${icon('clock', 14)} Changes save straight to the audit history</span></div>
    ${drafts.length ? `<div class="queue-list">${drafts.map((draft) => `<article class="queue-card"><div class="queue-card-top"><span class="queue-channel">${icon('file', 16)} ${esc(draft.channel)}</span><span class="status-pill status-review">Awaiting you</span></div><h2>${esc(draft.title)}</h2><p class="queue-preview">${esc(draft.workingText)}</p><div class="queue-card-bottom"><span>${icon('clock', 14)} ${esc(draft.creator)} · updated ${formattedDate(draft.updatedAt, true)}</span><span>${draft.findingCounts.open ? `<i class="severity-dot dot-open"></i>${draft.findingCounts.open} open findings` : 'No open findings'}</span><button class="button button-primary button-small" data-route="review/${draft.id}">Take a look ${icon('arrow', 14)}</button></div></article>`).join('')}</div>` : emptyState('inbox', 'A clear queue. A rare and beautiful thing.', 'There are no drafts waiting for review right now. Your next one will land right here.')}`;
}

function monitoringPage() {
  const drafts = (state.data?.drafts || []).filter((draft) =>
    `${draft.title} ${draft.channel} ${draft.creator}`.toLowerCase().includes(state.draftFilter.toLowerCase()));
  const byStatus = ['draft', 'changes_requested', 'pending_review', 'approved'].map((status) => ({
    status,
    count: drafts.filter((draft) => draft.status === status).length,
    drafts: drafts.filter((draft) => draft.status === status),
  }));
  const max = Math.max(1, ...byStatus.map((item) => item.count));
  return `${pageHeading('A WIDE-ANGLE VIEW', 'Everything, in perspective.', 'A quietly useful overview of drafts and decisions across your brand.')}
    ${aiBanner()}
    <section class="panel monitoring-panel"><div class="panel-head"><div><span class="eyebrow">THE FULL PICTURE</span><h2>Your drafts, at every stage.</h2></div><span class="monitor-total">${drafts.length} total draft${drafts.length === 1 ? '' : 's'}</span></div><div class="monitor-bars">${byStatus.map((item) => `<div class="monitor-row"><div class="monitor-row-head"><span class="status-pill ${statusClass(item.status)}">${statusLabel(item.status)}</span><strong>${item.count}</strong></div><progress class="monitor-fill monitor-${item.status}" max="${max}" value="${item.count}" aria-label="${statusLabel(item.status)}: ${item.count}"></progress></div>`).join('')}</div></section>
    <label class="search-box monitoring-search">${icon('search', 16)}<input id="draft-filter" placeholder="Find a draft, channel, or creator" value="${esc(state.draftFilter)}"></label>
    ${byStatus.map((item) => item.count ? `<section class="monitor-group"><div class="monitor-group-heading"><h2>${statusLabel(item.status)}</h2><span>${item.count}</span></div><div class="panel draft-list">${item.drafts.map(draftRow).join('')}</div></section>` : '').join('')}
    ${drafts.length ? '' : emptyState('pulse', 'No activity to monitor yet.', 'The next review you create will give you a fuller picture of the work ahead.', state.user.role !== 'reviewer' ? `<button class="button button-secondary" data-route="new">${icon('plus', 15)} Create a draft</button>` : '')}`;
}

function auditTimeline(events, showTitle = true) {
  if (!events.length) return emptyState('clock', 'Nothing to look back on just yet.', 'Draft edits, AI reviews, creator choices, and reviewer decisions appear here automatically.');
  const labels = {
    draft_created: 'Draft created',
    draft_edited: 'Draft updated',
    analysis_completed: 'Grounded AI analysis completed',
    finding_accepted: 'Suggestion accepted',
    finding_rejected: 'Suggestion rejected',
    finding_edited: 'Suggestion edited',
    suggestion_applied: 'Suggested edit applied to working draft',
    submitted_for_review: 'Submitted for review',
    approved: 'Draft approved',
    changes_requested: 'Revision requested',
  };
  return `<div class="timeline-list">${events.map((event) => `<article class="audit-event"><span class="timeline-dot ${event.action === 'approved' ? 'timeline-approved' : event.action === 'changes_requested' ? 'timeline-review' : ''}"></span><div class="audit-event-main"><div class="audit-event-head"><strong>${labels[event.action] || esc(event.action.replaceAll('_', ' '))}</strong><time datetime="${esc(event.createdAt)}">${formattedDate(event.createdAt)}</time></div>${showTitle ? `<button class="text-link audit-title-link" data-route="draft/${esc(event.draftId)}">${esc(event.draftTitle)} ${icon('arrow', 12)}</button>` : ''}<span class="audit-actor">${esc(event.actor)}${event.details?.demonstration ? ' · fictional demonstration data' : ''}</span>${event.details?.note ? `<blockquote class="audit-note">${esc(event.details.note)}</blockquote>` : ''}${event.details?.findingCount !== undefined ? `<p class="audit-note">${event.details.findingCount} finding${event.details.findingCount === 1 ? '' : 's'} saved. ${esc(event.details.model || '')}</p>` : ''}${event.details?.text ? `<details class="audit-snapshot"><summary>View saved text</summary><blockquote>${esc(event.details.text)}</blockquote></details>` : ''}</div><span class="audit-event-icon">${icon(event.action === 'approved' ? 'check' : event.action === 'analysis_completed' ? 'sparkles' : event.action === 'submitted_for_review' ? 'inbox' : 'edit', 16)}</span></article>`).join('')}</div>`;
}

function auditPage() {
  const events = state.data?.events || [];
  return `${pageHeading('A CAREFUL PAPER TRAIL', 'Every decision, remembered.', 'Originals, working versions, analysis results, and decisions, all in one honest timeline.')}
    <section class="audit-intro panel"><span class="audit-intro-icon">${icon('clockBack', 22)}</span><div><h2>A record you can stand behind.</h2><p>Each event has an actor and a timestamp. Audit entries keep the original draft, every submitted version, finding decisions, and reviewer notes.</p></div><span class="audit-privacy">WORKSPACE ONLY ${icon('shield', 13)}</span></section>
    <div class="section-title-row audit-section-heading"><div><span class="eyebrow">THE RECORD</span><h2>Recent history <span class="soft-count">${events.length}</span></h2></div></div>
    <section class="panel audit-list-panel">${auditTimeline(events)}</section>`;
}

function loadingPage() {
  return `<div class="loading-page"><span class="loader"></span><strong>Just a moment…</strong><p>Bringing everything into focus.</p></div>`;
}

function routeContent() {
  if (state.loading) return loadingPage();
  if (state.error) return `<section class="panel route-error">${icon('alert', 23)}<h2>We couldn't load this view.</h2><p>${esc(state.error)}</p><button class="button button-primary" data-action="retry">Try again</button></section>`;
  if (state.route === 'dashboard') return dashboardPage();
  if (state.route === 'guidelines') return guidelinesPage();
  if (state.route === 'new') return newReviewPage();
  if (state.route === 'queue') return queuePage();
  if (state.route === 'monitoring') return monitoringPage();
  if (state.route === 'audit') return auditPage();
  if (state.route.startsWith('draft/')) return draftReviewPage();
  if (state.route.startsWith('review/')) return draftReviewPage();
  return dashboardPage();
}

function render() {
  if (!state.user) {
    renderLogin();
    return;
  }
  const route = routes.some((item) => item.id === state.route) || state.route.startsWith('draft/') || state.route.startsWith('review/');
  if (!route && state.route !== 'login') state.route = 'dashboard';
  app.innerHTML = `<div class="app-shell">${sidebarMarkup()}<main class="main-area"><header class="topbar"><div class="topbar-left"><button class="mobile-menu-button" data-action="toggle-menu" aria-label="Toggle navigation">${icon(state.mobileMenu ? 'close' : 'menu', 21)}</button><div class="breadcrumb"><span>BrightPath</span>${icon('chevron', 14)}<strong>${state.route.startsWith('draft/') || state.route.startsWith('review/') ? 'Draft detail' : routes.find((item) => item.id === state.route)?.label || 'Overview'}</strong></div></div><div class="topbar-right"><span class="topbar-status ${state.editorDirty ? 'unsaved-status' : ''}"><span class="live-dot"></span> ${state.editorDirty ? 'Unsaved edits' : 'All changes saved'}</span><span class="topbar-date">${new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</span><span class="topbar-avatar">${esc(state.user.username.slice(0, 1).toUpperCase())}</span></div></header><div class="content-area">${routeContent()}</div><footer class="page-footer"><span>BRANDGUARD <span>✳</span> THOUGHTFUL BY DESIGN</span><span>© BrightPath demonstration workspace</span></footer></main>${state.toast ? `<div class="toast toast-${state.toast.kind}" role="status">${icon(state.toast.kind === 'error' ? 'alert' : 'check', 17)}<span>${esc(state.toast.message)}</span><button aria-label="Dismiss" data-action="dismiss-toast">${icon('close', 15)}</button></div>` : ''}</div>`;
  if (state.route === 'guidelines') attachSearchPreservingCursor('guide-filter', 'guideFilter');
  if (state.route === 'monitoring') attachSearchPreservingCursor('draft-filter', 'draftFilter');
}

function attachSearchPreservingCursor(id, property) {
  const input = document.getElementById(id);
  if (!input) return;
  input.addEventListener('input', () => {
    const position = input.selectionStart;
    state[property] = input.value;
    const scrollPosition = window.scrollY;
    render();
    const next = document.getElementById(id);
    if (next) {
      next.focus();
      next.setSelectionRange(position, position);
      window.scrollTo(0, scrollPosition);
    }
  });
}

function refreshCurrent() {
  state.loading = true;
  state.data = null;
  render();
  loadRoute(state.route).catch(handleLoadError);
}

function handleLoadError(error) {
  if (state.route === 'login' || error.status === 401) return;
  state.loading = false;
  state.error = error.message;
  render();
}

app.addEventListener('click', async (event) => {
  const routeButton = event.target.closest('[data-route]');
  if (routeButton) {
    event.preventDefault();
    navigate(routeButton.dataset.route);
    return;
  }
  const accountButton = event.target.closest('[data-account]');
  if (accountButton) {
    const account = accountButton.dataset.account;
    document.getElementById('username').value = account;
    document.getElementById('password').value = `${account}-demo`;
    document.getElementById('password').focus();
    return;
  }
  const actionButton = event.target.closest('[data-action]');
  if (!actionButton) return;
  const action = actionButton.dataset.action;
  if (action === 'toggle-password') {
    const password = document.getElementById('password');
    password.type = password.type === 'password' ? 'text' : 'password';
    return;
  }
  if (action === 'toggle-menu') {
    state.mobileMenu = !state.mobileMenu;
    render();
    return;
  }
  if (action === 'dismiss-toast') {
    state.toast = null;
    render();
    return;
  }
  if (action === 'retry') {
    refreshCurrent();
    return;
  }
  if (action === 'scroll-upload') {
    document.getElementById('upload-panel')?.scrollIntoView({ behavior: 'smooth' });
    document.getElementById('guide-name')?.focus({ preventScroll: true });
    return;
  }
  if (action === 'open-audit') {
    navigate('audit');
    return;
  }
  if (action === 'show-original') {
    const history = document.querySelector('.history-panel');
    if (history) {
      history.open = true;
      history.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    return;
  }
  if (action === 'save-draft') {
    await saveDraft();
    return;
  }
  if (action === 'submit-draft') {
    await saveDraft(true);
    return;
  }
  if (action === 'analyse') {
    if (actionButton.getAttribute('aria-disabled') === 'true' || !state.aiConfigured) {
      const feedback = document.getElementById('draft-feedback');
      if (feedback) {
        feedback.className = 'form-feedback form-error';
        feedback.textContent = 'AI analysis is not configured. Add OPENAI_API_KEY to the server .env and restart it. No analysis was run and no findings were created.';
      }
      return;
    }
    await runAnalysis(actionButton);
    return;
  }
  if (action === 'request-revision') {
    await reviewDraft('request_revision');
    return;
  }
  if (action === 'approve') {
    await reviewDraft('approve');
    return;
  }
  if (action === 'logout') {
    try {
      await api('/logout', { method: 'POST', body: JSON.stringify({}) });
    } catch (error) {
      console.error('Sign-out failed:', error.message);
    }
    state.user = null;
    state.csrfToken = null;
    state.route = 'login';
    render();
    return;
  }

  if (actionButton.hasAttribute('data-finding')) {
    if (action === 'apply-suggestion' || actionButton.classList.contains('apply-suggestion')) {
      await applySuggestion(actionButton);
      return;
    }
    await decideFinding(actionButton);
  }
});

app.addEventListener('submit', async (event) => {
  if (event.target.id === 'login-form') {
    event.preventDefault();
    const feedback = document.getElementById('login-error');
    const submit = event.target.querySelector('[type="submit"]');
    const form = new FormData(event.target);
    submit.disabled = true;
    submit.innerHTML = '<span class="loader loader-small"></span> Finding your workspace…';
    feedback.hidden = true;
    try {
      const result = await api('/login', {
        method: 'POST',
        body: JSON.stringify({ username: form.get('username'), password: form.get('password') }),
      });
      state.user = result.user;
      state.csrfToken = result.csrfToken;
      state.aiConfigured = result.aiConfigured;
      state.route = 'dashboard';
      state.data = null;
      state.loading = true;
      state.editorDirty = false;
      loadRoute('dashboard').catch(handleLoadError);
    } catch (error) {
      feedback.hidden = false;
      feedback.textContent = error.message;
      submit.disabled = false;
      submit.innerHTML = `Step inside ${icon('arrow', 16)}`;
    }
    return;
  }
  if (event.target.id === 'new-draft-form') {
    event.preventDefault();
    const form = new FormData(event.target);
    const button = event.target.querySelector('[type="submit"]');
    const feedback = document.getElementById('new-draft-feedback');
    button.disabled = true;
    button.innerHTML = '<span class="loader loader-small"></span> Saving your draft…';
    feedback.textContent = '';
    try {
      const result = await api('/drafts', {
        method: 'POST',
        body: JSON.stringify({ title: form.get('title'), channel: form.get('channel'), text: form.get('text') }),
      });
      state.editorDirty = false;
      state.aiConfigured = (await api('/session')).aiConfigured;
      notify('Your draft is saved. Its original is safe.', 'success');
      navigate(`draft/${result.draft.id}`);
    } catch (error) {
      feedback.className = 'form-feedback form-error';
      feedback.textContent = error.message;
      button.disabled = false;
      button.innerHTML = `Create draft & keep going ${icon('arrow', 16)}`;
    }
    return;
  }
  if (event.target.id === 'upload-form') {
    event.preventDefault();
    const form = new FormData(event.target);
    const button = event.target.querySelector('[type="submit"]');
    const feedback = document.getElementById('upload-feedback');
    button.disabled = true;
    button.innerHTML = '<span class="loader loader-small"></span> Reading your file…';
    feedback.textContent = '';
    try {
      const result = await api('/guidelines', { method: 'POST', body: form });
      notify(`“${result.guideline.name}” is safely stored and ready to ground reviews.`);
      state.loading = true;
      state.data = null;
      render();
      const guidelines = await api('/guidelines');
      state.data = guidelines;
      state.loading = false;
      render();
      document.getElementById('upload-panel')?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      feedback.className = 'form-feedback form-error';
      feedback.textContent = error.message;
      button.disabled = false;
      button.innerHTML = `${icon('upload', 16)} Store guideline securely`;
    }
    return;
  }
});

app.addEventListener('input', (event) => {
  if (event.target.id === 'new-draft-form' || event.target.name === 'text') {
    const output = document.getElementById('character-count');
    if (output) output.textContent = event.target.value.length;
  }
  if (event.target.id === 'working-draft') {
    const output = document.getElementById('working-count');
    if (output) output.textContent = event.target.value.length;
  }
  if (event.target.closest('#new-draft-form') || event.target.id === 'working-draft') {
    state.editorDirty = true;
    const status = document.querySelector('.topbar-status');
    if (status) {
      status.classList.toggle('unsaved-status', state.editorDirty);
      status.innerHTML = `<span class="live-dot"></span> ${state.editorDirty ? 'Unsaved edits' : 'All changes saved'}`;
    }
  }
});

async function saveDraft(submit = false) {
  const feedback = document.getElementById('draft-feedback');
  const id = state.route.slice('draft/'.length);
  const text = document.getElementById('working-draft')?.value || '';
  if (submit && !state.aiConfigured && !state.data.analyses.length
    && !window.confirm('AI analysis is not configured, so this draft has no AI findings. Submit it to a human reviewer anyway?')) {
    return;
  }
  const buttons = [...document.querySelectorAll('.detail-actions button')];
  buttons.forEach((button) => { button.disabled = true; });
  if (feedback) feedback.textContent = '';
  try {
    await api(`/drafts/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ text }) });
    state.editorDirty = false;
    if (submit) {
      await api(`/drafts/${encodeURIComponent(id)}/submit`, { method: 'POST', body: JSON.stringify({}) });
      notify('Your revised draft is in the review queue.');
    } else {
      notify('Your working copy is saved. Your original is unchanged.');
    }
    await loadRoute(state.route);
  } catch (error) {
    if (feedback) {
      feedback.className = 'form-feedback form-error';
      feedback.textContent = error.message;
    }
    buttons.forEach((button) => { button.disabled = false; });
  }
}

async function runAnalysis(button) {
  const feedback = document.getElementById('draft-feedback');
  const id = state.route.slice('draft/'.length);
  button.disabled = true;
  button.innerHTML = '<span class="loader loader-small"></span> Comparing to your sources…';
  if (feedback) feedback.textContent = '';
  try {
    await api(`/drafts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ text: document.getElementById('working-draft').value }),
    });
    state.editorDirty = false;
    await api(`/drafts/${encodeURIComponent(id)}/analyse`, { method: 'POST', body: JSON.stringify({}) });
    state.data.analysisFilter = null;
    notify('A grounded review is complete. Your original stays intact.');
    await loadRoute(state.route);
  } catch (error) {
    if (feedback) {
      feedback.className = 'form-feedback form-error';
      feedback.textContent = error.message;
    }
    button.disabled = false;
    button.innerHTML = `${icon('sparkles', 15)} Analyse draft`;
  }
}

async function decideFinding(button) {
  const id = button.dataset.finding;
  const suggestionField = document.querySelector(`[data-suggestion="${CSS.escape(id)}"]`);
  const decision = button.dataset.decision || '';
  const text = button.dataset.decision ? '' : suggestionField?.value || '';
  if (!decision) return;
  try {
    if (state.route.startsWith('draft/')) {
      const draftId = state.route.slice('draft/'.length);
      await api(`/drafts/${encodeURIComponent(draftId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ text: document.getElementById('working-draft')?.value || state.data.draft.workingText }),
      });
      state.editorDirty = false;
    }
    await api(`/findings/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ decision, ...(decision === 'edited' ? { suggestion: text } : {}) }),
    });
    notify(`Suggestion ${decision}. Your draft was not overwritten.`);
    await loadRoute(state.route);
  } catch (error) {
    notify(error.message, 'error');
  }
}

async function applySuggestion(button) {
  const id = button.dataset.finding;
  const draftId = state.route.slice('draft/'.length);
  const card = button.closest('.finding-card');
  const textArea = document.getElementById('working-draft');
  const suggestion = card?.querySelector(`[data-suggestion="${CSS.escape(id)}"]`)?.value
    || card?.querySelector('.suggested-copy')?.textContent
    || '';
  if (!textArea || !suggestion) {
    notify('There is no replacement suggestion to apply.', 'error');
    return;
  }
  const matched = button.dataset.matched;
  const currentText = textArea.value;
  if (!matched || !currentText.includes(matched)) {
    notify('The quoted draft text has changed. Update the draft manually, then save it.', 'error');
    return;
  }
  try {
    const savedSuggestion = state.data.findings.find((finding) => finding.id === id)?.suggestion;
    if (suggestion !== savedSuggestion) {
      await api(`/findings/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ decision: 'edited', suggestion }),
      });
    }
    await api(`/drafts/${encodeURIComponent(draftId)}/apply-suggestion`, {
      method: 'POST',
      body: JSON.stringify({ findingId: id, text: currentText.replace(matched, suggestion) }),
    });
    state.editorDirty = false;
    notify('Suggestion applied to your working copy. Your original remains unchanged.');
    await loadRoute(state.route);
  } catch (error) {
    notify(error.message, 'error');
  }
}

async function reviewDraft(action) {
  const feedback = document.getElementById('review-feedback');
  const buttons = [...document.querySelectorAll('.review-decision-buttons button')];
  const note = document.getElementById('review-note')?.value || '';
  buttons.forEach((button) => { button.disabled = true; });
  if (feedback) feedback.textContent = '';
  try {
    const id = state.route.slice('review/'.length);
    await api(`/drafts/${encodeURIComponent(id)}/review`, { method: 'POST', body: JSON.stringify({ action, note }) });
    notify(action === 'approve' ? 'Approved and recorded. A thoughtful job, done.' : 'Revision request sent and recorded.');
    navigate(action === 'approve' ? 'queue' : 'queue');
  } catch (error) {
    if (feedback) {
      feedback.className = 'form-feedback form-error';
      feedback.textContent = error.message;
    }
    buttons.forEach((button) => { button.disabled = false; });
  }
}

app.addEventListener('change', async (event) => {
  if (event.target.id === 'analysis-select') {
    state.data.analysisFilter = event.target.value;
    render();
    return;
  }
});

async function boot() {
  try {
    const result = await api('/session');
    state.user = result.user;
    state.csrfToken = result.csrfToken;
    state.aiConfigured = result.aiConfigured;
    state.route = 'dashboard';
    state.loading = true;
    render();
    loadRoute('dashboard').catch(handleLoadError);
  } catch {
    state.user = null;
    state.route = 'login';
    render();
  }
}

boot();
