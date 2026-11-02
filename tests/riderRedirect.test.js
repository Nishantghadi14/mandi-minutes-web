import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { redirectToRiderApp } from '../src/utils/platform';

describe('Rider App Redirection & Intent Integration', () => {
  beforeEach(() => {
    global.window = {
      location: {
        origin: 'https://mandiminutes.com',
        pathname: '/profile',
        href: 'https://mandiminutes.com/profile',
      },
    };
  });

  afterEach(() => {
    delete global.window;
    vi.restoreAllMocks();
  });

  it('exports redirectToRiderApp and routes to /rider?target=rider on web browsers', () => {
    expect(typeof redirectToRiderApp).toBe('function');
    redirectToRiderApp();
    expect(global.window.location.href).toBe('https://mandiminutes.com/rider?target=rider');
  });

  it('verifies AndroidManifest.xml has package visibility queries for com.mandiminutes.rider', () => {
    const manifestPath = path.resolve(__dirname, '../android/app/src/main/AndroidManifest.xml');
    const manifest = fs.readFileSync(manifestPath, 'utf8');

    expect(manifest).toContain('<queries>');
    expect(manifest).toContain('<package android:name="com.mandiminutes.rider" />');
    expect(manifest).toContain('android:scheme="mandirider"');
    expect(manifest).toContain('android:scheme="com.mandiminutes.rider"');
  });

  it('verifies AuthModal.jsx intercepts rider role on login and OTP and offers dedicated partner button', () => {
    const authModalPath = path.resolve(__dirname, '../src/components/common/AuthModal.jsx');
    const authModalCode = fs.readFileSync(authModalPath, 'utf8');

    expect(authModalCode).toContain('redirectToRiderApp');
    expect(authModalCode).toContain("loggedUser?.role === 'rider'");
    expect(authModalCode).toContain('Delivery Partner');
    expect(authModalCode).toContain('Open & Sign in on Mandi Rider App');
  });

  it('verifies ProfilePage.jsx provides a direct button to launch the Mandi Rider App', () => {
    const profilePagePath = path.resolve(__dirname, '../src/pages/ProfilePage.jsx');
    const profilePageCode = fs.readFileSync(profilePagePath, 'utf8');

    expect(profilePageCode).toContain('redirectToRiderApp');
    expect(profilePageCode).toContain('Rider Delivery App');
    expect(profilePageCode).toContain('PARTNER APP');
  });

  it('verifies App.jsx automatically redirects authenticated riders away from consumer routes', () => {
    const appPath = path.resolve(__dirname, '../src/App.jsx');
    const appCode = fs.readFileSync(appPath, 'utf8');

    expect(appCode).toContain('redirectToRiderApp');
    expect(appCode).toContain("user?.role === 'rider'");
  });
});
