<div align="center">
  <img src="./src/assets/logo.svg" alt="StrayCare Logo" width="180" />
  <br/>
  <h1>StrayCare</h1>
  <p><strong>A Social Platform for Animal Welfare</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/React-19.0.0-61DAFB.svg?style=for-the-badge&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/Vite-646CFF.svg?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Firebase-FFCA28.svg?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
    <img src="https://img.shields.io/badge/TailwindCSS-38B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS" />
    <img src="https://img.shields.io/badge/AI-HyperID_NeuroSym-8A2BE2.svg?style=for-the-badge&logo=pytorch&logoColor=white" alt="AI" />
  </p>
</div>

---

## 📖 Overview

**StrayCare** is a modern, full-stack social platform dedicated to animal welfare. It bridges the gap between stray animals in need and individuals or organizations willing to help. Whether it's reporting an injured stray, coordinating a local rescue, organizing fundraising campaigns, or facilitating adoptions, StrayCare provides the digital infrastructure to make it happen efficiently.

## ✨ Key Features

- **Rescue & Sighting Posts:** Geotagged posts to quickly alert the community about animals in distress.
- **Fundraising Campaigns:** Integrated donation trackers for medical bills or shelter funding.
- **Adoption Board:** Matchmaking system for finding forever homes for rescued strays.
- **HyperID Vision AI (BETA):** A state-of-the-art multi-task neural network backend (`HyperID-NeuroSym`) that automatically identifies animal breeds and phenotypic traits from uploaded photos, powered by a heavily fact-checked biological ontology.
- **Interactive Maps:** Real-time location tracking for rescues powered by Leaflet.

## 🛠 Tech Stack

### Frontend Application
- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4 & HeroUI
- **Routing:** React Router DOM
- **Maps:** Leaflet & React-Leaflet
- **Authentication & Database:** Firebase (Auth, Firestore, Storage)

### Backend (AI Microservice)
- **Framework:** FastAPI (Python)
- **Machine Learning:** PyTorch, CLIP, Scikit-Learn
- **Reasoning Engine:** RDFLib with `.ttl` Ontology Fact-Checking
- **Hosting:** Render

## 🚀 Quick Start (Local Development)

To run the StrayCare frontend locally, follow these steps:

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v18+) and `npm` installed.

### 2. Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/SDP-3-Group-4/straycare-web.git
cd straycare-web
npm install
```

### 3. Environment Configuration
**CRITICAL:** For security reasons, environment variables are not checked into version control. 
Contact the project maintainers to receive the `VITE_FIREBASE_*` configuration keys. 
Create a `.env` file in the root directory and securely paste the keys inside.

### 4. Run the Development Server
```bash
npm run dev
```
Navigate to `http://localhost:5173` in your browser.

## 🌐 Deployment

The frontend is optimized for deployment on **Firebase Hosting**.

```bash
# Build the production bundle
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

---

<div align="center">
  <sub>Built with ❤️ by Group 4 (CSE 400 - SDP IV)</sub>
</div>
