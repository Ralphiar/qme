// 📦 UI-утилиты: уведомления, модалки, блокировка элементов

export function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : 'success'}`;
    notification.textContent = message;

    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-notification';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => notification.remove();

    notification.appendChild(closeBtn);
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

export function showConfirmModal(messageText, onConfirm) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content confirm-modal';

    const message = document.createElement('p');
    message.textContent = messageText;

    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'modal-buttons';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Отмена';
    cancelBtn.className = 'modal-cancel-btn';
    cancelBtn.onclick = () => document.body.removeChild(modalOverlay);

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Подтвердить';
    confirmBtn.className = 'modal-confirm-btn';
    confirmBtn.onclick = () => {
        onConfirm();
        document.body.removeChild(modalOverlay);
    };

    buttonGroup.appendChild(cancelBtn);
    buttonGroup.appendChild(confirmBtn);
    modalContent.appendChild(message);
    modalContent.appendChild(buttonGroup);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
}

export function updateQueueFormState(queueOpen) {
    const nicknameInput = document.getElementById('nickname');
    const submitButton = document.querySelector('#queue-form button');

    if (nicknameInput && submitButton) {
        nicknameInput.disabled = !queueOpen;
        submitButton.disabled = !queueOpen;
        nicknameInput.placeholder = queueOpen
            ? 'Введите никнейм'
            : 'Очередь временно закрыта';
    }
}

export function updateQueueToggleButton(queueOpen) {
    const toggleQueueBtn = document.getElementById('toggle-queue-btn');
    if (toggleQueueBtn) {
        toggleQueueBtn.textContent = queueOpen ? 'Закрыть очередь' : 'Открыть очередь';
    }
}
