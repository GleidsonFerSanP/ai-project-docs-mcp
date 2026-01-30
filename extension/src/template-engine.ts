import { ProjectInfo } from './project-analyzer';

/**
 * Generated file content with metadata
 */
export interface GeneratedFile {
    relativePath: string;
    content: string;
    description: string;
}

/**
 * Context for LLM-based customization
 */
export interface LLMContext {
    projectInfo: ProjectInfo;
    template: string;
    purpose: string;
}

/**
 * Template engine for generating progressive context files
 * Produces base templates that can be customized by LLM
 */
export class TemplateEngine {
    private projectInfo: ProjectInfo;

    constructor(projectInfo: ProjectInfo) {
        this.projectInfo = projectInfo;
    }

    /**
     * Generate all files for progressive context setup
     */
    generateAllFiles(): GeneratedFile[] {
        return [
            this.generateAgentsMd(),
            this.generateSkillMd(),
            this.generateCopilotInstructions(),
            ...this.generateSkillReferences()
        ];
    }

    /**
     * Get contexts for LLM customization
     */
    getLLMContexts(): LLMContext[] {
        return [
            {
                projectInfo: this.projectInfo,
                template: this.generateAgentsMd().content,
                purpose: 'Customize AGENTS.md with project-specific conventions, architecture patterns, and development workflows'
            },
            {
                projectInfo: this.projectInfo,
                template: this.generateSkillMd().content,
                purpose: 'Customize SKILL.md with project-specific use cases and workflow examples'
            }
        ];
    }

    private generateAgentsMd(): GeneratedFile {
        const { name, languages, frameworks, buildTools, packageManager, testFrameworks, hasCICD, cicdPlatform, structure } = this.projectInfo;
        
        const techStack = this.formatTechStack();
        const buildSection = this.formatBuildSection();
        const testSection = this.formatTestSection();
        const structureSection = this.formatStructureSection();

        const content = `# AGENTS.md

> Instructions for AI coding agents working on this repository.

## Project Overview

**${name}** - [Brief project description - customize this]

**Tech Stack:**
${techStack}

## Dev Environment

\`\`\`bash
# Install dependencies
${this.getInstallCommand()}

# Build the project
${this.getBuildCommand()}

# Run the project
${this.getRunCommand()}
\`\`\`

## Testing

${testSection}

## Code Conventions

### File Structure

\`\`\`
${structureSection}
\`\`\`

### Naming Conventions

${this.getNamingConventions()}

## Architecture

[Describe the architecture - customize this section]

${buildSection}

## Common Tasks

### Adding a New Feature

1. [Describe the process]
2. Create files in appropriate directory
3. Add tests
4. Update documentation

### Running Tests

${this.getTestRunCommand()}

## Files to Avoid Modifying

${this.getFilesToAvoid()}

## CI/CD

${hasCICD ? `This project uses **${cicdPlatform}** for CI/CD.\n\n[Describe the CI/CD workflow]` : 'No CI/CD configured yet.'}

## Troubleshooting

**Build fails:**
\`\`\`bash
${this.getTroubleshootingCommands()}
\`\`\`

---

*Last updated: ${new Date().toISOString().split('T')[0]}*
`;

        return {
            relativePath: 'AGENTS.md',
            content,
            description: 'Instructions for AI coding agents'
        };
    }

