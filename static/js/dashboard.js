document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('result-detail-modal');
    if (!modal) {
        return;
    }

    modal.addEventListener('show.bs.modal', function (event) {
        const trigger = event.relatedTarget;
        if (!trigger) {
            return;
        }

        const title = document.getElementById('result-detail-title');
        const message = document.getElementById('result-detail-message');
        const seed = document.getElementById('result-detail-seed');
        const state = document.getElementById('result-detail-state');
        const watered = document.getElementById('result-detail-watered');
        const time = document.getElementById('result-detail-time');

        if (title) {
            title.textContent = trigger.dataset.taskTitle || 'Focus result';
        }
        if (message) {
            message.textContent = trigger.dataset.resultMessage || 'Your focus result is saved.';
        }
        if (seed) {
            seed.textContent = trigger.dataset.seedType || 'Seed';
        }
        if (state) {
            state.textContent = trigger.dataset.plantState || 'Plant';
        }
        if (watered) {
            watered.textContent = `${trigger.dataset.watered || 0} / ${trigger.dataset.total || 0}`;
        }
        if (time) {
            time.textContent = trigger.dataset.timeSpent || '00:00';
        }
    });
});
