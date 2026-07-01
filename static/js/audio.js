(function () {
    'use strict';

    const settingsPrefix = 'sproutime.settings.';
    const musicKey = `${settingsPrefix}backgroundMusic`;
    const sfxKey = `${settingsPrefix}soundEffects`;
    const musicVolume = 0.25;
    const sfxVolume = 0.45;
    const audioPaths = {
        music: '/static/audio/bg_music.mp3',
        button: '/static/audio/blup_1.wav',
        open: '/static/audio/punch_2.wav',
        water: '/static/audio/squick_2.wav',
    };

    let hasUserInteracted = false;
    let musicEnabled = readBoolean(musicKey, false);
    let sfxEnabled = readBoolean(sfxKey, true);

    const bgMusic = createAudio(audioPaths.music, true, musicVolume);
    const sfx = {
        button: createAudio(audioPaths.button, false, sfxVolume),
        open: createAudio(audioPaths.open, false, sfxVolume),
        water: createAudio(audioPaths.water, false, sfxVolume),
    };

    function createAudio(src, loop, volume) {
        if (typeof Audio === 'undefined') {
            return null;
        }

        const audio = new Audio(src);
        audio.preload = 'auto';
        audio.loop = Boolean(loop);
        audio.volume = volume;
        return audio;
    }

    function readBoolean(key, fallback) {
        try {
            const stored = window.localStorage.getItem(key);
            if (stored === null) {
                return fallback;
            }
            return stored === 'true';
        } catch (error) {
            return fallback;
        }
    }

    function saveBoolean(key, value) {
        try {
            window.localStorage.setItem(key, String(Boolean(value)));
        } catch (error) {
            // Audio preferences should never block the app.
        }
    }

    function syncSettingToggle(key, enabled) {
        const input = document.querySelector(`[data-setting-key="${key}"]`);
        if (input) {
            input.checked = Boolean(enabled);
        }
    }

    function playAudio(audio) {
        if (!audio) {
            return;
        }

        try {
            const playRequest = audio.play();
            if (playRequest && typeof playRequest.catch === 'function') {
                playRequest.catch(() => {});
            }
        } catch (error) {
            // Missing or blocked files fail silently.
        }
    }

    function tryPlayMusic() {
        if (!bgMusic || !musicEnabled || !hasUserInteracted) {
            return;
        }

        bgMusic.volume = musicVolume;
        bgMusic.loop = true;
        playAudio(bgMusic);
    }

    function playMusic() {
        musicEnabled = true;
        saveBoolean(musicKey, true);
        syncSettingToggle('backgroundMusic', true);
        tryPlayMusic();
    }

    function pauseMusic() {
        musicEnabled = false;
        saveBoolean(musicKey, false);
        syncSettingToggle('backgroundMusic', false);
        if (bgMusic) {
            bgMusic.pause();
        }
    }

    function setMusicEnabled(enabled) {
        if (enabled) {
            playMusic();
            return;
        }
        pauseMusic();
    }

    function setSfxEnabled(enabled) {
        sfxEnabled = Boolean(enabled);
        saveBoolean(sfxKey, sfxEnabled);
        syncSettingToggle('soundEffects', sfxEnabled);
    }

    function playSfx(name) {
        if (!sfxEnabled || !sfx[name]) {
            return;
        }

        try {
            const sound = sfx[name].cloneNode();
            sound.volume = sfxVolume;
            playAudio(sound);
        } catch (error) {
            // Missing or blocked files fail silently.
        }
    }

    function markUserInteraction() {
        if (hasUserInteracted) {
            return;
        }

        hasUserInteracted = true;
        tryPlayMusic();
    }

    function isDisabledElement(element) {
        const control = element.closest('button, input, select, textarea, fieldset, [aria-disabled="true"], .disabled');
        if (!control) {
            return false;
        }

        return Boolean(
            control.disabled ||
            control.getAttribute('aria-disabled') === 'true' ||
            control.classList.contains('disabled')
        );
    }

    function hasMeaningfulHref(anchor) {
        if (!anchor) {
            return false;
        }

        const href = anchor.getAttribute('href');
        return Boolean(href && href !== '#' && !href.startsWith('#') && !anchor.hasAttribute('download'));
    }

    function getExplicitSfx(target) {
        const explicit = target.closest('[data-audio-sfx]');
        if (!explicit) {
            return null;
        }

        const name = explicit.dataset.audioSfx;
        return sfx[name] ? name : null;
    }

    function getClickSfxName(event) {
        const target = event.target;
        if (!(target instanceof Element) || isDisabledElement(target)) {
            return null;
        }

        const explicit = getExplicitSfx(target);
        if (explicit) {
            return explicit;
        }

        const waterAction = target.closest('.water-step-btn');
        if (waterAction) {
            return 'water';
        }

        const openAction = target.closest([
            '#game-settings-button',
            '[data-bs-toggle="modal"]',
            '[data-bs-target]',
            '.garden-slot-clickable',
            '.focus-slot-clickable',
            '#seed-storage-toggle',
            '.seed-card',
            '.dashboard-action[href]',
            '.continue-focus-link[href]',
            '.profile-btn[href]',
            '.auth-tab[href]',
            '.garden-action-card[href]',
            '.game-nav-item[href]',
            '.game-nav-link[href]',
            '.side-nav-link[href]',
        ].join(','));
        if (openAction) {
            return 'open';
        }

        const buttonAction = target.closest([
            'button',
            '.btn',
            '[role="button"]',
            '.dashboard-action',
            '.profile-btn',
            '.auth-tab',
            '.game-nav-link',
            '.side-nav-link',
            'a.btn',
        ].join(','));
        if (buttonAction) {
            return 'button';
        }

        const linkedButton = target.closest('a[href]');
        if (hasMeaningfulHref(linkedButton) && linkedButton.matches('.btn, [role="button"]')) {
            return 'button';
        }

        return null;
    }

    function handleDocumentClick(event) {
        if (event.defaultPrevented) {
            return;
        }

        const name = getClickSfxName(event);
        if (name) {
            playSfx(name);
        }
    }

    function handleSettingChange(event) {
        const input = event.target;
        if (!(input instanceof HTMLInputElement) || !input.dataset.settingKey) {
            return;
        }

        if (input.dataset.settingKey === 'backgroundMusic') {
            setMusicEnabled(input.checked);
        }

        if (input.dataset.settingKey === 'soundEffects') {
            setSfxEnabled(input.checked);
        }
    }

    function syncInitialSettings() {
        const musicInput = document.querySelector('[data-setting-key="backgroundMusic"]');
        const sfxInput = document.querySelector('[data-setting-key="soundEffects"]');

        musicEnabled = readBoolean(musicKey, musicInput ? musicInput.checked : false);
        sfxEnabled = readBoolean(sfxKey, sfxInput ? sfxInput.checked : true);

        syncSettingToggle('backgroundMusic', musicEnabled);
        syncSettingToggle('soundEffects', sfxEnabled);

        if (!musicEnabled && bgMusic) {
            bgMusic.pause();
        }
    }

    function bindAudioEvents() {
        syncInitialSettings();

        document.addEventListener('pointerdown', markUserInteraction, { once: true, capture: true });
        document.addEventListener('keydown', markUserInteraction, { once: true, capture: true });
        document.addEventListener('touchstart', markUserInteraction, { once: true, capture: true });
        document.addEventListener('click', handleDocumentClick);
        document.addEventListener('change', handleSettingChange);
    }

    window.SproutimeAudio = {
        playMusic,
        pauseMusic,
        setMusicEnabled,
        setSfxEnabled,
        playSfx,
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindAudioEvents);
    } else {
        bindAudioEvents();
    }
})();
