"""Utilities for parsing dates from natural language."""

from datetime import datetime, timedelta
from dateutil import parser as dateutil_parser
import re


def parse_relative_date(date_str: str) -> str:
    """
    Parse relative date expressions into a more standardized format.

    Handles expressions like:
    - "tomorrow"
    - "next Friday"
    - "in 3 days"
    - "2024-01-15"

    Args:
        date_str: The date string to parse

    Returns:
        Parsed date string (keeps natural language for now)
    """
    if not date_str:
        return None

    date_str = date_str.strip().lower()

    # Map common relative terms
    today = datetime.now()

    # Handle "tomorrow"
    if date_str == "tomorrow":
        return "tomorrow"

    # Handle "today"
    if date_str == "today":
        return "today"

    # Handle "next week"
    if "next week" in date_str:
        return "next week"

    # Handle day names (next Monday, this Friday, etc.)
    weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    for day in weekdays:
        if day in date_str and ("next" in date_str or "this" in date_str):
            return date_str

    # Handle "in X days/weeks"
    in_pattern = r"in (\d+) (day|week|month)s?"
    match = re.search(in_pattern, date_str)
    if match:
        return date_str

    # Try to parse as absolute date
    try:
        parsed = dateutil_parser.parse(date_str)
        return parsed.strftime("%Y-%m-%d")
    except:
        # Return original if can't parse
        return date_str
