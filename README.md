# Smart Meter Management Frontend (SMA)

This project is the cross-platform mobile and web application for the Smart Meter Management platform. It is built using **React Native** and **Expo Router**.

## 🛠 Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) / [Expo](https://expo.dev/)
- **Styling**: [NativeWind v4](https://www.nativewind.dev/) (Tailwind CSS) & [React Native Paper](https://callstack.github.io/react-native-paper/)
- **Authentication**: [Clerk](https://clerk.dev/)
- **State Management**: [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)
- **Data Fetching**: Axios
- **Data Visualization**: [Victory Native](https://formidable.com/open-source/victory/)

## 🚀 Getting Started

### Prerequisites

Ensure you have **Node.js** and **pnpm** installed on your system.

### Installation

Navigate to the project directory and install dependencies:
```bash
cd d:/PTU/sma_exp/sma
pnpm install
```

### Running the App

Start the development server:
```bash
pnpm start
```

You can also run directly on specific platforms:
- **Android**: `pnpm android` 
- **iOS**: `pnpm ios`
- **Web**: `pnpm web`

## 📂 Project Structure

- `/app`: Expo Router file-based routing.
- `/components`: Reusable UI components.
- `/context`: Global contexts (e.g. Auth).
- `/hooks` & `/stores`: Shared state management and reusable logic.
- `/api`: Network layer for fetching from the `smartMettr` backend.
- `/lib`: Helper utilities and configurations.

## 🔒 Authentication & Theming

This application implements secure authentication via Clerk integration. The UI comprises modern layouts featuring React Native Paper components configured correctly to fix cross-platform scrolling within `PaperProvider`.
