const socket = io();

const loginPanel = document.getElementById("login-panel");
const chatPanel = document.getElementById("chat-panel");
const loginForm = document.getElementById("login-form");
const messageForm = document.getElementById("message-form");
const usernameInput = document.getElementById("username-input");
const messageInput = document.getElementById("message-input");
const activeUser = document.getElementById("active-user");
const messages = document.getElementById("messages");
const typingIndicator = document.getElementById("typing-indicator");

let username = "";
let typingTimeoutId;

const showTyping = () => {
    typingIndicator.classList.remove("hidden");
    clearTimeout(typingTimeoutId);
    typingTimeoutId = setTimeout(() => {
        typingIndicator.classList.add("hidden");
    }, 700);
};

const addMessageToView = (author, text, time = "") => {
    const item = document.createElement("div");
    item.className = "message-item";

    const authorSpan = document.createElement("span");
    authorSpan.className = "message-author";
    authorSpan.textContent = `${author}:`;

    const messageSpan = document.createElement("span");
    messageSpan.textContent = text;

    const timeSpan = document.createElement("span");
    timeSpan.className = "message-time";
    timeSpan.textContent = time;

    item.appendChild(authorSpan);
    item.appendChild(messageSpan);
    item.appendChild(timeSpan);

    messages.appendChild(item);
    messages.scrollTo({
        top: messages.scrollHeight,
        behavior: "smooth",
    });
};

loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const rawUsername = usernameInput.value.trim();
    if (!rawUsername) {
        return;
    }

    username = rawUsername;
    activeUser.textContent = `Aktif kullanıcı: ${username}`;

    loginPanel.classList.add("hidden");
    chatPanel.classList.remove("hidden");
    messageInput.focus();

    addMessageToView("Sistem", `${username} sohbete katıldı.`, "simdi");
});

messageForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const text = messageInput.value.trim();
    if (!text || !username) {
        return;
    }

    socket.emit("send_message", {
        username,
        message: text,
    });

    messageInput.value = "";
    messageInput.focus();
});

messageInput.addEventListener("input", () => {
    if (!username || !messageInput.value.trim()) {
        typingIndicator.classList.add("hidden");
        return;
    }

    showTyping();
});

messageInput.addEventListener("focus", () => {
    messageInput.parentElement.classList.add("focused");
});

messageInput.addEventListener("blur", () => {
    messageInput.parentElement.classList.remove("focused");
});

socket.on("receive_message", (payload) => {
    typingIndicator.classList.add("hidden");
    addMessageToView(payload.username, payload.message, payload.time || "");
});
