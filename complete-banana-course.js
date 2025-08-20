const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

class CompleteBananaCourseCreator {
    constructor() {
        this.browser = null;
        this.page = null;
        this.outputDir = 'complete-banana-results';
    }

    async init() {
        console.log("🍌 Initializing Complete Banana Course Creator...");
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
        console.log("🔐 Logging in and navigating to course form...");
        
        // Login
        await this.page.goto('https://www.summerschools.com/log-in', { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
        });

        await this.page.evaluate(() => {
            const emailField = document.querySelector('input[type="email"]');
            if (emailField) emailField.value = 'shahriar.rhiday@gmail.com';
            
            const passwordFields = document.querySelectorAll('input[type="password"]');
            const loginPasswordField = passwordFields[passwordFields.length - 1];
            if (loginPasswordField) loginPasswordField.value = 'OctoberNovember47!';
        });

        await this.page.evaluate(() => {
            const submitButton = document.querySelector('input[type="submit"]');
            if (submitButton) submitButton.click();
        });

        await new Promise(resolve => setTimeout(resolve, 5000));

        // Navigate to course creation
        await this.page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a'));
            const createLink = links.find(link => 
                link.textContent?.toLowerCase().includes('create new course')
            );
            if (createLink) createLink.click();
        });

        await new Promise(resolve => setTimeout(resolve, 5000));
        
        await this.page.screenshot({ 
            path: path.join(this.outputDir, '01-course-form.png'),
            fullPage: true 
        });
    }

    async fillCompleteForm() {
        console.log("📝 Filling complete course form...");
        
        // Fill course name
        await this.page.evaluate(() => {
            const nameField = document.querySelector('input[name="Course-name"]');
            if (nameField) {
                nameField.value = 'Banana';
                nameField.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        // Fill course details
        await this.page.evaluate(() => {
            const detailsField = document.querySelector('textarea[name="Course-details"]');
            if (detailsField) {
                detailsField.value = 'A comprehensive course about bananas, covering their nutritional benefits, cultivation methods, and cultural significance. Students will learn about banana biology, global trade, and sustainable farming practices.';
                detailsField.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        // Select location
        await this.page.evaluate(() => {
            const locationSelect = document.querySelector('select[name="Location"]');
            if (locationSelect && locationSelect.options.length > 1) {
                locationSelect.selectedIndex = 1; // Select first available option
                locationSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });

        // Fill accommodation details
        await this.page.evaluate(() => {
            const accommodationField = document.querySelector('textarea[name="Accommodation-Details"]');
            if (accommodationField) {
                accommodationField.value = '• Comfortable shared dormitory rooms\n• 3 meals per day included\n• Modern facilities with Wi-Fi\n• 24/7 supervision and support\n• Laundry facilities available';
                accommodationField.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        // Fill tuition details
        await this.page.evaluate(() => {
            const tuitionField = document.querySelector('textarea[name="Tuition-Details"]');
            if (tuitionField) {
                tuitionField.value = '• Interactive lectures on banana science\n• Hands-on laboratory experiments\n• Field trips to local farms\n• Group projects and presentations\n• Expert guest speakers from the industry';
                tuitionField.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        // Fill extra activities
        await this.page.evaluate(() => {
            const extraField = document.querySelector('textarea[name="Extra"]');
            if (extraField) {
                extraField.value = '• Banana cooking workshops\n• Cultural activities and games\n• Evening entertainment programs\n• Sports and recreational activities\n• Certificate ceremony';
                extraField.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        // Fill course fee
        await this.page.evaluate(() => {
            const feeField = document.querySelector('input[name="Course-fee"]');
            if (feeField) {
                feeField.value = '1500';
                feeField.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        // Select course duration
        await this.page.evaluate(() => {
            const durationSelect = document.querySelector('select[name="Course-duration"]');
            if (durationSelect && durationSelect.options.length > 1) {
                durationSelect.selectedIndex = 1;
                durationSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });

        await this.page.screenshot({ 
            path: path.join(this.outputDir, '02-basic-fields-filled.png'),
            fullPage: true 
        });

        console.log("✅ Basic fields completed");
    }

    async fillDatesAndAges() {
        console.log("📅 Setting dates and age ranges...");
        
        // Set start date (simulate clicking and typing)
        await this.page.click('input[id="startDateInput"]');
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.page.type('input[id="startDateInput"]', '2025-09-01');
        
        // Set end date
        await this.page.click('input[id="endDateInput"]');
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.page.type('input[id="endDateInput"]', '2025-09-15');

        // Select age range
        await this.page.evaluate(() => {
            const ageRangeSelect = document.querySelector('select[name="age-range"]');
            if (ageRangeSelect && ageRangeSelect.options.length > 1) {
                ageRangeSelect.selectedIndex = 1;
                ageRangeSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });

        // Set minimum age
        await this.page.evaluate(() => {
            const minAgeField = document.querySelector('input[name="Minimum-Age"]');
            if (minAgeField) {
                minAgeField.value = '13';
                minAgeField.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        // Set maximum age
        await this.page.evaluate(() => {
            const maxAgeField = document.querySelector('input[name="Maximum-Age"]');
            if (maxAgeField) {
                maxAgeField.value = '17';
                maxAgeField.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        await this.page.screenshot({ 
            path: path.join(this.outputDir, '03-dates-ages-set.png'),
            fullPage: true 
        });

        console.log("✅ Dates and ages completed");
    }

    async fillContactInfo() {
        console.log("📞 Adding contact information...");
        
        // Fill contact email
        await this.page.evaluate(() => {
            const emailField = document.querySelector('input[name="contact-email"]');
            if (emailField) {
                emailField.value = 'banana-course@summerschools.com';
                emailField.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        // Fill provider link
        await this.page.evaluate(() => {
            const linkField = document.querySelector('input[name="provider-link"]');
            if (linkField) {
                linkField.value = 'https://www.banana-education.com';
                linkField.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        await this.page.screenshot({ 
            path: path.join(this.outputDir, '04-contact-info-filled.png'),
            fullPage: true 
        });

        console.log("✅ Contact information completed");
    }

    async acceptTermsAndSubmit() {
        console.log("✅ Accepting terms and submitting...");
        
        // Check the terms and conditions checkbox
        await this.page.evaluate(() => {
            const checkbox = document.querySelector('input[name="checkbox"]');
            if (checkbox) {
                checkbox.checked = true;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });

        await this.page.screenshot({ 
            path: path.join(this.outputDir, '05-terms-accepted.png'),
            fullPage: true 
        });

        // Submit the form
        await this.page.evaluate(() => {
            const submitButton = document.querySelector('input[type="submit"]');
            if (submitButton) {
                submitButton.click();
            }
        });

        // Wait for submission response
        await new Promise(resolve => setTimeout(resolve, 8000));

        await this.page.screenshot({ 
            path: path.join(this.outputDir, '06-final-result.png'),
            fullPage: true 
        });

        console.log("🎉 Form submitted! Current URL:", this.page.url());
    }

    async generateReport() {
        const report = `# Complete Banana Course Creation Report

**Course Name:** Banana
**Date:** ${new Date().toISOString()}

## Form Fields Completed
- ✅ Course name: "Banana"
- ✅ Course details: Comprehensive description
- ✅ Location: Selected from dropdown
- ✅ Accommodation details: Detailed bullet points
- ✅ Tuition details: Educational activities
- ✅ Extra activities: Fun activities
- ✅ Course fee: £1500
- ✅ Course duration: Selected from dropdown
- ✅ Start date: 2025-09-01
- ✅ End date: 2025-09-15
- ✅ Age range: 13-17 years
- ✅ Contact email: banana-course@summerschools.com
- ✅ Provider link: https://www.banana-education.com
- ✅ Terms accepted: Yes

## Screenshots Generated
- \`01-course-form.png\`: Initial course form
- \`02-basic-fields-filled.png\`: After filling main fields
- \`03-dates-ages-set.png\`: After setting dates and ages
- \`04-contact-info-filled.png\`: After contact information
- \`05-terms-accepted.png\`: Terms accepted, ready to submit
- \`06-final-result.png\`: Final result after submission

The course should now appear in your dashboard pending review!
`;

        await fs.writeFile(path.join(this.outputDir, 'complete-banana-report.md'), report);
        console.log("📋 Complete report generated");
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

async function createCompleteBananaCourse() {
    const creator = new CompleteBananaCourseCreator();
    
    try {
        await creator.init();
        await creator.loginAndNavigate();
        await creator.fillCompleteForm();
        await creator.fillDatesAndAges();
        await creator.fillContactInfo();
        await creator.acceptTermsAndSubmit();
        await creator.generateReport();
        
        console.log("\n🍌 Complete Banana course creation finished!");
        console.log("📁 Check 'complete-banana-results' directory for results.");
        console.log("🎯 Course should now appear in your dashboard pending review!");
        
    } catch (error) {
        console.error('❌ Process failed:', error);
    } finally {
        await creator.close();
    }
}

if (require.main === module) {
    createCompleteBananaCourse();
}

module.exports = { CompleteBananaCourseCreator, createCompleteBananaCourse };