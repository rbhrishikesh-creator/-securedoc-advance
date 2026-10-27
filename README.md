# SecureDoc Advanced

**Enterprise-Grade Secure Document Management & Real-Time Collaboration Platform**

SecureDoc Advanced is a production-ready document custody and collaboration platform featuring AES-256-GCM envelope encryption, granular Role-Based Access Control (RBAC), atomic single-use verification tokens, linear immutable version lineage with one-click non-destructive rollback, real-time collaboration via Socket.IO, Redis rate-limiting/caching, and MongoDB document metadata storage.

---

## 🌟 Key Highlights

- 🛡️ **AES-256-GCM Zero-Plaintext Cryptography**: Files are encrypted with 256-bit AES-GCM and unique initialization vectors (IVs) per operation. Authentication tags and SHA-256 integrity checksums guarantee tamper detection. Plaintext is never stored on disk.
- ✉️ **Atomic Email Verification & Auth**: JWT-based session management, bcrypt password hashing, and atomic Redis-backed single-use verification tokens (prevents concurrent replay attacks).
- 📜 **Complete Version Lineage & Non-Destructive Restore**: Uploading a replacement creates a new version while preserving complete immutable history. One-click rollback restores prior versions by publishing a new version stamped with audit provenance.
- 👥 **Granular Access Control**: Organization and user document sharing with `Owner`, `Editor`, and `Viewer` permission levels strictly verified on the backend for all upload, download, rename, and delete actions.
- ⚡ **Real-Time Collaboration with Socket.IO**: Live document status changes, instant comments, user presence, and share notifications delivered without polling.
- 🚦 **Redis Integration**: Login rate limiting, verification token rate limiting, and fast cache eviction, with an intelligent in-memory fallback for immediate zero-config local testing.
- 📊 **Security Audit Logging & Admin Dashboard**: Complete audit trail of views, decrypted downloads, share grants, and permission revocations, alongside administrative account suspension and failed-login telemetry.
- 🎨 **State-of-the-Art Responsive UI**: Modern glassmorphic interface with dark/light themes, drag-and-drop uploads, version timelines, real-time comment threads, and responsive controls.

---

## 🏗️ Technology Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite | Modern, responsive, type-safe single-page application |
| **Icons & Styling** | Lucide React, Custom CSS Design System | Sleek dark/light theme, glassmorphic UI, responsive layout |
| **Backend** | Node.js, Express.js, TypeScript | REST API gateway, authentication, and document processing |
| **Database** | MongoDB (Mongoose) | Users, documents, folders, versions, comments, audit logs |
| **Caching & Tokens** | Redis (`ioredis` with memory fallback) | Rate limiting, atomic single-use tokens, metadata caching |
| **Real-time** | Socket.IO (Client & Server) | Instant document updates, comments, and collaboration alerts |
| **Encryption** | Node.js `crypto` (AES-256-GCM) | Envelope encryption, tamper-evident auth tags, SHA-256 |
| **Email Delivery** | Nodemailer (SMTP / Ethereal) | Secure email verification & password reset flows |
| **File Handling** | Multer | Multipart secure streaming and upload validation |
| **Testing** | Vitest (Frontend), Jest & Supertest (Backend) | Unit tests, cryptographic tests, API integration tests |
| **Containers** | Docker & Docker Compose | Multi-container orchestration (Mongo, Redis, API, Client) |

---

## ⚡ Instant One-Click Startup & Availability Guardian

To make SecureDoc instantly accessible whenever you want:

1. **Double-Click Launcher**: Double-click [`start-securedoc.bat`](file:///C:/Users/HRISHIKESH/.gemini/antigravity-ide/scratch/securedoc-advanced/start-securedoc.bat)
   - Automatically verifies MongoDB
   - Starts Express Backend (port 5050) & Vite Frontend (port 5174)
   - Auto-opens the application in your browser: **http://localhost:5174**
2. **System Health Check**: Double-click [`status-securedoc.bat`](file:///C:/Users/HRISHIKESH/.gemini/antigravity-ide/scratch/securedoc-advanced/status-securedoc.bat)
3. **Clean Shutdown**: Double-click [`stop-securedoc.bat`](file:///C:/Users/HRISHIKESH/.gemini/antigravity-ide/scratch/securedoc-advanced/stop-securedoc.bat)

Or from terminal in the project root:
```bash
npm start      # Starts all services and opens the browser
npm run status # Prints live health status
npm run stop   # Clean shutdown
```

---

## 🚀 Quick Start with Docker Compose

To spin up all services (MongoDB, Redis, Express Backend, and React Client):

```bash
docker compose up --build
```

- **Web Application**: [http://localhost:5173](http://localhost:5173)
- **REST API Server**: [http://localhost:5000](http://localhost:5000)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 💻 Standalone Local Setup

### Prerequisites
- Node.js 18+ and npm
- (Optional) Local MongoDB & Redis instances (or use the built-in resilient in-memory fallbacks)

### 1. Backend Setup
```bash
cd server
npm install
npm test          # Run crypto, token, and API test suites
npm run dev       # Starts Express API & Socket.IO server on port 5000
```

### 2. Frontend Setup
```bash
cd ../client
npm install
npm run dev       # Starts Vite dev server on port 5174
```

---

## 📱 Cross-Platform Multi-Device Architecture (Mobile & Desktop)

SecureDoc Advanced is engineered to run seamlessly across laptops, desktops, tablets, and mobile phones with dedicated platform features:

### 💻 Laptop & Desktop (Windows, macOS, Linux)
1. **1-Click Progressive Web App (PWA)**:
   - Open [http://localhost:5174](http://localhost:5174) in Chrome, Edge, or Brave.
   - Click the **"Install App"** button in the header (or address bar).
   - Pins to your Start Menu, Taskbar, or Applications folder, and launches in a dedicated, distraction-free desktop window.
2. **Native Electron Desktop App**:
   - `cd client && npm run electron:dev`
   - Launches a native desktop window with hardware acceleration and deep OS integration.

### 📱 Mobile (Android & iOS)
1. **Instant Phone Access via Local Wi-Fi**:
   - In the web app, click **"Get App"** to view the auto-generated live QR code.
   - Scan with your phone's camera (or open `http://<your-lan-ip>:5174`).
   - The UI automatically activates mobile view with touch haptics, bottom navigation bar, floating action buttons, and responsive cards.
2. **Native Android Project (Capacitor)**:
   - Full Android Studio project initialized in `client/android/`.
   - Open in Android Studio: `cd client && npx cap open android`
   - Build debug APK: `cd client/android && ./gradlew assembleDebug`
3. **iPhone / iPad (iOS Safari)**:
   - Open the web URL in Safari → Tap the **Share** button → Tap **"Add to Home Screen"**.


---

## 🔐 Cryptographic Architecture

```
[Client Upload] ──> [Multer Memory Buffer]
                          │
                          ▼
            [AES-256-GCM Cipher Engine]
            - Generates unique 12-byte IV
            - Derives master KEK / file DEK
            - Computes SHA-256 plaintext checksum
                          │
                          ▼
            ┌─────────────┴─────────────┐
            ▼                           ▼
[Encrypted Payload Disk Storage]   [MongoDB Metadata]
- <fileKey>.enc                    - IV (hex)
- Zero plaintext on disk           - Auth Tag (16 bytes)
                                   - SHA-256 Checksum
                                   - Version Lineage
```
