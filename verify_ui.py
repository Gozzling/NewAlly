import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 1280, 'height': 720})

        url = "http://localhost:5173/desktop.html"

        try:
            await page.goto(url)
            await page.wait_for_timeout(2000)

            async def snap(name):
                await page.screenshot(path=f"verification/screenshots/final_{name}.png")

            # Home
            await snap("home")

            # Items
            await page.click('[data-testid="nav-items"]')
            await page.wait_for_timeout(1000)
            await snap("items")

            # Units
            await page.click('[data-testid="nav-units"]')
            await page.wait_for_timeout(1000)
            await snap("units")

            # Traits
            await page.click('[data-testid="nav-traits"]')
            await page.wait_for_timeout(1000)
            await snap("traits")

            # Augments
            await page.click('[data-testid="nav-augments"]')
            await page.wait_for_timeout(1000)
            await snap("augments")

            # In Game
            await page.click('[data-testid="nav-in-game"]')
            await page.wait_for_timeout(1000)
            await snap("in_game")

            # Match History
            await page.click('[data-testid="nav-match-history"]')
            await page.wait_for_timeout(1000)
            # Find the search input
            await page.fill('input[placeholder*="Summoner"]', "Doublelift#NA1")
            await page.press('input[placeholder*="Summoner"]', "Enter")
            await page.wait_for_timeout(3000)
            await snap("match_history")

        except Exception as e:
            print(f"Error during verification: {e}")
            await page.screenshot(path="verification/screenshots/error.png")

        await browser.close()

if __name__ == "__main__":
    os.makedirs("verification/screenshots", exist_ok=True)
    asyncio.run(run())
