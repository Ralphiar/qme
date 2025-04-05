document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const orderCodeInput = document.getElementById('order-code-input');
    const confirmBtn = document.getElementById('confirm-btn');
    const confirmMessage = document.getElementById('confirm-message');
    const songsQueue = document.getElementById('songs-queue');
    const allOrders = document.getElementById('all-orders');
    const filterBtns = document.querySelectorAll('.filter-btn');

    let currentFilter = 'all';

    // Функция для показа уведомления
    function showNotification(message, isError = false) {
        // Создаем новое уведомление
        const notification = document.createElement('div');
        notification.className = `notification ${isError ? 'error' : 'success'}`;
        notification.textContent = message;

        // Добавляем кнопку закрытия
        const closeButton = document.createElement('span');
        closeButton.className = 'close-notification';
        closeButton.innerHTML = '&times;';
        closeButton.onclick = function() {
            notification.remove();
        };

        notification.appendChild(closeButton);
        document.body.appendChild(notification);

        // Автоматически убираем через 5 секунд
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }

    // Функция для подтверждения доната
    function confirmDonation() {
        const orderCode = orderCodeInput.value.trim().toUpperCase();

        if (!orderCode) {
            confirmMessage.textContent = 'Пожалуйста, введите код заказа';
            confirmMessage.className = 'confirm-message error';
            return;
        }

        fetch('/confirm_donation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_code: orderCode })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                confirmMessage.textContent = data.error;
                confirmMessage.className = 'confirm-message error';
                return;
            }

            confirmMessage.textContent = data.message;
            confirmMessage.className = 'confirm-message success';
            orderCodeInput.value = '';

            // Обновляем списки
            loadSongsQueue();
            loadAllOrders();

            showNotification('Донат подтвержден!');
        })
        .catch(error => {
            console.error('Error:', error);
            confirmMessage.textContent = 'Произошла ошибка при подтверждении доната';
            confirmMessage.className = 'confirm-message error';
        });
    }

    // Функция для загрузки очереди песен
    function loadSongsQueue() {
        songsQueue.innerHTML = '<div class="loading">Загрузка...</div>';

        fetch('/song_orders?status=completed')
            .then(response => response.json())
            .then(data => {
                // Фильтруем только неотыгранные песни
                const pendingSongs = data.filter(order => !order.played);

                if (pendingSongs.length === 0) {
                    songsQueue.innerHTML = '<div class="empty-message">Нет песен в очереди</div>';
                    return;
                }

                songsQueue.innerHTML = '';

                pendingSongs.forEach(order => {
                    const songItem = document.createElement('div');
                    songItem.className = 'song-item';

                    songItem.innerHTML = `
                        <div class="song-info">
                            <h3>${order.song_title || 'Без названия'}</h3>
                            <p>Исполнитель: ${order.artist || 'Не указан'}</p>
                            <p>Заказал: ${order.nickname}</p>
                            <p>YouTube: <a href="${order.youtube_url}" target="_blank">${order.youtube_url}</a></p>
                        </div>
                        <div class="song-controls">
                            <button class="action-btn play" data-id="${order.id}">Отметить как проигранную</button>
                        </div>
                    `;

                    songsQueue.appendChild(songItem);

                    // Добавляем обработчик для кнопки "Отметить как проигранную"
                    const playBtn = songItem.querySelector('.play');
                    playBtn.addEventListener('click', function() {
                        markAsPlayed(order.id);
                    });
                });
            })
            .catch(error => {
                console.error('Error:', error);
                songsQueue.innerHTML = '<div class="error-message">Ошибка при загрузке очереди песен</div>';
            });
    }

    // Функция для отметки песни как проигранной
    function markAsPlayed(orderId) {
        fetch('/mark_as_played', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showNotification(data.error, true);
                return;
            }

            showNotification('Песня отмечена как проигранная');

            // Обновляем списки
            loadSongsQueue();
            loadAllOrders();
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Произошла ошибка при отметке песни', true);
        });
    }

    // Функция для загрузки всех заказов
    function loadAllOrders() {
        allOrders.innerHTML = '<div class="loading">Загрузка...</div>';

        let url = '/song_orders';
        if (currentFilter !== 'all') {
            url += `?status=${currentFilter}`;
        }

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.length === 0) {
                    allOrders.innerHTML = '<div class="empty-message">Нет заказов</div>';
                    return;
                }

                allOrders.innerHTML = '';

                data.forEach(order => {
                    const orderItem = document.createElement('div');
                    orderItem.className = `order-item status-${order.status}`;

                    let statusText = '';
                    let actionHtml = '';

                    switch (order.status) {
                        case 'pending':
                            statusText = '<span class="status pending">Ожидает подтверждения</span>';
                            actionHtml = `
                                <button class="action-btn confirm" data-code="${order.order_code}">Подтвердить донат</button>
                            `;
                            break;
                        case 'confirmed':
                            statusText = '<span class="status confirmed">Донат подтвержден</span>';
                            actionHtml = `
                                <p>Ожидание добавления песни...</p>
                            `;
                            break;
                        case 'completed':
                            statusText = '<span class="status completed">Песня добавлена</span>';
                            actionHtml = `
                                <p>YouTube: <a href="${order.youtube_url}" target="_blank">Открыть</a></p>
                                ${!order.played ? `<button class="action-btn play" data-id="${order.id}">Отметить как проигранную</button>` : ''}
                            `;
                            break;
                    }

                    orderItem.innerHTML = `
                        <div class="order-header">
                            <h3>Код: ${order.order_code}</h3>
                            <div class="order-status">${statusText}</div>
                        </div>
                        <div class="order-details">
                            <p>Никнейм: ${order.nickname}</p>
                            <p>Создан: ${new Date(order.created_at).toLocaleString()}</p>
                            ${order.confirmed_at ? `<p>Подтвержден: ${new Date(order.confirmed_at).toLocaleString()}</p>` : ''}
                            ${order.song_title ? `<p>Песня: ${order.song_title}</p>` : ''}
                            ${order.artist ? `<p>Исполнитель: ${order.artist}</p>` : ''}
                            ${order.played ? `<p>Проиграна: ${new Date(order.played_at).toLocaleString()}</p>` : ''}
                        </div>
                        <div class="order-actions">
                            ${actionHtml}
                        </div>
                    `;

                    allOrders.appendChild(orderItem);

                    // Добавляем обработчики для кнопок
                    const confirmBtns = orderItem.querySelectorAll('.confirm');
                    confirmBtns.forEach(btn => {
                        btn.addEventListener('click', function() {
                            const code = this.getAttribute('data-code');
                            orderCodeInput.value = code;
                            confirmDonation();
                        });
                    });

                    const playBtns = orderItem.querySelectorAll('.play');
                    playBtns.forEach(btn => {
                        btn.addEventListener('click',