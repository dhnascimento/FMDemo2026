/**
 * DDR Variable List Component
 *
 * Displays global and local variables with tabs and search
 */

class DDRVariableList extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.globalVariables = [];
        this.localVariables = [];
        this.filteredGlobals = [];
        this.filteredLocals = [];
        this.activeTab = 'global'; // 'global' or 'local'
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    height: 100%;
                    background: var(--color-bg-primary, #ffffff);
                    border-left: 1px solid var(--color-border, #e2e8f0);
                    transition: background-color 0.3s ease, border-color 0.3s ease;
                }

                .variable-list-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }

                .header {
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--color-border, #e2e8f0);
                    background: var(--color-bg-secondary, #f8fafc);
                    transition: background-color 0.3s ease, border-color 0.3s ease;
                }

                .header h2 {
                    margin: 0 0 1rem 0;
                    font-size: 1.25rem;
                    color: var(--color-text-primary, #1e293b);
                }

                .tabs {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }

                .tab {
                    flex: 1;
                    padding: 0.5rem 1rem;
                    border: 1px solid var(--color-border-input, #cbd5e1);
                    background: var(--color-bg-primary, #ffffff);
                    color: var(--color-text-primary, #1e293b);
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 0.9rem;
                    text-align: center;
                }

                .tab:hover {
                    background: var(--color-bg-tertiary, #f1f5f9);
                }

                .tab.active {
                    background: var(--color-primary, #2563eb);
                    color: white;
                    border-color: var(--color-primary, #2563eb);
                }

                .search-box {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid var(--color-border-input, #cbd5e1);
                    border-radius: 6px;
                    font-size: 0.9rem;
                    box-sizing: border-box;
                    background: var(--color-bg-primary, #ffffff);
                    color: var(--color-text-primary, #1e293b);
                    transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
                }

                .search-box:focus {
                    outline: none;
                    border-color: var(--color-primary, #2563eb);
                }

                .search-box::placeholder {
                    color: var(--color-text-muted, #64748b);
                }

                .variable-count {
                    margin-top: 0.5rem;
                    font-size: 0.85rem;
                    color: var(--color-text-muted, #64748b);
                }

                .variable-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 0.5rem 0;
                }

                .variable-item {
                    padding: 1rem 1.5rem;
                    cursor: pointer;
                    border-bottom: 1px solid var(--color-border-light, #f1f5f9);
                    transition: background 0.2s ease;
                }

                .variable-item:hover {
                    background: var(--color-bg-secondary, #f8fafc);
                }

                .variable-name {
                    font-weight: 600;
                    color: var(--color-text-primary, #1e293b);
                    margin-bottom: 0.25rem;
                    font-family: 'Courier New', monospace;
                }

                .variable-name.global {
                    color: var(--color-accent-red, #dc2626);
                }

                .variable-name.local {
                    color: var(--color-primary, #2563eb);
                }

                .variable-info {
                    font-size: 0.85rem;
                    color: var(--color-text-muted, #64748b);
                }

                .variable-scripts {
                    margin-top: 0.5rem;
                    padding-left: 1rem;
                }

                .script-name {
                    font-size: 0.8rem;
                    color: var(--color-text-muted, #64748b);
                    margin: 0.25rem 0;
                }

                .empty-state {
                    padding: 2rem 1.5rem;
                    text-align: center;
                    color: var(--color-text-muted, #64748b);
                }

                .loading-state {
                    padding: 2rem 1.5rem;
                    text-align: center;
                    color: var(--color-text-muted, #64748b);
                }
            </style>

            <div class="variable-list-container">
                <div class="header">
                    <h2>Variables</h2>
                    <div class="tabs">
                        <button class="tab active" id="globalTab">
                            Global ($$)
                        </button>
                        <button class="tab" id="localTab">
                            Local ($)
                        </button>
                    </div>
                    <input
                        type="text"
                        class="search-box"
                        id="searchInput"
                        placeholder="Search variables..."
                    >
                    <div class="variable-count" id="variableCount">0 variables</div>
                </div>
                <div class="variable-list" id="variableList">
                    <div class="loading-state">Loading variables...</div>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    attachEventListeners() {
        const searchInput = this.shadowRoot.getElementById('searchInput');
        const globalTab = this.shadowRoot.getElementById('globalTab');
        const localTab = this.shadowRoot.getElementById('localTab');

        searchInput.addEventListener('input', (e) => {
            this.filterVariables(e.target.value);
        });

        globalTab.addEventListener('click', () => {
            this.setActiveTab('global');
        });

        localTab.addEventListener('click', () => {
            this.setActiveTab('local');
        });
    }

    setActiveTab(tab) {
        this.activeTab = tab;

        // Update tab styles
        const globalTab = this.shadowRoot.getElementById('globalTab');
        const localTab = this.shadowRoot.getElementById('localTab');

        if (tab === 'global') {
            globalTab.classList.add('active');
            localTab.classList.remove('active');
        } else {
            localTab.classList.add('active');
            globalTab.classList.remove('active');
        }

        // Clear search
        this.shadowRoot.getElementById('searchInput').value = '';
        this.filterVariables('');
    }

    async loadVariables() {
        try {
            const apiClient = window.ddrApiClient;
            const data = await apiClient.getVariables();

            this.globalVariables = data.globalVariables;
            this.localVariables = data.localVariables;
            this.filteredGlobals = [...this.globalVariables];
            this.filteredLocals = [...this.localVariables];

            this.renderVariableList();
        } catch (error) {
            console.error('Error loading variables:', error);
            this.showError('Failed to load variables');
        }
    }

    filterVariables(query) {
        const lowerQuery = query.toLowerCase();

        this.filteredGlobals = this.globalVariables.filter(v =>
            v.name.toLowerCase().includes(lowerQuery) ||
            v.scripts.some(s => s.toLowerCase().includes(lowerQuery))
        );

        this.filteredLocals = this.localVariables.filter(v =>
            v.name.toLowerCase().includes(lowerQuery) ||
            v.scripts.some(s => s.toLowerCase().includes(lowerQuery))
        );

        this.renderVariableList();
    }

    renderVariableList() {
        const listEl = this.shadowRoot.getElementById('variableList');
        const countEl = this.shadowRoot.getElementById('variableCount');

        const variables = this.activeTab === 'global' ? this.filteredGlobals : this.filteredLocals;
        const varType = this.activeTab === 'global' ? 'global' : 'local';

        // Update count
        countEl.textContent = `${variables.length} variable${variables.length !== 1 ? 's' : ''}`;

        if (variables.length === 0) {
            listEl.innerHTML = '<div class="empty-state">No variables found</div>';
            return;
        }

        listEl.innerHTML = variables
            .map(variable => `
                <div class="variable-item" data-variable-name="${this.escapeHtml(variable.name)}">
                    <div class="variable-name ${varType}">${this.escapeHtml(variable.name)}</div>
                    <div class="variable-info">Used in ${variable.usageCount} script${variable.usageCount !== 1 ? 's' : ''}</div>
                    ${variable.scripts.length <= 3 ? `
                        <div class="variable-scripts">
                            ${variable.scripts.map(s => `
                                <div class="script-name">→ ${this.escapeHtml(s)}</div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="variable-scripts">
                            ${variable.scripts.slice(0, 2).map(s => `
                                <div class="script-name">→ ${this.escapeHtml(s)}</div>
                            `).join('')}
                            <div class="script-name">... and ${variable.scripts.length - 2} more</div>
                        </div>
                    `}
                </div>
            `)
            .join('');

        // Attach click handlers
        listEl.querySelectorAll('.variable-item').forEach(item => {
            item.addEventListener('click', () => {
                const varName = item.getAttribute('data-variable-name');
                this.selectVariable(varName);
            });
        });
    }

    selectVariable(varName) {
        // Find the variable
        const variable = this.activeTab === 'global'
            ? this.globalVariables.find(v => v.name === varName)
            : this.localVariables.find(v => v.name === varName);

        // Dispatch event
        this.dispatchEvent(new CustomEvent('variable-selected', {
            detail: { variable, type: this.activeTab },
            bubbles: true,
            composed: true
        }));
    }

    showError(message) {
        const listEl = this.shadowRoot.getElementById('variableList');
        listEl.innerHTML = `<div class="empty-state">${this.escapeHtml(message)}</div>`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

customElements.define('ddr-variable-list', DDRVariableList);

export default DDRVariableList;
