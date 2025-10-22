"""Data models for processing results."""

from typing import List, Optional
from pydantic import BaseModel, Field, validator


class Task(BaseModel):
    """Represents an actionable task extracted from a meeting."""

    title: str = Field(..., description="Clear, actionable task description")
    due_date: Optional[str] = Field(None, description="Deadline for the task (natural language or ISO format)")

    @validator('title')
    def title_must_not_be_empty(cls, v):
        """Ensure task title is not empty."""
        if not v or not v.strip():
            raise ValueError('Task title cannot be empty')
        return v.strip()

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Follow up with John on proposal",
                "due_date": "next Friday"
            }
        }


class ProcessingResult(BaseModel):
    """Result of processing a meeting transcript."""

    summary: str = Field(..., description="Concise summary of key discussion points")
    decisions: List[str] = Field(default_factory=list, description="List of decisions made")
    tasks: List[Task] = Field(default_factory=list, description="List of actionable tasks")

    @validator('summary')
    def summary_must_not_be_empty(cls, v):
        """Ensure summary is not empty."""
        if not v or not v.strip():
            raise ValueError('Summary cannot be empty')
        return v.strip()

    @validator('decisions')
    def remove_duplicate_decisions(cls, v):
        """Remove duplicate decisions while preserving order."""
        seen = set()
        unique_decisions = []
        for decision in v:
            decision_clean = decision.strip()
            if decision_clean and decision_clean.lower() not in seen:
                seen.add(decision_clean.lower())
                unique_decisions.append(decision_clean)
        return unique_decisions

    @validator('tasks')
    def remove_duplicate_tasks(cls, v):
        """Remove duplicate tasks based on title similarity."""
        seen = set()
        unique_tasks = []
        for task in v:
            task_key = task.title.lower().strip()
            if task_key not in seen:
                seen.add(task_key)
                unique_tasks.append(task)
        return unique_tasks

    class Config:
        json_schema_extra = {
            "example": {
                "summary": "Team discussed Q1 planning priorities and technology stack decisions.",
                "decisions": [
                    "Moving forward with the new tech stack",
                    "Prioritize mobile app redesign"
                ],
                "tasks": [
                    {"title": "Follow up with design team", "due_date": "next Friday"},
                    {"title": "Prepare onboarding slides", "due_date": "tomorrow"}
                ]
            }
        }
