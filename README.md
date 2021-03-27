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

<h3 align="center">
  <a href="https://github.com/rslay/ZeroChat/issues/new">Report a bug</a>
  <span> · </span> 
  <a href="https://github.com/rslay/ZeroChat/pulls/new">Create a PR for contributions</a>
  <span> · </span> 
  <a href="https://github.com/rslay/ZeroChat/discussions">Discussions</a>
</h3>

A live web chat. No client-side javascript, cookies, accounts, or `<meta http-equiv="refresh">` tags.

Instead, your browser never finishes loading the whole page, and downloads messages as they are posted by others.

Authentification is done with a password/tripcode system using PBKDF2 hashes.

## Try it by visiting [chat.justhack.in](https://chat.justhack.in)

<a href="https://chat.justhack.in"><img src="https://raw.githubusercontent.com/rslay/ZeroChat/master/image.png" title="Preview of chat login page" style="width: 200px;height: 150px"/></a>

**It's easy to self-host, and simple to use.** Developed with a security-first mentality.

Run ZeroChat in just a [few commands with Docker](README.md#Self hosting with Docker)!

## Running & Dependencies

This project requires NodeJS, unless you download one of the [releases](https://github.com/rslay/ZeroChat/releases) (Supported only on windows).

### Running ZeroChat on Windows

Take a look at the [releases](https://github.com/rslay/ZeroChat/releases) for executable binaries if you just want to run the chat server.

If you want to run the source NodeJS file and tweak it, you can go to [NodeJS.org](https://nodejs.org) to install NodeJS, and then follow along with the steps to self host below!

### Self hosting with docker [Any platform / OS]

Docker is an easy way of containerizing and delivering your applications quickly and easily, in an 
convenient way. It's really simple to get started with this, with docker handling all the installation
and other tasks.

Configure the environmental variables by renaming the `.env.example` file to `.env` with the respective 
values. Then, run `docker-compose --env-file .env up` after getting the project and config ready.

**Docker mini guide:**

- Running the bot: `docker-compose --env-file .env up`
- Stopping the bot: `docker-compose down`
- Rebuilding the bot: `docker-compose build`

### Self hosting without docker

This is a clean and neat way of hosting without using docker. You can follow this if docker doesn't work
well on your system, or it doesn't support it. Containers are resource intensive, and your PC might not
be able to do it, this is the perfect method to get started with the self-hosting.

#### Prerequisites: Setting up `node` and `npm`

Run the following to install the wonderful **[n](https://github.com/tj/n)** NodeJS version manager, and then install NodeJS v12.0.0:

```bash
curl -L https://git.io/n-install | bash
n 12.0.0
npm --version
```

#### Installation and usage.

- Clone or fork the repository, whichever suits you better.
- Install the dependencies for the project using **`npm install`**
- Configure the environmental variables by renaming the `.env.example` file to `.env` with the respective 
  values for it. If the platform you're using have support for external environmental variables, for example AWS
  or heroku or something else, Configure it there, and refrain from configuring `.env`
- Run the server using **`npm run start`**

Summary of the steps to be done:

```sh
git clone https://github.com/rslay/ZeroChat zerochat
cd zerochat
npm install
// configure the ENV variables if needed.
npm run start
```

## Upcoming features

Check the following places:
- [Issue Tracker](https://github.com/rslay/ZeroChat/issues)
- [Pull requests](https://github.com/rslay/ZeroChat/pulls)
- [Discussions](https://github.com/rslay/ZeroChat/discussions)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. After cloning and setting up project locally, you can submit 
a PR to this repo and it will be deployed once it's accepted.

⚠️ It’s good to have descriptive commit messages, or PR titles so that other contributors can better understand your
commit or the PR Created. Read [conventional commits](https://www.conventionalcommits.org/en/v1.0.0-beta.3/) before 
making the commit message.

## How it works

Here is the [article that explains how it works](https://justhack.in/stateful-http)!

## Show your support

We love people\'s support in growing and improving. Be sure to leave a ⭐️ if you like the project and 
also be sure to contribute, if you're interested!
