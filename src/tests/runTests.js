import Jasmine from 'jasmine';
import JasmineConsoleReporter from 'jasmine-console-reporter';

const jasmine = new Jasmine();

jasmine.loadConfig({
  'spec_dir': 'spec',
  'spec_files': [
    '../cjs/tests/**/*[sS]pec.js'
  ],
  'helpers': [
    '../cjs/tests/helpers/**/*.js'
  ],
  'stopSpecOnExpectationFailure': false,
  'random': false
});

jasmine.jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

const reporter = new JasmineConsoleReporter({
  // (0|false)|(1|true)|2
  colors: 1,

  // (0|false)|(1|true)|2|3
  cleanStack: 1,

  // (0|false)|1|2|(3|true)|4|Object
  verbosity: 1,

  // 'flat'|'indent'
  listStyle: 'indent',

  // 'ms'|'ns'|'s'
  timeUnit: 'ms',

  // Object|Number
  timeThreshold: { ok: 500, warn: 1000, ouch: 3000 },
  activity: true,

  // boolean or emoji-map object
  emoji: true,
});

// initialize and execute
jasmine.env.clearReporters();
jasmine.addReporter(reporter);
jasmine.execute();
