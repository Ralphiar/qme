import {
    getQueue,
    getActivePlayers,
    getCompletedPlayers,
    getLeaderboard,
    addToQueueRequest,
    moveToActive,
    removeFromQueue,
    removeFromActive
} from './api.js';

import { showNotification } from './ui.js';
import { showRatingModal } from './ratingsModal.js';

// 🔁 Глобальные переменные
let currentPlayerId = localStorage.getItem('player_id');
let currentPlayerNickname = localStorage.getItem('player_nickname');

// 👥 Ожидающие игроки
export async function updateQueue() {
    const queueList = document.getElementById('queue-list') || document.getElementById('queue-list-admin');
    if (!queueList) return;

    try {
        const players = await getQueue();
        queueList.innerHTML = '';
        const isAdmin = document.getElementById('queue-list-admin') !== null;

        players.forEach(player => {
            const li = document.createElement('li');
            li.classList.add('player-item');

            const playerName = document.createElement('span');
            playerName.textContent = player.nickname;
            playerName.classList.add('player-name');

            const buttonContainer = document.createElement('div');
            buttonContainer.classList.add('button-container');

            if (isAdmin) {
                const moveBtn = document.createElement('button');
                moveBtn.textContent = 'В активные';
                moveBtn.classList.add('move-button');
                moveBtn.onclick = async () => {
                    try {
                        const response = await moveToActive(player.id);
                        showNotification('Игрок перемещен в активные');
                        if (response.player_id) {
                            localStorage.setItem('player_id', response.player_id);
                            currentPlayerId = response.player_id;
                        }
                        updateQueue();
                        updateActivePlayersMain();
                    } catch (error) {
                        showNotification(error.message, true);
                    }
                };

                const removeBtn = document.createElement('button');
                removeBtn.textContent = 'Удалить';
                removeBtn.classList.add('remove-button');
                removeBtn.onclick = async () => {
                    await removeFromQueue(player.id);
                    showNotification('Игрок удален из очереди');
                    updateQueue();
                };

                buttonContainer.appendChild(moveBtn);
                buttonContainer.appendChild(removeBtn);
            } else if (player.nickname === currentPlayerNickname) {
                const removeBtn = document.createElement('button');
                removeBtn.innerHTML = '&times;';
                removeBtn.title = 'Удалить себя из очереди';
                removeBtn.classList.add('remove-button');
                removeBtn.onclick = async () => {
                    await removeFromQueue(player.id);
                    showNotification('Вы удалены из очереди');
                    updateQueue();
                };

                buttonContainer.appendChild(removeBtn);
            }

            li.appendChild(playerName);
            li.appendChild(buttonContainer);
            queueList.appendChild(li);
        });
    } catch (error) {
        console.error('Ошибка при обновлении очереди:', error);
        showNotification('Не удалось обновить список очереди', true);
    }
}

// 🔥 Активные игроки
export async function updateActivePlayersMain() {
    const activeList = document.getElementById('active-list') || document.getElementById('active-list-admin');
    if (!activeList) return;

    try {
        const players = await getActivePlayers();
        activeList.innerHTML = '';
        const isAdmin = document.getElementById('active-list-admin') !== null;

        players.forEach(player => {
            const li = document.createElement('li');
            li.classList.add('player-item');

            const playerName = document.createElement('span');
            playerName.textContent = player.nickname;
            playerName.classList.add('player-name');

            const buttonContainer = document.createElement('div');
            buttonContainer.classList.add('button-container');

            if (isAdmin) {
                const completeBtn = document.createElement('button');
                completeBtn.textContent = 'Завершить';
                completeBtn.classList.add('complete-button');
                completeBtn.onclick = () => showRatingModal(player.id, player.nickname);

                const anotherGameBtn = document.createElement('button');
                anotherGameBtn.textContent = 'Еще игра';
                anotherGameBtn.classList.add('move-button');
                anotherGameBtn.onclick = () => showRatingModal(player.id, player.nickname, true);

                const removeBtn = document.createElement('button');
                removeBtn.textContent = 'Удалить';
                removeBtn.classList.add('remove-button');
                removeBtn.onclick = async () => {
                    await removeFromActive(player.id);
                    showNotification('Игрок удален из активных');
                    updateActivePlayersMain();
                };

                buttonContainer.appendChild(anotherGameBtn);
                buttonContainer.appendChild(completeBtn);
                buttonContainer.appendChild(removeBtn);
            } else if (player.nickname === currentPlayerNickname) {
                const removeBtn = document.createElement('button');
                removeBtn.innerHTML = '&times;';
                removeBtn.title = 'Удалить себя из активных';
                removeBtn.classList.add('remove-button');
                removeBtn.onclick = async () => {
                    await removeFromActive(player.id);
                    showNotification('Вы удалены из активных');
                    updateActivePlayersMain();
                };
                buttonContainer.appendChild(removeBtn);
            }

            li.appendChild(playerName);
            li.appendChild(buttonContainer);
            activeList.appendChild(li);
        });
    } catch (error) {
        console.error('Ошибка при обновлении активных игроков:', error);
        showNotification('Не удалось обновить список активных игроков', true);
    }
}

