# chgov-brprotokolle-ocr

- [chgov-brprotokolle](https://github.com/SwissFederalArchives/chgov-brprotokolle)
  - [chgov-brprotokolle-server](https://github.com/SwissFederalArchives/chgov-brprotokolle-server)
  - [chgov-brprotokolle-markdown](https://github.com/SwissFederalArchives/chgov-brprotokolle-markdown)
  - [chgov-brprotokolle-frontend](https://github.com/SwissFederalArchives/chgov-brprotokolle-frontend)
  - **[chgov-brprotokolle-mirador-ocr-helper](https://github.com/SwissFederalArchives/chgov-brprotokolle-mirador-ocr-helper)** :triangular_flag_on_post:

# Context

A plugin for the [mirador IIIF viewer](https://projectmirador.org/) project.

# Architecture and components

This plugin shows a companion window with the transcription of the OCR text of the current page of the document.
By interacting with the companion window, the user is able to identify the corresponding textline in the document and vice versa.

# First steps

## Preparations

- Install [Node.js](https://nodejs.org/en/)
- Install [Node Version Manager](https://github.com/nvm-sh/nvm)

## Install

To work on the project, you need to select the right node version (e.g. via NVM) and then install all dependencies via `npm`.

```
nvm use
npm install
```

# Customization

## General

The watch process can be started as follows.

```
nvm use
npm run start
```

To create a new build and test it on your local machine, you have to:

1) Create a new build

```
nvm use
npm run build
```
2) Serve the build by using `serve`

```
nvm use
# Install serve if not already installed previously (optional)
npm i -g serve
# Serve the created build in demo/dist/ directory
serve demo/dist
```

## Configuration

| Property | Description | Type | Default |
|---|---|---|---|
| `enabled` | Enable plugin  | boolean | `true` |
| `visible` | Initially show the companion window | boolean | `true` |
| `optionsRenderMode` | Render mode of the plugin options | `complex` / `simple` | `complex` |
| `skipEmptyLines` | Ignore empty ocr-lines | number | `true` |
| `opacity` | Default opacity of text overlay | number | `0.3` |
| `useAutoColors` | Try to automatically determine the text and background color | boolean | `false` |
| `color` | Color of rendered boxes (used as a fallback if auto-detection is enabled and fails) | string | `#00FF7B` |
| `correction.enabled` | If enabled, the user can submit corrections to the text via email | boolean | `false` |
| `correction.emailRecipient` | Email address used as `to` parameter for `mailto` link | `string `/ `null` | `null` |
| `correction.emailUrlKeepParams` | Defines which existing url parameters need to be kept when generating the the entry url | array | [] |

# Authors

- [4eyes GmbH](https://www.4eyes.ch)

# License

GNU Affero General Public License (AGPLv3), see [LICENSE](LICENSE)

# Contribute

This repository is a copy which is updated regularly - therefore contributions via pull requests are not possible. However, independent copies (forks) are possible under consideration of the AGPLV3 license.

# Contact

- For general questions (and technical support), please contact the Swiss Federal Archives by e-mail at bundesarchiv@bar.admin.ch.
- Technical questions or problems concerning the source code can be posted here on GitHub via the "Issues" interface.
