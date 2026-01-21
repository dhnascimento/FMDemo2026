# FileMaker DDR Analyzer

A web-based tool for analyzing and visualizing FileMaker Database Design Report (DDR) XML files.

## Features

- **Upload & Parse**: Drag-and-drop DDR XML file upload with automatic parsing
- **Table Browser**: Searchable list of all base tables with field counts
- **Variable Tracking**: Track and analyze global ($$) and local ($) variables with script usage
- **Relationship Graph**: Interactive visualization of table relationships using Cytoscape.js
- **Detailed View**: Comprehensive field information including types, data types, and relationships
- **Modern UI**: Clean, responsive interface built with vanilla JavaScript and Web Components

## Architecture

### Backend (Python Flask)
- Flask REST API for file upload and data retrieval
- XML parser supporting UTF-16 encoded DDR files
- Structured data models for tables, fields, relationships, and variables
- Script analysis for variable usage tracking

### Frontend (Vanilla JavaScript)
- Web Components for modular, reusable UI elements
- Cytoscape.js for interactive graph visualization
- No framework dependencies - pure vanilla JavaScript

## Project Structure

```
FMDemo2026/
├── backend/
│   ├── app.py              # Flask application & API endpoints
│   ├── parser.py           # DDR XML parser
│   ├── models.py           # Data models
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── index.html          # Main application page
│   ├── js/
│   │   ├── app.js          # Application initialization
│   │   ├── api.js          # API client
│   │   └── components/     # Web Components
│   │       ├── ddr-upload.js
│   │       ├── ddr-table-list.js
│   │       ├── ddr-variable-list.js
│   │       ├── ddr-graph-view.js
│   │       └── ddr-field-details.js
│   └── styles/
│       └── main.css        # Global styles
└── README.md
```

## Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package installer)

### Setup

1. **Clone or download the project**

2. **Install Python dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Run the Flask server**
   ```bash
   python app.py
   ```

4. **Open your browser**
   Navigate to `http://localhost:5000`

## Usage

1. **Upload a DDR XML file**
   - Drag and drop your FileMaker DDR XML file onto the upload area
   - Or click "Select File" to browse for a file

2. **Browse tables and variables**
   - Use the **Tables** tab to view all base tables
   - Use the **Variables** tab to view global ($$) and local ($) variables
   - Use the search box to filter results
   - Click on items to view their details

3. **Explore variables**
   - Switch between Global and Local variable tabs
   - See which scripts use each variable
   - Search variables by name or script

4. **Explore relationships**
   - The graph view shows all table occurrences and their relationships
   - Click nodes to select tables
   - Use the controls to zoom, pan, and fit the graph to screen

5. **View details**
   - The right panel shows detailed information about the selected table
   - Includes all fields with their types and data types
   - Shows related relationships with join conditions

## DDR XML Format

The tool parses FileMaker Database Design Report (DDR) XML files with the following structure:

- **BaseTableCatalog**: Base tables and their fields
- **TableOccurrenceCatalog**: Table occurrences (instances in relationship graph)
- **RelationshipCatalog**: Relationships with join predicates
- **StepsForScripts**: Script steps including variable definitions

## API Endpoints

- `POST /api/upload` - Upload and parse DDR XML file
- `GET /api/tables` - Get all base tables with fields
- `GET /api/table-occurrences` - Get all table occurrences
- `GET /api/relationships` - Get relationship graph data (Cytoscape.js format)
- `GET /api/table/<table_id>` - Get detailed table information
- `GET /api/variables` - Get all variables (global and local)
- `GET /api/variables/global` - Get only global variables ($$)
- `GET /api/variables/local` - Get only local variables ($)
- `GET /api/health` - Health check endpoint

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari

Requires a modern browser with support for:
- ES6 modules
- Web Components (Custom Elements)
- CSS Grid & Flexbox

## Limitations

- Files larger than 200MB may not upload
- Very large databases (500+ tables) may experience performance issues in graph rendering
- UTF-16 encoding is automatically handled, but malformed XML may cause parsing errors

## Future Enhancements

- Export graph as image
- Search across all fields
- Display calculated field formulas
- Enhanced script analysis
- Layout analysis
- Value list extraction
- Custom field analysis
- Variable value tracking and debugging

## License

MIT License

## Version

1.0.0
