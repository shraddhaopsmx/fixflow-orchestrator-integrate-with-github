import { CodeFinding } from '@/types/code';

export const codeTestCases: CodeFinding[] = [
  {
    findingId: 'CODE-JS-001',
    filePath: 'src/views/UserView.js',
    language: 'JavaScript',
    vulnerability: {
      id: 'CWE-79',
      name: "Improper Neutralization of Input During Web Page Generation ('Cross-site Scripting')",
      severity: 'High',
    },
    snippet: "const userContent = urlParams.get('content');\ndocument.getElementById('content').innerHTML = userContent;",
    startLine: 42,
    endLine: 43,
  },
  {
    findingId: 'CODE-PY-001',
    filePath: 'api/db.py',
    language: 'Python',
    vulnerability: {
      id: 'CWE-89',
      name: "Improper Neutralization of Special Elements used in an SQL Command ('SQL Injection')",
      severity: 'Critical',
    },
    snippet: "user_id = request.args.get('id')\ncursor.execute(f\"SELECT * FROM users WHERE id = {user_id}\")",
    startLine: 101,
    endLine: 102,
  },
  {
    findingId: 'CODE-PY-002',
    filePath: 'api/requirements.txt',
    language: 'Python',
    vulnerability: {
      id: 'SNYK-PY-REQUESTS-595221',
      name: 'Remote Code Execution in "requests" library',
      severity: 'Critical',
    },
    snippet: 'requests==2.22.0',
    startLine: 15,
    endLine: 15,
  }
];
