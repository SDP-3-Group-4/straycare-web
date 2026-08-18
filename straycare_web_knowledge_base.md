# StrayCare Web Platform: High-Fidelity Knowledge Base

This knowledge base serves as a comprehensive reference guide for transferring the StrayCare mobile application ecosystem into a high-performance, modern web application. It encapsulates the core architecture, data models, feature modules, technical requirements, and production rollout strategies needed by future agents or development teams to build the web platform.

---

## 1. System Overview & Vision

**StrayCare** is a unified social platform dedicated to animal welfare. It connects animal lovers, rescuers, pet owners, and volunteers. The platform bridges the gap between emergency animal rescue, community engagement, and pet commerce.

### Key Objectives for Web Platform
- **Controlled Soft Launch:** An initial production launch using a waitlist or referral-based system to ensure quality, manage traffic spikes, and gradually accumulate early adopters.
- **High Concurrency & Real-Time Sync:** Handle real-time updates for emergency rescues, chat, and feeds seamlessly as traffic scales.
- **SEO & Discoverability:** Essential for adoption posts, fundraising, and marketplace listings once they become public.
- **Responsive & Premium UI:** Deliver an experience akin to modern social networks (e.g., X/Twitter, Facebook) with dynamic interactions and glassmorphism aesthetics.
- **Security & Stability:** Implement robust cyber-security practices and active monitoring to protect user data and ensure high uptime during scale-up.

---

## 2. Proposed Modern Tech Stack (Web Version)

To achieve a highly interactive, scalable, and secure platform akin to X or Facebook, the following modern web stack is recommended:

| Layer | Recommended Technology | Justification |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js (React) | Server-Side Rendering (SSR) for SEO, fast initial load, and powerful routing. |
| **Styling & UI** | Tailwind CSS + Shadcn UI | Rapid, consistent styling with accessible, headless UI components. |
| **State Management** | Zustand + React Query | Lightweight global state (Zustand) and efficient server state caching/mutations. |
| **Backend API** | Node.js (NestJS) or Go | Go for high-concurrency feed generation, or NestJS for a robust, enterprise-ready architecture. |
| **Database (Primary)** | PostgreSQL | Relational integrity for users, waitlists, posts, orders, and complex joins. |
| **Caching & Pub/Sub** | Redis | Crucial for rate limiting, feed caching, and managing real-time WebSocket connections. |
| **Real-Time Comm.** | Socket.io / Pusher | For live chat, AI Bot typing indicators, and instant notifications. |
| **Search Engine** | Elasticsearch or Typesense | Fast geospatial search (finding nearby rescues) and full-text search across posts/products. |
| **Infrastructure** | Kubernetes / AWS (EKS) | Container orchestration for auto-scaling during traffic spikes. |
| **CDN & Security** | Cloudflare | DDoS protection, Web Application Firewall (WAF), and global content delivery. |

---

## 3. Core Domain Models (Entities)

### 3.1 User, Profile & Waitlist
- **Waitlist/Referral Entry:** `email`, `referralCodeUsed`, `position`, `status` (Pending, Invited, Active), `generatedReferralCodes[]`.
- **User Attributes:** `userId`, `fullName`, `email`, `passwordHash`, `avatarUrl`, `role` (User, Vet, Admin), `verifiedBadge`.

### 3.2 Posts & Feed (Social Core)
- **Attributes:** `postId`, `authorId`, `type` (Emergency, Adoption, Community, Fundraising), `content`, `mediaUrls[]`, `location` (GeoJSON).
- **Fundraising Specific:** `targetAmount`, `raisedAmount`, `paymentLinks`.

### 3.3 Marketplace
- **MarketplaceItem:** `itemId`, `sellerId`, `title`, `price`, `category`, `stockCount`, `images[]`, `rating`.
- **Order:** `orderId`, `buyerId`, `items[]`, `totalAmount`, `status`, `shippingAddress`.

### 3.4 Chat & AI Messages
- **Conversation:** `conversationId`, `participants[]`, `lastMessageAt`.
- **Message:** `messageId`, `conversationId`, `senderId`, `content`, `timestamp`.

---

## 4. Feature Modules & Implementation Directives

### Module 1: The Waitlist & Referral Gateway (Phase 1)
- **Features:** A high-converting landing page capturing emails for the waitlist. Users receive a position number. When admitted, they are given $N$ invite codes to refer trusted friends.
- **Web Adaptation:** Requires a fast, cacheable landing edge (Next.js Edge Runtime). Redis is highly recommended to manage waitlist position counters dynamically without hammering the primary database.

