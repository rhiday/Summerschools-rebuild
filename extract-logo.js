const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

class LogoExtractor {
    constructor() {
        this.browser = null;
        this.page = null;
        this.outputDir = 'logo-extraction';
        this.pagePassword = 'Wwaatdsy1986?!';
        this.email = 'shahriar.rhiday@gmail.com';
        this.password = 'OctoberNovember47!';
    }

    async init() {
        console.log("🎨 Extracting SummerSchools logo from dashboard...");
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
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    async extractLogo() {
        console.log("🎨 Extracting logo information...");
        
        // Take screenshot of full dashboard for reference
        await this.page.screenshot({ 
            path: path.join(this.outputDir, 'dashboard-reference.png'),
            fullPage: true 
        });

        const logoData = await this.page.evaluate(() => {
            // Look for various logo selectors
            const logoSelectors = [
                'img[alt*="logo" i]',
                'img[src*="logo" i]',
                '.logo img',
                '.brand img',
                '.navbar-brand img',
                'header img',
                '.header img',
                '[class*="logo"] img',
                'img[class*="logo"]',
                '.logo',
                '.brand',
                '.navbar-brand'
            ];
            
            const logos = [];
            const logoElements = [];
            
            // Try each selector
            logoSelectors.forEach(selector => {
                try {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                        if (!logoElements.includes(el)) {
                            logoElements.push(el);
                        }
                    });
                } catch (e) {
                    // Continue with next selector
                }
            });
            
            // Also look for text logos
            const textLogoSelectors = [
                '.logo',
                '.brand',
                '.navbar-brand',
                'header .brand',
                'header .logo',
                '[class*="logo"]:not(img)',
                '.header .brand'
            ];
            
            textLogoSelectors.forEach(selector => {
                try {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                        if (el.tagName !== 'IMG' && el.textContent && el.textContent.trim().length > 0) {
                            const rect = el.getBoundingClientRect();
                            if (rect.width > 0 && rect.height > 0 && rect.top < 200) { // Likely in header
                                logoElements.push(el);
                            }
                        }
                    });
                } catch (e) {
                    // Continue
                }
            });
            
            // Process found elements
            logoElements.forEach((el, index) => {
                const rect = el.getBoundingClientRect();
                const computed = window.getComputedStyle(el);
                
                if (el.tagName === 'IMG') {
                    logos.push({
                        type: 'image',
                        element: `${el.tagName}.${el.className}`,
                        src: el.src,
                        alt: el.alt,
                        width: rect.width,
                        height: rect.height,
                        position: { top: rect.top, left: rect.left },
                        styles: {
                            maxWidth: computed.maxWidth,
                            maxHeight: computed.maxHeight,
                            objectFit: computed.objectFit
                        }
                    });
                } else {
                    logos.push({
                        type: 'text',
                        element: `${el.tagName}.${el.className}`,
                        text: el.textContent.trim(),
                        width: rect.width,
                        height: rect.height,
                        position: { top: rect.top, left: rect.left },
                        styles: {
                            fontFamily: computed.fontFamily,
                            fontSize: computed.fontSize,
                            fontWeight: computed.fontWeight,
                            color: computed.color,
                            textAlign: computed.textAlign
                        }
                    });
                }
            });
            
            // Look for navigation structure
            const navStructure = [];
            const navElements = document.querySelectorAll('nav, .nav, .navbar, .navigation, header');
            
            navElements.forEach(nav => {
                const rect = nav.getBoundingClientRect();
                if (rect.top < 200) { // Likely main navigation
                    const children = Array.from(nav.children).map(child => ({
                        tag: child.tagName,
                        className: child.className,
                        textContent: child.textContent?.trim().substring(0, 50),
                        position: {
                            top: child.getBoundingClientRect().top,
                            left: child.getBoundingClientRect().left
                        }
                    }));
                    
                    navStructure.push({
                        tag: nav.tagName,
                        className: nav.className,
                        position: { top: rect.top, left: rect.left },
                        children: children
                    });
                }
            });
            
            return {
                url: window.location.href,
                timestamp: new Date().toISOString(),
                logos: logos,
                navigationStructure: navStructure,
                pageTitle: document.title
            };
        });
        
        // Try to capture individual logo screenshots
        for (let i = 0; i < logoData.logos.length; i++) {
            const logo = logoData.logos[i];
            if (logo.type === 'image' && logo.src) {
                try {
                    // Navigate to the logo image directly to download it
                    const logoResponse = await this.page.goto(logo.src);
                    if (logoResponse && logoResponse.ok()) {
                        const buffer = await logoResponse.buffer();
                        const extension = logo.src.split('.').pop() || 'png';
                        await fs.writeFile(
                            path.join(this.outputDir, `logo_${i}.${extension}`),
                            buffer
                        );
                        console.log(`✅ Saved logo image: logo_${i}.${extension}`);
                    }
                    
                    // Navigate back to dashboard
                    await this.page.goBack();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (e) {
                    console.log(`⚠️ Could not download logo ${i}:`, e.message);
                }
            }
        }
        
        // Save logo analysis data
        await fs.writeJson(
            path.join(this.outputDir, 'logo-analysis.json'),
            logoData,
            { spaces: 2 }
        );
        
        // Take screenshot of header area specifically
        await this.page.screenshot({ 
            path: path.join(this.outputDir, 'header-area.png'),
            clip: { x: 0, y: 0, width: 1920, height: 200 }
        });
        
        console.log("✅ Logo extraction complete!");
        console.log("📁 Files saved in:", this.outputDir);
        console.log("📄 Found", logoData.logos.length, "potential logo elements");
        
        return logoData;
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

async function extractLogo() {
    const extractor = new LogoExtractor();
    
    try {
        await extractor.init();
        await extractor.loginAndNavigate();
        const logoData = await extractor.extractLogo();
        
        return logoData;
        
    } catch (error) {
        console.error('❌ Logo extraction failed:', error.message);
        throw error;
    } finally {
        await extractor.close();
    }
}

if (require.main === module) {
    extractLogo();
}

module.exports = { LogoExtractor, extractLogo };