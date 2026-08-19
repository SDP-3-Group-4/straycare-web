# 🚀 StrayCare Web - Team Onboarding Guide

Welcome to the **StrayCare** team! We are thrilled to have you on board. This guide will help you set up your local development environment and explain our workflow so you can start contributing smoothly.

---

## 🛠️ 1. Prerequisites

Before you start, make sure you have the following installed on your machine:
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9.0.0 or higher) or **yarn** / **pnpm**
- **Git**
- **VS Code** (or your preferred IDE)

---

## ⚙️ 2. Repository Cloning & Fullstack Setup

The StrayCare project is a monorepo containing both the web frontend and the backend API.

1. **Clone the Repository**
   ```bash
   git clone https://github.com/SDP-3-Group-4/straycare-web.git
   cd straycare-web
   ```

## 🛠️ 3. Backend & Database Setup (Required First)

The frontend relies on the backend to function. You must set up the database and API first.

1. **Navigate to the Backend**
   ```bash
   cd straycare-backend
   ```

2. **Start the Database (Docker)**
   Make sure Docker Desktop is running, then spin up the PostgreSQL container:
   ```bash
   docker-compose up -d
   ```

3. **Install Dependencies & Environment**
   Ask the Team Lead for the backend `.env` file and place it in the `straycare-backend` folder.
   ```bash
   npm install
   ```

4. **Push Database Schema (Prisma)**
   Sync your local database with the Prisma schema:
   ```bash
   npx prisma db push
   ```

5. **Start the API Server**
   ```bash
   npm run start:dev
   ```

---

## 💻 4. Frontend Installation & Setup

Once the backend is running, open a **new terminal tab** to set up the frontend:

1. **Navigate to the Root Directory**
   Ensure you are in the root `straycare-web` folder (not inside the backend).

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Ask the team lead for the frontend `.env` file and place it in the root folder.
   ```bash
   cp .env.example .env
   ```

4. **Start the Development Server**
   ```bash
   npm run dev
   ```
   The application should now be running locally at `http://localhost:5173`.

---

## 🌿 3. Git Workflow & Branching Strategy

To keep our codebase clean and stable, we follow a strict branching and Pull Request (PR) workflow. **Never push directly to the `main` branch!**

### Step-by-Step Guide to Contributing:

1. **Always pull the latest changes before starting new work:**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create a new branch for your feature or bugfix:**
   Use a descriptive name for your branch (e.g., `feature/login-page`, `bugfix/header-alignment`).
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes and commit them:**
   Write clear and concise commit messages.
   ```bash
   git add .
   git commit -m "feat: added new login page UI"
   ```

4. **Push your branch to the remote repository:**
   ```bash
   git push origin feature/your-feature-name
   ```

---

## 🔁 4. Pull Requests (PR) & Code Review

Once your feature is complete and pushed to GitHub, you need to open a Pull Request (PR) for the Team Lead to review.

1. Go to the [StrayCare Web GitHub Repository](https://github.com/SDP-3-Group-4/straycare-web).
2. Click on the **Compare & pull request** button next to your recently pushed branch.
3. Fill out the PR template/description:
   - What does this PR do?
   - Which issue does it resolve?
   - Add screenshots if it's a UI change.
4. **Request Review**: Assign the PR to the Team Lead for review.
5. **Address Feedback**: If the Team Lead requests changes, make those changes locally, commit, and push them to the same branch. The PR will update automatically.
6. **Approval & Merge**: Once the Team Lead approves the PR, they will merge it into the `main` branch.

### 🛑 Important Rules
- **No direct pushes to `main`.**
- Ensure your code runs locally without errors before opening a PR.
- Keep your PRs focused. If you are fixing a bug and adding a feature, open **two separate PRs**.

---

Welcome again, and happy coding! 🐾
