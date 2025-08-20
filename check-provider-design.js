const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

class ProviderDesignChecker {
    constructor() {
        this.browser = null;
        this.page = null;
        this.outputDir = 'provider-design-check';
        this.pagePassword = 'Wwaatdsy1986?!';
        this.email = 'shahriar.rhiday@gmail.com';
        this.password = 'OctoberNovember47!';
    }

    async init() {
        console.log("🔍 Checking Provider page design...");
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
        console.log("🔐 Logging in...");
        
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
    }

    async checkProviderPage() {
        console.log("📋 Checking Provider page...");
        
        // Look for Provider link and click it
        const providerClicked = await this.page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a, .nav-item, .sidebar-link'));
            const providerLink = links.find(link => 
                link.textContent?.toLowerCase().includes('provider')
            );
            
            if (providerLink) {
                providerLink.click();
                return true;
            }
            return false;
        });

        if (providerClicked) {
            console.log("✅ Clicked Provider link");
            await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
            console.log("⚠️ Provider link not found, trying direct navigation...");
            try {
                await this.page.goto('https://www.summerschools.com/edit-provider', { 
                    waitUntil: 'networkidle2', 
                    timeout: 15000 
                });
            } catch (e) {
                console.log("❌ Direct navigation failed");
            }
        }

        await this.page.screenshot({ 
            path: path.join(this.outputDir, 'provider-page.png'),
            fullPage: true 
        });

        // Extract provider form structure
        const providerData = await this.page.evaluate(() => {
            const forms = Array.from(document.querySelectorAll('form'));
            const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
            const labels = Array.from(document.querySelectorAll('label'));
            const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'));
            
            return {
                pageTitle: document.title,
                url: window.location.href,
                headings: headings.map(h => ({
                    tag: h.tagName,
                    text: h.textContent?.trim(),
                    className: h.className
                })),
                forms: forms.map(f => ({
                    action: f.action,
                    method: f.method,
                    className: f.className
                })),
                inputs: inputs.map(input => ({
                    type: input.type,
                    name: input.name,
                    placeholder: input.placeholder,
                    required: input.required,
                    className: input.className,
                    tagName: input.tagName
                })),
                labels: labels.map(label => ({
                    text: label.textContent?.trim(),
                    for: label.getAttribute('for'),
                    className: label.className
                }))
            };
        });

        await fs.writeJson(path.join(this.outputDir, 'provider-data.json'), providerData, { spaces: 2 });
        
        console.log("✅ Provider page data extracted");
        return providerData;
    }

    async checkProfilePage() {
        console.log("👤 Checking Profile page...");
        
        // Look for profile link or user avatar and click it
        const profileClicked = await this.page.evaluate(() => {
            const profileElements = Array.from(document.querySelectorAll('a, button, .user-avatar, .profile, [class*="profile"], [class*="user"]'));
            const profileLink = profileElements.find(el => 
                el.textContent?.toLowerCase().includes('profile') ||
                el.textContent?.toLowerCase().includes('edit profile') ||
                el.className?.includes('user') ||
                el.className?.includes('avatar')
            );
            
            if (profileLink) {
                profileLink.click();
                return true;
            }
            return false;
        });

        if (profileClicked) {
            console.log("✅ Clicked Profile element");
            await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
            console.log("⚠️ Profile link not found, trying direct navigation...");
            try {
                await this.page.goto('https://www.summerschools.com/edit-profile', { 
                    waitUntil: 'networkidle2', 
                    timeout: 15000 
                });
            } catch (e) {
                console.log("❌ Direct navigation failed");
            }
        }

        await this.page.screenshot({ 
            path: path.join(this.outputDir, 'profile-page.png'),
            fullPage: true 
        });

        // Extract profile form structure
        const profileData = await this.page.evaluate(() => {
            const forms = Array.from(document.querySelectorAll('form'));
            const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
            const labels = Array.from(document.querySelectorAll('label'));
            const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'));
            
            return {
                pageTitle: document.title,
                url: window.location.href,
                headings: headings.map(h => ({
                    tag: h.tagName,
                    text: h.textContent?.trim(),
                    className: h.className
                })),
                forms: forms.map(f => ({
                    action: f.action,
                    method: f.method,
                    className: f.className
                })),
                inputs: inputs.map(input => ({
                    type: input.type,
                    name: input.name,
                    placeholder: input.placeholder,
                    required: input.required,
                    className: input.className,
                    tagName: input.tagName
                })),
                labels: labels.map(label => ({
                    text: label.textContent?.trim(),
                    for: label.getAttribute('for'),
                    className: label.className
                }))
            };
        });

        await fs.writeJson(path.join(this.outputDir, 'profile-data.json'), profileData, { spaces: 2 });
        
        console.log("✅ Profile page data extracted");
        return profileData;
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

async function checkProviderDesign() {
    const checker = new ProviderDesignChecker();
    
    try {
        await checker.init();
        await checker.loginAndNavigate();
        const providerData = await checker.checkProviderPage();
        const profileData = await checker.checkProfilePage();
        
        console.log("\n🎨 Provider & Profile design check completed!");
        console.log("📁 Check 'provider-design-check' directory for screenshots and data");
        
        return { providerData, profileData };
        
    } catch (error) {
        console.error('❌ Design check failed:', error.message);
    } finally {
        await checker.close();
    }
}

if (require.main === module) {
    checkProviderDesign();
}

module.exports = { ProviderDesignChecker, checkProviderDesign };