    private generateSkillMd(): GeneratedFile {
        const { name, languages, frameworks } = this.projectInfo;

        const content = `# ${name} - AI Agent Skills

> Progressive context system for AI agents working on this project.

## Quick Reference

| Skill | When to Use | Reference |
|-------|-------------|-----------|
| Development | Writing new code | [DEV-WORKFLOW.md](DEV-WORKFLOW.md) |
| Testing | Adding/fixing tests | [TEST-WORKFLOW.md](TEST-WORKFLOW.md) |
| Architecture | Design decisions | [ARCHITECTURE.md](ARCHITECTURE.md) |

## Core Workflows

### 1. Feature Development

\`\`\`
1. Check existing patterns in codebase
2. Follow naming conventions from AGENTS.md
3. Write tests for new functionality
4. Update documentation if needed
\`\`\`

### 2. Bug Fixing

\`\`\`
1. Reproduce the issue
2. Write a failing test
3. Fix the code
4. Verify all tests pass
\`\`\`

### 3. Code Review

\`\`\`
1. Check code follows project conventions
2. Verify tests are adequate
3. Ensure documentation is updated
\`\`\`

## Context Loading Strategy

### Minimal Context (Default)
- Load AGENTS.md for basic conventions
- Load relevant skill reference when needed

### Full Context (Complex Tasks)
- Load all skill references
- Review architecture documentation
- Check related contracts/interfaces

## Project-Specific Notes

### ${languages.join(', ')} Best Practices
- [Add language-specific conventions]

${frameworks.length > 0 ? `### ${frameworks.join(', ')} Patterns\n- [Add framework-specific patterns]` : ''}

## When to Escalate

- Architecture changes → Review with team
- Security concerns → Flag immediately
- Performance issues → Profile before optimizing

---

*Progressive disclosure: Load additional context only when needed.*
`;

        return {
            relativePath: 'docs/skills/SKILL.md',
            content,
            description: 'Main skill file with progressive context references'
        };
    }

    private generateCopilotInstructions(): GeneratedFile {
        const { name, languages, frameworks } = this.projectInfo;
        
        const content = `---
applyTo: "**"
---

# ${name} - Copilot Instructions

## Quick Start

1. Read \`AGENTS.md\` for project conventions
2. Check \`docs/skills/SKILL.md\` for workflows
3. Follow existing patterns in codebase

## Core Rules

${this.getCoreRules()}

## File Patterns

${this.getFilePatterns()}

## Testing Requirements

${this.getTestRequirements()}

---

*Keep instructions concise. Use references for details.*
`;

        return {
            relativePath: '.github/copilot-instructions.md',
            content,
            description: 'GitHub Copilot custom instructions'
        };
    }

    private generateSkillReferences(): GeneratedFile[] {
        const files: GeneratedFile[] = [];

        // Development workflow
        files.push({
            relativePath: 'docs/skills/DEV-WORKFLOW.md',
            content: this.generateDevWorkflow(),
            description: 'Development workflow reference'
        });

        // Test workflow
        if (this.projectInfo.hasTests || this.projectInfo.testFrameworks.length > 0) {
            files.push({
                relativePath: 'docs/skills/TEST-WORKFLOW.md',
                content: this.generateTestWorkflow(),
                description: 'Testing workflow reference'
            });
        }

        // Architecture (if complex project)
        if (this.projectInfo.frameworks.length > 0 || this.projectInfo.structure.hasSrc) {
            files.push({
                relativePath: 'docs/skills/ARCHITECTURE.md',
                content: this.generateArchitectureDoc(),
                description: 'Architecture reference'
            });
        }

        return files;
    }

    private generateDevWorkflow(): string {
        const { languages, frameworks, packageManager } = this.projectInfo;

        return `# Development Workflow

## Setup

\`\`\`bash
${this.getInstallCommand()}
\`\`\`

## Creating New Files

### File Location Guidelines

${this.getFileLocationGuidelines()}

### File Templates

${this.getFileTemplates()}

## Code Style

${this.getCodeStyle()}

## Pre-commit Checklist

- [ ] Code follows project conventions
- [ ] Tests added/updated
- [ ] Documentation updated (if needed)
- [ ] No linting errors
- [ ] Build passes

---

*Reference: See AGENTS.md for full conventions.*
`;
    }

    private generateTestWorkflow(): string {
        const { testFrameworks } = this.projectInfo;

        return `# Testing Workflow

## Test Framework

${testFrameworks.length > 0 ? `This project uses: **${testFrameworks.join(', ')}**` : 'Configure your preferred test framework.'}

## Running Tests

\`\`\`bash
${this.getTestRunCommand()}
\`\`\`

## Writing Tests

### Test File Location

${this.getTestFileLocation()}

### Test Structure

\`\`\`${this.getTestLanguage()}
${this.getTestTemplate()}
\`\`\`

## Coverage

${this.getCoverageInfo()}

---

*Reference: See AGENTS.md for testing conventions.*
`;
    }

    private generateArchitectureDoc(): string {
        const { name, frameworks, structure } = this.projectInfo;

        return `# Architecture Reference

## Overview

${name} follows ${this.getArchitecturePattern()} architecture.

## Directory Structure

\`\`\`
${this.formatStructureSection()}
\`\`\`

## Key Components

${this.getKeyComponents()}

## Data Flow

[Describe how data flows through the application]

## Dependencies

${this.getDependencyInfo()}

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| [Decision 1] | [Why] |
| [Decision 2] | [Why] |

---

*Reference: See AGENTS.md for conventions.*
`;
    }

