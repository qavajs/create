import {test, beforeEach, vi, expect} from 'vitest';
import install from '../src/install';
import {ensureDir} from 'fs-extra';
import {writeFile} from 'node:fs/promises';
import {select, checkbox} from '@inquirer/prompts';
import {execSync} from 'node:child_process';

vi.mock('@inquirer/prompts', () => {
    return {
        select: vi.fn(),
        checkbox: vi.fn()
    }
});

vi.mock('node:fs/promises', async (importOriginal) => {
    const mod = await importOriginal<typeof import('node:fs/promises')>();
    return {
        writeFile: vi.fn(),
        readFile: mod.readFile
    }
});

vi.mock('fs-extra', () => {
    return {
        ensureDir: vi.fn()
    }
});

vi.mock('node:child_process', () => {
    return {
        execSync: vi.fn()
    }
});

const multiline = (lines: Array<string>) => lines.join('\n');
const packageJson = [
    './package.json',
    multiline([
        '{',
        '  "name": "qavajs_project",',
        '  "version": "1.0.0",',
        '  "description": "qavajs project",',
        '  "scripts": {',
        '    "test": "qavajs run"',
        '  },',
        '  "dependencies": {}',
        '}',
        ''
    ]),
    'utf-8'
];

const gitignore = [
    './.gitignore',
    'node_modules/',
    'utf-8'
];

beforeEach(async () => {
    vi.resetAllMocks();
});
test('minimum install', async () => {
    vi.mocked(select).mockResolvedValueOnce('CommonJS');
    vi.mocked(checkbox)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
    await install();
    expect(vi.mocked(ensureDir).mock.calls).toEqual([
        ['./features'],
        ['./memory'],
        ['./report'],
        ['./step_definition']
    ]);
    expect(vi.mocked(writeFile).mock.calls).toEqual([
        gitignore,
        packageJson,
        [
            'config.js',
            multiline([
                'const Memory = require("./memory");',
                'module.exports = {',
                '  default: {',
                '    paths: ["features/**/*.feature"],',
                '    require: ["node_modules/@qavajs/steps-memory/index.js","step_definition/*.js"],',
                '    format: [],',
                '    memory: new Memory(),',
                '  }',
                '}',
                ''
            ]),
            'utf-8'
        ],
        [
            './memory/index.js',
            multiline([
                'module.exports = class Constants {',
                '}',
                '',
            ]),
            'utf-8'
        ],
        [
            './README.MD',
            multiline([
                '# qavajs',
                '## Docs',
                'https://qavajs.github.io/docs/intro',
                '## Install Modules',
                '```bash',
                'npm install',
                '```',
                '## Execute Tests',
                '```bash',
                'npx qavajs run --config config.js',
                '```',
                '## Project Structure',
                '- [config](./config.js) - main config',
                '- [features](./features) - test cases',
                '- [memory](./memory) - test data',
                '- [page_object](./page_object) - page objects',
                '- [step_definitions](./step_definitions) - project specific step definitions',
                '- [report](./report) - reports',
                ''
            ]),
            'utf-8'
        ],
    ]);
    expect(vi.mocked(execSync).mock.calls).toEqual([
        [
            'npm install ' + [
                '@cucumber/cucumber',
                '@qavajs/core@2',
                '@qavajs/steps-memory@2'
            ].join(' '),
            {
                cwd: process.cwd(),
            }
        ]
    ])
});

