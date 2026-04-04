<p align="center">
  <img src="src/assets/images/Helink.png" alt="HeaLink Logo" width="120" />
</p>

<h1 align="center">HeaLink</h1>

<p align="center">
  A mobile application for mental health support — connecting patients with professional therapists and psychiatrists through teleconsultation, mood tracking, and personalized wellness tools.
</p>

---

## Features

- Teleconsultation via live video call with mental health professionals
- Mood tracker with daily emotional logging
- Appointment scheduling and consultation history
- Secure authentication and user profile management
- Push notifications for calls and reminders

---

## Tech Stack

| Library | Version | Purpose |
|---|---|---|
| `react-native` | 0.84.1 | Core mobile framework |
| `react` | 19.2.3 | UI library |
| `@react-navigation/native` | ^7.2.2 | Navigation container |
| `@react-navigation/native-stack` | ^7.14.10 | Stack navigator |
| `@react-navigation/bottom-tabs` | ^7.15.9 | Bottom tab navigator |
| `@react-navigation/drawer` | ^7.9.8 | Drawer navigator |
| `@stream-io/video-react-native-sdk` | ^1.31.1 | Video call (Stream) |
| `@stream-io/react-native-webrtc` | ^137.1.3 | WebRTC for video |
| `react-native-incall-manager` | ^4.2.1 | In-call audio/video management |
| `axios` | ^1.14.0 | HTTP client |
| `react-native-paper` | ^5.15.0 | Material Design UI components |
| `react-native-mmkv` | ^4.3.0 | Fast key-value storage |
| `react-native-reanimated` | ^4.3.0 | Animations |
| `react-native-gesture-handler` | ^2.31.0 | Gesture handling |
| `react-native-screens` | ^4.24.0 | Native screen optimization |
| `react-native-safe-area-context` | ^5.7.0 | Safe area insets |
| `react-native-linear-gradient` | ^2.8.3 | Gradient backgrounds |
| `react-native-svg` | ^15.15.4 | SVG support |
| `react-native-gifted-charts` | ^1.4.76 | Charts for mood analytics |
| `react-native-image-picker` | ^8.2.1 | Profile photo picker |
| `react-native-permissions` | ^5.5.1 | Runtime permission handling |
| `@notifee/react-native` | ^9.1.8 | Local push notifications |
| `@react-native-firebase/app` | ^24.0.0 | Firebase integration |
| `@react-native-community/netinfo` | ^12.0.1 | Network state detection |
| `lucide-react-native` | ^1.7.0 | Icon set |
| `react-native-dotenv` | ^3.4.11 | Environment variable management |

---

## Requirements

- Node >= 22.11.0
- React Native CLI
- Xcode (for iOS)
- Android Studio (for Android)

---

## Usage

### Install dependencies

```bash
npm install
# or
yarn install
```

### iOS setup

```bash
cd ios && pod install && cd ..
```

### Start Metro bundler

```bash
# Development
npm start

# Staging
npm run start:staging

# Production
npm run start:prod
```

### Run on iOS

```bash
# Development
npm run ios

# Staging
npm run ios:staging

# Production
npm run ios:prod
```

### Run on Android

```bash
# Development
npm run android

# Staging
npm run android:staging

# Production
npm run android:prod
```

### Build Android APK

```bash
# Staging
npm run build:android:staging

# Production
npm run build:android:prod
```

### Build Android AAB (Play Store)

```bash
# Staging
npm run build:aab:staging

# Production
npm run build:aab:prod
```

---

## Environment

Create environment files at the project root:

```
.env               # default
.env.staging       # staging
.env.production    # production
```
