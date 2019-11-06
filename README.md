# ZeroChat [![Build status](https://ci.appveyor.com/api/projects/status/v86gyvgx0dnuhc75?svg=true)](https://ci.appveyor.com/project/rslay/zerochat) [![Maintainability](https://api.codeclimate.com/v1/badges/84bdf069784f80804e43/maintainability)](https://codeclimate.com/github/rslay/ZeroChat/maintainability) [![Dependencies](https://api.dependabot.com/badges/status?host=github&repo=rslay/ZeroChat)](https://dependabot.com/) [![Known Vulnerabilities](https://snyk.io/test/github/rslay/ZeroChat/badge.svg?targetFile=package.json)](https://snyk.io/test/github/rslay/ZeroChat?targetFile=package.json) [![Releases](https://badgen.net/github/release/rslay/ZeroChat)](https://github.com/rslay/ZeroChat/releases)

A live web chat. No client-side javascript, cookies, accounts, or `<meta http-equiv="refresh">` tags.

Instead, your browser never finishes loading the whole page, and downloads messages as they are posted by others.
Authentification is done with a password/tripcode system using PBKDF2 hashes.

Easy to run, simple to use. Developed with a security-first mentality.

## Running & Dependencies

This project requires NodeJS, unless you download one of the [releases](https://github.com/rslay/ZeroChat/releases).

### Running ZeroChat on Windows

Take a look at the [releases](https://github.com/rslay/ZeroChat/releases) for executable binaries if you just want to run the chat server.

If you want to run the source NodeJS file and tweak it, you can go to [NodeJS.org](https://nodejs.org) to install NodeJS, and then follow along with [Installation & Usage](https://github.com/rslay/ZeroChat#installation--usage).

### Running ZeroChat on Mac/Linux

## Prerequisites: Setting up `node` and `npm

Run the following to install the wonderful **[n](https://github.com/tj/n)** NodeJS version manager, and then install NodeJS v12.0.0:

```bash
curl -L https://git.io/n-install | bash
n 12.0.0
node --version
npm --version
```

**If you see something along the lines of `command not found: node`**, it means you have NodeJS installed as a command line tool `nodejs`, rather than as `node`.

## Installation & Usage

Run the following commands to download ZeroChat (Windows computers will need [git](https://git-scm.com/download/win) installed), go into the folder it's in locally, and install all NodeJS libraries it needs to run:

```bash
git clone https://github.com/rslay/ZeroChat zerochat
cd zerochat
npm install
```

Run the program with `node zerochat.js`. If that doesn't work try `nodejs zerochat.js`.

## Upcoming features

Check the [Issue Tracker](https://github.com/rslay/ZeroChat/issues).

## How it works

[Read this](https://justhack.in/stateful-http).
