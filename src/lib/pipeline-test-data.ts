
import { PipelineTest } from '@/types/pipeline';

export const githubActionsTestCases: PipelineTest[] = [
  {
    name: 'Missing Security Scan in GitHub Actions',
    input: {
      filePath: '.github/workflows/ci.yml',
      pipelineType: 'github-actions',
      config: `
name: CI Pipeline
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build`,
      metadata: {
        repository: 'example/repo',
        branch: 'main',
        framework: 'nodejs'
      }
    },
    expectedOutput: {
      success: true,
      appliedRules: ['gh-missing-security-scan'],
      insertedSteps: ['security-scan']
    }
  },
  {
    name: 'Skipped Tests in GitHub Actions',
    input: {
      filePath: '.github/workflows/deploy.yml',
      pipelineType: 'github-actions',
      config: `
name: Deploy
on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: npm run build --skip-tests
      - run: npm run deploy`,
      metadata: {
        repository: 'example/app'
      }
    },
    expectedOutput: {
      success: true,
      appliedRules: ['gh-skip-tests']
    }
  },
  {
    name: 'Hardcoded Secrets in GitHub Actions',
    input: {
      filePath: '.github/workflows/deploy.yml',
      pipelineType: 'github-actions',
      config: `
name: Deploy
on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      API_TOKEN: abc123def456ghi789
      DATABASE_PASSWORD: mySecretPassword123
    steps:
      - uses: actions/checkout@v4
      - run: deploy-app`,
      metadata: {
        repository: 'example/secure-app'
      }
    },
    expectedOutput: {
      success: true,
      appliedRules: ['gh-hardcoded-secrets']
    }
  }
];

export const jenkinsTestCases: PipelineTest[] = [
  {
    name: 'Missing Production Approval in Jenkins',
    input: {
      filePath: 'Jenkinsfile',
      pipelineType: 'jenkins',
      config: `
pipeline {
    agent any
    
    stages {
        stage('Build') {
            steps {
                sh 'mvn clean compile'
            }
        }
        
        stage('Deploy to Production') {
            steps {
                sh 'kubectl apply -f production/'
            }
        }
    }
}`,
      metadata: {
        repository: 'example/java-app'
      }
    },
    expectedOutput: {
      success: true,
      appliedRules: ['jenkins-missing-approval']
    }
  },
  {
    name: 'Missing Workspace Cleanup in Jenkins',
    input: {
      filePath: 'Jenkinsfile',
      pipelineType: 'jenkins',
      config: `
pipeline {
    agent any
    
    stages {
        stage('Build') {
            steps {
                sh 'make build'
            }
        }
    }
}`,
      metadata: {
        repository: 'example/c-app'
      }
    },
    expectedOutput: {
      success: true,
      appliedRules: ['jenkins-missing-clean-workspace']
    }
  }
];

export const allPipelineTestCases = [...githubActionsTestCases, ...jenkinsTestCases];
