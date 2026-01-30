import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Project information detected from workspace
 */
export interface ProjectInfo {
    name: string;
    rootPath: string;
    languages: string[];
    frameworks: string[];
    buildTools: string[];
    hasTests: boolean;
    testFrameworks: string[];
    hasDocker: boolean;
    hasCICD: boolean;
    cicdPlatform: string | null;
    packageManager: string | null;
    mainEntryPoints: string[];
    structure: {
        hasSrc: boolean;
        hasLib: boolean;
        hasDocs: boolean;
        hasTests: boolean;
        directories: string[];
    };
}

/**
 * Analyzes a project to detect its technology stack and structure
 */
export class ProjectAnalyzer {
    private workspaceRoot: string;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }

    /**
     * Analyze the project and return information about it
     */
    async analyze(): Promise<ProjectInfo> {
        const name = path.basename(this.workspaceRoot);
        
        const [
            languages,
            frameworks,
            buildTools,
            testInfo,
            dockerInfo,
            cicdInfo,
            packageManager,
            structure
        ] = await Promise.all([
            this.detectLanguages(),
            this.detectFrameworks(),
            this.detectBuildTools(),
            this.detectTestSetup(),
            this.detectDocker(),
            this.detectCICD(),
            this.detectPackageManager(),
            this.analyzeStructure()
        ]);

        const mainEntryPoints = this.detectEntryPoints(languages);

        return {
            name,
            rootPath: this.workspaceRoot,
            languages,
            frameworks,
            buildTools,
            hasTests: testInfo.hasTests,
            testFrameworks: testInfo.frameworks,
            hasDocker: dockerInfo,
            hasCICD: cicdInfo.hasCICD,
            cicdPlatform: cicdInfo.platform,
            packageManager,
            mainEntryPoints,
            structure
        };
    }

    private async detectLanguages(): Promise<string[]> {
        const languages: string[] = [];
        const indicators: Record<string, string[]> = {
            'TypeScript': ['tsconfig.json', '*.ts', '*.tsx'],
            'JavaScript': ['package.json', '*.js', '*.jsx'],
            'Python': ['requirements.txt', 'setup.py', 'pyproject.toml', 'Pipfile', '*.py'],
            'Go': ['go.mod', 'go.sum', '*.go'],
            'Rust': ['Cargo.toml', '*.rs'],
            'Java': ['pom.xml', 'build.gradle', '*.java'],
            'C#': ['*.csproj', '*.sln', '*.cs'],
            'Ruby': ['Gemfile', '*.rb'],
            'PHP': ['composer.json', '*.php'],
            'Swift': ['Package.swift', '*.swift'],
            'Kotlin': ['*.kt', 'build.gradle.kts']
        };

        for (const [lang, patterns] of Object.entries(indicators)) {
            for (const pattern of patterns) {
                if (pattern.startsWith('*')) {
                    // Check for file extension
                    const ext = pattern.slice(1);
                    if (await this.hasFilesWithExtension(ext)) {
                        languages.push(lang);
                        break;
                    }
                } else {
                    // Check for specific file
                    if (this.fileExists(pattern)) {
                        languages.push(lang);
                        break;
                    }
                }
            }
        }

        return [...new Set(languages)];
    }

    private async detectFrameworks(): Promise<string[]> {
        const frameworks: string[] = [];

        // Check package.json for JS/TS frameworks
        const packageJson = this.readPackageJson();
        if (packageJson) {
            const deps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies
            };

            const frameworkIndicators: Record<string, string[]> = {
                'React': ['react', 'react-dom'],
                'Next.js': ['next'],
                'Vue': ['vue'],
                'Nuxt': ['nuxt'],
                'Angular': ['@angular/core'],
                'Svelte': ['svelte'],
                'Express': ['express'],
                'NestJS': ['@nestjs/core'],
                'Fastify': ['fastify'],
                'Koa': ['koa'],
                'Hono': ['hono'],
                'Electron': ['electron'],
                'React Native': ['react-native']
            };

            for (const [framework, packages] of Object.entries(frameworkIndicators)) {
                if (packages.some(pkg => deps[pkg])) {
                    frameworks.push(framework);
                }
            }
        }

        // Check for Python frameworks
        if (this.fileExists('requirements.txt') || this.fileExists('pyproject.toml')) {
            const content = this.readFile('requirements.txt') || this.readFile('pyproject.toml') || '';
            const pythonFrameworks: Record<string, string[]> = {
                'Django': ['django'],
                'Flask': ['flask'],
                'FastAPI': ['fastapi'],
                'Tornado': ['tornado'],
                'Pyramid': ['pyramid']
            };

            for (const [framework, indicators] of Object.entries(pythonFrameworks)) {
                if (indicators.some(ind => content.toLowerCase().includes(ind))) {
                    frameworks.push(framework);
                }
            }
        }

        // Check for Go frameworks
        if (this.fileExists('go.mod')) {
            const content = this.readFile('go.mod') || '';
            const goFrameworks: Record<string, string[]> = {
                'Gin': ['github.com/gin-gonic/gin'],
                'Echo': ['github.com/labstack/echo'],
                'Fiber': ['github.com/gofiber/fiber'],
                'Chi': ['github.com/go-chi/chi']
            };

            for (const [framework, indicators] of Object.entries(goFrameworks)) {
                if (indicators.some(ind => content.includes(ind))) {
                    frameworks.push(framework);
                }
            }
        }

        return [...new Set(frameworks)];
    }

    private async detectBuildTools(): Promise<string[]> {
        const tools: string[] = [];

        const buildIndicators: Record<string, string> = {
            'npm': 'package-lock.json',
            'yarn': 'yarn.lock',
            'pnpm': 'pnpm-lock.yaml',
            'bun': 'bun.lockb',
            'webpack': 'webpack.config.js',
            'vite': 'vite.config.ts',
            'esbuild': 'esbuild.config.js',
            'rollup': 'rollup.config.js',
            'turbo': 'turbo.json',
            'nx': 'nx.json',
            'gradle': 'build.gradle',
            'maven': 'pom.xml',
            'make': 'Makefile',
            'cmake': 'CMakeLists.txt',
            'cargo': 'Cargo.toml'
        };

        for (const [tool, file] of Object.entries(buildIndicators)) {
            if (this.fileExists(file)) {
                tools.push(tool);
            }
        }

        // Check package.json scripts
        const packageJson = this.readPackageJson();
        if (packageJson?.scripts) {
            if (packageJson.scripts.build?.includes('tsc')) {
                tools.push('tsc');
            }
        }

        return [...new Set(tools)];
    }

    private async detectTestSetup(): Promise<{ hasTests: boolean; frameworks: string[] }> {
        const frameworks: string[] = [];
        let hasTests = false;

        // Check for test directories
        const testDirs = ['test', 'tests', '__tests__', 'spec', 'specs'];
        for (const dir of testDirs) {
            if (this.directoryExists(dir)) {
                hasTests = true;
                break;
            }
        }

        // Check package.json for test frameworks
        const packageJson = this.readPackageJson();
        if (packageJson) {
            const deps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies
            };

            const testIndicators: Record<string, string[]> = {
                'Jest': ['jest', '@jest/core'],
                'Vitest': ['vitest'],
                'Mocha': ['mocha'],
                'Jasmine': ['jasmine'],
                'AVA': ['ava'],
                'Playwright': ['@playwright/test'],
                'Cypress': ['cypress'],
                'Testing Library': ['@testing-library/react', '@testing-library/vue']
            };

            for (const [framework, packages] of Object.entries(testIndicators)) {
                if (packages.some(pkg => deps[pkg])) {
                    frameworks.push(framework);
                    hasTests = true;
                }
            }

            // Check for test script
            if (packageJson.scripts?.test && packageJson.scripts.test !== 'echo "Error: no test specified" && exit 1') {
                hasTests = true;
            }
        }

        // Check for Python test frameworks
        const pythonTestFiles = ['pytest.ini', 'setup.cfg', 'tox.ini'];
        for (const file of pythonTestFiles) {
            if (this.fileExists(file)) {
                frameworks.push('pytest');
                hasTests = true;
                break;
            }
        }

        return { hasTests, frameworks: [...new Set(frameworks)] };
    }

    private async detectDocker(): Promise<boolean> {
        return this.fileExists('Dockerfile') || 
               this.fileExists('docker-compose.yml') || 
               this.fileExists('docker-compose.yaml') ||
               this.fileExists('.dockerignore');
    }

    private async detectCICD(): Promise<{ hasCICD: boolean; platform: string | null }> {
        const cicdIndicators: Record<string, string[]> = {
            'GitHub Actions': ['.github/workflows'],
            'GitLab CI': ['.gitlab-ci.yml'],
            'CircleCI': ['.circleci/config.yml'],
            'Jenkins': ['Jenkinsfile'],
            'Travis CI': ['.travis.yml'],
            'Azure Pipelines': ['azure-pipelines.yml'],
            'Bitbucket Pipelines': ['bitbucket-pipelines.yml']
        };

        for (const [platform, paths] of Object.entries(cicdIndicators)) {
            for (const p of paths) {
                if (this.fileExists(p) || this.directoryExists(p)) {
                    return { hasCICD: true, platform };
                }
            }
        }

        return { hasCICD: false, platform: null };
    }

    private async detectPackageManager(): Promise<string | null> {
        if (this.fileExists('bun.lockb')) return 'bun';
        if (this.fileExists('pnpm-lock.yaml')) return 'pnpm';
        if (this.fileExists('yarn.lock')) return 'yarn';
        if (this.fileExists('package-lock.json')) return 'npm';
        if (this.fileExists('Pipfile.lock')) return 'pipenv';
        if (this.fileExists('poetry.lock')) return 'poetry';
        if (this.fileExists('Gemfile.lock')) return 'bundler';
        if (this.fileExists('Cargo.lock')) return 'cargo';
        if (this.fileExists('go.sum')) return 'go modules';
        return null;
    }

    private async analyzeStructure(): Promise<ProjectInfo['structure']> {
        const directories = await this.listTopLevelDirectories();
        
        return {
            hasSrc: this.directoryExists('src'),
            hasLib: this.directoryExists('lib'),
            hasDocs: this.directoryExists('docs'),
            hasTests: this.directoryExists('test') || this.directoryExists('tests') || this.directoryExists('__tests__'),
            directories
        };
    }

    private detectEntryPoints(languages: string[]): string[] {
        const entryPoints: string[] = [];

        // TypeScript/JavaScript
        if (languages.includes('TypeScript') || languages.includes('JavaScript')) {
            const packageJson = this.readPackageJson();
            if (packageJson?.main) entryPoints.push(packageJson.main);
            if (packageJson?.module) entryPoints.push(packageJson.module);
            
            const commonEntries = ['src/index.ts', 'src/index.js', 'src/main.ts', 'src/main.js', 'index.ts', 'index.js'];
            for (const entry of commonEntries) {
                if (this.fileExists(entry)) {
                    entryPoints.push(entry);
                    break;
                }
            }
        }

        // Python
        if (languages.includes('Python')) {
            const pythonEntries = ['main.py', 'app.py', 'src/main.py', '__main__.py'];
            for (const entry of pythonEntries) {
                if (this.fileExists(entry)) {
                    entryPoints.push(entry);
                    break;
                }
            }
        }

        return [...new Set(entryPoints)];
    }

    // Helper methods
    private fileExists(relativePath: string): boolean {
        return fs.existsSync(path.join(this.workspaceRoot, relativePath));
    }

    private directoryExists(relativePath: string): boolean {
        const fullPath = path.join(this.workspaceRoot, relativePath);
        return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
    }

    private readFile(relativePath: string): string | null {
        try {
            return fs.readFileSync(path.join(this.workspaceRoot, relativePath), 'utf-8');
        } catch {
            return null;
        }
    }

    private readPackageJson(): any | null {
        const content = this.readFile('package.json');
        if (content) {
            try {
                return JSON.parse(content);
            } catch {
                return null;
            }
        }
        return null;
    }

    private async hasFilesWithExtension(ext: string): Promise<boolean> {
        try {
            const files = await vscode.workspace.findFiles(`**/*${ext}`, '**/node_modules/**', 1);
            return files.length > 0;
        } catch {
            return false;
        }
    }

    private async listTopLevelDirectories(): Promise<string[]> {
        try {
            const entries = fs.readdirSync(this.workspaceRoot, { withFileTypes: true });
            return entries
                .filter(entry => entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules')
                .map(entry => entry.name);
        } catch {
            return [];
        }
    }
}
