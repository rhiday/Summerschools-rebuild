const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

class GilroyUsageChecker {
    constructor() {
        this.browser = null;
        this.page = null;
        this.outputDir = 'gilroy-analysis';
        this.pagePassword = 'Wwaatdsy1986?!';
        this.email = 'shahriar.rhiday@gmail.com';
        this.password = 'OctoberNovember47!';
    }

    async init() {
        console.log("🔤 Checking Gilroy font usage in SummerSchools dashboard...");
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

        console.log("✅ Logged in, current URL:", this.page.url());
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    async analyzeGilroyUsage() {
        console.log("🔍 Analyzing Gilroy font usage...");
        
        const gilroyAnalysis = await this.page.evaluate(() => {
            const results = {
                navigation: [],
                paragraphs: [],
                bodyText: [],
                buttons: [],
                links: [],
                cards: [],
                other: []
            };
            
            // Check navigation elements
            const navElements = document.querySelectorAll('nav a, .nav a, .navbar a, .nav-link, .sidebar a, .sidebar-link, [class*="nav"] a');
            navElements.forEach(el => {
                const computed = window.getComputedStyle(el);
                if (computed.fontFamily.toLowerCase().includes('gilroy')) {
                    results.navigation.push({
                        element: el.tagName + '.' + el.className,
                        text: el.textContent?.trim().substring(0, 30),
                        fontFamily: computed.fontFamily,
                        fontSize: computed.fontSize,
                        fontWeight: computed.fontWeight,
                        color: computed.color
                    });
                }
            });
            
            // Check paragraphs
            const paragraphs = document.querySelectorAll('p, .description, .text, .content, [class*="description"], [class*="text"]');
            paragraphs.forEach(el => {
                const computed = window.getComputedStyle(el);
                const text = el.textContent?.trim();
                if (text && text.length > 10) {
                    results.paragraphs.push({
                        element: el.tagName + '.' + el.className,
                        text: text.substring(0, 50),
                        fontFamily: computed.fontFamily,
                        fontSize: computed.fontSize,
                        fontWeight: computed.fontWeight,
                        color: computed.color,
                        hasGilroy: computed.fontFamily.toLowerCase().includes('gilroy')
                    });
                }
            });
            
            // Check general body text
            const bodyElements = document.querySelectorAll('div, span, td, li');
            let gilroyCount = 0;
            let openSansCount = 0;
            let otherCount = 0;
            
            bodyElements.forEach(el => {
                const computed = window.getComputedStyle(el);
                const text = el.textContent?.trim();
                if (text && text.length > 5 && el.children.length === 0) {
                    const fontFamily = computed.fontFamily.toLowerCase();
                    if (fontFamily.includes('gilroy')) {
                        gilroyCount++;
                        if (results.bodyText.length < 20) {
                            results.bodyText.push({
                                element: el.tagName + '.' + el.className,
                                text: text.substring(0, 40),
                                fontFamily: computed.fontFamily,
                                fontSize: computed.fontSize,
                                fontWeight: computed.fontWeight
                            });
                        }
                    } else if (fontFamily.includes('open sans')) {
                        openSansCount++;
                    } else {
                        otherCount++;
                    }
                }
            });
            
            // Check buttons
            const buttons = document.querySelectorAll('button, .btn, [class*="button"], a[class*="btn"]');
            buttons.forEach(el => {
                const computed = window.getComputedStyle(el);
                results.buttons.push({
                    element: el.tagName + '.' + el.className,
                    text: el.textContent?.trim().substring(0, 30),
                    fontFamily: computed.fontFamily,
                    fontSize: computed.fontSize,
                    fontWeight: computed.fontWeight,
                    hasGilroy: computed.fontFamily.toLowerCase().includes('gilroy')
                });
            });
            
            // Check course cards
            const cards = document.querySelectorAll('[class*="card"], [class*="course"]');
            cards.forEach(card => {
                const titleEl = card.querySelector('h1, h2, h3, h4, [class*="title"]');
                const descEl = card.querySelector('p, [class*="desc"], [class*="text"]');
                
                if (titleEl || descEl) {
                    const titleComputed = titleEl ? window.getComputedStyle(titleEl) : null;
                    const descComputed = descEl ? window.getComputedStyle(descEl) : null;
                    
                    results.cards.push({
                        card: card.className,
                        title: titleEl ? {
                            text: titleEl.textContent?.trim().substring(0, 30),
                            fontFamily: titleComputed.fontFamily,
                            fontSize: titleComputed.fontSize,
                            fontWeight: titleComputed.fontWeight
                        } : null,
                        description: descEl ? {
                            text: descEl.textContent?.trim().substring(0, 50),
                            fontFamily: descComputed.fontFamily,
                            fontSize: descComputed.fontSize,
                            fontWeight: descComputed.fontWeight
                        } : null
                    });
                }
            });
            
            // Get body font
            const bodyComputed = window.getComputedStyle(document.body);
            
            return {
                bodyFont: {
                    fontFamily: bodyComputed.fontFamily,
                    fontSize: bodyComputed.fontSize,
                    fontWeight: bodyComputed.fontWeight,
                    color: bodyComputed.color
                },
                statistics: {
                    gilroyElements: gilroyCount,
                    openSansElements: openSansCount,
                    otherElements: otherCount
                },
                navigation: results.navigation,
                paragraphs: results.paragraphs.slice(0, 10),
                bodyText: results.bodyText,
                buttons: results.buttons.slice(0, 10),
                cards: results.cards.slice(0, 5)
            };
        });
        
        // Save analysis
        await fs.writeJson(
            path.join(this.outputDir, 'gilroy-usage.json'),
            gilroyAnalysis,
            { spaces: 2 }
        );
        
        // Take screenshots
        await this.page.screenshot({ 
            path: path.join(this.outputDir, 'dashboard-reference.png'),
            fullPage: true 
        });
        
        // Generate report
        const report = `# Gilroy Font Usage Analysis

## Body Font
- Family: ${gilroyAnalysis.bodyFont.fontFamily}
- Size: ${gilroyAnalysis.bodyFont.fontSize}
- Weight: ${gilroyAnalysis.bodyFont.fontWeight}

## Statistics
- Elements using Gilroy: ${gilroyAnalysis.statistics.gilroyElements}
- Elements using Open Sans: ${gilroyAnalysis.statistics.openSansElements}
- Other fonts: ${gilroyAnalysis.statistics.otherElements}

## Navigation Elements
${gilroyAnalysis.navigation.length > 0 ? gilroyAnalysis.navigation.map(nav => 
    `- ${nav.text}: ${nav.fontFamily} (${nav.fontSize}, ${nav.fontWeight})`
).join('\n') : 'No Gilroy found in navigation'}

## Paragraphs
${gilroyAnalysis.paragraphs.map(p => 
    `- ${p.hasGilroy ? '✅' : '❌'} ${p.text.substring(0, 30)}...: ${p.fontFamily}`
).join('\n')}

## Buttons
${gilroyAnalysis.buttons.map(b => 
    `- ${b.hasGilroy ? '✅' : '❌'} ${b.text}: ${b.fontFamily}`
).join('\n')}
`;
        
        await fs.writeFile(
            path.join(this.outputDir, 'gilroy-report.md'),
            report
        );
        
        console.log("✅ Gilroy usage analysis complete!");
        console.log("📊 Statistics:");
        console.log(`  - Gilroy elements: ${gilroyAnalysis.statistics.gilroyElements}`);
        console.log(`  - Open Sans elements: ${gilroyAnalysis.statistics.openSansElements}`);
        console.log("📁 Files saved in:", this.outputDir);
        
        return gilroyAnalysis;
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

async function checkGilroyUsage() {
    const checker = new GilroyUsageChecker();
    
    try {
        await checker.init();
        await checker.loginAndNavigate();
        const analysis = await checker.analyzeGilroyUsage();
        
        return analysis;
        
    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
        throw error;
    } finally {
        await checker.close();
    }
}

if (require.main === module) {
    checkGilroyUsage();
}

module.exports = { GilroyUsageChecker, checkGilroyUsage };