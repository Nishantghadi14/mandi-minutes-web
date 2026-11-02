import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('User Avatar Visual Contract', () => {
  it('guarantees user avatar buttons across customer touchpoints do not display name initials', () => {
    const files = [
      'src/pages/MobileAppHome.jsx',
      'src/components/common/BottomNav.jsx',
      'src/components/common/Navbar.jsx',
      'src/pages/ProfilePage.jsx',
    ];

    files.forEach((file) => {
      const content = fs.readFileSync(path.resolve(process.cwd(), file), 'utf-8');
      // No component should render user initial letters
      expect(content).not.toContain('(user.name || user.displayName || user.email || \'U\')[0].toUpperCase()');
      // All components should support photoURL or User icon
      expect(content).toContain('photoURL');
      expect(content).toContain('User');
    });
  });

  it('guarantees Navbar and BottomNav use default Profile label instead of user personal name', () => {
    const bottomNavContent = fs.readFileSync(path.resolve(process.cwd(), 'src/components/common/BottomNav.jsx'), 'utf-8');
    const navbarContent = fs.readFileSync(path.resolve(process.cwd(), 'src/components/common/Navbar.jsx'), 'utf-8');

    expect(bottomNavContent).not.toContain('(user.name || user.displayName || \'Profile\').split(\' \')[0]');
    expect(bottomNavContent).toContain("{t('nav.profile')}");

    expect(navbarContent).not.toContain('(user.name || user.displayName || user.email || \'User\').split(\' \')[0]');
    expect(navbarContent).toContain("{t('nav.profile')}");
  });
});
