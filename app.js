// app.js - Dashboard logic

(function () {
    'use strict';

    let agents = loadAgents();
    let openDepts = {};

    // DOM refs
    const kpiStrip = document.getElementById('kpiStrip');
    const deptList = document.getElementById('deptList');
    const filterDepartment = document.getElementById('filterDepartment');
    const filterStatus = document.getElementById('filterStatus');
    const searchInput = document.getElementById('searchInput');

    const modalBg = document.getElementById('modalBg');
    const modalTitle = document.getElementById('modalTitle');
    const agentForm = document.getElementById('agentForm');
    const addAgentBtn = document.getElementById('addAgentBtn');
    const modalClose = document.getElementById('modalClose');
    const cancelBtn = document.getElementById('cancelBtn');
    const exportBtn = document.getElementById('exportBtn');

    const deleteBg = document.getElementById('deleteBg');
    const deleteAgentName = document.getElementById('deleteAgentName');
    const deleteClose = document.getElementById('deleteClose');
    const deleteCancelBtn = document.getElementById('deleteCancelBtn');
    const deleteConfirmBtn = document.getElementById('deleteConfirmBtn');

    let pendingDeleteId = null;

    // === Init ===
    function init() {
        populateDepartmentFilter();
        render();
        bindEvents();
        setupModalTabs();
        setupSavingsCompute();
    }

    // === Events ===
    function bindEvents() {
        filterDepartment.addEventListener('change', render);
        filterStatus.addEventListener('change', render);
        searchInput.addEventListener('input', render);

        addAgentBtn.addEventListener('click', () => openModal());
        modalClose.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        modalBg.addEventListener('click', (e) => {
            if (e.target === modalBg) closeModal();
        });
        agentForm.addEventListener('submit', handleSave);

        deleteClose.addEventListener('click', closeDeleteModal);
        deleteCancelBtn.addEventListener('click', closeDeleteModal);
        deleteBg.addEventListener('click', (e) => {
            if (e.target === deleteBg) closeDeleteModal();
        });
        deleteConfirmBtn.addEventListener('click', confirmDelete);

        exportBtn.addEventListener('click', exportData);
    }

    // === Modal Tabs ===
    function setupModalTabs() {
        document.querySelectorAll('.modal-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                document.querySelector(`[data-panel="${tab.dataset.tab}"]`).classList.add('active');
            });
        });
    }

    // === Live savings calc ===
    function setupSavingsCompute() {
        const hrs = document.getElementById('agentHoursSaved');
        const rate = document.getElementById('agentBlendedRate');
        const display = document.getElementById('computedSavings');

        function update() {
            const h = parseFloat(hrs.value) || 0;
            const r = parseFloat(rate.value) || 0;
            const annual = h * r * 52;
            display.textContent = '$' + annual.toLocaleString();
        }

        hrs.addEventListener('input', update);
        rate.addEventListener('input', update);
    }

    // === Rendering ===
    function render() {
        const filtered = getFiltered();
        renderKPIs(filtered);
        renderDepartments(filtered);
    }

    function getFiltered() {
        const dept = filterDepartment.value;
        const status = filterStatus.value;
        const q = searchInput.value.toLowerCase().trim();

        return agents.filter(a => {
            if (dept !== 'all' && a.department !== dept) return false;
            if (status !== 'all' && a.status !== status) return false;
            if (q && !a.name.toLowerCase().includes(q) &&
                !a.department.toLowerCase().includes(q) &&
                !(a.owner || '').toLowerCase().includes(q)) return false;
            return true;
        });
    }

    // === KPIs ===
    function renderKPIs(filtered) {
        // Use all agents for top-level KPIs (not filtered)
        const all = agents;
        const totalSavedYear = all.reduce((s, a) => s + calcAnnualSavings(a), 0);
        const totalSavedMonth = Math.round(totalSavedYear / 12);
        const totalHrsWeek = all.reduce((s, a) => s + (a.hoursSaved || 0), 0);
        const activeUserSet = new Set();
        all.forEach(a => {
            if (a.activeUsers) {
                a.activeUsers.split(',').forEach(u => {
                    const name = u.trim();
                    if (name) activeUserSet.add(name.toLowerCase());
                });
            }
        });
        const adoptedWorkflows = all.filter(a =>
            (a.status === 'deployed' || a.status === 'active') && (a.usesPerWeek || 0) > 0
        ).length;

        kpiStrip.innerHTML = `
            <div class="kpi-card">
                <div class="kpi-label">Saved / Month</div>
                <div class="kpi-value green">$${totalSavedMonth.toLocaleString()}</div>
                <div class="kpi-sub">${totalHrsWeek} hrs/week across all agents</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Saved / Year</div>
                <div class="kpi-value green">$${totalSavedYear.toLocaleString()}</div>
                <div class="kpi-sub">At current blended rates</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Workflows Adopted</div>
                <div class="kpi-value navy">${adoptedWorkflows}</div>
                <div class="kpi-sub">of ${all.length} total agents</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Active Users</div>
                <div class="kpi-value navy">${activeUserSet.size}</div>
                <div class="kpi-sub">Across all departments</div>
            </div>
        `;
    }

    // === Departments ===
    function renderDepartments(filtered) {
        // Group by department
        const deptMap = {};
        filtered.forEach(a => {
            if (!deptMap[a.department]) deptMap[a.department] = [];
            deptMap[a.department].push(a);
        });

        const deptNames = Object.keys(deptMap).sort();

        if (deptNames.length === 0) {
            deptList.innerHTML = '<div class="empty-dept">No agents match your filters.</div>';
            return;
        }

        deptList.innerHTML = deptNames.map(dept => {
            const items = deptMap[dept];
            const color = getDeptColor(dept);
            const isOpen = openDepts[dept];
            const deptSavings = items.reduce((s, a) => s + calcAnnualSavings(a), 0);
            const deptHrs = items.reduce((s, a) => s + (a.hoursSaved || 0), 0);
            const deployedCount = items.filter(a => a.status === 'deployed' || a.status === 'active').length;

            const agentsHtml = items.map(a => renderAgent(a)).join('');

            return `
                <div class="dept-card${isOpen ? ' open' : ''}" data-dept="${esc(dept)}">
                    <div class="dept-header" onclick="toggleDept('${esc(dept)}')">
                        <div class="dept-color-dot" style="background:${color}"></div>
                        <div class="dept-name">${esc(dept)}</div>
                        <div class="dept-meta">
                            <div class="dept-meta-item">
                                <span class="dept-meta-value">${items.length}</span> agent${items.length !== 1 ? 's' : ''}
                            </div>
                            <div class="dept-meta-item">
                                <span class="dept-meta-value">${deployedCount}</span> live
                            </div>
                            <div class="dept-meta-item">
                                <span class="dept-meta-value">${deptHrs}</span> hrs/wk saved
                            </div>
                            <div class="dept-meta-item">
                                <span class="dept-meta-value" style="color:var(--green)">$${Math.round(deptSavings / 12).toLocaleString()}</span>/mo
                            </div>
                        </div>
                        <svg class="dept-chevron" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"/>
                        </svg>
                    </div>
                    <div class="dept-body">${agentsHtml}</div>
                </div>
            `;
        }).join('');
    }

    function renderAgent(a) {
        const savings = calcAnnualSavings(a);
        const monthlySavings = Math.round(savings / 12);
        const isStale = a.lastUsed && daysSince(a.lastUsed) > 14;
        const isNeverUsed = !a.lastUsed && (a.status === 'deployed' || a.status === 'active');

        let metricsHtml = '';

        if (a.usesPerWeek > 0) {
            metricsHtml += `<span class="agent-metric"><strong>${a.usesPerWeek}</strong> uses/wk</span>`;
        }
        if (a.activeUsers) {
            const count = a.activeUsers.split(',').filter(u => u.trim()).length;
            metricsHtml += `<span class="agent-metric"><strong>${count}</strong> user${count !== 1 ? 's' : ''}</span>`;
        }
        if (a.lastUsed) {
            const days = daysSince(a.lastUsed);
            const label = days === 0 ? 'today' : days === 1 ? 'yesterday' : days + 'd ago';
            metricsHtml += `<span class="agent-metric ${isStale ? 'metric-stale' : ''}">Last: <strong>${label}</strong></span>`;
        }
        if (a.hoursSaved > 0) {
            metricsHtml += `<span class="agent-metric"><strong>${a.hoursSaved}</strong> hrs/wk</span>`;
        }
        if (monthlySavings > 0) {
            metricsHtml += `<span class="agent-metric metric-dollars">$${monthlySavings.toLocaleString()}/mo</span>`;
        }

        let revHtml = '';
        if (a.revenueInfluence === 'direct') {
            revHtml = `<span class="rev-badge rev-direct">Revenue: Direct</span>`;
        } else if (a.revenueInfluence === 'indirect') {
            revHtml = `<span class="rev-badge rev-indirect">Revenue: Indirect</span>`;
        }

        let replacesHtml = '';
        if (a.replaces) {
            replacesHtml = `<div class="agent-replaces">Replaces: ${esc(a.replaces)}</div>`;
        }

        let warningHtml = '';
        if (isStale) {
            warningHtml = `<div class="agent-replaces" style="color:#dc2626">Not used in ${daysSince(a.lastUsed)} days - validate if still needed</div>`;
        } else if (isNeverUsed) {
            warningHtml = `<div class="agent-replaces" style="color:#dc2626">Marked active but no usage recorded</div>`;
        }

        return `
            <div class="agent-item">
                <div class="agent-main">
                    <div class="agent-top-row">
                        <span class="agent-name">${esc(a.name)}</span>
                        <span class="badge badge-${a.status}">${formatStatus(a.status)}</span>
                        ${revHtml}
                    </div>
                    ${a.description ? `<div class="agent-desc">${esc(a.description)}</div>` : ''}
                    ${metricsHtml ? `<div class="agent-metrics">${metricsHtml}</div>` : ''}
                    ${replacesHtml}
                    ${warningHtml}
                    ${a.revenueNote ? `<div class="agent-desc" style="margin-top:4px;font-size:0.72rem;color:var(--gray-500)">${esc(a.revenueNote)}</div>` : ''}
                </div>
                <div class="agent-actions">
                    <button class="btn-icon" onclick="editAgent('${a.id}')" title="Edit">&#9998;</button>
                    <button class="btn-icon" onclick="deleteAgent('${a.id}')" title="Delete">&times;</button>
                </div>
            </div>
        `;
    }

    // === Dept toggle ===
    window.toggleDept = function (dept) {
        openDepts[dept] = !openDepts[dept];
        const card = document.querySelector(`.dept-card[data-dept="${dept}"]`);
        if (card) card.classList.toggle('open');
    };

    // === Modal ===
    function openModal(agent) {
        // Reset tabs to first
        document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        document.querySelector('[data-tab="details"]').classList.add('active');
        document.querySelector('[data-panel="details"]').classList.add('active');

        if (agent) {
            modalTitle.textContent = 'Edit Agent';
            document.getElementById('agentId').value = agent.id;
            document.getElementById('agentName').value = agent.name || '';
            document.getElementById('agentDepartment').value = agent.department || '';
            document.getElementById('agentStatus').value = agent.status || 'planning';
            document.getElementById('agentOwner').value = agent.owner || '';
            document.getElementById('agentStartDate').value = agent.startDate || '';
            document.getElementById('agentTargetDate').value = agent.targetDate || '';
            document.getElementById('agentDescription').value = agent.description || '';
            document.getElementById('agentUsesPerWeek').value = agent.usesPerWeek || 0;
            document.getElementById('agentActiveUsers').value = agent.activeUsers || '';
            document.getElementById('agentLastUsed').value = agent.lastUsed || '';
            document.getElementById('agentHoursSaved').value = agent.hoursSaved || 0;
            document.getElementById('agentBlendedRate').value = agent.blendedRate || 100;
            document.getElementById('agentRevenueInfluence').value = agent.revenueInfluence || 'none';
            document.getElementById('agentRevenueNote').value = agent.revenueNote || '';
            document.getElementById('agentReplaces').value = agent.replaces || '';
        } else {
            modalTitle.textContent = 'New Agent';
            agentForm.reset();
            document.getElementById('agentId').value = '';
            document.getElementById('agentBlendedRate').value = 100;
        }

        // Update computed savings
        const h = parseFloat(document.getElementById('agentHoursSaved').value) || 0;
        const r = parseFloat(document.getElementById('agentBlendedRate').value) || 0;
        document.getElementById('computedSavings').textContent = '$' + (h * r * 52).toLocaleString();

        modalBg.classList.add('active');
    }

    function closeModal() {
        modalBg.classList.remove('active');
    }

    function handleSave(e) {
        e.preventDefault();
        const id = document.getElementById('agentId').value;

        const data = {
            id: id || generateId(),
            name: document.getElementById('agentName').value.trim(),
            department: document.getElementById('agentDepartment').value,
            status: document.getElementById('agentStatus').value,
            owner: document.getElementById('agentOwner').value.trim(),
            startDate: document.getElementById('agentStartDate').value,
            targetDate: document.getElementById('agentTargetDate').value,
            description: document.getElementById('agentDescription').value.trim(),
            usesPerWeek: parseInt(document.getElementById('agentUsesPerWeek').value, 10) || 0,
            activeUsers: document.getElementById('agentActiveUsers').value.trim(),
            lastUsed: document.getElementById('agentLastUsed').value,
            hoursSaved: parseFloat(document.getElementById('agentHoursSaved').value) || 0,
            blendedRate: parseFloat(document.getElementById('agentBlendedRate').value) || 0,
            revenueInfluence: document.getElementById('agentRevenueInfluence').value,
            revenueNote: document.getElementById('agentRevenueNote').value.trim(),
            replaces: document.getElementById('agentReplaces').value.trim(),
        };

        if (id) {
            const idx = agents.findIndex(a => a.id === id);
            if (idx !== -1) agents[idx] = data;
        } else {
            agents.push(data);
        }

        saveAgents(agents);
        populateDepartmentFilter();
        render();
        closeModal();
    }

    // === Delete ===
    function closeDeleteModal() {
        deleteBg.classList.remove('active');
        pendingDeleteId = null;
    }

    function confirmDelete() {
        if (pendingDeleteId) {
            agents = agents.filter(a => a.id !== pendingDeleteId);
            saveAgents(agents);
            populateDepartmentFilter();
            render();
        }
        closeDeleteModal();
    }

    window.editAgent = function (id) {
        const agent = agents.find(a => a.id === id);
        if (agent) openModal(agent);
    };

    window.deleteAgent = function (id) {
        const agent = agents.find(a => a.id === id);
        if (agent) {
            pendingDeleteId = id;
            deleteAgentName.textContent = agent.name;
            deleteBg.classList.add('active');
        }
    };

    // === Export ===
    function exportData() {
        const blob = new Blob([JSON.stringify(agents, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'jmontagents-export.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    // === Helpers ===
    function populateDepartmentFilter() {
        const current = filterDepartment.value;
        const depts = [...new Set(agents.map(a => a.department))].sort();
        filterDepartment.innerHTML = '<option value="all">All Departments</option>' +
            depts.map(d => `<option value="${d}">${d}</option>`).join('');
        filterDepartment.value = current;
    }

    function formatStatus(s) {
        return s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    function daysSince(dateStr) {
        if (!dateStr) return 999;
        const d = new Date(dateStr + 'T00:00:00');
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return Math.max(0, Math.floor((now - d) / 86400000));
    }

    function esc(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Boot
    init();
})();
