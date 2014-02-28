# How to contribute

Third-party patches are help keep NGN great. The world of Node.js is quite
large, and it is impossible for anyone to keep up with absolutely everything.
Knowing that, we appreciate contributions. In an effort to keep community
code working to the standards expected of NGN, there are a few guidelines that we
need contributors to follow so that we can have a chance of keeping on
top of things.

## Getting Started

To get started, <a href="http://www.clahub.com/agreements/nodengn/NGN">sign the Contributor License Agreement</a>.

* Make sure you have a [GitHub account](https://github.com/signup/free)
* Submit a ticket for your issue, assuming one does not already exist.
  * Clearly describe the issue including steps to reproduce when it is a bug.
  * Make sure you fill in the earliest version that you know has the issue.
* Fork the repository on GitHub
  * We'd __love__ it if you could add a mocha test in the `test\regressions.js`. This will greatly speed up the process of fixing bugs and making sure they don't creep up again later.

## Making Changes

* Make commits of logical units.
* Check for unnecessary whitespace with `git diff --check` before committing.
* Make sure you have added the necessary tests for your changes.
* Run _all_ the tests to assure nothing else was accidentally broken.
* Make sure your commit messages are in the proper format.

```
 A proper commit message identifies the change made. If the change is made as a bug
 fix, it should reference the issue number according to standard Github status.
```
**Example**
```
Added a method to prevent duplicate output. Closes #1234
```

## Making Trivial Changes

### Documentation

For changes of a trivial nature to comments and documentation, it is not
always necessary to create a new issue. In this case, it is
appropriate to start the first line of a commit with '(doc)' instead of
a ticket number. 

```
	(doc) Add documentation commit example to File.js
```

## Submitting Changes

* Push your changes to the appropriate branch in your fork of the repository.
* Submit a pull request to the repository in the nodengn organization.
* When asked, sign the Contributor License Agreement
