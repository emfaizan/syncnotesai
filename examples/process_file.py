"""
Example: Process a meeting transcript from a file.

Usage:
    python examples/process_file.py examples/sample_transcript.txt
"""

import sys
import os
import argparse

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.processors.meeting_transcript_processor import MeetingTranscriptProcessor


def main():
    """Process a transcript file."""
    parser = argparse.ArgumentParser(description='Process a meeting transcript file')
    parser.add_argument('file', help='Path to the transcript file')
    parser.add_argument('--json', action='store_true', help='Output as JSON only')
    parser.add_argument('--provider', choices=['openai', 'anthropic'], help='AI provider to use')

    args = parser.parse_args()

    # Read the transcript file
    try:
        with open(args.file, 'r', encoding='utf-8') as f:
            transcript = f.read()
    except FileNotFoundError:
        print(f"Error: File not found: {args.file}")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading file: {e}")
        sys.exit(1)

    # Process the transcript
    try:
        processor = MeetingTranscriptProcessor(provider=args.provider)

        if args.json:
            # Output JSON only
            print(processor.process_json(transcript))
        else:
            # Pretty print
            result = processor.process(transcript)

            print("\n" + "=" * 60)
            print(f"PROCESSED: {args.file}")
            print("=" * 60 + "\n")

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
                    due_date = task['due_date'] if task['due_date'] else "No deadline specified"
                    print(f"  {i}. {task['title']}")
                    print(f"     Due: {due_date}")
            else:
                print("  No tasks found")
            print()

    except ValueError as e:
        print(f"Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