test('wdio install', async () => {
    vi.mocked(select).mockResolvedValueOnce('CommonJS');
    vi.mocked(checkbox)
        .mockResolvedValueOnce(['wdio'])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
    await install();
    expect(vi.mocked(ensureDir).mock.calls).toEqual([
        ['./features'],
        ['./memory'],
        ['./report'],
        ['./step_definition'],
        ['./page_object']
    ]);
    expect(vi.mocked(writeFile).mock.calls).toEqual([
        gitignore,
        packageJson,
        [
            './features/qavajs.feature',
            multiline([
                'Feature: qavajs framework',
                '  Scenario: Open qavajs docs',
                '    Given I open \'https://qavajs.github.io/\' url',
                '    Then I expect text of \'Body\' to contain \'qavajs\'',
                '',
            ]),
            'utf-8'
        ],
        [
            './page_object/index.js',
            multiline([
                'const { locator } = require("@qavajs/steps-wdio/po");',
                'module.exports = class App {',
                '  Body = locator("body");',
                '  GetStartedButton = locator("a.button[href=\'/docs/intro\']");',
                '}',
                '',
            ]),
            'utf-8'
        ],
        [
            'config.js',
            multiline([
                'const Memory = require("./memory");',
                'const App = require("./page_object");',
                'module.exports = {',
                '  default: {',
                '    paths: ["features/**/*.feature"],',
                '    require: ["node_modules/@qavajs/steps-memory/index.js","node_modules/@qavajs/steps-wdio/index.js","step_definition/*.js"],',
                '    format: [],',
                '    memory: new Memory(),',
                '    pageObject: new App(),',
                '    browser: {',
                '      capabilities: {',
                '        browserName: "chrome"',
                '      }',
                '    },',
                '  }',
                '}',
                ''
            ]),
            'utf-8'
        ],
        [
            './memory/index.js',
            multiline([
                'module.exports = class Constants {',
                '}',
                '',
            ]),
            'utf-8'
        ],
        [
            './README.MD',
            multiline([
                '# qavajs',
                '## Docs',
                'https://qavajs.github.io/docs/intro',
                '## Install Modules',
                '```bash',
                'npm install',
                '```',
                '## Execute Tests',
                '```bash',
                'npx qavajs run --config config.js',
                '```',
                '## Project Structure',
                '- [config](./config.js) - main config',
                '- [features](./features) - test cases',
                '- [memory](./memory) - test data',
                '- [page_object](./page_object) - page objects',
                '- [step_definitions](./step_definitions) - project specific step definitions',
                '- [report](./report) - reports',
                ''
            ]),
            'utf-8'
        ],
    ]);
    expect(vi.mocked(execSync).mock.calls).toEqual([
        [
            'npm install ' + [
                '@cucumber/cucumber',
                '@qavajs/core@2',
                '@qavajs/steps-memory@2',
                '@qavajs/steps-wdio@2'
            ].join(' '),
            {
                cwd: process.cwd(),
            }
        ]
    ])
});

test('wdio with html formatter install', async () => {
    vi.mocked(select).mockResolvedValueOnce('CommonJS');
    vi.mocked(checkbox)
        .mockResolvedValueOnce(['wdio'])
        .mockResolvedValueOnce(['html'])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
    await install();
    expect(vi.mocked(ensureDir).mock.calls).toEqual([
        ['./features'],
        ['./memory'],
        ['./report'],
        ['./step_definition'],
        ['./page_object']
    ]);
    expect(vi.mocked(writeFile).mock.calls).toEqual([
        gitignore,
        packageJson,
        [
            './features/qavajs.feature',
            multiline([
                'Feature: qavajs framework',
                '  Scenario: Open qavajs docs',
                '    Given I open \'https://qavajs.github.io/\' url',
                '    Then I expect text of \'Body\' to contain \'qavajs\'',
                '',
            ]),
            'utf-8'
        ],
        [
            './page_object/index.js',
            multiline([
                'const { locator } = require("@qavajs/steps-wdio/po");',
                'module.exports = class App {',
                '  Body = locator("body");',
                '  GetStartedButton = locator("a.button[href=\'/docs/intro\']");',
                '}',
                ''
            ]),
            'utf-8'
        ],
        [
            'config.js',
            multiline([
                'const Memory = require("./memory");',
                'const App = require("./page_object");',
                'module.exports = {',
                '  default: {',
                '    paths: ["features/**/*.feature"],',
                '    require: ["node_modules/@qavajs/steps-memory/index.js","node_modules/@qavajs/steps-wdio/index.js","step_definition/*.js"],',
                '    format: [["@qavajs/html-formatter","report/report.html"]],',
                '    memory: new Memory(),',
                '    pageObject: new App(),',
                '    browser: {',
                '      capabilities: {',
                '        browserName: "chrome"',
                '      }',
                '    },',
                '  }',
                '}',
                ''
            ]),
            'utf-8'
        ],
        [
            './memory/index.js',
            multiline([
                'module.exports = class Constants {',
                '}',
                '',
            ]),
            'utf-8'
        ],
        [
            './README.MD',
            multiline([
                '# qavajs',
                '## Docs',
                'https://qavajs.github.io/docs/intro',
                '## Install Modules',
                '```bash',
                'npm install',
                '```',
                '## Execute Tests',
                '```bash',
                'npx qavajs run --config config.js',
                '```',
                '## Project Structure',
                '- [config](./config.js) - main config',
                '- [features](./features) - test cases',
                '- [memory](./memory) - test data',
                '- [page_object](./page_object) - page objects',
                '- [step_definitions](./step_definitions) - project specific step definitions',
                '- [report](./report) - reports',
                ''
            ]),
            'utf-8'
        ],
    ]);
    expect(vi.mocked(execSync).mock.calls).toEqual([
        [
            'npm install ' + [
                '@cucumber/cucumber',
                '@qavajs/core@2',
                '@qavajs/steps-memory@2',
                '@qavajs/steps-wdio@2',
                '@qavajs/html-formatter'
            ].join(' '),
            {
                cwd: process.cwd(),
            }
        ]
    ])
});

