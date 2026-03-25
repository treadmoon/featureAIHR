const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.goto('http://localhost:3030');
    
    await page.waitForSelector('textarea');
    await page.type('textarea', '我要申请打车报销，大概85块钱');
    
    await page.keyboard.press('Enter');
    
    console.log('Submitted prompt, waiting for generation...');
    await new Promise(r => setTimeout(r, 15000));
    
    await page.screenshot({ path: '/Users/meil/AICodeSpace/futureAIHR/test-ui-screenshot.png', fullPage: true });
    
    const errors = await page.evaluate(() => {
       const err = document.querySelector('nextjs-portal');
       return err ? err.outerHTML : 'No Next.js error overlay found';
    });
    console.log('Next.js Error Overlay:\\n', errors.substring(0, 500));

    const html = await page.evaluate(() => {
       return Array.from(document.querySelectorAll('.space-y-4 > div')).slice(-1)[0]?.outerHTML || 'No chat message found';
    });
    console.log('Last Chat Message HTML:\\n', html);

    await browser.close();
  } catch (err) {
    console.error(err);
  }
})();
