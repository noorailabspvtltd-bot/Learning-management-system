from django.contrib import admin

from .models import Assignment


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ("title", "status", "due_date", "max_marks")
    list_filter = ("status",)
    search_fields = ("title",)