const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

class FontExtractor {
    constructor() {
        this.browser = null;
        this.page = null;
        this.outputDir = 'font-analysis';
        this.pagePassword = 'Wwaatdsy1986?!';
        this.email = 'shahriar.rhiday@gmail.com';
        this.password = 'OctoberNovember47!';
    }

    async init() {
        console.log("🔤 Extracting fonts from SummerSchools dashboard...");
        this.browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--start-maximized']
        });
        this.page = await this.browser.newPage();
        await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await fs.ensureDir(this.outputDir);
    }

    async loginAndNavigate() {
        console.log("🔐 Logging in to access dashboard...");
        
        // Handle page password first
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

        console.log("✅ Logged in, current URL:", this.page.url());
        
        // Wait for dashboard to load
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    async extractFonts() {
        console.log("🔍 Extracting font information...");
        
        const fontAnalysis = await this.page.evaluate(() => {
            // Get all unique font families used on the page
            const elements = Array.from(document.querySelectorAll('*'));
            const fontFamilies = new Set();
            const fontWeights = new Set();
            const fontSizes = new Set();
            
            const elementFontData = [];
            
            elements.forEach((el, index) => {
                if (index > 1000) return; // Limit to first 1000 elements for performance
                
                const computed = window.getComputedStyle(el);
                const fontFamily = computed.fontFamily;
                const fontSize = computed.fontSize;
                const fontWeight = computed.fontWeight;
                const fontStyle = computed.fontStyle;
                const lineHeight = computed.lineHeight;
                
                if (fontFamily && fontFamily !== 'inherit') {
                    fontFamilies.add(fontFamily);
                }
                if (fontSize && fontSize !== 'inherit') {
                    fontSizes.add(fontSize);
                }
                if (fontWeight && fontWeight !== 'inherit') {
                    fontWeights.add(fontWeight);
                }
                
                // Collect detailed font data for important elements
                const text = el.textContent?.trim();
                if (text && text.length > 0 && text.length < 200) {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        elementFontData.push({
                            tag: el.tagName.toLowerCase(),
                            className: el.className,
                            id: el.id,
                            text: text.substring(0, 50),
                            fontFamily: fontFamily,
                            fontSize: fontSize,
                            fontWeight: fontWeight,
                            fontStyle: fontStyle,
                            lineHeight: lineHeight,
                            color: computed.color,
                            position: {
                                top: Math.round(rect.top),
                                left: Math.round(rect.left)
                            }
                        });
                    }
                }
            });
            
            // Group elements by font family for better analysis
            const fontGroups = {};
            elementFontData.forEach(item => {
                const key = item.fontFamily;
                if (!fontGroups[key]) {
                    fontGroups[key] = [];
                }
                fontGroups[key].push(item);
            });
            
            // Get loaded font faces
            const loadedFonts = [];
            if (document.fonts) {
                document.fonts.forEach(font => {
                    loadedFonts.push({
                        family: font.family,
                        style: font.style,
                        weight: font.weight,
                        stretch: font.stretch,
                        status: font.status
                    });
                });
            }
            
            // Analyze headings specifically
            const headingFonts = {};
            ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
                const headings = Array.from(document.querySelectorAll(tag));
                headingFonts[tag] = headings.map(h => {
                    const computed = window.getComputedStyle(h);
                    return {
                        text: h.textContent?.trim().substring(0, 50),
                        fontFamily: computed.fontFamily,
                        fontSize: computed.fontSize,
                        fontWeight: computed.fontWeight,
                        color: computed.color,
                        lineHeight: computed.lineHeight
                    };
                });
            });
            
            // Analyze buttons and navigation
            const buttonFonts = Array.from(document.querySelectorAll('button, .btn, .button, a[class*="btn"]')).map(btn => {
                const computed = window.getComputedStyle(btn);
                return {
                    text: btn.textContent?.trim().substring(0, 30),
                    tag: btn.tagName.toLowerCase(),
                    className: btn.className,
                    fontFamily: computed.fontFamily,
                    fontSize: computed.fontSize,
                    fontWeight: computed.fontWeight,
                    color: computed.color
                };
            });
            
            const navFonts = Array.from(document.querySelectorAll('nav a, .nav a, .navbar a, .navigation a')).map(link => {
                const computed = window.getComputedStyle(link);
                return {
                    text: link.textContent?.trim(),
                    fontFamily: computed.fontFamily,
                    fontSize: computed.fontSize,
                    fontWeight: computed.fontWeight,
                    color: computed.color
                };
            });
            
            return {
                uniqueFontFamilies: Array.from(fontFamilies),
                uniqueFontSizes: Array.from(fontSizes).sort((a, b) => parseInt(a) - parseInt(b)),
                uniqueFontWeights: Array.from(fontWeights).sort((a, b) => parseInt(a) - parseInt(b)),
                loadedFonts: loadedFonts,
                fontGroups: fontGroups,
                headingFonts: headingFonts,
                buttonFonts: buttonFonts,
                navigationFonts: navFonts,
                bodyFont: {
                    fontFamily: window.getComputedStyle(document.body).fontFamily,
                    fontSize: window.getComputedStyle(document.body).fontSize,
                    fontWeight: window.getComputedStyle(document.body).fontWeight,
                    color: window.getComputedStyle(document.body).color,
                    lineHeight: window.getComputedStyle(document.body).lineHeight
                },
                elementFontData: elementFontData.slice(0, 100) // Limit for file size
            };
        });
        
        // Take screenshot of the dashboard for reference
        await this.page.screenshot({ 
            path: path.join(this.outputDir, 'dashboard-font-reference.png'),
            fullPage: true 
        });
        
        return fontAnalysis;
    }

    async generateFontCSS(fontAnalysis) {
        console.log("📝 Generating CSS font imports...");
        
        const uniqueFonts = fontAnalysis.uniqueFontFamilies;
        let googleFonts = [];
        let systemFonts = [];
        
        // Categorize fonts
        uniqueFonts.forEach(fontFamily => {
            const cleanFont = fontFamily.replace(/['"]/g, '').split(',')[0].trim();
            
            // Common system fonts
            const systemFontList = ['Arial', 'Helvetica', 'Times', 'Times New Roman', 'Courier', 'Verdana', 'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Tahoma', 'Trebuchet MS'];
            
            if (systemFontList.some(sys => cleanFont.includes(sys))) {
                systemFonts.push(fontFamily);
            } else if (!cleanFont.includes('serif') && !cleanFont.includes('sans-serif') && !cleanFont.includes('monospace')) {
                googleFonts.push(cleanFont);
            }
        });
        
        // Generate Google Fonts import
        let googleFontImport = '';
        if (googleFonts.length > 0) {
            const fontParams = googleFonts.map(font => {
                const weights = fontAnalysis.uniqueFontWeights
                    .filter(w => !isNaN(w) && w >= 300 && w <= 900)
                    .join(';');
                return `family=${font.replace(/\s/g, '+')}:wght@${weights || '400;600;700'}`;
            }).join('&');
            
            googleFontImport = `@import url('https://fonts.googleapis.com/css2?${fontParams}&display=swap');`;
        }
        
        // Generate CSS variables
        const cssVariables = `
:root {
    /* Font Families */
    --font-primary: ${fontAnalysis.bodyFont.fontFamily};
    --font-headings: ${fontAnalysis.headingFonts.h1?.[0]?.fontFamily || fontAnalysis.bodyFont.fontFamily};
    --font-buttons: ${fontAnalysis.buttonFonts[0]?.fontFamily || fontAnalysis.bodyFont.fontFamily};
    
    /* Font Sizes */
    --font-size-base: ${fontAnalysis.bodyFont.fontSize};
    --font-size-h1: ${fontAnalysis.headingFonts.h1?.[0]?.fontSize || '32px'};
    --font-size-h2: ${fontAnalysis.headingFonts.h2?.[0]?.fontSize || '24px'};
    --font-size-h3: ${fontAnalysis.headingFonts.h3?.[0]?.fontSize || '18px'};
    --font-size-button: ${fontAnalysis.buttonFonts[0]?.fontSize || '14px'};
    
    /* Font Weights */
    --font-weight-normal: 400;
    --font-weight-medium: 500;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;
    
    /* Line Heights */
    --line-height-base: ${fontAnalysis.bodyFont.lineHeight};
}

/* Base Typography */
body {
    font-family: var(--font-primary);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-normal);
    line-height: var(--line-height-base);
    color: ${fontAnalysis.bodyFont.color};
}

/* Headings */
h1 { font-family: var(--font-headings); font-size: var(--font-size-h1); font-weight: var(--font-weight-bold); }
h2 { font-family: var(--font-headings); font-size: var(--font-size-h2); font-weight: var(--font-weight-bold); }
h3 { font-family: var(--font-headings); font-size: var(--font-size-h3); font-weight: var(--font-weight-semibold); }

/* Buttons */
button, .btn {
    font-family: var(--font-buttons);
    font-size: var(--font-size-button);
    font-weight: var(--font-weight-semibold);
}`;

        const completeCss = `${googleFontImport}\n${cssVariables}`;
        
        await fs.writeFile(
            path.join(this.outputDir, 'extracted-fonts.css'), 
            completeCss
        );
        
        return completeCss;
    }

    async generateReport(fontAnalysis, cssOutput) {
        const report = {
            extractedAt: new Date().toISOString(),
            url: this.page.url(),
            fonts: fontAnalysis,
            generatedCSS: cssOutput
        };
        
        await fs.writeJson(
            path.join(this.outputDir, 'font-analysis.json'),
            report,
            { spaces: 2 }
        );
        
        // Generate readable summary
        const summary = `# SummerSchools Font Analysis

## Primary Fonts Used
${fontAnalysis.uniqueFontFamilies.slice(0, 5).map(font => `- ${font}`).join('\n')}

## Body Font
- Family: ${fontAnalysis.bodyFont.fontFamily}
- Size: ${fontAnalysis.bodyFont.fontSize}  
- Weight: ${fontAnalysis.bodyFont.fontWeight}
- Color: ${fontAnalysis.bodyFont.color}

## Heading Fonts
${Object.entries(fontAnalysis.headingFonts)
    .filter(([tag, headings]) => headings.length > 0)
    .map(([tag, headings]) => `**${tag.toUpperCase()}**: ${headings[0].fontFamily} (${headings[0].fontSize}, ${headings[0].fontWeight})`)
    .join('\n')}

## Font Sizes Used
${fontAnalysis.uniqueFontSizes.slice(0, 10).join(', ')}

## Font Weights Used  
${fontAnalysis.uniqueFontWeights.join(', ')}

## Generated Files
- \`font-analysis.json\`: Complete font data
- \`extracted-fonts.css\`: Ready-to-use CSS with font imports
- \`dashboard-font-reference.png\`: Screenshot for reference
`;
        
        await fs.writeFile(
            path.join(this.outputDir, 'font-summary.md'),
            summary
        );
        
        console.log("✅ Font analysis complete!");
        console.log(`📁 Check '${this.outputDir}' directory for results`);
        console.log("📄 Files generated:");
        console.log("  - font-analysis.json (detailed data)");
        console.log("  - extracted-fonts.css (ready-to-use CSS)");
        console.log("  - font-summary.md (readable summary)");
        console.log("  - dashboard-font-reference.png (screenshot)");
        
        return report;
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

async function extractFonts() {
    const extractor = new FontExtractor();
    
    try {
        await extractor.init();
        await extractor.loginAndNavigate();
        const fontAnalysis = await extractor.extractFonts();
        const cssOutput = await extractor.generateFontCSS(fontAnalysis);
        const report = await extractor.generateReport(fontAnalysis, cssOutput);
        
        return report;
        
    } catch (error) {
        console.error('❌ Font extraction failed:', error.message);
        throw error;
    } finally {
        await extractor.close();
    }
}

if (require.main === module) {
    extractFonts();
}

module.exports = { FontExtractor, extractFonts };