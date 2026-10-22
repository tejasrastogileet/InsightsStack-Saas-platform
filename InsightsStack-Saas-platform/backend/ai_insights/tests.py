from types import SimpleNamespace
from unittest.mock import Mock, patch

from django.test import SimpleTestCase, override_settings

from .groq_client import (
    AIConfigurationError,
    AIResponseError,
    get_ai_response,
)


class GroqClientTests(SimpleTestCase):
    @override_settings(GROQ_API_KEY='test-key', GROQ_MODEL='groq-test')
    @patch('ai_insights.groq_client.Groq')
    def test_query_uses_configured_model_and_closes_client(self, client_factory):
        client = Mock()
        client.chat.completions.create.return_value = SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(content='  Answer  '),
                ),
            ],
        )
        client_factory.return_value = client

        result = get_ai_response('What changed?', '{"rows": 2}')

        self.assertEqual(result, 'Answer')
        client_factory.assert_called_once_with(api_key='test-key')
        client.chat.completions.create.assert_called_once()
        self.assertEqual(
            client.chat.completions.create.call_args.kwargs['model'],
            'groq-test',
        )
        self.assertEqual(
            client.chat.completions.create.call_args.kwargs['messages'][1]['content'],
            'Workspace context:\n{"rows": 2}\n\nQuestion:\nWhat changed?',
        )
        client.close.assert_called_once()

    @override_settings(GROQ_API_KEY='')
    @patch('ai_insights.groq_client.Groq')
    def test_missing_api_key_fails_before_client_creation(self, client_factory):
        with self.assertRaises(AIConfigurationError):
            get_ai_response('question', '{}')

        client_factory.assert_not_called()

    @override_settings(GROQ_API_KEY='test-key', GROQ_MODEL='groq-test')
    @patch('ai_insights.groq_client.Groq')
    def test_empty_provider_response_is_rejected(self, client_factory):
        client = Mock()
        client.chat.completions.create.return_value = SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(content='  '),
                ),
            ],
        )
        client_factory.return_value = client

        with self.assertRaises(AIResponseError):
            get_ai_response('question', '{}')

        client.close.assert_called_once()
