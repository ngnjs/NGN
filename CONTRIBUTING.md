# Filing an Issue

**Code of Conduct:** Be courteous. Focus on the code.

**_Please search for your issue_ before submitting a new one.** It's amazing how many people skip this step. If you actually have a question, consider searching [stackoverflow.com](https://stackoverflow.com) as well.

The goal is to close every issue and answer every question, but backlog happens. 

Here's how issues are prioritized:

1. **Customers First** - If you're a client, sponsoring a maintainer, or have a support contract, your issue receives top priority.*
1. **Regression Tested** - If you create a pull request with a regression test illustrating the problem, it will receive higher priority. This takes the guess work out of an issue, allowing efforts to be focused on a fix.
1. **Clearly Defined Issues** - Clearly defined issues with instructions for recreating the problem help reach the "fix" faster.
1. Everything else.

*If you have access to a support Slack channel, feel free to ask general questions there. If you have encountered a problem, please create an issue here. Issues filed by sponsors are automatically submitted through Slack.

---

# Contributing to NGN

Please be aware of and adhere to the coding practices. Pull requests that do not conform are unlikely to be accepted.

**NGN is designed to run on multiple JavaScript runtimes**, such as browsers and Node.js, **using a consistent API**. Runtime-specific API features will not be accepted, but runtime-specific implementation features may be.

**_Example: Unacceptable_**
The following feature is only relevent to browsers:

```javascript
NGN.getHtmlElement = () => {
  ...
}
```

**_Example: Aacceptable_**
The following feature is relevant to all runtimes, but the implementation differs by runtime:

```javascript
Object.defineProperty(NGN, 'platform', NGN.get(() => {
  let os

  /* node-only */
  os = process.platform
  /* end-node-only */
  /* browser-only */
  os = navigator.platform
  /* end-node-only */
}))
```

In the example above, creating a getter attribute to identify the current platform is relevant to all runtimes, but each runtime retrieves the data in a different manner. Since all runtimes are supported, this would be an acceptable contribution.

Even if a contribution meets the basic acceptance criteria, it does not mean it will be merged into the project. Introducing new features is a big maintenance consideration. If you want to add a new feature, propose it first and offer to work on it. The NGN team will do it's best to work through the proposal with you and provide guidance if/when necessary. Be mindful that the team has limited capacity, but will do as much as possible to assist.

## Source Code Considerations

As a _general practice_, all code should conform to **ECMAScript Final** features. This means Stage 3 and below will _not be accepted_. Most build/release tooling only supports final/stage 4 features. 

### Exceptions to the Rule

**A petition may be made to use Stage 3 features when such use presents a significant, measurable, and predictable impact on the code base.** The NGN maintainer(s) reserve all rights to refuse such petitions. In layman's terms, we'll cherry pick specification features that make NGN better. Our goal is not to restrict features, it's to assure the maintainability and integrity of the project.

> **Example Exception:**
> The proposed Stage 3 public/private attributes can be used in NGN. NGN heavily utilizes private attributes/methods, which require significant boilerplate code to implement without the new proposal. Use of these new attributes are projected to reduce the code base size by 40%. This proposal was already implemented in V8 at the time (Chrome, Opera, Edge, Node.js) with no negative remarks from Mozilla (Firefox) or Apple (Safari).

Be mindful that the use of Stage 3 code may require modifications to the build process. This can be a very non-trivial effort for the NGN maintainers.

## Unit Testing, Code Coverage, & Syntax

NGN uses the following:

- [standard](https://standardjs.com) for syntax compliance. [snazzy](https://github.com/standard/snazzy) is used for producing human-readable results.
- [tape](https://github.com/substack/tape)/[tap](https://en.wikipedia.org/wiki/Test_Anything_Protocol) for testing. [tap-diff](https://github.com/axross/tap-diff) is used for producing human-readable results.
- [nyc](https://github.com/istanbuljs/nyc) is used to produce code coverage reports.

[Travis CI](https://travis-ci.org/ngnjs/NGN) is used for testing. ![NGN Build Status](https://travis-ci.org/ngnjs/NGN.svg?branch=master)

## Understanding Releases

All releases are built and released automatically.

At present moment, **only ECMAScript Final source code will be accepted**. _No Stage 3 code will be shipped in a stable release_. If the code base uses any stage 3 features, they must be transpiled.

This project adhere's to [semantic versioning](https://semver.org/).

All releases must be approved by a project administrator.

### Official Releases

Official releases are available for browsers and Node.js. They're built with Rollup and a post-processing packaging script.

##### Browser Releases

There are two official browser distributions: ES6 and "current". 

The _ES6 distribution_ is the legacy edition, designed to support ES6-compatible browsers. This means ES5 browsers, such as Internet Explorer 11, are _not supported_.

The _"current" distribution_ supports the last two years of major browser releases, on a rolling basis. The current edition is available in the default ES Module form and a global namespace (iife) variation for those who do not use modules.

Both editions are distributed as minified JavaScript. Since this can be difficult to troubleshoot, each edition has a companion package containing relevant sourcemaps.

All releases are shipped to the npm registry under the `@author.io` organization. There are 4 total browser packages:

1. @author.io/browser-ngn (current)
   - ngn-x.x.x.min.js (ES Module version)
   - ngn-x.x.x-global.min.js (Global/IIFE)
2. @author.io/browser-ngn-debug
   - ngn-x.x.x.min.js.map
   - ngn-x.x.x-global.min.js.map
3. @author.io/browser-ngn-es6 (legacy ES6)
   - ngn-x.x.x-es6.min.js (Global/IIFE)
4. @author.io/browser-ngn-es6-debug
   - ngn-x.x.x-es6.min.js.map

These releases are also available through popular CDN's who support npm.

##### Node Releases

NGN is available for Node.js in "current" and "legacy" editions. The current edition supports standard ES Modules (i.e. `import`) while the legacy version supports CommonJS (i.e. `require`). ES Modules are available in Node 13.0.0 (Oct 2019) using the `--experimental-modules` flag and natively in Node 14.0.0 (April 2020). We recommend using ES Modules when possible, which is the ECMAScript standard.

Similar to browser releases, all releases are distributed as minified JavaScript, under the `@author.io` npm organization. A companion package containing sourcemaps is available for each edition for a better debugging experience.

1. @author.io/node-ngn (ES Modules)
   - index.js
2. @author.io/node-ngn-debug
   - ngn-x.x.x.min.js.map
3. @author.io/node-ngn-legacy (CommonJS)
   - index.js
4. @author.io/node-ngn-legacy-debug
   - ngn-x.x.x.min.js.map