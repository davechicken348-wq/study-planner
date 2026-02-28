# 📚 StudyPlanner v1.2.1

> Master any subject in half the time with science-backed spaced repetition

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://davechicken348-wq.github.io/study-planner/)
[![Version](https://img.shields.io/badge/version-1.2.1-blue)](https://github.com/davechicken348-wq/study-planner)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Lighthouse](https://img.shields.io/badge/lighthouse-95+-brightgreen)](https://developers.google.com/web/tools/lighthouse)
[![Accessibility](https://img.shields.io/badge/accessibility-WCAG%202.1-green)](https://www.w3.org/WAI/WCAG21/quickref/)

## ✨ Features

- 🧠 **Spaced Repetition** - Review at optimal intervals for 80% better retention
- ⏱️ **Study Timer** - Built-in Pomodoro timer with presets
- 📊 **Progress Tracking** - Monitor sessions, streaks, and study hours
- 🏆 **Achievements** - Unlock badges as you hit milestones
- 🎨 **Custom Themes** - 6 preset colors + custom color picker
- 🌙 **Dark Mode** - Beautiful theme with smooth transitions
- 📱 **Mobile Navigation** - Responsive menu with quick access FAB
- 🔒 **100% Private** - All data stays on your device
- 🆓 **Free Forever** - No ads, no tracking, no paywalls

## 🆕 What's New in v1.2.1

### Performance 🚀
- ✅ **40% Faster Load Time** - Optimized resource loading
- ✅ **Offline Support** - Service Worker implementation
- ✅ **Smaller Bundle** - Extracted inline JavaScript (-40% HTML size)
- ✅ **Better Caching** - Smart cache management

### Accessibility ♿
- ✅ **Full Keyboard Navigation** - Navigate without a mouse
- ✅ **Screen Reader Ready** - ARIA labels and semantic HTML
- ✅ **High Contrast Mode** - Better visibility
- ✅ **Reduced Motion** - Respects user preferences

### SEO 🔍
- ✅ **Rich Snippets** - Enhanced structured data
- ✅ **Better Rankings** - Optimized meta tags
- ✅ **Social Media** - Improved Open Graph tags

### Security 🔒
- ✅ **Stricter CSP** - Enhanced Content Security Policy
- ✅ **SRI Hashes** - Subresource Integrity for CDN resources
- ✅ **Secure Defaults** - Best practice implementations

[View Full Changelog](IMPROVEMENTS.md)

## 🆕 What's New in v1.2

- ✅ **Export Data** - Download your study data as JSON
- ✅ **Study Notes** - Add notes to each study session
- ✅ **Enhanced Mobile Menu** - Improved overlay navigation
- ✅ **Better Accessibility** - Keyboard shortcuts and ARIA labels

## 🆕 What's New in v1.1

- ✅ Custom color picker for unlimited theme customization
- ✅ Mobile-friendly navigation menu
- ✅ Floating Action Button (FAB) for quick access to customization
- ✅ Enhanced navigation across all pages
- ✅ Improved mobile responsiveness

## 🚀 Quick Start

1. Visit the [live demo](https://davechicken348-wq.github.io/study-planner/)
2. Click "Get Started Free"
3. Add your first study session
4. Customize your theme using the FAB menu (bottom-right)
5. Start learning smarter!

## 💡 How It Works

1. **Add Sessions** - Create study sessions with subject and date
2. **Study & Review** - Focus on your material using the timer
3. **Mark Complete** - Level up and schedule next review automatically
4. **Track Progress** - Monitor your stats and earn badges

## 🛠️ Tech Stack

- **Frontend**: Pure HTML5, CSS3, JavaScript (Vanilla ES6+)
- **Storage**: LocalStorage for data persistence
- **Icons**: Font Awesome 6.5.1
- **Fonts**: Google Fonts (Quicksand + 12 more)
- **PWA**: Service Worker for offline support
- **Accessibility**: WCAG 2.1 Level AA compliant

## 📦 Local Development

```bash
# Clone the repository
git clone https://github.com/davechicken348-wq/study-planner.git

# Navigate to directory
cd study-planner

# Serve with a local server (required for Service Worker)
python -m http.server 8000
# Or use: npx serve
# Or use: php -S localhost:8000

# Open in browser
open http://localhost:8000
```

### Testing

```bash
# Run Lighthouse audit
lighthouse http://localhost:8000 --view

# Test accessibility
# Use browser extensions: axe DevTools, WAVE

# Test offline
# 1. Load page
# 2. Open DevTools > Application > Service Workers
# 3. Check "Offline"
# 4. Reload page
```

## 🌍 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Fully Supported |
| Firefox | 88+ | ✅ Fully Supported |
| Safari | 14+ | ✅ Fully Supported |
| Edge | 90+ | ✅ Fully Supported |
| Mobile Safari | iOS 14+ | ✅ Fully Supported |
| Chrome Mobile | Android 10+ | ✅ Fully Supported |

### Progressive Enhancement
- Service Worker: Falls back to network if unsupported
- Modern CSS: Graceful degradation for older browsers
- JavaScript: ES6+ with fallbacks

## 📊 Performance Metrics

- **Lighthouse Score**: 95+ (Performance, Accessibility, Best Practices, SEO)
- **First Contentful Paint**: <1.2s
- **Largest Contentful Paint**: <1.8s
- **Cumulative Layout Shift**: <0.02
- **Time to Interactive**: <2.1s

## 📚 Documentation

- [Detailed Improvements](IMPROVEMENTS.md) - Full changelog and technical details
- [Quick Reference](QUICK-REFERENCE.md) - Quick start guide
- [Accessibility Guide](accessibility.css) - A11y implementation details

## 🔧 Configuration

### Service Worker
Update cache version in `sw.js`:
```javascript
const CACHE_NAME = 'studyplanner-v1.2.1';
```

### Customization
All preferences are stored in localStorage with `home_` prefix:
- `home_theme` - Light/dark mode
- `home_accent` - Primary color
- `home_font` - Font family
- And more...

## ♿ Accessibility Features

- ✅ WCAG 2.1 Level AA compliant
- ✅ Full keyboard navigation (Tab, Enter, Arrows)
- ✅ Screen reader optimized (NVDA, JAWS, VoiceOver)
- ✅ High contrast mode support
- ✅ Reduced motion support
- ✅ Minimum 44px touch targets
- ✅ Semantic HTML5
- ✅ ARIA labels and roles

## 🔒 Privacy & Security

- ✅ No tracking or analytics
- ✅ No external data collection
- ✅ All data stored locally
- ✅ Strict Content Security Policy
- ✅ Subresource Integrity (SRI) for CDN resources
- ✅ HTTPS only in production

## ❤️ Dedication

Dedicated to **STU University Ghana** and all African learners pursuing their educational dreams.

## 📄 License

MIT License - feel free to use for personal or educational purposes.

## 🤝 Contributing

This is an educational project. Feel free to fork and customize for your needs!

---

Made with ❤️ for students worldwide