test('wdio with console formatter install', async () => {
    vi.mocked(select).mockResolvedValueOnce('CommonJS');
    vi.mocked(checkbox)
        .mockResolvedValueOnce(['wdio'])
        .mockResolvedValueOnce(['console'])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
    await install();
    expect(vi.mocked(ensureDir).mock.calls).toEqual([
        ['./features'],
        ['./memory'],
        ['./report'],
        ['./step_definition'],
        ['./page_object']
    ]);
    expect(vi.mocked(writeFile).mock.calls).toEqual([
        gitignore,
        packageJson,
        [
            './features/qavajs.feature',
            multiline([
                'Feature: qavajs framework',
                '  Scenario: Open qavajs docs',
                '    Given I open \'https://qavajs.github.io/\' url',
                '    Then I expect text of \'Body\' to contain \'qavajs\'',
                '',
            ]),
            'utf-8'
        ],
        [
            './page_object/index.js',
            multiline([
                'const { locator } = require("@qavajs/steps-wdio/po");',
                'module.exports = class App {',
                '  Body = locator("body");',
                '  GetStartedButton = locator("a.button[href=\'/docs/intro\']");',
                '}',
                '',
            ]),
            'utf-8'
        ],
        [
            'config.js',
            multiline([
                'const Memory = require("./memory");',
                'const App = require("./page_object");',
                'module.exports = {',
                '  default: {',
                '    paths: ["features/**/*.feature"],',
                '    require: ["node_modules/@qavajs/steps-memory/index.js","node_modules/@qavajs/steps-wdio/index.js","step_definition/*.js"],',
                '    format: ["@qavajs/console-formatter"],',
                '    memory: new Memory(),',
                '    pageObject: new App(),',
                '    browser: {',
                '      capabilities: {',
                '        browserName: "chrome"',
                '      }',
                '    },',
                '  }',
                '}',
                ''
            ]),
            'utf-8'
        ],
        [
            './memory/index.js',
            multiline([
                'module.exports = class Constants {',
                '}',
                '',
            ]),
            'utf-8'
        ],
        [
            './README.MD',
            multiline([
                '# qavajs',
                '## Docs',
                'https://qavajs.github.io/docs/intro',
                '## Install Modules',
                '```bash',
                'npm install',
                '```',
                '## Execute Tests',
                '```bash',
                'npx qavajs run --config config.js',
                '```',
                '## Project Structure',
                '- [config](./config.js) - main config',
                '- [features](./features) - test cases',
                '- [memory](./memory) - test data',
                '- [page_object](./page_object) - page objects',
                '- [step_definitions](./step_definitions) - project specific step definitions',
                '- [report](./report) - reports',
                ''
            ]),
            'utf-8'
        ],
    ]);
    expect(vi.mocked(execSync).mock.calls).toEqual([
        [
            'npm install ' + [
                '@cucumber/cucumber',
                '@qavajs/core@2',
                '@qavajs/steps-memory@2',
                '@qavajs/steps-wdio@2',
                '@qavajs/console-formatter'
            ].join(' '),
            {
                cwd: process.cwd(),
            }
        ]
    ])
});

