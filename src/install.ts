import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

function installModules({ deps, cwd }: { deps: any[], cwd: string }) {
    const modules = deps.join(' ');
    execSync(`npm install ${modules}`, { cwd });
}

import deps, { steps, format, ModuleDefinition } from './deps';
import { select, checkbox } from '@inquirer/prompts';

const packs = (deps: Array<ModuleDefinition>) => deps.map(({module}) => ({ value: module }));
const packages = (moduleList: Array<string>, packageMap: Array<ModuleDefinition>): Array<string> => {
    return moduleList
        .map((module: string) => {
            const pkg = packageMap.find((p: ModuleDefinition) => p.module === module);
            if (!pkg) throw new Error(`${module} module is not found`);
            return pkg.version ? `${pkg.packageName}@${pkg.version}` : pkg.packageName;
        }) as Array<string>
}
const requireGlob = (moduleList: Array<string>, packageMap: Array<ModuleDefinition>): Array<string> => {
    return moduleList
        .map((module: string) => {
            const pkg = packageMap.find((p: ModuleDefinition) => p.module === module);
            if (!pkg) throw new Error(`${module} module is not found`);
            return `node_modules/${pkg.packageName}/index.js`;
        }) as Array<string>
}

function generateConfig({ steps, moduleSystem, format, isWdioIncluded, isPlaywrightIncluded }: {
    steps: string, moduleSystem: string, format: string, isWdioIncluded: boolean, isPlaywrightIncluded: boolean
}): string {
    const isESM = moduleSystem === 'ES Modules';
    const isPOIncluded = isWdioIncluded || isPlaywrightIncluded;
    const browserName = isWdioIncluded ? '"chrome"' : '"chromium"';

    if (moduleSystem === 'CommonJS') {
        const lines: string[] = [
            `const Memory = require("./memory");`,
            ...(isPOIncluded ? [`const App = require("./page_object");`] : []),
            `module.exports = {`,
            `  default: {`,
            `    paths: ["features/**/*.feature"],`,
            `    require: ${steps},`,
            `    format: ${format},`,
            `    memory: new Memory(),`,
            ...(isPOIncluded ? [
                `    pageObject: new App(),`,
                `    browser: {`,
                `      capabilities: {`,
                `        browserName: ${browserName}`,
                `      }`,
                `    },`,
            ] : []),
            `  }`,
            `}`,
        ];
        return lines.join('\n') + '\n';
    } else {
        const ext = isESM ? '/index.js' : '';
        const importKey = isESM ? 'import' : 'require';
        const lines: string[] = [
            `import Memory from "./memory${ext}";`,
            ...(isPOIncluded ? [`import App from "./page_object${ext}";`] : []),
            `export default {`,
            `  paths: ["features/**/*.feature"],`,
            `  ${importKey}: ${steps},`,
            `  format: ${format},`,
            `  memory: new Memory(),`,
            ...(isPOIncluded ? [
                `  pageObject: new App(),`,
                `  browser: {`,
                `    capabilities: {`,
                `      browserName: ${browserName}`,
                `    }`,
                `  },`,
            ] : []),
            `}`,
        ];
        return lines.join('\n') + '\n';
    }
}

function generateMemory(moduleSystem: string): string {
    const prefix = (moduleSystem === 'ES Modules' || moduleSystem === 'Typescript') ? 'export default ' : 'module.exports = ';
    return `${prefix}class Constants {\n}\n`;
}

function generatePo(moduleSystem: string, poModule: string): string {
    const isESM = moduleSystem === 'ES Modules';
    const isESMorTS = isESM || moduleSystem === 'Typescript';
    const ext = isESM ? '.js' : '';

    if (isESMorTS) {
        return [
            `import { locator } from "${poModule}${ext}";`,
            `export default class App {`,
            `  Body = locator("body");`,
            `  GetStartedButton = locator("a.button[href='/docs/intro']");`,
            `}`,
            '',
        ].join('\n');
    } else {
        return [
            `const { locator } = require("${poModule}");`,
            `module.exports = class App {`,
            `  Body = locator("body");`,
            `  GetStartedButton = locator("a.button[href='/docs/intro']");`,
            `}`,
            '',
        ].join('\n');
    }
}

function generateReadme(moduleSystem: string): string {
    const ext = moduleSystem === 'Typescript' ? 'ts' : 'js';
    return [
        `# qavajs`,
        `## Docs`,
        `https://qavajs.github.io/`,
        `## Install Modules`,
        '```bash',
        `npm install`,
        '```',
        `## Execute Tests`,
        '```bash',
        `npx qavajs run --config config.${ext}`,
        '```',
        `## Project Structure`,
        `- [config](./config.${ext}) - main config`,
        `- [features](./features) - test cases`,
        `- [memory](./memory) - test data`,
        `- [page_object](./page_object) - page objects`,
        `- [step_definition](./step_definition) - custom step definitions`,
        `- [report](./report) - reports`,
        '',
    ].join('\n');
}

