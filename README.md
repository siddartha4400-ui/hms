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