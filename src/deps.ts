export default [
    '@cucumber/cucumber',
    '@qavajs/memory',
    '@qavajs/cli',
    '@qavajs/validation'
]

export type ModuleDefinition = {
    module: string,
    packageName: string,
    out?: string,
    version?: string
}

export const steps: Array<ModuleDefinition> = [
    { module: 'playwright', packageName: '@qavajs/steps-playwright', version: '1' },
    { module: 'wdio', packageName: '@qavajs/steps-wdio', version: '1' },
    { module: 'api', packageName: '@qavajs/steps-api', version: '1' },
    { module: 'files', packageName: '@qavajs/steps-files', version: '1' },
    { module: 'sql', packageName: '@qavajs/steps-sql', version: '1' },
    { module: 'accessibility', packageName: '@qavajs/steps-accessibility', version: '1' },
    { module: 'lighthouse', packageName: '@qavajs/steps-lighthouse', version: '1' },
    { module: 'visual testing', packageName: '@qavajs/steps-visual-testing', version: '1' },
    { module: 'memory', packageName: '@qavajs/steps-memory', version: '1' }
]

export const format: Array<ModuleDefinition> = [
    { module: 'report portal', packageName: '@qavajs/format-report-portal', out: 'report/rp.out' },
    { module: 'console', packageName: '@qavajs/console-formatter' },
    { module: 'html', packageName: '@qavajs/html-formatter', out: 'report/report.html' },
    { module: 'jira xray', packageName: '@qavajs/xray-formatter', out: 'report/xray.out' },
]

export const modules: Array<ModuleDefinition> = [
    { module: 'template', packageName: '@qavajs/template' },
    { module: 'soft-assertion', packageName: '@qavajs/soft-assertion' },
]

export const additionalModules: Array<ModuleDefinition> = [
    { module: 'wdio service adapter', packageName: '@qavajs/wdio-service-adapter' },
    { module: 'webstorm adapter', packageName: '@qavajs/webstorm-adapter' },
]

