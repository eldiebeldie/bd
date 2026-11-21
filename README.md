# 🎂 BD — Cross-Platform Birthday & Contacts Manager

Built with **React Native (Expo)** + **Electron** so you can develop on **Windows** and run seamlessly across:
- **Windows Desktop** (via Electron `.exe` or Web)
- **iOS (iPhone / iPad)** (live testing from Windows via **Expo Go**, cloud App Store builds via **EAS**)
- **Android** (live testing via **Expo Go** or Android Emulator, `.apk` / Play Store `.aab` builds)

---

## ✨ Features

- **Upcoming Birthdays Dashboard:** Sorted automatically by countdown (`🎉 Today!`, `🎂 Tomorrow`, `In X days`), with turning-age calculation, zodiac sign, relationship tags, and gift idea notes.
- **Multi-Source Contacts Integration (`🔄 Sync Contacts`):**
  1. **iOS & Android Native Address Book (`expo-contacts`):** Reads phone contacts with birthdays and lists contacts missing a birthday so you can assign one in a single tap.
  2. **vCard (`.vcf`) Import & Export:** Import `.vcf` files exported from **Google Contacts, Apple iCloud, or Microsoft Outlook** on Desktop or Mobile, or export your birthday list to `.vcf`.
  3. **Google Contacts (People API) & Microsoft Outlook (Graph API):** Direct cloud contact sync using OAuth 2.0 Bearer tokens.
- **Smart Reminders (`🔔 Reminders`):**
  - Native mobile local notifications via `expo-notifications` (7 days before, 1 day before, and 9:00 AM on the birthday).
  - Native Windows Desktop notifications via Electron / Web Notification API.
- **One-Tap Greetings:** Launch WhatsApp / SMS or pre-filled birthday emails directly from any birthday card.

---

## 🚀 Quick Start (Developing on Windows)

### 1. Run on iPhone (iOS), Android, and Web Browser
```bash
npm start
```
- **On your iPhone / Android phone:** Install **Expo Go** from the App Store / Google Play, and scan the QR code in the terminal.
- **In your browser:** Press `w` in the terminal (or run `npm run web`).

### 2. Run as a Native Windows Desktop App (Electron)
First export the web bundle (or have `npm run web` running on port `8081`), then launch Electron:
```bash
npm run web:export
npm run desktop
```

---

## 📦 Building Distributable Artifacts & Publishing to Stores

| Target Platform | Command | Output Artifact |
| :--- | :--- | :--- |
| **Windows Desktop (`.exe`)** | `npm run desktop:build` | Standalone Windows installer & portable `.exe` in `dist/` |
| **Web / PWA Static Bundle** | `npm run web:export` | Static web build in `dist/` |
| **Android (`.apk` / Play Store `.aab`)** | `npx eas-cli build --platform android` | Downloadable `.apk` or Play Store `.aab` |
| **iOS (TestFlight / App Store `.ipa`)** | `npx eas-cli build --platform ios` | Compiled on Expo's cloud macOS servers straight from Windows |
# 🎂 BD — Cross-Platform Birthday & Contacts Manager

Built with **React Native (Expo)** + **Electron** so you can develop on **Windows** and run seamlessly across:
- **Windows Desktop** (via Electron `.exe` or Web)
- **iOS (iPhone / iPad)** (live testing from Windows via **Expo Go**, cloud App Store builds via **EAS**)
- **Android** (live testing via **Expo Go** or Android Emulator, `.apk` / Play Store `.aab` builds)

---

## ✨ Features

- **Upcoming Birthdays Dashboard:** Sorted automatically by countdown (`🎉 Today!`, `🎂 Tomorrow`, `In X days`), with turning-age calculation, zodiac sign, relationship tags, and gift idea notes.
- **Multi-Source Contacts Integration (`🔄 Sync Contacts`):**
  1. **iOS & Android Native Address Book (`expo-contacts`):** Reads phone contacts with birthdays and lists contacts missing a birthday so you can assign one in a single tap.
  2. **vCard (`.vcf`) Import & Export:** Import `.vcf` files exported from **Google Contacts, Apple iCloud, or Microsoft Outlook** on Desktop or Mobile, or export your birthday list to `.vcf`.
  3. **Google Contacts (People API) & Microsoft Outlook (Graph API):** Direct cloud contact sync using OAuth 2.0 Bearer tokens.
- **Smart Reminders (`🔔 Reminders`):**
  - Native mobile local notifications via `expo-notifications` (7 days before, 1 day before, and 9:00 AM on the birthday).
  - Native Windows Desktop notifications via Electron / Web Notification API.
- **One-Tap Greetings:** Launch WhatsApp / SMS or pre-filled birthday emails directly from any birthday card.

---

## 🚀 Quick Start (Developing on Windows)

### 1. Run on iPhone (iOS), Android, and Web Browser
```bash
npm start
```
- **On your iPhone / Android phone:** Install **Expo Go** from the App Store / Google Play, and scan the QR code in the terminal.
- **In your browser:** Press `w` in the terminal (or run `npm run web`).

### 2. Run as a Native Windows Desktop App (Electron)
First export the web bundle (or have `npm run web` running on port `8081`), then launch Electron:
```bash
npm run web:export
npm run desktop
```

---

## 📦 Building Distributable Artifacts & Publishing to Stores

| Target Platform | Command | Output Artifact |
| :--- | :--- | :--- |
| **Windows Desktop (`.exe`)** | `npm run desktop:build` | Standalone Windows installer & portable `.exe` in `dist/` |
| **Web / PWA Static Bundle** | `npm run web:export` | Static web build in `dist/` |
| **Android (`.apk` / Play Store `.aab`)** | `npx eas-cli build --platform android` | Downloadable `.apk` or Play Store `.aab` |
| **iOS (TestFlight / App Store `.ipa`)** | `npx eas-cli build --platform ios` | Compiled on Expo's cloud macOS servers straight from Windows |
