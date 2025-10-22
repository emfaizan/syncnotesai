"""Tests for the meeting transcript processor."""

import pytest
from unittest.mock import Mock, patch
from src.processors.meeting_transcript_processor import MeetingTranscriptProcessor
from src.services.llm_service import LLMService
from src.models.processing_result import ProcessingResult, Task


class TestMeetingTranscriptProcessor:
    """Test cases for MeetingTranscriptProcessor."""

    @pytest.fixture
    def mock_llm_service(self):
        """Create a mock LLM service."""
        mock = Mock(spec=LLMService)
        return mock

    @pytest.fixture
    def processor(self, mock_llm_service):
        """Create a processor with mock LLM service."""
        return MeetingTranscriptProcessor(llm_service=mock_llm_service)

    def test_process_empty_transcript_raises_error(self, processor):
        """Test that processing empty transcript raises ValueError."""
        with pytest.raises(ValueError, match="Transcript cannot be empty"):
            processor.process("")

        with pytest.raises(ValueError, match="Transcript cannot be empty"):
            processor.process("   ")

    def test_process_valid_transcript(self, processor, mock_llm_service):
        """Test processing a valid transcript."""
        # Mock LLM response
        mock_response = """
        {
          "summary": "Team discussed project priorities and made key decisions.",
          "decisions": ["Moving forward with new tech stack", "Sprint length remains 2 weeks"],
          "tasks": [
            {"title": "Follow up with design team", "due_date": "next Friday"},
            {"title": "Prepare onboarding slides", "due_date": "tomorrow"}
          ]
        }
        """

        mock_llm_service.generate_completion.return_value = mock_response
        mock_llm_service.extract_json.return_value = {
            "summary": "Team discussed project priorities and made key decisions.",
            "decisions": ["Moving forward with new tech stack", "Sprint length remains 2 weeks"],
            "tasks": [
                {"title": "Follow up with design team", "due_date": "next Friday"},
                {"title": "Prepare onboarding slides", "due_date": "tomorrow"}
            ]
        }

        transcript = "Team meeting on Q1 planning. Decision: Moving forward with new tech stack."
        result = processor.process(transcript)

        # Verify LLM was called
        assert mock_llm_service.generate_completion.called
        assert mock_llm_service.extract_json.called

        # Verify result structure
        assert "summary" in result
        assert "decisions" in result
        assert "tasks" in result

        # Verify content
        assert result["summary"] == "Team discussed project priorities and made key decisions."
        assert len(result["decisions"]) == 2
        assert len(result["tasks"]) == 2

    def test_process_removes_duplicate_decisions(self, processor, mock_llm_service):
        """Test that duplicate decisions are removed."""
        mock_llm_service.generate_completion.return_value = "{}"
        mock_llm_service.extract_json.return_value = {
            "summary": "Meeting summary",
            "decisions": [
                "Decision A",
                "Decision B",
                "Decision A",  # Duplicate
                "decision a",  # Duplicate (case insensitive)
            ],
            "tasks": []
        }

        transcript = "Some meeting transcript"
        result = processor.process(transcript)

        # Should only have 2 unique decisions
        assert len(result["decisions"]) == 2
        assert "Decision A" in result["decisions"]
        assert "Decision B" in result["decisions"]

    def test_process_removes_duplicate_tasks(self, processor, mock_llm_service):
        """Test that duplicate tasks are removed."""
        mock_llm_service.generate_completion.return_value = "{}"
        mock_llm_service.extract_json.return_value = {
            "summary": "Meeting summary",
            "decisions": [],
            "tasks": [
                {"title": "Task A", "due_date": "tomorrow"},
                {"title": "Task B", "due_date": "next week"},
                {"title": "Task A", "due_date": "today"},  # Duplicate title
            ]
        }

        transcript = "Some meeting transcript"
        result = processor.process(transcript)

        # Should only have 2 unique tasks
        assert len(result["tasks"]) == 2
        task_titles = [task["title"] for task in result["tasks"]]
        assert "Task A" in task_titles
        assert "Task B" in task_titles

    def test_process_handles_null_due_dates(self, processor, mock_llm_service):
        """Test that null due dates are handled correctly."""
        mock_llm_service.generate_completion.return_value = "{}"
        mock_llm_service.extract_json.return_value = {
            "summary": "Meeting summary",
            "decisions": [],
            "tasks": [
                {"title": "Task without deadline", "due_date": None},
                {"title": "Task with null string", "due_date": "null"},
            ]
        }

        transcript = "Some meeting transcript"
        result = processor.process(transcript)

        # Both tasks should have None as due_date
        assert result["tasks"][0]["due_date"] is None
        assert result["tasks"][1]["due_date"] is None

    def test_process_json_returns_valid_json_string(self, processor, mock_llm_service):
        """Test that process_json returns valid JSON string."""
        import json

        mock_llm_service.generate_completion.return_value = "{}"
        mock_llm_service.extract_json.return_value = {
            "summary": "Test summary",
            "decisions": ["Decision 1"],
            "tasks": [{"title": "Task 1", "due_date": "tomorrow"}]
        }

        transcript = "Test transcript"
        result_json = processor.process_json(transcript)

        # Should be valid JSON
        parsed = json.loads(result_json)
        assert parsed["summary"] == "Test summary"
        assert len(parsed["decisions"]) == 1
        assert len(parsed["tasks"]) == 1

    def test_invalid_json_response_raises_error(self, processor, mock_llm_service):
        """Test that invalid JSON from LLM raises error."""
        mock_llm_service.generate_completion.return_value = "Invalid JSON response"
        mock_llm_service.extract_json.side_effect = ValueError("Failed to parse JSON")

        transcript = "Test transcript"

        with pytest.raises(ValueError, match="Failed to parse LLM response"):
            processor.process(transcript)


class TestProcessingResult:
    """Test cases for ProcessingResult model."""

    def test_valid_processing_result(self):
        """Test creating a valid ProcessingResult."""
        result = ProcessingResult(
            summary="Test summary",
            decisions=["Decision 1", "Decision 2"],
            tasks=[
                Task(title="Task 1", due_date="tomorrow"),
                Task(title="Task 2", due_date=None)
            ]
        )

        assert result.summary == "Test summary"
        assert len(result.decisions) == 2
        assert len(result.tasks) == 2

    def test_empty_summary_raises_error(self):
        """Test that empty summary raises validation error."""
        with pytest.raises(ValueError):
            ProcessingResult(summary="", decisions=[], tasks=[])

    def test_task_title_cannot_be_empty(self):
        """Test that empty task title raises validation error."""
        with pytest.raises(ValueError):
            Task(title="", due_date="tomorrow")

    def test_duplicate_decisions_removed(self):
        """Test that duplicate decisions are automatically removed."""
        result = ProcessingResult(
            summary="Test",
            decisions=["Decision A", "Decision B", "Decision A", "decision a"],
            tasks=[]
        )

        # Should only have 2 unique decisions
        assert len(result.decisions) == 2

    def test_duplicate_tasks_removed(self):
        """Test that duplicate tasks are automatically removed."""
        result = ProcessingResult(
            summary="Test",
            decisions=[],
            tasks=[
                Task(title="Task A", due_date="tomorrow"),
                Task(title="Task B", due_date="next week"),
                Task(title="Task A", due_date="today"),  # Duplicate
            ]
        )

        # Should only have 2 unique tasks
        assert len(result.tasks) == 2
