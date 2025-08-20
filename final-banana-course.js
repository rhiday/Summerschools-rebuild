const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

class FinalBananaCourseCreator {
    constructor() {
        this.browser = null;
        this.page = null;
        this.outputDir = 'final-banana-results';
        this.pagePassword = 'Wwaatdsy1986?!';
        this.email = 'shahriar.rhiday@gmail.com';
        this.password = 'OctoberNovember47!';
    }

    async init() {
        console.log("🍌 Starting Final Banana Course Creator...");
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
        console.log("🔐 Handling page password protection...");
        
        // Go to main site first to handle page password
        await this.page.goto('https://www.summerschools.com', { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
        });

        // Check for page password
        const hasPagePassword = await this.page.$('input[type="password"]');
        if (hasPagePassword) {
            console.log("🔑 Page password field found, entering password...");
            
            await this.page.type('input[type="password"]', this.pagePassword);
            
            // Look for submit button and click it
            const submitBtn = await this.page.$('button[type="submit"], input[type="submit"], button');
            if (submitBtn) {
                await submitBtn.click();
                await this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {
                    console.log("Navigation timeout after page password - continuing...");
                });
            }
            
            console.log("✅ Page password handled");
        }
        
        await this.page.screenshot({ 
            path: path.join(this.outputDir, '01-after-page-password.png'),
            fullPage: true 
        });
    }

    async loginToAccount() {
        console.log("👤 Logging into user account...");
        
        // Navigate to login page
        await this.page.goto('https://www.summerschools.com/log-in', { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
        });

        await this.page.screenshot({ 
            path: path.join(this.outputDir, '02-login-page.png'),
            fullPage: true 
        });

        // Fill login credentials
        await this.page.waitForSelector('input[type="email"]', { timeout: 10000 });
        await this.page.type('input[type="email"]', this.email);
        
        // Find the login password field (not the page password)
        const passwordFields = await this.page.$$('input[type="password"]');
        if (passwordFields.length > 0) {
            const loginPasswordField = passwordFields[passwordFields.length - 1]; // Get the last one
            await loginPasswordField.type(this.password);
        }

        await this.page.screenshot({ 
            path: path.join(this.outputDir, '03-credentials-entered.png')
        });

        // Submit login form
        await this.page.click('input[type="submit"]');
        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log("✅ Login completed, current URL:", this.page.url());
        
        await this.page.screenshot({ 
            path: path.join(this.outputDir, '04-logged-in.png'),
            fullPage: true 
        });
    }

    async navigateToCourseForm() {
        console.log("🎯 Navigating to course creation form...");
        
        // Look for and click "Create new course" button
        const createClicked = await this.page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('a, button'));
            const createBtn = buttons.find(btn => 
                btn.textContent?.toLowerCase().includes('create new course')
            );
            
            if (createBtn) {
                createBtn.click();
                return true;
            }
            return false;
        });

        if (!createClicked) {
            console.log("🔄 Create button not found, trying direct navigation...");
            await this.page.goto('https://www.summerschools.com/course-create-form', { 
                waitUntil: 'domcontentloaded', 
                timeout: 15000 
            }).catch(() => {
                console.log("Direct navigation failed - working with current page");
            });
        } else {
            console.log("✅ Clicked create course button");
        }

        await new Promise(resolve => setTimeout(resolve, 3000));
        
        await this.page.screenshot({ 
            path: path.join(this.outputDir, '05-course-form-loaded.png'),
            fullPage: true 
        });
    }

    async fillAllFormFields() {
        console.log("📝 Filling all form fields systematically...");
        
        // Wait for form to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Fill each field one by one with waits
        
        // 1. Course name
        await this.page.evaluate(() => {
            const field = document.querySelector('input[name="Course-name"]');
            if (field) {
                field.focus();
                field.value = '';
                field.value = 'Banana Nutrition and Agriculture Course';
                field.dispatchEvent(new Event('input', { bubbles: true }));
                field.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        await new Promise(resolve => setTimeout(resolve, 500));

        // 2. Course details
        await this.page.evaluate(() => {
            const field = document.querySelector('textarea[name="Course-details"]');
            if (field) {
                field.focus();
                field.value = 'An intensive 2-week course exploring banana cultivation, nutritional science, and sustainable agriculture. Students will learn about plant biology, global food systems, and practical farming techniques through hands-on workshops and field experiences.';
                field.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
        await new Promise(resolve => setTimeout(resolve, 500));

        // 3. Location - select first available option
        await this.page.evaluate(() => {
            const select = document.querySelector('select[name="Location"]');
            if (select && select.options.length > 1) {
                select.selectedIndex = 1;
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        await new Promise(resolve => setTimeout(resolve, 500));

        // 4. Accommodation details
        await this.page.evaluate(() => {
            const field = document.querySelector('textarea[name="Accommodation-Details"]');
            if (field) {
                field.value = '• Modern dormitory accommodation with shared facilities\n• All meals included (breakfast, lunch, dinner)\n• High-speed Wi-Fi throughout campus\n• 24/7 residential support staff\n• Laundry facilities and common areas\n• Safe and secure environment';
                field.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
        await new Promise(resolve => setTimeout(resolve, 500));

        // 5. Tuition details
        await this.page.evaluate(() => {
            const field = document.querySelector('textarea[name="Tuition-Details"]');
            if (field) {
                field.value = '• Daily interactive lectures by expert botanists\n• Laboratory sessions for plant analysis\n• Field trips to local organic farms\n• Group research projects and presentations\n• Individual mentoring sessions\n• Comprehensive course materials included';
                field.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
        await new Promise(resolve => setTimeout(resolve, 500));

        // 6. Extra activities
        await this.page.evaluate(() => {
            const field = document.querySelector('textarea[name="Extra"]');
            if (field) {
                field.value = '• Cooking workshops using fresh produce\n• Cultural exchange activities\n• Sports and recreational programs\n• Evening entertainment and social events\n• Local excursions and sightseeing\n• Certificate presentation ceremony';
                field.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
        await new Promise(resolve => setTimeout(resolve, 500));

        // 7. Course fee
        await this.page.evaluate(() => {
            const field = document.querySelector('input[name="Course-fee"]');
            if (field) {
                field.focus();
                field.value = '2500';
                field.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
        await new Promise(resolve => setTimeout(resolve, 500));

        // 8. Course duration
        await this.page.evaluate(() => {
            const select = document.querySelector('select[name="Course-duration"]');
            if (select && select.options.length > 1) {
                select.selectedIndex = 1;
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log("✅ Phase 1 fields completed");
        
        await this.page.screenshot({ 
            path: path.join(this.outputDir, '06-phase1-complete.png'),
            fullPage: true 
        });
    }

    async fillDatesAndContactInfo() {
        console.log("📅 Filling dates and contact information...");
        
        // Start date
        await this.page.evaluate(() => {
            const field = document.querySelector('input[id="startDateInput"]');
            if (field) {
                field.focus();
                field.value = '01/08/2025';
                field.dispatchEvent(new Event('input', { bubbles: true }));
                field.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        await new Promise(resolve => setTimeout(resolve, 500));

        // End date  
        await this.page.evaluate(() => {
            const field = document.querySelector('input[id="endDateInput"]');
            if (field) {
                field.focus();
                field.value = '15/08/2025';
                field.dispatchEvent(new Event('input', { bubbles: true }));
                field.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        await new Promise(resolve => setTimeout(resolve, 500));

        // Age range
        await this.page.evaluate(() => {
            const select = document.querySelector('select[name="age-range"]');
            if (select && select.options.length > 1) {
                select.selectedIndex = 1;
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        await new Promise(resolve => setTimeout(resolve, 500));

        // Min age
        await this.page.evaluate(() => {
            const field = document.querySelector('input[name="Minimum-Age"]');
            if (field) {
                field.value = '14';
                field.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        // Max age  
        await this.page.evaluate(() => {
            const field = document.querySelector('input[name="Maximum-Age"]');
            if (field) {
                field.value = '18';
                field.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        // Contact email
        await this.page.evaluate(() => {
            const field = document.querySelector('input[name="contact-email"]');
            if (field) {
                field.value = 'info@banana-academy.com';
                field.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        // Provider link
        await this.page.evaluate(() => {
            const field = document.querySelector('input[name="provider-link"]');
            if (field) {
                field.value = 'https://www.banana-academy.com';
                field.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        console.log("✅ Dates and contact info completed");
        
        await this.page.screenshot({ 
            path: path.join(this.outputDir, '07-dates-contact-complete.png'),
            fullPage: true 
        });
    }

    async finalSubmission() {
        console.log("🚀 Final submission process...");
        
        // Accept terms
        await this.page.evaluate(() => {
            const checkbox = document.querySelector('input[name="checkbox"]');
            if (checkbox && !checkbox.checked) {
                checkbox.click();
            }
        });
        await new Promise(resolve => setTimeout(resolve, 1000));

        await this.page.screenshot({ 
            path: path.join(this.outputDir, '08-ready-to-submit.png'),
            fullPage: true 
        });

        // Submit with retry logic
        console.log("🎯 Clicking submit button...");
        
        const submitted = await this.page.evaluate(() => {
            const submitBtn = document.querySelector('input[type="submit"]');
            if (submitBtn) {
                submitBtn.click();
                return true;
            }
            return false;
        });

        if (submitted) {
            console.log("✅ Submit button clicked, waiting for response...");
            
            // Wait longer for processing
            await new Promise(resolve => setTimeout(resolve, 10000));
            
            await this.page.screenshot({ 
                path: path.join(this.outputDir, '09-submitted.png'),
                fullPage: true 
            });

            console.log("🎉 Submission completed!");
            console.log("📍 Final URL:", this.page.url());
            
            // Check if we're redirected or get success message
            const currentUrl = this.page.url();
            if (currentUrl.includes('view-courses') || currentUrl !== 'https://www.summerschools.com/course-create-form') {
                console.log("🎊 SUCCESS: Redirected away from form - course likely created!");
            } else {
                console.log("⚠️ Still on form page - checking for error messages...");
                
                const errorMessages = await this.page.evaluate(() => {
                    const errors = Array.from(document.querySelectorAll('.error, .alert, .message'));
                    return errors.map(el => el.textContent?.trim()).filter(text => text);
                });
                
                if (errorMessages.length > 0) {
                    console.log("❌ Error messages found:", errorMessages);
                } else {
                    console.log("🤔 No error messages - submission status unclear");
                }
            }
            
        } else {
            console.log("❌ Submit button not found!");
        }
    }

    async close() {
        console.log("🔚 Closing browser...");
        if (this.browser) {
            await this.browser.close();
        }
    }
}

async function createFinalBananaCourse() {
    const creator = new FinalBananaCourseCreator();
    
    try {
        await creator.init();
        await creator.handlePagePassword();
        await creator.loginToAccount();
        await creator.navigateToCourseForm();
        await creator.fillAllFormFields();
        await creator.fillDatesAndContactInfo();
        await creator.finalSubmission();
        
        console.log("\n🍌 Final Banana course creation process completed!");
        console.log("📁 Check 'final-banana-results' directory for all screenshots");
        console.log("🎯 If successful, the course should now be in your dashboard!");
        
    } catch (error) {
        console.error('❌ Process failed:', error.message);
    } finally {
        await creator.close();
    }
}

if (require.main === module) {
    createFinalBananaCourse();
}

module.exports = { FinalBananaCourseCreator, createFinalBananaCourse };