# SyncNotesAI.

AI-powered meeting transcript processor that automatically extracts summaries, decisions, and actionable tasks from meeting transcripts.

## Features

- **Smart Summarization**: Generates concise summaries of key discussion points
- **Decision Tracking**: Automatically identifies and extracts decisions made during meetings
- **Task Extraction**: Detects action items with deadlines and assigns them appropriately
- **Deadline Detection**: Intelligently parses relative and absolute dates from natural language
- **Duplicate Prevention**: Ensures no duplicate tasks or decisions in the output
- **Multiple AI Providers**: Supports OpenAI (GPT-4) and Anthropic (Claude)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd syncnotesai
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys
```

## Quick Start

```python
from src.processors.meeting_transcript_processor import MeetingTranscriptProcessor

# Initialize the processor
processor = MeetingTranscriptProcessor()

# Process a transcript
transcript = """
Team meeting on Q1 Planning.
John suggested we prioritize the mobile app redesign.
Sarah will follow up with the design team by next Friday.
Decision: We're moving forward with the new tech stack.
Mike needs to prepare onboarding slides for tomorrow's presentation.
"""

result = processor.process(transcript)

print(result)
# Output:
# {
#   "summary": "Team discussed Q1 planning priorities, focusing on mobile app redesign and new tech stack adoption.",
#   "decisions": ["Moving forward with the new tech stack"],
#   "tasks": [
#     {"title": "Follow up with design team", "due_date": "next Friday"},
#     {"title": "Prepare onboarding slides for presentation", "due_date": "tomorrow"}
#   ]
# }
```

## Configuration

Edit `.env` to configure:

- **AI_PROVIDER**: Choose between `openai` or `anthropic`
- **OPENAI_API_KEY**: Your OpenAI API key (if using OpenAI)
- **ANTHROPIC_API_KEY**: Your Anthropic API key (if using Claude)
- **Model settings**: Customize which model to use

## API Reference

### MeetingTranscriptProcessor

Main class for processing meeting transcripts.

#### Methods

**`process(transcript: str) -> dict`**

Processes a meeting transcript and returns structured output.

**Parameters:**
- `transcript` (str): The meeting transcript text

**Returns:**
- dict with keys:
  - `summary` (str): Concise summary of key points
  - `decisions` (list[str]): List of decisions made
  - `tasks` (list[dict]): List of tasks with `title` and `due_date`

## Testing

Run tests with:
```bash
pytest
```

Run with coverage:
```bash
pytest --cov=src
```

## Project Structure

```
syncnotesai/
├── src/
│   ├── processors/
│   │   └── meeting_transcript_processor.py  # Main processor
│   ├── services/
│   │   └── llm_service.py                   # AI service wrapper
│   ├── models/
│   │   └── processing_result.py             # Data models
│   └── utils/
│       └── date_parser.py                   # Date parsing utilities
├── tests/
│   └── test_processor.py
├── examples/
│   └── sample_transcript.txt
├── requirements.txt
├── .env.example
└── README.md
```

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
