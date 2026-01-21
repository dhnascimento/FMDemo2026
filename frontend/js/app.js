/**
 * FileMaker DDR Analyzer - Main Application
 *
 * Initializes the application and handles component communication
 */

import DDRApiClient from './api.js';
import './components/ddr-upload.js';
import './components/ddr-table-list.js';
import './components/ddr-graph-view.js';
import './components/ddr-field-details.js';
import './components/ddr-variable-list.js';

class DDRAnalyzerApp {
    constructor() {
        // Initialize API client and make it globally available
        this.apiClient = new DDRApiClient();
        window.ddrApiClient = this.apiClient;

        // Get component references
        this.uploadView = document.getElementById('upload-view');
        this.analyzerView = document.getElementById('analyzer-view');

        // Get component elements
        this.uploadComponent = document.querySelector('ddr-upload');
        this.tableListComponent = document.querySelector('ddr-table-list');
        this.variableListComponent = document.querySelector('ddr-variable-list');
        this.graphViewComponent = document.querySelector('ddr-graph-view');
        this.fieldDetailsComponent = document.querySelector('ddr-field-details');

        // Set up event listeners
        this.setupEventListeners();
        this.setupSidebarTabs();

        console.log('FileMaker DDR Analyzer initialized');
    }

    setupSidebarTabs() {
        const tablesBtn = document.getElementById('tablesBtn');
        const variablesBtn = document.getElementById('variablesBtn');
        const tableListView = document.getElementById('tableListView');
        const variableListView = document.getElementById('variableListView');

        tablesBtn.addEventListener('click', () => {
            tablesBtn.classList.add('active');
            variablesBtn.classList.remove('active');
            tableListView.style.display = 'block';
            variableListView.style.display = 'none';
        });

        variablesBtn.addEventListener('click', () => {
            variablesBtn.classList.add('active');
            tablesBtn.classList.remove('active');
            variableListView.style.display = 'block';
            tableListView.style.display = 'none';
        });
    }

    setupEventListeners() {
        // File uploaded event
        this.uploadComponent.addEventListener('file-uploaded', (event) => {
            this.onFileUploaded(event.detail);
        });

        // Table selected from list
        this.tableListComponent.addEventListener('table-selected', (event) => {
            this.onTableSelected(event.detail);
        });

        // Node selected from graph
        this.graphViewComponent.addEventListener('node-selected', (event) => {
            this.onNodeSelected(event.detail);
        });

        // Edge selected from graph
        this.graphViewComponent.addEventListener('edge-selected', (event) => {
            this.onEdgeSelected(event.detail);
        });

        // Variable selected from list
        this.variableListComponent.addEventListener('variable-selected', (event) => {
            this.onVariableSelected(event.detail);
        });
    }

    async onFileUploaded(data) {
        console.log('File uploaded:', data);

        // Hide upload view, show analyzer view
        this.uploadView.style.display = 'none';
        this.analyzerView.style.display = 'block';

        // Load data into components
        try {
            await Promise.all([
                this.tableListComponent.loadTables(),
                this.variableListComponent.loadVariables(),
                this.graphViewComponent.loadGraph()
            ]);

            console.log('Data loaded successfully');
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Failed to load data. Please try uploading again.');
            this.resetToUpload();
        }
    }

    onTableSelected(data) {
        console.log('Table selected:', data);

        // Load details for the selected table
        if (data.tableId) {
            this.fieldDetailsComponent.loadTableDetails(data.tableId);
        }

        // Highlight in graph if it's a table occurrence
        // (Base tables might not have direct representation in graph)
        this.graphViewComponent.highlightNode(data.tableId);
    }

    onNodeSelected(data) {
        console.log('Node selected:', data);

        // Load details for the selected node (table occurrence)
        if (data.tableId) {
            this.fieldDetailsComponent.loadTableDetails(data.tableId);
        }
    }

    onEdgeSelected(data) {
        console.log('Edge selected:', data);

        // Could show relationship details here
        // For now, just log it
    }

    onVariableSelected(data) {
        console.log('Variable selected:', data);

        // Could show variable details in the details panel
        // For now, just log it
    }

    resetToUpload() {
        this.analyzerView.style.display = 'none';
        this.uploadView.style.display = 'flex';
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new DDRAnalyzerApp();
    });
} else {
    new DDRAnalyzerApp();
}
