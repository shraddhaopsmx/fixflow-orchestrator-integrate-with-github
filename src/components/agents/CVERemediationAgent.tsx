import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, Send, RotateCcw, CheckCircle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

interface ChatMessage {
  id: string;
  type: 'system' | 'user';
  content: string;
  timestamp: Date;
}

const CVERemediationAgent = () => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: userInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const systemMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: generateCVEResponse(userInput),
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, systemMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const generateCVEResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('cve-') || lowerInput.includes('vulnerability')) {
      return `## CVE Analysis Complete

I've analyzed the vulnerability you mentioned. Here's my assessment:

**Severity**: High
**CVSS Score**: 8.1

**Remediation Steps**:
1. **Update affected packages** immediately
2. **Apply security patches** from the vendor
3. **Scan for exploitation** indicators
4. **Monitor system logs** for suspicious activity

**Recommended Actions**:
\`\`\`bash
# Update package manager
sudo apt update && sudo apt upgrade

# Check for specific CVE patches
apt list --upgradable | grep security
\`\`\`

Would you like me to provide more specific guidance for this CVE?`;
    }
    
    if (lowerInput.includes('scan') || lowerInput.includes('check')) {
      return `## Vulnerability Scan Results

I've initiated a comprehensive vulnerability scan:

**Found Issues**:
- 3 Critical vulnerabilities
- 7 High-priority issues  
- 12 Medium-risk findings

**Immediate Actions Required**:
1. **CVE-2024-1234**: Update OpenSSL library
2. **CVE-2024-5678**: Patch kernel vulnerability
3. **CVE-2024-9012**: Update web server components

**Next Steps**:
- Review detailed findings
- Prioritize critical patches
- Schedule maintenance window

Would you like me to help prioritize these vulnerabilities?`;
    }

    if (lowerInput.includes('patch') || lowerInput.includes('fix')) {
      return `## Patch Management Guidance

Based on your request, here's the patching strategy:

**Immediate Patches** (Critical):
\`\`\`bash
# Security patches for critical vulnerabilities
sudo apt install security-updates
sudo yum update --security
\`\`\`

**Scheduled Patches** (High/Medium):
- Plan maintenance window for non-critical updates
- Test patches in staging environment first
- Create rollback plan

**Verification Steps**:
1. Confirm patch installation
2. Restart affected services
3. Verify system functionality
4. Update vulnerability database

Need help with specific patch deployment?`;
    }

    return `## CVE Assistant Ready

I'm here to help with CVE (Common Vulnerabilities and Exposures) analysis and remediation.

**I can assist with**:
- Vulnerability scanning and assessment
- CVE impact analysis
- Patch management strategies
- Security remediation planning
- Compliance reporting

**Sample queries**:
- "Analyze CVE-2024-1234"
- "Scan my system for vulnerabilities"
- "Help me patch critical security issues"
- "Check for zero-day exploits"

How can I help secure your systems today?`;
  };

  const startNewChat = () => {
    setChatMessages([]);
    setUserInput('');
    toast({
      title: "New Chat Started",
      description: "Ready for new vulnerability analysis",
    });
  };

  const markResolved = () => {
    toast({
      title: "Issue Resolved",
      description: "CVE issue marked as resolved",
    });
    startNewChat();
  };

  const renderMessage = (message: ChatMessage) => {
    const isSystem = message.type === 'system';
    
    return (
      <div key={message.id} className={`flex gap-3 mb-6 ${isSystem ? 'justify-start' : 'justify-end'}`}>
        {isSystem && (
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={`max-w-[80%] ${isSystem ? '' : 'order-first'}`}>
          <div className={`rounded-lg p-4 ${
            isSystem 
              ? 'bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700' 
              : 'bg-blue-500 text-white ml-auto dark:bg-blue-600'
          }`}>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {message.content.split('\n').map((line, index) => {
                if (line.startsWith('##')) {
                  return (
                    <h3 key={index} className="text-lg font-semibold mt-0 mb-3 text-gray-900 dark:text-gray-100">
                      {line.replace('##', '').trim()}
                    </h3>
                  );
                }
                if (line.startsWith('**') && line.endsWith('**')) {
                  return (
                    <p key={index} className="font-semibold mb-2 text-gray-800 dark:text-gray-200">
                      {line.replace(/\*\*/g, '')}
                    </p>
                  );
                }
                if (line.startsWith('```')) {
                  const isClosing = index > 0 && message.content.split('\n')[index-1]?.startsWith('```');
                  if (isClosing) return null;
                  
                  const codeLines = [];
                  let nextIndex = index + 1;
                  while (nextIndex < message.content.split('\n').length && 
                         !message.content.split('\n')[nextIndex].startsWith('```')) {
                    codeLines.push(message.content.split('\n')[nextIndex]);
                    nextIndex++;
                  }
                  
                  return (
                    <pre key={index} className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm overflow-x-auto border">
                      <code className="text-gray-800 dark:text-gray-200">
                        {codeLines.join('\n')}
                      </code>
                    </pre>
                  );
                }
                if (line.trim()) {
                  return (
                    <p key={index} className="mb-2 last:mb-0 text-gray-700 dark:text-gray-300">
                      {line}
                    </p>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>

        {!isSystem && (
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">CVE Remediation Agent</CardTitle>
            <p className="text-muted-foreground mt-1">
              AI-powered vulnerability analysis and remediation assistance
            </p>
          </div>
          <Button variant="outline" onClick={startNewChat} className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Start New Chat
          </Button>
        </CardHeader>
        <CardContent>
          {/* Chat Interface */}
          <div className="h-[600px] flex flex-col">
            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background rounded-lg border">
              {chatMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>CVE Agent ready to help with vulnerability analysis...</p>
                    <p className="text-sm mt-2">Try asking: "Scan for vulnerabilities" or "Analyze CVE-2024-1234"</p>
                  </div>
                </div>
              ) : (
                <>
                  {chatMessages.map(renderMessage)}
                  
                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="flex gap-3 mb-6 justify-start">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                          <span className="text-sm text-muted-foreground">CVE Agent is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Resolved CTA */}
                  {chatMessages.length > 0 && !isLoading && (
                    <div className="flex justify-center pt-4 border-t">
                      <Button variant="outline" onClick={markResolved} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Resolved? Start a new chat
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* User Input Area - Fixed at bottom */}
            <div className="border-t pt-4 bg-background">
              <div className="flex gap-2">
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Ask about CVEs, vulnerabilities, or security issues..."
                  onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!userInput.trim() || isLoading}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CVERemediationAgent;