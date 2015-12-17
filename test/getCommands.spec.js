const path = require('path');
const expect = require('chai').expect;
const getCommands = require('../src/getCommands');
const mock = require('mock-require');
const mockFs = require('mock-fs');
const sinon = require('sinon');
const rewire = require('rewire');

const commands = require('./fixtures/commands');
const nestedPluginPath = path.join(process.cwd(), 'node_modules', 'rnpm-plugin-test');
const nestedPluginPath2 = path.join(process.cwd(), 'node_modules', 'rnpm-plugin-test-2');
const flatPluginPath = path.join(process.cwd(), '..', 'rnpm-plugin-test');
const flatPluginPath2 = path.join(process.cwd(), '..', 'rnpm-plugin-test-2');
const pjsonPath = path.join(__dirname, '..', 'package.json');

const pjson = {
  dependencies: {
    [path.basename(nestedPluginPath)]: '*',
  },
};

const APP_JSON = path.join(process.cwd(), 'package.json');
const LOCAL_NODE_MODULES = path.join(process.cwd(), 'node_modules');
const GLOBAL_NODE_MODULES = '/usr/local/lib/node_modules';
const GLOBAL_RNPM_PJSON = path.join(GLOBAL_NODE_MODULES, '/rnpm/package.json');

describe('getCommands', () => {

  beforeEach(() => {
    mock(pjsonPath, pjson);
    mock('rnpm-plugin-test', commands.single);
    mock(nestedPluginPath, commands.single);
    mock(flatPluginPath, commands.single);
  });

  it('list of the commands should be a non-empty array', () => {
    expect(getCommands()).to.be.not.empty;
    expect(getCommands()).to.be.an('array');
  });

  it('should export one command', () => {
    expect(getCommands().length).to.be.equal(1);
  });

  it('should export multiple commands', () => {
    mock('rnpm-plugin-test', commands.multiple);

    expect(getCommands().length).to.be.equal(2);
  });

  it('should export unique list of commands by name', () => {
    mock(pjsonPath, {
      dependencies: {
        [path.basename(nestedPluginPath)]: '*',
        [path.basename(nestedPluginPath2)]: '*',
      },
    });

    mock('rnpm-plugin-test-2', commands.single);
    mock(path.join(LOCAL_NODE_MODULES, 'rnpm-plugin-test-2'), commands.single);

    expect(getCommands().length).to.be.equal(1);
  });

  describe('in local installation', () => {

    var getCommands;
    var revert;

    before(() => {
      getCommands = rewire('../src/getCommands');
      revert = getCommands.__set__('__dirname', path.join(LOCAL_NODE_MODULES, 'rnpm/src'));
    });

    it('should load rnpm plugins', () => {
      mock('rnpm-plugin-global', commands.single);
      mock(APP_JSON, {});
      mock(path.join(LOCAL_NODE_MODULES, 'rnpm/package.json'), {
        dependencies: {
          'rnpm-plugin-global': '*',
        },
      });

      expect(getCommands()[0]).to.be.equal(commands.single);
    });

    it('should load app specific plugins', () => {
      mock(path.join(LOCAL_NODE_MODULES, 'rnpm-plugin-local-app-plugin'), commands.single);
      mock(GLOBAL_RNPM_PJSON, {});
      mock(APP_JSON, {
        dependencies: {
          'rnpm-plugin-local-app-plugin': '*',
        },
      });

      expect(getCommands()[0]).to.be.equal(commands.single);
    });

    after(() => revert());
  });

  describe('in global installation', () => {
    var getCommands;
    var revert;

    before(() => {
      getCommands = rewire('../src/getCommands');
      revert = getCommands.__set__('__dirname', path.join(GLOBAL_NODE_MODULES, 'rnpm/src'));
    });

    it('should load rnpm own plugins', () => {
      mock('rnpm-plugin-global', commands.single);
      mock(APP_JSON, {});
      mock(GLOBAL_RNPM_PJSON, {
        dependencies: {
          'rnpm-plugin-global': '*',
        },
      });

      expect(getCommands()[0]).to.be.equal(commands.single);
    });

    it('should load app specific plugins', () => {
      mock(path.join(LOCAL_NODE_MODULES, 'rnpm-plugin-local-app-plugin'), commands.single);
      mock(GLOBAL_RNPM_PJSON, {});
      mock(APP_JSON, {
        dependencies: {
          'rnpm-plugin-local-app-plugin': '*',
        },
      });

      expect(getCommands()[0]).to.be.equal(commands.single);
    });

    after(() => revert());

  });


  afterEach(mock.stopAll);

});
