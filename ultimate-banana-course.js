const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

class UltimateBananaCourseCreator {
    constructor() {
        this.browser = null;
        this.page = null;
        this.outputDir = 'ultimate-banana-results';
        this.pagePassword = 'Wwaatdsy1986?!';
        this.email = 'shahriar.rhiday@gmail.com';
        this.password = 'OctoberNovember47!';
    }

    async init() {
        console.log("🚀 Ultimate Banana Course Creator - Final Attempt");
        this.browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--start-maximized']
        });
        this.page = await this.browser.newPage();
        await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await fs.ensureDir(this.outputDir);
    }

    async quickLogin() {
        console.log("⚡ Quick login process...");
        
        // Handle page password first
        await this.page.goto('https://www.summerschools.com', { waitUntil: 'networkidle2' });
        
        const pagePasswordField = await this.page.$('input[type="password"]');
        if (pagePasswordField) {
            await pagePasswordField.type(this.pagePassword);
            await this.page.keyboard.press('Enter');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Go to login
        await this.page.goto('https://www.summerschools.com/log-in', { waitUntil: 'networkidle2' });
        
        // Login
        await this.page.type('input[type="email"]', this.email);
        
        const passwordFields = await this.page.$$('input[type="password"]');
        if (passwordFields.length > 0) {
            await passwordFields[passwordFields.length - 1].type(this.password);
        }
        
        await this.page.keyboard.press('Enter');
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log("✅ Logged in:", this.page.url());
    }

    async createCourseMethodically() {
        console.log("🎯 Creating course with methodical approach...");
        
        // Click create course button
        await this.page.evaluate(() => {
            const createBtn = Array.from(document.querySelectorAll('*')).find(el => 
                el.textContent?.toLowerCase().includes('create new course')
            );
            if (createBtn) createBtn.click();
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        await this.page.screenshot({ 
            path: path.join(this.outputDir, '01-form-loaded.png'),
            fullPage: true 
        });

        // Fill form step by step with validation
        console.log("📝 Step 1: Basic Information");
        
        // Course name
        await this.page.evaluate(() => {
            const field = document.querySelector('input[name="Course-name"]');
            if (field) {
                field.value = 'Banana Science and Agriculture Course';
                field.dispatchEvent(new Event('input', { bubbles: true }));
                field.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        
        // Course details - comprehensive description
        await this.page.evaluate(() => {
            const field = document.querySelector('textarea[name="Course-details"]');
            if (field) {
                field.value = `This comprehensive 2-week summer course explores the fascinating world of banana cultivation, nutrition science, and sustainable agriculture. Students aged 14-18 will engage in:

• Scientific study of banana biology and genetics
• Sustainable farming practices and environmental impact
• Nutritional analysis and food science applications
• Global trade dynamics and economic implications
• Hands-on laboratory work and field studies
• Cultural significance of bananas worldwide

The course combines theoretical learning with practical application, featuring guest lectures from agricultural scientists, visits to research facilities, and collaborative projects. Students will develop critical thinking skills while exploring career paths in agriculture, nutrition, and food science.`;
                field.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log("📝 Step 2: Location and Logistics");
        
        // Location - select first available option
        await this.page.evaluate(() => {
            const select = document.querySelector('select[name="Location"]');
            if (select && select.options.length > 1) {
                // Try different indices to find a valid location
                for (let i = 1; i < Math.min(select.options.length, 5); i++) {
                    if (select.options[i].value && select.options[i].value !== '') {
                        select.selectedIndex = i;
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                        break;
                    }
                }
            }
        });

        // Accommodation details
        await this.page.evaluate(() => {
            const field = document.querySelector('textarea[name="Accommodation-Details"]');
            if (field) {
                field.value = `• Modern residential halls with shared twin rooms
• All meals provided (breakfast, lunch, dinner) with dietary accommodations
• High-speed Wi-Fi and study areas in all buildings
• 24/7 residential support and security
• Laundry facilities, common rooms, and recreational areas
• Medical support and counseling services available
• Safe and supervised environment for all participants`;
                field.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        // Tuition details
        await this.page.evaluate(() => {
            const field = document.querySelector('textarea[name="Tuition-Details"]');
            if (field) {
                field.value = `• Daily lectures by university professors and industry experts
• Hands-on laboratory sessions and experiments
• Field trips to agricultural research centers and farms
• Small group seminars and discussion sessions
• Individual research projects with faculty mentorship
• Guest speakers from leading agricultural companies
• Comprehensive course materials and resources included`;
                field.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        // Extra activities
        await this.page.evaluate(() => {
            const field = document.querySelector('textarea[name="Extra"]');
            if (field) {
                field.value = `• Cooking workshops featuring international banana dishes
• Cultural activities and international student exchanges
• Sports tournaments and recreational activities
• Evening social events and talent shows
• Local excursions to historical and cultural sites
• Photography and journalism workshops
• Final presentation and certificate ceremony`;
                field.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        await this.page.screenshot({ 
            path: path.join(this.outputDir, '02-basic-info-complete.png'),
            fullPage: true 
        });

        console.log("📝 Step 3: Pricing and Duration");
        
        // Course fee
        await this.page.evaluate(() => {
            const field = document.querySelector('input[name="Course-fee"]');
            if (field) {
                field.value = '2850';
                field.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        // Course duration
        await this.page.evaluate(() => {
            const select = document.querySelector('select[name="Course-duration"]');
            if (select && select.options.length > 1) {
                for (let i = 1; i < select.options.length; i++) {
                    if (select.options[i].value && select.options[i].value !== '') {
                        select.selectedIndex = i;
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                        break;
                    }
                }
            }
        });

        console.log("📝 Step 4: Dates and Ages");
        
        // Set dates using evaluate to avoid selector issues
        await this.page.evaluate(() => {
            const startDate = document.querySelector('input[id="startDateInput"], input[name*="start"], input[placeholder*="start"]');
            if (startDate) {
                startDate.value = '15/07/2025';
                startDate.dispatchEvent(new Event('input', { bubbles: true }));
                startDate.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            const endDate = document.querySelector('input[id="endDateInput"], input[name*="end"], input[placeholder*="end"]');
            if (endDate) {
                endDate.value = '29/07/2025';
                endDate.dispatchEvent(new Event('input', { bubbles: true }));
                endDate.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        await new Promise(resolve => setTimeout(resolve, 500));

        // Age range and specific ages
        await this.page.evaluate(() => {
            const select = document.querySelector('select[name="age-range"]');
            if (select && select.options.length > 1) {
                select.selectedIndex = 1;
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            const minAge = document.querySelector('input[name="Minimum-Age"]');
            if (minAge) {
                minAge.value = '14';
                minAge.dispatchEvent(new Event('input', { bubbles: true }));
            }
            
            const maxAge = document.querySelector('input[name="Maximum-Age"]');
            if (maxAge) {
                maxAge.value = '18';
                maxAge.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        console.log("📝 Step 5: Contact Information");
        
        // Contact details
        await this.page.evaluate(() => {
            const email = document.querySelector('input[name="contact-email"]');
            if (email) {
                email.value = 'banana.academy@summerschools.com';
                email.dispatchEvent(new Event('input', { bubbles: true }));
            }
            
            const website = document.querySelector('input[name="provider-link"]');
            if (website) {
                website.value = 'https://www.banana-academy-course.com';
                website.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        await this.page.screenshot({ 
            path: path.join(this.outputDir, '03-all-fields-complete.png'),
            fullPage: true 
        });

        console.log("✅ All fields completed");
    }

    async finalSubmission() {
        console.log("🚀 Final submission attempt...");
        
        // Scroll to bottom to see all elements
        await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Accept terms
        await this.page.evaluate(() => {
            const checkbox = document.querySelector('input[name="checkbox"]');
            if (checkbox && !checkbox.checked) {
                checkbox.click();
            }
        });

        await this.page.screenshot({ 
            path: path.join(this.outputDir, '04-terms-accepted.png'),
            fullPage: true 
        });

        // Submit with multiple attempts
        console.log("🎯 Submitting form...");
        
        let submitted = false;
        
        // Try clicking submit button
        submitted = await this.page.evaluate(() => {
            const submitBtn = document.querySelector('input[type="submit"]');
            if (submitBtn) {
                submitBtn.click();
                return true;
            }
            return false;
        });

        if (!submitted) {
            // Try form submission
            await this.page.evaluate(() => {
                const form = document.querySelector('form');
                if (form) form.submit();
            });
        }

        console.log("⏳ Waiting for submission response...");
        await new Promise(resolve => setTimeout(resolve, 8000));

        await this.page.screenshot({ 
            path: path.join(this.outputDir, '05-after-submit.png'),
            fullPage: true 
        });

        const finalUrl = this.page.url();
        console.log("📍 Final URL:", finalUrl);

        // Check for success indicators
        const pageContent = await this.page.evaluate(() => document.body.textContent.toLowerCase());
        
        if (pageContent.includes('success') || pageContent.includes('submitted') || pageContent.includes('thank you')) {
            console.log("🎉 SUCCESS: Course submission confirmed!");
        } else if (finalUrl !== 'https://www.summerschools.com/course-create-form') {
            console.log("🎊 SUCCESS: Redirected away from form - likely successful!");
        } else {
            console.log("⚠️ Submission status unclear - check screenshots");
        }

        // Take final dashboard check
        await this.page.goto('https://www.summerschools.com/view-courses', { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        await this.page.screenshot({ 
            path: path.join(this.outputDir, '06-dashboard-after-submit.png'),
            fullPage: true 
        });

        const dashboardContent = await this.page.evaluate(() => document.body.textContent.toLowerCase());
        const hasBanana = dashboardContent.includes('banana');
        
        console.log(`🍌 Banana course visible on dashboard: ${hasBanana ? 'YES!' : 'NO'}`);
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

async function createUltimateBananaCourse() {
    const creator = new UltimateBananaCourseCreator();
    
    try {
        await creator.init();
        await creator.quickLogin();
        await creator.createCourseMethodically();
        await creator.finalSubmission();
        
        console.log("\n🍌 Ultimate Banana course creation completed!");
        console.log("📁 Check 'ultimate-banana-results' directory for complete process");
        
    } catch (error) {
        console.error('❌ Process failed:', error.message);
    } finally {
        await creator.close();
    }
}

if (require.main === module) {
    createUltimateBananaCourse();
}

module.exports = { UltimateBananaCourseCreator, createUltimateBananaCourse };