    // Helper methods for content generation
    private formatTechStack(): string {
        const lines: string[] = [];
        
        if (this.projectInfo.languages.length > 0) {
            lines.push(`* Languages: ${this.projectInfo.languages.join(', ')}`);
        }
        if (this.projectInfo.frameworks.length > 0) {
            lines.push(`* Frameworks: ${this.projectInfo.frameworks.join(', ')}`);
        }
        if (this.projectInfo.buildTools.length > 0) {
            lines.push(`* Build Tools: ${this.projectInfo.buildTools.join(', ')}`);
        }
        if (this.projectInfo.testFrameworks.length > 0) {
            lines.push(`* Testing: ${this.projectInfo.testFrameworks.join(', ')}`);
        }
        
        return lines.length > 0 ? lines.join('\n') : '* [Add tech stack]';
    }

    private formatBuildSection(): string {
        const { buildTools, packageManager } = this.projectInfo;
        
        if (buildTools.length === 0) {
            return '';
        }

        return `## Build System

This project uses ${buildTools.join(', ')} for building.

${packageManager ? `Package manager: **${packageManager}**` : ''}`;
    }

    private formatTestSection(): string {
        const { hasTests, testFrameworks } = this.projectInfo;

        if (!hasTests && testFrameworks.length === 0) {
            return '```bash\n# No test setup detected - configure testing\n```';
        }

        return `\`\`\`bash
# Run all tests
${this.getTestRunCommand()}

# Run specific test
${this.getSpecificTestCommand()}
\`\`\``;
    }

    private formatStructureSection(): string {
        const { structure, languages } = this.projectInfo;
        const lines: string[] = [];

        for (const dir of structure.directories.slice(0, 10)) {
            lines.push(`${dir}/`);
        }

        if (structure.directories.length > 10) {
            lines.push('...');
        }

        return lines.join('\n');
    }

    private getInstallCommand(): string {
        const { packageManager, languages } = this.projectInfo;
        
        switch (packageManager) {
            case 'npm': return 'npm install';
            case 'yarn': return 'yarn';
            case 'pnpm': return 'pnpm install';
            case 'bun': return 'bun install';
            case 'pipenv': return 'pipenv install';
            case 'poetry': return 'poetry install';
            case 'bundler': return 'bundle install';
            case 'cargo': return 'cargo build';
            case 'go modules': return 'go mod download';
            default:
                if (languages.includes('Python')) return 'pip install -r requirements.txt';
                if (languages.includes('Go')) return 'go mod download';
                return '# Add install command';
        }
    }

    private getBuildCommand(): string {
        const { buildTools, languages, packageManager } = this.projectInfo;
        
        if (buildTools.includes('tsc')) return 'npm run build';
        if (buildTools.includes('vite')) return 'npm run build';
        if (buildTools.includes('webpack')) return 'npm run build';
        if (buildTools.includes('cargo')) return 'cargo build --release';
        if (buildTools.includes('gradle')) return './gradlew build';
        if (buildTools.includes('maven')) return 'mvn package';
        if (buildTools.includes('make')) return 'make';
        
        if (languages.includes('TypeScript') || languages.includes('JavaScript')) {
            return 'npm run build';
        }
        if (languages.includes('Go')) return 'go build ./...';
        if (languages.includes('Python')) return '# Python: no build step needed';
        
        return '# Add build command';
    }

    private getRunCommand(): string {
        const { languages, frameworks, packageManager } = this.projectInfo;
        
        if (frameworks.includes('Next.js')) return 'npm run dev';
        if (frameworks.includes('NestJS')) return 'npm run start:dev';
        if (frameworks.includes('Express') || frameworks.includes('Fastify')) return 'npm run start';
        if (frameworks.includes('Django')) return 'python manage.py runserver';
        if (frameworks.includes('Flask')) return 'flask run';
        if (frameworks.includes('FastAPI')) return 'uvicorn main:app --reload';
        
        if (languages.includes('TypeScript') || languages.includes('JavaScript')) {
            return 'npm start';
        }
        if (languages.includes('Go')) return 'go run .';
        if (languages.includes('Python')) return 'python main.py';
        
        return '# Add run command';
    }

