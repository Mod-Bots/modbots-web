# Mod Bots Web

![Version: 0.0.1-alpha](https://img.shields.io/badge/version-0.0.1--alpha-14b8a6)
![Branch: release/v0.0.1-alpha](https://img.shields.io/badge/branch-release%2Fv0.0.1--alpha-64748b)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)
![Node.js 24](https://img.shields.io/badge/node-24-339933?logo=node.js&logoColor=white)
![React 19](https://img.shields.io/badge/react-19-61DAFB?logo=react&logoColor=111827)
![Next.js](https://img.shields.io/badge/app-Next.js-000000?logo=nextdotjs&logoColor=white)

Mod Bots Web is the web client for the Mod Bots platform.

## Prerequisites

- Node.js 24 or newer

## Run

Install dependencies:

```powershell
npm install
```

Start the [Mod Bots backend](https://github.com/Mod-Bots/modbots-backend):

```powershell
Set-Location modbots-backend
Copy-Item .env.example .env
docker desktop enable model-runner
docker compose up --build
```

Start the web app:

```powershell
Set-Location modbots-web
Copy-Item .env.example .env
npm install
npm run dev
```

## License

Mod Bots Web is licensed under the [MIT License](LICENSE.md).

## Copyright

Copyright &copy; 2026 William Sawyerr.
