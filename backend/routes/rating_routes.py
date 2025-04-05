from flask import request, jsonify
from backend import app, db
from backend.models import CompletedPlayers


@app.route('/add_rating', methods=['POST'])
def add_rating():
    data = request.json
    player_id = data.get('player_id')
    rating = data.get('rating')

    if not player_id or rating is None:
        return jsonify({"error": "Player ID and rating are required"}), 400

    if not (0 <= rating <= 100):
        return jsonify({"error": "Rating must be between 0 and 100"}), 400

    player = CompletedPlayers.query.get(player_id)
    if not player:
        return jsonify({"error": "Player not found"}), 404

    player.rating = rating
    db.session.commit()

    return jsonify({"message": f"Rating {rating}% added for {player.nickname}"}), 200


@app.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    # Получаем игроков, отсортированных по рейтингу (от высшего к низшему)
    leaderboard = CompletedPlayers.query.order_by(CompletedPlayers.rating.desc()).all()

    leaderboard_data = [
        {
            'id': player.id,
            'nickname': player.nickname,
            'rating': player.rating,
            'completed_at': player.completed_at.isoformat()
        }
        for player in leaderboard
    ]

    return jsonify(leaderboard_data)