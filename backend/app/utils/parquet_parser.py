"""
Parquet file parser for court opinions.

Reads Parquet files and converts them to CourtCase models.
"""

import pandas as pd
from typing import List, Dict, Any
from datetime import datetime
from pathlib import Path


def parse_parquet_file(file_path: str) -> Dict[str, Any]:
    """
    Parse a Parquet file containing court opinions.
    
    Args:
        file_path: Path to the Parquet file
        
    Returns:
        Dictionary with:
            - success: bool
            - total_rows: int
            - cases: List[dict] (parsed case data)
            - errors: List[str]
    """
    try:
        # Read Parquet file
        df = pd.read_parquet(file_path)
        
        result = {
            "success": True,
            "total_rows": len(df),
            "cases": [],
            "errors": []
        }
        
        # Parse each row
        for idx, row in df.iterrows():
            try:
                case_data = parse_case_row(row)
                result["cases"].append(case_data)
            except Exception as e:
                result["errors"].append(f"Row {idx}: {str(e)}")
        
        return result
        
    except Exception as e:
        return {
            "success": False,
            "total_rows": 0,
            "cases": [],
            "errors": [f"Failed to read Parquet file: {str(e)}"]
        }


def parse_case_row(row: pd.Series) -> Dict[str, Any]:
    """
    Parse a single row from the Parquet file into case data.
    
    Adjust field mappings based on your actual Parquet structure.
    """
    case_data = {
        "case_name": str(row.get("case_name", "")).strip() if pd.notna(row.get("case_name")) else None,
        "court": str(row.get("court", "")).strip() if pd.notna(row.get("court")) else None,
        "docket_number": str(row.get("docket_number", "")).strip() if pd.notna(row.get("docket_number")) else None,
        "state": str(row.get("state", "")).strip() if pd.notna(row.get("state")) else None,
        "election_type": str(row.get("election_type", "")).strip() if pd.notna(row.get("election_type")) else None,
        "party_who_appointed_judge": str(row.get("party_who_appointed_judge", "")).strip() if pd.notna(row.get("party_who_appointed_judge")) else None,
    }
    
    # Parse date if present
    if "case_date" in row and pd.notna(row["case_date"]):
        try:
            case_data["case_date"] = pd.to_datetime(row["case_date"])
        except:
            case_data["case_date"] = None
    else:
        case_data["case_date"] = None
    
    # Parse opinion text fields
    case_data["opinion_text"] = str(row.get("opinion_text", "")).strip() if pd.notna(row.get("opinion_text")) else None
    case_data["dissent_text"] = str(row.get("dissent_text", "")).strip() if pd.notna(row.get("dissent_text")) else None
    case_data["concur_text"] = str(row.get("concur_text", "")).strip() if pd.notna(row.get("concur_text")) else None
    
    # Parse judges_names (could be a list or string)
    if "judges_names" in row and pd.notna(row["judges_names"]):
        judges = row["judges_names"]
        if isinstance(judges, str):
            # If it's a string, split by comma or semicolon
            case_data["judges_names"] = [j.strip() for j in judges.replace(";", ",").split(",") if j.strip()]
        elif isinstance(judges, list):
            case_data["judges_names"] = judges
        else:
            case_data["judges_names"] = None
    else:
        case_data["judges_names"] = None
    
    # AI analysis will be added later
    case_data["ai_analysis"] = None
    
    return case_data


def get_parquet_info(file_path: str) -> Dict[str, Any]:
    """
    Get metadata about a Parquet file without fully parsing it.
    
    Returns:
        - total_rows: int
        - columns: List[str]
        - file_size_mb: float
    """
    try:
        df = pd.read_parquet(file_path)
        file_size = Path(file_path).stat().st_size / (1024 * 1024)  # Convert to MB
        
        return {
            "success": True,
            "total_rows": len(df),
            "columns": df.columns.tolist(),
            "file_size_mb": round(file_size, 2)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

