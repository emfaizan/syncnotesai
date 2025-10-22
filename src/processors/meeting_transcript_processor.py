"""Meeting transcript processor using AI to extract insights."""

import json
from typing import Optional
from ..services.llm_service import LLMService
from ..models.processing_result import ProcessingResult, Task
from ..utils.date_parser import parse_relative_date


class MeetingTranscriptProcessor:
    """
    AI-powered processor for meeting transcripts.

    Extracts summaries, decisions, and actionable tasks from meeting transcripts.
    """

    SYSTEM_PROMPT = """You are an AI assistant specialized in analyzing meeting transcripts.
Your task is to extract key information and structure it in a specific JSON format.

Follow these rules strictly:
1. Use clear, actionable language for all extracted items
2. Avoid duplicates or vague items
3. Detect and extract deadlines when mentioned (keep natural language format)
4. For tasks, extract the assignee's action and any mentioned deadline
5. For decisions, extract definitive conclusions or agreements
6. For summary, provide a concise overview (1-3 sentences) of key discussion points

Output ONLY valid JSON with no additional text or markdown formatting."""

    USER_PROMPT_TEMPLATE = """Analyze the following meeting transcript and extract:
1. A concise summary of key discussion points
2. All decisions that were made
3. All actionable tasks with their deadlines (if mentioned)

Meeting Transcript:
{transcript}

Output the result in this exact JSON format:
{{
  "summary": "Concise summary of key discussion points.",
  "decisions": ["Decision 1", "Decision 2"],
  "tasks": [
     {{"title": "Clear action item", "due_date": "deadline if mentioned or null"}},
     {{"title": "Another action item", "due_date": "deadline if mentioned or null"}}
  ]
}}

Remember:
- Keep task titles clear and actionable
- Preserve deadline information exactly as mentioned
- Avoid duplicates
- Use null for due_date if no deadline is mentioned
- Output ONLY the JSON, nothing else"""

    def __init__(
        self,
        llm_service: Optional[LLMService] = None,
        provider: Optional[str] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
    ):
        """
        Initialize the meeting transcript processor.

        Args:
            llm_service: Pre-configured LLM service. If None, creates a new one.
            provider: AI provider ('openai' or 'anthropic')
            api_key: API key for the provider
            model: Model name to use
        """
        if llm_service:
            self.llm = llm_service
        else:
            self.llm = LLMService(provider=provider, api_key=api_key, model=model)

    def process(self, transcript: str) -> dict:
        """
        Process a meeting transcript and extract structured information.

        Args:
            transcript: The meeting transcript text

        Returns:
            Dictionary containing summary, decisions, and tasks

        Raises:
            ValueError: If transcript is empty or processing fails
        """
        if not transcript or not transcript.strip():
            raise ValueError("Transcript cannot be empty")

        # Generate the prompt
        user_prompt = self.USER_PROMPT_TEMPLATE.format(transcript=transcript.strip())

        # Get completion from LLM
        response = self.llm.generate_completion(
            prompt=user_prompt,
            system_prompt=self.SYSTEM_PROMPT
        )

        # Parse JSON response
        try:
            result_dict = self.llm.extract_json(response)
        except ValueError as e:
            raise ValueError(f"Failed to parse LLM response: {e}")

        # Validate and clean the result using Pydantic
        try:
            # Process tasks to parse dates
            tasks_data = result_dict.get("tasks", [])
            processed_tasks = []

            for task_data in tasks_data:
                # Parse the due_date if present
                due_date = task_data.get("due_date")
                if due_date and due_date.lower() != "null":
                    due_date = parse_relative_date(due_date)
                else:
                    due_date = None

                processed_tasks.append({
                    "title": task_data.get("title", ""),
                    "due_date": due_date
                })

            # Create validated result
            result = ProcessingResult(
                summary=result_dict.get("summary", ""),
                decisions=result_dict.get("decisions", []),
                tasks=[Task(**task) for task in processed_tasks if task.get("title")]
            )

            # Return as dictionary
            return result.model_dump()

        except Exception as e:
            raise ValueError(f"Failed to validate processing result: {e}")

    def process_json(self, transcript: str) -> str:
        """
        Process transcript and return JSON string.

        Args:
            transcript: The meeting transcript text

        Returns:
            JSON string of the processing result
        """
        result = self.process(transcript)
        return json.dumps(result, indent=2)
