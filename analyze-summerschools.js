const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

class SummerSchoolStyleAnalyzer {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = [];
        this.outputDir = 'analysis-results';
    }

    async init() {
        this.browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--start-maximized']
        });
        this.page = await this.browser.newPage();
        await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Create output directory
        await fs.ensureDir(this.outputDir);
    }

    async analyzeWebsite(url, schoolName) {
        console.log(`🚀 Analyzing ${schoolName}: ${url}`);
        
        try {
            console.log("📍 Navigating to website...");
            await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            
            // Handle password protection for summerschools.com
            await this.handlePasswordProtection();
            
            // Wait for page to settle
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Take screenshots
            await this.takeScreenshots(schoolName);
            
            // Extract comprehensive analysis
            const analysis = await this.extractComprehensiveAnalysis();
            
            const result = {
                schoolName,
                url,
                timestamp: new Date().toISOString(),
                ...analysis
            };
            
            // Generate detailed report
            await this.generateReport(result, schoolName);
            
            this.results.push(result);
            console.log(`✅ Analysis complete for ${schoolName}`);
            return result;
            
        } catch (error) {
            console.error(`❌ Error analyzing ${schoolName}:`, error.message);
            return {
                schoolName,
                url,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async handlePasswordProtection() {
        const currentUrl = this.page.url();
        console.log(`Current URL: ${currentUrl}`);
        
        // Look for password field
        const passwordField = await this.page.$('input[type="password"]');
        if (passwordField) {
            console.log("🔐 Password protection detected, entering credentials...");
            await passwordField.type('Wwaatdsy1986?!');
            
            const submitButton = await this.page.$('button[type="submit"], input[type="submit"], button');
            if (submitButton) {
                await submitButton.click();
                try {
                    await this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 });
                } catch (timeoutError) {
                    console.log("⚠️ Navigation timeout, but continuing...");
                }
            }
        }
    }

    async takeScreenshots(schoolName) {
        const sanitizedName = schoolName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        
        console.log("📸 Taking screenshots...");
        
        // Full page screenshot
        await this.page.screenshot({ 
            path: path.join(this.outputDir, `${sanitizedName}-full-page.png`),
            fullPage: true 
        });
        
        // Viewport screenshot
        await this.page.screenshot({ 
            path: path.join(this.outputDir, `${sanitizedName}-viewport.png`),
            clip: { x: 0, y: 0, width: 1920, height: 1080 }
        });
        
        // Try to capture hero section specifically
        const heroSelectors = [
            '.hero', '.hero-section', 'section:first-of-type',
            'header + section', '[class*="hero"]', 'main > section:first-child'
        ];
        
        for (const selector of heroSelectors) {
            try {
                const heroElement = await this.page.$(selector);
                if (heroElement) {
                    console.log(`✅ Found hero section with selector: ${selector}`);
                    await heroElement.screenshot({ 
                        path: path.join(this.outputDir, `${sanitizedName}-hero-section.png`)
                    });
                    break;
                }
            } catch (e) {
                continue;
            }
        }
    }

    async extractComprehensiveAnalysis() {
        console.log("🔍 Analyzing page structure and styles...");
        
        return await this.page.evaluate(() => {
            const getComputedStyles = (element) => {
                const computed = window.getComputedStyle(element);
                return {
                    position: computed.position,
                    zIndex: computed.zIndex,
                    backgroundColor: computed.backgroundColor,
                    backgroundImage: computed.backgroundImage,
                    color: computed.color,
                    fontSize: computed.fontSize,
                    fontFamily: computed.fontFamily,
                    fontWeight: computed.fontWeight,
                    lineHeight: computed.lineHeight,
                    padding: computed.padding,
                    margin: computed.margin,
                    borderRadius: computed.borderRadius,
                    boxShadow: computed.boxShadow,
                    display: computed.display,
                    transform: computed.transform,
                    width: computed.width,
                    height: computed.height,
                    border: computed.border,
                    textAlign: computed.textAlign,
                    opacity: computed.opacity
                };
            };

            // Get viewport dimensions
            const viewport = {
                width: window.innerWidth,
                height: window.innerHeight
            };

            // Find all elements in the top portion of the page (hero area)
            const topElements = [];
            const allElements = document.querySelectorAll('*');
            
            allElements.forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.top < 1080 && rect.height > 10 && rect.width > 10) {
                    const styles = window.getComputedStyle(el);
                    
                    topElements.push({
                        tag: el.tagName.toLowerCase(),
                        className: el.className,
                        id: el.id,
                        position: {
                            top: rect.top,
                            left: rect.left,
                            width: rect.width,
                            height: rect.height
                        },
                        styles: getComputedStyles(el),
                        text: el.textContent ? el.textContent.trim().substring(0, 100) : '',
                        hasImage: el.tagName === 'IMG' || styles.backgroundImage !== 'none'
                    });
                }
            });

            // Analyze specific sections
            const heroSection = document.querySelector('header, .hero, .banner, section:first-of-type, .hero-section, .main-banner') 
                               || document.querySelector('body > *:first-child');

            const navigation = document.querySelector('nav, .nav, .navbar, .navigation, header nav');
            const buttons = Array.from(document.querySelectorAll('button, .btn, .button, a[class*="btn"]')).slice(0, 10);
            
            const headings = {
                h1: Array.from(document.querySelectorAll('h1')),
                h2: Array.from(document.querySelectorAll('h2')),
                h3: Array.from(document.querySelectorAll('h3'))
            };

            // Get page metadata
            const title = document.title;
            const description = document.querySelector('meta[name="description"]')?.content || '';
            
            // Color analysis
            const colorElements = Array.from(document.querySelectorAll('*')).slice(0, 100);
            const colors = new Set();
            const backgroundColors = new Set();
            
            colorElements.forEach(el => {
                const styles = window.getComputedStyle(el);
                if (styles.color !== 'rgba(0, 0, 0, 0)') colors.add(styles.color);
                if (styles.backgroundColor !== 'rgba(0, 0, 0, 0)') backgroundColors.add(styles.backgroundColor);
            });

            return {
                viewport,
                title,
                description,
                url: window.location.href,
                topElements,
                hero: heroSection ? {
                    tagName: heroSection.tagName,
                    classes: heroSection.className,
                    styles: getComputedStyles(heroSection),
                    textContent: heroSection.textContent?.substring(0, 300)
                } : null,
                navigation: navigation ? {
                    tagName: navigation.tagName,
                    classes: navigation.className,
                    styles: getComputedStyles(navigation)
                } : null,
                buttons: buttons.map(btn => ({
                    tagName: btn.tagName,
                    classes: btn.className,
                    textContent: btn.textContent?.trim().substring(0, 50),
                    styles: getComputedStyles(btn)
                })),
                headings: Object.fromEntries(
                    Object.entries(headings).map(([tag, elements]) => [
                        tag, 
                        elements.map(el => ({
                            textContent: el.textContent?.trim(),
                            styles: getComputedStyles(el)
                        }))
                    ])
                ),
                bodyStyles: getComputedStyles(document.body),
                colorPalette: {
                    textColors: Array.from(colors).slice(0, 20),
                    backgroundColors: Array.from(backgroundColors).slice(0, 20)
                },
                statistics: {
                    elementsInHeroArea: topElements.length,
                    elementsWithBackgroundImages: topElements.filter(el => el.hasImage).length,
                    positionedElements: topElements.filter(el => el.styles.position !== 'static').length,
                    totalButtons: buttons.length,
                    totalHeadings: Object.values(headings).flat().length
                }
            };
        });
    }

    async generateReport(data, schoolName) {
        const sanitizedName = schoolName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        
        // Save detailed JSON analysis
        await fs.writeJson(
            path.join(this.outputDir, `${sanitizedName}-analysis.json`),
            data,
            { spaces: 2 }
        );

        // Generate markdown report
        const report = `# ${schoolName} - Design Analysis Report

**URL:** ${data.url}
**Title:** ${data.title}
**Description:** ${data.description}
**Analysis Date:** ${data.timestamp}
**Viewport:** ${data.viewport?.width}x${data.viewport?.height}

## Key Statistics
- Elements in hero area: ${data.statistics?.elementsInHeroArea || 0}
- Elements with background images: ${data.statistics?.elementsWithBackgroundImages || 0}
- Positioned elements: ${data.statistics?.positionedElements || 0}
- Total buttons analyzed: ${data.statistics?.totalButtons || 0}
- Total headings: ${data.statistics?.totalHeadings || 0}

## Hero Section Analysis
${data.hero ? `
**Tag:** ${data.hero.tagName}
**Classes:** ${data.hero.classes}
**Background:** ${data.hero.styles?.backgroundColor}
**Font:** ${data.hero.styles?.fontFamily}
**Text Preview:** ${data.hero.textContent?.substring(0, 150)}...
` : 'No hero section detected'}

## Color Palette
**Text Colors:** ${data.colorPalette?.textColors?.slice(0, 5).join(', ') || 'None detected'}
**Background Colors:** ${data.colorPalette?.backgroundColors?.slice(0, 5).join(', ') || 'None detected'}

## Navigation
${data.navigation ? `
**Tag:** ${data.navigation.tagName}
**Classes:** ${data.navigation.classes}
**Background:** ${data.navigation.styles?.backgroundColor}
` : 'No navigation detected'}

## Typography
${data.headings?.h1?.length ? `**H1 Headings:** ${data.headings.h1.length} found` : ''}
${data.headings?.h2?.length ? `**H2 Headings:** ${data.headings.h2.length} found` : ''}
${data.headings?.h3?.length ? `**H3 Headings:** ${data.headings.h3.length} found` : ''}

## Button Styles
${data.buttons?.slice(0, 3).map((btn, i) => `
**Button ${i + 1}:** ${btn.textContent}
- Background: ${btn.styles?.backgroundColor}
- Color: ${btn.styles?.color}
- Font: ${btn.styles?.fontSize}
`).join('') || 'No buttons detected'}

## Generated Files
- \`${sanitizedName}-full-page.png\`: Complete page screenshot
- \`${sanitizedName}-viewport.png\`: Above-the-fold view
- \`${sanitizedName}-hero-section.png\`: Isolated hero section (if detected)
- \`${sanitizedName}-analysis.json\`: Complete structured data
`;

        await fs.writeFile(
            path.join(this.outputDir, `${sanitizedName}-report.md`),
            report
        );
    }

    async saveResults(filename = 'summerschool-analysis.json') {
        await fs.writeJson(filename, {
            analysis: this.results,
            summary: {
                totalSites: this.results.length,
                successfulAnalyses: this.results.filter(r => !r.error).length,
                failedAnalyses: this.results.filter(r => r.error).length,
                generatedAt: new Date().toISOString()
            }
        }, { spaces: 2 });
        
        console.log(`Results saved to ${filename}`);
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// Command interface for Claude interactions
async function analyzeSingleWebsite(url, name = 'Website') {
    const analyzer = new SummerSchoolStyleAnalyzer();
    
    try {
        console.log(`🎯 Claude Command: Analyzing ${name}`);
        await analyzer.init();
        
        const result = await analyzer.analyzeWebsite(url, name);
        await analyzer.saveResults(`${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-summary.json`);
        
        console.log(`\n✅ Analysis complete! Files saved in 'analysis-results' directory:`);
        console.log(`📊 JSON Data: ${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-analysis.json`);
        console.log(`📝 Report: ${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-report.md`);
        console.log(`📸 Screenshots: ${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-*.png`);
        
        return result;
        
    } catch (error) {
        console.error('❌ Analysis failed:', error);
        throw error;
    } finally {
        await analyzer.close();
    }
}

// Extract summerschools.com specifically
async function extractSummerschoolsDesign() {
    return await analyzeSingleWebsite('https://www.summerschools.com', 'Summerschools.com');
}

const summerSchoolUrls = [
    { name: 'Summerschools.com', url: 'https://www.summerschools.com' },
    { name: 'Stanford Summer Session', url: 'https://summer.stanford.edu/' },
    { name: 'Harvard Summer School', url: 'https://www.summer.harvard.edu/' },
    { name: 'MIT Summer Programs', url: 'https://professional.mit.edu/programs/summer-programs' },
    { name: 'Yale Summer Session', url: 'https://summer.yale.edu/' },
    { name: 'UC Berkeley Summer Sessions', url: 'https://summer.berkeley.edu/' }
];

async function analyzeMultipleSchools() {
    const analyzer = new SummerSchoolStyleAnalyzer();
    
    try {
        await analyzer.init();
        
        for (const school of summerSchoolUrls) {
            await analyzer.analyzeWebsite(school.url, school.name);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        await analyzer.saveResults();
        
    } catch (error) {
        console.error('Analysis failed:', error);
    } finally {
        await analyzer.close();
    }
}

// Export functions for Claude commands
module.exports = { 
    SummerSchoolStyleAnalyzer, 
    analyzeSingleWebsite, 
    extractSummerschoolsDesign,
    analyzeMultipleSchools 
};

if (require.main === module) {
    // Default: analyze summerschools.com
    extractSummerschoolsDesign().catch(console.error);
}