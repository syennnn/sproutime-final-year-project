import json
import math
import re

from django.conf import settings
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.views.decorators.http import require_POST

from openai import OpenAI

from .forms import TaskForm
from .models import SubTask, Task


@login_required
def tasks_home(request):
    return render(request, 'tasks/placeholder.html')


@login_required
@require_POST
def suggest_subtasks(request):
    if not settings.OPENAI_API_KEY:
        return JsonResponse({
            'success': False,
            'error': 'Sprout Helper is unavailable right now. Please add watering steps manually.',
        })

    try:
        payload = json.loads(request.body.decode('utf-8'))
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({
            'success': False,
            'error': 'Sprout Helper is unavailable right now. Please add watering steps manually.',
        })

    title = payload.get('title', '').strip()
    description = payload.get('description', '').strip()

    if not title or not description:
        return JsonResponse({
            'success': False,
            'error': 'Please enter a seed name and growth notes before asking Sprout Helper.',
        })

    def fallback_chapter_steps(title_text, description_text):
        combined = f'{title_text} {description_text}'.lower()
        match = re.search(r'(\d+)\s*(chapters|sections|modules|lessons|parts)\b', combined)
        if not match:
            return None

        count = int(match.group(1))
        unit_word = match.group(2)
        unit_map = {
            'chapters': 'Chapter',
            'sections': 'Section',
            'modules': 'Module',
            'lessons': 'Lesson',
            'parts': 'Part',
        }
        unit_label = unit_map.get(unit_word, 'Part')
        steps = []

        if count <= 7:
            steps = [f'{i}. Complete {unit_label} {i}' for i in range(1, count + 1)]
        else:
            if count <= 10:
                group_size = 2
            elif count <= 14:
                group_size = 3
            elif count <= 21:
                group_size = 4
            else:
                group_size = max(5, math.ceil(count / 5))

            for start in range(1, count + 1, group_size):
                end = min(start + group_size - 1, count)
                if start == end:
                    steps.append(f'{len(steps) + 1}. Complete {unit_label} {start}')
                else:
                    steps.append(f'{len(steps) + 1}. Complete {unit_label} {start}–{end}')

        assessment_keywords = ['final assessment', 'assessment', 'quiz', 'test', 'submission', 'project', 'review']
        if any(keyword in combined for keyword in assessment_keywords) and len(steps) < 7:
            steps.append(f'{len(steps) + 1}. Complete the final assessment')

        if len(steps) < 2:
            return None

        return steps

    fallback_steps = fallback_chapter_steps(title, description)
    if fallback_steps:
        return JsonResponse({
            'success': True,
            'suggestions': fallback_steps,
        })

    prompt = (
        'You are Sprout Helper, an assistant inside a cozy focus app called Sproutime.\n'
        'Your job is to break one user task into meaningful watering steps.\n\n'
        'Sproutime context:\n'
        '- The user will complete these watering steps during a focus session with an estimated duration in minutes or hours.\n'
        '- Every watering step must be realistic to do during that focus session.\n\n'
        'Rules:\n'
        '- Return between 2 and 7 steps only.\n'
        '- Use 3 to 5 steps for vague or simple tasks.\n'
        '- Use up to 7 steps only when the user gives clear structure or many important components.\n'
        '- Number each step using this format: 1. Step text\n'
        '- Each step must be short, specific, useful, and action-based.\n'
        '- Preserve clear structure from the user’s task.\n'
        '- If the user gives an exact number of chapters, sections, modules, topics, or lessons, create steps based on that number when possible.\n'
        '- If the total number of parts is more than 7, group related parts instead of dropping them.\n'
        '- Do not invent exact numbered chapters, topics, modules, or sections unless the user provides a number.\n'
        '- Do not suggest external events that cannot be completed during the focus session.\n'
        '- Do not suggest actions controlled by someone else.\n'
        '- Avoid suggestions like “Take the final exam”, “Attend class”, “Receive feedback”, “Get graded”, “Attend the exam”, or other external outcome events.\n'
        '- If the user mentions an exam, test, quiz, or assessment, treat it as preparation unless the user clearly says it is an online submission task for this session.\n'
        '- For exam prep, suggest actions such as reviewing notes, practicing questions, summarizing weak areas, and preparing revision notes.\n'
        '- For coursework or assessment completion, suggest actions such as drafting, checking requirements, proofreading, and preparing submission files.\n'
        '- If the task includes “final assessment” and the context sounds like coursework to complete, use “Complete the final assessment draft” or “Prepare the final assessment answers” instead of “Take the final assessment”.\n'
        '- Do not add unnecessary extra steps.\n'
        '- Do not include explanations.\n'
        '- Do not auto-save suggestions.\n'
        '- Return only the numbered list.\n\n'
        f'Task title: {title}\n'
        f'Task description: {description}\n'
    )

    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[
                {
                    'role': 'system',
                    'content': 'You are Sprout Helper. You suggest short task breakdown steps for students.',
                },
                {
                    'role': 'user',
                    'content': prompt,
                },
            ],
            temperature=0.5,
            max_tokens=260,
        )
        text = response.choices[0].message.content.strip()
    except Exception:
        return JsonResponse({
            'success': False,
            'error': 'Sprout Helper is unavailable right now. You can still add watering steps manually.',
        })

    suggestions = []
    for line in text.splitlines():
        if not line.strip():
            continue
        cleaned = line.strip()
        if cleaned.startswith('-') or cleaned.startswith('*'):
            cleaned = cleaned[1:].strip()
        if cleaned and len(suggestions) < 7:
            suggestions.append(cleaned)

    if len(suggestions) < 2:
        return JsonResponse({
            'success': False,
            'error': 'Sprout Helper is unavailable right now. You can still add watering steps manually.',
        })

    return JsonResponse({
        'success': True,
        'suggestions': suggestions,
    })


@login_required
def create_task(request):
    if request.method == 'POST':
        form = TaskForm(request.POST)
        watering_steps = [step.strip() for step in request.POST.getlist('subtasks[]') if step.strip()]
        form_errors = None

        if not watering_steps:
            form_errors = 'Please add at least one watering step.'

        if form.is_valid() and not form_errors:
            task = form.save(commit=False)
            task.user = request.user
            task.seed_type = Task.random_seed_type()
            task.status = Task.STATUS_STORED
            task.save()

            for step_text in watering_steps:
                SubTask.objects.create(task=task, title=step_text)

            messages.success(request, 'Your seed is ready and saved in Seed Storage!')
            return redirect('/garden/')
    else:
        form = TaskForm()
        watering_steps = ['']
        form_errors = None

    return render(request, 'tasks/create_task.html', {
        'form': form,
        'watering_steps': watering_steps,
        'form_errors': form_errors,
    })
