🔄 SlotSwapper: Peer-to-Peer Time Slot Exchange

SlotSwapper is a full-stack web application that allows users to manage their personal time slots and trade them with other users on an open marketplace.

✨ Core Features

Authentication: Secure user sign-up and login using JWT (JSON Web Tokens).

Event Management: A personal dashboard where users can create, edit, delete, and manage their own time slots (events).

Marketplace: Users can mark their events as "Swappable," making them visible on a public marketplace for other users to browse.

Swap Request System:

Users can request to swap one of their swappable slots for a slot on the marketplace.

A dedicated "Requests" page to view and manage incoming (Accept/Reject) and outgoing swap requests.

Protected Routes: Frontend routes are protected, redirecting unauthorized users to the login page.

🛠 Tech Stack

Frontend (React + Vite)

Framework: React 18

Build Tool: Vite

Routing: react-router-dom

Styling: Tailwind CSS

API Client: axios

State Management: React Context API (for Auth)

Backend (Python + FastAPI)

Framework: FastAPI

Database: PostgreSQL

ORM: SQLAlchemy

Authentication: passlib[bcrypt] for password hashing, python-jose for JWT tokens.

Server: Uvicorn

🚀 Getting Started (Local Development)

Follow these instructions to get the project running on your local machine.

Prerequisites

Node.js (v18 or newer)

Python (v3.10 or newer)

PostgreSQL: A running local instance.

1. Clone the Repository

git clone [https://github.com/rudra-patel-001/SlotSwapper.git](https://github.com/rudra-patel-001/SlotSwapper.git)
cd SlotSwapper


2. Configure the Backend

Move .env File: Move the .env file from the backend folder to the project's root folder (SlotSwapper).

Edit .env File: Open the .env file and set your database connection string and a secret key.

# Example for a local PostgreSQL database
DATABASE_URL="postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@localhost:5432/slotswapper_db"

# Generate a strong secret key
SECRET_KEY="YOUR_SUPER_SECRET_32_BYTE_HEX_KEY_HERE"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=60


Create & Activate Virtual Environment:

# Create the environment
python -m venv venv

# Activate on Windows
.\venv\Scripts\activate

# Activate on macOS/Linux
source venv/bin/activate


Install Python Dependencies: Use the provided requirements.txt file (or install them manually with the command below).

# Recommended: create requirements.txt first
# pip freeze > requirements.txt
# pip install -r requirements.txt

# Manual install command (if no requirements.txt):
pip install fastapi uvicorn[standard] sqlalchemy psycopg2-binary python-dotenv "python-jose[cryptography]" fastapi-cors "pydantic[email]" passlib==1.7.4 bcrypt==4.0.1


3. Setup the Database

You must create the user and database specified in your .env file. Open the psql shell and run:

-- Example using the .env values above
CREATE USER YOUR_DB_USER WITH PASSWORD 'YOUR_DB_PASSWORD';
CREATE DATABASE slotswapper_db;
GRANT ALL PRIVILEGES ON DATABASE slotswapper_db TO YOUR_DB_USER;


4. Configure the Frontend

Open a new terminal.

Navigate to the frontend folder:

cd frontend


Install Node.js dependencies:

npm install


5. Run the Application

You now need to run both servers in their separate terminals.

Terminal 1 (Backend):

Make sure your venv is active.

Run from the project's root folder (the one containing backend and frontend).

uvicorn backend.main:app --reload --port 8000


Terminal 2 (Frontend):

Navigate to the frontend folder.

npm run dev


Your application is now running!

Frontend: http://localhost:5173

Backend: http://localhost:8000

☁ Deployment on Render

This project is configured to be deployed as two separate services on Render.

1. PostgreSQL Database

Create Service: New+ -> PostgreSQL.

Details: Give it a name (e.g., slotswapper-db).

Copy: Once created, copy the Internal Connection String.

2. Backend (Web Service)

Create Service: New+ -> Web Service (connect your repo).

Settings:

Root Directory: (leave blank)

Environment: Python

Build Command: pip install -r requirements.txt

Start Command: uvicorn backend.main:app --host 0.0.0.0 --port $PORT

Environment Variables:

DATABASE_URL: (Paste the Internal Connection String from Step 1).

SECRET_KEY: (Your unique secret key).

ALGORITHM: HS256

ACCESS_TOKEN_EXPIRE_MINUTES: 60

PYTHON_VERSION: 3.12.0 (or your specific Python version)

Copy URL: After deploying, copy the backend's public URL (e.g., https://slotswapper-backend.onrender.com).

3. Frontend (Static Site)

Create Service: New+ -> Static Site (connect the same repo).

Settings:

Root Directory: frontend

Build Command: npm install && npm run build

Publish Directory: dist

Environment Variables:

VITE_API_URL: (Paste the backend URL from Step 2).

CORS: Don't forget to add your live frontend URL (e.g., https://slotswapper-frontend.onrender.com) to the origins list in backend/main.py and push the change.

<details>
<summary><h3>📦 API Endpoints</h3></summary>

Auth

POST /auth/signup: Create a new user.

POST /auth/login: Log in and receive a JWT.

GET /users/me: Get current user details (protected).

Events (Dashboard)

GET /events: Get all events for the logged-in user.

POST /events: Create a new event.

PUT /events/{event_id}: Update an event.

DELETE /events/{event_id}: Delete an event.

Marketplace

GET /marketplace: Get all events from other users marked as SWAPPABLE.

Swap Requests

POST /swap-requests: Create a new swap request.

GET /swap-requests/incoming: Get all requests sent to the logged-in user.

GET /swap-requests/outgoing: Get all requests sent by the logged-in user.

POST /swap-requests/{request_id}/respond: Accept or reject an incoming request.

</details>
