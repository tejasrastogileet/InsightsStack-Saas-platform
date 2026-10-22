import json

from django.conf import settings
from groq import (
    APIConnectionError,
    APIStatusError,
    AuthenticationError,
    Groq,
    RateLimitError,
)


class AIConfigurationError(RuntimeError):
    pass


class AIResponseError(RuntimeError):
    pass


class AIProviderError(RuntimeError):
    pass


def _generate(system_prompt, user_prompt):
    api_key = settings.GROQ_API_KEY
    if not api_key:
        raise AIConfigurationError('GROQ_API_KEY is not configured.')

    client = Groq(api_key=api_key)
    try:
        try:
            response = client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': user_prompt},
                ],
            )
        except AuthenticationError as error:
            raise AIProviderError(
                'Groq rejected the API key. Check GROQ_API_KEY in backend/.env.'
            ) from error
        except RateLimitError as error:
            raise AIProviderError(
                'Groq rate or usage limit reached. Check your Groq account limits and retry later.'
            ) from error
        except APIConnectionError as error:
            raise AIProviderError(
                'Could not connect to Groq. Check network access and retry.'
            ) from error
        except APIStatusError as error:
            raise AIProviderError(
                f'Groq returned HTTP {error.status_code}. Check GROQ_MODEL and the Groq API status.'
            ) from error
    finally:
        client.close()

    text = response.choices[0].message.content if response.choices else None
    if not isinstance(text, str) or not text.strip():
        raise AIResponseError('Groq returned an empty response.')
    return text.strip()


def get_ai_response(question, context):
    return _generate(
        'You are InsightStack, an analytics assistant. Answer using only the authorized '
        'workspace data supplied by the user. If the data is insufficient, say so. '
        'Do not invent values.',
        f'Workspace context:\n{context}\n\nQuestion:\n{question}',
    )


def get_kpi_insights(data):
    context = json.dumps(data, ensure_ascii=True, default=str)
    return _generate(
        'You are InsightStack, an analytics assistant. Give concise, actionable insights '
        'using only the provided workspace KPIs and dataset metadata. Do not invent '
        'measurements, and explicitly state when the data does not support a conclusion.',
        f'Workspace data:\n{context}',
    )
