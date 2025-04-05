document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const songOrderForm = document.getElementById('song-order-form');
    const orderInfo = document.getElementById('order-info');
    const orderStatus = document.getElementById('order-status');
    const nicknameInput = document.getElementById('nickname');
    const createOrderBtn = document.getElementById('create-order-btn');
    const orderCodeSpan = document.getElementById('order-code');
    const donateLink = document.getElementById('donate-link');
    const checkCodeInput = document.getElementById('check-code');
    const checkOrderBtn = document.getElementById('check-order-btn');
    const statusContent = document.getElementById('status-content');

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

    // Функция для создания заказа
    function createOrder() {
        const nickname = nicknameInput.value.trim();

        if (!nickname) {
            showNotification('Пожалуйста, введите никнейм', true);
            return;
        }

        fetch('/create_song_order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nickname: nickname })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showNotification(data.error, true);
                return;
            }

            // Показываем информацию о заказе
            orderCodeSpan.textContent = data.order_code;
            donateLink.href = data.redirect_url;

            songOrderForm.style.display = 'none';
            orderInfo.style.display = 'block';

            // Сохраняем код заказа в localStorage
            localStorage.setItem('lastOrderCode', data.order_code);

            showNotification('Заказ создан успешно!');
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Произошла ошибка при создании заказа', true);
        });
    }

    // Функция для проверки статуса заказа
    function checkOrderStatus(code) {
        fetch(`/check_order/${code}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Заказ не найден');
                }
                return response.json();
            })
            .then(data => {
                orderInfo.style.display = 'none';
                orderStatus.style.display = 'block';

                let statusHtml = '';
                let statusClass = '';
                let actionHtml = '';

                switch (data.status) {
                    case 'pending':
                        statusClass = 'status-pending';
                        statusHtml = '<p>Статус: <span class="status pending">Ожидает подтверждения доната</span></p>';
                        actionHtml = `
                            <p>Пожалуйста, сделайте донат, указав код заказа: <strong>${data.order_code}</strong></p>
                            <a href="${donateLink.href}" class="donate-btn" target="_blank">Перейти к донату</a>
                        `;
                        break;
                    case 'confirmed':
                        statusClass = 'status-confirmed';
                        statusHtml = '<p>Статус: <span class="status confirmed">Донат подтвержден</span></p>';
                        actionHtml = `
                            <p>Донат подтвержден ${new Date(data.confirmed_at).toLocaleString()}</p>
                            <p>Теперь вы можете добавить песню:</p>
                            <a href="/add_song/${data.order_code}" class