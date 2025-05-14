export default [
    '@cucumber/cucumber',
    '@qavajs/core@2'
]

export type ModuleDefinition = {
    module: string,
    packageName: string,
    out?: string,
    version?: string,
}

export const steps: Array<ModuleDefinition> = [
    { module: 'playwright', packageName: '@qavajs/steps-playwright', version: '2' },
    { module: 'wdio', packageName: '@qavajs/steps-wdio', version: '2' },
    { module: 'api', packageName: '@qavajs/steps-api', version: '2' },
    { module: 'files', packageName: '@qavajs/steps-files', version: '2' },
    { module: 'sql', packageName: '@qavajs/steps-sql', version: '2' },
    { module: 'lighthouse', packageName: '@qavajs/steps-lighthouse', version: '2'},
    { module: 'visual testing', packageName: '@qavajs/steps-visual-testing', version: '2' },
    { module: 'accessibility (axe)', packageName: '@qavajs/steps-accessibility' },
    { module: 'accessibility (equal access)', packageName: '@qavajs/steps-accessibility-ea' },
]

export const format: Array<ModuleDefinition> = [
    { module: 'report portal', packageName: '@qavajs/format-report-portal', out: 'report/rp.out' },
    { module: 'console', packageName: '@qavajs/console-formatter' },
    { module: 'html', packageName: '@qavajs/html-formatter', out: 'report/report.html' },
    { module: 'jira xray', packageName: '@qavajs/xray-formatter', out: 'report/xray.out' },
]
