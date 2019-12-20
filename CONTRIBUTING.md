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

## Source Code

As a _general practice_, all code should conform to **ECMAScript Final** features. This means Stage 3 and below will _not be accepted_. Most build/release tooling only supports these features. 

### Exceptions to the Rule

**A petition may be made to use Stage 3 features when such use presents a significant, measurable, and predictable impact on the code base.** The NGN maintainer(s) reserve all rights to refuse such petitions. In leyman terms, we'll cherry pick specification features that make NGN better. Our goal is not to restrict features, it's to assure the maintainability and integrity of the project.

> **Example Exception:**
> The proposed Stage 3 public/private attributes can be used in NGN. NGN heavily utilizes private attributes/methods, which require significant boilerplate code to implement without the new proposal. Use of these new attributes are projected to reduce the code base size by 40%. This proposal was already implemented in V8 at the time (Chrome, Opera, Edge, Node.js) with no negative remarks from Mozilla (Firefox) or Apple (Safari).

Be mindful that the use of Stage 3 code may require modifications to the build process. This can be a very non-trivial effort for the NGN maintainers.

## Unit Testing, Code Coverage, & Syntax

NGN uses the following:

- [standard](https://standardjs.com) for syntax compliance. [snazzy](https://github.com/standard/snazzy) is used for producing human-readable results.
- [tape](https://github.com/substack/tape)/[tap](https://en.wikipedia.org/wiki/Test_Anything_Protocol) for testing. [tap-diff](https://github.com/axross/tap-diff) is used for producing human-readable results.
- [nyc](https://github.com/istanbuljs/nyc) is used to produce code coverage reports.

[Travis CI](https://travis-ci.org/ngnjs/NGN) is used for testing. ![NGN Build Status](https://travis-ci.org/ngnjs/NGN.svg?branch=master)

## Distribution Code (Releases)

NGN must support modern JavaScript runtimes. This includes modern browsers and Node.js.

At present moment, **only ECMAScript Final code will be released**. _No Stage 3 code will be shipped in a stable release_. If the code base uses any stage 3 features, they must be transpiled.

This project adhere's to [semantic versioning](https://semver.org/).

All releases must be approved by a project administrator.