test('playwright install', async () => {
    vi.mocked(select).mockResolvedValueOnce('CommonJS');
    vi.mocked(checkbox)
        .mockResolvedValueOnce(['playwright'])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
    await install();
    expect(vi.mocked(ensureDir).mock.calls).toEqual([
        ['./features'],
        ['./memory'],
        ['./report'],
        ['./step_definition'],
        ['./page_object']
    ]);
    expect(vi.mocked(writeFile).mock.calls).toEqual([
        gitignore,
        packageJson,
        [
            './features/qavajs.feature',
            multiline([
                'Feature: qavajs framework',
                '  Scenario: Open qavajs docs',
                '    Given I open \'https://qavajs.github.io/\' url',
                '    Then I expect text of \'Body\' to contain \'qavajs\'',
                '',
            ]),
            'utf-8'
        ],
        [
            './page_object/index.js',
            multiline([
                'const { locator } = require("@qavajs/steps-playwright/po");',
                'module.exports = class App {',
                '  Body = locator("body");',
                '  GetStartedButton = locator("a.button[href=\'/docs/intro\']");',
                '}',
                '',
            ]),
            'utf-8'
        ],
        [
            'config.js',
            multiline([
                'const Memory = require("./memory");',
                'const App = require("./page_object");',
                'module.exports = {',
                '  default: {',
                '    paths: ["features/**/*.feature"],',
                '    require: ["node_modules/@qavajs/steps-memory/index.js","node_modules/@qavajs/steps-playwright/index.js","step_definition/*.js"],',
                '    format: [],',
                '    memory: new Memory(),',
                '    pageObject: new App(),',
                '    browser: {',
                '      capabilities: {',
                '        browserName: "chromium"',
                '      }',
                '    },',
                '  }',
                '}',
                ''
            ]),
            'utf-8'
        ],
        [
            './memory/index.js',
            multiline([
                'module.exports = class Constants {',
                '}',
                '',
            ]),
            'utf-8'
        ],
        [
            './README.MD',
            multiline([
                '# qavajs',
                '## Docs',
                'https://qavajs.github.io/docs/intro',
                '## Install Modules',
                '```bash',
                'npm install',
                '```',
                '## Execute Tests',
                '```bash',
                'npx qavajs run --config config.js',
                '```',
                '## Project Structure',
                '- [config](./config.js) - main config',
                '- [features](./features) - test cases',
                '- [memory](./memory) - test data',
                '- [page_object](./page_object) - page objects',
                '- [step_definitions](./step_definitions) - project specific step definitions',
                '- [report](./report) - reports',
                ''
            ]),
            'utf-8'
        ],
    ]);
    expect(vi.mocked(execSync).mock.calls).toEqual([
        [
            'npm install ' + [
                '@cucumber/cucumber',
                '@qavajs/core@2',
                '@qavajs/steps-memory@2',
                '@qavajs/steps-playwright@2'
            ].join(' '),
            {
                cwd: process.cwd(),
            }
        ]
    ])
});

