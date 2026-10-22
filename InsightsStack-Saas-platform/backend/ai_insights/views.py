import json
import logging

from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.views import APIView
from rest_framework.response import Response
from datasets.models import Dataset
from workspaces.models import Workspace
from analytics.models import KPI
from .models import AIConversation, AIMessage
from .serializers import AIConversationSerializer
from .groq_client import (
    AIConfigurationError,
    AIProviderError,
    AIResponseError,
    get_ai_response,
    get_kpi_insights,
)

logger = logging.getLogger(__name__)

class AIConversationViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AIConversationSerializer
    
    def get_queryset(self):
        return AIConversation.objects.filter(
            user=self.request.user,
            workspace__members__user=self.request.user,
        ).distinct()

    def perform_create(self, serializer):
        workspace = serializer.validated_data['workspace']
        if not workspace.members.filter(user=self.request.user).exists():
            raise PermissionDenied('You are not a member of this workspace.')
        serializer.save(user=self.request.user)

class AIQueryView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        question = request.data.get('question')
        conversation_id = request.data.get('conversation_id')
        workspace_id = request.data.get('workspace_id')
        
        if not isinstance(question, str) or not question.strip() or not workspace_id:
            return Response({'error': 'question and workspace_id are required'}, status=status.HTTP_400_BAD_REQUEST)
        if len(question) > 1000:
            return Response({'error': 'Questions must be 1,000 characters or fewer.'}, status=status.HTTP_400_BAD_REQUEST)

        workspace = get_object_or_404(
            Workspace.objects.filter(members__user=request.user).distinct(),
            pk=workspace_id,
        )
        if conversation_id:
            try:
                conv = AIConversation.objects.get(
                    id=conversation_id,
                    user=request.user,
                    workspace=workspace,
                )
            except AIConversation.DoesNotExist:
                return Response({'error': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            conv = AIConversation.objects.create(
                user=request.user,
                workspace_id=workspace_id,
                title=question[:50]
            )
            
        AIMessage.objects.create(conversation=conv, role='user', content=question.strip())

        try:
            datasets = Dataset.objects.filter(workspace=workspace, status='ready').order_by('-created_at')
            context = {
                'workspace': workspace.name,
                'datasets': [],
                'kpis': list(KPI.objects.filter(workspace=workspace).values(
                    'name', 'current_value', 'previous_value', 'unit', 'trend',
                )),
            }
            for dataset in datasets[:5]:
                records = list(dataset.records.order_by('-row_index').values_list('data', flat=True)[:20])
                context['datasets'].append({
                    'name': dataset.name,
                    'row_count': dataset.row_count,
                    'columns': dataset.columns,
                    'sample_rows': list(reversed(records)),
                })
            response_text = get_ai_response(
                question.strip(),
                json.dumps(context, ensure_ascii=True, default=str)[:12000],
            )
            AIMessage.objects.create(conversation=conv, role='assistant', content=response_text)
            return Response({'response': response_text, 'conversation_id': conv.id})
        except AIConfigurationError:
            logger.exception('Groq is not configured for AI query.')
            return Response(
                {'error': 'AI analytics is not configured. Set GROQ_API_KEY in backend/.env and restart the backend.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except (AIProviderError, AIResponseError) as error:
            logger.exception('Groq failed to answer an AI query.')
            return Response({'error': str(error)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception:
            logger.exception('AI query failed for user %s and workspace %s.', request.user.pk, workspace.pk)
            return Response(
                {'error': 'Groq could not answer this request. Check GROQ_API_KEY, GROQ_MODEL, network access, and Groq account limits.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

class AIInsightsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        workspace_id = request.query_params.get('workspace_id')
        if not workspace_id:
            return Response({'error': 'workspace_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        workspace = get_object_or_404(
            Workspace.objects.filter(members__user=request.user).distinct(),
            pk=workspace_id,
        )
        kpi_data = {
            'workspace': workspace.name,
            'kpis': list(KPI.objects.filter(workspace=workspace).values(
                'name', 'current_value', 'previous_value', 'unit', 'trend',
            )),
            'datasets': list(Dataset.objects.filter(
                workspace=workspace,
                status='ready',
            ).values('name', 'row_count', 'columns')),
        }
        try:
            if not kpi_data['kpis'] and not kpi_data['datasets']:
                return Response({'error': 'Add a dataset or KPI before generating insights.'}, status=status.HTTP_400_BAD_REQUEST)
            insights = get_kpi_insights(kpi_data)
            return Response({'insights': insights})
        except AIConfigurationError:
            logger.exception('Groq is not configured for AI insights.')
            return Response(
                {'error': 'AI insights are not configured. Set GROQ_API_KEY in backend/.env and restart the backend.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except (AIProviderError, AIResponseError) as error:
            logger.exception('Groq failed to generate AI insights.')
            return Response({'error': str(error)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception:
            logger.exception('AI insight generation failed for user %s and workspace %s.', request.user.pk, workspace.pk)
            return Response(
                {'error': 'Groq could not generate insights. Check GROQ_API_KEY, GROQ_MODEL, network access, and Groq account limits.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
