# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FileMaker DDR Analyzer - A web-based tool for parsing and visualizing FileMaker Database Design Report (DDR) XML files. This is a Flask + Vanilla JavaScript application with no build step.

## Development Commands

### Running the Application

**Quick start:**
```bash
./start.sh
```

**Manual start:**
```bash
cd backend
pip install -r requirements.txt
python app.py
```

The server runs on `http://localhost:5000` and serves both the API and frontend files.

### No Build/Compile Step
- Backend: Python Flask runs interpreted
- Frontend: ES6 modules loaded directly by browser (no bundler)
- Changes to JS/CSS are reflected immediately on browser refresh
- Python changes require Flask restart (unless in debug mode with auto-reload)

## Architecture

### Request Flow
1. User uploads DDR XML → `POST /api/upload`
2. `parser.py` parses XML with UTF-16 encoding handling
3. Data stored in-memory in `ddr_data_store` dict (session-based)
4. Web Components fetch data via API client (`api.js`)
5. Cytoscape.js renders relationship graph

### Key Backend Files
- **`backend/app.py`** (362 lines) - Flask server, all API endpoints, serves static files from `../frontend`
- **`backend/parser.py`** (323 lines) - XML parser with UTF-16 support, extracts tables/fields/relationships/variables
- **`backend/models.py`** (158 lines) - Dataclasses for BaseTable, Field, TableOccurrence, Relationship, Variable

### Key Frontend Files
- **`frontend/js/app.js`** - Initializes Web Components, handles global state and component communication
- **`frontend/js/api.js`** - API client wrapper with error handling
- **`frontend/js/components/`** - Five Web Components using Shadow DOM:
  - `ddr-upload.js` - Drag-and-drop file upload
  - `ddr-table-list.js` - Searchable table browser
  - `ddr-variable-list.js` - Variable tracking with global/local tabs
  - `ddr-graph-view.js` - Cytoscape.js relationship visualization
  - `ddr-field-details.js` - Selected table/field details panel

### API Endpoints
```
POST   /api/upload                    # Upload and parse DDR XML
GET    /api/tables                    # All base tables with fields
GET    /api/table-occurrences         # All table occurrences
GET    /api/relationships             # Cytoscape.js graph format
GET    /api/table/<table_id>          # Detailed table info
GET    /api/variables                 # All variables
GET    /api/variables/global          # Global variables ($$)
GET    /api/variables/local           # Local variables ($)
GET    /api/health                    # Health check
```

## Important Technical Details

### XML Parsing Constraints
- DDR files use UTF-16 encoding by default; parser auto-detects with fallback
- Large files (up to 200MB) supported but stored in-memory
- Parser expects FileMaker DDR structure: `BaseTableCatalog`, `TableOccurrenceCatalog`, `RelationshipCatalog`, `StepsForScripts`

### Variable Tracking
- Extracts global ($$) and local ($) variables from script steps
- Links variables to scripts where they're defined/used
- See `VARIABLE_TRACKING.md` for implementation details

### Frontend Component Communication
- Components use custom events for inter-component messaging
- `app.js` acts as event bus and coordinator
- No state management library; events and direct method calls

### Static File Serving
- Flask serves frontend from `../frontend` directory
- Routes: `/` → `index.html`, `/<path>` → static files
- CORS enabled for development

## Common Development Tasks

### Adding a New API Endpoint
1. Add route handler in `backend/app.py`
2. Update `frontend/js/api.js` if needed
3. Call from Web Component or app.js

### Adding a New Web Component
1. Create component in `frontend/js/components/`
2. Define custom element with `customElements.define()`
3. Register in `frontend/js/app.js`
4. Add to `frontend/index.html`

### Modifying Parser Logic
1. Edit `backend/parser.py`
2. Update models in `backend/models.py` if schema changes
3. Restart Flask server

## File Size Reference
The sample file `FM_Quickstart_v24_2_1.xml` is 88MB and contains:
- 47 base tables
- 2,276 fields
- 518 table occurrences
- 465 relationships

## Dependencies
- **Backend:** Flask 3.0.0, Flask-CORS 4.0.0, Werkzeug 3.0.1
- **Frontend:** Cytoscape.js 3.28.1 (loaded from CDN)
- No bundler or transpiler required
