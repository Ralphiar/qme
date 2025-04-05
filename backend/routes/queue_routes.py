import os
import secrets
from datetime import datetime, timedelta
from flask import request, jsonify, render_template, redirect, url_for, session
from backend import app, db
from backend.models import Queue, ActivePlayers, CompletedPlayers
from config import Config

app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(16))
queue_open = True

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/bright_kate', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        if username == 'admin' and password == 'admin':
            session['admin_logged_in'] = True
            return redirect(url_for('admin_panel'))
        else:
            return render_template('login.html', error="Неверные данные!")

    return render_template('login.html')

@app.route('/admin_panel')
def admin_panel():
    if not session.get('admin_logged_in'):
        return redirect(url_for('login'))

    queue_players = Queue.query.order_by(Queue.joined_at).all()
    active_players = ActivePlayers.query.order_by(ActivePlayers.moved_at).all()

    return render_template('admin.html', queue_players=queue_players, active_players=active_players)

@app.route('/logout')
def logout():
    session.pop('admin_logged_in', None)
    return redirect(url_for('login'))

@app.route('/add_to_queue', methods=['POST'])
def add_to_queue():
    try:
        data = request.get_json()
        nickname = data.get('nickname', '').strip()
        nickname_lower = nickname.lower()
        now = datetime.utcnow()

        if not nickname:
            return jsonify({"error": "Никнейм обязателен"}), 400

        last_join_time = session.get('last_joined_at')
        if last_join_time:
            last_join_time = datetime.fromisoformat(last_join_time)
            cooldown_minutes = app.config.get('COOLDOWN_MINUTES', 5)
            cooldown = timedelta(minutes=cooldown_minutes)
            time_passed = now - last_join_time

            if time_passed < cooldown:
                seconds_left = int((cooldown - time_passed).total_seconds())
                minutes = seconds_left // 60
                seconds = seconds_left % 60
                return jsonify({"error": f"Подождите {minutes} мин {seconds} сек"}), 400

        in_queue = Queue.query.filter(db.func.lower(Queue.nickname) == nickname_lower).first()
        in_active = ActivePlayers.query.filter(db.func.lower(ActivePlayers.nickname) == nickname_lower).first()
        if in_queue or in_active:
            return jsonify({"error": "Вы уже в очереди или активны"}), 400

        new_entry = Queue(nickname=nickname, joined_at=now, last_joined_at=now)
        db.session.add(new_entry)
        db.session.commit()

        session['last_joined_at'] = now.isoformat()
        session['player_id'] = new_entry.id

        return jsonify({"message": "Вы добавлены в очередь"}), 200

    except Exception as e:
        app.logger.error(f"Ошибка в /add_to_queue: {str(e)}")
        return jsonify({"error": "Ошибка сервера", "details": str(e)}), 500

    except Exception as e:
        app.logger.error(f"Ошибка в /add_to_queue: {str(e)}")
        return jsonify({"error": "Ошибка сервера", "details": str(e)}), 500

@app.route('/completed_players', methods=['GET'])
def get_completed_players():
    try:
        completed_players = CompletedPlayers.query.order_by(CompletedPlayers.completed_at).all()
        completed_list = []
        for p in completed_players:
            player_data = {
                'id': p.id,
                'nickname': p.nickname,
                'rating': p.rating or 0,
                'games_played': getattr(p, 'games_played', 1)
            }
            completed_list.append(player_data)

        return jsonify(completed_list)

    except Exception as e:
        app.logger.error(f"Ошибка при получении завершённых игроков: {str(e)}")
        return jsonify({
            "error": "Не удалось получить список завершивших игроков",
            "details": str(e)
        }), 500

@app.route('/best_leaderboard', methods=['GET'])
def get_best_leaderboard():
    try:
        all_players = CompletedPlayers.query.all()
        best_results = {}

        for player in all_players:
            lower_nick = player.nickname.lower()
            current_rating = player.rating or 0

            if lower_nick not in best_results or current_rating > best_results[lower_nick]['rating']:
                best_results[lower_nick] = {
                    'id': player.id,
                    'nickname': player.nickname,
                    'rating': float(current_rating),
                    'date': player.completed_at.strftime('%d.%m.%Y') if player.completed_at else 'Неизвестно'
                }

        leaderboard = list(best_results.values())
        leaderboard.sort(key=lambda x: x['rating'], reverse=True)

        for i, player in enumerate(leaderboard, 1):
            player['rank'] = i

        return jsonify(leaderboard)
    except Exception as e:
        app.logger.error(f"Ошибка при получении таблицы лидеров: {str(e)}")
        return jsonify({"error": "Не удалось получить таблицу лидеров", "details": str(e)}), 500