    private getTestRunCommand(): string {
        const { testFrameworks, packageManager, languages } = this.projectInfo;
        
        if (testFrameworks.includes('Jest')) return 'npm test';
        if (testFrameworks.includes('Vitest')) return 'npm test';
        if (testFrameworks.includes('Mocha')) return 'npm test';
        if (testFrameworks.includes('pytest')) return 'pytest';
        if (testFrameworks.includes('Playwright')) return 'npx playwright test';
        if (testFrameworks.includes('Cypress')) return 'npx cypress run';
        
        if (languages.includes('Go')) return 'go test ./...';
        if (languages.includes('Rust')) return 'cargo test';
        
        return 'npm test';
    }

    private getSpecificTestCommand(): string {
        const { testFrameworks, languages } = this.projectInfo;
        
        if (testFrameworks.includes('Jest')) return 'npm test -- --testPathPattern="<pattern>"';
        if (testFrameworks.includes('Vitest')) return 'npm test -- <file>';
        if (testFrameworks.includes('pytest')) return 'pytest <file>::<test>';
        if (languages.includes('Go')) return 'go test -run <TestName> ./...';
        
        return 'npm test -- <file>';
    }

    private getNamingConventions(): string {
        const { languages } = this.projectInfo;
        const conventions: string[] = [];

        if (languages.includes('TypeScript') || languages.includes('JavaScript')) {
            conventions.push('* Files: `kebab-case.ts`');
            conventions.push('* Classes: `PascalCase`');
            conventions.push('* Functions: `camelCase`');
            conventions.push('* Constants: `UPPER_SNAKE_CASE`');
        } else if (languages.includes('Python')) {
            conventions.push('* Files: `snake_case.py`');
            conventions.push('* Classes: `PascalCase`');
            conventions.push('* Functions: `snake_case`');
            conventions.push('* Constants: `UPPER_SNAKE_CASE`');
        } else if (languages.includes('Go')) {
            conventions.push('* Files: `snake_case.go`');
            conventions.push('* Exported: `PascalCase`');
            conventions.push('* Private: `camelCase`');
        } else {
            conventions.push('* [Add naming conventions]');
        }

        return conventions.join('\n');
    }

    private getFilesToAvoid(): string {
        const files: string[] = [];

        if (this.projectInfo.packageManager) {
            files.push(`* Lock files - Only via ${this.projectInfo.packageManager}`);
        }
        files.push('* Generated files in `dist/`, `build/`, `out/`');
        files.push('* IDE config unless project-wide');
        
        return files.join('\n');
    }

    private getTroubleshootingCommands(): string {
        const { packageManager, languages } = this.projectInfo;
        
        const commands: string[] = [];
        
        if (packageManager === 'npm' || packageManager === 'yarn' || packageManager === 'pnpm') {
            commands.push('rm -rf node_modules');
            commands.push(`${this.getInstallCommand()}`);
        } else if (languages.includes('Python')) {
            commands.push('pip install -r requirements.txt --upgrade');
        } else if (languages.includes('Go')) {
            commands.push('go clean -modcache');
            commands.push('go mod tidy');
        }
        
        return commands.join('\n');
    }

    private getCoreRules(): string {
        const { languages, frameworks } = this.projectInfo;
        const rules: string[] = [];

        rules.push('- Follow existing code patterns');
        rules.push('- Write tests for new features');
        rules.push('- Keep functions small and focused');

        if (languages.includes('TypeScript')) {
            rules.push('- Use strict TypeScript (no `any` unless necessary)');
        }
        if (frameworks.includes('React')) {
            rules.push('- Use functional components with hooks');
        }

        return rules.join('\n');
    }

    private getFilePatterns(): string {
        const { languages, structure } = this.projectInfo;
        const patterns: string[] = [];

        if (structure.hasSrc) {
            patterns.push('- Source code: `src/**/*`');
        }
        if (structure.hasTests) {
            patterns.push('- Tests: `test/**/*` or `__tests__/**/*`');
        }
        if (structure.hasDocs) {
            patterns.push('- Documentation: `docs/**/*`');
        }

        return patterns.length > 0 ? patterns.join('\n') : '- [Define file patterns]';
    }

    private getTestRequirements(): string {
        const { testFrameworks } = this.projectInfo;

        if (testFrameworks.length === 0) {
            return '- Add tests for new functionality';
        }

        return `- Use ${testFrameworks[0]} for testing
- Maintain test coverage
- Run tests before committing`;
    }

