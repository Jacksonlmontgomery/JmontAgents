// app.js - Main application logic for the Agent Build Dashboard

(function () {
    'use strict';

    let agents = loadAgents();

    // DOM references
    const summaryCards = document.getElementById('summaryCards');
    const departmentGrid = document.getElementById('departmentGrid');
    const agentTableBody = document.getElementById('agentTableBody');
    const filterDepartment = document.getElementById('filterDepartment');
    const filterStatus = document.getElementById('filterStatus');
    const searchInput = document.getElementById('searchInput');
    const lastUpdated = document.getElementById('lastUpdated');

    // Modal references
    const modalOverlay = document.getElementById('modalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const agentForm = document.getElementById('agentForm');
    const addAgentBtn = document.getElementById('addAgentBtn');
    const modalClose = document.getElementById('modalClose');
    const cancelBtn = document.getElementById('cancelBtn');

    // Delete modal references
    const deleteModalOverlay = document.getElementById('deleteModalOverlay');
    const deleteAgentName = document.getElementById('deleteAgentName');
    const deleteModalClose = document.getElementById('deleteModalClose');
    const deleteCancelBtn = document.getElementById('deleteCancelBtn');
    const deleteConfirmBtn = document.getElementById('deleteConfirmBtn');

    let pendingDeleteId = null;

    // === Initialization ===
    function init() {
        populateDepartmentFilter();
        render();
        bindEvents();
        updateTimestamp();
    }

    // === Event Binding ===
    function bindEvents() {
        filterDepartment.addEventListener('change', render);
        filterStatus.addEventListener('change', render);
        searchInput.addEventListener('input', render);

        addAgentBtn.addEventListener('click', () => openModal());
        modalClose.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });

        agentForm.addEventListener('submit', handleFormSubmit);

        deleteModalClose.addEventListener('click', closeDeleteModal);
        deleteCancelBtn.addEventListener('click', closeDeleteModal);
        deleteModalOverlay.addEventListener('click', (e) => {
            if (e.target === deleteModalOverlay) closeDeleteModal();
        });
        deleteConfirmBtn.addEventListener('click', confirmDelete);
    }

    // === Rendering ===
    function render() {
        const filtered = getFilteredAgents();
        renderSummaryCards();
        renderDepartmentGrid();
        renderTable(filtered);
    }

    function getFilteredAgents() {
        const dept = filterDepartment.value;
        const status = filterStatus.value;
        const search = searchInput.value.toLowerCase().trim();

        return agents.filter(a => {
            if (dept !== 'all' && a.department !== dept) return false;
            if (status !== 'all' && a.status !== status) return false;
            if (search && !a.name.toLowerCase().includes(search) &&
                !a.department.toLowerCase().includes(search) &&
                !a.owner.toLowerCase().includes(search)) return false;
            return true;
        });
    }

    // === Summary Cards ===
    function renderSummaryCards() {
        const total = agents.length;
        const deployed = agents.filter(a => a.status === 'deployed').length;
        const inProgress = agents.filter(a => a.status === 'in-progress').length;
        const testing = agents.filter(a => a.status === 'testing').length;
        const avgProgress = total > 0 ? Math.round(agents.reduce((s, a) => s + a.progress, 0) / total) : 0;
        const departments = new Set(agents.map(a => a.department)).size;

        const cards = [
            { label: 'Total Agents', value: total, color: 'var(--primary)' },
            { label: 'Deployed', value: deployed, color: 'var(--success)' },
            { label: 'In Progress', value: inProgress, color: 'var(--info)' },
            { label: 'Testing', value: testing, color: 'var(--warning)' },
            { label: 'Avg Progress', value: avgProgress + '%', color: '#a855f7' },
            { label: 'Departments', value: departments, color: '#ec4899' },
        ];

        summaryCards.innerHTML = cards.map(c => `
            <div class="summary-card">
                <div class="label">${c.label}</div>
                <div class="value" style="color: ${c.color}">${c.value}</div>
            </div>
        `).join('');
    }

    // === Department Grid ===
    function renderDepartmentGrid() {
        const deptMap = {};
        agents.forEach(a => {
            if (!deptMap[a.department]) deptMap[a.department] = [];
            deptMap[a.department].push(a);
        });

        const deptNames = Object.keys(deptMap).sort();

        departmentGrid.innerHTML = deptNames.map(dept => {
            const deptAgents = deptMap[dept];
            const count = deptAgents.length;
            const avgProg = Math.round(deptAgents.reduce((s, a) => s + a.progress, 0) / count);

            const statusCounts = {};
            deptAgents.forEach(a => {
                statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
            });

            const statuses = ['deployed', 'in-progress', 'testing', 'planning', 'paused'];
            const statsHtml = statuses
                .filter(s => statusCounts[s])
                .map(s => `
                    <div class="dept-stat">
                        <span class="dot dot-${s}"></span>
                        ${statusCounts[s]} ${formatStatus(s)}
                    </div>
                `).join('');

            return `
                <div class="dept-card">
                    <div class="dept-card-header">
                        <h3>${dept}</h3>
                        <span class="dept-agent-count">${count} agent${count !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="dept-stats">${statsHtml}</div>
                    <div class="dept-progress-bar">
                        <div class="dept-progress-fill" style="width: ${avgProg}%"></div>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 6px;">${avgProg}% avg completion</div>
                </div>
            `;
        }).join('');
    }

    // === Agent Table ===
    function renderTable(filtered) {
        if (filtered.length === 0) {
            agentTableBody.innerHTML = `
                <tr>
                    <td colspan="8">
                        <div class="empty-state">
                            <strong>No agents found</strong>
                            <p>Try adjusting your filters or add a new agent.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        agentTableBody.innerHTML = filtered.map(a => `
            <tr>
                <td>
                    <strong>${escapeHtml(a.name)}</strong>
                    ${a.description ? `<br><span style="font-size:0.75rem;color:var(--text-muted)">${escapeHtml(truncate(a.description, 60))}</span>` : ''}
                </td>
                <td>${escapeHtml(a.department)}</td>
                <td><span class="status-badge status-${a.status}">${formatStatus(a.status)}</span></td>
                <td>
                    <div class="progress-cell">
                        <div class="progress-bar"><div class="progress-fill" style="width:${a.progress}%"></div></div>
                        <span class="progress-text">${a.progress}%</span>
                    </div>
                </td>
                <td>${escapeHtml(a.owner || '-')}</td>
                <td>${a.startDate ? formatDate(a.startDate) : '-'}</td>
                <td>${a.targetDate ? formatDate(a.targetDate) : '-'}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon" onclick="editAgent('${a.id}')" title="Edit">&#9998;</button>
                        <button class="btn-icon" onclick="deleteAgent('${a.id}')" title="Delete">&#128465;</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // === Modal Handling ===
    function openModal(agent) {
        if (agent) {
            modalTitle.textContent = 'Edit Agent';
            document.getElementById('agentId').value = agent.id;
            document.getElementById('agentName').value = agent.name;
            document.getElementById('agentDepartment').value = agent.department;
            document.getElementById('agentStatus').value = agent.status;
            document.getElementById('agentProgress').value = agent.progress;
            document.getElementById('agentOwner').value = agent.owner || '';
            document.getElementById('agentPriority').value = agent.priority || 'medium';
            document.getElementById('agentStartDate').value = agent.startDate || '';
            document.getElementById('agentTargetDate').value = agent.targetDate || '';
            document.getElementById('agentDescription').value = agent.description || '';
        } else {
            modalTitle.textContent = 'Add New Agent';
            agentForm.reset();
            document.getElementById('agentId').value = '';
            document.getElementById('agentProgress').value = 0;
        }
        modalOverlay.classList.add('active');
    }

    function closeModal() {
        modalOverlay.classList.remove('active');
    }

    function handleFormSubmit(e) {
        e.preventDefault();

        const id = document.getElementById('agentId').value;
        const agentData = {
            id: id || generateId(),
            name: document.getElementById('agentName').value.trim(),
            department: document.getElementById('agentDepartment').value,
            status: document.getElementById('agentStatus').value,
            progress: parseInt(document.getElementById('agentProgress').value, 10) || 0,
            owner: document.getElementById('agentOwner').value.trim(),
            priority: document.getElementById('agentPriority').value,
            startDate: document.getElementById('agentStartDate').value,
            targetDate: document.getElementById('agentTargetDate').value,
            description: document.getElementById('agentDescription').value.trim(),
        };

        if (id) {
            const idx = agents.findIndex(a => a.id === id);
            if (idx !== -1) agents[idx] = agentData;
        } else {
            agents.push(agentData);
        }

        saveAgents(agents);
        populateDepartmentFilter();
        render();
        closeModal();
        updateTimestamp();
    }

    // === Delete Handling ===
    function closeDeleteModal() {
        deleteModalOverlay.classList.remove('active');
        pendingDeleteId = null;
    }

    function confirmDelete() {
        if (pendingDeleteId) {
            agents = agents.filter(a => a.id !== pendingDeleteId);
            saveAgents(agents);
            populateDepartmentFilter();
            render();
            updateTimestamp();
        }
        closeDeleteModal();
    }

    // === Global action handlers (called from inline onclick) ===
    window.editAgent = function (id) {
        const agent = agents.find(a => a.id === id);
        if (agent) openModal(agent);
    };

    window.deleteAgent = function (id) {
        const agent = agents.find(a => a.id === id);
        if (agent) {
            pendingDeleteId = id;
            deleteAgentName.textContent = agent.name;
            deleteModalOverlay.classList.add('active');
        }
    };

    // === Helpers ===
    function populateDepartmentFilter() {
        const current = filterDepartment.value;
        const departments = [...new Set(agents.map(a => a.department))].sort();
        filterDepartment.innerHTML = '<option value="all">All Departments</option>' +
            departments.map(d => `<option value="${d}">${d}</option>`).join('');
        filterDepartment.value = current;
    }

    function formatStatus(status) {
        return status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    function formatDate(dateStr) {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function truncate(str, len) {
        return str.length > len ? str.slice(0, len) + '...' : str;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function updateTimestamp() {
        lastUpdated.textContent = 'Updated: ' + new Date().toLocaleString();
    }

    // Boot
    init();
})();
