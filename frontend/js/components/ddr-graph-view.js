/**
 * DDR Graph View Component
 *
 * Visualizes table relationships using Cytoscape.js
 */

class DDRGraphView extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.cy = null;
        this.graphData = null;
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
                    position: relative;
                }

                .graph-container {
                    width: 100%;
                    height: 100%;
                    background: #f8fafc;
                    position: relative;
                }

                #cy {
                    width: 100%;
                    height: 100%;
                }

                .graph-controls {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    z-index: 10;
                }

                .control-btn {
                    background: white;
                    border: 1px solid #cbd5e1;
                    padding: 0.75rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 1.2rem;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                .control-btn:hover {
                    background: #f1f5f9;
                    border-color: #2563eb;
                }

                .loading-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(248, 250, 252, 0.95);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 20;
                }

                .loading-overlay.hidden {
                    display: none;
                }

                .loading-content {
                    text-align: center;
                    color: #64748b;
                }

                .loading-spinner {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                    animation: spin 2s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .empty-state {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                    color: #64748b;
                }
            </style>

            <div class="graph-container">
                <div id="cy"></div>

                <div class="graph-controls">
                    <button class="control-btn" id="fitBtn" title="Fit to screen">🎯</button>
                    <button class="control-btn" id="zoomInBtn" title="Zoom in">➕</button>
                    <button class="control-btn" id="zoomOutBtn" title="Zoom out">➖</button>
                    <button class="control-btn" id="resetBtn" title="Reset view">🔄</button>
                </div>

                <div class="loading-overlay" id="loadingOverlay">
                    <div class="loading-content">
                        <div class="loading-spinner">⚙️</div>
                        <div>Loading relationship graph...</div>
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    attachEventListeners() {
        const fitBtn = this.shadowRoot.getElementById('fitBtn');
        const zoomInBtn = this.shadowRoot.getElementById('zoomInBtn');
        const zoomOutBtn = this.shadowRoot.getElementById('zoomOutBtn');
        const resetBtn = this.shadowRoot.getElementById('resetBtn');

        fitBtn.addEventListener('click', () => this.fitGraph());
        zoomInBtn.addEventListener('click', () => this.zoomIn());
        zoomOutBtn.addEventListener('click', () => this.zoomOut());
        resetBtn.addEventListener('click', () => this.resetGraph());
    }

    async loadGraph() {
        this.showLoading();

        try {
            const apiClient = window.ddrApiClient;
            this.graphData = await apiClient.getRelationships();
            this.initializeCytoscape();
            this.hideLoading();
        } catch (error) {
            console.error('Error loading graph:', error);
            this.hideLoading();
            this.showError('Failed to load relationship graph');
        }
    }

    initializeCytoscape() {
        const container = this.shadowRoot.getElementById('cy');

        // Initialize Cytoscape
        this.cy = cytoscape({
            container: container,
            elements: {
                nodes: this.graphData.nodes,
                edges: this.graphData.edges
            },
            style: [
                {
                    selector: 'node',
                    style: {
                        'label': 'data(label)',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'background-color': '#2563eb',
                        'color': '#1e293b',
                        'font-size': '12px',
                        'width': 'label',
                        'height': 'label',
                        'padding': '12px',
                        'shape': 'roundrectangle',
                        'text-wrap': 'wrap',
                        'text-max-width': '150px',
                        'border-width': 2,
                        'border-color': '#1e40af'
                    }
                },
                {
                    selector: 'node:selected',
                    style: {
                        'background-color': '#1d4ed8',
                        'border-color': '#1e3a8a',
                        'border-width': 3
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 2,
                        'line-color': '#94a3b8',
                        'target-arrow-color': '#94a3b8',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        'label': 'data(label)',
                        'font-size': '10px',
                        'color': '#64748b',
                        'text-rotation': 'autorotate',
                        'text-margin-y': -10
                    }
                },
                {
                    selector: 'edge:selected',
                    style: {
                        'line-color': '#2563eb',
                        'target-arrow-color': '#2563eb',
                        'width': 3
                    }
                },
                {
                    selector: 'edge[cascadeDeleteLeft = true]',
                    style: {
                        'line-color': '#dc2626',
                        'target-arrow-color': '#dc2626'
                    }
                },
                {
                    selector: 'edge[cascadeCreateLeft = true]',
                    style: {
                        'line-style': 'dashed'
                    }
                }
            ],
            layout: {
                name: 'cose',
                animate: true,
                animationDuration: 500,
                nodeRepulsion: 8000,
                idealEdgeLength: 100,
                edgeElasticity: 100,
                nestingFactor: 1.2,
                gravity: 1,
                numIter: 1000,
                randomize: false
            },
            minZoom: 0.1,
            maxZoom: 3,
            wheelSensitivity: 0.2
        });

        // Attach event handlers
        this.cy.on('tap', 'node', (evt) => {
            const node = evt.target;
            this.selectNode(node);
        });

        this.cy.on('tap', 'edge', (evt) => {
            const edge = evt.target;
            this.selectEdge(edge);
        });

        // Fit graph to view
        setTimeout(() => {
            this.cy.fit(null, 50);
        }, 600);
    }

    selectNode(node) {
        const nodeData = node.data();

        // Highlight connected edges
        this.cy.elements().removeClass('highlighted');
        node.addClass('highlighted');
        node.connectedEdges().addClass('highlighted');

        // Dispatch event
        this.dispatchEvent(new CustomEvent('node-selected', {
            detail: {
                tableId: nodeData.id,
                tableName: nodeData.label,
                baseTableId: nodeData.baseTableId,
                baseTableName: nodeData.baseTableName
            },
            bubbles: true,
            composed: true
        }));
    }

    selectEdge(edge) {
        const edgeData = edge.data();

        // Dispatch event with relationship info
        this.dispatchEvent(new CustomEvent('edge-selected', {
            detail: edgeData,
            bubbles: true,
            composed: true
        }));
    }

    highlightNode(tableId) {
        if (!this.cy) return;

        const node = this.cy.getElementById(tableId);
        if (node.length > 0) {
            this.cy.elements().removeClass('highlighted');
            node.addClass('highlighted');
            node.connectedEdges().addClass('highlighted');

            // Center on node
            this.cy.animate({
                center: { eles: node },
                zoom: 1.5
            }, {
                duration: 500
            });
        }
    }

    fitGraph() {
        if (this.cy) {
            this.cy.fit(null, 50);
        }
    }

    zoomIn() {
        if (this.cy) {
            this.cy.zoom(this.cy.zoom() * 1.2);
        }
    }

    zoomOut() {
        if (this.cy) {
            this.cy.zoom(this.cy.zoom() * 0.8);
        }
    }

    resetGraph() {
        if (this.cy) {
            this.cy.elements().removeClass('highlighted');
            this.cy.fit(null, 50);
        }
    }

    showLoading() {
        const overlay = this.shadowRoot.getElementById('loadingOverlay');
        overlay.classList.remove('hidden');
    }

    hideLoading() {
        const overlay = this.shadowRoot.getElementById('loadingOverlay');
        overlay.classList.add('hidden');
    }

    showError(message) {
        const container = this.shadowRoot.getElementById('cy');
        container.innerHTML = `<div class="empty-state">${message}</div>`;
    }
}

customElements.define('ddr-graph-view', DDRGraphView);

export default DDRGraphView;
