const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

class BananaCourseCreator {
    constructor() {
        this.browser = null;
        this.page = null;
        this.outputDir = 'banana-course-results';
    }

    async init() {
        console.log("🍌 Initializing Banana Course Creator...");
        this.browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--start-maximized']
        });
        this.page = await this.browser.newPage();
        await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await fs.ensureDir(this.outputDir);
    }

    async loginToSummerschools() {
        console.log("🔐 Logging into summerschools.com...");
        
        // Go directly to login page
        await this.page.goto('https://www.summerschools.com/log-in', { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
        });

        await this.page.screenshot({ 
            path: path.join(this.outputDir, '01-login-page.png'),
            fullPage: true 
        });

        // Wait and fill credentials
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Fill email and password
        await this.page.evaluate(() => {
            const emailField = document.querySelector('input[type="email"], input[name="email"]');
            if (emailField) {
                emailField.value = 'shahriar.rhiday@gmail.com';
                emailField.dispatchEvent(new Event('input', { bubbles: true }));
            }
            
            const passwordFields = document.querySelectorAll('input[type="password"]');
            const loginPasswordField = passwordFields[passwordFields.length - 1];
            if (loginPasswordField) {
                loginPasswordField.value = 'OctoberNovember47!';
                loginPasswordField.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        await this.page.screenshot({ 
            path: path.join(this.outputDir, '02-credentials-filled.png')
        });

        // Submit login
        await this.page.evaluate(() => {
            const submitButton = document.querySelector('input[type="submit"], button[type="submit"]');
            if (submitButton) {
                submitButton.click();
            }
        });

        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log("✅ Login completed, current URL:", this.page.url());
    }

    async navigateToCourseCreation() {
        console.log("🎯 Looking for course creation link...");
        
        // First take screenshot of current page
        await this.page.screenshot({ 
            path: path.join(this.outputDir, '03-dashboard.png'),
            fullPage: true 
        });

        // Look for "Create new course" link and click it
        const courseCreated = await this.page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a'));
            const createLink = links.find(link => 
                link.textContent?.toLowerCase().includes('create new course') ||
                link.href.includes('course-create-form')
            );
            
            if (createLink) {
                createLink.click();
                return true;
            }
            return false;
        });

        if (courseCreated) {
            console.log("✅ Clicked 'Create new course' link");
            // Wait for navigation or page change
            await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
            console.log("⚠️ Create course link not found, trying direct navigation...");
            try {
                await this.page.goto('https://www.summerschools.com/course-create-form', { 
                    waitUntil: 'domcontentloaded', 
                    timeout: 15000 
                });
            } catch (e) {
                console.log("❌ Direct navigation failed, working with current page");
            }
        }

        await this.page.screenshot({ 
            path: path.join(this.outputDir, '04-course-form.png'),
            fullPage: true 
        });

        console.log("📍 Course creation area loaded, current URL:", this.page.url());
    }

    async createBananaCourse() {
        console.log("🍌 Creating 'Banana' course...");
        
        // Wait for form to load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Find and analyze all form fields
        const formFields = await this.page.evaluate(() => {
            const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
            return inputs.map(input => ({
                type: input.type,
                name: input.name,
                id: input.id,
                placeholder: input.placeholder,
                required: input.required,
                tagName: input.tagName,
                className: input.className
            }));
        });
        
        console.log("📋 Found form fields:");
        formFields.forEach(field => {
            console.log(`  - ${field.tagName} [${field.type}] name="${field.name}" id="${field.id}" placeholder="${field.placeholder}"`);
        });

        // Fill in the course name "Banana"
        await this.page.evaluate(() => {
            // Look for course name fields
            const possibleNameFields = [
                'input[name*="name"]',
                'input[name*="title"]', 
                'input[placeholder*="name"]',
                'input[placeholder*="title"]',
                'input[id*="name"]',
                'input[id*="title"]',
                'input[type="text"]:first-of-type'
            ];
            
            let nameField = null;
            for (const selector of possibleNameFields) {
                nameField = document.querySelector(selector);
                if (nameField) {
                    console.log('Found name field with selector:', selector);
                    break;
                }
            }
            
            if (nameField) {
                nameField.value = 'Banana';
                nameField.dispatchEvent(new Event('input', { bubbles: true }));
                nameField.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }
            return false;
        });

        await this.page.screenshot({ 
            path: path.join(this.outputDir, '05-banana-entered.png')
        });

        // Fill other required fields with basic information
        await this.page.evaluate(() => {
            // Fill description if exists
            const descFields = document.querySelectorAll('textarea, input[name*="description"], input[name*="desc"]');
            descFields.forEach(field => {
                if (field.value === '') {
                    field.value = 'A delicious course about bananas and their nutritional benefits.';
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });
            
            // Fill any other required text fields
            const requiredFields = document.querySelectorAll('input[required][type="text"], textarea[required]');
            requiredFields.forEach(field => {
                if (field.value === '' && !field.name.toLowerCase().includes('name')) {
                    field.value = 'Banana';
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });
        });

        await this.page.screenshot({ 
            path: path.join(this.outputDir, '06-all-fields-filled.png')
        });

        console.log("📝 Course details filled");
    }

    async submitCourse() {
        console.log("🚀 Submitting course...");
        
        // Look for submit button
        const submitButton = await this.page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]'));
            
            for (const button of buttons) {
                const text = button.textContent?.toLowerCase() || button.value?.toLowerCase() || '';
                if (text.includes('submit') || text.includes('create') || text.includes('save')) {
                    return {
                        text: button.textContent || button.value,
                        type: button.type,
                        tagName: button.tagName
                    };
                }
            }
            return null;
        });

        if (submitButton) {
            console.log(`✅ Found submit button: "${submitButton.text}"`);
            
            await this.page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]'));
                for (const button of buttons) {
                    const text = button.textContent?.toLowerCase() || button.value?.toLowerCase() || '';
                    if (text.includes('submit') || text.includes('create') || text.includes('save')) {
                        button.click();
                        break;
                    }
                }
            });

            // Wait for submission result
            await new Promise(resolve => setTimeout(resolve, 5000));

            await this.page.screenshot({ 
                path: path.join(this.outputDir, '07-submitted.png'),
                fullPage: true 
            });

            console.log("✅ Course submission completed!");
            console.log("📍 Final URL:", this.page.url());

        } else {
            console.log("❌ No submit button found");
            
            // Take screenshot for debugging
            await this.page.screenshot({ 
                path: path.join(this.outputDir, '07-no-submit-button.png'),
                fullPage: true 
            });
        }
    }

    async generateReport() {
        const report = `# Banana Course Creation Report

**Target:** https://www.summerschools.com/course-create-form
**Course Name:** Banana
**Date:** ${new Date().toISOString()}

## Process Summary
1. ✅ Logged into summerschools.com
2. ✅ Navigated to course creation form
3. ✅ Filled course name as "Banana"
4. ✅ Filled additional required fields
5. ✅ Attempted to submit course

## Generated Screenshots
- \`01-login-page.png\`: Login page
- \`02-credentials-filled.png\`: Credentials entered
- \`03-course-form.png\`: Course creation form
- \`04-banana-entered.png\`: After entering "Banana"
- \`05-all-fields-filled.png\`: All fields completed
- \`06-submitted.png\`: After submission
- \`06-no-submit-button.png\`: Debug if no submit found

Check the screenshots to see if the course was successfully created!
`;

        await fs.writeFile(path.join(this.outputDir, 'banana-course-report.md'), report);
        console.log("\n📋 Report generated: banana-course-report.md");
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

async function createBananaCourse() {
    const creator = new BananaCourseCreator();
    
    try {
        await creator.init();
        await creator.loginToSummerschools();
        await creator.navigateToCourseCreation();
        await creator.createBananaCourse();
        await creator.submitCourse();
        await creator.generateReport();
        
        console.log("\n🍌 Banana course creation process complete!");
        console.log("📁 Check 'banana-course-results' directory for all screenshots and report.");
        
    } catch (error) {
        console.error('❌ Process failed:', error);
    } finally {
        await creator.close();
    }
}

if (require.main === module) {
    createBananaCourse();
}

module.exports = { BananaCourseCreator, createBananaCourse };