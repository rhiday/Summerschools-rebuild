const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

class SummerSchoolsCourseCreator {
    constructor() {
        this.browser = null;
        this.page = null;
        this.outputDir = 'course-creation-results';
    }

    async init() {
        this.browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--start-maximized']
        });
        this.page = await this.browser.newPage();
        await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await fs.ensureDir(this.outputDir);
    }

    async login() {
        console.log("🚀 Starting login process...");
        
        // First navigate to main site to handle page password
        console.log("📍 Navigating to main site...");
        await this.page.goto('https://www.summerschools.com', { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
        });

        // Check for page password protection
        const pagePasswordField = await this.page.$('input[type="password"]');
        if (pagePasswordField) {
            console.log("🔐 Page password protection detected, entering credentials...");
            await pagePasswordField.type('Wwaatdsy1986?!');
            
            const pageSubmitButton = await this.page.$('button[type="submit"], input[type="submit"], button');
            if (pageSubmitButton) {
                await pageSubmitButton.click();
                try {
                    await this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 });
                } catch (timeoutError) {
                    console.log("⚠️ Page password navigation timeout, but continuing...");
                }
            }
        }

        // Now navigate to login page
        console.log("📍 Navigating to login page...");
        await this.page.goto('https://www.summerschools.com/log-in', { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
        });

        // Take screenshot of login page
        await this.page.screenshot({ 
            path: path.join(this.outputDir, 'login-page.png'),
            fullPage: true 
        });

        console.log("🔐 Entering login credentials...");
        
        // Wait a bit for the page to fully load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Find and fill email field
        const emailSelectors = ['input[type="email"]', 'input[name="email"]', '#email', 'input[placeholder*="email"]', 'input[type="text"]:first-of-type'];
        let emailField = null;
        
        for (const selector of emailSelectors) {
            try {
                emailField = await this.page.$(selector);
                if (emailField) {
                    console.log(`✅ Found email field with selector: ${selector}`);
                    break;
                }
            } catch (e) {
                continue;
            }
        }
        
        if (emailField) {
            try {
                await this.page.waitForFunction(el => el.offsetHeight > 0, {}, emailField);
                await emailField.click();
                await emailField.evaluate(el => el.value = ''); // Clear the field
                await emailField.type('shahriar.rhiday@gmail.com');
            } catch (e) {
                console.log("⚠️ Error clicking email field, trying alternative method...");
                await emailField.evaluate(el => {
                    el.value = 'shahriar.rhiday@gmail.com';
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                });
            }
        }

        // Find and fill password field (but skip the page password field)
        const passwordSelectors = ['input[name="password"]', '#password', 'input[placeholder*="password"]'];
        let loginPasswordField = null;
        
        for (const selector of passwordSelectors) {
            try {
                loginPasswordField = await this.page.$(selector);
                if (loginPasswordField) {
                    console.log(`✅ Found password field with selector: ${selector}`);
                    break;
                }
            } catch (e) {
                continue;
            }
        }
        
        if (loginPasswordField) {
            try {
                await this.page.waitForFunction(el => el.offsetHeight > 0, {}, loginPasswordField);
                await loginPasswordField.click();
                await loginPasswordField.evaluate(el => el.value = ''); // Clear the field
                await loginPasswordField.type('OctoberNovember47!');
            } catch (e) {
                console.log("⚠️ Error clicking password field, trying alternative method...");
                await loginPasswordField.evaluate(el => {
                    el.value = 'OctoberNovember47!';
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                });
            }
        }

        // Take screenshot before login
        await this.page.screenshot({ 
            path: path.join(this.outputDir, 'before-login.png')
        });

        // Find and click login button
        const loginSelectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'button',
            '.login-button',
            '.submit-button'
        ];
        
        let loginButton = null;
        for (const selector of loginSelectors) {
            try {
                const buttons = await this.page.$$(selector);
                for (const button of buttons) {
                    const text = await button.evaluate(el => el.textContent?.toLowerCase() || '');
                    if (text.includes('log') || text.includes('sign') || text.includes('submit') || selector.includes('submit')) {
                        console.log(`✅ Found login button: "${text}" with selector: ${selector}`);
                        loginButton = button;
                        break;
                    }
                }
                if (loginButton) break;
            } catch (e) {
                continue;
            }
        }
        
        if (loginButton) {
            console.log("🔘 Clicking login button...");
            await loginButton.click();
        } else {
            // Try pressing Enter on password field
            console.log("⚠️ No login button found, trying Enter key...");
            await this.page.keyboard.press('Enter');
        }

        // Wait for navigation or dashboard
        try {
            await this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 });
        } catch (timeoutError) {
            console.log("⚠️ Login navigation timeout, checking current state...");
        }

        // Wait a bit and take screenshot
        await new Promise(resolve => setTimeout(resolve, 3000));
        await this.page.screenshot({ 
            path: path.join(this.outputDir, 'after-login.png'),
            fullPage: true 
        });

        console.log("✅ Login attempt completed");
    }

    async findCourseCreationPage() {
        console.log("🔍 Looking for course creation options...");
        
        // Common selectors for course creation
        const createSelectors = [
            'a[href*="create"]',
            'a[href*="new"]',
            'a[href*="course"]',
            'button',
            '.create-course',
            '.new-course',
            '#create-course',
            '.btn'
        ];

        let foundCreateButton = null;
        
        for (const selector of createSelectors) {
            try {
                const element = await this.page.$(selector);
                if (element) {
                    const text = await element.evaluate(el => el.textContent?.toLowerCase() || '');
                    if (text.includes('create') || text.includes('new') || text.includes('course')) {
                        console.log(`✅ Found potential create button: "${text}" with selector: ${selector}`);
                        foundCreateButton = element;
                        break;
                    }
                }
            } catch (e) {
                continue;
            }
        }

        // If no direct button found, look for navigation menus
        if (!foundCreateButton) {
            console.log("🔍 Searching navigation menus...");
            
            const navSelectors = [
                'nav a', '.nav a', '.navbar a', '.menu a', 
                'header a', '.header a', '.navigation a'
            ];
            
            for (const selector of navSelectors) {
                try {
                    const links = await this.page.$$(selector);
                    for (const link of links) {
                        const text = await link.evaluate(el => el.textContent?.toLowerCase() || '');
                        const href = await link.evaluate(el => el.href || '');
                        
                        if (text.includes('create') || text.includes('new') || 
                            text.includes('course') || text.includes('add') ||
                            href.includes('create') || href.includes('new')) {
                            console.log(`✅ Found navigation link: "${text}" (${href})`);
                            foundCreateButton = link;
                            break;
                        }
                    }
                    if (foundCreateButton) break;
                } catch (e) {
                    continue;
                }
            }
        }

        return foundCreateButton;
    }

    async createCourse(courseName = 'Banana') {
        console.log(`🎯 Attempting to create course: "${courseName}"`);
        
        // Look for course creation option
        const createButton = await this.findCourseCreationPage();
        
        if (createButton) {
            console.log("🔘 Clicking create course button...");
            await createButton.click();
            
            // Wait for course creation page to load
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Take screenshot of course creation page
            await this.page.screenshot({ 
                path: path.join(this.outputDir, 'course-creation-page.png'),
                fullPage: true 
            });
            
            // Look for course name field
            const nameSelectors = [
                'input[name="name"]',
                'input[name="title"]',
                'input[name="courseName"]',
                'input[name="course_name"]',
                '#course-name',
                '#courseName',
                '#name',
                '#title',
                'input[placeholder*="name"]',
                'input[placeholder*="title"]',
                'input[type="text"]:first-of-type'
            ];
            
            let nameField = null;
            for (const selector of nameSelectors) {
                try {
                    nameField = await this.page.$(selector);
                    if (nameField) {
                        console.log(`✅ Found name field with selector: ${selector}`);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            if (nameField) {
                console.log(`📝 Entering course name: "${courseName}"`);
                await nameField.click();
                await nameField.evaluate(el => el.value = ''); // Clear the field
                await nameField.type(courseName);
                
                // Take screenshot after entering name
                await this.page.screenshot({ 
                    path: path.join(this.outputDir, 'course-name-entered.png')
                });
                
                // Look for submit/save/create button
                const submitSelectors = [
                    'button[type="submit"]',
                    'input[type="submit"]',
                    'button',
                    '.submit',
                    '.save',
                    '.create',
                    '.btn'
                ];
                
                let submitButton = null;
                for (const selector of submitSelectors) {
                    try {
                        const buttons = await this.page.$$(selector);
                        for (const button of buttons) {
                            const text = await button.evaluate(el => el.textContent?.toLowerCase() || '');
                            if (text.includes('create') || text.includes('save') || text.includes('submit') || selector.includes('submit')) {
                                console.log(`✅ Found submit button: "${text}" with selector: ${selector}`);
                                submitButton = button;
                                break;
                            }
                        }
                        if (submitButton) break;
                    } catch (e) {
                        continue;
                    }
                }
                
                if (submitButton) {
                    console.log("🚀 Submitting course creation...");
                    await submitButton.click();
                    
                    // Wait for response
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    
                    // Take final screenshot
                    await this.page.screenshot({ 
                        path: path.join(this.outputDir, 'course-created.png'),
                        fullPage: true 
                    });
                    
                    console.log(`✅ Course "${courseName}" creation attempted!`);
                } else {
                    console.log("❌ Could not find submit button");
                }
            } else {
                console.log("❌ Could not find course name field");
            }
        } else {
            console.log("❌ Could not find course creation option");
            
            // Take screenshot of current page to see what's available
            await this.page.screenshot({ 
                path: path.join(this.outputDir, 'current-page.png'),
                fullPage: true 
            });
            
            // Log all available links for debugging
            const allLinks = await this.page.$$eval('a', links => 
                links.map(link => ({ text: link.textContent?.trim(), href: link.href }))
                    .filter(link => link.text && link.text.length > 0)
                    .slice(0, 20)
            );
            
            console.log("🔍 Available links on current page:");
            allLinks.forEach(link => console.log(`- "${link.text}" -> ${link.href}`));
        }
    }

    async generateReport() {
        const report = `# Course Creation Attempt Report

**Target Website:** https://www.summerschools.com
**Course Name:** Banana
**Attempt Date:** ${new Date().toISOString()}

## Process Steps
1. ✅ Navigated to login page
2. ✅ Entered credentials (shahriar.rhiday@gmail.com)
3. ✅ Attempted login
4. 🔍 Searched for course creation options
5. 🎯 Attempted to create course named "Banana"

## Generated Screenshots
- \`login-page.png\`: Initial login page
- \`before-login.png\`: Form filled, before submission
- \`after-login.png\`: Page after login attempt
- \`course-creation-page.png\`: Course creation interface (if found)
- \`course-name-entered.png\`: After entering course name
- \`course-created.png\`: Final result
- \`current-page.png\`: Current page state for debugging

## Next Steps
Review the screenshots to verify the process and check if the course was successfully created.
`;

        await fs.writeFile(
            path.join(this.outputDir, 'course-creation-report.md'),
            report
        );
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

async function createBananaCourse() {
    const creator = new SummerSchoolsCourseCreator();
    
    try {
        await creator.init();
        await creator.login();
        await creator.createCourse('Banana');
        await creator.generateReport();
        
        console.log("\n✅ Process complete! Check 'course-creation-results' directory for screenshots and report.");
        
    } catch (error) {
        console.error('❌ Course creation failed:', error);
        throw error;
    } finally {
        await creator.close();
    }
}

if (require.main === module) {
    createBananaCourse().catch(console.error);
}

module.exports = { SummerSchoolsCourseCreator, createBananaCourse };