"""
Basic usage example for SyncNotesAI meeting transcript processor.

This example demonstrates how to use the MeetingTranscriptProcessor
to extract summaries, decisions, and tasks from meeting transcripts.
"""

import sys
import os

# Add parent directory to path to import src modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.processors.meeting_transcript_processor import MeetingTranscriptProcessor


def main():
    """Run the basic usage example."""

    # Example transcript
    transcript = """
    Team meeting on Q1 Planning.

    John suggested we prioritize the mobile app redesign.
    Sarah will follow up with the design team by next Friday.

    Decision: We're moving forward with the new tech stack - React Native for mobile.
    Decision: All new features must have unit tests.

    Mike needs to prepare onboarding slides for tomorrow's presentation.
    Lisa will review the API documentation by end of this week.

    The team agreed that sprint length will remain at 2 weeks.
    """

    print("=" * 60)
    print("SyncNotesAI - Meeting Transcript Processor Example")
    print("=" * 60)
    print("\nProcessing transcript...\n")

    try:
        # Initialize the processor
        # Make sure you have set up your .env file with API keys
        processor = MeetingTranscriptProcessor()

        # Process the transcript
        result = processor.process(transcript)

        # Display results
        print("SUMMARY:")
        print(f"  {result['summary']}\n")

        print("DECISIONS:")
        if result['decisions']:
            for i, decision in enumerate(result['decisions'], 1):
                print(f"  {i}. {decision}")
        else:
            print("  No decisions found")
        print()

        print("TASKS:")
        if result['tasks']:
            for i, task in enumerate(result['tasks'], 1):
                due_date = task['due_date'] if task['due_date'] else "No deadline"
                print(f"  {i}. {task['title']}")
                print(f"     Due: {due_date}")
        else:
            print("  No tasks found")
        print()

        # Display JSON output
        print("=" * 60)
        print("JSON OUTPUT:")
        print("=" * 60)
        print(processor.process_json(transcript))

    except ValueError as e:
        print(f"Error: {e}")
        print("\nMake sure you have:")
        print("1. Created a .env file (copy from .env.example)")
        print("2. Added your OpenAI or Anthropic API key")
        print("3. Installed dependencies: pip install -r requirements.txt")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
