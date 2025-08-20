const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

class SimpleLoginBot {
    constructor() {
        this.browser = null;
        this.page = null;
        this.outputDir = 'login-results';
    }

    async init() {
        console.log("🚀 Initializing browser...");
        this.browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--start-maximized']
        });
        this.page = await this.browser.newPage();
        await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await fs.ensureDir(this.outputDir);
    }

    async navigateToLogin() {
        console.log("📍 Going directly to login page...");
        
        // Go directly to login page as requested
        await this.page.goto('https://www.summerschools.com/log-in', { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
        });

        // Check if there's a page password here
        const passwordField = await this.page.$('input[type="password"]');
        if (passwordField && (await this.page.url()).includes('summerschools.com')) {
            const isPagePassword = await this.page.evaluate(() => {
                const passwordFields = document.querySelectorAll('input[type="password"]');
                return passwordFields.length === 1; // If only one password field, likely page password
            });
            
            if (isPagePassword) {
                console.log("🔐 Page password detected on login page, entering...");
                await passwordField.type('Wwaatdsy1986?!');
                
                const submitButton = await this.page.$('button[type="submit"], input[type="submit"], button');
                if (submitButton) {
                    await submitButton.click();
                    // Wait for page to change but don't require navigation
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
        }

        await this.page.screenshot({ 
            path: path.join(this.outputDir, '01-login-page.png'),
            fullPage: true 
        });
    }

    async performLogin() {
        console.log("🔐 Performing login...");
        
        // Wait for page to be ready
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Fill email
        await this.page.evaluate(() => {
            const emailField = document.querySelector('input[type="email"], input[name="email"]');
            if (emailField) {
                emailField.value = 'shahriar.rhiday@gmail.com';
                emailField.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
        
        // Fill password
        await this.page.evaluate(() => {
            const passwordFields = document.querySelectorAll('input[type="password"]');
            // Get the last password field (login password, not page password)
            const loginPasswordField = passwordFields[passwordFields.length - 1];
            if (loginPasswordField) {
                loginPasswordField.value = 'OctoberNovember47!';
                loginPasswordField.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        await this.page.screenshot({ 
            path: path.join(this.outputDir, '02-credentials-filled.png')
        });

        // Submit form
        await this.page.evaluate(() => {
            // Look for submit button or form
            const submitButton = document.querySelector('input[type="submit"], button[type="submit"]');
            if (submitButton) {
                submitButton.click();
            } else {
                // Try to submit the form
                const form = document.querySelector('form');
                if (form) {
                    form.submit();
                }
            }
        });

        // Wait for response
        await new Promise(resolve => setTimeout(resolve, 5000));

        await this.page.screenshot({ 
            path: path.join(this.outputDir, '03-after-login.png'),
            fullPage: true 
        });

        console.log("✅ Login attempt completed");
        console.log("📍 Current URL:", this.page.url());
    }

    async exploreAfterLogin() {
        console.log("🔍 Exploring logged-in area...");
        
        // Look for dashboard, admin, or course creation links
        const links = await this.page.evaluate(() => {
            const allLinks = Array.from(document.querySelectorAll('a'));
            return allLinks.map(link => ({
                text: link.textContent?.trim(),
                href: link.href,
                classes: link.className
            })).filter(link => link.text && link.text.length > 0);
        });
        
        console.log("🔍 Available links after login:");
        links.forEach(link => {
            if (link.text.toLowerCase().includes('course') || 
                link.text.toLowerCase().includes('create') || 
                link.text.toLowerCase().includes('dashboard') ||
                link.text.toLowerCase().includes('admin')) {
                console.log(`⭐ IMPORTANT: "${link.text}" -> ${link.href}`);
            } else {
                console.log(`  - "${link.text}" -> ${link.href}`);
            }
        });

        // Look specifically for "Create new course" link
        const courseLink = links.find(link => 
            link.text.toLowerCase().includes('create new course') ||
            link.href.includes('course-create-form')
        );
        
        // If not found, try broader search
        if (!courseLink) {
            const broadCourseLink = links.find(link => 
                (link.text.toLowerCase().includes('course') && link.text.toLowerCase().includes('create')) ||
                link.href.includes('course') && link.href.includes('create')
            );
            if (broadCourseLink) courseLink = broadCourseLink;
        }

        if (courseLink) {
            console.log(`🎯 Found potential course link: "${courseLink.text}"`);
            await this.page.goto(courseLink.href, { waitUntil: 'networkidle2' });
            
            await this.page.screenshot({ 
                path: path.join(this.outputDir, '05-course-page.png'),
                fullPage: true 
            });

            // Try to create course
            await this.attemptCourseCreation();
        }
    }

    async attemptCourseCreation() {
        console.log("🎯 Attempting to create course 'Banana'...");
        
        // Look for course creation form
        const hasNameField = await this.page.$('input[name*="name"], input[placeholder*="name"], input[placeholder*="title"]');
        
        if (hasNameField) {
            console.log("📝 Found name field, entering 'Banana'...");
            
            await this.page.evaluate(() => {
                const nameField = document.querySelector('input[name*="name"], input[placeholder*="name"], input[placeholder*="title"]');
                if (nameField) {
                    nameField.value = 'Banana';
                    nameField.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });

            await this.page.screenshot({ 
                path: path.join(this.outputDir, '06-course-name-entered.png')
            });

            // Try to submit
            await this.page.evaluate(() => {
                const submitBtn = document.querySelector('button[type="submit"], input[type="submit"], button:not([type="button"])');
                if (submitBtn) {
                    submitBtn.click();
                }
            });

            await new Promise(resolve => setTimeout(resolve, 3000));

            await this.page.screenshot({ 
                path: path.join(this.outputDir, '07-course-created.png'),
                fullPage: true 
            });

            console.log("✅ Course creation attempted!");
        } else {
            console.log("❌ No course creation form found on this page");
        }
    }

    async generateReport() {
        const report = `# Simple Login and Course Creation Report

**Target:** https://www.summerschools.com/log-in
**Credentials:** shahriar.rhiday@gmail.com / OctoberNovember47!
**Page Password:** Wwaatdsy1986?!
**Date:** ${new Date().toISOString()}

## Steps Taken
1. ✅ Handled page password
2. ✅ Navigated to login page
3. ✅ Filled credentials
4. ✅ Attempted login
5. 🔍 Explored post-login area
6. 🎯 Attempted course creation

## Generated Screenshots
- \`01-main-page.png\`: Main page after page password
- \`02-login-page.png\`: Login page
- \`03-credentials-filled.png\`: Credentials entered
- \`04-after-login.png\`: Page after login attempt
- \`05-course-page.png\`: Course/dashboard page (if found)
- \`06-course-name-entered.png\`: After entering 'Banana'
- \`07-course-created.png\`: Final result

Review the screenshots to see the actual results!
`;

        await fs.writeFile(path.join(this.outputDir, 'login-report.md'), report);
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

async function loginAndCreateCourse() {
    const bot = new SimpleLoginBot();
    
    try {
        await bot.init();
        await bot.navigateToLogin();
        await bot.performLogin();
        await bot.exploreAfterLogin();
        await bot.generateReport();
        
        console.log("\n✅ Process complete! Check 'login-results' directory for screenshots and report.");
        
    } catch (error) {
        console.error('❌ Process failed:', error);
    } finally {
        await bot.close();
    }
}

if (require.main === module) {
    loginAndCreateCourse();
}

module.exports = { SimpleLoginBot, loginAndCreateCourse };