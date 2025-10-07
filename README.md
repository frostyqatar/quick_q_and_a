# Quick Q&A Game - Mobile & Desktop Versions

A bilingual (Arabic/English) quiz game with two teams, timer, and moderator controls. Available in both desktop and mobile-optimized versions.

## Features

- **Two Team Competition**: Set up teams and compete in a quiz format
- **Timer System**: 60-second timer per question with pause/resume functionality
- **Media Support**: Images, videos, audio, and YouTube videos
- **Moderator Controls**: Full control over game flow and scoring
- **Responsive Design**: Automatic mobile detection and routing
- **Touch Optimized**: Mobile version with touch-friendly interactions

## File Structure

### Desktop Version
- `index.html` - Main game interface
- `admin.html` - Question management interface
- `script.js` - Desktop game logic
- `admin.js` - Admin panel logic
- `styles.css` - Desktop styling

### Mobile Version
- `mobile.html` - Mobile-optimized game interface
- `mobile.js` - Mobile game logic with touch support
- `mobile.css` - Mobile-specific styling

### Shared Assets
- `package.json` - Project configuration
- `Google_AI_Studio_2025-10-04T09_33_49.602Z.png` - Background image

## Mobile Features

The mobile version (`mobile.html`) includes:

- **No Scrolling**: Everything fits in viewport height
- **Touch Optimized**: Large touch targets and haptic feedback
- **Responsive Layout**: Optimized for iPhone and small screens
- **Swipe Gestures**: Touch navigation support
- **Auto-Detection**: Automatically redirects mobile users
- **Landscape Support**: Optimized for both orientations

## Usage

1. **Desktop**: Open `index.html` in a web browser
2. **Mobile**: Automatically redirected to `mobile.html` on mobile devices
3. **Admin**: Use `admin.html` to set up questions (works on both versions)

## Mobile Detection

The app automatically detects mobile devices using:
- User agent detection
- Screen width (≤768px)
- Touch capability detection
- Maximum touch points

## Browser Support

- **Desktop**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **Mobile**: iOS Safari, Chrome Mobile, Samsung Internet
- **Features**: ES6+ JavaScript, CSS Grid, Flexbox

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build (static files, no build step needed)
npm run build
```

## Mobile-Specific Optimizations

- Fixed viewport height to prevent scrolling
- Touch-friendly button sizes (minimum 44px)
- Haptic feedback on supported devices
- Optimized for one-handed use
- Landscape orientation support
- Prevented zoom on input focus
- Context menu disabled on long press

## Customization

Both versions share the same question data structure and can be customized by:
- Modifying CSS variables in the respective stylesheets
- Adding new media types in the QuestionParser class
- Extending the game logic in the controller classes
