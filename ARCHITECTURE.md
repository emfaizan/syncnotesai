# SyncNotesAI Architecture

## Overview

SyncNotesAI is an AI-powered meeting transcript processor designed to extract actionable insights from meeting transcripts. The system uses Large Language Models (LLMs) to analyze transcript text and output structured data containing summaries, decisions, and tasks.

## Core Components

### 1. Processors (`src/processors/`)

**MeetingTranscriptProcessor**
- Main entry point for transcript processing
- Orchestrates the entire processing pipeline
- Handles prompt engineering and LLM interaction
- Validates and structures output data

**Responsibilities:**
- Accept raw transcript text as input
- Generate optimized prompts for LLM analysis
- Parse and validate LLM responses
- Return structured ProcessingResult objects

### 2. Services (`src/services/`)

**LLMService**
- Abstraction layer for AI provider APIs
- Supports multiple providers (OpenAI, Anthropic)
- Handles API authentication and configuration
- Manages completion generation and response parsing

**Key Features:**
- Provider-agnostic interface
- Automatic JSON extraction from LLM responses
- Error handling and retries
- Environment-based configuration

### 3. Models (`src/models/`)

**ProcessingResult**
- Pydantic model for structured output
- Validates summary, decisions, and tasks
- Automatically removes duplicates
- Ensures data quality and consistency

**Task**
- Represents an actionable item
- Contains title and optional due_date
- Validates task data integrity

**Benefits:**
- Type safety with Pydantic
- Automatic validation
- Duplicate detection and removal
- Consistent JSON serialization

### 4. Utils (`src/utils/`)

**Date Parser**
- Parses relative date expressions
- Handles natural language dates ("tomorrow", "next Friday")
- Normalizes date formats
- Preserves user intent

## Data Flow

```
User Input (Transcript)
        |
        v
MeetingTranscriptProcessor
        |
        v
Generate Optimized Prompt
        |
        v
LLMService
        |
        v
AI Provider API (OpenAI/Anthropic)
        |
        v
Parse JSON Response
        |
        v
Validate with Pydantic Models
        |
        v
ProcessingResult (Output)
```

## Processing Pipeline

1. **Input Validation**
   - Check transcript is not empty
   - Sanitize input text

2. **Prompt Generation**
   - Inject transcript into template
   - Add system instructions
   - Specify output format

3. **LLM Processing**
   - Send prompt to AI provider
   - Receive structured response
   - Handle errors and retries

4. **Response Parsing**
   - Extract JSON from response
   - Handle markdown code blocks
   - Validate JSON structure

5. **Data Validation**
   - Create Pydantic models
   - Remove duplicates
   - Parse dates
   - Validate all fields

6. **Output Generation**
   - Return validated dictionary
   - Or JSON string if requested

## Design Principles

### 1. Modularity
- Each component has a single responsibility
- Clear interfaces between components
- Easy to test and maintain

### 2. Extensibility
- Support for multiple AI providers
- Easy to add new processors
- Pluggable date parsing strategies

### 3. Reliability
- Input validation at all levels
- Pydantic for data integrity
- Automatic duplicate removal
- Error handling throughout

### 4. Usability
- Simple API for end users
- Clear error messages
- Comprehensive examples
- Well-documented code

## Configuration

### Environment Variables
- `AI_PROVIDER`: Choose LLM provider
- `OPENAI_API_KEY`: OpenAI authentication
- `ANTHROPIC_API_KEY`: Anthropic authentication
- Model-specific settings

### Customization Points
1. System prompts in MeetingTranscriptProcessor
2. Date parsing rules in date_parser.py
3. Validation rules in Pydantic models
4. LLM parameters (temperature, max_tokens)

## Error Handling

**Validation Errors**
- Empty transcripts rejected
- Invalid JSON from LLM caught
- Pydantic validation errors surfaced

**API Errors**
- Missing API keys detected early
- Network errors can be retried
- Provider-specific errors handled

**Data Quality**
- Duplicates automatically removed
- Empty fields filtered out
- Malformed dates preserved as-is

## Testing Strategy

### Unit Tests
- Test each component in isolation
- Mock external dependencies
- Validate edge cases

### Integration Tests
- Test full processing pipeline
- Use mock LLM responses
- Verify end-to-end behavior

### Test Coverage Areas
- Empty/invalid inputs
- Duplicate detection
- Date parsing
- JSON parsing
- Model validation

## Future Enhancements

1. **Audio Transcription**
   - Add audio input support
   - Integrate Whisper or similar
   - Handle multiple audio formats

2. **Advanced NLP**
   - Named entity recognition for attendees
   - Sentiment analysis
   - Topic modeling

3. **Database Integration**
   - Store processed transcripts
   - Track tasks and decisions
   - Historical analysis

4. **API Layer**
   - REST API with FastAPI
   - Async processing with Celery
   - Webhook notifications

5. **UI Dashboard**
   - Web interface for uploads
   - Visualization of insights
   - Task management

## Performance Considerations

- LLM API calls are the primary bottleneck
- Consider caching for repeated transcripts
- Batch processing for multiple transcripts
- Async processing for large volumes

## Security

- API keys stored in environment variables
- Never log sensitive data
- Validate all user inputs
- Use secure API communication (HTTPS)
