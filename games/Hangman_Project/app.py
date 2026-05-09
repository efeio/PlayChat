"""Mini oyunlar hub — iki kişilik Adam Asmaca (Flask)."""

from __future__ import annotations

import os
import re
import secrets
from pathlib import Path

from flask import Flask, redirect, render_template, request, session, url_for

_BASE_DIR = Path(__file__).resolve().parent
app = Flask(
    __name__,
    template_folder=str(_BASE_DIR / "templates"),
)
app.secret_key = secrets.token_hex(32)

MAX_WRONG = 6
WORD_PATTERN = re.compile(r"^[a-zA-ZğüşıöçĞÜŞİÖÇ]+$")


def turkish_upper(raw: str) -> str:
    """Türkçe İ/I kurallarına yakın büyük harfe çevirir."""
    out: list[str] = []
    for c in raw.strip():
        if c == "i":
            out.append("İ")
        elif c == "ı":
            out.append("I")
        else:
            out.append(c.upper())
    return "".join(out)


def normalize_word(raw: str) -> str:
    return turkish_upper(raw)


def normalize_letter(raw: str) -> str:
    raw = (raw or "").strip()
    if not raw:
        return ""
    c = raw[0]
    if c == "i":
        return "İ"
    if c in ("ı", "I"):
        return "I"
    return turkish_upper(c)


def validate_word(word: str) -> bool:
    return bool(word) and bool(WORD_PATTERN.fullmatch(word))


def masked(word_upper: str, guessed: set[str]) -> str:
    return " ".join(c if c in guessed else "_" for c in word_upper)


def wrong_count(word_upper: str, guessed: set[str]) -> int:
    return sum(1 for g in guessed if g not in set(word_upper))


def is_win(word_upper: str, guessed: set[str]) -> bool:
    return all(c in guessed for c in word_upper)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/hangman", methods=["GET"])
def hangman_menu():
    session.pop("hangman", None)
    return render_template("hangman_setup.html")


@app.route("/hangman/start", methods=["POST"])
def hangman_start():
    p1 = (request.form.get("player1") or "").strip() or "Oyuncu 1"
    p2 = (request.form.get("player2") or "").strip() or "Oyuncu 2"
    raw_word = request.form.get("secret_word") or ""

    word = normalize_word(raw_word)
    if not validate_word(word):
        return render_template(
            "hangman_setup.html",
            error="Kelime sadece harf içermeli ve boş olmamalıdır (Türkçe harflere izin var).",
            player1=p1,
            player2=p2,
        )

    session["hangman"] = {
        "word": word,
        "guessed": [],
        "player1": p1,
        "player2": p2,
    }
    return redirect(url_for("hangman_play"))


@app.route("/hangman/play", methods=["GET", "POST"])
def hangman_play():
    state = session.get("hangman")
    if not state:
        return redirect(url_for("hangman_menu"))

    word = state["word"]
    guessed = set(state["guessed"])

    if request.method == "POST":
        letter_raw = request.form.get("letter") or ""
        letter = normalize_letter(letter_raw)
        if letter and WORD_PATTERN.fullmatch(letter):
            if letter not in guessed:
                state["guessed"].append(letter)
                guessed.add(letter)
                session["hangman"] = state

        wc = wrong_count(word, guessed)
        if is_win(word, guessed):
            return redirect(url_for("hangman_result", outcome="win"))
        if wc >= MAX_WRONG:
            return redirect(url_for("hangman_play", lost=1))

        return redirect(url_for("hangman_play"))

    wc = wrong_count(word, guessed)
    if is_win(word, guessed):
        return redirect(url_for("hangman_result", outcome="win"))
    if wc >= MAX_WRONG:
        if request.args.get("lost") == "1":
            return render_template(
                "hangman_play.html",
                player_guesser=state["player2"],
                player_setter=state["player1"],
                pattern=masked(word, guessed),
                guessed_sorted=sorted(guessed),
                wrong=wc,
                remaining=0,
                max_wrong=MAX_WRONG,
                game_lost=True,
            )
        return redirect(url_for("hangman_result", outcome="lose"))

    remaining = MAX_WRONG - wc
    return render_template(
        "hangman_play.html",
        player_guesser=state["player2"],
        player_setter=state["player1"],
        pattern=masked(word, guessed),
        guessed_sorted=sorted(guessed),
        wrong=wc,
        remaining=remaining,
        max_wrong=MAX_WRONG,
        game_lost=False,
    )


@app.route("/hangman/result/<outcome>")
def hangman_result(outcome: str):
    state = session.get("hangman")
    if not state:
        return redirect(url_for("hangman_menu"))

    word = state["word"]
    guessed = set(state["guessed"])
    wc = wrong_count(word, guessed)

    if outcome == "win" and not is_win(word, guessed):
        return redirect(url_for("hangman_play"))
    if outcome == "lose" and wc < MAX_WRONG:
        return redirect(url_for("hangman_play"))

    msg = ""
    if outcome == "win":
        msg = f'{state["player2"]} kazandı — kelime doğru bulundu.'
    else:
        msg = f'{state["player2"]} kaybetti — yanlış tahmin hakkı doldu.'

    return render_template(
        "hangman_result.html",
        outcome=outcome,
        message=msg,
        word=word,
        player_setter=state["player1"],
        player_guesser=state["player2"],
        wrong=wc,
        guessed_sorted=sorted(guessed),
    )


@app.route("/hangman/new")
def hangman_new():
    session.pop("hangman", None)
    return redirect(url_for("hangman_menu"))


if __name__ == "__main__":
    # 5000 sık çakışır; varsayılan 5050. Örn: set PORT=8080
    port = int(os.environ.get("PORT", "5050"))
    url = f"http://127.0.0.1:{port}/"
    print(f"\n>>> Tarayıcıda aç: {url}")
    print(">>> Sunucuyu durdurmak için bu pencerede CTRL+C\n")
    # Windows'ta yeniden başlatıcı bazen sorun çıkarır; tek süreç daha öngörülebilir.
    app.run(debug=True, host="127.0.0.1", port=port, use_reloader=False)
