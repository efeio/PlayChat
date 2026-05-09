"""
Connect Four — Flask server with shared in-memory game and real-time chat (Socket.IO).
Two players open /play/1 and /play/2 (or use the home page links).

Dev note: Werkzeug’s built-in server does not support Socket.IO WebSocket upgrades
cleanly (you may see AssertionError: write() before start_response). The frontend
uses Engine.IO long-polling only so chat and game_state work without eventlet.
"""

from __future__ import annotations

import threading
import time
from typing import Any

from flask import Flask, jsonify, render_template, request
from flask_socketio import SocketIO, emit, join_room

from connect_four import ConnectFourGame

app = Flask(__name__)
app.config["SECRET_KEY"] = "connect-four-dev"

GAME_ROOM = "game"
CHAT_MAX_LEN = 200
MESSAGE_MAX_CHARS = 500
NICKNAME_MAX_LEN = 20
_DEFAULT_NICK = {1: "Player 1", 2: "Player 2"}

socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode="threading",
)

_lock = threading.Lock()
_game = ConnectFourGame()
_chat: list[dict[str, Any]] = []
_nicknames: dict[int, str] = {1: _DEFAULT_NICK[1], 2: _DEFAULT_NICK[2]}


def _trim_chat() -> None:
    if len(_chat) > CHAT_MAX_LEN:
        del _chat[:-CHAT_MAX_LEN]


def _sanitize_nickname(player: int, raw: str) -> str:
    s = " ".join((raw or "").strip().split())
    if not s:
        return _DEFAULT_NICK[player]
    return s[:NICKNAME_MAX_LEN]


def _public_state_unlocked() -> dict[str, Any]:
    out = _game.snapshot()
    out["nicknames"] = {
        "1": _nicknames.get(1, _DEFAULT_NICK[1]),
        "2": _nicknames.get(2, _DEFAULT_NICK[2]),
    }
    return out


def _public_state() -> dict[str, Any]:
    """Board, outcome, nicknames (for REST + Socket.IO)."""
    with _lock:
        return _public_state_unlocked()


def _broadcast_game_state() -> dict[str, Any]:
    """Push current board to all Socket.IO clients and return the same snapshot."""
    payload = _public_state()
    socketio.emit("game_state", payload, room=GAME_ROOM)
    return payload


def _append_chat_entry(player: int, text: str) -> dict[str, Any]:
    entry = {
        "player": player,
        "message": text,
        "ts": time.time(),
    }
    with _lock:
        _chat.append(entry)
        _trim_chat()
    return entry


@socketio.on("connect")
def on_connect() -> None:
    join_room(GAME_ROOM)
    with _lock:
        history = list(_chat)
        payload = _public_state_unlocked()
    emit("chat_history", history)
    emit("game_state", payload)


@socketio.on("send_chat")
def on_send_chat(data: dict[str, Any] | None) -> None:
    if not isinstance(data, dict):
        emit("chat_error", {"error": "Invalid payload"})
        return
    try:
        player = int(data.get("player", 0))
        text = (data.get("message") or "").strip()
    except (TypeError, ValueError):
        emit("chat_error", {"error": "Invalid message"})
        return

    if player not in (1, 2):
        emit("chat_error", {"error": "player must be 1 or 2"})
        return
    if not text:
        emit("chat_error", {"error": "Empty message"})
        return
    if len(text) > MESSAGE_MAX_CHARS:
        text = text[:MESSAGE_MAX_CHARS]

    entry = _append_chat_entry(player, text)
    socketio.emit("chat_message", entry, room=GAME_ROOM)


@socketio.on("set_nickname")
def on_set_nickname(data: dict[str, Any] | None) -> None:
    if not isinstance(data, dict):
        emit("nickname_error", {"error": "Invalid payload"})
        return
    try:
        player = int(data.get("player", 0))
        nick = data.get("nickname", "")
        if not isinstance(nick, str):
            nick = str(nick)
    except (TypeError, ValueError):
        emit("nickname_error", {"error": "Invalid nickname"})
        return

    if player not in (1, 2):
        emit("nickname_error", {"error": "player must be 1 or 2"})
        return

    with _lock:
        _nicknames[player] = _sanitize_nickname(player, nick)
        names = {
            "1": _nicknames.get(1, _DEFAULT_NICK[1]),
            "2": _nicknames.get(2, _DEFAULT_NICK[2]),
        }
    socketio.emit("nicknames", names, room=GAME_ROOM)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/play/<int:player>")
def play(player: int):
    if player not in (1, 2):
        return "Invalid player", 400
    return render_template("game.html", player=player)


@app.route("/api/state")
def api_state():
    return jsonify(_public_state())


@app.route("/api/move", methods=["POST"])
def api_move():
    try:
        data = request.get_json(force=True, silent=True) or {}
        player = int(data.get("player", 0))
        col = int(data.get("column", -1))
    except (TypeError, ValueError):
        return jsonify({"ok": False, "error": "Invalid JSON"}), 400

    with _lock:
        ok, err = _game.try_move(player, col)
        if not ok:
            return jsonify({"ok": False, "error": err}), 400

    return jsonify({"ok": True, **_broadcast_game_state()})


@app.route("/api/reset", methods=["POST"])
def api_reset():
    with _lock:
        _game.reset()
        _chat.clear()
    socketio.emit("chat_cleared", room=GAME_ROOM)
    return jsonify({"ok": True, **_broadcast_game_state()})


if __name__ == "__main__":
    socketio.run(
        app,
        debug=True,
        host="0.0.0.0",
        port=5000,
        allow_unsafe_werkzeug=True,
    )
