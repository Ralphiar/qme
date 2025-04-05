from flask import request, jsonify, render_template, redirect, url_for, session
from backend import app, db
from backend.models import SongOrder


# Страница для заказа песен
@app.route('/songs')
def songs_page():
    return render_template('songs.html')


# API для создания нового заказа песни
@app.route('/create_song_order', methods=['POST'])
def create_song_order():
    data = request.json
    nickname = data.get('nickname')

    if not nickname:
        return jsonify({'error': 'Nickname is required'}), 400

    # Создаем новый заказ
    order = SongOrder(
        nickname=nickname,
        order_code=SongOrder.generate_order_code(),
        status="pending"
    )

    db.session.add(order)
    db.session.commit()

    return jsonify({
        'message': 'Song order created',
        'order_code': order.order_code,
        'redirect_url': f'https://www.donationalerts.com/r/username?message=Song%20order%20code:%20{order.order_code}'
    }), 201


# API для получения информации о заказе по коду
@app.route('/check_order/<order_code>', methods=['GET'])
def check_order(order_code):
    order = SongOrder.query.filter_by(order_code=order_code).first()

    if not order:
        return jsonify({'error': 'Order not found'}), 404

    return jsonify(order.to_dict()), 200


# API для подтверждения доната (для админа)
@app.route('/confirm_donation', methods=['POST'])
def confirm_donation():
    # Проверяем, авторизован ли пользователь как админ
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.json
    order_code = data.get('order_code')

    if not order_code:
        return jsonify({'error': 'Order code is required'}), 400

    order = SongOrder.query.filter_by(order_code=order_code).first()

    if not order:
        return jsonify({'error': 'Order not found'}), 404

    if order.status != "pending":
        return jsonify({'error': f'Order is already {order.status}'}), 400

    order.confirm_donation()

    return jsonify({
        'message': 'Donation confirmed',
        'order': order.to_dict()
    }), 200


# Страница для добавления информации о песне после подтверждения доната
@app.route('/add_song/<order_code>', methods=['GET'])
def add_song_page(order_code):
    order = SongOrder.query.filter_by(order_code=order_code).first()

    if not order:
        return render_template('error.html', message="Заказ не найден")

    if order.status != "confirmed":
        if order.status == "pending":
            return render_template('error.html', message="Донат еще не подтвержден")
        else:
            return render_template('error.html', message="Песня уже добавлена")

    return render_template('song_form.html', order=order)


# API для добавления информации о песне
@app.route('/add_song_details', methods=['POST'])
def add_song_details():
    data = request.json
    order_code = data.get('order_code')
    youtube_url = data.get('youtube_url')
    song_title = data.get('song_title')
    artist = data.get('artist')

    if not order_code or not youtube_url:
        return jsonify({'error': 'Order code and YouTube URL are required'}), 400

    order = SongOrder.query.filter_by(order_code=order_code).first()

    if not order:
        return jsonify({'error': 'Order not found'}), 404

    if order.status != "confirmed":
        return jsonify({'error': f'Order is already {order.status}'}), 400

    order.add_song_details(youtube_url, song_title, artist)

    return jsonify({
        'message': 'Song details added',
        'order': order.to_dict()
    }), 200


# API для получения списка всех заказов песен (для админ-панели)
@app.route('/song_orders', methods=['GET'])
def get_song_orders():
    # Проверяем, авторизован ли пользователь как админ
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401

    status = request.args.get('status')

    if status:
        orders = SongOrder.query.filter_by(status=status).order_by(SongOrder.created_at.desc()).all()
    else:
        orders = SongOrder.query.order_by(SongOrder.created_at.desc()).all()

    return jsonify([order.to_dict() for order in orders]), 200


# API для отметки песни как воспроизведенной
@app.route('/mark_as_played', methods=['POST'])
def mark_as_played():
    # Проверяем, авторизован ли пользователь как админ
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.json
    order_id = data.get('order_id')

    if not order_id:
        return jsonify({'error': 'Order ID is required'}), 400

    order = SongOrder.query.get(order_id)

    if not order:
        return jsonify({'error': 'Order not found'}), 404

    if order.status != "completed":
        return jsonify({'error': 'Song details not added yet'}), 400

    if order.played:
        return jsonify({'error': 'Song already marked as played'}), 400

    order.mark_as_played()

    return jsonify({
        'message': 'Song marked as played',
        'order': order.to_dict()
    }), 200


# Администраторская страница для управления заказами песен
@app.route('/admin/songs')
def admin_songs():
    # Проверяем, авторизован ли пользователь как админ
    if not session.get('admin_logged_in'):
        return redirect(url_for('login'))

    return render_template('admin_songs.html')