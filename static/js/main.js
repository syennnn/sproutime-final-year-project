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
        stepGroup.className = 'watering-step-row';
        const textarea = document.createElement('textarea');
        textarea.name = 'subtasks[]';
        textarea.className = 'watering-step-input form-control';
        textarea.placeholder = 'Watering step description';
        textarea.value = value;
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn btn-sm remove-step-btn';
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
    const seedStorageToggle = document.getElementById('seed-storage-toggle');
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
    const focusPreviewImage = document.getElementById('focus-preview-image');
    const focusSleepBubble = document.getElementById('focus-sleep-bubble');
    const focusTimerPanel = document.getElementById('focus-timer-panel');
    const focusResultImage = document.getElementById('focus-result-image');
    const focusResultSubtitle = document.getElementById('focus-result-subtitle');
    const focusResultSeedType = document.getElementById('focus-result-seed-type');
    const focusResultState = document.getElementById('focus-result-state');
    const focusResultNote = document.getElementById('focus-result-note');
    const focusResultDeleteButton = document.getElementById('focus-result-delete-btn');
    const focusResultCompleted = document.getElementById('focus-result-completed') || document.getElementById('result-detail-focus-completed');
    const clearPlantModal = document.getElementById('clear-plant-modal');
    const clearPlantConfirmButton = document.getElementById('clear-plant-confirm-btn');
    const gardenFlowerCount = document.getElementById('garden-flower-count');
    const gardenBudCount = document.getElementById('garden-bud-count');
    let pendingClearPlantAction = null;
    let clearPlantReturnFocusTarget = null;
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
        resetPlantingConfirmation();
        selectedSlotId = slotId || null;
        selectedSlotNumber = slotNumber || null;

        if (selectedSlotId && selectedSlotNumber) {
            if (selectedSlotNumberElement) {
                selectedSlotNumberElement.textContent = selectedSlotNumber;
            }
            if (seedStorageMessage) {
                seedStorageMessage.textContent = `Choose a seed to plant in Slot ${selectedSlotNumber}.`;
            }
        } else {
            clearSelectedSlot();
            if (selectedSlotNumberElement) {
                selectedSlotNumberElement.textContent = '';
            }
            if (seedStorageMessage) {
                seedStorageMessage.textContent = 'Choose an empty garden slot first.';
            }
        }

        seedStorageTray.classList.add('open');
        seedStorageTray.setAttribute('aria-hidden', 'false');
        if (seedStorageToggle) {
            seedStorageToggle.setAttribute('aria-expanded', 'true');
        }
    }

    function closeSeedStorageTray() {
        if (!seedStorageTray) {
            return;
        }
        seedStorageTray.classList.remove('open');
        seedStorageTray.setAttribute('aria-hidden', 'true');
        if (seedStorageToggle) {
            seedStorageToggle.setAttribute('aria-expanded', 'false');
        }
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

    function handleGardenSlotButtonClick() {
        const occupied = this.dataset.occupied === 'true';
        if (occupied) {
            return;
        }

        clearSelectedSlot();
        this.classList.add('garden-slot-selected');
        const slotId = this.dataset.slotId;
        const slotNumber = this.dataset.slotNumber;
        openSeedStorageTray(slotId, slotNumber);
    }

    function bindGardenSlotClick(slot) {
        if (!slot || slot.dataset.gardenClickBound === 'true') {
            return;
        }
        slot.dataset.gardenClickBound = 'true';
        slot.addEventListener('click', handleGardenSlotButtonClick);
    }

    const gardenSlots = document.querySelectorAll('.garden-slot-clickable');
    gardenSlots.forEach(bindGardenSlotClick);

    if (seedStorageClose) {
        seedStorageClose.addEventListener('click', closeSeedStorageTray);
    }

    if (seedStorageToggle) {
        seedStorageToggle.addEventListener('click', () => {
            openSeedStorageTray();
        });
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

    function stopFocusTimerLoop() {
        if (focusTimerInterval) {
            clearInterval(focusTimerInterval);
            focusTimerInterval = null;
        }
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

    function updateTimerStateUI(isPaused) {
        const canToggleTimer = focusHasStarted && !focusIsCompleted;

        if (focusPauseButton) {
            const showPause = canToggleTimer && !isPaused;
            focusPauseButton.hidden = !showPause;
            focusPauseButton.disabled = !showPause;
            focusPauseButton.style.display = showPause ? 'flex' : 'none';
        }

        if (focusResumeButton) {
            const showResume = canToggleTimer && isPaused;
            focusResumeButton.hidden = !showResume;
            focusResumeButton.disabled = !showResume;
            focusResumeButton.style.display = showResume ? 'flex' : 'none';
        }

        if (focusSessionModal) {
            focusSessionModal.classList.toggle('is-running', canToggleTimer && !isPaused);
            focusSessionModal.classList.toggle('is-paused', canToggleTimer && isPaused);
        }

        if (focusTimerPanel) {
            focusTimerPanel.classList.toggle('timer-running', canToggleTimer && !isPaused);
            focusTimerPanel.classList.toggle('timer-paused', canToggleTimer && isPaused);
        }

        if (focusSleepBubble) {
            focusSleepBubble.hidden = !(canToggleTimer && isPaused);
        }

        if (canToggleTimer) {
            setFocusMessage(
                isPaused
                    ? 'Session is paused. You can resume when ready.'
                    : 'Timer is running. Water each step when you finish it.'
            );
        }
    }

    function syncFocusTimerPayload(payload) {
        if (!payload || !payload.success || payload.is_completed) {
            return false;
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

        updateFocusModalState(payload, payload.plant_state, false);
        updateFocusTimerDisplay();
        updateFocusButtons();
        updateTimerStateUI(!focusIsRunning);

        if (focusIsRunning) {
            startFocusTimerLoop();
            startFocusHeartbeatLoop();
        } else {
            stopFocusTimerLoop();
            stopFocusHeartbeatLoop();
        }

        return true;
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

    function getResultImageUrl(slot, state, payload) {
        if (state === 'flower') {
            return (payload && payload.flower_image_url) || slot.dataset.flowerImageUrl || '';
        }
        if (state === 'bud') {
            return (payload && payload.bud_image_url) || slot.dataset.budImageUrl || '';
        }
        return '';
    }

    function getSeedTypeLabel(payload) {
        if (payload && payload.seed_type_display) {
            return payload.seed_type_display;
        }
        if (payload && payload.seed_type) {
            return payload.seed_type.replace(/_/g, ' ');
        }
        return 'Plant';
    }

    function getFocusPreviewImageUrl(state, payload) {
        if (state === 'flower') {
            return (payload && payload.flower_image_url) || '';
        }
        if (state === 'bud') {
            return (payload && payload.bud_image_url) || '';
        }
        if (state === 'growing') {
            return gardenPage ? gardenPage.dataset.sproutImage : '';
        }
        return gardenPage ? gardenPage.dataset.seedImage : '';
    }

    function updateFocusModalState(payload, displayPlantState, showingResult) {
        if (!focusSessionModal) {
            return;
        }

        focusSessionModal.classList.toggle('is-not-started', !focusHasStarted && !showingResult);
        focusSessionModal.classList.toggle('is-running', focusIsRunning && !showingResult);
        focusSessionModal.classList.toggle('is-paused', focusHasStarted && !focusIsRunning && !focusIsCompleted && !showingResult);
        focusSessionModal.classList.toggle('is-result', Boolean(showingResult));
        focusSessionModal.classList.toggle('is-flower-result', showingResult && displayPlantState === 'flower');
        focusSessionModal.classList.toggle('is-bud-result', showingResult && displayPlantState === 'bud');

        const previewUrl = getFocusPreviewImageUrl(displayPlantState, payload);
        if (focusPreviewImage && previewUrl) {
            focusPreviewImage.src = previewUrl;
            focusPreviewImage.alt = `${getSeedTypeLabel(payload)} ${formatPlantStateLabel(displayPlantState)}`;
        }
        if (focusSleepBubble) {
            focusSleepBubble.hidden = !(focusHasStarted && !focusIsRunning && !showingResult);
        }
        if (focusTimerPanel) {
            focusTimerPanel.classList.toggle('timer-running', focusIsRunning && !showingResult);
            focusTimerPanel.classList.toggle('timer-paused', focusHasStarted && !focusIsRunning && !focusIsCompleted && !showingResult);
        }
    }

    function updatePlantSlotVisual(plantId, state, payload) {
        const slot = document.querySelector(`.focus-slot-clickable[data-plant-id="${plantId}"]`);
        if (!slot || !gardenPage) {
            return;
        }
        let visual = slot.querySelector('.slot-plant-image');
        let marker = slot.querySelector('.slot-growing-label');
        const soilImage = slot.querySelector('.slot-soil-image');

        if (payload) {
            if (payload.bud_image_url) {
                slot.dataset.budImageUrl = payload.bud_image_url;
            }
            if (payload.flower_image_url) {
                slot.dataset.flowerImageUrl = payload.flower_image_url;
            }
            if (payload.seed_type) {
                slot.dataset.seedType = payload.seed_type;
            }
        }

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
            image.className = `slot-plant-image slot-plant-${isGrowing ? 'growing' : 'seed'}-img pixel-art`;
            image.src = isGrowing ? gardenPage.dataset.sproutImage : gardenPage.dataset.seedImage;
            image.alt = isGrowing ? 'Growing sprout' : 'Seed';
        } else if (state === 'flower' || state === 'bud') {
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
            image.className = `slot-plant-image slot-plant-${state}-img pixel-art`;
            image.src = getResultImageUrl(slot, state, payload);
            image.alt = `${getSeedTypeLabel(payload)} ${state}`;
        }

        if (state === 'growing') {
            if (!marker) {
                marker = document.createElement('span');
                marker.className = 'slot-growing-label';
                slot.appendChild(marker);
            }
            marker.textContent = formatPlantStateLabel(state);
        } else if (marker) {
            marker.remove();
        }
    }

    function updateGardenResultCounts(payload) {
        if (gardenFlowerCount && typeof payload.flowers_count !== 'undefined') {
            gardenFlowerCount.textContent = payload.flowers_count;
        }
        if (gardenBudCount && typeof payload.buds_count !== 'undefined') {
            gardenBudCount.textContent = payload.buds_count;
        }
    }

    function clearGardenSlotVisual(plantId) {
        const slot = document.querySelector(`.garden-slot[data-plant-id="${plantId}"]`);
        if (!slot) {
            return;
        }

        slot.querySelectorAll('.slot-plant-image, .slot-growing-label').forEach((element) => {
            element.remove();
        });
        slot.classList.remove('has-plant', 'planted-slot', 'focus-slot-clickable', 'occupied-slot', 'garden-slot-selected');
        slot.classList.add('empty-slot', 'garden-slot-clickable');
        slot.dataset.occupied = 'false';
        delete slot.dataset.plantId;
        delete slot.dataset.seedType;
        delete slot.dataset.budImageUrl;
        delete slot.dataset.flowerImageUrl;
        slot.removeAttribute('data-plant-id');
        slot.removeAttribute('data-seed-type');
        slot.removeAttribute('data-bud-image-url');
        slot.removeAttribute('data-flower-image-url');
        slot.disabled = false;
        slot.setAttribute('aria-label', `Empty soil slot ${slot.dataset.slotNumber || ''}`.trim());
        bindGardenSlotClick(slot);
    }

    function setFocusResultDeleteState(isDeleted) {
        if (!focusResultDeleteButton) {
            return;
        }

        focusResultDeleteButton.disabled = Boolean(isDeleted);
        focusResultDeleteButton.textContent = isDeleted ? 'Deleted from Garden' : 'Delete from Garden';
        focusResultDeleteButton.classList.toggle('is-deleted', Boolean(isDeleted));
    }

    function closeClearPlantModal(restoreFocus = true) {
        if (!clearPlantModal) {
            return;
        }

        clearPlantModal.hidden = true;
        clearPlantModal.setAttribute('aria-hidden', 'true');
        pendingClearPlantAction = null;

        if (restoreFocus && clearPlantReturnFocusTarget && typeof clearPlantReturnFocusTarget.focus === 'function') {
            clearPlantReturnFocusTarget.focus();
        }
        clearPlantReturnFocusTarget = null;
    }

    function openClearPlantModal(onConfirm, returnFocusTarget) {
        if (!clearPlantModal) {
            if (typeof onConfirm === 'function') {
                onConfirm();
            }
            return;
        }

        pendingClearPlantAction = typeof onConfirm === 'function' ? onConfirm : null;
        clearPlantReturnFocusTarget = returnFocusTarget || null;
        clearPlantModal.hidden = false;
        clearPlantModal.setAttribute('aria-hidden', 'false');

        if (clearPlantConfirmButton) {
            clearPlantConfirmButton.focus();
        }
    }

    function runClearPlantAction(plantId, triggerButton) {
        if (!plantId) {
            return;
        }

        if (triggerButton) {
            triggerButton.disabled = true;
            triggerButton.textContent = 'Deleting...';
        }

        postFocusAction('/garden/clear-slot/', {
            plant_id: plantId,
        }).then((payload) => {
            if (!payload || !payload.success) {
                if (triggerButton === focusResultDeleteButton) {
                    setFocusResultDeleteState(false);
                } else if (triggerButton) {
                    triggerButton.disabled = false;
                    triggerButton.textContent = 'Delete from Garden';
                }
                if (focusResultNote) {
                    focusResultNote.textContent = payload && payload.message
                        ? payload.message
                        : 'The garden slot could not be cleared. Please refresh and try again.';
                }
                return;
            }

            clearGardenSlotVisual(payload.plant_id || plantId);
            updateGardenResultCounts(payload);
            if (triggerButton === focusResultDeleteButton) {
                setFocusResultDeleteState(true);
            } else if (triggerButton) {
                triggerButton.disabled = true;
                triggerButton.textContent = 'Deleted from Garden';
                triggerButton.classList.add('is-deleted');
            }
            if (focusResultNote) {
                focusResultNote.textContent = payload.message || 'Deleted from the garden slot. The result is still saved on your dashboard.';
            }
        }).catch(() => {
            if (triggerButton === focusResultDeleteButton) {
                setFocusResultDeleteState(false);
            } else if (triggerButton) {
                triggerButton.disabled = false;
                triggerButton.textContent = 'Delete from Garden';
            }
            if (focusResultNote) {
                focusResultNote.textContent = 'The garden slot could not be cleared. Please refresh and try again.';
            }
        });
    }

    function renderFocusResult(payload, result) {
        const isFlower = result === 'flower';
        const seedTypeLabel = payload.seed_type_display || payload.seed_type || 'Seed';
        const resultImageUrl = isFlower ? payload.flower_image_url : payload.bud_image_url;

        if (focusResultIcon) {
            focusResultIcon.textContent = isFlower ? '🌸' : '🌱';
        }
        if (focusResultLabel) {
            focusResultLabel.textContent = isFlower ? 'Flower Result' : 'Bud Result';
        }
        if (focusResultTitle) {
            focusResultTitle.textContent = payload.message || (
                isFlower ? 'Your plant has bloomed!' : 'Your plant became a bud.'
            );
        }
        if (focusResultSubtitle) {
            focusResultSubtitle.textContent = isFlower
                ? 'Great focus work — your seed grew into a flower.'
                : 'You still made progress. This bud shows the effort you started.';
        }
        if (focusResultImage && resultImageUrl) {
            focusResultImage.src = resultImageUrl;
            focusResultImage.alt = `${seedTypeLabel} ${isFlower ? 'flower' : 'bud'}`;
        }
        if (focusResultTask) {
            focusResultTask.textContent = payload.task_title || 'Selected task';
        }
        if (focusResultSeedType) {
            focusResultSeedType.textContent = seedTypeLabel;
        }
        if (focusResultState) {
            focusResultState.textContent = isFlower ? 'Flower' : 'Bud';
        }
        if (focusResultSteps) {
            focusResultSteps.textContent = `${payload.watered_count || 0} / ${payload.total_subtasks || 0}`;
        }
        if (focusResultCompleted) {
            focusResultCompleted.textContent = payload.is_completed ? 'Yes' : 'No';
        }
        if (focusResultTime) {
            focusResultTime.textContent = formatTimer(payload.elapsed_seconds || 0);
        }
        if (focusResultNote) {
            focusResultNote.textContent = isFlower
                ? 'You completed your focus time and watering steps. This flower will stay in your garden as proof of your progress.'
                : 'This bud represents partial progress, not failure. You can grow more flowers in your next focus session.';
        }
        setFocusResultDeleteState(false);
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

        subtasks.forEach((subtask, index) => {
            const row = document.createElement('div');
            row.className = `focus-watering-row${subtask.is_watered ? ' watered' : ''}`;

            const number = document.createElement('span');
            number.className = 'focus-watering-number';
            number.textContent = String(index + 1);

            const copy = document.createElement('div');
            copy.className = 'focus-watering-copy';

            const title = document.createElement('strong');
            title.textContent = subtask.title;

            const status = document.createElement('span');
            status.textContent = subtask.is_watered ? '💧 Watered' : 'Not watered';

            copy.appendChild(title);
            copy.appendChild(status);

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'btn water-step-btn';
            button.dataset.subtaskId = subtask.id;
            button.textContent = subtask.is_watered ? 'Done' : 'Water Plant';
            button.disabled = !focusHasStarted || subtask.is_watered || focusIsCompleted;

            row.appendChild(number);
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
        updateFocusModalState(payload, displayPlantState, showingResult);

        if (focusSessionTitle) {
            focusSessionTitle.textContent = payload.task_title || 'Selected task';
        }
        if (focusSeedType) {
            const seedTypeLabel = payload.seed_type_display || payload.seed_type;
            focusSeedType.textContent = seedTypeLabel ? `${seedTypeLabel} Seed` : 'Seed';
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
        updatePlantSlotVisual(selectedFocusPlantId, displayPlantState, payload);
        setActiveFocusViewVisible(!showingResult);
        if (showingResult) {
            renderFocusResult(payload, result);
        }
        updateFocusButtons();
        if (!showingResult) {
            updateTimerStateUI(focusHasStarted && !focusIsRunning && !focusIsCompleted);
        }

        if (showingResult) {
            stopFocusTimerLoop();
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
            focusSessionModal.classList.remove('is-not-started', 'is-running', 'is-paused', 'is-result', 'is-flower-result', 'is-bud-result');
        }
    }

    if (focusSessionModal) {
        focusSessionModal.addEventListener('click', (event) => {
            if (event.target.closest('[data-focus-result-close]')) {
                closeFocusModal();
            }
        });
    }

    if (gardenPage) {
        gardenPage.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof Element)) {
                return;
            }

            const triggerButton = target.closest('.focus-result-delete-btn, [data-clear-plant-trigger]');
            if (!triggerButton || !gardenPage.contains(triggerButton)) {
                return;
            }

            event.preventDefault();
            if (triggerButton.disabled) {
                return;
            }

            const plantId = triggerButton.dataset.plantId || selectedFocusPlantId;
            if (!plantId) {
                return;
            }

            openClearPlantModal(() => runClearPlantAction(plantId, triggerButton), triggerButton);
        });
    }

    if (clearPlantModal) {
        clearPlantModal.addEventListener('click', (event) => {
            const target = event.target;
            if (target instanceof Element && target.closest('[data-clear-plant-cancel]')) {
                closeClearPlantModal();
            }
        });
    }

    if (clearPlantConfirmButton) {
        clearPlantConfirmButton.addEventListener('click', () => {
            const action = pendingClearPlantAction;
            closeClearPlantModal(false);
            if (typeof action === 'function') {
                action();
            }
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && clearPlantModal && !clearPlantModal.hidden) {
            closeClearPlantModal();
        }
    });

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
            postFocusAction('/focus/pause/', { session_id: selectedFocusSessionId }).then((payload) => {
                if (!syncFocusTimerPayload(payload)) {
                    renderFocusSession(payload);
                }
            });
        });
    }

    if (focusResumeButton) {
        focusResumeButton.addEventListener('click', () => {
            if (!selectedFocusSessionId) {
                return;
            }
            setFocusMessage('Resuming focus session...');
            postFocusAction('/focus/resume/', { session_id: selectedFocusSessionId }).then((payload) => {
                if (!syncFocusTimerPayload(payload)) {
                    renderFocusSession(payload);
                }
            });
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
