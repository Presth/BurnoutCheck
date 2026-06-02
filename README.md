# BurnoutCheck

**Design and Implementation of an AI-Powered Mobile System for Student Burnout Assessment Using Behavioral Log Analysis**

A calm AI wellness companion for Nigerian university students. Built with React Native (Expo), Firebase, Google Sign-In, and OpenAI.

## Features

- Google Sign-In with persistent session
- Daily behavioral logging (study, sleep, stress, mood, workload, activity)
- Transparent burnout classification (3-tree ensemble inspired by Random Forest / Decision Trees)
- AI-generated wellness recommendations
- 7-day burnout trend chart
- Assessment history with expandable entries
- Downloadable PDF wellness report
- Daily reminder notifications
- Dark mode (follows system)
- Demo mode for defense presentations without backend setup

## Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile | React Native, Expo SDK 54, Expo Router |
| Auth | `@react-native-google-signin/google-signin`, Firebase Auth |
| Database | Cloud Firestore |
| AI | OpenAI API (`gpt-4o-mini`) |
| Charts | `react-native-chart-kit` |

## Quick Start (Demo Mode)

No Firebase required for exploration:

```bash
npm install
npx expo start
```

On the login screen, tap **Explore Demo Mode**. Sample logs and assessments are pre-loaded.

## Full Setup

### 1. Firebase

1. Create a project at [Firebase Console](https://console.firebase.google.com).
2. Enable **Authentication → Google** sign-in.
3. Create a **Firestore** database.
4. Deploy security rules from `firebase/firestore.rules`.
5. Add a **composite index** for queries (Firestore will prompt you):
   - `logEntries`: `userId` ASC, `createdAt` DESC
   - `assessments`: `userId` ASC, `createdAt` DESC

### 2. Google Sign-In (Android)

1. Add your Android app in Firebase with package `com.peakspot.burnoutcheck.app`.
2. Add the SHA-1 and SHA-256 fingerprints for the development/release keystore you use to build the app.
3. Download a fresh `google-services.json` into the project root after adding the fingerprints.
4. Enable **Authentication → Google** and copy that Firebase project's **Web client ID** into `.env` as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.

The Web client ID must belong to the same Firebase project as `google-services.json`. For this project, it should start with the Firebase project number from `google-services.json`.

### 3. Environment

```bash
cp .env.example .env
# Fill in all EXPO_PUBLIC_* values
```

### 4. Development Build

Google Sign-In requires native code — use a development build:

```bash
npx expo prebuild
npx expo run:android
```

Or with EAS:

```bash
eas build --profile development --platform android
```

### 5. OpenAI (Optional)

Add `EXPO_PUBLIC_OPENAI_API_KEY` for live AI recommendations. Without it, curated fallback tips are used.

## Project Structure

```
app/                    # Expo Router screens
  (auth)/login.tsx      # Welcome + Google Sign-In
  (app)/(tabs)/         # Dashboard, History, Profile
  (app)/log.tsx         # Daily behavioral log
  (app)/assessment.tsx  # Results screen
components/             # Reusable UI
context/AuthContext.tsx # Auth state
lib/burnoutClassifier.ts # ML-style assessment logic
services/               # Firebase, OpenAI, reports
firebase/               # Security rules
```

## Burnout Classification (Defense Notes)

The classifier runs **three independent decision trees** on behavioral features:

1. **Sleep & Stress tree** — sleep hours, quality, stress level
2. **Study & Workload tree** — study hours, assignment load, activity
3. **Mood & Balance tree** — mood, study/sleep ratio, combined stress-mood

Each tree outputs a score (0–100) and level (Low / Moderate / High). The final level uses **majority voting**; the score is the **average** across trees. Explanations list the top contributing factors in plain language.

## Screens

1. Splash — branded loading
2. Login — Google + demo mode
3. Dashboard — status, chart, quick log, wellness tip
4. Daily Log — 3-step engaging form
5. Assessment Result — score, badge, AI tips
6. History — past assessments with expand
7. Profile — reminders, report export, sign out

## Scripts

```bash
npm start          # Expo dev server
npm run android    # Run on Android
```

## Academic Disclaimer

BurnoutCheck is a student wellness tool for educational purposes. It does not provide medical diagnosis. Encourage users to seek professional support for serious mental health concerns.

## License

MIT — Final Year Project, 2026.