const featureTemplate = [
    `Feature: qavajs framework`,
    `  Scenario: Open qavajs docs`,
    `    Given I open 'https://qavajs.github.io/' url`,
    `    Then I expect text of 'Body' to contain 'qavajs'`,
    '',
].join('\n');

const featureApiTemplate = [
    `Feature: qavajs framework`,
    `  Scenario: Request qavajs site`,
    `    When I create 'GET' request 'request'`,
    `    And I add 'https://qavajs.github.io/' url to '$request'`,
    `    And I send '$request' request and save response as 'response'`,
    `    And I parse '$response' body as text`,
    `    Then I expect '$response.payload' contains '@qavajs'`,
    '',
].join('\n');

export default async function install(): Promise<void> {
    const requiredDeps = [...deps];

    const answers = {
        moduleSystem: await select({
            message: 'select module system you want to use:',
            choices: [
                { value: 'CommonJS' },
                { value: 'ES Modules' },
                { value: 'Typescript' }
            ]
        }),
        steps: await checkbox({
            message: 'select step packages to install:',
            choices: packs(steps)
        }),
        formats: await checkbox({
            message: 'select formatters (reporters) to install:',
            choices: packs(format)
        })
    };

    const stepsPackages: Array<string> = ['@qavajs/steps-memory@2', ...packages(answers.steps, steps)];
    const formatPackages: Array<string> = packages(answers.formats, format);

    const isTypescript = answers.moduleSystem === 'Typescript';
    const isWdioIncluded = answers.steps.includes('wdio');
    const isPlaywrightIncluded = answers.steps.includes('playwright');
    const isApiIncluded = answers.steps.includes('api');
    //checking if user selected only one browser driver
    if (isPlaywrightIncluded && isWdioIncluded) {
        throw new Error('Please select only one browser driver');
    }
    const isPOIncluded: boolean = isWdioIncluded || isPlaywrightIncluded;

    // add gitignore
    const gitignoreTemplate = await readFile(
        resolve(__dirname, '../templates/gitignore'),
        'utf-8'
    );
    await writeFile(`./.gitignore`, gitignoreTemplate, 'utf-8');

    // add package.json
    const packageJsonTemplate = await readFile(
        resolve(__dirname, '../templates/package.json'),
        'utf-8'
    );
    await writeFile(`./package.json`, packageJsonTemplate, 'utf-8');
    // add ts-node and typescript packages if module system is typescript
    // put tsconfig
    if (isTypescript) {
        requiredDeps.push('ts-node');
        requiredDeps.push('typescript');
        const tsconfig = await readFile(
            resolve(__dirname, '../templates/tsconfig.json'),
            'utf-8'
        );
        await writeFile(`./tsconfig.json`, tsconfig, 'utf-8');
    }

    const stepDefinitionGlob = `step_definition/*.${isTypescript ? 'ts' : 'js'}`;
    const stepsPackagesGlobs = ['node_modules/@qavajs/steps-memory/index.js', ...requireGlob(answers.steps, steps)];
    const config = generateConfig({
        steps: JSON.stringify([...stepsPackagesGlobs, stepDefinitionGlob]),
        moduleSystem: answers.moduleSystem,
        format: JSON.stringify(
            format
                .filter(p => formatPackages.includes(p.packageName))
                .map(p => p.out ? [p.packageName, p.out] : p.packageName)
        ),
        isWdioIncluded,
        isPlaywrightIncluded,
    });

    await mkdir('./features', { recursive: true });
    await mkdir('./memory', { recursive: true });
    await mkdir('./report', { recursive: true });
    await mkdir('./step_definition', { recursive: true });

    if (isPOIncluded) {
        let poModule: string | undefined;
        if (isWdioIncluded) poModule = '@qavajs/steps-wdio/po';
        if (isPlaywrightIncluded) poModule = '@qavajs/steps-playwright/po';
        if (!poModule) throw new Error('No PO module');

        await writeFile('./features/qavajs.feature', featureTemplate, 'utf-8');

        //create page object folder
        await mkdir('./page_object', { recursive: true });
        const poFile = generatePo(answers.moduleSystem, poModule);
        await writeFile(`./page_object/index.${isTypescript ? 'ts' : 'js'}`, poFile, 'utf-8');
    }

    if (isApiIncluded) {
        await writeFile('./features/qavajsApi.feature', featureApiTemplate, 'utf-8');
    }

    await writeFile(`config.${isTypescript ? 'ts' : 'js'}`, config, 'utf-8');

    const memoryFile = generateMemory(answers.moduleSystem);
    await writeFile(`./memory/index.${isTypescript ? 'ts' : 'js'}`, memoryFile, 'utf-8');

    const readmeFile = generateReadme(answers.moduleSystem);
    await writeFile(`./README.MD`, readmeFile, 'utf-8');

    const modulesToInstall = [
        ...requiredDeps,
        ...stepsPackages,
        ...formatPackages,
    ];
    console.log('installing packages...');
    console.log(modulesToInstall);

    installModules({
        deps: modulesToInstall,
        cwd: process.cwd()
    });

    console.log('test script:');
    console.log(`npx qavajs --config config.${isTypescript ? 'ts' : 'js'}`);
}
