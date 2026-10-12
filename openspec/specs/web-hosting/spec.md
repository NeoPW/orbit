# web-hosting Specification

## Purpose

Defines how the web app is published: a static site at a public address that works from any computer, deployed by hand with the sync configuration, with user data kept in the browser and behind the account login.

## Requirements

### Requirement: Public web address
The web app SHALL be reachable over HTTPS at `https://orbit-neo.pages.dev` from any computer. Reloading the page SHALL stay on the current destination.

#### Scenario: Open from another computer
- **WHEN** the user opens `https://orbit-neo.pages.dev` in Chrome on any computer
- **THEN** the app starts and Settings offers signing in

#### Scenario: Reload on a destination
- **WHEN** the user is on Plan on the hosted site and reloads the page
- **THEN** the app opens on Plan again

### Requirement: No user data on the site
The hosted site SHALL contain only the app itself. A visitor's data SHALL come only from their own browser storage or from signing in to their account. The site SHALL NOT offer creating an account.

#### Scenario: New visitor
- **WHEN** someone opens the hosted site in a browser that has never used it and does not sign in
- **THEN** the app is empty and there is no option to create an account

#### Scenario: Sign in on the hosted site
- **WHEN** the user signs in on the hosted site with their account
- **THEN** the account's data syncs into the browser, and changes sync with the phone

### Requirement: Persistent browser storage on the hosted site
On the hosted site in Chrome, the database SHALL use persistent browser storage, and local data and the sign-in SHALL survive closing the tab and opening the site again.

#### Scenario: Close and reopen
- **WHEN** the user closes the tab and opens the hosted site again later
- **THEN** their data is still shown, they are still signed in, and no storage warning appears

### Requirement: Deploy with sync configured
The web deploy script SHALL build the web app with the sync configuration (§7) and publish it to the public address. It SHALL refuse to deploy when that configuration is missing. After deploying, it SHALL print the version it deployed and the address.

#### Scenario: Configuration missing
- **WHEN** the deploy script runs without `supabase.json`
- **THEN** it stops with a message before building, and the live site is unchanged

#### Scenario: Successful deploy
- **WHEN** the deploy script runs with `supabase.json` and a logged-in Cloudflare CLI
- **THEN** it prints the version from `pubspec.yaml` and `https://orbit-neo.pages.dev`, and the site serves the new build

### Requirement: Updates reach open browsers
After a deploy, reloading the hosted site SHALL load the new version. The update SHALL keep the browser's local data and sign-in.

#### Scenario: Reload after deploy
- **WHEN** a new version is deployed while the site is open in a browser, and the user reloads the page
- **THEN** the new version runs, and the local data and sign-in are unchanged

### Requirement: Site name and install metadata
The page title and the installed web app's name SHALL be "Orbit", and the page description SHALL describe the app. The installed web app SHALL NOT be locked to portrait orientation.

#### Scenario: Browser tab
- **WHEN** the hosted site is open in a browser tab
- **THEN** the tab shows the Orbit icon and the title "Orbit"

#### Scenario: Install on the PC
- **WHEN** the user installs the hosted site as an app from Chrome on the PC
- **THEN** it is named "Orbit", uses the Orbit icon, and opens in a resizable landscape window
