import puppeteer from 'puppeteer-core'

(async () => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto('https://www.google.com')
  // other actions...
  await browser.close()
})()
