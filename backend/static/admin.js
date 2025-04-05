import { toggleQueueStatus, getQueueStatus, clearQueueRequest } from './api.js';
import { showNotification, showConfirmModal, updateQueueFormState, updateQueueToggleButton } from './ui.js';
import { updateQueue } from './queue.js';

// 🔁 Обновляем статус очереди на кнопке и в поле
export async function checkQueueStatus() {
    try {
        const data = await getQueueStatus();
        const queueOpen = data.queue_open;
        updateQueueToggleButton(queueOpen);
        updateQueueFormState(queueOpen);
    } catch (error) {
        console.error('Ошибка при проверке статуса очереди:', error);
    }
}

// 🔄 Переключение очереди
export async function handleToggleQueue() {
    try {
        const data = await toggleQueueStatus();
        showNotification(data.message);
        checkQueueStatus();
    } catch (error) {
        console.error('Ошибка при переключении очереди:', error);
        showNotification('Не удалось изменить статус очереди', true);
    }
}

// 🧹 Очистка очереди с подтверждением
export function handleClearQueue() {
    showConfirmModal('Вы уверены, что хотите очистить всю очередь?', async () => {
        try {
            const data = await clearQueueRequest();
            showNotification(data.message);
            updateQueue();
        } catch (error) {
            console.error('Ошибка при очистке очереди:', error);
            showNotification('Не удалось очистить очередь', true);
        }
    });
}
