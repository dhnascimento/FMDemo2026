/**
 * DDR Table List Component
 *
 * Displays a searchable list of tables
 */

class DDRTableList extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.tables = [];
        this.filteredTables = [];
        this.selectedTableId = null;
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
                    border-right: 1px solid var(--color-border, #e2e8f0);
                    transition: background-color 0.3s ease, border-color 0.3s ease;
                }

                .table-list-container {
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

                .table-count {
                    margin-top: 0.5rem;
                    font-size: 0.85rem;
                    color: var(--color-text-muted, #64748b);
                }

                .table-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 0.5rem 0;
                }

                .table-item {
                    padding: 1rem 1.5rem;
                    cursor: pointer;
                    border-bottom: 1px solid var(--color-border-light, #f1f5f9);
                    transition: background 0.2s ease;
                }

                .table-item:hover {
                    background: var(--color-bg-secondary, #f8fafc);
                }

                .table-item.selected {
                    background: var(--color-bg-hover, #eff6ff);
                    border-left: 3px solid var(--color-primary, #2563eb);
                }

                .table-name {
                    font-weight: 600;
                    color: var(--color-text-primary, #1e293b);
                    margin-bottom: 0.25rem;
                }

                .table-info {
                    font-size: 0.85rem;
                    color: var(--color-text-muted, #64748b);
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

            <div class="table-list-container">
                <div class="header">
                    <h2>Base Tables</h2>
                    <input
                        type="text"
                        class="search-box"
                        id="searchInput"
                        placeholder="Search tables..."
                    >
                    <div class="table-count" id="tableCount">0 tables</div>
                </div>
                <div class="table-list" id="tableList">
                    <div class="loading-state">Loading tables...</div>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    attachEventListeners() {
        const searchInput = this.shadowRoot.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            this.filterTables(e.target.value);
        });
    }

    async loadTables() {
        try {
            const apiClient = window.ddrApiClient;
            this.tables = await apiClient.getTables();
            this.filteredTables = [...this.tables];
            this.renderTableList();
        } catch (error) {
            console.error('Error loading tables:', error);
            this.showError('Failed to load tables');
        }
    }

    filterTables(query) {
        const lowerQuery = query.toLowerCase();
        this.filteredTables = this.tables.filter(table =>
            table.name.toLowerCase().includes(lowerQuery)
        );
        this.renderTableList();
    }

    renderTableList() {
        const listEl = this.shadowRoot.getElementById('tableList');
        const countEl = this.shadowRoot.getElementById('tableCount');

        // Update count
        countEl.textContent = `${this.filteredTables.length} table${this.filteredTables.length !== 1 ? 's' : ''}`;

        if (this.filteredTables.length === 0) {
            listEl.innerHTML = '<div class="empty-state">No tables found</div>';
            return;
        }

        listEl.innerHTML = this.filteredTables
            .map(table => `
                <div
                    class="table-item ${table.id === this.selectedTableId ? 'selected' : ''}"
                    data-table-id="${table.id}"
                >
                    <div class="table-name">${this.escapeHtml(table.name)}</div>
                    <div class="table-info">${table.fieldCount} field${table.fieldCount !== 1 ? 's' : ''}</div>
                </div>
            `)
            .join('');

        // Attach click handlers
        listEl.querySelectorAll('.table-item').forEach(item => {
            item.addEventListener('click', () => {
                const tableId = item.getAttribute('data-table-id');
                this.selectTable(tableId);
            });
        });
    }

    selectTable(tableId) {
        this.selectedTableId = tableId;
        this.renderTableList();

        // Find the full table object
        const table = this.tables.find(t => t.id === tableId);

        // Dispatch event
        this.dispatchEvent(new CustomEvent('table-selected', {
            detail: { tableId, table },
            bubbles: true,
            composed: true
        }));
    }

    showError(message) {
        const listEl = this.shadowRoot.getElementById('tableList');
        listEl.innerHTML = `<div class="empty-state">${this.escapeHtml(message)}</div>`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

customElements.define('ddr-table-list', DDRTableList);

export default DDRTableList;
