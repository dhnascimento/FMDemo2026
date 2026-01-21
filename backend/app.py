"""
FileMaker DDR Analyzer - Flask Backend

Provides REST API for uploading and analyzing FileMaker DDR XML files.
"""

import os
import tempfile
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from parser import DDRParser


# Initialize Flask app
app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 200 * 1024 * 1024  # 200MB max file size
app.config['UPLOAD_FOLDER'] = tempfile.gettempdir()

# Global storage for parsed DDR data (in production, use Redis or database)
ddr_data_store = {}


@app.route('/')
def index():
    """Serve the main application page"""
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/<path:path>')
def static_files(path):
    """Serve static files"""
    return send_from_directory(app.static_folder, path)


@app.route('/api/upload', methods=['POST'])
def upload_file():
    """
    Upload and parse a DDR XML file

    Returns:
        JSON with summary statistics and session ID
    """
    try:
        # Check if file was uploaded
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']

        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Validate file extension
        if not file.filename.lower().endswith('.xml'):
            return jsonify({'error': 'File must be an XML file'}), 400

        # Save file temporarily
        filename = secure_filename(file.filename)
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(temp_path)

        try:
            # Parse the DDR file
            parser = DDRParser()
            ddr_data = parser.parse_file(temp_path)

            # Store in memory (use session ID as key)
            session_id = 'current'  # In production, generate unique session IDs
            ddr_data_store[session_id] = ddr_data

            # Return summary
            summary = ddr_data.get_summary()
            summary['sessionId'] = session_id
            summary['filename'] = filename

            return jsonify(summary), 200

        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)

    except Exception as e:
        app.logger.error(f'Error processing upload: {str(e)}')
        return jsonify({'error': f'Failed to process file: {str(e)}'}), 500


@app.route('/api/tables', methods=['GET'])
def get_tables():
    """
    Get all base tables with their fields

    Returns:
        JSON array of tables
    """
    try:
        session_id = request.args.get('sessionId', 'current')

        if session_id not in ddr_data_store:
            return jsonify({'error': 'No data found. Please upload a file first.'}), 404

        ddr_data = ddr_data_store[session_id]

        tables = [table.to_dict() for table in ddr_data.base_tables]

        return jsonify(tables), 200

    except Exception as e:
        app.logger.error(f'Error getting tables: {str(e)}')
        return jsonify({'error': str(e)}), 500


@app.route('/api/table-occurrences', methods=['GET'])
def get_table_occurrences():
    """
    Get all table occurrences

    Returns:
        JSON array of table occurrences
    """
    try:
        session_id = request.args.get('sessionId', 'current')

        if session_id not in ddr_data_store:
            return jsonify({'error': 'No data found. Please upload a file first.'}), 404

        ddr_data = ddr_data_store[session_id]

        table_occurrences = [to.to_dict() for to in ddr_data.table_occurrences]

        return jsonify(table_occurrences), 200

    except Exception as e:
        app.logger.error(f'Error getting table occurrences: {str(e)}')
        return jsonify({'error': str(e)}), 500


@app.route('/api/relationships', methods=['GET'])
def get_relationships():
    """
    Get all relationships formatted for Cytoscape.js

    Returns:
        JSON object with nodes and edges for Cytoscape.js
    """
    try:
        session_id = request.args.get('sessionId', 'current')

        if session_id not in ddr_data_store:
            return jsonify({'error': 'No data found. Please upload a file first.'}), 404

        ddr_data = ddr_data_store[session_id]

        # Create nodes from table occurrences
        nodes = []
        for to in ddr_data.table_occurrences:
            # Find base table for field count
            base_table = next(
                (bt for bt in ddr_data.base_tables if bt.id == to.base_table_id),
                None
            )
            field_count = len(base_table.fields) if base_table else 0

            nodes.append({
                'data': {
                    'id': to.id,
                    'label': to.name,
                    'baseTableId': to.base_table_id,
                    'baseTableName': to.base_table_name,
                    'fieldCount': field_count
                }
            })

        # Create edges from relationships
        edges = []
        for rel in ddr_data.relationships:
            # Create primary edge label from join predicates
            edge_label = ''
            if rel.join_predicates:
                jp = rel.join_predicates[0]
                edge_label = f"{jp.left_field_name} = {jp.right_field_name}"

            edges.append({
                'data': {
                    'id': f"rel_{rel.id}",
                    'source': rel.left_table_id,
                    'target': rel.right_table_id,
                    'label': edge_label,
                    'cascadeCreateLeft': rel.cascade_create_left,
                    'cascadeDeleteLeft': rel.cascade_delete_left,
                    'cascadeCreateRight': rel.cascade_create_right,
                    'cascadeDeleteRight': rel.cascade_delete_right,
                    'joinPredicates': [jp.to_dict() for jp in rel.join_predicates]
                }
            })

        return jsonify({
            'nodes': nodes,
            'edges': edges
        }), 200

    except Exception as e:
        app.logger.error(f'Error getting relationships: {str(e)}')
        return jsonify({'error': str(e)}), 500


