const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

class DashboardChecker {
    constructor() {
        this.browser = null;
        this.page = null;
        this.outputDir = 'dashboard-check';
        this.pagePassword = 'Wwaatdsy1986?!';
        this.email = 'shahriar.rhiday@gmail.com';
        this.password = 'OctoberNovember47!';
    }

    async init() {
        console.log("🔍 Starting Dashboard Check...");
        this.browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--start-maximized']
        });
        this.page = await this.browser.newPage();
        await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await fs.ensureDir(this.outputDir);
    }

    async handlePagePassword() {
        console.log("🔐 Handling page password...");
        
        await this.page.goto('https://www.summerschools.com', { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
        });

        const hasPagePassword = await this.page.$('input[type="password"]');
        if (hasPagePassword) {
            console.log("🔑 Entering page password...");
            await this.page.type('input[type="password"]', this.pagePassword);
            
            const submitBtn = await this.page.$('button[type="submit"], input[type="submit"], button');
            if (submitBtn) {
                await submitBtn.click();
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
    }

    async loginAndCheckDashboard() {
        console.log("👤 Logging in...");
        
        await this.page.goto('https://www.summerschools.com/log-in', { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
        });

        // Login
        await this.page.type('input[type="email"]', this.email);
        
        const passwordFields = await this.page.$$('input[type="password"]');
        if (passwordFields.length > 0) {
            const loginPasswordField = passwordFields[passwordFields.length - 1];
            await loginPasswordField.type(this.password);
        }

        await this.page.click('input[type="submit"]');
        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log("✅ Logged in, current URL:", this.page.url());

        // Take dashboard screenshot
        await this.page.screenshot({ 
            path: path.join(this.outputDir, 'dashboard-current.png'),
            fullPage: true 
        });

        // Look for courses on the page
        const courses = await this.page.evaluate(() => {
            // Look for course titles and info
            const courseElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, .course-title, [class*="course"], [class*="title"]'));
            const courses = [];
            
            courseElements.forEach(el => {
                const text = el.textContent?.trim();
                if (text && text.length > 3 && !text.toLowerCase().includes('dashboard')) {
                    courses.push({
                        text: text,
                        tagName: el.tagName,
                        className: el.className
                    });
                }
            });

            return courses;
        });

        console.log("\n🔍 Courses found on dashboard:");
        courses.forEach(course => {
            if (course.text.toLowerCase().includes('banana')) {
                console.log(`🍌 BANANA FOUND: "${course.text}"`);
            } else {
                console.log(`📚 Course: "${course.text}"`);
            }
        });

        // Check if "Banana" appears anywhere on the page
        const pageText = await this.page.evaluate(() => document.body.textContent);
        const hasBanana = pageText.toLowerCase().includes('banana');
        
        console.log(`\n🍌 "Banana" found on page: ${hasBanana ? 'YES' : 'NO'}`);

        if (hasBanana) {
            console.log("🎉 SUCCESS: Banana course is visible on the dashboard!");
        } else {
            console.log("⏳ Banana course not yet visible - may still be pending review");
        }

        // Take a focused screenshot of the main content area
        await this.page.screenshot({ 
            path: path.join(this.outputDir, 'dashboard-close-up.png'),
            clip: { x: 200, y: 100, width: 1500, height: 800 }
        });

        console.log("\n📸 Screenshots saved:");
        console.log("- dashboard-current.png: Full dashboard");
        console.log("- dashboard-close-up.png: Close-up of main content");
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

async function checkDashboard() {
    const checker = new DashboardChecker();
    
    try {
        await checker.init();
        await checker.handlePagePassword();
        await checker.loginAndCheckDashboard();
        
        console.log("\n✅ Dashboard check complete!");
        console.log("📁 Check 'dashboard-check' directory for screenshots");
        
    } catch (error) {
        console.error('❌ Check failed:', error.message);
    } finally {
        await checker.close();
    }
}

if (require.main === module) {
    checkDashboard();
}

module.exports = { DashboardChecker, checkDashboard };