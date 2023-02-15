<h1 align="center">
ZeroChat 
</h1>

<p align="center">

[![Build status](https://ci.appveyor.com/api/projects/status/v86gyvgx0dnuhc75?svg=true&v=1)](https://ci.appveyor.com/project/rslay/zerochat)
[![Maintainability](https://api.codeclimate.com/v1/badges/84bdf069784f80804e43/maintainability)](https://codeclimate.com/github/rslay/ZeroChat/maintainability) 
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

<a href="https://chat.justhack.in"><img src="https://raw.githubusercontent.com/rslay/ZeroChat/master/image2.png" title="Preview of chat login page"/></a>

**It's easy to self-host, and simple to use.** Developed with a security-first mentality.

Run ZeroChat in just a [few commands with Docker](#self-hosting-with-docker)!

#### Username and Password? But no accounts required!
- You can login using a handle of your choosing, and enter a "passcode" which is hashed into a unique "tripcode" for your passcode only
- A passcode is like a password, but no accounts are needed to enter a room, everyone just proves who they are by their tripcode

#### Rooms
- Choose from a preselected list of "public" rooms that are advertised on the front page by clicking the Room textbox twice. 
- Or, enter any name you want for your room, and you'll "tune" into it like a radio frequency.

You can share a link with `/roomName` at the end of the URL to have your friends join that room.

Wondering [how it's a live chat without javascript](https://justhack.in/stateful-http)?

## Setup & Dependencies

This project requires NodeJS to run, unless you download one of the precompiled binary [releases](https://github.com/rslay/ZeroChat/releases) (Supported only on windows).

**There are three different ways to run ZeroChat, read below.**

### Setup ZeroChat on Windows

Download from the [releases](https://github.com/rslay/ZeroChat/releases) for executable binaries if you just want to run the chat server.

If you want to tweak the program and run the source code on Windows with/without docker, continue below.

### Self hosting setup with Docker

Run `docker compose --env-file .env.example up`.

`docker ps` should show you that the service is running!

Stop the service by running `docker compose down`.

#### Customizing

Copy `.env.example` to `.env` and use that if you'd like to change things.

Keep in mind that if you change the `PORT`, you should change the `EXPOSE` value in the `Dockerfile` and forwarded port in the `docker-compose.yml`.

### Self Hosting setup without Docker

All you need is `node`, which comes with `npm`.

Run the following to install the wonderful [nvm](https://github.com/nvm-sh/nvm/blob/master/README.md#installing-and-updating) (for windows, [windows-nvm](https://github.com/coreybutler/nvm-windows)) NodeJS version manager.

Then install NodeJS v16.2.0:

```bash
nvm install 16.2.0
nvm use 16.2.0
```

Finally, follow the steps below to set up and run ZeroChat.

#### 💻 Installation and usage

Summary of the steps to be done:

```sh
git clone https://github.com/rslay/ZeroChat zerochat
cd zerochat
npm install
# Make an .env file and change the config, if needed
cp .env.example .env
npm run start
```

Explanation:

- Download the repo to your machine: **`git clone https://github.com/rslay/ZeroChat zerochat`**
  - Enter the new directory with **`cd zerochat`**
- Install the dependencies for the project using **`npm install` or `yarn install`**
- Configure the environmental variables by renaming the `.env.example` file to `.env`, e.g. for defaults: **`cp .env.example .env`**
  - If you're using a Platform as a Service (PaaS), such as **AWS LightSail or Heroku**, configure it using the service's environment variables settings based of values in the `.env.example` file, and refrain from using the `.env` file
- Run the server using **`npm run start`**

## ⚠ Common Issues

### Nginx Issues

Proxying the requests through **Nginx** can be a bit problematic, since you have to turn `proxy_buffering off;` in your `location {...}` block.

Example:
```conf
server {
        server_name chat.example.com;
        location / {
                proxy_buffering off; # Fixes the issue!
                proxy_pass http://127.0.0.1:8000; # ZeroChat server running locally on port 8000
        }
        listen 80; # Nginx listening on port 80
}
```


## 🔮 Upcoming features

Check the following places:
- [Issue Tracker](https://github.com/rslay/ZeroChat/issues)
- [Pull requests](https://github.com/rslay/ZeroChat/pulls)
- [Discussions](https://github.com/rslay/ZeroChat/discussions)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. After cloning and setting up project locally, you can submit a PR to this repo and it will be deployed once it's accepted.

It’s good to have descriptive commit messages, or PR titles so that other contributors can better understand your commit or the PR Created. Read [conventional commits](https://www.conventionalcommits.org/en/v1.0.0-beta.3/) before making the commit message.

## 📔 How it works

Here is the [article that explains how the chat is live without javascript](https://justhack.in/stateful-http)!

## Show your support

We love people\'s support in growing and improving. Be sure to leave a ⭐️ if you like the project and 
also be sure to contribute, if you're interested!
