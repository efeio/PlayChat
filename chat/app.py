from datetime import datetime
from flask import Flask, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = "architectural-noir-chat"
socketio = SocketIO(app)


@app.route("/")
def index():
    return render_template("index.html")


@socketio.on("send_message")
def handle_send_message(data):
    username = (data.get("username") or "Anonim").strip()
    message = (data.get("message") or "").strip()

    if not message:
        return

    emit(
        "receive_message",
        {
            "username": username,
            "message": message,
            "time": datetime.now().strftime("%H:%M"),
        },
        broadcast=True,
    )


if __name__ == "__main__":
    socketio.run(app, debug=True)
