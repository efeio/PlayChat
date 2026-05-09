(function () {
  const cfg = window.CONNECT_FOUR || {};
  const myPlayer = cfg.player;
  if (myPlayer !== 1 && myPlayer !== 2) return;

  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status");
  const chatLog = document.getElementById("chat-log");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const btnReset = document.getElementById("btn-reset");
  const playerBadge = document.getElementById("player-badge");
  const nicknameForm = document.getElementById("nickname-form");
  const nicknameInput = document.getElementById("nickname-input");

  const COLS = 7;
  const ROWS = 6;

  let lastMoveSeq = -1;
  let lastState = null;
  let cells = [];
  let nicknames = { 1: "Player 1", 2: "Player 2" };

  function nameFor(playerNum) {
    const n = nicknames[playerNum];
    return n && String(n).trim() ? String(n) : "Player " + playerNum;
  }

  function applyNicknames(raw) {
    if (!raw || typeof raw !== "object") return;
    if (raw["1"] != null) nicknames[1] = String(raw["1"]);
    if (raw["2"] != null) nicknames[2] = String(raw["2"]);
    if (playerBadge) {
      playerBadge.textContent = nameFor(myPlayer);
    }
    if (lastState) {
      setStatus(lastState);
    }
  }

  function buildBoard() {
    boardEl.innerHTML = "";
    cells = [];
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cell";
        btn.dataset.row = String(r);
        btn.dataset.col = String(c);
        btn.setAttribute("aria-label", `Column ${c + 1}, row ${r + 1}`);
        btn.addEventListener("click", () => onColumnClick(c));
        boardEl.appendChild(btn);
        row.push(btn);
      }
      cells.push(row);
    }
  }

  function pieceClass(v) {
    if (v === 1) return "cell--p1";
    if (v === 2) return "cell--p2";
    return "";
  }

  function renderBoard(board) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const btn = cells[r][c];
        btn.className = "cell " + pieceClass(board[r][c]);
      }
    }
  }

  function updateWinGlow(state) {
    const won = !!(state && state.winner && state.winning_line && state.winning_line.length);
    boardEl.classList.toggle("board--won", won);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        cells[r][c].classList.remove("cell--win-line");
      }
    }
    if (won) {
      state.winning_line.forEach(function (rc) {
        const r = rc[0];
        const c = rc[1];
        if (cells[r] && cells[r][c]) {
          cells[r][c].classList.add("cell--win-line");
        }
      });
    }
  }

  function setStatus(state) {
    statusEl.className = "status";
    if (state.winner === myPlayer) {
      statusEl.textContent = "You win!";
      statusEl.classList.add("status--win");
    } else if (state.winner && state.winner !== myPlayer) {
      statusEl.textContent = nameFor(state.winner) + " wins.";
      statusEl.classList.add("status--lose");
    } else if (state.draw) {
      statusEl.textContent = "Draw — board is full.";
      statusEl.classList.add("status--turn-wait");
    } else if (state.current_player === myPlayer) {
      statusEl.textContent = "Your turn — pick a column.";
      statusEl.classList.add("status--turn-you");
    } else {
      statusEl.textContent = "Waiting for " + nameFor(state.current_player) + "…";
      statusEl.classList.add("status--turn-wait");
    }
  }

  function setInteractivity(state) {
    const over = state.winner != null || state.draw;
    const myTurn = !over && state.current_player === myPlayer;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const btn = cells[r][c];
        btn.disabled = over || !myTurn;
      }
    }
  }

  function appendChatLine(entry) {
    const div = document.createElement("div");
    div.className = "chat-msg chat-msg--p" + entry.player;
    const who = document.createElement("span");
    who.className = "chat-msg__who";
    who.textContent = nameFor(entry.player) + ":";
    const text = document.createElement("span");
    text.textContent = entry.message;
    div.appendChild(who);
    div.appendChild(text);
    chatLog.appendChild(div);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function renderChatHistory(messages) {
    chatLog.innerHTML = "";
    for (let i = 0; i < messages.length; i++) {
      appendChatLine(messages[i]);
    }
  }

  function applyGameState(state) {
    if (!state || !Array.isArray(state.board)) return;
    if (state.nicknames) {
      applyNicknames(state.nicknames);
    }
    renderBoard(state.board);
    setStatus(state);
    setInteractivity(state);
    updateWinGlow(state);
    lastMoveSeq = state.move_seq;
    lastState = state;
  }

  function syncGameStateIfNew(state) {
    if (!state || typeof state.move_seq !== "number") return;
    if (state.move_seq === lastMoveSeq) {
      if (state.nicknames) {
        applyNicknames(state.nicknames);
      }
      updateWinGlow(state);
      return;
    }
    applyGameState(state);
  }

  async function poll() {
    try {
      const res = await fetch("/api/state");
      if (!res.ok) throw new Error("state failed");
      const state = await res.json();
      syncGameStateIfNew(state);
    } catch {
      statusEl.textContent = "Connection issue — retrying…";
      statusEl.className = "status status--turn-wait";
    }
  }

  async function onColumnClick(col) {
    try {
      const res = await fetch("/api/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player: myPlayer, column: col }),
      });
      const data = await res.json();
      if (data.ok) {
        applyGameState(data);
      } else if (data.error) {
        statusEl.textContent = data.error;
        statusEl.className = "status status--turn-wait";
      }
    } catch {
      statusEl.textContent = "Move failed — check connection.";
      statusEl.className = "status status--turn-wait";
    }
  }

  /* Long-polling only: Werkzeug’s dev server cannot complete Socket.IO WebSocket
     upgrades (raises "write() before start_response"). Real-time still works. */
  const socket = io({
    transports: ["polling"],
  });

  socket.on("game_state", function (state) {
    syncGameStateIfNew(state);
  });

  socket.on("nicknames", function (names) {
    applyNicknames(names);
  });

  socket.on("chat_history", function (messages) {
    if (Array.isArray(messages)) {
      renderChatHistory(messages);
    }
  });

  socket.on("chat_message", function (entry) {
    if (entry && typeof entry.player === "number" && entry.message != null) {
      appendChatLine(entry);
    }
  });

  socket.on("chat_cleared", function () {
    chatLog.innerHTML = "";
  });

  socket.on("chat_error", function (payload) {
    const msg = payload && payload.error ? String(payload.error) : "Chat error";
    statusEl.textContent = msg;
    statusEl.className = "status status--turn-wait";
  });

  chatForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;
    chatInput.value = "";
    socket.emit("send_chat", { player: myPlayer, message: message });
  });

  if (nicknameForm && nicknameInput) {
    nicknameForm.addEventListener("submit", function (e) {
      e.preventDefault();
      socket.emit("set_nickname", {
        player: myPlayer,
        nickname: nicknameInput.value,
      });
    });
  }

  btnReset.addEventListener("click", async () => {
    if (!confirm("Restart? This clears the board and chat. Nicknames stay.")) return;
    try {
      const res = await fetch("/api/reset", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        chatLog.innerHTML = "";
        applyGameState(data);
      }
    } catch {
      /* ignore */
    }
  });

  buildBoard();
  poll();
  setInterval(poll, 8000);
})();
