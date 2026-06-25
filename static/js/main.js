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

    const settingsButton = document.getElementById('game-settings-button');
    const settingsModal = document.getElementById('game-settings-modal');
    const settingsClose = document.getElementById('game-settings-close');
    const settingsInputs = settingsModal ? settingsModal.querySelectorAll('[data-setting-key]') : [];
    const settingsStoragePrefix = 'sproutime.settings.';

    function readSetting(key, fallback) {
        try {
            const stored = window.localStorage.getItem(`${settingsStoragePrefix}${key}`);
            if (stored === null) {
                return fallback;
            }
            return stored === 'true';
        } catch (error) {
            return fallback;
        }
    }

    function saveSetting(key, value) {
        try {
            window.localStorage.setItem(`${settingsStoragePrefix}${key}`, String(value));
        } catch (error) {
            // Settings are UI-only, so storage failures should not block the app.
        }
    }

    function applySettingsState() {
        settingsInputs.forEach((input) => {
            const key = input.dataset.settingKey;
            const enabled = readSetting(key, input.checked);
            input.checked = enabled;
            if (key === 'touchFeedback') {
                document.body.classList.toggle('settings-touch-feedback-off', !enabled);
            }
        });
    }

    function openSettingsModal() {
        if (!settingsModal) {
            return;
        }
        settingsModal.hidden = false;
        settingsModal.classList.add('is-open');
        settingsModal.setAttribute('aria-hidden', 'false');
        if (settingsButton) {
            settingsButton.setAttribute('aria-expanded', 'true');
        }
        const firstToggle = settingsModal.querySelector('[data-setting-key]');
        if (firstToggle) {
            firstToggle.focus();
        }
    }

    function closeSettingsModal() {
        if (!settingsModal) {
            return;
        }
        settingsModal.classList.remove('is-open');
        settingsModal.setAttribute('aria-hidden', 'true');
        settingsModal.hidden = true;
        if (settingsButton) {
            settingsButton.setAttribute('aria-expanded', 'false');
            settingsButton.focus();
        }
    }

    applySettingsState();

    if (settingsButton && settingsModal) {
        settingsButton.addEventListener('click', openSettingsModal);
        settingsModal.addEventListener('click', function (event) {
            if (event.target.hasAttribute('data-settings-close')) {
                closeSettingsModal();
            }
        });
    }

    settingsInputs.forEach((input) => {
        input.addEventListener('change', function () {
            saveSetting(this.dataset.settingKey, this.checked);
            applySettingsState();
        });
    });

    if (settingsClose) {
        settingsClose.addEventListener('click', closeSettingsModal);
    }

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && settingsModal && !settingsModal.hidden) {
            closeSettingsModal();
        }
    });

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
    const plantingModal = document.getElementById('planting-modal');
    const plantSeedForm = document.getElementById('plant-seed-form');
    const plantSlotIdInput = document.getElementById('plant-slot-id');
    const plantTaskIdInput = document.getElementById('plant-task-id');
    const plantCancelButton = document.getElementById('plant-cancel-btn');
    const confirmSlotNumber = document.getElementById('confirm-slot-number');
    const confirmSeedType = document.getElementById('confirm-seed-type');
    const confirmTaskTitle = document.getElementById('confirm-task-title');
    const confirmWaterCount = document.getElementById('confirm-water-count');
    const seedCards = document.querySelectorAll('.seed-card');
    let selectedSlotId = null;
    let selectedSlotNumber = null;

    const gardenPage = document.querySelector('main.garden-page');
    const focusSessionModal = document.getElementById('focus-session-modal');
    const focusSessionClose = document.getElementById('focus-session-close');
    const focusSessionTitle = document.getElementById('focus-session-title');
    const focusSeedType = document.getElementById('focus-seed-type');
    const focusPlantState = document.getElementById('focus-plant-state');
    const focusDuration = document.getElementById('focus-duration');
    const focusTimer = document.getElementById('focus-timer');
    const focusSessionMessage = document.getElementById('focus-session-message');
    const focusActiveActions = document.getElementById('focus-active-actions');
    const focusStartButton = document.getElementById('focus-start-btn');
    const focusPauseButton = document.getElementById('focus-pause-btn');
    const focusResumeButton = document.getElementById('focus-resume-btn');
    const focusEndButton = document.getElementById('focus-end-btn');
    const wateringProgress = document.getElementById('watering-progress');
    const focusWateringPanel = document.getElementById('focus-watering-panel');
    const focusWateringSteps = document.getElementById('focus-watering-steps');
    const focusResultPanel = document.getElementById('focus-result-panel');
    const focusResultIcon = document.getElementById('focus-result-icon');
    const focusResultLabel = document.getElementById('focus-result-label');
    const focusResultTitle = document.getElementById('focus-result-title');
    const focusResultTask = document.getElementById('focus-result-task');
    const focusResultSteps = document.getElementById('focus-result-steps');
    const focusResultTime = document.getElementById('focus-result-time');
    let selectedFocusPlantId = null;
    let selectedFocusSessionId = null;
    let focusTargetSeconds = 0;
    let focusElapsedSeconds = 0;
    let focusLastSyncMs = Date.now();
    let focusIsRunning = false;
    let focusHasStarted = false;
    let focusIsCompleted = false;
    let focusAllWatered = false;
    let focusTimerInterval = null;
    let focusHeartbeatInterval = null;
    const focusHeartbeatIntervalMs = 10000;

    function clearSelectedSlot() {
        const previous = document.querySelector('.garden-slot-selected');
        if (previous) {
            previous.classList.remove('garden-slot-selected');
        }
    }

    function clearSelectedSeed() {
        seedCards.forEach((card) => card.classList.remove('selected'));
    }

    function hidePlantingModal() {
        if (plantingModal) {
            plantingModal.hidden = true;
            plantingModal.setAttribute('aria-hidden', 'true');
        }
    }

    function resetPlantingConfirmation() {
        clearSelectedSeed();
        hidePlantingModal();
        if (plantSlotIdInput) {
            plantSlotIdInput.value = '';
        }
        if (plantTaskIdInput) {
            plantTaskIdInput.value = '';
        }
    }

    function formatWaterCount(value) {
        const count = Number.parseInt(value || '0', 10);
        const safeCount = Number.isNaN(count) ? 0 : count;
        return safeCount === 1 ? '1 water needed' : `${safeCount} waters needed`;
    }

    function openSeedStorageTray(slotId, slotNumber) {
        if (!seedStorageTray) {
            return;
        }
        selectedSlotId = slotId;
        selectedSlotNumber = slotNumber;
        if (selectedSlotNumberElement) {
            selectedSlotNumberElement.textContent = slotNumber;
        }
        if (seedStorageMessage) {
            seedStorageMessage.textContent = `Choose a seed to plant in Slot ${slotNumber}.`;
        }
        resetPlantingConfirmation();
        seedStorageTray.classList.add('open');
        seedStorageTray.setAttribute('aria-hidden', 'false');
    }

    function closeSeedStorageTray() {
        if (!seedStorageTray) {
            return;
        }
        seedStorageTray.classList.remove('open');
        seedStorageTray.setAttribute('aria-hidden', 'true');
        selectedSlotId = null;
        selectedSlotNumber = null;
        clearSelectedSlot();
        resetPlantingConfirmation();
    }

    function showPlantingConfirmation(card) {
        if (!selectedSlotId || !selectedSlotNumber) {
            if (seedStorageMessage) {
                seedStorageMessage.textContent = 'Choose an empty soil slot before planting a seed.';
            }
            return;
        }

        clearSelectedSeed();
        card.classList.add('selected');

        if (plantingModal) {
            plantingModal.hidden = false;
            plantingModal.setAttribute('aria-hidden', 'false');
        }
        if (plantSlotIdInput) {
            plantSlotIdInput.value = selectedSlotId;
        }
        if (plantTaskIdInput) {
            plantTaskIdInput.value = card.dataset.taskId || '';
        }
        if (confirmSlotNumber) {
            confirmSlotNumber.textContent = selectedSlotNumber;
        }
        if (confirmSeedType) {
            confirmSeedType.textContent = card.dataset.seedType || 'Seed';
        }
        if (confirmTaskTitle) {
            confirmTaskTitle.textContent = card.dataset.taskTitle || 'Selected seed';
        }
        if (confirmWaterCount) {
            confirmWaterCount.textContent = formatWaterCount(card.dataset.waterCount);
        }
        if (seedStorageMessage) {
            seedStorageMessage.textContent = `Choose a seed to plant in Slot ${selectedSlotNumber}.`;
        }
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
            const slotId = this.dataset.slotId;
            const slotNumber = this.dataset.slotNumber || this.dataset.slotNumber;
            openSeedStorageTray(slotId, slotNumber);
        });
    });

    if (seedStorageClose) {
        seedStorageClose.addEventListener('click', closeSeedStorageTray);
    }

    seedCards.forEach((card) => {
        card.addEventListener('click', function () {
            showPlantingConfirmation(this);
        });
    });

    if (plantCancelButton) {
        plantCancelButton.addEventListener('click', () => {
            resetPlantingConfirmation();
            if (seedStorageMessage) {
                seedStorageMessage.textContent = selectedSlotNumber
                    ? `Choose a seed to plant in Slot ${selectedSlotNumber}.`
                    : 'Choose an empty soil slot before planting a seed.';
            }
        });
    }

    if (plantSeedForm) {
        plantSeedForm.addEventListener('submit', (event) => {
            if (
                !plantSlotIdInput ||
                !plantTaskIdInput ||
                !plantSlotIdInput.value ||
                !plantTaskIdInput.value
            ) {
                event.preventDefault();
                if (seedStorageMessage) {
                    seedStorageMessage.textContent = 'Choose an empty soil slot and seed before planting.';
                }
            }
        });
    }

    function postFocusAction(url, data) {
        const csrfToken = getCSRFToken();
        if (!csrfToken) {
            return Promise.resolve({
                success: false,
                message: 'Focus session is unavailable right now. Please refresh and try again.',
            });
        }

        return fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': csrfToken,
            },
            body: new URLSearchParams(data),
        }).then((response) => response.json());
    }

    function sendFocusBeacon(action) {
        if (!selectedFocusSessionId || !focusIsRunning || focusIsCompleted) {
            return;
        }

        const csrfToken = getCSRFToken();
        if (!csrfToken || !navigator.sendBeacon) {
            return;
        }

        const body = new URLSearchParams({
            session_id: selectedFocusSessionId,
            action: action || 'heartbeat',
            client_timestamp: new Date().toISOString(),
            csrfmiddlewaretoken: csrfToken,
        });
        navigator.sendBeacon('/focus/heartbeat/', body);
    }

    function handleHeartbeatPayload(payload) {
        if (!payload || !payload.success || payload.session_id !== selectedFocusSessionId) {
            return;
        }

        focusTargetSeconds = payload.target_duration_seconds || focusTargetSeconds;
        focusElapsedSeconds = payload.elapsed_seconds || 0;
        focusLastSyncMs = Date.now();
        focusIsRunning = Boolean(payload.is_running);
        focusIsCompleted = Boolean(payload.is_completed);
        focusAllWatered = Boolean(payload.all_watered);

        if (!focusIsRunning || focusIsCompleted || payload.message) {
            renderFocusSession(payload);
            return;
        }

        updateFocusButtons();
        updateFocusTimerDisplay();
    }

    function sendFocusHeartbeat() {
        if (!selectedFocusSessionId || !focusIsRunning || focusIsCompleted) {
            return Promise.resolve();
        }

        return postFocusAction('/focus/heartbeat/', {
            session_id: selectedFocusSessionId,
            action: 'heartbeat',
            client_timestamp: new Date().toISOString(),
        }).then(handleHeartbeatPayload).catch(() => {});
    }

    function stopFocusHeartbeatLoop() {
        if (focusHeartbeatInterval) {
            clearInterval(focusHeartbeatInterval);
            focusHeartbeatInterval = null;
        }
    }

    function startFocusHeartbeatLoop() {
        stopFocusHeartbeatLoop();
        if (!selectedFocusSessionId || !focusIsRunning || focusIsCompleted) {
            return;
        }
        focusHeartbeatInterval = setInterval(sendFocusHeartbeat, focusHeartbeatIntervalMs);
    }

    function formatTimer(totalSeconds) {
        const seconds = Math.max(0, Number.parseInt(totalSeconds || 0, 10));
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        const paddedMinutes = String(minutes).padStart(2, '0');
        const paddedSeconds = String(remainingSeconds).padStart(2, '0');
        if (hours > 0) {
            return `${hours}:${paddedMinutes}:${paddedSeconds}`;
        }
        return `${paddedMinutes}:${paddedSeconds}`;
    }

    function getCurrentFocusElapsed() {
        if (!focusIsRunning) {
            return focusElapsedSeconds;
        }
        return focusElapsedSeconds + Math.floor((Date.now() - focusLastSyncMs) / 1000);
    }

    function updateFocusTimerDisplay() {
        if (!focusTimer) {
            return;
        }
        const remaining = Math.max(0, focusTargetSeconds - getCurrentFocusElapsed());
        focusTimer.textContent = formatTimer(remaining);
    }

    function startFocusTimerLoop() {
        if (focusTimerInterval) {
            clearInterval(focusTimerInterval);
        }
        updateFocusTimerDisplay();
        focusTimerInterval = setInterval(updateFocusTimerDisplay, 1000);
    }

    function setFocusMessage(message) {
        if (focusSessionMessage && message) {
            focusSessionMessage.textContent = message;
        }
    }

    function updateFocusButtons() {
        if (focusStartButton) {
            focusStartButton.hidden = focusHasStarted || focusIsCompleted;
            focusStartButton.disabled = focusHasStarted || focusIsCompleted;
        }
        if (focusPauseButton) {
            focusPauseButton.hidden = !focusHasStarted || !focusIsRunning || focusIsCompleted;
            focusPauseButton.disabled = !focusHasStarted || !focusIsRunning || focusIsCompleted;
        }
        if (focusResumeButton) {
            focusResumeButton.hidden = !focusHasStarted || focusIsRunning || focusIsCompleted;
            focusResumeButton.disabled = !focusHasStarted || focusIsRunning || focusIsCompleted;
        }
        if (focusEndButton) {
            focusEndButton.hidden = !focusHasStarted || focusIsCompleted;
            focusEndButton.disabled = !focusHasStarted || focusIsCompleted;
        }
    }

    function isResultState(state) {
        return state === 'flower' || state === 'bud';
    }

    function getPayloadResult(payload) {
        if (payload.result) {
            return payload.result;
        }
        if (payload.is_completed && isResultState(payload.plant_state)) {
            return payload.plant_state;
        }
        if (payload.is_completed) {
            return payload.all_watered ? 'flower' : 'bud';
        }
        return null;
    }

    function setActiveFocusViewVisible(isVisible) {
        if (focusTimer) {
            focusTimer.hidden = !isVisible;
        }
        if (focusSessionMessage) {
            focusSessionMessage.hidden = !isVisible;
        }
        if (focusActiveActions) {
            focusActiveActions.hidden = !isVisible;
        }
        if (focusWateringPanel) {
            focusWateringPanel.hidden = !isVisible;
        }
        if (focusResultPanel) {
            focusResultPanel.hidden = isVisible;
        }
    }

    function formatPlantStateLabel(state) {
        const stateLabels = {
            seed: 'Seed',
            growing: 'Growing',
            flower: 'Flower',
            bud: 'Bud',
        };
        return stateLabels[state] || 'Seed';
    }

    function updatePlantSlotVisual(plantId, state) {
        const slot = document.querySelector(`.focus-slot-clickable[data-plant-id="${plantId}"]`);
        if (!slot || !gardenPage) {
            return;
        }
        let visual = slot.querySelector('.slot-plant-image, .slot-plant-stage');
        const marker = slot.querySelector('.slot-state-badge');
        const soilImage = slot.querySelector('.slot-soil-image');

        if (state === 'seed' || state === 'growing') {
            const isGrowing = state === 'growing';
            let image = visual && visual.classList.contains('slot-plant-image') ? visual : null;
            if (!image) {
                image = document.createElement('img');
                if (visual) {
                    visual.replaceWith(image);
                } else if (soilImage) {
                    soilImage.insertAdjacentElement('afterend', image);
                } else {
                    slot.prepend(image);
                }
            }
            image.className = 'slot-plant-image';
            image.src = isGrowing ? gardenPage.dataset.sproutImage : gardenPage.dataset.seedImage;
            image.alt = isGrowing ? 'Growing sprout' : 'Seed';
        } else if (state === 'flower' || state === 'bud') {
            let stage = visual && visual.classList.contains('slot-plant-stage') ? visual : null;
            if (!stage) {
                stage = document.createElement('div');
                stage.setAttribute('aria-hidden', 'true');
                if (visual) {
                    visual.replaceWith(stage);
                } else if (soilImage) {
                    soilImage.insertAdjacentElement('afterend', stage);
                } else {
                    slot.prepend(stage);
                }
            }
            stage.className = `slot-plant-stage slot-plant-${state}`;
            stage.innerHTML = state === 'flower'
                ? '<span class="slot-flower-bloom"></span>'
                : '<span class="slot-bud-head"></span>';
        }

        if (marker) {
            marker.textContent = formatPlantStateLabel(state);
        }
    }

    function renderFocusResult(payload, result) {
        const isFlower = result === 'flower';
        if (focusResultIcon) {
            focusResultIcon.textContent = isFlower ? '🌸' : '🌱';
        }
        if (focusResultLabel) {
            focusResultLabel.textContent = isFlower ? 'Flower result' : 'Bud result';
        }
        if (focusResultTitle) {
            focusResultTitle.textContent = payload.message || (
                isFlower ? 'Your plant has bloomed!' : 'Your plant became a bud.'
            );
        }
        if (focusResultTask) {
            focusResultTask.textContent = payload.task_title || 'Selected task';
        }
        if (focusResultSteps) {
            focusResultSteps.textContent = `${payload.watered_count || 0} / ${payload.total_subtasks || 0}`;
        }
        if (focusResultTime) {
            focusResultTime.textContent = formatTimer(payload.elapsed_seconds || 0);
        }
    }

    function renderWateringSteps(subtasks) {
        if (!focusWateringSteps) {
            return;
        }
        focusWateringSteps.innerHTML = '';

        if (!subtasks || subtasks.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'watering-empty';
            empty.textContent = 'No watering steps for this task.';
            focusWateringSteps.appendChild(empty);
            return;
        }

        subtasks.forEach((subtask) => {
            const row = document.createElement('div');
            row.className = `focus-watering-row${subtask.is_watered ? ' watered' : ''}`;

            const copy = document.createElement('div');
            copy.className = 'focus-watering-copy';

            const title = document.createElement('strong');
            title.textContent = subtask.title;

            const status = document.createElement('span');
            status.textContent = subtask.is_watered ? 'Watered' : 'Not watered';

            copy.appendChild(title);
            copy.appendChild(status);

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'btn water-step-btn';
            button.dataset.subtaskId = subtask.id;
            button.textContent = subtask.is_watered ? 'Watered' : 'Water Plant';
            button.disabled = !focusHasStarted || subtask.is_watered || focusIsCompleted;

            row.appendChild(copy);
            row.appendChild(button);
            focusWateringSteps.appendChild(row);
        });
    }

    function renderFocusSession(payload) {
        if (!payload || !payload.success) {
            setFocusMessage(payload && payload.message ? payload.message : 'Focus session is unavailable right now.');
            return;
        }

        selectedFocusSessionId = payload.session_id;
        selectedFocusPlantId = payload.plant_id || selectedFocusPlantId;
        focusTargetSeconds = payload.target_duration_seconds || 0;
        focusElapsedSeconds = payload.elapsed_seconds || 0;
        focusLastSyncMs = Date.now();
        focusIsRunning = Boolean(payload.is_running);
        focusHasStarted = Boolean(payload.has_started);
        focusIsCompleted = Boolean(payload.is_completed);
        focusAllWatered = Boolean(payload.all_watered);
        const result = getPayloadResult(payload);
        const showingResult = focusIsCompleted && Boolean(result);
        const displayPlantState = showingResult ? result : payload.plant_state;

        if (focusSessionTitle) {
            focusSessionTitle.textContent = payload.task_title || 'Selected task';
        }
        if (focusSeedType) {
            focusSeedType.textContent = payload.seed_type ? `${payload.seed_type} Seed` : 'Seed';
        }
        if (focusPlantState) {
            focusPlantState.textContent = formatPlantStateLabel(displayPlantState);
        }
        if (focusDuration) {
            focusDuration.textContent = payload.target_duration_minutes || 0;
        }
        if (wateringProgress) {
            wateringProgress.textContent = `${payload.watered_count || 0} / ${payload.total_subtasks || 0} watered`;
        }

        renderWateringSteps(payload.subtasks || []);
        updatePlantSlotVisual(selectedFocusPlantId, displayPlantState);
        setActiveFocusViewVisible(!showingResult);
        if (showingResult) {
            renderFocusResult(payload, result);
        }
        updateFocusButtons();

        if (showingResult) {
            if (focusTimerInterval) {
                clearInterval(focusTimerInterval);
                focusTimerInterval = null;
            }
            updateFocusTimerDisplay();
        } else {
            startFocusTimerLoop();
        }

        if (focusIsRunning && !focusIsCompleted && !showingResult) {
            startFocusHeartbeatLoop();
        } else {
            stopFocusHeartbeatLoop();
        }

        if (payload.message) {
            setFocusMessage(payload.message);
        } else if (focusIsCompleted) {
            setFocusMessage('Session complete. Your result is saved in the garden.');
        } else if (!focusHasStarted) {
            setFocusMessage('Start the session to begin watering your steps.');
        } else if (focusIsRunning) {
            setFocusMessage('Timer is running. Water each step when you finish it.');
        } else {
            setFocusMessage('Session is paused. You can resume when ready.');
        }
    }

    function openFocusModal(plantId) {
        selectedFocusPlantId = plantId;
        if (focusSessionModal) {
            focusSessionModal.hidden = false;
            focusSessionModal.setAttribute('aria-hidden', 'false');
        }
        setFocusMessage('Loading focus session...');
        postFocusAction('/focus/status/', { plant_id: plantId }).then(renderFocusSession);
    }

    function closeFocusModal() {
        if (focusSessionModal) {
            focusSessionModal.hidden = true;
            focusSessionModal.setAttribute('aria-hidden', 'true');
        }
    }

    const focusSlots = document.querySelectorAll('.focus-slot-clickable');
    focusSlots.forEach((slot) => {
        slot.addEventListener('click', function () {
            const plantId = this.dataset.plantId;
            if (plantId) {
                openFocusModal(plantId);
            }
        });
    });

    if (focusSessionClose) {
        focusSessionClose.addEventListener('click', closeFocusModal);
    }

    if (focusStartButton) {
        focusStartButton.addEventListener('click', () => {
            if (!selectedFocusPlantId) {
                return;
            }
            setFocusMessage('Starting focus session...');
            postFocusAction('/focus/start/', { plant_id: selectedFocusPlantId }).then(renderFocusSession);
        });
    }

    if (focusPauseButton) {
        focusPauseButton.addEventListener('click', () => {
            if (!selectedFocusSessionId) {
                return;
            }
            setFocusMessage('Pausing focus session...');
            postFocusAction('/focus/pause/', { session_id: selectedFocusSessionId }).then(renderFocusSession);
        });
    }

    if (focusResumeButton) {
        focusResumeButton.addEventListener('click', () => {
            if (!selectedFocusSessionId) {
                return;
            }
            setFocusMessage('Resuming focus session...');
            postFocusAction('/focus/resume/', { session_id: selectedFocusSessionId }).then(renderFocusSession);
        });
    }

    if (focusEndButton) {
        focusEndButton.addEventListener('click', () => {
            if (!selectedFocusSessionId || focusIsCompleted) {
                return;
            }
            setFocusMessage('Ending focus session...');
            postFocusAction('/focus/end/', { session_id: selectedFocusSessionId }).then(renderFocusSession);
        });
    }

    if (focusWateringSteps) {
        focusWateringSteps.addEventListener('click', (event) => {
            const button = event.target.closest('.water-step-btn');
            if (!button || button.disabled) {
                return;
            }
            setFocusMessage('Watering step...');
            postFocusAction('/focus/water/', { subtask_id: button.dataset.subtaskId }).then(renderFocusSession);
        });
    }

    document.addEventListener('visibilitychange', () => {
        if (!selectedFocusSessionId || focusIsCompleted) {
            return;
        }

        if (document.visibilityState === 'hidden') {
            sendFocusBeacon('heartbeat');
            return;
        }

        postFocusAction('/focus/status/', { session_id: selectedFocusSessionId }).then(renderFocusSession);
    });

    window.addEventListener('beforeunload', () => {
        sendFocusBeacon('pause');
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