test('wdio and sql install', async () => {
    vi.mocked(select).mockResolvedValueOnce('CommonJS');
    vi.mocked(checkbox)
        .mockResolvedValueOnce(['wdio', 'sql'])
        .mockResolvedValueOnce([]);
    await install();
    expect(vi.mocked(ensureDir).mock.calls).toEqual([
        ['./features'],
        ['./memory'],
        ['./report'],
        ['./step_definition'],
        ['./page_object']
    ]);
    expect(vi.mocked(writeFile).mock.calls).toEqual([
        gitignore,
        packageJson,
        [
            './features/qavajs.feature',
            multiline([
                'Feature: qavajs framework',
                '  Scenario: Open qavajs docs',
                '    Given I open \'https://qavajs.github.io/\' url',
                '    Then I expect text of \'Body\' to contain \'qavajs\'',
                '',
            ]),
            'utf-8'
        ],
        [
            './page_object/index.js',
            multiline([
                'const { locator } = require("@qavajs/steps-wdio/po");',
                'module.exports = class App {',
                '  Body = locator("body");',
                '  GetStartedButton = locator("a.button[href=\'/docs/intro\']");',
                '}',
                '',
            ]),
            'utf-8'
        ],
        [
            'config.js',
            multiline([
                'const Memory = require("./memory");',
                'const App = require("./page_object");',
                'module.exports = {',
                '  default: {',
                '    paths: ["features/**/*.feature"],',
                '    require: ["node_modules/@qavajs/steps-memory/index.js","node_modules/@qavajs/steps-wdio/index.js","node_modules/@qavajs/steps-sql/index.js","step_definition/*.js"],',
                '    format: [],',
                '    memory: new Memory(),',
                '    pageObject: new App(),',
                '    browser: {',
                '      capabilities: {',
                '        browserName: "chrome"',
                '      }',
                '    },',
                '  }',
                '}',
                ''
            ]),
            'utf-8'
        ],
        [
            './memory/index.js',
            multiline([
                'module.exports = class Constants {',
                '}',
                '',
            ]),
            'utf-8'
        ],
        [
            './README.MD',
            multiline([
                '# qavajs',
                '## Docs',
                'https://qavajs.github.io/docs/intro',
                '## Install Modules',
                '```bash',
                'npm install',
                '```',
                '## Execute Tests',
                '```bash',
                'npx qavajs run --config config.js',
                '```',
                '## Project Structure',
                '- [config](./config.js) - main config',
                '- [features](./features) - test cases',
                '- [memory](./memory) - test data',
                '- [page_object](./page_object) - page objects',
                '- [step_definitions](./step_definitions) - project specific step definitions',
                '- [report](./report) - reports',
                ''
            ]),
            'utf-8'
        ],
    ]);
    expect(vi.mocked(execSync).mock.calls).toEqual([
        [
            'npm install ' + [
                '@cucumber/cucumber',
                '@qavajs/core@2',
                '@qavajs/steps-memory@2',
                '@qavajs/steps-wdio@2',
                '@qavajs/steps-sql@2'
            ].join(' '),
            {
                cwd: process.cwd(),
            }
        ]
    ])
});

test('package not found', async () => {
    vi.mocked(select).mockResolvedValueOnce('CommonJS');
    vi.mocked(checkbox)
        .mockResolvedValueOnce(['notFound'])
        .mockResolvedValueOnce([]);
    await expect(install).rejects.toThrow('notFound module is not found');
});

test('both wdio and playwright selected', async () => {
    vi.mocked(select).mockResolvedValueOnce('CommonJS');
    vi.mocked(checkbox)
        .mockResolvedValueOnce(['wdio', 'playwright'])
        .mockResolvedValueOnce([]);
    await expect(install).rejects.toThrow('Please select only one browser driver');
});

