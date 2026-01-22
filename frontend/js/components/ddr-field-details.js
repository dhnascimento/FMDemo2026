/**
 * DDR Field Details Component
 *
 * Displays detailed information about a selected table
 */

class DDRFieldDetails extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.tableData = null;
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
                    overflow-y: auto;
                    transition: background-color 0.3s ease, border-color 0.3s ease;
                }

                .details-container {
                    padding: 1.5rem;
                }

                .empty-state {
                    text-align: center;
                    color: var(--color-text-muted, #64748b);
                    padding: 3rem 1.5rem;
                }

                .empty-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }

                .section {
                    margin-bottom: 2rem;
                }

                .section-title {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: var(--color-text-primary, #1e293b);
                    margin-bottom: 1rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 2px solid var(--color-border, #e2e8f0);
                }

                .info-grid {
                    display: grid;
                    grid-template-columns: auto 1fr;
                    gap: 0.75rem;
                    margin-bottom: 1rem;
                }

                .info-label {
                    font-weight: 600;
                    color: var(--color-text-muted, #64748b);
                }

                .info-value {
                    color: var(--color-text-primary, #1e293b);
                }

                .field-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .field-item {
                    padding: 1rem;
                    background: var(--color-bg-secondary, #f8fafc);
                    border-radius: 6px;
                    border-left: 3px solid var(--color-primary, #2563eb);
                    transition: background-color 0.3s ease;
                }

                .field-name {
                    font-weight: 600;
                    color: var(--color-text-primary, #1e293b);
                    margin-bottom: 0.25rem;
                }

                .field-meta {
                    display: flex;
                    gap: 1rem;
                    font-size: 0.85rem;
                    color: var(--color-text-muted, #64748b);
                }

                .badge {
                    display: inline-block;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    transition: background-color 0.3s ease, color 0.3s ease;
                }

                .badge-normal {
                    background: var(--color-badge-normal-bg, #dbeafe);
                    color: var(--color-badge-normal-text, #1e40af);
                }

                .badge-calculated {
                    background: var(--color-badge-calculated-bg, #fef3c7);
                    color: var(--color-badge-calculated-text, #92400e);
                }

                .badge-summary {
                    background: var(--color-badge-summary-bg, #dcfce7);
                    color: var(--color-badge-summary-text, #166534);
                }

                .relationship-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .relationship-item {
                    padding: 1rem;
                    background: var(--color-bg-tertiary, #f1f5f9);
                    border-radius: 6px;
                    transition: background-color 0.3s ease;
                }

                .relationship-tables {
                    font-weight: 600;
                    color: var(--color-text-primary, #1e293b);
                    margin-bottom: 0.5rem;
                }

                .relationship-arrow {
                    color: var(--color-text-muted, #64748b);
                    margin: 0 0.5rem;
                }

                .relationship-fields {
                    font-size: 0.85rem;
                    color: var(--color-text-muted, #64748b);
                    margin-top: 0.5rem;
                }

                .relationship-options {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 0.5rem;
                    flex-wrap: wrap;
                }

                .option-tag {
                    padding: 0.25rem 0.5rem;
                    background: var(--color-accent-red-light, #fee2e2);
                    color: var(--color-error-text, #991b1b);
                    border-radius: 4px;
                    font-size: 0.75rem;
                    transition: background-color 0.3s ease, color 0.3s ease;
                }

                .loading-state {
                    text-align: center;
                    padding: 2rem;
                    color: var(--color-text-muted, #64748b);
                }
            </style>

            <div class="details-container" id="detailsContainer">
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <p>Select a table to view details</p>
                </div>
            </div>
        `;
    }

    async loadTableDetails(tableId) {
        this.showLoading();

        try {
            const apiClient = window.ddrApiClient;
            this.tableData = await apiClient.getTableDetails(tableId);
            this.renderDetails();
        } catch (error) {
            console.error('Error loading table details:', error);
            this.showError('Failed to load table details');
        }
    }

    renderDetails() {
        const container = this.shadowRoot.getElementById('detailsContainer');

        if (!this.tableData) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <p>Select a table to view details</p>
                </div>
            `;
            return;
        }

        const { tableOccurrence, baseTable, relationships } = this.tableData;

        let html = '';

        // Table occurrence info
        if (tableOccurrence) {
            html += `
                <div class="section">
                    <div class="section-title">Table Occurrence</div>
                    <div class="info-grid">
                        <div class="info-label">Name:</div>
                        <div class="info-value">${this.escapeHtml(tableOccurrence.name)}</div>
                        <div class="info-label">ID:</div>
                        <div class="info-value">${this.escapeHtml(tableOccurrence.id)}</div>
                        <div class="info-label">Base Table:</div>
                        <div class="info-value">${this.escapeHtml(tableOccurrence.baseTableName)}</div>
                    </div>
                </div>
            `;
        }

        // Base table info and fields
        if (baseTable) {
            html += `
                <div class="section">
                    <div class="section-title">Base Table: ${this.escapeHtml(baseTable.name)}</div>
                    <div class="info-grid">
                        <div class="info-label">ID:</div>
                        <div class="info-value">${this.escapeHtml(baseTable.id)}</div>
                        <div class="info-label">Fields:</div>
                        <div class="info-value">${baseTable.fieldCount}</div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Fields</div>
                    <div class="field-list">
            `;

            for (const field of baseTable.fields) {
                const badgeClass = `badge-${field.fieldType.toLowerCase()}`;
                html += `
                    <div class="field-item">
                        <div class="field-name">${this.escapeHtml(field.name)}</div>
                        <div class="field-meta">
                            <span class="badge ${badgeClass}">${this.escapeHtml(field.fieldType)}</span>
                            <span>${this.escapeHtml(field.dataType)}</span>
                        </div>
                    </div>
                `;
            }

            html += `
                    </div>
                </div>
            `;
        }

        // Relationships
        if (relationships && relationships.length > 0) {
            html += `
                <div class="section">
                    <div class="section-title">Relationships (${relationships.length})</div>
                    <div class="relationship-list">
            `;

            for (const rel of relationships) {
                const isLeftTable = tableOccurrence && rel.leftTable.id === tableOccurrence.id;
                const otherTable = isLeftTable ? rel.rightTable : rel.leftTable;

                html += `
                    <div class="relationship-item">
                        <div class="relationship-tables">
                            ${this.escapeHtml(rel.leftTable.name)}
                            <span class="relationship-arrow">→</span>
                            ${this.escapeHtml(rel.rightTable.name)}
                        </div>
                `;

                // Join predicates
                if (rel.joinPredicates && rel.joinPredicates.length > 0) {
                    html += '<div class="relationship-fields">';
                    for (const jp of rel.joinPredicates) {
                        html += `
                            ${this.escapeHtml(jp.leftField.name)} ${jp.type === 'Equal' ? '=' : jp.type}
                            ${this.escapeHtml(jp.rightField.name)}<br>
                        `;
                    }
                    html += '</div>';
                }

                // Cascade options
                const options = [];
                if (rel.cascadeCreateLeft) options.push('Create Left');
                if (rel.cascadeDeleteLeft) options.push('Delete Left');
                if (rel.cascadeCreateRight) options.push('Create Right');
                if (rel.cascadeDeleteRight) options.push('Delete Right');

                if (options.length > 0) {
                    html += '<div class="relationship-options">';
                    for (const option of options) {
                        html += `<span class="option-tag">${option}</span>`;
                    }
                    html += '</div>';
                }

                html += '</div>';
            }

            html += `
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    showLoading() {
        const container = this.shadowRoot.getElementById('detailsContainer');
        container.innerHTML = '<div class="loading-state">Loading details...</div>';
    }

    showError(message) {
        const container = this.shadowRoot.getElementById('detailsContainer');
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <p>${this.escapeHtml(message)}</p>
            </div>
        `;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

customElements.define('ddr-field-details', DDRFieldDetails);

export default DDRFieldDetails;
