const express = require("express");
const app = express();
const http = require("http").createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);

let messages = [];

app.get("/", (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ultimate Chat</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }
        #chat {
          width: 90%;
          max-width: 600px;
          height: 80vh;
          background: rgba(0, 0, 0, 0.6);
          border-radius: 20px;
          box-shadow: 0 0 40px rgba(0, 255, 255, 0.5);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        #messages {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          font-size: 16px;
        }
        #messages div {
          margin: 8px 0;
          padding: 10px 15px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.1);
          animation: fadeIn 0.3s ease;
        }
        #form {
          display: flex;
          padding: 15px;
          background: rgba(0, 0, 0, 0.8);
        }
        #input {
          flex: 1;
          border: none;
          border-radius: 12px;
          padding: 12px;
          font-size: 16px;
          outline: none;
        }
        #send, #changeName {
          margin-left: 10px;
          background: #00c6ff;
          border: none;
          border-radius: 12px;
          padding: 12px 18px;
          cursor: pointer;
          color: white;
          font-weight: bold;
          transition: background 0.3s;
        }
        #send:hover, #changeName:hover {
          background: #0072ff;
        }
        #usernameDisplay {
          padding: 10px;
          text-align: center;
          background: rgba(0, 0, 0, 0.7);
          font-size: 18px;
          font-weight: bold;
          color: #00eaff;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      </style>
    </head>
    <body>
      <div id="chat">
        <div id="usernameDisplay"></div>
        <div id="messages"></div>
        <form id="form">
          <input id="input" autocomplete="off" placeholder="Type a message..." />
          <button id="send">Send</button>
          <button type="button" id="changeName">Change Name</button>
        </form>
      </div>
      <script src="/socket.io/socket.io.js"></script>
      <script>
        const socket = io();
        const messagesDiv = document.getElementById("messages");
        const form = document.getElementById("form");
        const input = document.getElementById("input");
        const usernameDisplay = document.getElementById("usernameDisplay");
        const changeNameBtn = document.getElementById("changeName");

        // Load username from localStorage or ask
        let username = localStorage.getItem("username") || prompt("Enter your username:") || "Anonymous";
        localStorage.setItem("username", username);
        updateUsernameDisplay();

        socket.emit("join", username);

        // Load old messages
        socket.on("loadMessages", (msgs) => {
          messagesDiv.innerHTML = "";
          msgs.forEach((msg) => {
            addMessage(msg.user, msg.text, msg.system);
          });
        });

        // New message
        socket.on("chat message", (msg) => {
          addMessage(msg.user, msg.text, msg.system);
        });

        form.addEventListener("submit", (e) => {
          e.preventDefault();
          if (input.value.trim()) {
            socket.emit("chat message", { user: username, text: input.value });
            input.value = "";
          }
        });

        changeNameBtn.addEventListener("click", () => {
          const newName = prompt("Enter new username:");
          if (newName && newName !== username) {
            const oldName = username;
            username = newName;
            localStorage.setItem("username", username);
            updateUsernameDisplay();

            // Update old messages in DOM
            document.querySelectorAll(".msg-user-" + cssEscape(oldName)).forEach(el => {
              el.textContent = newName;
              el.classList.remove("msg-user-" + cssEscape(oldName));
              el.classList.add("msg-user-" + cssEscape(newName));
            });

            // Send system message
            socket.emit("chat message", { user: "System", text: oldName + " changed username to " + newName, system: true });
          }
        });

        function addMessage(user, text, system = false) {
          const div = document.createElement("div");
          if (system) {
            div.style.color = "#ffcc00";
            div.style.fontStyle = "italic";
            div.textContent = text;
          } else {
            const strong = document.createElement("strong");
            strong.textContent = user;
            strong.classList.add("msg-user-" + cssEscape(user));
            div.appendChild(strong);
            div.appendChild(document.createTextNode(": " + text));
          }
          messagesDiv.appendChild(div);
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        function updateUsernameDisplay() {
          usernameDisplay.textContent = "You are logged in as: " + username;
        }

        // Helper for safe classNames
        function cssEscape(str) {
          return str.replace(/[^a-zA-Z0-9_-]/g, "_");
        }
      </script>
    </body>
    </html>
  `);
});

io.on("connection", (socket) => {
  socket.emit("loadMessages", messages);

  socket.on("join", (username) => {
    console.log(username + " joined");
  });

  socket.on("chat message", (msg) => {
    messages.push(msg);
    io.emit("chat message", msg);
  });
});

http.listen(3000, () => {
  console.log("listening on *:3000");
});