test('wdio with console formatter install es modules', async () => {
    vi.mocked(select).mockResolvedValueOnce('ES Modules');
    vi.mocked(checkbox)
        .mockResolvedValueOnce(['wdio'])
        .mockResolvedValueOnce(['console'])
    await install();
    expect(vi.mocked(ensureDir).mock.calls).toEqual([
        ['./features'],
        ['./memory'],
        ['./report'],
        ['./step_definition'],
        ['./page_object'],
    ]);
    expect(vi.mocked(writeFile).mock.calls).toEqual([
        gitignore,
        packageJson,
        [
            './features/qavajs.feature',
            multiline([
                'Feature: qavajs framework',
                '  Scenario: Open qavajs docs',
                '    Given I open \'https://qavajs.github.io/\' url',
                '    Then I expect text of \'Body\' to contain \'qavajs\'',
                '',
            ]),
            'utf-8'
        ],
        [
            './page_object/index.js',
            multiline([
                'import { locator } from "@qavajs/steps-wdio/po";',
                'export default class App {',
                '  Body = locator("body");',
                '  GetStartedButton = locator("a.button[href=\'/docs/intro\']");',
                '}',
                '',
            ]),
            'utf-8'
        ],
        [
            'config.js',
            multiline([
                'import Memory from "./memory/index.js";',
                'import App from "./page_object/index.js";',
                'export default {',
                '  paths: ["features/**/*.feature"],',
                '  import: ["node_modules/@qavajs/steps-memory/index.js","node_modules/@qavajs/steps-wdio/index.js","step_definition/*.js"],',
                '  format: ["@qavajs/console-formatter"],',
                '  memory: new Memory(),',
                '  pageObject: new App(),',
                '  browser: {',
                '    capabilities: {',
                '      browserName: "chrome"',
                '    }',
                '  },',
                '}',
                ''
            ]),
            'utf-8'
        ],
        [
            './memory/index.js',
            multiline([
                'export default class Constants {',
                '}',
                '',
            ]),
            'utf-8'
        ],
        [
            './README.MD',
            multiline([
                '# qavajs',
                '## Docs',
                'https://qavajs.github.io/docs/intro',
                '## Install Modules',
                '```bash',
                'npm install',
                '```',
                '## Execute Tests',
                '```bash',
                'npx qavajs run --config config.js',
                '```',
                '## Project Structure',
                '- [config](./config.js) - main config',
                '- [features](./features) - test cases',
                '- [memory](./memory) - test data',
                '- [page_object](./page_object) - page objects',
                '- [step_definitions](./step_definitions) - project specific step definitions',
                '- [report](./report) - reports',
                ''
            ]),
            'utf-8'
        ],
    ]);
    expect(vi.mocked(execSync).mock.calls).toEqual([
        [
            'npm install ' + [
                '@cucumber/cucumber',
                '@qavajs/core@2',
                '@qavajs/steps-memory@2',
                '@qavajs/steps-wdio@2',
                '@qavajs/console-formatter'
            ].join(' '),
            {
                cwd: process.cwd(),
            }
        ]
    ])
});

