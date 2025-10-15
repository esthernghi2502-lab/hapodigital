# HapoDigital Chrome Extension - Hướng dẫn phát triển

## 🎯 Tổng quan dự án

Chrome Extension v3 cho HapoDigital với các tính năng chính:
- ✅ Công cụ SEO analysis tích hợp
- 🔗 Backlink checker và suggestions  
- 📊 Performance monitoring
- 🎨 Widget floating SEO score
- 📞 Integration với dịch vụ HapoDigital

## 🏗️ Kiến trúc Extension

### Manifest V3 Structure
```
├── manifest.json          # Extension config (V3)
├── popup/                 # Popup interface
│   ├── popup.html        # Main UI
│   ├── popup.js          # UI logic & API calls
│   └── popup.css         # Styling
├── background/            # Service Worker
│   └── background.js     # Event handling, context menu
├── content/              # Content Scripts  
│   ├── content.js        # Page analysis, widget injection
│   └── content.css       # Widget & highlight styles
└── assets/               # Static resources
    └── icons/            # Extension icons
```

### Communication Flow
```
Popup ↔ Background ↔ Content Scripts
   ↓         ↓           ↓
Storage   Context      Page Analysis
          Menus        Widget Display
```

## 🛠️ Development Setup

### Prerequisites
```bash
# Node.js 14+
node --version
npm --version

# Chrome 88+
google-chrome --version
```

### Local Development
```bash
# Clone project
git clone <repository>
cd hapodigital

# Install dependencies (optional)
npm install

# Validate manifest
npm run validate

# Load extension in Chrome:
# 1. chrome://extensions/
# 2. Developer mode ON
# 3. Load unpacked → select folder
```

## 📝 Core Components

### 1. Popup Interface (popup/)

**popup.html**: Main UI với 3 tabs
- SEO Tools: Title, Meta, Headings, Images
- Backlink: Analysis, Opportunities, Services
- Analysis: Speed, Mobile, Structured Data

**popup.js**: Logic chính
```javascript
class HapoDigitalPopup {
  constructor() {
    this.setupTabSwitching();
    this.setupToolButtons();  
  }
  
  async checkTitleTags() {
    // Execute content script
    // Analyze title tag
    // Show results
  }
}
```

**popup.css**: Styling với HapoDigital branding
- Colors: #00B14F primary, gradients
- Fonts: Be Vietnam Pro
- Responsive design

### 2. Background Service Worker (background/)

**background.js**: Event handling
```javascript
class HapoDigitalBackground {
  init() {
    this.setupContextMenus();    // Right-click menu
    this.setupMessageListeners(); // Communication
    this.setupTabListeners();    // Tab events
  }
}
```

Key features:
- Context menu creation
- Cross-component communication  
- Tab event monitoring
- Analytics tracking

### 3. Content Scripts (content/)

**content.js**: Page analysis engine
```javascript
class HapoDigitalContent {
  init() {
    this.analyzePage();      // SEO analysis
    this.injectHapoWidget(); // Floating widget
    this.trackPageView();    // Analytics
  }
  
  analyzePage() {
    return {
      title: this.analyzeTitle(),
      meta: this.analyzeMeta(), 
      headings: this.analyzeHeadings(),
      images: this.analyzeImages(),
      // ... more analysis
    }
  }
}
```

**content.css**: Widget styling
- Floating SEO widget (position: fixed)
- Issue highlighting (.hapo-seo-highlight)
- Responsive & accessible design

## 🔧 Key Technologies

### Chrome APIs Used
```javascript
// Manifest V3 APIs
chrome.action          // Popup, badge, icon
chrome.storage         // Settings, history
chrome.scripting       // Content script injection  
chrome.contextMenus    // Right-click menu
chrome.tabs           // Tab management
chrome.notifications  // User notifications
```

### SEO Analysis Features
- **Title Tag**: Length, optimization, suggestions
- **Meta Description**: Length, presence, quality
- **Heading Structure**: H1-H6 hierarchy validation
- **Images**: Alt text analysis, size optimization
- **Links**: Internal/external ratio, anchor text
- **Structured Data**: JSON-LD, Microdata detection
- **Performance**: Script/CSS count, suggestions

### HapoDigital Integration
```javascript
// Service information
const services = {
  backlink: 'https://hapodigital.com/mua-backlink/',
  seo: 'https://hapodigital.com/dich-vu-seo/', 
  guestpost: 'https://hapodigital.com/dich-vu-guest-post/',
  pr: 'https://hapodigital.com/dich-vu-book-bai-pr/'
};

// Contact info
const contact = {
  phone: '0965899745',
  email: 'support@hapodigital.com',
  website: 'https://hapodigital.com'
};
```

