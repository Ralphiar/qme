// 📦 API-запросы к серверу

export async function getQueue() {
    const response = await fetch('/queue');
    return await response.json();
}

export async function addToQueueRequest(nickname) {
    const response = await fetch('/add_to_queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname })
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка при добавлении');
    }

    return await response.json();
}

export async function removeFromQueue(playerId) {
    const response = await fetch('/remove_from_queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId })
    });

    return await response.json();
}

export async function moveToActive(playerId) {
    const response = await fetch('/move_to_active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId })
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка при перемещении в активные');
    }

    return await response.json();
}

export async function getActivePlayers() {
    const response = await fetch('/active_players');
    return await response.json();
}

export async function removeFromActive(playerId) {
    const response = await fetch('/remove_from_active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId })
    });

    return await response.json();
}

export async function getCompletedPlayers() {
    const response = await fetch('/completed_players');
    return await response.json();
}

export async function getLeaderboard() {
    const response = await fetch('/best_leaderboard');

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка при загрузке таблицы лидеров');
    }

    return await response.json();
}

export async function moveToCompletedWithRating(playerId, rating, keepInActive = false) {
    const response = await fetch('/move_to_completed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            player_id: playerId,
            rating: rating,
            keep_in_active: keepInActive
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Ошибка при сохранении оценки');
    }

    return data;
}

export async function getQueueStatus() {
    const response = await fetch('/queue_status');
    return await response.json();
}

export async function toggleQueueStatus() {
    const response = await fetch('/toggle_queue', { method: 'POST' });
    return await response.json();
}

export async function clearQueueRequest() {
    const response = await fetch('/clear_queue', { method: 'POST' });
    return await response.json();
}
