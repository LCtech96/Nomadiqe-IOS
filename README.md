# Nomadiqe iOS - React Native App

Nomadiqe is a social platform that connects hosts, content creators, and service providers (jolly) for unique stays and collaborations worldwide.

## Features

- **Multi-Role System**: Support for Hosts, Creators, and Jolly (service providers)
- **Social Feed**: Post, like, comment, and share content
- **Property Exploration**: Interactive map to discover properties
- **Real-time Messaging**: Chat with other users and communities
- **Multilingual**: Support for Italian, English, Russian, French, and German
- **Dark Mode**: Native iOS dark mode support
- **Push Notifications**: Stay updated with real-time alerts

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation (Stack, Tabs, Modal)
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **State Management**: React Context API
- **UI Components**: Custom iOS-styled components
- **Maps**: react-native-maps
- **Forms**: react-hook-form + zod
- **Styling**: StyleSheet with iOS theme system
- **Package Manager**: pnpm

## Prerequisites

- Node.js >= 18
- pnpm >= 8
- Expo CLI
- iOS Simulator (macOS) or physical iOS device
- Supabase account and project

## Installation

1. **Clone the repository**

```bash
cd nomadiqe-ios
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Run the app**

```bash
# iOS Simulator (macOS only)
pnpm run ios

# Start development server
pnpm start
```

## Project Structure

```
nomadiqe-ios/
├── src/
│   ├── components/          # UI Components
│   │   ├── ui/             # Base components (Button, Input, Card, etc.)
│   │   └── custom/         # App-specific components
│   ├── screens/            # Screen components
│   │   ├── auth/           # Authentication screens
│   │   ├── onboarding/     # Onboarding flow
│   │   ├── home/           # Home feed
│   │   ├── explore/        # Map and property exploration
│   │   ├── profile/        # User profile
│   │   ├── dashboard/      # Role-specific dashboards
│   │   ├── messages/       # Messaging
│   │   └── communities/    # Community chats
│   ├── navigation/         # Navigation configuration
│   ├── services/           # API services (Supabase, Auth, Posts, etc.)
│   ├── contexts/           # React Context providers
│   ├── hooks/              # Custom hooks
│   ├── utils/              # Utility functions
│   ├── constants/          # App constants and translations
│   ├── types/              # TypeScript types
│   └── theme/              # iOS theme system (colors, typography, spacing)
├── assets/                 # Images, fonts, icons
├── App.tsx                 # App entry point
└── app.json               # Expo configuration
```

## Key Features Implementation

### Authentication
- Email/Password sign up and sign in
- Google OAuth integration
- Password reset via email
- Email verification

### Onboarding
- Role selection (Host, Creator, Jolly)
- Role-specific onboarding flows
- Profile setup

### Social Features
- Post creation with images and videos
- Like, comment, and share posts
- User profiles with followers/following
- Feed with infinite scroll

### Property Management (Hosts)
- List and manage properties
- Availability calendar
- Dynamic pricing
- Booking management

### Content Creation (Creators)
- Social media account linking
- Collaboration opportunities
- Analytics and performance tracking

### Services (Jolly)
- Service listings
- Request management
- Reviews and ratings

## Supabase Database Schema

The app requires the following main tables:
- `profiles` - User profiles and authentication data
- `posts` - Social feed posts
- `post_likes` - Post likes
- `post_comments` - Post comments
- `properties` - Host properties
- `bookings` - Property bookings
- `messages` - Direct messages
- `communities` - Community chats

Refer to the main web app repository for the complete SQL schema.

## iOS-Specific Features

- **Native Feel**: Components styled to match iOS Human Interface Guidelines
- **Haptic Feedback**: Touch feedback using Expo Haptics
- **Safe Area**: Proper handling of notch and home indicator
- **Animations**: Native slide and fade transitions
- **Icons**: SF Symbols style icons via Ionicons
- **Gesture Handler**: Native gesture support

## Localization

The app supports 5 languages:
- Italian (it) - Default
- English (en)
- Russian (ru)
- French (fr)
- German (de)

Translations are located in `src/constants/translations.ts`.

## Building for Production

### iOS Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |

## Development Workflow

1. Create a new branch for your feature
2. Implement your changes
3. Test on iOS Simulator and physical device
4. Submit a pull request

## Troubleshooting

### Metro bundler issues
```bash
pnpm start --clear
```

### iOS build fails
```bash
cd ios && pod install
cd .. && pnpm run ios
```

### Supabase connection issues
- Verify your `.env` file has the correct credentials
- Check Supabase project status
- Ensure RLS policies are configured

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

Proprietary - All rights reserved

## Support

For support, contact the development team or open an issue in the repository.
