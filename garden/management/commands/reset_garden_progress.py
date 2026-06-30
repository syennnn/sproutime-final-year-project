from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from focus.models import FocusSession
from garden.models import GardenSlot, Plant
from tasks.models import SubTask, Task


class Command(BaseCommand):
    help = 'Reset development garden/focus progress without deleting users or accounts.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--yes',
            action='store_true',
            help='Confirm that garden and focus progress should be reset.',
        )

    def handle(self, *args, **options):
        if not options['yes']:
            raise CommandError('Refusing to reset progress without --yes.')

        valid_seed_types = {seed_type for seed_type, _label in Task.SEED_TYPES}
        now = timezone.now()

        with transaction.atomic():
            focus_deleted, _focus_details = FocusSession.objects.all().delete()
            plants_deleted, _plant_details = Plant.objects.all().delete()
            slots_deleted, _slot_details = GardenSlot.objects.all().delete()

            invalid_tasks = list(Task.objects.exclude(seed_type__in=valid_seed_types))
            for task in invalid_tasks:
                task.seed_type = Task.random_seed_type()
                task.updated_at = now
            if invalid_tasks:
                Task.objects.bulk_update(invalid_tasks, ['seed_type', 'updated_at'])

            tasks_reset = Task.objects.exclude(
                status=Task.STATUS_STORED,
            ).update(
                status=Task.STATUS_STORED,
                updated_at=now,
            )

            subtasks_reset = SubTask.objects.filter(
                Q(is_completed=True) | Q(is_watered=True),
            ).update(
                is_completed=False,
                is_watered=False,
            )

        self.stdout.write(self.style.SUCCESS('Garden progress reset complete.'))
        self.stdout.write(f'Focus sessions deleted: {focus_deleted}')
        self.stdout.write(f'Plants deleted: {plants_deleted}')
        self.stdout.write(f'Garden slots deleted: {slots_deleted}')
        self.stdout.write(f'Tasks reseeded from legacy seed types: {len(invalid_tasks)}')
        self.stdout.write(f'Tasks reset to stored status: {tasks_reset}')
        self.stdout.write(f'Subtasks reset: {subtasks_reset}')
        self.stdout.write('Users/accounts deleted: 0')
