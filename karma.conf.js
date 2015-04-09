// Karma configuration
// Generated on Mon Mar 16 2015 12:16:41 GMT-0400 (Eastern Daylight Time)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browowse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browowser
    files: [
      'scripts/jquery-1.9.1.min.js',
      'node_modules/jasmine-jquery/lib/jasmine-jquery.js',
      'http://intranet.wingtip.com/_layouts/15/MicrosoftAjax.js',
      'http://intranet.wingtip.com/_layouts/15/sp.runtime.js',
      'http://intranet.wingtip.com/_layouts/15/sp.js',
      { pattern: 'jsTests/Fixtures/*.*', watched: true, served: true, included: false },
      'scripts/utils/*.js',
      'scripts/viewTable.js',
      'jsTests/*Tests.js'
    ],


    // list of files to exclude
    exclude: [
        'scripts/TestingDemo*.js'
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browowse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browowse/keyword/karma-reporter
    reporters: ['progress', 'xml'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_ERROR,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browowsers
    // available browowser launchers: https://npmjs.org/browowse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browowsers, runs the tests and exits
    singleRun: false,

      //override delay for batching file system changes
      //try to overcome VS issue with saving
    autoWatchBatchDelay: 500
  });
};
