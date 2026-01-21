/**
 * DDR Upload Component
 *
 * File upload component with drag-and-drop support
 */

class DDRUpload extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    max-width: 600px;
                    margin: 2rem auto;
                }

                .upload-container {
                    background: white;
                    border-radius: 12px;
                    padding: 3rem;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }

                .upload-area {
                    border: 3px dashed #cbd5e1;
                    border-radius: 8px;
                    padding: 3rem 2rem;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: #f8fafc;
                }

                .upload-area:hover,
                .upload-area.drag-over {
                    border-color: #2563eb;
                    background: #eff6ff;
                }

                .upload-icon {
                    font-size: 3rem;
                    color: #64748b;
                    margin-bottom: 1rem;
                }

                .upload-text {
                    color: #334155;
                    font-size: 1.1rem;
                    margin-bottom: 0.5rem;
                }

                .upload-hint {
                    color: #64748b;
                    font-size: 0.9rem;
                }

                .file-input {
                    display: none;
                }

                .upload-button {
                    background: #2563eb;
                    color: white;
                    border: none;
                    padding: 0.75rem 2rem;
                    border-radius: 6px;
                    font-size: 1rem;
                    cursor: pointer;
                    margin-top: 1rem;
                    transition: background 0.3s ease;
                }

                .upload-button:hover {
                    background: #1d4ed8;
                }

                .upload-button:disabled {
                    background: #94a3b8;
                    cursor: not-allowed;
                }

                .progress-container {
                    margin-top: 1.5rem;
                    display: none;
                }

                .progress-container.active {
                    display: block;
                }

                .progress-bar {
                    width: 100%;
                    height: 8px;
                    background: #e2e8f0;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    background: #2563eb;
                    transition: width 0.3s ease;
                    width: 0%;
                }

                .progress-text {
                    text-align: center;
                    margin-top: 0.5rem;
                    color: #64748b;
                    font-size: 0.9rem;
                }

                .error-message {
                    background: #fee2e2;
                    color: #991b1b;
                    padding: 1rem;
                    border-radius: 6px;
                    margin-top: 1rem;
                    display: none;
                }

                .error-message.active {
                    display: block;
                }

                .success-message {
                    background: #d1fae5;
                    color: #065f46;
                    padding: 1rem;
                    border-radius: 6px;
                    margin-top: 1rem;
                    display: none;
                }

                .success-message.active {
                    display: block;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1rem;
                    margin-top: 1rem;
                }

                .stat-item {
                    text-align: center;
                }

                .stat-value {
                    font-size: 2rem;
                    font-weight: bold;
                    color: #2563eb;
                }

                .stat-label {
                    font-size: 0.9rem;
                    color: #64748b;
                    margin-top: 0.25rem;
                }
            </style>

            <div class="upload-container">
                <div class="upload-area" id="dropArea">
                    <div class="upload-icon">📁</div>
                    <div class="upload-text">Drag and drop your DDR XML file here</div>
                    <div class="upload-hint">or</div>
                    <button class="upload-button" id="selectBtn">Select File</button>
                    <input type="file" class="file-input" id="fileInput" accept=".xml">
                </div>

                <div class="progress-container" id="progressContainer">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill"></div>
                    </div>
                    <div class="progress-text" id="progressText">Uploading...</div>
                </div>

                <div class="error-message" id="errorMessage"></div>

                <div class="success-message" id="successMessage">
                    <div><strong>File uploaded successfully!</strong></div>
                    <div class="stats-grid" id="statsGrid"></div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        const dropArea = this.shadowRoot.getElementById('dropArea');
        const fileInput = this.shadowRoot.getElementById('fileInput');
        const selectBtn = this.shadowRoot.getElementById('selectBtn');

        // Click to select file
        selectBtn.addEventListener('click', () => fileInput.click());
        dropArea.addEventListener('click', (e) => {
            if (e.target !== selectBtn) {
                fileInput.click();
            }
        });

        // File selection
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFile(e.target.files[0]);
            }
        });

        // Drag and drop
        dropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropArea.classList.add('drag-over');
        });

        dropArea.addEventListener('dragleave', () => {
            dropArea.classList.remove('drag-over');
        });

        dropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dropArea.classList.remove('drag-over');

            if (e.dataTransfer.files.length > 0) {
                this.handleFile(e.dataTransfer.files[0]);
            }
        });
    }

    async handleFile(file) {
        // Validate file type
        if (!file.name.toLowerCase().endsWith('.xml')) {
            this.showError('Please select an XML file');
            return;
        }

        this.hideMessages();
        this.showProgress('Uploading and parsing file...');

        try {
            // Get API client from window
            const apiClient = window.ddrApiClient;

            // Upload file
            const result = await apiClient.uploadFile(file);

            this.hideProgress();
            this.showSuccess(result);

            // Dispatch custom event
            this.dispatchEvent(new CustomEvent('file-uploaded', {
                detail: result,
                bubbles: true,
                composed: true
            }));

        } catch (error) {
            this.hideProgress();
            this.showError(error.message || 'Failed to upload file');
        }
    }

    showProgress(text) {
        const container = this.shadowRoot.getElementById('progressContainer');
        const progressText = this.shadowRoot.getElementById('progressText');
        const progressFill = this.shadowRoot.getElementById('progressFill');

        container.classList.add('active');
        progressText.textContent = text;
        progressFill.style.width = '50%';
    }

    hideProgress() {
        const container = this.shadowRoot.getElementById('progressContainer');
        container.classList.remove('active');
    }

    showError(message) {
        const errorEl = this.shadowRoot.getElementById('errorMessage');
        errorEl.textContent = message;
        errorEl.classList.add('active');
    }

    showSuccess(data) {
        const successEl = this.shadowRoot.getElementById('successMessage');
        const statsGrid = this.shadowRoot.getElementById('statsGrid');

        statsGrid.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${data.baseTableCount || 0}</div>
                <div class="stat-label">Base Tables</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${data.relationshipCount || 0}</div>
                <div class="stat-label">Relationships</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${data.tableOccurrenceCount || 0}</div>
                <div class="stat-label">Table Occurrences</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${data.totalFieldCount || 0}</div>
                <div class="stat-label">Total Fields</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${data.globalVariableCount || 0}</div>
                <div class="stat-label">Global Variables</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${data.localVariableCount || 0}</div>
                <div class="stat-label">Local Variables</div>
            </div>
        `;

        successEl.classList.add('active');
    }

    hideMessages() {
        this.shadowRoot.getElementById('errorMessage').classList.remove('active');
        this.shadowRoot.getElementById('successMessage').classList.remove('active');
    }
}

customElements.define('ddr-upload', DDRUpload);

export default DDRUpload;
