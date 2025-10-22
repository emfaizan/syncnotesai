"""LLM service for interacting with AI providers."""

import os
import json
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


class LLMService:
    """Service for interacting with Large Language Models."""

    def __init__(
        self,
        provider: Optional[str] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
    ):
        """
        Initialize the LLM service.

        Args:
            provider: AI provider ('openai' or 'anthropic'). Defaults to env var AI_PROVIDER.
            api_key: API key for the provider. Defaults to env var.
            model: Model name to use. Defaults to env var.
        """
        self.provider = provider or os.getenv("AI_PROVIDER", "openai")
        self.model = model or self._get_default_model()
        self.api_key = api_key or self._get_api_key()

        if not self.api_key:
            raise ValueError(
                f"API key not found for provider '{self.provider}'. "
                "Set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env file."
            )

        self._client = self._initialize_client()

    def _get_default_model(self) -> str:
        """Get default model based on provider."""
        if self.provider == "openai":
            return os.getenv("OPENAI_MODEL", "gpt-4-turbo-preview")
        elif self.provider == "anthropic":
            return os.getenv("ANTHROPIC_MODEL", "claude-3-sonnet-20240229")
        return "gpt-4-turbo-preview"

    def _get_api_key(self) -> Optional[str]:
        """Get API key for the configured provider."""
        if self.provider == "openai":
            return os.getenv("OPENAI_API_KEY")
        elif self.provider == "anthropic":
            return os.getenv("ANTHROPIC_API_KEY")
        return None

    def _initialize_client(self):
        """Initialize the appropriate AI client."""
        if self.provider == "openai":
            try:
                from openai import OpenAI
                return OpenAI(api_key=self.api_key)
            except ImportError:
                raise ImportError(
                    "OpenAI package not installed. Run: pip install openai"
                )
        elif self.provider == "anthropic":
            try:
                from anthropic import Anthropic
                return Anthropic(api_key=self.api_key)
            except ImportError:
                raise ImportError(
                    "Anthropic package not installed. Run: pip install anthropic"
                )
        else:
            raise ValueError(f"Unsupported provider: {self.provider}")

    def generate_completion(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """
        Generate a completion from the LLM.

        Args:
            prompt: The user prompt
            system_prompt: Optional system prompt

        Returns:
            The generated text response
        """
        if self.provider == "openai":
            return self._openai_completion(prompt, system_prompt)
        elif self.provider == "anthropic":
            return self._anthropic_completion(prompt, system_prompt)
        else:
            raise ValueError(f"Unsupported provider: {self.provider}")

    def _openai_completion(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generate completion using OpenAI."""
        messages = []

        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        messages.append({"role": "user", "content": prompt})

        response = self._client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.3,
            max_tokens=2000,
        )

        return response.choices[0].message.content

    def _anthropic_completion(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generate completion using Anthropic Claude."""
        kwargs = {
            "model": self.model,
            "max_tokens": 2000,
            "temperature": 0.3,
            "messages": [{"role": "user", "content": prompt}],
        }

        if system_prompt:
            kwargs["system"] = system_prompt

        response = self._client.messages.create(**kwargs)

        return response.content[0].text

    def extract_json(self, text: str) -> dict:
        """
        Extract JSON from LLM response.

        Handles cases where the LLM wraps JSON in markdown code blocks.

        Args:
            text: The text containing JSON

        Returns:
            Parsed JSON as a dictionary
        """
        # Remove markdown code blocks if present
        text = text.strip()

        # Check for ```json blocks
        if text.startswith("```json"):
            text = text[7:]  # Remove ```json
        elif text.startswith("```"):
            text = text[3:]  # Remove ```

        if text.endswith("```"):
            text = text[:-3]  # Remove trailing ```

        text = text.strip()

        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse JSON from LLM response: {e}\n\nResponse: {text}")
