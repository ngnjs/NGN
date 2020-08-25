# NGN

NGN is a JavaScript library for building systems and frameworks. Version 1.x.x was first released in 2012. Since then, the JavaScript language, runtimes, and communities have seen a continental shift. NGN 2.0.0 has been re-engineered to take advantage of modern JavaScript capabilities.

The library consists of numerous integrated ES modules, designed to work in any modern JavaScript runtime. Over 1000 combined unit tests are run against Chromium, Node.js 14+ (12+ using ES Module flag), and Deno.

1. **Core** (This repo)
  - Event Emitter
  - Middleware Engine
  - Custom Exceptions (Errors)
  - Ledger System (Auditing/Logging)
  - Base Class
1. **[Queue](https://github.com/ngnjs/queue)**
  - Parallel Task Runner
  - Sequential Task Runner
  - Evented Task Runner
1. **[Network](https://github.com/ngnjs/net)** (net)
  - HTTP Client (Promise & Callback-Based)
  - Network Resource Feature
  - Enhanced URL
1. **[Plugin Engine](https://github.com/ngnjs/plugin)**
  - Create Plugins
  - Extend Core Modules & Plugins
  - Semver Support (Dependency Declarations)

In addition, the following libraries are available:

  - _[libdata](https://github.com/ngnjs/libdata)_: Common data manipulation methods.
  - _[libnet-node](https://github.com/ngnjs/libnet-node)_: Polyfill network features Node doesn't have (Request Caching, ReferralPolicy, Subresource Integrity)

We are still working on the **data module**, which is the most powerful, but also most complex library in NGN. The data module supports data modeling, data stores, events, indexing, has it's own query language, and is often described as a small cross-runtime database.

NGNX, the extension system, has been dropped in 2.0.0. The libraries, such as the date/time library, are being integrated directly into NGN.

## Development Status

NGN 2.0.0 is currently in an alpha state. We are battle testing it with select [Butler Logic](https://butlerlogic.com) clients, but we're really putting it through rigorous production testing as we build https://metadoc.io on NGN 2.

NGN 2.0.0 documentation will be forthcoming, with an early release of Metadoc.