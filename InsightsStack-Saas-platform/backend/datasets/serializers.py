from pathlib import Path

from rest_framework import serializers

from .models import Dataset, DatasetRecord, ImportHistory

class ImportHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportHistory
        fields = '__all__'

class DatasetSerializer(serializers.ModelSerializer):
    file_type = serializers.CharField(read_only=True)

    class Meta:
        model = Dataset
        fields = '__all__'
        read_only_fields = (
            'created_by', 'row_count', 'columns', 'preview', 'status',
            'error_message', 'created_at', 'updated_at',
        )

    def validate(self, attrs):
        uploaded_file = attrs.get('file')
        if uploaded_file:
            extension = Path(uploaded_file.name).suffix.lower()
            file_types = {'.csv': 'csv', '.xlsx': 'excel', '.json': 'json'}
            if extension not in file_types:
                raise serializers.ValidationError({'file': 'Only CSV, XLSX, and JSON files are supported.'})
            if uploaded_file.size > 25 * 1024 * 1024:
                raise serializers.ValidationError({'file': 'Files must be 25 MB or smaller.'})
            attrs['file_type'] = file_types[extension]

        workspace = attrs.get('workspace', getattr(self.instance, 'workspace', None))
        request = self.context.get('request')
        if workspace and request and not workspace.members.filter(user=request.user).exists():
            raise serializers.ValidationError({'workspace': 'You are not a member of this workspace.'})
        return attrs


class DatasetRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = DatasetRecord
        fields = ('row_index', 'data')
