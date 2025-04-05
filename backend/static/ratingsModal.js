import { moveToCompletedWithRating } from './api.js';
import { showNotification } from './ui.js';
import { updateActivePlayersMain, updateCompletedPlayers, updateLeaderboard } from './queue.js';

// 📦 Модальное окно оценки игрока
export function showRatingModal(playerId, playerName, keepInActive = false) {
    const modalOverlay = document.createElement("div");
    modalOverlay.className = "modal-overlay";

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content rating-modal";

    const modalHeader = document.createElement("div");
    modalHeader.className = "modal-header";
    const modalTitle = document.createElement("h3");
    modalTitle.textContent = `Оценить игру ${playerName}`;
    modalHeader.appendChild(modalTitle);

    const modalBody = document.createElement("div");
    modalBody.className = "modal-body";

    const ratingContainer = document.createElement("div");
    ratingContainer.className = "rating-container";

    const ratingSlider = document.createElement("input");
    ratingSlider.type = "range";
    ratingSlider.min = 0;
    ratingSlider.max = 100;
    ratingSlider.step = 1;
    ratingSlider.value = 50;
    ratingSlider.className = "rating-slider";

    const ratingValue = document.createElement("div");
    ratingValue.className = "rating-value";
    ratingValue.textContent = "50%";

    ratingSlider.oninput = function () {
        ratingValue.textContent = this.value + "%";
    };

    ratingContainer.appendChild(ratingSlider);
    ratingContainer.appendChild(ratingValue);

    const presetContainer = document.createElement("div");
    presetContainer.className = "rating-presets";

    const presets = [0, 25, 50, 75, 100];
    presets.forEach(preset => {
        const presetBtn = document.createElement("button");
        presetBtn.className = "rating-preset-btn";
        presetBtn.textContent = preset + "%";
        presetBtn.onclick = function () {
            ratingSlider.value = preset;
            ratingValue.textContent = preset + "%";
        };
        presetContainer.appendChild(presetBtn);
    });

    modalBody.appendChild(ratingContainer);
    modalBody.appendChild(presetContainer);

    const modalFooter = document.createElement("div");
    modalFooter.className = "modal-footer";

    const cancelButton = document.createElement("button");
    cancelButton.className = "modal-cancel-btn";
    cancelButton.textContent = "Отмена";
    cancelButton.onclick = function () {
        document.body.removeChild(modalOverlay);
    };

    const confirmButton = document.createElement("button");
    confirmButton.className = "modal-confirm-btn";
    confirmButton.textContent = "Сохранить оценку";
    confirmButton.onclick = async function () {
        const rating = parseInt(ratingSlider.value);
        document.body.removeChild(modalOverlay);

        try {
            const data = await moveToCompletedWithRating(playerId, rating, keepInActive);
            showNotification(data.message || 'Оценка сохранена');
            updateActivePlayersMain();
            updateCompletedPlayers();
            updateLeaderboard();
        } catch (error) {
            console.error('Ошибка при оценке игрока:', error);
            showNotification('Не удалось сохранить оценку', true);
        }
    };

    modalFooter.appendChild(cancelButton);
    modalFooter.appendChild(confirmButton);

    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
}
