# fluid-grunt-json5lint

> Validate JSON5 files.

## Getting Started
This plugin works with Grunt 1.x

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install fluid-grunt-json5lint --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks("fluid-grunt-json5lint");
```

## The "json5lint" task

### Overview
In your project's Gruntfile, add a section named `json5lint` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  json5lint: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
});
```

### Usage Examples

```js
grunt.initConfig({
  json5lint: {
    src: ["src/*.json5"]
  }
});
```

## Contributing
In lieu of a formal style guide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).
