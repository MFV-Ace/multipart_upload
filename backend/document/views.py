from math import ceil

import boto3
from botocore.config import Config
from django.conf import settings
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet, ModelViewSet

from document.models import Document
from document.serializers import DocumentSerializer

client = boto3.client(
    's3',
    aws_access_key_id=settings.AWS_S3_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_S3_SECRET_ACCESS_KEY,
    region_name=settings.AWS_S3_REGION_NAME,
    config=Config(signature_version='s3v4')
)


class DocumentUploadView(GenericViewSet):

    @action(methods=['POST'], detail=False)
    def complete(self, request: Request):
        document = Document.objects.get(id=request.data['id'])
        client.complete_multipart_upload(
            Bucket=settings.AWS_STORAGE_BUCKET_NAME,
            Key=f'files/{document.name}',
            MultipartUpload={'Parts': request.data['parts']},
            UploadId=document.upload_id
        )
        document.file = document.file.field.attr_class(document, document.file.field, f'files/{document.name}')
        document.save()
        return Response('OK')

    @action(methods=['POST'], detail=False)
    def start_upload(self, request: Request):
        # check file_name existed
        if Document.objects.filter(name=request.data["file_name"]).exists():
            document = Document.objects.get(name=request.data["file_name"])
        else:
            document = Document(
                name=request.data["file_name"],
                size=int(request.data['file_size'])
            )
        # create upload_id
        response = client.create_multipart_upload(
            Bucket=settings.AWS_STORAGE_BUCKET_NAME,
            Key=f'files/{document.name}',
        )
        document.upload_id = response['UploadId']
        document.save()
        # create upload_urls
        upload_urls = []
        number_of_part = ceil(document.size / settings.PART_UPLOAD_MAX_SIZE)
        for i in range(number_of_part):
            signed_url = client.generate_presigned_url(
                ClientMethod='upload_part',
                HttpMethod='PUT',
                Params={
                    'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                    'Key': f'files/{document.name}',
                    'UploadId': document.upload_id,
                    'PartNumber': i + 1  # part index from 1
                }
            )
            upload_urls.append({
                'part_id': i + 1,
                'url': signed_url
            })
        return Response(
            {
                "meta": {
                    "id": document.id,
                    "number_of_parts": number_of_part,
                    "max_part_size": settings.PART_UPLOAD_MAX_SIZE
                },
                "parts": upload_urls
            }
        )


class DocumentView(ModelViewSet):
    serializer_class = DocumentSerializer
    queryset = Document.objects.all()
