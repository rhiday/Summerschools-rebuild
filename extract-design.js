const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

class SummerSchoolsDesignExtractor {
    constructor() {
        this.browser = null;
        this.page = null;
        this.outputDir = 'design-extraction';
        this.pagePassword = 'Wwaatdsy1986?!';
        this.email = 'shahriar.rhiday@gmail.com';
        this.password = 'OctoberNovember47!';
    }

    async init() {
        console.log("🎨 Starting SummerSchools Design Extraction...");
        this.browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--start-maximized']
        });
        this.page = await this.browser.newPage();
        await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await fs.ensureDir(this.outputDir);
    }

    async accessSite() {
        console.log("🔐 Accessing summerschools.com...");
        
        // Handle page password
        await this.page.goto('https://www.summerschools.com', { waitUntil: 'networkidle2' });
        
        const pagePasswordField = await this.page.$('input[type="password"]');
        if (pagePasswordField) {
            await pagePasswordField.type(this.pagePassword);
            await this.page.keyboard.press('Enter');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Login
        await this.page.goto('https://www.summerschools.com/log-in', { waitUntil: 'networkidle2' });
        await this.page.type('input[type="email"]', this.email);
        
        const passwordFields = await this.page.$$('input[type="password"]');
        if (passwordFields.length > 0) {
            await passwordFields[passwordFields.length - 1].type(this.password);
        }
        
        await this.page.keyboard.press('Enter');
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    async extractDesignElements() {
        console.log("🎨 Extracting design elements...");
        
        // Take comprehensive screenshots
        await this.page.screenshot({ 
            path: path.join(this.outputDir, 'dashboard-full.png'),
            fullPage: true 
        });

        // Navigate to course creation form to see more UI elements
        await this.page.evaluate(() => {
            const createBtn = Array.from(document.querySelectorAll('*')).find(el => 
                el.textContent?.toLowerCase().includes('create new course')
            );
            if (createBtn) createBtn.click();
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        await this.page.screenshot({ 
            path: path.join(this.outputDir, 'course-form-full.png'),
            fullPage: true 
        });

        // Extract comprehensive styling information
        const designData = await this.page.evaluate(() => {
            const extractStyles = (element) => {
                const computed = window.getComputedStyle(element);
                return {
                    fontFamily: computed.fontFamily,
                    fontSize: computed.fontSize,
                    fontWeight: computed.fontWeight,
                    color: computed.color,
                    backgroundColor: computed.backgroundColor,
                    padding: computed.padding,
                    margin: computed.margin,
                    border: computed.border,
                    borderRadius: computed.borderRadius,
                    boxShadow: computed.boxShadow,
                    display: computed.display,
                    position: computed.position,
                    width: computed.width,
                    height: computed.height
                };
            };

            const design = {
                // Root styles
                body: extractStyles(document.body),
                
                // Navigation styles
                navigation: null,
                
                // Button styles
                buttons: [],
                
                // Input field styles
                inputs: [],
                
                // Typography
                headings: {},
                
                // Color palette
                colors: new Set(),
                backgroundColors: new Set(),
                
                // Layout containers
                containers: [],
                
                // Form elements
                forms: []
            };

            // Extract navigation
            const nav = document.querySelector('nav, .nav, .navbar, [class*="nav"]');
            if (nav) {
                design.navigation = {
                    styles: extractStyles(nav),
                    className: nav.className,
                    html: nav.outerHTML
                };
            }

            // Extract buttons
            const buttons = document.querySelectorAll('button, .btn, input[type="submit"], a[class*="btn"]');
            buttons.forEach((btn, i) => {
                if (i < 10) { // Limit to first 10 buttons
                    design.buttons.push({
                        text: btn.textContent?.trim() || btn.value,
                        className: btn.className,
                        styles: extractStyles(btn),
                        tagName: btn.tagName,
                        type: btn.type
                    });
                }
            });

            // Extract input fields
            const inputs = document.querySelectorAll('input, textarea, select');
            inputs.forEach((input, i) => {
                if (i < 15) { // Limit to first 15 inputs
                    design.inputs.push({
                        type: input.type,
                        placeholder: input.placeholder,
                        name: input.name,
                        className: input.className,
                        styles: extractStyles(input),
                        tagName: input.tagName
                    });
                }
            });

            // Extract headings
            ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
                const heading = document.querySelector(tag);
                if (heading) {
                    design.headings[tag] = {
                        text: heading.textContent?.trim(),
                        styles: extractStyles(heading),
                        className: heading.className
                    };
                }
            });

            // Extract colors from all elements
            const allElements = document.querySelectorAll('*');
            Array.from(allElements).slice(0, 200).forEach(el => {
                const styles = window.getComputedStyle(el);
                if (styles.color !== 'rgba(0, 0, 0, 0)' && styles.color !== 'rgb(0, 0, 0)') {
                    design.colors.add(styles.color);
                }
                if (styles.backgroundColor !== 'rgba(0, 0, 0, 0)' && styles.backgroundColor !== 'rgb(255, 255, 255)') {
                    design.backgroundColors.add(styles.backgroundColor);
                }
            });

            // Extract main containers
            const containers = document.querySelectorAll('.container, .main, .content, [class*="wrap"], main, section');
            containers.forEach((container, i) => {
                if (i < 5) {
                    design.containers.push({
                        className: container.className,
                        tagName: container.tagName,
                        styles: extractStyles(container)
                    });
                }
            });

            // Extract form elements
            const forms = document.querySelectorAll('form');
            forms.forEach((form, i) => {
                if (i < 3) {
                    design.forms.push({
                        className: form.className,
                        styles: extractStyles(form),
                        action: form.action,
                        method: form.method
                    });
                }
            });

            // Convert Sets to Arrays for JSON serialization
            design.colors = Array.from(design.colors);
            design.backgroundColors = Array.from(design.backgroundColors);

            // Extract CSS variables if any
            const rootStyles = getComputedStyle(document.documentElement);
            const cssVariables = {};
            for (let i = 0; i < rootStyles.length; i++) {
                const property = rootStyles[i];
                if (property.startsWith('--')) {
                    cssVariables[property] = rootStyles.getPropertyValue(property);
                }
            }
            design.cssVariables = cssVariables;

            return design;
        });

        // Save design data
        await fs.writeJson(path.join(this.outputDir, 'design-data.json'), designData, { spaces: 2 });
        
        console.log("✅ Design extraction completed");
        return designData;
    }

    async generateStyleSheet(designData) {
        console.log("📝 Generating CSS stylesheet...");
        
        const css = `/* SummerSchools.com Design Replication */

/* Root Variables */
:root {
  /* Colors extracted from summerschools.com */
  --primary-color: ${designData.colors.find(c => c.includes('rgb(194, 80, 0)')) || '#C25000'};
  --secondary-color: ${designData.colors.find(c => c.includes('rgb(24, 34, 54)')) || '#182236'};
  --text-color: ${designData.colors.find(c => c.includes('rgb(55, 57, 61)')) || '#37393D'};
  --background-color: ${designData.backgroundColors.find(c => c.includes('rgb(241, 221, 198)')) || '#F1DDC6'};
  --white: #ffffff;
  --border-color: #ddd;
  
  /* Typography */
  --font-family: ${designData.body?.fontFamily || '"Open Sans", sans-serif'};
  --font-size-base: ${designData.body?.fontSize || '14px'};
  --font-size-h1: ${designData.headings?.h1?.styles?.fontSize || '32px'};
  --font-size-h2: ${designData.headings?.h2?.styles?.fontSize || '24px'};
  --font-size-h3: ${designData.headings?.h3?.styles?.fontSize || '18px'};
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Border radius */
  --border-radius: 8px;
  --border-radius-lg: 12px;
}

/* Reset and Base Styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  color: var(--text-color);
  background-color: var(--background-color);
  line-height: 1.6;
}

/* Layout */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
}

.main-content {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Navigation */
.navbar {
  background-color: var(--white);
  border-bottom: 1px solid var(--border-color);
  padding: var(--spacing-md) 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 24px;
  font-weight: bold;
  color: var(--secondary-color);
  text-decoration: none;
}

.nav-menu {
  display: flex;
  list-style: none;
  gap: var(--spacing-lg);
}

.nav-item {
  color: var(--text-color);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.nav-item:hover,
.nav-item.active {
  color: var(--primary-color);
}

/* Buttons - Matching SummerSchools style */
.btn {
  display: inline-block;
  padding: 12px 24px;
  border: none;
  border-radius: var(--border-radius);
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  font-weight: 600;
  text-decoration: none;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: var(--primary-color);
  color: var(--white);
}

.btn:hover {
  background-color: #A94400;
  transform: translateY(-1px);
}

.btn-secondary {
  background-color: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
}

.btn-secondary:hover {
  background-color: var(--primary-color);
  color: var(--white);
}

/* Form Elements - Matching SummerSchools style */
.form-group {
  margin-bottom: var(--spacing-md);
}

.form-label {
  display: block;
  margin-bottom: var(--spacing-xs);
  font-weight: 600;
  color: var(--secondary-color);
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  color: var(--text-color);
  background-color: var(--white);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(194, 80, 0, 0.1);
}

.form-textarea {
  min-height: 120px;
  resize: vertical;
}

/* Cards - SummerSchools course card style */
.card {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.card-title {
  font-size: var(--font-size-h3);
  font-weight: 700;
  color: var(--secondary-color);
  margin-bottom: var(--spacing-sm);
}

.card-content {
  color: var(--text-color);
  margin-bottom: var(--spacing-md);
}

/* Dashboard Layout */
.dashboard {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 250px;
  background: var(--white);
  border-right: 1px solid var(--border-color);
  padding: var(--spacing-lg);
}

.main-panel {
  flex: 1;
  padding: var(--spacing-xl);
  background: var(--background-color);
}

.sidebar-menu {
  list-style: none;
}

.sidebar-item {
  margin-bottom: var(--spacing-sm);
}

.sidebar-link {
  display: block;
  padding: var(--spacing-sm) var(--spacing-md);
  color: var(--text-color);
  text-decoration: none;
  border-radius: var(--border-radius);
  transition: all 0.3s ease;
}

.sidebar-link:hover,
.sidebar-link.active {
  background-color: var(--primary-color);
  color: var(--white);
}

/* Typography */
h1 {
  font-size: var(--font-size-h1);
  font-weight: 700;
  color: var(--secondary-color);
  margin-bottom: var(--spacing-lg);
}

h2 {
  font-size: var(--font-size-h2);
  font-weight: 600;
  color: var(--secondary-color);
  margin-bottom: var(--spacing-md);
}

h3 {
  font-size: var(--font-size-h3);
  font-weight: 600;
  color: var(--secondary-color);
  margin-bottom: var(--spacing-sm);
}

/* Utilities */
.text-center { text-align: center; }
.text-primary { color: var(--primary-color); }
.text-secondary { color: var(--secondary-color); }
.bg-primary { background-color: var(--primary-color); }
.bg-white { background-color: var(--white); }

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }
  
  .main-panel {
    padding: var(--spacing-md);
  }
}

/* Status indicators */
.status {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-review {
  background-color: #FFF3CD;
  color: #856404;
}

.status-approved {
  background-color: #D4EDDA;
  color: #155724;
}

.status-rejected {
  background-color: #F8D7DA;
  color: #721C24;
}
`;

        await fs.writeFile(path.join(this.outputDir, 'summerschools-styles.css'), css);
        console.log("✅ CSS stylesheet generated");
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

async function extractSummerSchoolsDesign() {
    const extractor = new SummerSchoolsDesignExtractor();
    
    try {
        await extractor.init();
        await extractor.accessSite();
        const designData = await extractor.extractDesignElements();
        await extractor.generateStyleSheet(designData);
        
        console.log("\n🎨 Design extraction completed!");
        console.log("📁 Check 'design-extraction' directory for:");
        console.log("  - design-data.json: Complete design analysis");
        console.log("  - summerschools-styles.css: Generated stylesheet");
        console.log("  - Screenshots of dashboard and form");
        
        return designData;
        
    } catch (error) {
        console.error('❌ Design extraction failed:', error.message);
    } finally {
        await extractor.close();
    }
}

if (require.main === module) {
    extractSummerSchoolsDesign();
}

module.exports = { SummerSchoolsDesignExtractor, extractSummerSchoolsDesign };