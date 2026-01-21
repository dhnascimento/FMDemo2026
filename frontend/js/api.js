/**
 * API Client for FileMaker DDR Analyzer
 *
 * Handles all communication with the Flask backend
 */

class DDRApiClient {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
        this.sessionId = 'current';
    }

    /**
     * Upload a DDR XML file
     * @param {File} file - The XML file to upload
     * @returns {Promise<Object>} Summary statistics
     */
    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${this.baseUrl}/api/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }

            const data = await response.json();
            this.sessionId = data.sessionId;
            return data;
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    }

    /**
     * Get all base tables
     * @returns {Promise<Array>} Array of base tables with fields
     */
    async getTables() {
        try {
            const response = await fetch(
                `${this.baseUrl}/api/tables?sessionId=${this.sessionId}`
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch tables');
            }

            return await response.json();
        } catch (error) {
            console.error('Get tables error:', error);
            throw error;
        }
    }

    /**
     * Get all table occurrences
     * @returns {Promise<Array>} Array of table occurrences
     */
    async getTableOccurrences() {
        try {
            const response = await fetch(
                `${this.baseUrl}/api/table-occurrences?sessionId=${this.sessionId}`
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch table occurrences');
            }

            return await response.json();
        } catch (error) {
            console.error('Get table occurrences error:', error);
            throw error;
        }
    }

    /**
     * Get relationship graph data formatted for Cytoscape.js
     * @returns {Promise<Object>} Object with nodes and edges arrays
     */
    async getRelationships() {
        try {
            const response = await fetch(
                `${this.baseUrl}/api/relationships?sessionId=${this.sessionId}`
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch relationships');
            }

            return await response.json();
        } catch (error) {
            console.error('Get relationships error:', error);
            throw error;
        }
    }

    /**
     * Get detailed information about a specific table
     * @param {string} tableId - Table occurrence ID or base table ID
     * @returns {Promise<Object>} Detailed table information
     */
    async getTableDetails(tableId) {
        try {
            const response = await fetch(
                `${this.baseUrl}/api/table/${tableId}?sessionId=${this.sessionId}`
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch table details');
            }

            return await response.json();
        } catch (error) {
            console.error('Get table details error:', error);
            throw error;
        }
    }

    /**
     * Get all variables (global and local)
     * @returns {Promise<Object>} Object with globalVariables and localVariables arrays
     */
    async getVariables() {
        try {
            const response = await fetch(
                `${this.baseUrl}/api/variables?sessionId=${this.sessionId}`
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch variables');
            }

            return await response.json();
        } catch (error) {
            console.error('Get variables error:', error);
            throw error;
        }
    }

    /**
     * Get only global variables
     * @returns {Promise<Array>} Array of global variables
     */
    async getGlobalVariables() {
        try {
            const response = await fetch(
                `${this.baseUrl}/api/variables/global?sessionId=${this.sessionId}`
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch global variables');
            }

            return await response.json();
        } catch (error) {
            console.error('Get global variables error:', error);
            throw error;
        }
    }

    /**
     * Get only local variables
     * @returns {Promise<Array>} Array of local variables
     */
    async getLocalVariables() {
        try {
            const response = await fetch(
                `${this.baseUrl}/api/variables/local?sessionId=${this.sessionId}`
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch local variables');
            }

            return await response.json();
        } catch (error) {
            console.error('Get local variables error:', error);
            throw error;
        }
    }

    /**
     * Health check
     * @returns {Promise<Object>} Health status
     */
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseUrl}/api/health`);
            return await response.json();
        } catch (error) {
            console.error('Health check error:', error);
            throw error;
        }
    }
}

// Export for use in other modules
export default DDRApiClient;
