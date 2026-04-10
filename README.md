# Nomadiqe iOS - React Native App

Nomadiqe is a social platform that connects hosts, content creators, and service providers (jolly) for unique stays and collaborations worldwide.

## Features

- **Multi-Role System**: Support for Hosts, Creators, and Jolly (service providers)
- **Social Feed**: Post, like, comment, and share content (with moderation hooks)
- **Property Exploration**: Interactive map to discover properties
- **KOL&BED**: Dedicated stack for hosts, creators, and jolly to discover profiles, swipe to match, and send collaboration requests
- **Host ↔ Creator collaboration**: Requests initiated by host or creator; host dashboard for pending requests, accept/reject/counter-offer; points for hosts on acceptance
- **Host property calendar**: Per-structure availability and pricing; sync with Airbnb/Booking via iCal; statuses: free, booked (occupied), closed, collaboration slots
- **Creator collaboration requests**: When a creator requests a host, they pick an active property and select dates on that property’s calendar (read-only availability); dates are stored as `preferred_dates_from` / `preferred_dates_to` and in `request_extras` (`property_id`, `requested_dates`)
- **Traveler booking links** (host): Generate shareable links for travelers (suggested dates, structure)
- **Real-time Messaging**: Chat with other users
- **Multilingual**: Italian, English, and additional locales via `translations-locales.ts`
- **Dark Mode**: Native iOS dark mode support
- **Push Notifications**: Stay updated with real-time alerts
- **Support tickets**, **affiliate links**, **admin** tools (where enabled)

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

## Supabase SQL scripts

Apply migrations in the Supabase **SQL Editor** as needed. Important files under `scripts/`:

| Area | Scripts (examples) |
|------|-------------------|
| Core / profiles | `supabase-trigger-new-user-profile.sql`, `supabase-host-creator-moderation.sql` |
| Avatars & **host calendar** | `supabase-avatars-and-host-calendar.sql` — creates `property_availability`, RLS, and extends `status` to include `closed` and `collab_available` |
| Availability status (legacy DBs) | `supabase-availability-status-extend.sql` — use if an older DB only allowed `available` / `occupied` (required for “Chiusa” and “Collaborazioni” saves) |
| Collaboration | `supabase-collaboration-initiated-by-and-points.sql`, `supabase-collaboration-request-details-and-notification.sql`, `supabase-collaboration-request-extras.sql` |
| Property media | `supabase-storage-buckets.sql`, `supabase-property-media-moderation.sql`, `supabase-property-media-approve-rpc.sql` |
| Calendar sync (iCal) | `supabase-property-calendar-sync.sql` + Edge Function `sync-property-calendar` (see `docs/calendar-sync-edge-function.md`) |
| Traveler links | `supabase-traveler-booking-links.sql` |
| Other | notifications, messages policies, jolly products, support tickets, etc. |

**Note:** If saving host calendar states **Closed** or **Collaborations** fails with a check constraint error, run `supabase-availability-status-extend.sql` (or re-apply the `ALTER TABLE` block from `supabase-avatars-and-host-calendar.sql`).

## Project Structure

```
nomadiqe-ios/
├── src/
│   ├── components/          # UI Components
│   │   ├── ui/             # Base components (Button, Input, Card, etc.)
│   │   └── custom/         # App-specific components
│   ├── screens/            # Screen components
│   │   ├── auth/           # Authentication screens
│   │   ├── onboarding/     # Onboarding flow (host/creator/jolly)
│   │   ├── home/           # Home feed, posts, comments
│   │   ├── explore/        # Map and property exploration
│   │   ├── profile/        # Profile, dashboard, settings, collaboration detail
│   │   ├── kolbed/         # KOL&BED discovery & collaboration request sheet
│   │   ├── host/           # Host structure & calendar
│   │   ├── jolly/          # Jolly-specific screens
│   │   ├── property/       # Property flows
│   │   ├── messages/       # Messaging
│   │   └── ...
│   ├── navigation/         # Navigation configuration
│   ├── services/           # API services (Supabase): auth, posts, properties, collaboration, etc.
│   ├── contexts/           # React Context providers
│   ├── hooks/              # Custom hooks
│   ├── utils/              # Utility functions
│   ├── constants/          # App constants and translations
│   ├── types/              # TypeScript types
│   └── theme/              # iOS theme system (colors, typography, spacing)
├── scripts/                # Supabase SQL migrations and utilities
├── docs/                   # Additional documentation
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
- Role-specific onboarding flows (including host property steps, KOL&BED program, jolly subcategory)
- Profile setup

### Social Features
- Post creation with images and videos
- Like, comment, and share posts
- User profiles with followers/following
- Feed with infinite scroll

### Property Management (Hosts)
- List and manage properties
- **Availability calendar** (`HostStructureScreen`): month grid, legend, multi-select for batch edit, modal for status + optional price override
- External calendar import (Airbnb/Booking iCal) marking dates as booked
- Photo/video uploads with moderation pipeline where configured

### KOL&BED & collaboration
- Profile cards with filters (creator / jolly / all)
- **Collaboration request sheet** (`CollaborationRequestSheet`): optional flight coverage, linked jolly experiences, notes; for **creator → host**, property picker + calendar + selected dates persisted via `CollaborationService.creatorRequestCollaborationWithExtras`
- **Host** pending requests, detail screen with dates and extras, accept/reject/counter-offer flows

### Content Creation (Creators)
- Social media account linking
- Collaboration opportunities via KOL&BED
- Analytics-oriented profile fields where shown

### Services (Jolly)
- Service listings / products (where implemented)
- Ratings from hosts after collaborations

## Supabase Database Schema

The app uses tables including (non-exhaustive):

- `profiles` — User profiles and roles
- `posts`, `post_likes`, `post_comments` — Social feed
- `properties`, `property_availability` — Host listings and per-day availability
- `host_creator_collaboration_requests` — Collaboration requests (including `initiated_by`, `request_extras`, `preferred_dates_from` / `preferred_dates_to`)
- `messages`, notifications, support tickets — as configured

See `scripts/` for DDL and policies. The web repository may contain additional schema overlap.

## iOS-Specific Features

- **Native Feel**: Components styled to match iOS Human Interface Guidelines
- **Haptic Feedback**: Touch feedback using Expo Haptics
- **Safe Area**: Proper handling of notch and home indicator
- **Animations**: Native slide and fade transitions
- **Icons**: SF Symbols style icons via Ionicons
- **Gesture Handler**: Native gesture support

## Localization

Primary strings live in `src/constants/translations.ts` (Italian and English fully maintained); additional languages are in `src/constants/translations-locales.ts`.

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
4. Apply matching Supabase SQL migrations when schema changes
5. Submit a pull request

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

### Host calendar: cannot save “Closed” or “Collaborations”
- Run `scripts/supabase-availability-status-extend.sql` in the Supabase SQL Editor (see **Supabase SQL scripts** above).

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
