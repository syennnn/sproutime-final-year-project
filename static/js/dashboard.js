document.addEventListener('DOMContentLoaded', function () {
    const carousel = document.querySelector('[data-outcome-carousel]');
    if (carousel) {
        const cards = Array.from(carousel.querySelectorAll('[data-outcome-card]'));
        const previousButton = carousel.querySelector('[data-outcome-prev]');
        const nextButton = carousel.querySelector('[data-outcome-next]');
        const pageSize = Math.max(1, Number.parseInt(carousel.dataset.pageSize || '5', 10));
        let startIndex = 0;

        function renderCarousel() {
            cards.forEach(function (card, index) {
                const isVisible = index >= startIndex && index < startIndex + pageSize;
                card.hidden = !isVisible;
            });

            const hasPrevious = startIndex > 0;
            const hasNext = startIndex + pageSize < cards.length;

            if (previousButton) {
                previousButton.disabled = !hasPrevious;
                previousButton.setAttribute('aria-disabled', String(!hasPrevious));
            }

            if (nextButton) {
                nextButton.disabled = !hasNext;
                nextButton.setAttribute('aria-disabled', String(!hasNext));
            }
        }

        if (previousButton) {
            previousButton.addEventListener('click', function () {
                startIndex = Math.max(0, startIndex - pageSize);
                renderCarousel();
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', function () {
                startIndex = Math.min(cards.length - 1, startIndex + pageSize);
                renderCarousel();
            });
        }

        renderCarousel();
    }

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
        const kicker = document.getElementById('result-detail-kicker');
        const subtext = document.getElementById('result-detail-subtext');
        const image = document.getElementById('result-detail-image');
        const task = document.getElementById('result-detail-task');
        const message = document.getElementById('result-detail-message');
        const seed = document.getElementById('result-detail-seed');
        const state = document.getElementById('result-detail-state');
        const watered = document.getElementById('result-detail-watered');
        const focusCompleted = document.getElementById('result-detail-focus-completed');
        const time = document.getElementById('result-detail-time');
        const resultType = trigger.dataset.resultType || 'flower';

        modal.classList.toggle('is-bud-result', resultType === 'bud');
        modal.classList.toggle('is-flower-result', resultType !== 'bud');

        if (kicker) {
            kicker.textContent = trigger.dataset.resultTitle || 'Focus Result';
        }
        if (title) {
            title.textContent = trigger.dataset.resultHeading || 'Focus result';
        }
        if (subtext) {
            subtext.textContent = trigger.dataset.resultSubtext || 'Your focus result is saved.';
        }
        if (image) {
            image.src = trigger.dataset.resultImage || image.src;
            image.alt = '';
        }
        if (task) {
            task.textContent = trigger.dataset.taskTitle || 'Selected task';
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
        if (focusCompleted) {
            focusCompleted.textContent = trigger.dataset.focusCompleted || 'No';
        }
        if (time) {
            time.textContent = trigger.dataset.timeSpent || '00:00';
        }
    });
});
