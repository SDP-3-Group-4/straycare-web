<div align="center">
  <img src="./public/favicon.ico" alt="StrayCare Logo" width="120" />
  <h1>🐾 StrayCare Web 🐾</h1>
  <p><strong>A unified social platform dedicated to animal welfare, rescue, and adoption.</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/Status-Active-success.svg" alt="Status" />
    <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License" />
    <img src="https://img.shields.io/badge/React-v18.0+-blue.svg" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-v5.0+-blue.svg" alt="TypeScript" />
  </p>
</div>

---

## 🌟 Vision & Overview

**StrayCare** bridges the gap between emergency animal rescue, community engagement, and pet commerce. It connects animal lovers, rescuers, pet owners, and volunteers in a single, high-performance web platform.

With features ranging from real-time emergency rescue tracking to a fully integrated pet marketplace, StrayCare aims to deliver an experience akin to modern social networks with dynamic interactions and premium aesthetics.

## ✨ Key Features

- **🚨 Emergency Rescues:** Report stray animals that need immediate medical attention. Features real-time geo-location tracking and status updates.
- **📱 Community Social Feed:** An infinite-scrolling social feed featuring adoptions, fundraising, and community posts.
- **🛒 Integrated Marketplace:** A peer-to-peer e-commerce ecosystem for pet supplies with secure checkout capabilities.
- **💬 Real-Time Chat & AI Vet:** Instant messaging with other users and an integrated AI Vet Assistant for immediate guidance.
- **🔐 Secure & Scalable:** Next-generation architecture handling real-time WebSocket connections, secure waitlists, and rate-limiting.

## 🚀 Tech Stack

StrayCare Web leverages a modern, highly scalable tech stack:

- **Frontend:** React, TypeScript, Next.js
- **Styling:** Tailwind CSS, Shadcn UI, Glassmorphism Aesthetics
- **State Management:** Zustand, React Query
- **Backend Infrastructure:** Node.js (NestJS), PostgreSQL, Redis
- **Real-Time & Search:** Socket.io, Elasticsearch
- **Security:** NextAuth.js, Cloudflare (WAF/CDN)

## 📂 Project Structure (Monorepo)

```text
.
├── straycare-backend/ # Backend API (NestJS/Node + Prisma + PostgreSQL)
└── src/              # Frontend Web Application (React + Next.js)
    ├── components/   # Reusable UI components (Auth, Feed, Chat, Marketplace)
    ├── pages/        # Main application pages and routing
    ├── contexts/     # React Context providers (Auth, Theme)
    ├── hooks/        # Custom React hooks (e.g., useInfiniteQuery wrappers)
    ├── styles/       # Global stylesheets and Tailwind configurations
    ├── lib/          # API abstractions and utility functions
    └── assets/       # Static assets, icons, and illustrations
```

## 📦 Installation & Onboarding

For detailed instructions on how to set up the environment, install dependencies, and run the development server, please refer to our dedicated onboarding guide:

👉 **[Read the Team Onboarding Guide](./team_onboarding.md)**

## 🤝 Contributing

We follow a strict Git workflow to maintain code quality and stability. 

1. **Never push directly to `main`.**
2. Always branch off `main` (e.g., `feature/login-ui`, `bugfix/feed-crash`).
3. Open a Pull Request (PR) and assign it to the Team Lead for review.
4. Ensure all code passes ESLint security plugins and automated testing before requesting a review.

Please refer to the [Team Onboarding Guide](./team_onboarding.md) for full contribution guidelines.

## 🛡️ Security & DevSecOps

StrayCare prioritizes data security and stability. All Pull Requests undergo automated vulnerability scanning (`npm audit`), SAST checks for hardcoded secrets, and performance monitoring. Please be mindful of rate limits and database performance when adding new features.

## 📄 License

This project is licensed under the **[MIT License](./LICENSE)**.

---
<div align="center">
  Made with ❤️ by SDP-3-Group-4
</div>
