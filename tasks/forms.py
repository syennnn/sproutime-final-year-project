from django import forms

from .models import Task


class TaskForm(forms.ModelForm):
    class Meta:
        model = Task
        fields = ['title', 'description', 'estimated_duration']
        labels = {
            'title': 'Seed Name / Task Name',
            'description': 'Growth Notes',
            'estimated_duration': 'Focus Growth Time (minutes)',
        }
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Enter seed name or task title',
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'Describe how this seed should grow',
                'rows': 5,
            }),
            'estimated_duration': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'Minutes',
                'min': 1,
            }),
        }

    def clean_estimated_duration(self):
        duration = self.cleaned_data.get('estimated_duration')
        if duration is None or duration <= 0:
            raise forms.ValidationError('Enter a positive growth time in minutes.')
        return duration
