🏨 HMS – Hotel Management System

Full Stack Application using Django (Backend) + Next.js (Frontend) + PostgreSQL with Docker


📌 Project Overview

This project is a full-stack Hotel Management System built with:

Backend: Django + PostgreSQL

Frontend: Next.js

Containerization: Docker & Docker Compose

The entire application runs using Docker — no need to install Python, Node.js, or PostgreSQL locally.



🚀 Getting Started (From Scratch)
✅ Requirements

Make sure the following are installed on your system:

Git

Docker

Docker Compose (included with Docker Desktop)

You do NOT need:

Python

Node.js

PostgreSQL

Docker handles everything.


📥 1️⃣ Clone the Repository

git clone https://github.com/siddartha4400-ui/hms.git
cd hms

first time project setup

docker compose up --build

next time onwords 

docker compose up --build -d

🌐 3️⃣ Access the Application

After containers start successfully:

Frontend:

http://localhost:3000


Backend:

http://localhost:8000

🗂 Project Structure

hms/
│
├── backend/              # Django project
│   ├── Dockerfile
│   └── .dockerignore
│
├── frontend/             # Next.js project
│   ├── Dockerfile
│   └── .dockerignore
│
├── docker-compose.yml
└── README.md


Access PostgreSQL:

docker exec -it hms_postgres psql -U hms -d hms


👨‍💻 Development Notes

Backend auto-runs migrations on startup.

Frontend uses Turbopack (Next.js 16).

.dockerignore is configured for faster builds.

No local dependency conflicts since everything runs in Docker.

/////////////////////////////////////////////
sockets 

root@e9e35c5db6af:/app# uvicorn config.asgi:application --host 0.0.0.0 --port 8000 --workers 4
ERROR:    [Errno 98] Address already in use
root@e9e35c5db6af:/app#
--host 0.0.0.0 → make it accessible from outside your VPS

--port 8000 → port your frontend (Next.js) will connect to

--workers 4 → number of worker processes for scaling



🟢 3️⃣ For Production

You don’t just run it manually — you use a process manager like:

systemd (Linux)

supervisor

pm2 / Docker

Example systemd service:


[Unit]
Description=Uvicorn Django Channels server
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/project_root
ExecStart=/home/ubuntu/venv/bin/uvicorn config.asgi:application \
    --host 0.0.0.0 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target






then
  sudo systemctl daemon-reload
sudo systemctl start uvicorn
sudo systemctl enable uvicorn

This way, Uvicorn starts automatically on server boot.


🟢 4️⃣ How Frontend Connects

In Next.js:



const socket = new WebSocket("ws://your-server-ip:8000/ws/booking/");



Or in production with HTTPS/WSS:
const socket = new WebSocket("wss://yourdomain.com/ws/booking/");

✅ Summary

uvicorn config.asgi:application → run in project root (where manage.py is)

For development → run manually in terminal

For production → run via systemd / supervisor / Docker

Make sure config/asgi.py exists and has application object

If you want, I can write the exact asgi.py + routing + Uvicorn command + Redis setup for your hotel management system so you can copy-paste it and run immediately.