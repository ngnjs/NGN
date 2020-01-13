# Network Polyfills

The [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch) in browsers have more management features than the raw network libraries found in Node-like runtimes. Until these environments have feature-parity, the polyfills in this directory will be used to fill gaps for Node-like environments.

## HTTP Cache

Browsers contain an [HTTP Cache](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching), capable of private (specific browsing session) and shared caches (across browsing sessions, i.e. multiple tabs).

Node-like environments lack these features, but NGN supports both using the NGN Cache polyfill. Nothing special is required to use these features. However; there are some options for tweaking/customizing the cache (see below).

_Private Caching_

Private caching is accomplished using an in-memory cache per process. This is an ephemeral cache, so it will be purged when the process exits. This cache cannot be shared with other running processes.

If you need the private cache to persist between process restarts, the shared caching can be used (see note at end).

_Shared Caching_

Shared caching is accomplished using disk. Responses are written to a directory. Multiple processes can use the same directory, resulting in a shared caching system. This can reduce considerable bandwidth usage in systems which make many similar requests to the same destinations, from multiple processes.

To enable shared caching, a cache directory must exist, be writable by the process, and be defined as an envionrment variable: `HTTP_CACHE_DIR`. Example: `HTTP_CACHE_DIR=/path/to/cache node index.js`

> NOTE: Shared caching is just disk-based caching. To create a private and persistent cache, specify a unique directory path per private process.

**WARNING**
This cache will work and is safe to use in production envionrment, but it just runs as a Node process. If/when Node supports an HTTP Cache, this feature will be replaced. The current caching system is designed for 90% of use cases. If you have specific/advanced caching needs, it may be better to write your own caching system or use several of the database (Redis/SQLite) backed caching systems available for Node.js.

## Referrer Policy

The [W3C Referrer Policy specification](https://w3c.github.io/webappsec-referrer-policy/#referrer-policies) provides a standard set of policies for controlling the type of meta information sent to destinations (using the `Referer` HTTP request header). Node-like network libraries do not support this policy by default.

The popularity/growth of projects like Electron, NW.js, and greater need for customization of metadata in HTTP requests continues to increase. NGN adds support for this standard.

## Subresource Integrity

[Subresource Integrity (SRI)](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) is a security feature that enables HTTP clients to verify resources retrieved (for example, from a CDN, API, or remote data provider) are delivered without unexpected manipulation. It's like checksum for HTTP.

NGN adds simple support for hash matching, throwing an error when content cannot be verified (i.e. handled the same as a browser would handle it).