## 📊 Data Management

### Chrome Storage Usage
```javascript
// Sync storage (settings, cross-device)
chrome.storage.sync.set({
  hapoSettings: {
    autoAnalyze: true,
    showWidget: true,
    theme: 'default'
  }
});

// Local storage (analysis history, cache)
chrome.storage.local.set({
  'analysis_123456': {
    url: 'https://example.com',
    seoScore: 85,
    timestamp: Date.now()
  }
});
```

### Analytics & Tracking
```javascript
// Event tracking
this.trackEvent('tool_used', {
  tool: 'title_check',
  url: window.location.href,
  score: result.score
});
```

## 🎨 UI/UX Guidelines

### Design System
- **Primary Color**: #00B14F (HapoDigital Green)
- **Secondary Colors**: #00a145, #00913d
- **Typography**: Be Vietnam Pro (Vietnamese optimized)
- **Spacing**: 8px grid system
- **Border Radius**: 8px standard

### Accessibility
- Proper ARIA labels
- Keyboard navigation support
- High contrast mode support
- Screen reader compatibility

### Responsive Design
```css
/* Mobile adjustments */
@media (max-width: 768px) {
  .hapo-widget-content {
    width: calc(100vw - 40px);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .animation { animation: none !important; }
}
```

## 🧪 Testing Strategy

### Manual Testing
1. **Cross-browser**: Chrome 88+, Edge 88+
2. **Cross-platform**: Windows, macOS, Linux
3. **Various websites**: Different CMSs, frameworks
4. **Performance**: Large pages, slow connections

### Automated Validation
```bash
# Manifest validation
npm run validate

# Create distribution package  
npm run package

# Lint code
npm run lint
```

### Test Cases
- [ ] Popup opens correctly
- [ ] All SEO tools function
- [ ] Widget displays on various sites
- [ ] Context menu works
- [ ] Storage saves/loads properly
- [ ] No console errors
- [ ] Performance acceptable

## 🚀 Deployment Process

### Development Build
```bash
# Validate all components
npm run validate

# Test in Chrome Developer mode
# chrome://extensions/ > Load unpacked
```

### Production Package
```bash
# Create distribution zip
npm run package

# Output: dist/hapodigital-v1.0.0.zip
# Ready for Chrome Web Store upload
```

### Chrome Web Store
1. **Prepare assets**:
   - Screenshots (1280x800, 640x400)
   - Promotional images
   - Store description

2. **Upload extension**:
   - ZIP file from npm run package
   - Complete store listing
   - Privacy policy, permissions explanation

3. **Review process**:
   - Google review (1-3 days typically)
   - Address any feedback
   - Publish when approved

## 📈 Performance Optimization

### Bundle Size
- Total size: ~2MB (including assets)
- Popup: ~50KB (HTML+CSS+JS)
- Content script: ~30KB
- Background: ~20KB

### Memory Usage
- Minimal DOM manipulation
- Efficient event listeners
- Proper cleanup on unload
- Lazy loading where possible

### Network Requests
- No external API calls by default
- All analysis done locally
- Optional: HapoDigital service integration

## 🔒 Security & Privacy

### Permissions Justification
```json
{
  "activeTab": "Read current page for SEO analysis", 
  "storage": "Save user settings and analysis history",
  "scripting": "Inject analysis code into pages",
  "tabs": "Manage tab information for context"
}
```

### Privacy Compliance
- No personal data collection
- Analysis performed locally
- Optional usage statistics (anonymized)
- Clear privacy policy

### Security Best Practices
- Input sanitization
- XSS prevention
- CSP headers
- Minimal permissions

## 📞 Support & Maintenance

### Bug Reporting
Users can report issues via:
- Email: support@hapodigital.com
- Facebook Group: https://facebook.com/groups/hapodigital
- Chrome Web Store reviews

### Update Process
1. **Version bump**: manifest.json version
2. **Test thoroughly**: All features, compatibility
3. **Package & upload**: Chrome Web Store
4. **Monitor**: User feedback, crash reports
5. **Hotfix if needed**: Critical issues

### Monitoring
- Chrome Web Store analytics
- User feedback tracking
- Error logging & reporting
- Performance metrics

---

**© 2025 HapoDigital Team** - Internal development documentation