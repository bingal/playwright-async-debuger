await page.goto('https://www.qq.com/')

locator = page.locator('a')
logger.info(await locator.count())

locator = page.locator('input[value="10条/页"]:visible')
logger.info(f'locator:{locator}')


try:
    await page.mouse.wheel(0, random.randint(400, 1000))
    logger.debug(f'翻页滚动 {random.randint(400, 1000)} 像素')
    await asyncio.sleep(2)
except Exception as e:
    logger.error(f'翻页时出错: {str(e)}')

await page.mouse.move(300, 400)
await page.mouse.wheel(1000, 2000)


locator = page.get_by_placeholder('请选择')
logger.info(await locator.count())
await locator.click(force=True)


locator = main_page.locator('div#header-user > div > div', has_text="超管")
logger.info(f'超管 {await locator.count()}')
await locator.first.hover()
await asyncio.sleep(2)
locator = main_page.locator('div#group-select-container > div > div > div span', has_text="协作")
logger.info(f'协作 {await locator.count()}')
await locator.first.click()



# 查看是否有出现提示浮层
main_page = page
locator = main_page.locator('div.ovui-modal div.oc-modal-confirm-title', has_text="组织资质认证提醒")
if await locator.count() > 0 and await locator.first.is_visible():
    logger.info(f'出现提示浮层 {await locator.first.text_content()}')
    current_user_data['message'] += f'出现提示浮层 {await locator.first.text_content()}; '
    locator = main_page.locator('div.ovui-modal div.ovui-button', has_text="暂不认证")
    if await locator.count() > 0 and await locator.first.is_visible():
        logger.info(f'提示浮层内容 {await locator.first.text_content()}')
        current_user_data['message'] += f'提示浮层内容 {await locator.first.text_content()}; '
        await locator.first.click()
    await asyncio.sleep(1)
locator = main_page.locator('div#header-user > div > div', has_text="超管")
if await locator.count() > 0 and await locator.first.is_visible():
    logger.info(f'超管 {await locator.count()} {await locator.first.is_visible()} 切换到协作组织')
    current_user_data['message'] += f'超管 {await locator.count()} {await locator.first.is_visible()} 切换到协作组织; '
    await locator.first.hover()
    await asyncio.sleep(1)
    locator = main_page.locator('div#group-select-container > div > div > div span', has_text="协作")
    xiezuo_count = await locator.count()
    logger.info(f'协作组织数量 {xiezuo_count}')
    if xiezuo_count > 0:
        await locator.first.click()
        await asyncio.sleep(1)