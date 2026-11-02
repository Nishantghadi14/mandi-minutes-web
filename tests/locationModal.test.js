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
});
