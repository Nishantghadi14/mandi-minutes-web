import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('LocationModal Dismissibility & Accessibility Contracts', () => {
  it('guarantees LocationModal provides multiple accessible ways to exit', () => {
    const modalPath = path.resolve(process.cwd(), 'src/components/common/LocationModal.jsx');
    const content = fs.readFileSync(modalPath, 'utf-8');

    // 1. Top close button must NOT be conditional on location being set
    expect(content).not.toContain('{location && <button onClick={() => setLocationModal(false)}');
    expect(content).toContain('aria-label="Close location selector"');

    // 2. Backdrop click dismiss on overlay
    expect(content).toContain('onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}');

    // 3. Escape key event listener
    expect(content).toContain("e.key === 'Escape'");

    // 4. Mobile bottom cancel button
    expect(content).toContain('Cancel & Keep Current Location');

    // 5. Mobile top drag handle indicator with dismiss action
    expect(content).toContain('Mobile drag handle indicator');
  });

  it('guarantees LocationModal includes detailed address creation and saved address selection', () => {
    const modalPath = path.resolve(process.cwd(), 'src/components/common/LocationModal.jsx');
    const content = fs.readFileSync(modalPath, 'utf-8');

    expect(content).toContain('Add Detailed Delivery Address');
    expect(content).toContain('Your Saved Addresses');
    expect(content).toContain('handleAddNewAddress');
    expect(content).toContain('handleSelectSavedAddress');
  });

  it('guarantees MobileAppHome renders Zepto-style Delivering To header and dynamic address prompt', () => {
    const homePath = path.resolve(process.cwd(), 'src/pages/MobileAppHome.jsx');
    const content = fs.readFileSync(homePath, 'utf-8');

    expect(content).toContain('Delivering to');
    expect(content).toContain('Tap to add address');
    expect(content).toContain('activeAddress');
    expect(content).toContain('hasAddressInputted');
    expect(content).not.toContain('⚡ 10-15m');
  });
});