    private getFileLocationGuidelines(): string {
        const { structure, languages } = this.projectInfo;
        const guidelines: string[] = [];

        if (structure.hasSrc) {
            guidelines.push('- Source files go in `src/`');
        }
        if (structure.hasTests) {
            guidelines.push('- Test files go in `test/` or `__tests__/`');
        }
        if (structure.hasDocs) {
            guidelines.push('- Documentation goes in `docs/`');
        }

        return guidelines.length > 0 ? guidelines.join('\n') : '[Define file locations]';
    }

    private getFileTemplates(): string {
        const { languages } = this.projectInfo;

        if (languages.includes('TypeScript')) {
            return `\`\`\`typescript
// New module template
export interface IModuleName {
  // Define interface
}

export class ModuleName implements IModuleName {
  constructor() {
    // Initialize
  }
}
\`\`\``;
        }

        if (languages.includes('Python')) {
            return `\`\`\`python
# New module template
class ModuleName:
    """Description of the module."""
    
    def __init__(self):
        pass
\`\`\``;
        }

        return '[Add file templates]';
    }

    private getCodeStyle(): string {
        const { languages } = this.projectInfo;

        if (languages.includes('TypeScript') || languages.includes('JavaScript')) {
            return `- Use ESLint/Prettier for formatting
- Prefer \`const\` over \`let\`
- Use async/await over callbacks`;
        }

        if (languages.includes('Python')) {
            return `- Follow PEP 8
- Use type hints
- Prefer f-strings for formatting`;
        }

        return '[Define code style]';
    }

    private getTestFileLocation(): string {
        const { structure, testFrameworks } = this.projectInfo;

        if (testFrameworks.includes('Jest')) {
            return 'Place tests in `__tests__/` or alongside source as `*.test.ts`';
        }
        if (testFrameworks.includes('pytest')) {
            return 'Place tests in `tests/` directory';
        }
        if (structure.hasTests) {
            return 'Place tests in the `test/` or `tests/` directory';
        }

        return '[Define test file location]';
    }

    private getTestLanguage(): string {
        const { languages } = this.projectInfo;

        if (languages.includes('TypeScript')) return 'typescript';
        if (languages.includes('JavaScript')) return 'javascript';
        if (languages.includes('Python')) return 'python';
        if (languages.includes('Go')) return 'go';

        return '';
    }

    private getTestTemplate(): string {
        const { languages, testFrameworks } = this.projectInfo;

        if (testFrameworks.includes('Jest') || testFrameworks.includes('Vitest')) {
            return `describe('ModuleName', () => {
  it('should do something', () => {
    expect(result).toBe(expected);
  });
});`;
        }

        if (testFrameworks.includes('pytest') || languages.includes('Python')) {
            return `def test_something():
    result = function_to_test()
    assert result == expected`;
        }

        if (languages.includes('Go')) {
            return `func TestSomething(t *testing.T) {
    result := FunctionToTest()
    if result != expected {
        t.Errorf("got %v, want %v", result, expected)
    }
}`;
        }

        return '// Add test template';
    }

    private getCoverageInfo(): string {
        const { testFrameworks } = this.projectInfo;

        if (testFrameworks.includes('Jest')) {
            return '```bash\nnpm test -- --coverage\n```';
        }
        if (testFrameworks.includes('Vitest')) {
            return '```bash\nnpm run coverage\n```';
        }
        if (testFrameworks.includes('pytest')) {
            return '```bash\npytest --cov\n```';
        }

        return '[Configure coverage reporting]';
    }

    private getArchitecturePattern(): string {
        const { frameworks } = this.projectInfo;

        if (frameworks.includes('NestJS')) return 'modular/layered';
        if (frameworks.includes('Next.js')) return 'file-based routing';
        if (frameworks.includes('Django')) return 'MTV (Model-Template-View)';
        if (frameworks.includes('FastAPI')) return 'API-first';

        return '[specify]';
    }

    private getKeyComponents(): string {
        const { structure } = this.projectInfo;
        const components: string[] = [];

        for (const dir of structure.directories.slice(0, 5)) {
            components.push(`- **${dir}/**: [Describe purpose]`);
        }

        return components.length > 0 ? components.join('\n') : '[Define key components]';
    }

    private getDependencyInfo(): string {
        const { frameworks, buildTools } = this.projectInfo;
        const deps: string[] = [];

        for (const fw of frameworks) {
            deps.push(`- ${fw}`);
        }

        return deps.length > 0 ? deps.join('\n') : '[List key dependencies]';
    }
}
