"""
FileMaker DDR XML Parser

Parses FileMaker Database Design Report (DDR) XML files and extracts:
- Base tables and fields
- Table occurrences
- Relationships with join predicates
"""

import xml.etree.ElementTree as ET
import codecs
import os
from typing import Optional
from models import (
    DDRData, BaseTable, Field, TableOccurrence,
    Relationship, JoinPredicate, Variable
)
from collections import defaultdict


class DDRParser:
    """Parser for FileMaker DDR XML files"""

    def __init__(self):
        self.ddr_data = DDRData()
        self.base_table_map = {}  # id -> BaseTable for quick lookup
        self.table_occurrence_map = {}  # id -> TableOccurrence
        self.script_map = {}  # id -> script name for quick lookup

    def parse_file(self, file_path: str) -> DDRData:
        """
        Parse a FileMaker DDR XML file

        Args:
            file_path: Path to the DDR XML file

        Returns:
            DDRData object containing all parsed information
        """
        # Handle encoding - DDR files are typically UTF-16
        xml_content = self._read_with_encoding_detection(file_path)

        # Parse XML
        root = ET.fromstring(xml_content)

        # Extract data from different catalogs
        self._extract_base_tables(root)
        self._extract_table_occurrences(root)
        self._extract_relationships(root)
        self._extract_variables(root)

        return self.ddr_data

    def _read_with_encoding_detection(self, file_path: str) -> str:
        """
        Read file with encoding detection
        DDR files are typically UTF-16 LE
        """
        # Try UTF-16 first (most common for DDR)
        try:
            with codecs.open(file_path, 'r', encoding='utf-16') as f:
                return f.read()
        except (UnicodeDecodeError, UnicodeError):
            pass

        # Try UTF-16 LE explicitly
        try:
            with codecs.open(file_path, 'r', encoding='utf-16-le') as f:
                return f.read()
        except (UnicodeDecodeError, UnicodeError):
            pass

        # Fallback to UTF-8
        try:
            with codecs.open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except (UnicodeDecodeError, UnicodeError):
            pass

        # Last resort: read as binary and decode with errors ignored
        with open(file_path, 'rb') as f:
            content = f.read()
            # Try UTF-16 LE with BOM
            if content.startswith(b'\xff\xfe'):
                return content.decode('utf-16-le', errors='ignore')
            return content.decode('utf-8', errors='ignore')

    def _extract_base_tables(self, root: ET.Element):
        """Extract base tables from BaseTableCatalog and their fields from FieldsForTables"""
        base_table_catalog = root.find('.//BaseTableCatalog')
        if base_table_catalog is None:
            return

        # First, create all base tables
        for base_table_elem in base_table_catalog.findall('BaseTable'):
            table_id = base_table_elem.get('id')
            table_name = base_table_elem.get('name')

            if not table_id or not table_name:
                continue

            # Create base table (fields will be added later)
            base_table = BaseTable(
                id=table_id,
                name=table_name,
                fields=[]
            )

            self.base_table_map[table_id] = base_table
            self.ddr_data.base_tables.append(base_table)

        # Now extract fields from FieldsForTables section
        fields_for_tables = root.find('.//FieldsForTables')
        if fields_for_tables is not None:
            for field_catalog in fields_for_tables.findall('FieldCatalog'):
                # Find which table this FieldCatalog belongs to
                base_table_ref = field_catalog.find('BaseTableReference')
                if base_table_ref is None:
                    continue

                table_id = base_table_ref.get('id')
                if not table_id or table_id not in self.base_table_map:
                    continue

                # Get the base table
                base_table = self.base_table_map[table_id]

                # Extract fields from ObjectList
                object_list = field_catalog.find('ObjectList')
                if object_list is not None:
                    for field_elem in object_list.findall('Field'):
                        field_id = field_elem.get('id')
                        field_name = field_elem.get('name')
                        field_type = field_elem.get('fieldtype', 'Normal')
                        data_type = field_elem.get('datatype', 'Text')

                        if field_id and field_name:
                            field = Field(
                                id=field_id,
                                name=field_name,
                                field_type=field_type,
                                data_type=data_type
                            )
                            base_table.fields.append(field)

    def _extract_table_occurrences(self, root: ET.Element):
        """Extract table occurrences from TableOccurrenceCatalog"""
        to_catalog = root.find('.//TableOccurrenceCatalog')
        if to_catalog is None:
            return

        for to_elem in to_catalog.findall('TableOccurrence'):
            to_id = to_elem.get('id')
            to_name = to_elem.get('name')

            if not to_id or not to_name:
                continue

            # Find base table reference
            base_table_ref = to_elem.find('.//BaseTableReference')
            if base_table_ref is not None:
                base_table_id = base_table_ref.get('id')
                base_table_name = base_table_ref.get('name')

                if base_table_id and base_table_name:
                    table_occurrence = TableOccurrence(
                        id=to_id,
                        name=to_name,
                        base_table_id=base_table_id,
                        base_table_name=base_table_name
                    )

                    self.table_occurrence_map[to_id] = table_occurrence
                    self.ddr_data.table_occurrences.append(table_occurrence)

    def _extract_relationships(self, root: ET.Element):
        """Extract relationships from RelationshipCatalog"""
        rel_catalog = root.find('.//RelationshipCatalog')
        if rel_catalog is None:
            return

        for rel_elem in rel_catalog.findall('Relationship'):
            rel_id = rel_elem.get('id')

            if not rel_id:
                continue

            # Extract left table
            left_table_elem = rel_elem.find('LeftTable')
            left_table_ref = None
            cascade_create_left = False
            cascade_delete_left = False

            if left_table_elem is not None:
                left_table_ref = left_table_elem.find('TableOccurrenceReference')
                cascade_create_left = left_table_elem.get('cascadeCreate', 'False') == 'True'
                cascade_delete_left = left_table_elem.get('cascadeDelete', 'False') == 'True'

            # Extract right table
            right_table_elem = rel_elem.find('RightTable')
            right_table_ref = None
            cascade_create_right = False
            cascade_delete_right = False

            if right_table_elem is not None:
                right_table_ref = right_table_elem.find('TableOccurrenceReference')
                cascade_create_right = right_table_elem.get('cascadeCreate', 'False') == 'True'
                cascade_delete_right = right_table_elem.get('cascadeDelete', 'False') == 'True'

            if left_table_ref is None or right_table_ref is None:
                continue

            left_table_id = left_table_ref.get('id')
            left_table_name = left_table_ref.get('name')
            right_table_id = right_table_ref.get('id')
            right_table_name = right_table_ref.get('name')

            if not all([left_table_id, left_table_name, right_table_id, right_table_name]):
                continue

            # Extract join predicates
            join_predicates = []
            join_pred_list = rel_elem.find('JoinPredicateList')

            if join_pred_list is not None:
                for join_pred_elem in join_pred_list.findall('JoinPredicate'):
                    pred_type = join_pred_elem.get('type', 'Equal')

                    # Extract left field
                    left_field_elem = join_pred_elem.find('.//LeftField/FieldReference')
                    right_field_elem = join_pred_elem.find('.//RightField/FieldReference')

                    if left_field_elem is not None and right_field_elem is not None:
                        left_field_id = left_field_elem.get('id')
                        left_field_name = left_field_elem.get('name')
                        right_field_id = right_field_elem.get('id')
                        right_field_name = right_field_elem.get('name')

                        if all([left_field_id, left_field_name, right_field_id, right_field_name]):
                            join_predicate = JoinPredicate(
                                predicate_type=pred_type,
                                left_field_id=left_field_id,
                                left_field_name=left_field_name,
                                right_field_id=right_field_id,
                                right_field_name=right_field_name
                            )
                            join_predicates.append(join_predicate)

            # Create relationship
            relationship = Relationship(
                id=rel_id,
                left_table_id=left_table_id,
                left_table_name=left_table_name,
                right_table_id=right_table_id,
                right_table_name=right_table_name,
                join_predicates=join_predicates,
                cascade_create_left=cascade_create_left,
                cascade_delete_left=cascade_delete_left,
                cascade_create_right=cascade_create_right,
                cascade_delete_right=cascade_delete_right
            )

            self.ddr_data.relationships.append(relationship)

    def _extract_variables(self, root: ET.Element):
        """Extract global and local variables from script Set Variable steps"""
        # Track variables and their script usage
        global_vars = defaultdict(set)  # var_name -> set of script names
        local_vars = defaultdict(set)

        # Find StepsForScripts section
        steps_for_scripts = root.find('.//StepsForScripts')
        if steps_for_scripts is None:
            return

        # Iterate through each script's steps
        for script_elem in steps_for_scripts.findall('Script'):
            # Get script reference
            script_ref = script_elem.find('ScriptReference')
            if script_ref is None:
                continue

            script_name = script_ref.get('name')
            if not script_name:
                continue

            # Find all Set Variable steps in this script (step id=141)
            set_var_steps = script_elem.findall('.//Step[@id="141"]')

            for step in set_var_steps:
                # Extract variable name
                param_values = step.find('ParameterValues')
                if param_values is not None:
                    for param in param_values.findall('Parameter'):
                        if param.get('type') == 'Variable':
                            name_elem = param.find('Name')
                            if name_elem is not None:
                                var_name = name_elem.get('value')
                                if var_name:
                                    if var_name.startswith('$$'):
                                        global_vars[var_name].add(script_name)
                                    elif var_name.startswith('$'):
                                        local_vars[var_name].add(script_name)

        # Convert to Variable objects
        for var_name in sorted(global_vars.keys()):
            scripts = sorted(list(global_vars[var_name]))
            variable = Variable(
                name=var_name,
                is_global=True,
                scripts=scripts
            )
            self.ddr_data.global_variables.append(variable)

        for var_name in sorted(local_vars.keys()):
            scripts = sorted(list(local_vars[var_name]))
            variable = Variable(
                name=var_name,
                is_global=False,
                scripts=scripts
            )
            self.ddr_data.local_variables.append(variable)
