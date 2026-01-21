"""
Data models for FileMaker DDR structure
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict


@dataclass
class Field:
    """Represents a field in a FileMaker table"""
    id: str
    name: str
    field_type: str  # Normal, Calculated, Summary
    data_type: str  # Text, Number, Date, Timestamp, etc.

    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'name': self.name,
            'fieldType': self.field_type,
            'dataType': self.data_type
        }


@dataclass
class BaseTable:
    """Represents a base table in FileMaker"""
    id: str
    name: str
    fields: List[Field] = field(default_factory=list)

    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'name': self.name,
            'fields': [f.to_dict() for f in self.fields],
            'fieldCount': len(self.fields)
        }


@dataclass
class TableOccurrence:
    """Represents a table occurrence (instance of a base table in relationship graph)"""
    id: str
    name: str
    base_table_id: str
    base_table_name: str

    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'name': self.name,
            'baseTableId': self.base_table_id,
            'baseTableName': self.base_table_name
        }


@dataclass
class JoinPredicate:
    """Represents a join condition between two fields"""
    predicate_type: str  # Equal, NotEqual, LessThan, etc.
    left_field_id: str
    left_field_name: str
    right_field_id: str
    right_field_name: str

    def to_dict(self) -> Dict:
        return {
            'type': self.predicate_type,
            'leftField': {
                'id': self.left_field_id,
                'name': self.left_field_name
            },
            'rightField': {
                'id': self.right_field_id,
                'name': self.right_field_name
            }
        }


@dataclass
class Relationship:
    """Represents a relationship between two table occurrences"""
    id: str
    left_table_id: str
    left_table_name: str
    right_table_id: str
    right_table_name: str
    join_predicates: List[JoinPredicate] = field(default_factory=list)
    cascade_create_left: bool = False
    cascade_delete_left: bool = False
    cascade_create_right: bool = False
    cascade_delete_right: bool = False

    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'leftTable': {
                'id': self.left_table_id,
                'name': self.left_table_name
            },
            'rightTable': {
                'id': self.right_table_id,
                'name': self.right_table_name
            },
            'joinPredicates': [jp.to_dict() for jp in self.join_predicates],
            'cascadeCreateLeft': self.cascade_create_left,
            'cascadeDeleteLeft': self.cascade_delete_left,
            'cascadeCreateRight': self.cascade_create_right,
            'cascadeDeleteRight': self.cascade_delete_right
        }


@dataclass
class Variable:
    """Represents a variable (global or local) used in scripts"""
    name: str
    is_global: bool  # True for $$ variables, False for $ variables
    scripts: List[str] = field(default_factory=list)  # List of script names using this variable

    def to_dict(self) -> Dict:
        return {
            'name': self.name,
            'isGlobal': self.is_global,
            'scripts': self.scripts,
            'usageCount': len(self.scripts)
        }


@dataclass
class DDRData:
    """Container for all parsed DDR data"""
    base_tables: List[BaseTable] = field(default_factory=list)
    table_occurrences: List[TableOccurrence] = field(default_factory=list)
    relationships: List[Relationship] = field(default_factory=list)
    global_variables: List[Variable] = field(default_factory=list)
    local_variables: List[Variable] = field(default_factory=list)

    def to_dict(self) -> Dict:
        return {
            'baseTables': [t.to_dict() for t in self.base_tables],
            'tableOccurrences': [to.to_dict() for to in self.table_occurrences],
            'relationships': [r.to_dict() for r in self.relationships],
            'globalVariables': [v.to_dict() for v in self.global_variables],
            'localVariables': [v.to_dict() for v in self.local_variables]
        }

    def get_summary(self) -> Dict:
        return {
            'baseTableCount': len(self.base_tables),
            'tableOccurrenceCount': len(self.table_occurrences),
            'relationshipCount': len(self.relationships),
            'totalFieldCount': sum(len(t.fields) for t in self.base_tables),
            'globalVariableCount': len(self.global_variables),
            'localVariableCount': len(self.local_variables)
        }
