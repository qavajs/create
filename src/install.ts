import { readFile, writeFile } from 'node:fs/promises';
import { ensureDir } from 'fs-extra';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

function installModules({ deps, cwd }: { deps: any[], cwd: string }) {
    const modules = deps.join(' ');
    execSync(`npm install ${modules}`, { cwd });
}

import deps, { steps, format, ModuleDefinition } from './deps';
import { compile } from 'ejs';
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

const replaceNewLines = (text: string) => text.replace(/(\r?\n\r?)+/g, '\n');

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
    const configTemplate: string = await readFile(
        resolve(__dirname, '../templates/config.ejs'),
        'utf-8'
    );
    const configEjs = compile(configTemplate);
    const stepDefinitionGlob = `step_definition/*.${isTypescript ? 'ts' : 'js'}`;
    const stepsPackagesGlobs = ['node_modules/@qavajs/steps-memory/index.js', ...requireGlob(answers.steps, steps)];
    const config = configEjs({
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

    await ensureDir('./features');
    await ensureDir('./memory');
    await ensureDir('./report');
    await ensureDir('./step_definition');

    if (isPOIncluded) {
        let poModule: string | undefined;
        if (isWdioIncluded) poModule = '@qavajs/steps-wdio/po';
        if (isPlaywrightIncluded) poModule = '@qavajs/steps-playwright/po';
        if (!poModule) throw new Error('No PO module');
        const featureTemplate: string = await readFile(
            resolve(__dirname, '../templates/feature.ejs'),
            'utf-8'
        );
        const featureEjs = compile(featureTemplate);
        const featureFile = featureEjs();
        await writeFile('./features/qavajs.feature', replaceNewLines(featureFile), 'utf-8');

        //create page object folder
        await ensureDir('./page_object');
        const poTemplate: string = await readFile(
            resolve(__dirname, '../templates/po.ejs'),
            'utf-8'
        );
        const poEjs = compile(poTemplate);
        const poFile = poEjs({
            moduleSystem: answers.moduleSystem,
            poModule
        })
        await writeFile(`./page_object/index.${isTypescript ? 'ts' : 'js'}`, replaceNewLines(poFile), 'utf-8');
    }

    if (isApiIncluded) {
        const featureTemplate: string = await readFile(
            resolve(__dirname, '../templates/featureApi.ejs'),
            'utf-8'
        );
        const featureEjs = compile(featureTemplate);
        const featureFile = featureEjs();
        await writeFile('./features/qavajsApi.feature', replaceNewLines(featureFile), 'utf-8');
    }

    await writeFile(`config.${isTypescript ? 'ts' : 'js'}`, replaceNewLines(config), 'utf-8');

    const memoryTemplate: string = await readFile(
        resolve(__dirname, '../templates/memory.ejs'),
        'utf-8'
    );
    const memoryEjs = compile(memoryTemplate);
    const memoryFile = memoryEjs({
        moduleSystem: answers.moduleSystem
    })

    await writeFile(`./memory/index.${isTypescript ? 'ts' : 'js'}`, replaceNewLines(memoryFile), 'utf-8');

    const readmeTemplate: string = await readFile(
        resolve(__dirname, '../templates/readme.ejs'),
        'utf-8'
    );
    const readmeEjs = compile(readmeTemplate);
    const readmeFile = readmeEjs({
        moduleSystem: answers.moduleSystem
    })

    await writeFile(`./README.MD`, replaceNewLines(readmeFile), 'utf-8');

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
