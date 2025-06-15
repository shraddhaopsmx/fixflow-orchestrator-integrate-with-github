
import { CodeFinding, CodeRemediation } from '@/types/code';

// This is a mock of a more complex service that would call an LLM.
class CodeRemediationService {
  async generateFix(finding: CodeFinding): Promise<CodeRemediation> {
    // Simulate API call latency
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (finding.findingId === 'CODE-JS-001') {
      return this.getJsXssFix(finding);
    }

    if (finding.findingId === 'CODE-PY-001') {
      return this.getPythonSqlInjectionFix(finding);
    }

    return {
      success: false,
      explanation: 'No remediation available for this finding.',
      suggestedPatch: '',
      githubPr: null,
      error: 'Rule not found',
    };
  }

  private getJsXssFix(finding: CodeFinding): CodeRemediation {
    const patch = `
- document.getElementById('content').innerHTML = userContent;
+ const contentDiv = document.getElementById('content');
+ if (contentDiv) {
+   contentDiv.textContent = userContent;
+ }
    `;
    const explanation = 'The vulnerability is a classic Cross-Site Scripting (XSS) issue. The original code uses `innerHTML` to set content from a URL parameter, which is unsafe as it can execute embedded scripts. \n\nThe fix replaces `innerHTML` with `textContent`. This ensures that the input is treated as plain text and not parsed as HTML, mitigating the XSS risk. An additional check for the existence of the element is added for robustness.';
    const prBody = `### Fix for Vulnerability: ${finding.vulnerability.id}

**Vulnerability:** ${finding.vulnerability.name}
**Severity:** ${finding.vulnerability.severity}
**File:** \`${finding.filePath}\`

**Description:**
This PR fixes a Cross-Site Scripting (XSS) vulnerability. The code was using \`innerHTML\` to render user-provided content, which is a security risk.

**Changes:**
- Replaced \`innerHTML\` with \`textContent\` to prevent arbitrary script execution.
- Added a null check for the target DOM element.

This is an automated remediation. Please review carefully before merging.
    `;
    return {
      success: true,
      explanation,
      suggestedPatch: patch,
      githubPr: {
        url: 'https://github.com/your-org/your-repo/pull/123',
        title: `fix(security): Remediate XSS in ${finding.filePath}`,
        body: prBody,
        labels: [`severity:${finding.vulnerability.severity}`, 'fix-type:xss', 'automated-remediation'],
      },
    };
  }
  
  private getPythonSqlInjectionFix(finding: CodeFinding): CodeRemediation {
    const patch = `
- cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")
+ sql_query = "SELECT * FROM users WHERE id = %s"
+ cursor.execute(sql_query, (user_id,))
    `;
    const explanation = 'This code is vulnerable to SQL Injection. It uses an f-string to insert a user-provided ID directly into an SQL query. An attacker could manipulate the `id` parameter to execute arbitrary SQL commands.\n\nThe fix is to use a parameterized query. The SQL query string uses a placeholder (\`%s\`), and the database driver safely handles escaping of the \`user_id\` variable. This is the standard practice to prevent SQL injection.';
    const prBody = `### Fix for Vulnerability: ${finding.vulnerability.id}

**Vulnerability:** ${finding.vulnerability.name}
**Severity:** ${finding.vulnerability.severity}
**File:** \`${finding.filePath}\`

**Description:**
This PR remediates a critical SQL Injection vulnerability. User input was being formatted directly into the SQL query.

**Changes:**
- The query has been changed to use parameterization, which is the standard defense against SQL injection.

This is an automated remediation. Please review carefully before merging.
    `;

    return {
      success: true,
      explanation,
      suggestedPatch: patch,
      githubPr: {
        url: 'https://github.com/your-org/your-repo/pull/124',
        title: `fix(security): Remediate SQL Injection in ${finding.filePath}`,
        body: prBody,
        labels: [`severity:${finding.vulnerability.severity}`, 'fix-type:sql-injection', 'automated-remediation'],
      },
    };
  }
}

export const codeRemediationService = new CodeRemediationService();