// ✅ Завершившие игру
export async function updateCompletedPlayers() {
    const completedList = document.getElementById('completed-list') || document.getElementById('completed-list-admin');
    if (!completedList) return;

    try {
        const players = await getCompletedPlayers();
        completedList.innerHTML = '';
        players.forEach(player => {
            const li = document.createElement('li');
            li.classList.add('player-item');

            const playerName = document.createElement('span');
            playerName.textContent = `${player.nickname} — ${player.games_played || 1} игр(ы)`;
            playerName.classList.add('player-name');

            li.appendChild(playerName);
            completedList.appendChild(li);
        });
    } catch (error) {
        console.error('Ошибка при обновлении завершивших игроков:', error);
        showNotification('Не удалось обновить список завершивших игроков', true);
    }
}

// 🏆 Таблица лидеров
export async function updateLeaderboard() {
    const leaderboardContainer = document.getElementById('leaderboard-container');
    if (!leaderboardContainer) return;

    try {
        const data = await getLeaderboard();
        leaderboardContainer.innerHTML = '';

        if (!data || data.length === 0) {
            const noDataRow = document.createElement('tr');
            const noDataCell = document.createElement('td');
            noDataCell.textContent = 'Пока нет данных для таблицы лидеров';
            noDataCell.setAttribute('colspan', '4');
            noDataCell.style.textAlign = 'center';
            noDataRow.appendChild(noDataCell);
            leaderboardContainer.appendChild(noDataRow);
            return;
        }

        data.forEach((player, index) => {
            const tr = document.createElement('tr');

            const rankClasses = [
                index === 0 ? 'gold' : '',
                index === 1 ? 'silver' : '',
                index === 2 ? 'bronze' : ''
            ].filter(Boolean);

            rankClasses.forEach(cls => tr.classList.add(cls));

            const rankTd = document.createElement('td');
            rankTd.textContent = player.rank || index + 1;

            const nameTd = document.createElement('td');
            nameTd.textContent = player.nickname;

            const ratingTd = document.createElement('td');
            ratingTd.textContent = typeof player.rating === 'number'
                ? `${player.rating.toFixed(1)}%`
                : 'Нет данных';

            const dateTd = document.createElement('td');
            dateTd.textContent = player.date || 'Неизвестно';

            tr.append(rankTd, nameTd, ratingTd, dateTd);
            leaderboardContainer.appendChild(tr);
        });
    } catch (error) {
        console.error('Ошибка при обновлении таблицы лидеров:', error);

        leaderboardContainer.innerHTML = '';
        const errorRow = document.createElement('tr');
        const errorCell = document.createElement('td');
        errorCell.textContent = 'Не удалось загрузить таблицу лидеров';
        errorCell.setAttribute('colspan', '4');
        errorCell.style.color = 'red';
        errorCell.style.textAlign = 'center';
        errorRow.appendChild(errorCell);
        leaderboardContainer.appendChild(errorRow);
    }
}

// ➕ Добавление в очередь
export async function handleAddToQueue(event) {
    event.preventDefault();
    const nicknameInput = document.getElementById('nickname');
    const nickname = nicknameInput.value.trim();

    if (!nickname) {
        showNotification('Введите никнейм', true);
        return;
    }

    try {
        await addToQueueRequest(nickname);
        showNotification('Игрок добавлен в очередь');
        nicknameInput.value = '';
        localStorage.setItem('player_nickname', nickname);
        currentPlayerNickname = nickname;
        updateQueue();
    } catch (error) {
        showNotification(error.message, true);
    }
}
