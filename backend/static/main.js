import {
    updateQueue,
    updateActivePlayersMain,
    updateCompletedPlayers,
    updateLeaderboard,
    handleAddToQueue
} from './queue.js';

import {
    checkQueueStatus,
    handleToggleQueue,
    handleClearQueue
} from './admin.js';

document.addEventListener('DOMContentLoaded', () => {
    const isAdminPage = document.getElementById('queue-list-admin') !== null;

    // Обновление всех списков
    function updateAll() {
        updateQueue();
        updateActivePlayersMain();
        updateCompletedPlayers();
        updateLeaderboard();
        if (isAdminPage) {
            checkQueueStatus();
        }
    }

    // Привязка кнопок
    const queueForm = document.getElementById('queue-form');
    if (queueForm) {
        queueForm.addEventListener('submit', handleAddToQueue);
    }

    const toggleQueueBtn = document.getElementById('toggle-queue-btn');
    if (toggleQueueBtn) {
        toggleQueueBtn.addEventListener('click', handleToggleQueue);
    }

    const clearQueueBtn = document.getElementById('clear-queue-btn');
    if (clearQueueBtn) {
        clearQueueBtn.addEventListener('click', handleClearQueue);
    }

    // Первичный запуск
    updateAll();

    // Обновляем данные каждую 5 сек
    setInterval(updateAll, 5000);
});
