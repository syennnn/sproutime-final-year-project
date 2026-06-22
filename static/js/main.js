document.addEventListener('DOMContentLoaded', function () {
    const profileToggle = document.querySelector('[data-profile-toggle]');
    const profilePanel = document.querySelector('[data-profile-panel]');

    function closeProfilePanel() {
        if (profilePanel) {
            profilePanel.classList.remove('open');
        }
    }

    if (profileToggle && profilePanel) {
        profileToggle.addEventListener('click', function (event) {
            event.stopPropagation();
            profilePanel.classList.toggle('open');
        });

        document.addEventListener('click', function (event) {
            const target = event.target;
            if (!profilePanel.contains(target) && target !== profileToggle) {
                closeProfilePanel();
            }
        });

        profilePanel.addEventListener('click', function (event) {
            event.stopPropagation();
        });
    }

    const addStepButton = document.getElementById('add-step-btn');
    const wateringStepsContainer = document.getElementById('watering-steps');
    const suggestButton = document.getElementById('suggest-steps-btn');
    const suggestError = document.getElementById('suggest-error');
    const suggestStatus = document.getElementById('suggest-status');

    function appendWateringStep(value = '') {
        const stepGroup = document.createElement('div');
        stepGroup.className = 'watering-step-row d-flex align-items-flex-start gap-2 mb-3';
        const textarea = document.createElement('textarea');
        textarea.name = 'subtasks[]';
        textarea.className = 'watering-step-input form-control flex-grow-1';
        textarea.placeholder = 'Watering step description';
        textarea.value = value;
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn btn-outline-secondary btn-sm remove-step-btn';
        removeBtn.textContent = 'Remove';
        stepGroup.appendChild(textarea);
        stepGroup.appendChild(removeBtn);
        wateringStepsContainer.appendChild(stepGroup);
    }

    function removeEmptyWateringSteps() {
        const stepRows = wateringStepsContainer.querySelectorAll('.watering-step-row');
        stepRows.forEach((row) => {
            const textarea = row.querySelector('textarea[name="subtasks[]"]');
            if (textarea && textarea.value.trim() === '') {
                row.remove();
            }
        });
    }

    if (addStepButton && wateringStepsContainer) {
        addStepButton.addEventListener('click', () => {
            appendWateringStep('');
        });

        wateringStepsContainer.addEventListener('click', (event) => {
            const target = event.target;
            if (target.classList.contains('remove-step-btn')) {
                const row = target.closest('.watering-step-row');
                if (row) {
                    row.remove();
                }
            }
        });
    }

    function getCSRFToken() {
        const tokenInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
        if (tokenInput) {
            return tokenInput.value;
        }
        return null;
    }

    const seedStorageTray = document.getElementById('seed-storage-tray');
    const selectedSlotNumberElement = document.getElementById('selected-slot-number');
    const seedStorageClose = document.getElementById('seed-storage-close');
    const seedStorageMessage = document.getElementById('seed-storage-message');
    const seedCards = document.querySelectorAll('.seed-card');

    function clearSelectedSlot() {
        const previous = document.querySelector('.garden-slot-selected');
        if (previous) {
            previous.classList.remove('garden-slot-selected');
        }
    }

    function openSeedStorageTray(slotNumber) {
        if (!seedStorageTray) {
            return;
        }
        selectedSlotNumberElement.textContent = slotNumber;
        seedStorageMessage.textContent = 'Click a seed to preview the planting confirmation next.';
        seedStorageTray.classList.add('open');
        seedStorageTray.setAttribute('aria-hidden', 'false');
    }

    function closeSeedStorageTray() {
        if (!seedStorageTray) {
            return;
        }
        seedStorageTray.classList.remove('open');
        seedStorageTray.setAttribute('aria-hidden', 'true');
        clearSelectedSlot();
        seedCards.forEach((card) => card.classList.remove('selected'));
    }

    const gardenSlots = document.querySelectorAll('.garden-slot-clickable');
    gardenSlots.forEach((slot) => {
        slot.addEventListener('click', function () {
            const occupied = this.dataset.occupied === 'true';
            if (occupied) {
                return;
            }

            clearSelectedSlot();
            this.classList.add('garden-slot-selected');
            const slotNumber = this.dataset.slotNumber || this.dataset.slotNumber;
            openSeedStorageTray(slotNumber);
        });
    });

    if (seedStorageClose) {
        seedStorageClose.addEventListener('click', closeSeedStorageTray);
    }

    seedCards.forEach((card) => {
        card.addEventListener('click', function () {
            seedCards.forEach((otherCard) => otherCard.classList.remove('selected'));
            this.classList.add('selected');
            if (seedStorageMessage) {
                seedStorageMessage.textContent = 'Planting confirmation will be added next.';
            }
        });
    });

    if (suggestButton) {
        suggestButton.addEventListener('click', async () => {
            suggestError.style.display = 'none';
            suggestError.textContent = '';
            const titleInput = document.getElementById('id_title');
            const descriptionInput = document.getElementById('id_description');
            const title = titleInput ? titleInput.value.trim() : '';
            const description = descriptionInput ? descriptionInput.value.trim() : '';

            if (!title || !description) {
                suggestError.style.display = 'block';
                suggestError.textContent = 'Please enter a seed name and growth notes before asking Sprout Helper.';
                return;
            }

            const csrfToken = getCSRFToken();
            if (!csrfToken) {
                suggestError.style.display = 'block';
                suggestError.textContent = 'Sprout Helper is unavailable right now. You can still add watering steps manually.';
                return;
            }

            suggestButton.disabled = true;
            const previousLabel = suggestButton.textContent;
            suggestButton.textContent = 'Sprouting ideas...';

            try {
                const response = await fetch('/tasks/suggest-subtasks/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken,
                    },
                    body: JSON.stringify({ title, description }),
                });
                const data = await response.json();

                if (data.success && Array.isArray(data.suggestions)) {
                    removeEmptyWateringSteps();
                    data.suggestions.forEach((suggestion) => {
                        appendWateringStep(suggestion);
                    });
                } else {
                    suggestError.style.display = 'block';
                    suggestError.textContent = data.error || 'Sprout Helper is unavailable right now. You can still add watering steps manually.';
                }
            } catch (error) {
                suggestError.style.display = 'block';
                suggestError.textContent = 'Sprout Helper is unavailable right now. You can still add watering steps manually.';
            } finally {
                suggestButton.disabled = false;
                suggestButton.textContent = previousLabel;
            }
        });
    }
});