test('wdio with console formatter install typescript', async () => {
    vi.mocked(select).mockResolvedValueOnce('Typescript');
    vi.mocked(checkbox)
        .mockResolvedValueOnce(['wdio'])
        .mockResolvedValueOnce(['console']);
    await install();
    expect(vi.mocked(ensureDir).mock.calls).toEqual([
        ['./features'],
        ['./memory'],
        ['./report'],
        ['./step_definition'],
        ['./page_object']
    ]);
    expect(vi.mocked(writeFile).mock.calls).toEqual([
        gitignore,
        packageJson,
        [
            './tsconfig.json',
            multiline([
                '{',
                '  "compilerOptions": {',
                '    "target": "es2016",',
                '    "module": "node16",',
                '    "moduleResolution": "node16",',
                '    "outDir": "./lib",',
                '    "esModuleInterop": true,',
                '    "forceConsistentCasingInFileNames": true,',
                '    "strict": true,',
                '    "skipLibCheck": true',
                '  }',
                '}',
                ''
            ]),
            'utf-8'
        ],
        [
            './features/qavajs.feature',
            multiline([
                'Feature: qavajs framework',
                '  Scenario: Open qavajs docs',
                '    Given I open \'https://qavajs.github.io/\' url',
                '    Then I expect text of \'Body\' to contain \'qavajs\'',
                '',
            ]),
            'utf-8'
        ],
        [
            './page_object/index.ts',
            multiline([
                'import { locator } from "@qavajs/steps-wdio/po";',
                'export default class App {',
                '  Body = locator("body");',
                '  GetStartedButton = locator("a.button[href=\'/docs/intro\']");',
                '}',
                '',
            ]),
            'utf-8'
        ],
        [
            'config.ts',
            multiline([
                'import Memory from "./memory";',
                'import App from "./page_object";',
                'export default {',
                '  paths: ["features/**/*.feature"],',
                '  require: ["node_modules/@qavajs/steps-memory/index.js","node_modules/@qavajs/steps-wdio/index.js","step_definition/*.ts"],',
                '  format: ["@qavajs/console-formatter"],',
                '  memory: new Memory(),',
                '  pageObject: new App(),',
                '  browser: {',
                '    capabilities: {',
                '      browserName: "chrome"',
                '    }',
                '  },',
                '}',
                ''
            ]),
            'utf-8'
        ],
        [
            './memory/index.ts',
            multiline([
                'export default class Constants {',
                '}',
                '',
            ]),
            'utf-8'
        ],
        [
            './README.MD',
            multiline([
                '# qavajs',
                '## Docs',
                'https://qavajs.github.io/docs/intro',
                '## Install Modules',
                '```bash',
                'npm install',
                '```',
                '## Execute Tests',
                '```bash',
                'npx qavajs run --config config.ts',
                '```',
                '## Project Structure',
                '- [config](./config.ts) - main config',
                '- [features](./features) - test cases',
                '- [memory](./memory) - test data',
                '- [page_object](./page_object) - page objects',
                '- [step_definitions](./step_definitions) - project specific step definitions',
                '- [report](./report) - reports',
                ''
            ]),
            'utf-8'
        ],
    ]);
    expect(vi.mocked(execSync).mock.calls).toEqual([
        [
            'npm install ' + [
                '@cucumber/cucumber',
                '@qavajs/core@2',
                'ts-node',
                'typescript',
                '@qavajs/steps-memory@2',
                '@qavajs/steps-wdio@2',
                '@qavajs/console-formatter'
            ].join(' '),
            {
                cwd: process.cwd(),
            }
        ]
    ])
});

test('wdio with console formatter and wdio service adapter install typescript', async () => {
    vi.mocked(select).mockResolvedValueOnce('Typescript');
    vi.mocked(checkbox)
        .mockResolvedValueOnce(['wdio'])
        .mockResolvedValueOnce(['console']);
    await install();
    expect(vi.mocked(ensureDir).mock.calls).toEqual([
        ['./features'],
        ['./memory'],
        ['./report'],
        ['./step_definition'],
        ['./page_object'],
    ]);
    expect(vi.mocked(writeFile).mock.calls).toEqual([
        gitignore,
        packageJson,
        [
            './tsconfig.json',
            multiline([
                '{',
                '  "compilerOptions": {',
                '    "target": "es2016",',
                '    "module": "node16",',
                '    "moduleResolution": "node16",',
                '    "outDir": "./lib",',
                '    "esModuleInterop": true,',
                '    "forceConsistentCasingInFileNames": true,',
                '    "strict": true,',
                '    "skipLibCheck": true',
                '  }',
                '}',
                ''
            ]),
            'utf-8'
        ],
        [
            './features/qavajs.feature',
            multiline([
                'Feature: qavajs framework',
                '  Scenario: Open qavajs docs',
                '    Given I open \'https://qavajs.github.io/\' url',
                '    Then I expect text of \'Body\' to contain \'qavajs\'',
                '',
            ]),
            'utf-8'
        ],
        [
            './page_object/index.ts',
            multiline([
                'import { locator } from "@qavajs/steps-wdio/po";',
                'export default class App {',
                '  Body = locator("body");',
                '  GetStartedButton = locator("a.button[href=\'/docs/intro\']");',
                '}',
                '',
            ]),
            'utf-8'
        ],
        [
            'config.ts',
            multiline([
                'import Memory from "./memory";',
                'import App from "./page_object";',
                'export default {',
                '  paths: ["features/**/*.feature"],',
                '  require: ["node_modules/@qavajs/steps-memory/index.js","node_modules/@qavajs/steps-wdio/index.js","step_definition/*.ts"],',
                '  format: ["@qavajs/console-formatter"],',
                '  memory: new Memory(),',
                '  pageObject: new App(),',
                '  browser: {',
                '    capabilities: {',
                '      browserName: "chrome"',
                '    }',
                '  },',
                '}',
                ''
            ]),
            'utf-8'
        ],
        [
            './memory/index.ts',
            multiline([
                'export default class Constants {',
                '}',
                '',
            ]),
            'utf-8'
        ],
        [
            './README.MD',
            multiline([
                '# qavajs',
                '## Docs',
                'https://qavajs.github.io/docs/intro',
                '## Install Modules',
                '```bash',
                'npm install',
                '```',
                '## Execute Tests',
                '```bash',
                'npx qavajs run --config config.ts',
                '```',
                '## Project Structure',
                '- [config](./config.ts) - main config',
                '- [features](./features) - test cases',
                '- [memory](./memory) - test data',
                '- [page_object](./page_object) - page objects',
                '- [step_definitions](./step_definitions) - project specific step definitions',
                '- [report](./report) - reports',
                ''
            ]),
            'utf-8'
        ],
    ]);
    expect(vi.mocked(execSync).mock.calls).toEqual([
        [
            'npm install ' + [
                '@cucumber/cucumber',
                '@qavajs/core@2',
                'ts-node',
                'typescript',
                '@qavajs/steps-memory@2',
                '@qavajs/steps-wdio@2',
                '@qavajs/console-formatter'
            ].join(' '),
            {
                cwd: process.cwd(),
            }
        ]
    ])
});

