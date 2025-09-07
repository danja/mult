import { test, expect } from '@playwright/test';

test.describe('Generic RDF Visualization System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the application without errors', async ({ page }) => {
    // Wait for the canvas container to be present
    await expect(page.locator('#canvas-container')).toBeVisible();
    
    // Wait for the info panel to be present
    await expect(page.locator('#info')).toBeVisible();
    
    // Check that the title is correct
    await expect(page.locator('.title')).toContainText('RDF Visualization');
  });

  test('should show loading screen initially', async ({ page }) => {
    // The loading screen should be visible initially
    const loading = page.locator('#loading');
    await expect(loading).toBeVisible();
    
    // Wait for loading to complete (up to 10 seconds)
    await expect(loading).toBeHidden({ timeout: 10000 });
  });

  test('should display control buttons', async ({ page }) => {
    // Wait for the app to load
    await page.waitForTimeout(2000);
    
    // Check that control buttons are present
    await expect(page.locator('#animBtn')).toBeVisible();
    await expect(page.locator('#labelsBtn')).toBeVisible();
    await expect(page.locator('#topBtn')).toBeVisible();
    await expect(page.locator('#resetBtn')).toBeVisible();
    await expect(page.locator('#perfBtn')).toBeVisible();
  });

  test('should toggle animation when clicking animation button', async ({ page }) => {
    // Wait for the app to load
    await page.waitForTimeout(2000);
    
    const animBtn = page.locator('#animBtn');
    
    // Initial state should be pressed (animation on)
    await expect(animBtn).toHaveAttribute('aria-pressed', 'true');
    
    // Click to toggle
    await animBtn.click();
    
    // Should now be unpressed (animation off)
    await expect(animBtn).toHaveAttribute('aria-pressed', 'false');
    
    // Click again to toggle back
    await animBtn.click();
    await expect(animBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('should cycle label modes when clicking labels button', async ({ page }) => {
    // Wait for the app to load
    await page.waitForTimeout(2000);
    
    const labelsBtn = page.locator('#labelsBtn');
    
    // Should start with "Smart" mode
    await expect(labelsBtn).toContainText('Smart');
    await expect(labelsBtn).toHaveAttribute('aria-pressed', 'true');
    
    // Click to cycle to "All"
    await labelsBtn.click();
    await expect(labelsBtn).toContainText('All');
    
    // Click to cycle to "None"
    await labelsBtn.click();
    await expect(labelsBtn).toContainText('None');
    await expect(labelsBtn).toHaveAttribute('aria-pressed', 'false');
    
    // Click to cycle back to "Smart"
    await labelsBtn.click();
    await expect(labelsBtn).toContainText('Smart');
    await expect(labelsBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('should collapse and expand info panel', async ({ page }) => {
    // Wait for the app to load
    await page.waitForTimeout(2000);
    
    const infoPanel = page.locator('#info');
    const collapseBtn = page.locator('#collapseBtn');
    
    // Initially should not be collapsed
    await expect(infoPanel).not.toHaveClass(/collapsed/);
    await expect(collapseBtn).toContainText('▾');
    
    // Click to collapse
    await collapseBtn.click();
    await expect(infoPanel).toHaveClass(/collapsed/);
    await expect(collapseBtn).toContainText('▸');
    
    // Click to expand
    await collapseBtn.click();
    await expect(infoPanel).not.toHaveClass(/collapsed/);
    await expect(collapseBtn).toContainText('▾');
  });

  test('should display layer legend after data loads', async ({ page }) => {
    // Wait for the app to load and data to be processed
    await page.waitForTimeout(3000);
    
    const layerLegend = page.locator('.layer-legend');
    await expect(layerLegend).toBeVisible();
    
    // Should have multiple layer items
    const layerItems = page.locator('.layer-item');
    await expect(layerItems.first()).toBeVisible();
    
    // Each layer item should have a color indicator and checkbox
    const firstLayerItem = layerItems.first();
    await expect(firstLayerItem.locator('.layer-color')).toBeVisible();
    await expect(firstLayerItem.locator('input[type="checkbox"]')).toBeVisible();
  });

  test('should display data statistics', async ({ page }) => {
    // Wait for the app to load and data to be processed
    await page.waitForTimeout(3000);
    
    const dataStats = page.locator('#data-stats');
    await expect(dataStats).toBeVisible();
    
    // Should contain statistics text
    await expect(dataStats).toContainText('Nodes:');
    await expect(dataStats).toContainText('Layers:');
    await expect(dataStats).toContainText('Relationships:');
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Mock a network error for the TTL file
    await page.route('/universe.ttl', route => route.abort());
    
    // Navigate to the page
    await page.goto('/');
    
    // Should show an error message
    await expect(page.locator('.error')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.error h3')).toContainText('Error');
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for the app to load
    await page.waitForTimeout(2000);
    
    // Info panel should be visible and properly sized
    const infoPanel = page.locator('#info');
    await expect(infoPanel).toBeVisible();
    
    // Should have appropriate width for mobile
    const infoPanelBox = await infoPanel.boundingBox();
    expect(infoPanelBox?.width).toBeLessThan(300); // Should be smaller on mobile
  });

  test('should support touch interactions', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for the app to load
    await page.waitForTimeout(2000);
    
    const canvas = page.locator('#canvas-container canvas');
    await expect(canvas).toBeVisible();
    
    // The canvas should have touch-action: none for proper touch handling
    const touchAction = await canvas.evaluate(el => 
      window.getComputedStyle(el.parentElement!).touchAction
    );
    expect(touchAction).toBe('none');
  });

  test('should have proper ARIA labels for accessibility', async ({ page }) => {
    // Wait for the app to load
    await page.waitForTimeout(2000);
    
    // Check ARIA labels on buttons
    await expect(page.locator('#animBtn')).toHaveAttribute('aria-pressed');
    await expect(page.locator('#labelsBtn')).toHaveAttribute('aria-pressed');
    await expect(page.locator('#perfBtn')).toHaveAttribute('aria-pressed');
    await expect(page.locator('#collapseBtn')).toHaveAttribute('aria-pressed');
  });
});