document.addEventListener('DOMContentLoaded', () => {
    const trigger = document.getElementById('profile-avatar-trigger');
    const actionsModal = document.getElementById('profile-image-actions-modal');
    const editModal = document.getElementById('profile-image-edit-modal');
    const deleteModal = document.getElementById('profile-image-delete-modal');
    const editOpenBtn = document.getElementById('profile-image-edit-open');
    const deleteOpenBtn = document.getElementById('profile-image-delete-open');
    const actionsCancelBtn = document.getElementById('profile-image-actions-cancel');
    const editCancelBtn = document.getElementById('profile-image-edit-cancel');
    const deleteCancelBtn = document.getElementById('profile-image-delete-cancel');
    const chooseBtn = document.getElementById('profile-image-choose-btn');
    const fileInput = document.getElementById('profile-image-input');
    const fileName = document.getElementById('profile-image-file-name');
    const saveBtn = document.getElementById('profile-image-save-btn');
    const errorBox = document.getElementById('profile-image-error');
    const deleteConfirmBtn = document.getElementById('profile-image-delete-confirm');
    const avatarImage = document.getElementById('profile-avatar-image');
    const avatarFallback = document.getElementById('profile-avatar-fallback');
    const avatarPreview = document.getElementById('profile-image-edit-preview');
    const csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]')?.value;

    let activeObjectUrl = null;
    let lastFocusedElement = null;

    function closeModal(modal) {
        if (modal) {
            modal.hidden = true;
        }
    }

    function openModal(modal) {
        if (!modal) {
            return;
        }
        lastFocusedElement = document.activeElement;
        modal.hidden = false;
        const focusTarget = modal.querySelector('button, input, [href]');
        if (focusTarget) {
            focusTarget.focus();
        }
    }

    function closeAllModals() {
        closeModal(actionsModal);
        closeModal(editModal);
        closeModal(deleteModal);
        if (activeObjectUrl) {
            URL.revokeObjectURL(activeObjectUrl);
            activeObjectUrl = null;
        }
        errorBox.textContent = '';
        fileName.textContent = 'No file chosen';
        if (fileInput) {
            fileInput.value = '';
        }
        if (saveBtn) {
            saveBtn.disabled = true;
        }
        if (lastFocusedElement) {
            lastFocusedElement.focus();
        }
    }

    function showError(message) {
        if (errorBox) {
            errorBox.textContent = message;
        }
    }

    function setBusy(isBusy) {
        if (saveBtn) {
            saveBtn.disabled = isBusy;
        }
        if (chooseBtn) {
            chooseBtn.disabled = isBusy;
        }
        if (deleteConfirmBtn) {
            deleteConfirmBtn.disabled = isBusy;
        }
    }

    trigger?.addEventListener('click', () => {
        openModal(actionsModal);
    });

    actionsCancelBtn?.addEventListener('click', closeAllModals);
    editCancelBtn?.addEventListener('click', () => {
        closeModal(editModal);
        if (activeObjectUrl) {
            URL.revokeObjectURL(activeObjectUrl);
            activeObjectUrl = null;
        }
        errorBox.textContent = '';
        fileName.textContent = 'No file chosen';
        if (fileInput) {
            fileInput.value = '';
        }
        if (saveBtn) {
            saveBtn.disabled = true;
        }
    });
    deleteCancelBtn?.addEventListener('click', () => closeModal(deleteModal));

    editOpenBtn?.addEventListener('click', () => {
        closeModal(actionsModal);
        openModal(editModal);
    });

    deleteOpenBtn?.addEventListener('click', () => {
        closeModal(actionsModal);
        openModal(deleteModal);
    });

    chooseBtn?.addEventListener('click', () => fileInput?.click());

    fileInput?.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        if (!file) {
            return;
        }

        const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const extension = file.name.split('.').pop()?.toLowerCase();
        const isAllowedExtension = ['jpg', 'jpeg', 'png', 'webp'].includes(extension || '');
        if (!isAllowedExtension || !acceptedTypes.includes(file.type)) {
            showError('Please upload a JPG, PNG, or WEBP image.');
            fileInput.value = '';
            fileName.textContent = 'No file chosen';
            saveBtn.disabled = true;
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showError('Profile image must be smaller than 5 MB.');
            fileInput.value = '';
            fileName.textContent = 'No file chosen';
            saveBtn.disabled = true;
            return;
        }

        showError('');
        fileName.textContent = file.name;
        saveBtn.disabled = false;

        if (activeObjectUrl) {
            URL.revokeObjectURL(activeObjectUrl);
        }
        activeObjectUrl = URL.createObjectURL(file);
        if (avatarPreview) {
            avatarPreview.innerHTML = `<img class="profile-image-preview" src="${activeObjectUrl}" alt="Selected profile image preview">`;
        }
    });

    saveBtn?.addEventListener('click', async () => {
        const file = fileInput?.files?.[0];
        if (!file) {
            showError('Please select an image.');
            return;
        }

        setBusy(true);
        showError('');

        const formData = new FormData();
        formData.append('profile_image', file);

        try {
            const response = await fetch('/accounts/profile/image/update/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken || '',
                },
                body: formData,
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                showError(data.error || 'Unable to update profile image.');
                setBusy(false);
                return;
            }

            if (avatarImage) {
                avatarImage.src = data.image_url;
                avatarImage.hidden = false;
            }
            if (avatarFallback) {
                avatarFallback.hidden = true;
            }
            if (activeObjectUrl) {
                URL.revokeObjectURL(activeObjectUrl);
                activeObjectUrl = null;
            }
            closeModal(editModal);
            closeModal(actionsModal);
            setBusy(false);
        } catch (error) {
            showError('Unable to update profile image.');
            setBusy(false);
        }
    });

    deleteConfirmBtn?.addEventListener('click', async () => {
        setBusy(true);
        try {
            const response = await fetch('/accounts/profile/image/delete/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken || '',
                },
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                showError('Unable to delete profile image.');
                setBusy(false);
                return;
            }

            if (avatarImage) {
                avatarImage.remove();
            }
            if (avatarFallback) {
                avatarFallback.hidden = false;
            }
            closeModal(deleteModal);
            closeModal(actionsModal);
            setBusy(false);
        } catch (error) {
            showError('Unable to delete profile image.');
            setBusy(false);
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeAllModals();
        }
    });

    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('profile-image-actions-modal') || event.target.classList.contains('profile-image-edit-modal') || event.target.classList.contains('profile-image-delete-modal')) {
            closeAllModals();
        }
    });
});
