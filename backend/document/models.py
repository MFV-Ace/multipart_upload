from django.db import models

# Create your models here.


class Document(models.Model):
    name = models.CharField(max_length=100)
    size = models.IntegerField()
    file = models.FileField(upload_to='document')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    upload_id = models.CharField(max_length=1000, null=True)
