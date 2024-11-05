await page.goto('https://www.qq.com/')

locator = page.locator('a')
logger.info(await locator.count())