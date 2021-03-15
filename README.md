<h1 align="center">
ZeroChat 
</h1>

<p align="center">

[![Build status](https://ci.appveyor.com/api/projects/status/v86gyvgx0dnuhc75?svg=true&v=1)](https://ci.appveyor.com/project/rslay/zerochat)
[![Maintainability](https://api.codeclimate.com/v1/badges/84bdf069784f80804e43/maintainability)](https://codeclimate.com/github/rslay/ZeroChat/maintainability) 
[![Dependencies](https://api.dependabot.com/badges/status?host=github&repo=rslay/ZeroChat)](https://dependabot.com/) 
[![Known Vulnerabilities](https://snyk.io/test/github/rslay/ZeroChat/badge.svg?targetFile=package.json)](https://snyk.io/test/github/rslay/ZeroChat?targetFile=package.json) 
[![Releases](https://badgen.net/github/release/rslay/ZeroChat?v=1)](https://github.com/rslay/ZeroChat/releases)

</p>

A live web chat. No client-side javascript, cookies, accounts, or `<meta http-equiv="refresh">` tags.

Instead, your browser never finishes loading the whole page, and downloads messages as they are posted by others.

Authentification is done with a password/tripcode system using PBKDF2 hashes.

## Try it by visiting [chat.justhack.in](https://chat.justhack.in)

<a href="https://chat.justhack.in"><img src="https://raw.githubusercontent.com/rslay/ZeroChat/master/image.png" title="Preview of chat login page" style="width: 200px;height: 150px"/></a>

**It's easy to self-host, and simple to use.** Developed with a security-first mentality.

## Running & Dependencies

This project requires NodeJS, unless you download one of the [releases](https://github.com/rslay/ZeroChat/releases).

### Running ZeroChat on Windows

Take a look at the [releases](https://github.com/rslay/ZeroChat/releases) for executable binaries if you just want to run the chat server.

If you want to run the source NodeJS file and tweak it, you can go to [NodeJS.org](https://nodejs.org) to install NodeJS, and then follow along with the steps to self host below!

### Docker

Docker is an easy way of containerizing and delivering your applications quickly and easily, in an 
convenient way. It's really simple to get started with this, with docker handling all the installation
and other tasks.Configure the environmental variables by renaming the `.env.example` file to `.env` with the respective 
values. Then, run `docker-compose --env-file .env up` after getting the project and config ready.

**Docker mini guide:**

- Running the bot: `docker-compose --env-file .env up`
- Stopping the bot: `docker-compose down`
- Rebuilding the bot: `docker-compose build`

### Self hosting without docker

This is a clean and neat way of hosting without using docker. You can follow this if docker doesn't work
well on your system, or it doesn't support it. Containers are resource intensive, and your PC might not
be able to do it, this is the perfect method to get started with the self-hosting.

**Pre-requisites**
- Node
- NPM

Run the following to install the wonderful **[n](https://github.com/tj/n)** NodeJS version manager, and then install NodeJS v12.0.0:

```bash
curl -L https://git.io/n-install | bash
n 12.0.0
npm --version
```

#### Main installation section

- Clone or fork the repository, whichever suits you better.
- Install the dependencies for the project using **`npm install`**
- Configure the environmental variables by renaming the `.env.example` file to `.env` with the respective 
  values for it. If you\'re using heroku or other platforms that have option for external environmental
  variables, use that instead of `.env`
- Configure the options and settings available in `bin/www`, according to your preferences.
- Run the server using `npm run start`

## Upcoming features

Check the [Issue Tracker](https://github.com/rslay/ZeroChat/issues).

## How it works

Here\'s the complete article that explains how it works! [Read this](https://justhack.in/stateful-http).

## Show your support

We love people\'s support in growing and improving. Be sure to leave a ⭐️ if you like the project and 
also be sure to contribute, if you're interested!