@app.route('/move_to_completed', methods=['POST'])
def move_to_completed():
    try:
        data = request.json
        player_id = data.get("player_id")
        rating = float(data.get("rating", 0))

        if not player_id:
            return jsonify({"error": "No player_id provided"}), 400

        player = ActivePlayers.query.get(player_id)
        if not player:
            return jsonify({"error": "Player not found in active players"}), 404

        keep_in_active = data.get("keep_in_active", False)
        nickname = player.nickname

        if not keep_in_active:
            db.session.delete(player)

        existing_player = CompletedPlayers.query.filter(
            CompletedPlayers.nickname.ilike(nickname)
        ).first()

        if existing_player:
            total_games = existing_player.games_played + 1
            existing_player.rating = ((existing_player.rating or 0) * existing_player.games_played + rating) / total_games
            existing_player.games_played = total_games
            player_id = existing_player.id
            message = f"Updated {nickname}'s rating to {existing_player.rating:.1f}% (played {total_games} games)"
        else:
            new_completed_player = CompletedPlayers(
                nickname=nickname,
                rating=rating,
                games_played=1
            )
            db.session.add(new_completed_player)
            player_id = new_completed_player.id
            message = f"{nickname} moved to completed players with rating {rating}%"

        db.session.commit()
        return jsonify({"message": message, "player_id": player_id}), 200

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error in move_to_completed: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/move_to_active', methods=['POST'])
def move_to_active():
    data = request.json
    player_id = data.get("player_id")

    if not player_id:
        return jsonify({"error": "No player_id provided"}), 400

    player = Queue.query.get(player_id)
    if not player:
        return jsonify({"error": "Player not found in queue"}), 404

    nickname = player.nickname
    db.session.delete(player)
    new_active_player = ActivePlayers(nickname=nickname)
    db.session.add(new_active_player)
    db.session.commit()

    if session.get('player_id') == player.id:
        session['player_id'] = new_active_player.id

    return jsonify({
        "message": f"{nickname} moved to active players",
        "player_id": new_active_player.id
    }), 200


@app.route('/active_players', methods=['GET'])
def get_active_players():
    active_players = ActivePlayers.query.order_by(ActivePlayers.moved_at).all()
    active_list = [{'id': p.id, 'nickname': p.nickname} for p in active_players]
    return jsonify(active_list)

@app.route('/queue', methods=['GET'])
def get_queue():
    queue = Queue.query.order_by(Queue.joined_at).all()
    return jsonify([{'id': q.id, 'nickname': q.nickname} for q in queue])

@app.route('/remove_from_queue', methods=['POST'])
def remove_from_queue():
    data = request.json
    player_id = data.get("player_id")
    player = Queue.query.get(player_id)

    if not player:
        return jsonify({"error": "Игрок не найден"}), 404

    if session.get('player_id') != player.id and not session.get('admin_logged_in'):
        return jsonify({"error": "Можно удалить только себя"}), 403

    recent = Queue.query.filter_by(nickname=player.nickname).order_by(Queue.joined_at.desc()).first()
    if recent:
        recent.last_joined_at = None
        db.session.commit()

    db.session.delete(player)
    db.session.commit()

    # Сброс кулдауна для клиента
    session.pop('last_joined_at', None)
    session.pop('player_id', None)

    return jsonify({"message": "Игрок удалён"}), 200

@app.route('/remove_from_active', methods=['POST'])
def remove_from_active():
    data = request.json
    player_id = data.get("player_id")
    player = ActivePlayers.query.get(player_id)

    if not player:
        return jsonify({"error": "Игрок не найден"}), 404

    if session.get('player_id') != player.id and not session.get('admin_logged_in'):
        return jsonify({"error": "Можно удалить только себя"}), 403

    recent = Queue.query.filter_by(nickname=player.nickname).order_by(Queue.joined_at.desc()).first()
    if recent:
        recent.last_joined_at = None
        db.session.commit()

    db.session.delete(player)
    db.session.commit()

    # Сброс кулдауна для клиента
    session.pop('last_joined_at', None)
    session.pop('player_id', None)

    return jsonify({"message": "Игрок удалён из активных"}), 200

@app.route('/clear_queue', methods=['POST'])
def clear_queue():
    try:
        all_entries = Queue.query.all()
        for p in all_entries:
            p.last_joined_at = None

        Queue.query.delete()
        db.session.commit()

        # Сброс сессий (только для текущего клиента)
        session.pop('last_joined_at', None)
        session.pop('player_id', None)

        return jsonify({"status": "success", "message": "Очередь очищена"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Ошибка очистки: {str(e)}"}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Ошибка очистки: {str(e)}"}), 500

@app.route('/queue_status', methods=['GET'])
def queue_status():
    return jsonify({"queue_open": queue_open})

@app.route('/toggle_queue', methods=['POST'])
def toggle_queue():
    global queue_open
    queue_open = not queue_open
    return jsonify({
        "status": "success",
        "queue_open": queue_open,
        "message": "Очередь открыта" if queue_open else "Очередь закрыта"
    })

@app.route('/whoami', methods=['GET'])
def whoami():
    return jsonify({"player_id": session.get("player_id")})
