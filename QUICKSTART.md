# FileMaker DDR Analyzer - Quick Start Guide

## What This Tool Does

The FileMaker DDR Analyzer is a web-based tool that helps you visualize and understand your FileMaker database structure by parsing Database Design Report (DDR) XML files.

## Quick Start

### Option 1: Using the Start Script

```bash
./start.sh
```

Then open your browser to: `http://localhost:5000`

### Option 2: Manual Start

```bash
cd backend
python app.py
```

Then open your browser to: `http://localhost:5000`

## How to Use

### 1. Export DDR from FileMaker

In FileMaker Pro:
1. Go to **File → Save/Send Records As → DDR...**
2. Choose **XML** format
3. Save the file

### 2. Upload Your DDR File

1. Open `http://localhost:5000` in your browser
2. Drag and drop your DDR XML file onto the upload area (or click "Select File")
3. Wait for the file to parse (large files may take a few seconds)

### 3. Explore Your Database

**Table List (Left Sidebar)**
- Search for specific tables using the search box
- Click on any table to view its details
- Shows number of fields for each table

**Relationship Graph (Center)**
- Interactive visualization of all table occurrences and their relationships
- **Controls:**
  - 🎯 Fit to screen
  - ➕ Zoom in
  - ➖ Zoom out
  - 🔄 Reset view
- **Interactions:**
  - Click and drag to pan
  - Scroll to zoom
  - Click nodes to select tables
  - Click edges to see relationship details

**Field Details (Right Panel)**
- Shows detailed information about selected table
- Lists all fields with their types and data types
- Displays relationships and join conditions
- Shows cascade create/delete options

## What Gets Analyzed

✅ **Base Tables** - All tables in your database
✅ **Fields** - All fields with types and data types
✅ **Table Occurrences** - All instances in relationship graph
✅ **Relationships** - All relationships with join predicates
✅ **Cascade Options** - Create and delete cascade settings

## Sample Data

You can test the application with the included sample file:
- `FM_Quickstart_v24_2_1.xml` (88 MB)
- Contains: 47 tables, 518 table occurrences, 465 relationships, 2,276 fields

## Browser Requirements

- Chrome, Edge, Firefox, or Safari (latest versions)
- JavaScript enabled
- Modern browser with ES6 module support

## Troubleshooting

**Upload fails:**
- Ensure file is valid XML exported from FileMaker
- File size limit is 200 MB
- Check browser console for errors

**Graph doesn't display:**
- Refresh the page and try again
- Check browser console for JavaScript errors

**Server won't start:**
- Ensure Python 3.8+ is installed
- Install dependencies: `pip install -r backend/requirements.txt`
- Check if port 5000 is available

## Next Steps

After analyzing your database, you can:
- Identify tables with many relationships
- Find unused table occurrences
- Understand field types and data structures
- Document your database schema
- Plan database refactoring

## Support

For issues or questions:
- Check the main README.md for detailed documentation
- Review the browser console for error messages
- Ensure your DDR XML file is valid

Enjoy exploring your FileMaker database structure!
