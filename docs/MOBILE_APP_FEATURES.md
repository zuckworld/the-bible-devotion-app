# Heart to Heart Mobile App Features

This document describes the current feature surface of the Heart to Heart Bible and devotional mobile app.

## App Access and Onboarding

- Splash screen and app startup flow.
- Onboarding flow for first-time users.
- Guest access to the free Bible and devotional experience.
- Account creation and sign-in flow.
- Server-backed login with access-token storage.
- Logout and session reset.
- Profile display name and account information.
- Persistent navigation state restoration.

## Main Navigation

The bottom navigation bar provides six primary destinations:

- Home
- Bible
- Hymns
- Search
- Devotionals
- Profile

A persistent mini audio player can appear above the bottom navigation while a track is selected.

## Home

- Personalized greeting using the current profile name.
- Current date display.
- Weekly activity rail.
- Daily devotional preview.
- Open the current devotional for full reading.
- Open the audio flow for the current devotional.
- Continue-reading card based on Bible history.
- Spiritual activity streak counter and progress indicator.
- Prayer focus shortcut.
- Recently played audio shortcut.
- Search shortcut for Bible, devotional, audio, and notes content.
- Verse-of-the-day preview.
- Offline mode and downloads shortcut.
- Notification shortcut.

## Bible

- Local KJV Bible library bundled with the app for offline access.
- Bible book list with book search.
- Chapter navigation.
- Bible reading screen with verse-by-verse layout.
- Translation selection using the backend Bible library when available.
- Fallback to the bundled KJV library when remote content is unavailable.
- Reading history.
- Continue-reading support from the Home screen.
- Adjustable reading font size.
- Paper, sepia, and night reading themes.
- Verse bookmarks.
- Verse highlights.
- Bible passage downloads for offline reference.
- Bible notes with local persistence and best-effort backend synchronization.
- Text-to-speech reading for Bible passages through the device speech engine.
- Reader controls for previous and next chapters.

## Devotionals

- Devotional library and devotional browsing.
- Daily devotional loading from the devotional API.
- Monthly devotional browsing.
- Devotional detail view with:
  - Date
  - Title
  - Reference verse
  - Full devotional body
  - Confession section when available
  - Prayer section when available
  - Reading-time estimate
- Record devotional reading history.
- Save devotional bookmarks/favorites.
- Download devotionals for local access.
- Share devotional content.
- Open the selected devotional in the audio flow.
- Device text-to-speech for devotional content.
- Search devotionals by title, verse, body, confession, and prayer.

## Hymns

- Bundled hymn library.
- Hymn search.
- Search by title, composer, story, and lyrics.
- Hymn list with author/composer information.
- Hymn story and background information.
- Full hymn detail screen.
- Lyrics display.
- Navigation to hymn details from the Hymns tab and Search screen.
- Public-domain hymn content for the current library.
- Hymn audio is intentionally out of scope for the current version.

## Search

- Local Bible verse search.
- Search across bundled Bible content.
- Search devotional titles and content.
- Search hymn titles, composers, stories, and lyrics.
- Search saved notes.
- Search recently played audio metadata.
- Result cards that open the relevant Bible reading, devotional detail, hymn detail, or audio player screen.
- Scrollable results view for large result sets.
- Minimum two-character search threshold.

## Audio and Text-to-Speech

- Audio library screen for available text-based audio content.
- Selected devotional appears as the primary audio entry.
- No generic mock audio tracks are used in the active audio flow.
- Audio player screen with:
  - Play
  - Pause
  - Resume
  - Stop through the close/clear action
  - Rewind 15 seconds control
  - Fast-forward 30 seconds control
  - Progress bar
  - Playback speed controls: 0.75x, 1x, 1.25x, 1.5x, and 2x
  - Audio download toggle
- Device-native text-to-speech through `expo-speech`.
- Speech continues when leaving the full player screen.
- Mini-player shown above the bottom navigation while a track is selected.
- Mini-player play/pause control.
- Mini-player close control.
- Shared playback state and estimated progress tracking.
- Recently played audio list.
- Audio content can be opened from Search and Home shortcuts.

## Profile and Personal Tools

- Profile identity and display name.
- Reading activity statistics.
- Favorites/bookmarks view.
- Downloads view combining:
  - Bible passages
  - Devotionals
  - Audio tracks
- Reading statistics.
- Prayer journal with saved prayer entries.
- Saved Bible notes.
- Notification preference view.
- App settings.
- Audio Library shortcut.
- Monthly Devotionals shortcut.
- FAQ shortcut.
- Connect With Us shortcut.
- Support and donation flow.
- Manage recurring gifts.
- Change password entry point.
- Edit profile entry point.
- Logout.

## Support and Communication

- FAQ screen.
- Connect With Us contact screen.
- Contact message API integration.
- Support FAQ API integration.
- Support log API integration.
- Donation flow with one-time and recurring gift options.
- Donation provider and payment-options loading.
- Manage recurring gifts and cancellation flow where supported by the backend.

## Offline and Local Persistence

The app uses AsyncStorage-backed state for:

- Session information.
- Subscription state retained for compatibility with the existing architecture.
- Bible preferences, bookmarks, highlights, notes, history, and downloads.
- Audio playback state, downloads, and recently played tracks.
- Profile preferences and prayer journal entries.
- Devotional reading history, bookmarks, and downloads.
- Navigation state restoration.

## Theme and Accessibility-Related Controls

- Light/paper, sepia, and night Bible reading themes.
- Bible font-size controls.
- Accessible icon labels for key audio and download controls.
- Scrollable layouts for long Bible, devotional, hymn, search, and profile content.
- Responsive Expo web support in addition to native mobile targets.

## Current Free-Version Notes

- The app is currently configured as a free experience.
- Upgrade and subscription controls are not presented in the Profile screen.
- Bible, devotional, hymn, search, download, and device text-to-speech features are available without a premium paywall in the current app flow.
- Backend-dependent content falls back to local or empty states when the API is unavailable.

## Implementation Notes and Limitations

- Bible translations other than the bundled KJV depend on backend availability and local caching behavior.
- Native text-to-speech progress is estimated from text length because reliable word-level timing is not available across platforms.
- Audio playback currently uses device text-to-speech rather than recorded audio files.
- Hymn audio is not part of the current version; lyrics and stories are supported.
- Some utility screens are intentionally lightweight placeholders for future backend workflows.
