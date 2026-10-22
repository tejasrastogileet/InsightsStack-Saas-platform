from .models import AuditLog


def record_audit_event(request, action, resource_type, resource_id, resource_name, workspace=None, changes=None):
    ip_address = request.META.get('REMOTE_ADDR') if request else None
    return AuditLog.objects.create(
        user=request.user if request and request.user.is_authenticated else None,
        workspace=workspace,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id),
        resource_name=str(resource_name)[:255],
        changes=changes or {},
        ip_address=ip_address,
        user_agent=request.META.get('HTTP_USER_AGENT', '')[:1000] if request else '',
    )