@app.route('/api/table/<table_id>', methods=['GET'])
def get_table_details(table_id):
    """
    Get detailed information about a specific table

    Args:
        table_id: Table occurrence ID or base table ID

    Returns:
        JSON object with table details
    """
    try:
        session_id = request.args.get('sessionId', 'current')

        if session_id not in ddr_data_store:
            return jsonify({'error': 'No data found. Please upload a file first.'}), 404

        ddr_data = ddr_data_store[session_id]

        # Try to find as table occurrence first
        table_occurrence = next(
            (to for to in ddr_data.table_occurrences if to.id == table_id),
            None
        )

        if table_occurrence:
            # Find the base table
            base_table = next(
                (bt for bt in ddr_data.base_tables if bt.id == table_occurrence.base_table_id),
                None
            )

            if not base_table:
                return jsonify({'error': 'Base table not found'}), 404

            # Find related relationships
            related_relationships = [
                rel for rel in ddr_data.relationships
                if rel.left_table_id == table_id or rel.right_table_id == table_id
            ]

            return jsonify({
                'tableOccurrence': table_occurrence.to_dict(),
                'baseTable': base_table.to_dict(),
                'relationships': [rel.to_dict() for rel in related_relationships]
            }), 200

        # Try to find as base table
        base_table = next(
            (bt for bt in ddr_data.base_tables if bt.id == table_id),
            None
        )

        if base_table:
            # Find all table occurrences of this base table
            table_occurrences = [
                to for to in ddr_data.table_occurrences
                if to.base_table_id == table_id
            ]

            return jsonify({
                'baseTable': base_table.to_dict(),
                'tableOccurrences': [to.to_dict() for to in table_occurrences]
            }), 200

        return jsonify({'error': 'Table not found'}), 404

    except Exception as e:
        app.logger.error(f'Error getting table details: {str(e)}')
        return jsonify({'error': str(e)}), 500


@app.route('/api/variables', methods=['GET'])
def get_variables():
    """
    Get all variables (global and local)

    Returns:
        JSON object with globalVariables and localVariables arrays
    """
    try:
        session_id = request.args.get('sessionId', 'current')

        if session_id not in ddr_data_store:
            return jsonify({'error': 'No data found. Please upload a file first.'}), 404

        ddr_data = ddr_data_store[session_id]

        return jsonify({
            'globalVariables': [v.to_dict() for v in ddr_data.global_variables],
            'localVariables': [v.to_dict() for v in ddr_data.local_variables]
        }), 200

    except Exception as e:
        app.logger.error(f'Error getting variables: {str(e)}')
        return jsonify({'error': str(e)}), 500


@app.route('/api/variables/global', methods=['GET'])
def get_global_variables():
    """
    Get only global variables

    Returns:
        JSON array of global variables
    """
    try:
        session_id = request.args.get('sessionId', 'current')

        if session_id not in ddr_data_store:
            return jsonify({'error': 'No data found. Please upload a file first.'}), 404

        ddr_data = ddr_data_store[session_id]

        return jsonify([v.to_dict() for v in ddr_data.global_variables]), 200

    except Exception as e:
        app.logger.error(f'Error getting global variables: {str(e)}')
        return jsonify({'error': str(e)}), 500


@app.route('/api/variables/local', methods=['GET'])
def get_local_variables():
    """
    Get only local variables

    Returns:
        JSON array of local variables
    """
    try:
        session_id = request.args.get('sessionId', 'current')

        if session_id not in ddr_data_store:
            return jsonify({'error': 'No data found. Please upload a file first.'}), 404

        ddr_data = ddr_data_store[session_id]

        return jsonify([v.to_dict() for v in ddr_data.local_variables]), 200

    except Exception as e:
        app.logger.error(f'Error getting local variables: {str(e)}')
        return jsonify({'error': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok'}), 200


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