test('api install', async () => {
    vi.mocked(select).mockResolvedValueOnce('CommonJS');
    vi.mocked(checkbox)
        .mockResolvedValueOnce(['api'])
        .mockResolvedValueOnce([]);
    await install();
    expect(vi.mocked(ensureDir).mock.calls).toEqual([
        ['./features'],
        ['./memory'],
        ['./report'],
        ['./step_definition']
    ]);
    expect(vi.mocked(writeFile).mock.calls).toEqual([
        gitignore,
        packageJson,
        [
            './features/qavajsApi.feature',
            multiline([
                'Feature: qavajs framework',
                '  Scenario: Request qavajs site',
                '    When I create \'GET\' request \'request\'',
                '    And I add \'https://qavajs.github.io/\' url to \'$request\'',
                '    And I send \'$request\' request and save response as \'response\'',
                '    And I parse \'$response\' body as text',
                '    Then I expect \'$response.payload\' contains \'@qavajs\'',
                '',
            ]),
            'utf-8'
        ],
        [
            'config.js',
            multiline([
                'const Memory = require("./memory");',
                'module.exports = {',
                '  default: {',
                '    paths: ["features/**/*.feature"],',
                '    require: ["node_modules/@qavajs/steps-memory/index.js","node_modules/@qavajs/steps-api/index.js","step_definition/*.js"],',
                '    format: [],',
                '    memory: new Memory(),',
                '  }',
                '}',
                ''
            ]),
            'utf-8'
        ],
        [
            './memory/index.js',
            multiline([
                'module.exports = class Constants {',
                '}',
                '',
            ]),
            'utf-8'
        ],
        [
            './README.MD',
            multiline([
                '# qavajs',
                '## Docs',
                'https://qavajs.github.io/docs/intro',
                '## Install Modules',
                '```bash',
                'npm install',
                '```',
                '## Execute Tests',
                '```bash',
                'npx qavajs run --config config.js',
                '```',
                '## Project Structure',
                '- [config](./config.js) - main config',
                '- [features](./features) - test cases',
                '- [memory](./memory) - test data',
                '- [page_object](./page_object) - page objects',
                '- [step_definitions](./step_definitions) - project specific step definitions',
                '- [report](./report) - reports',
                ''
            ]),
            'utf-8'
        ],
    ]);
    expect(vi.mocked(execSync).mock.calls).toEqual([
        [
            'npm install ' + [
                '@cucumber/cucumber',
                '@qavajs/core@2',
                '@qavajs/steps-memory@2',
                '@qavajs/steps-api@2'
            ].join(' '),
            {
                cwd: process.cwd(),
            }
        ]
    ])
});
