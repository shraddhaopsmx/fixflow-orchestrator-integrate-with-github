
import { PipelineRule } from '@/types/pipeline';

export const githubActionsRules: PipelineRule[] = [
  {
    id: 'gh-missing-security-scan',
    name: 'Missing Security Scan Step',
    pipelineType: 'github-actions',
    riskLevel: 'High',
    pattern: /jobs:\s*[\s\S]*?(?!.*(?:security|scan|snyk|trivy|semgrep))/,
    fix: (config, match) => {
      const securityScanStep = `
    security-scan:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - name: Run security scan
          uses: securecodewarrior/github-action-add-sarif@v1
          with:
            sarif-file: 'security-scan-results.sarif'
        - name: Upload SARIF results
          uses: github/codeql-action/upload-sarif@v2
          with:
            sarif_file: security-scan-results.sarif`;

      const jobsMatch = config.match(/^jobs:/m);
      if (jobsMatch) {
        const insertIndex = jobsMatch.index! + jobsMatch[0].length;
        const updatedConfig = config.slice(0, insertIndex) + securityScanStep + config.slice(insertIndex);
        return {
          updatedConfig,
          patches: [{
            op: 'add',
            path: '/jobs/security-scan',
            value: {
              'runs-on': 'ubuntu-latest',
              steps: [
                { uses: 'actions/checkout@v4' },
                { name: 'Run security scan', uses: 'securecodewarrior/github-action-add-sarif@v1' }
              ]
            }
          }],
          explanation: 'Added security scanning job to detect vulnerabilities before deployment.',
          insertedSteps: ['security-scan']
        };
      }
      return {
        updatedConfig: config,
        patches: [],
        explanation: 'Could not locate jobs section to add security scan.'
      };
    }
  },
  {
    id: 'gh-skip-tests',
    name: 'Tests Skipped or Missing',
    pipelineType: 'github-actions',
    riskLevel: 'Critical',
    pattern: /run:\s*.*--skip[_-]?tests|run:\s*.*-DskipTests/g,
    fix: (config, match) => {
      const updatedConfig = config.replace(
        /run:\s*.*--skip[_-]?tests/g,
        'run: npm test # Removed --skip-tests flag'
      ).replace(
        /run:\s*.*-DskipTests/g,
        'run: mvn test # Removed -DskipTests flag'
      );
      
      return {
        updatedConfig,
        patches: [{
          op: 'replace',
          path: '/jobs/*/steps/*/run',
          value: 'npm test'
        }],
        explanation: 'Removed test skipping flags to ensure tests run before deployment.'
      };
    }
  },
  {
    id: 'gh-hardcoded-secrets',
    name: 'Hardcoded Secrets in Pipeline',
    pipelineType: 'github-actions',
    riskLevel: 'Critical',
    pattern: /(password|token|key|secret):\s*["\']?[a-zA-Z0-9_-]{8,}["\']?/gi,
    fix: (config, match) => {
      const secretName = match[1].toUpperCase();
      const updatedConfig = config.replace(match[0], `${match[1]}: \${{ secrets.${secretName} }}`);
      
      return {
        updatedConfig,
        patches: [{
          op: 'replace',
          path: `/env/${match[1]}`,
          value: `\${{ secrets.${secretName} }}`
        }],
        explanation: `Replaced hardcoded ${match[1]} with GitHub secrets reference. Please add ${secretName} to repository secrets.`
      };
    }
  }
];

export const jenkinsRules: PipelineRule[] = [
  {
    id: 'jenkins-missing-approval',
    name: 'Missing Manual Approval for Production',
    pipelineType: 'jenkins',
    riskLevel: 'High',
    pattern: /stage\s*\(\s*["\'].*(?:prod|production).*["\']\s*\)\s*{(?!.*input)/gi,
    fix: (config, match) => {
      const inputStep = `
            input {
                message "Deploy to production?"
                ok "Deploy"
                parameters {
                    choice(name: 'DEPLOY_ENV', choices: ['production'], description: 'Target environment')
                }
            }`;
      
      const stageContent = match[0];
      const braceIndex = stageContent.lastIndexOf('{');
      const updatedStage = stageContent.slice(0, braceIndex + 1) + inputStep + stageContent.slice(braceIndex + 1);
      const updatedConfig = config.replace(match[0], updatedStage);
      
      return {
        updatedConfig,
        patches: [{
          op: 'add',
          path: '/pipeline/stages/production/input',
          value: { message: 'Deploy to production?' }
        }],
        explanation: 'Added manual approval step for production deployments to prevent unauthorized releases.'
      };
    }
  },
  {
    id: 'jenkins-missing-clean-workspace',
    name: 'Missing Workspace Cleanup',
    pipelineType: 'jenkins',
    riskLevel: 'Medium',
    pattern: /pipeline\s*{(?!.*cleanWs)/gi,
    fix: (config, match) => {
      const cleanupPost = `
        post {
            always {
                cleanWs()
            }
        }`;
      
      const pipelineEnd = config.lastIndexOf('}');
      const updatedConfig = config.slice(0, pipelineEnd) + cleanupPost + '\n' + config.slice(pipelineEnd);
      
      return {
        updatedConfig,
        patches: [{
          op: 'add',
          path: '/pipeline/post/always',
          value: ['cleanWs()']
        }],
        explanation: 'Added workspace cleanup to prevent information leakage between builds.'
      };
    }
  }
];

export const allPipelineRules = [...githubActionsRules, ...jenkinsRules];
