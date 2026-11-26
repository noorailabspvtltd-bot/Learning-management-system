from django.contrib import admin
from .models import Batch


@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'batch_code',
        'start_date',
        'end_date',
        'status',
        'max_students',
    )

    list_filter = ('status',)
    search_fields = ('name', 'batch_code')