### Module 2: Authentication & Security
- **Features:** OAuth integration, JWT-based sessions, rate-limiting on login attempts, mandatory Email Verification for referred users.
- **Web Adaptation:** NextAuth.js for robust security. WAF integration to block malicious bot signups.

### Module 3: The Social Feed & Real-Time Sync
- **Features:** Infinite scrolling feed, segmented tabs, geolocation-based rescue tracking.
- **Web Adaptation:** React Query's `useInfiniteQuery` combined with WebSockets. 

### Module 4: Marketplace & Chat Ecosystem
- **Features:** E-commerce capabilities, peer-to-peer messaging, and the AI Vet Assistant.
- **Web Adaptation:** Persistent chat drawers, secure payment gateways (Stripe/SSLCOMMERZE), and streaming AI responses.

---

## 5. Scalability & Traffic Gradual Growth Strategy

To ensure stability during the "soft launch" and as the userbase accumulates:
1. **Gatekeeping via Referrals:** Limit initial signups to a hand-picked cohort. Each user receives exactly 3-5 single-use invite codes. This mathematically controls the growth rate curve and prevents sudden database overwhelming.
2. **Database Connection Pooling:** Implement PgBouncer (for PostgreSQL) to handle a high volume of concurrent connections efficiently.
3. **Aggressive Edge Caching:** Cache public profiles, successful adoptions, and resolved rescues at the CDN level (Cloudflare). Only dynamic feed generation should hit the application servers.
4. **Auto-Scaling Clusters:** Deploy backend services via Docker/Kubernetes. Configure Horizontal Pod Autoscalers (HPA) to spin up new instances automatically if CPU/Memory usage exceeds 70%.

---

## 6. Security, Stability & Advisory Protocol (DevSecOps Subagent)

To meet the requirement of active cyber-security and stability monitoring, a dedicated **Security & DevSecOps Subagent** protocol must be implemented. Crucially, this subagent must act not just as a monitor, but as an **Educational Advisor** to the project founders and development team.

**Behavioral & Advisory Directives for the Subagent:**
1. **Educational Reporting:** When a vulnerability or stability risk is found, the subagent must explain *what* the risk is, *why* it matters at scale, and *how* malicious actors could exploit it. Reports must be accessible, avoiding purely opaque technical jargon without context.
2. **Actionable Risk Assessment:** Always provide a "Risk Level" (Low/Medium/High/Critical) alongside the explanation, helping the team prioritize fixes.

**Technical Monitoring Directives:**
1. **Continuous Vulnerability Scanning:** 
   - Actively run `npm audit` or `snyk test` on all PRs.
   - *Advisory Role:* If a dependency is vulnerable to prototype pollution, the subagent will explain what prototype pollution is and why it could compromise user sessions.
2. **Static Application Security Testing (SAST):**
   - Enforce strict ESLint security plugins and scan for hardcoded secrets.
   - *Advisory Role:* Educate the team on the dangers of exposed environment variables in client-side bundles versus server-side code.
3. **Uptime & Performance Monitoring Integration:**
   - Integrate with tools like Sentry and Datadog/Prometheus.
   - *Advisory Role:* If latencies exceed 500ms, explain how connection pooling or missing database indexes might be causing the bottleneck.
4. **Load Testing Execution:**
   - Periodically execute automated load tests using tools like `Artillery` or `k6` to simulate expected traffic.
   - *Advisory Role:* Present load test results visually and explain concepts like "P99 latency" and what they mean for user experience during a traffic spike.
5. **Rate Limiting & Abuse Prevention:**
   - Continually review and test API endpoints to ensure strict rate limiters are applied on `/login`, `/register`, and `/send-message`.
   - *Advisory Role:* Explain the mechanics of brute-force attacks or credential stuffing and how exponential backoff or CAPTCHAs mitigate them.

---

## 7. Directory & Architecture Mapping (Flutter to Web)

| Mobile (Flutter) `lib/` | Web (Next.js) `src/` | Concept |
| :--- | :--- | :--- |
| **(New Feature)** | `app/(marketing)/waitlist/` | Waitlist & Referral Landing Page |
| `features/auth/` | `app/(auth)/login/` | Secure Authentication UI |
| `features/home/` | `app/(main)/feed/` | Main feed, interactions |
| `features/marketplace/` | `app/(main)/shop/` | E-commerce, cart, checkout |
| `features/chat/` | `app/(main)/messages/` | Chat UI, LLM integration |
| `services/` | `lib/api/`, `server/services/` | API abstraction, backend logic |
| `providers/` | `store/` (Zustand) | State management |

---
*Generated by Antigravity IDE Agent.*
*Context sourced from StrayCare Mobile Repository & Launch Requirements.*
