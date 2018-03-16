Version History
==================

1.7.1 / 2017-11-17
------------------

* FLUID-6225: Update to latest versions of Infusion and node-jqUnit (which have been tested separately) to avoid self-deduping race with uncaught exception handler
* KETTLE-65: Update dependencies to latest versions to address security vulnerabilities

1.7.0 / 2017-08-31
------------------

* GPII-2147: Encode localhost to 127.0.0.1 allowing offline use on Windows
* Updated dependencies to latest versions, with exception of path-to-regexp 2.0.0 which breaks compatibility with /* path

1.6.4 / 2017-07-24
------------------

* GPII-2483: Updated dependencies to allow operation from bare drive letter on Windows

1.6.2 / 2017-07-14
------------------

* GPII-2483: Corrected bad merge of GPII-2483 branch

1.6.1 / 2017-07-13
------------------

* GPII-2483: Reverted to Fluid community edition of "resolve" in order to resolve UNC path issues on Windows

1.6.0 / 2017-06-16
------------------

* KETTLE-59: Implemented "resolvers" to pull environmental values into configs

1.5.0 / 2017-05-01
------------------

* KETTLE-58: Update to "root-safe" self-deduping Infusion with FLUID-6149
* KETTLE-37: Completed support for JSON5-formatted config files
* Updated all outdated npm dependencies (including to express 4.15.2)

1.4.1 / 2017-04-19
------------------

* Updated to dev release of Infusion for fix of self-deduping at root - FLUID-6140

1.4.0 / 2017-02-18
------------------

* KETTLE-57: Fix for failure to properly mark request during action of asynchronous middleware (static serving middleware was broken prior to this release)
* Updated to latest dependencies (including ws 2.x)

1.3.2 / 2017-01-31
------------------

* Updated to quieter version of Infusion and logged created defaults at lower priority

1.3.1 / 2017-01-27
------------------

* Updated all outdated dependencies (including to an infusion 3.0.0-dev release)

1.3.0 / 2017-01-05
------------------

* KETTLE-51: Fixed faulty Content-Length header that did not account for length of UTF-8 encoded bytes

1.2.2 / 2016-11-23
------------------

* Removed unused dependency node-uuid following deprecation warning

1.2.1 / 2016-11-14
------------------

* GPII-2110: Added JSON5 linting task, moved JS linting to eslint-config-fluid shared rules

1.2.0 / 2016-11-03
------------------

* GPII-2110: Added support for JSON5 files both in DataSources and configs

1.1.1 / 2016-11-01
------------------

* KETTLE-48: Updated to latest gpii-express to fix tests under npm 3

1.1.0 / 2016-07-15
------------------

* KETTLE-45: Fixed implementation of `gradeNames` support for request handlers
* Updated to latest versions of dependencies (ws 1.1.1, express 4.14.0, etc.)

1.0.1 / 2016-06-08
------------------

* Updated to later versions of Infusion, gpii-express and gpii-pouchdb, moved over to ESLint for linting

1.0.0 / 2016-05-26
------------------

* First release with reasonable test coverage - consult docs for features
