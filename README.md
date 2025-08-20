# SummerSchools Web Application

A comprehensive web application that replicates the SummerSchools.com dashboard design and functionality, featuring multi-step forms, provider management, and automated web scraping capabilities.

## 🌟 Features

### Main Application
- **Multi-step Course Creation Form** with progress indicators
- **Dashboard** displaying course cards with SummerSchools styling
- **Provider Management** with exact field structure from original site
- **Profile Page** with personal info, account settings, and notifications
- **Responsive Design** matching original SummerSchools color scheme and typography

### Design Fidelity
- **Exact Font Matching**: Open Sans + Domine fonts extracted from original
- **Color Palette**: Authentic SummerSchools colors (#FF6A3C primary, #182236 secondary)
- **Form Structure**: Identical field names, placeholders, and validation
- **Navigation**: Fully functional sidebar and top navigation

### Automation Tools
- **Puppeteer Web Scraping** for design analysis and data extraction
- **Automated Course Creation** with form filling capabilities
- **Font Extraction** tools to match original typography
- **Design Analysis** scripts for comprehensive style extraction

## 🚀 Live Demo

Visit the live application: [SummerSchools Web App](https://yourusername.github.io/summerschools-web-app/)

## 🛠️ Local Development

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/summerschools-web-app.git
cd summerschools-web-app

# Install dependencies
npm install

# Open the application
open index.html
# or serve with a local server
npx serve .
```

## 📁 Project Structure

```
├── index.html                          # Main application (GitHub Pages entry point)
├── summerschools-multi-step-app.html   # Original application file
├── package.json                        # Node.js dependencies
├── extract-fonts.js                    # Font extraction from original site
├── analyze-summerschools.js             # Comprehensive design analysis
├── check-provider-design.js             # Provider form structure extractor
└── automation-scripts/
    ├── create-banana-course.js          # Automated course creation
    ├── final-banana-course.js           # Advanced course automation
    └── ultimate-banana-course.js        # Complete automation workflow
```

## 🎨 Design Elements

### Typography
- **Primary Font**: Open Sans (body text, forms, buttons)
- **Heading Font**: Domine (titles, headings)
- **Extracted Sizes**: 14px base, 36px H1, 24px H2, 18px H3

### Color Scheme
```css
--primary-color: #FF6A3C    /* SummerSchools Orange */
--secondary-color: #182236   /* Dark Navy */
--text-color: rgb(55, 57, 61) /* Body Text */
--background-color: #F1DDC6  /* Light Cream */
```

## 🔧 Features Overview

### Dashboard
- Course card display with hover effects
- "Create new course" button with matching styling
- Responsive grid layout

### Multi-Step Course Form
1. **Basic Course Info**: Name, details, location
2. **Course Logistics**: Accommodation, tuition, activities  
3. **Pricing & Enrollment**: Fees, duration, dates, age ranges
4. **Contact Information**: Email, provider link

### Provider Management
- Exact field structure from SummerSchools.com
- School information, program details, media uploads
- Form validation and submission handling

### Profile Settings
- Personal information management
- Account settings with password change
- Notification preferences

## 🤖 Automation Scripts

The project includes powerful Puppeteer scripts for:

- **Design Extraction**: Automatically analyze and extract styles from websites
- **Font Analysis**: Extract typography information from live sites
- **Form Automation**: Automatically fill and submit forms
- **Screenshot Generation**: Capture design references

### Running Automation Scripts

```bash
# Extract fonts from original site
node extract-fonts.js

# Analyze design elements
node analyze-summerschools.js

# Check provider form structure
node check-provider-design.js

# Automated course creation
node ultimate-banana-course.js
```

## 🌐 Deployment

This application is deployed using GitHub Pages:

1. Push code to GitHub repository
2. Enable GitHub Pages in repository settings
3. Select source branch (main/master)
4. Application available at: `https://yourusername.github.io/repository-name/`

## 📱 Browser Compatibility

- ✅ Chrome/Chromium (fully tested)
- ✅ Firefox (fully supported)
- ✅ Safari (responsive design)
- ✅ Edge (modern versions)

## 🔒 Security Note

This is a frontend-only application. The Puppeteer scripts are for development and analysis purposes. No actual backend integration or data submission occurs in the deployed version.

## 📄 License

This project is created for educational and development purposes, demonstrating web scraping, design replication, and form automation techniques.

## 🤝 Contributing

This project was built to replicate and analyze SummerSchools.com design patterns. Feel free to explore the automation scripts and design extraction techniques.

---

**Note**: This application replicates the design and functionality of SummerSchools.com for educational purposes. It is not affiliated with the original SummerSchools platform.