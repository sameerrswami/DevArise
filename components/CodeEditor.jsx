'use client';

/**
 * CODE EDITOR COMPONENT
 * 
 * Syntax-highlighted code editor for battle submissions
 * Features:
 * - Multi-language support (JS, Python, Java, C++)
 * - Syntax highlighting
 * - Line numbers
 * - Auto-save to localStorage
 * - Submission tracking
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import { AlertCircle, Copy, RotateCcw } from 'lucide-react';

const LANGUAGE_TEMPLATES = {
  javascript: `// Solution template
function solve(input) {
  // Write your solution here
  
  return result;
}

// Test with sample input
const input = \`sample input\`;
console.log(solve(input));`,

  python: `# Solution template
def solve(input_data):
    # Write your solution here
    
    return result

# Test with sample input
if __name__ == "__main__":
    input_data = "sample input"
    print(solve(input_data))`,

  java: `// Solution template
public class Solution {
    public static void main(String[] args) {
        // Write your solution here
        
        System.out.println(result);
    }
}`,

  cpp: `#include <iostream>
using namespace std;

int main() {
    // Write your solution here
    
    cout << result << endl;
    return 0;
}`,
};

const LANGUAGE_NAMES = {
  javascript: 'JavaScript',
  python: 'Python',
  java: 'Java',
  cpp: 'C++',
};

export default function CodeEditor({
  problem = null,
  onSubmit = () => {},
  isSubmitting = false,
  disabled = false,
}) {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(LANGUAGE_TEMPLATES.javascript);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [lastSubmissionTime, setLastSubmissionTime] = useState(null);
  const editorRef = useRef(null);

  /**
   * Load code from localStorage
   */
  useEffect(() => {
    if (!problem?.id) return;

    const savedCode = localStorage.getItem(`battle-code-${problem.id}-${language}`);
    if (savedCode) {
      setCode(savedCode);
    } else {
      setCode(LANGUAGE_TEMPLATES[language] || LANGUAGE_TEMPLATES.javascript);
    }
  }, [problem?.id, language]);

  /**
   * Save code to localStorage on change
   */
  useEffect(() => {
    if (!problem?.id) return;

    localStorage.setItem(`battle-code-${problem.id}-${language}`, code);
  }, [code, problem?.id, language]);

  /**
   * Handle language change
   */
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
  };

  /**
   * Handle code submission
   */
  const handleSubmit = async () => {
    if (!code.trim()) {
      alert('Please write some code before submitting');
      return;
    }

    setSubmissionCount((prev) => prev + 1);
    setLastSubmissionTime(new Date());

    await onSubmit(code, language);
  };

  /**
   * Handle reset code
   */
  const handleReset = () => {
    if (confirm('Are you sure you want to reset your code?')) {
      setCode(LANGUAGE_TEMPLATES[language] || LANGUAGE_TEMPLATES.javascript);
      localStorage.removeItem(`battle-code-${problem?.id}-${language}`);
    }
  };

  /**
   * Handle copy code
   */
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    alert('Code copied to clipboard!');
  };

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <Select value={language} onValueChange={handleLanguageChange} disabled={disabled}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="cpp">C++</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={disabled}
              title="Copy code to clipboard"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={disabled}
              title="Reset code to template"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Submission Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Submissions</p>
          <p className="text-2xl font-bold">{submissionCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Last Submission</p>
          <p className="text-sm font-semibold">
            {lastSubmissionTime
              ? lastSubmissionTime.toLocaleTimeString()
              : 'Not submitted yet'}
          </p>
        </Card>
      </div>

      {/* Code Editor */}
      <Card className="p-4 bg-[#1e1e1e]">
        <div
          ref={editorRef}
          className="font-mono text-sm leading-6 overflow-hidden rounded"
        >
          {/* Line Numbers and Editor */}
          <div className="flex">
            {/* Line Numbers */}
            <div className="bg-[#252526] text-[#858585] p-4 select-none overflow-hidden">
              {code.split('\n').map((_, i) => (
                <div key={i} className="text-right pr-4">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code Input */}
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={disabled}
              className="flex-1 bg-[#1e1e1e] text-[#d4d4d4] p-4 outline-none resize-none font-mono text-sm leading-6"
              style={{
                minHeight: '500px',
                tabs: '4',
              }}
              spellCheck="false"
            />
          </div>
        </div>

        {/* Editor Info */}
        <div className="mt-2 text-xs text-gray-500 flex justify-between">
          <span>Tip: Use Tab for indentation, Ctrl+A to select all</span>
          <span>{code.length} characters</span>
        </div>
      </Card>

      {/* Sample Input/Output */}
      {problem?.examples && problem.examples.length > 0 && (
        <Card className="p-4 bg-gray-50">
          <h3 className="font-semibold mb-3">Sample Test Cases</h3>
          <div className="space-y-3 max-h-40 overflow-y-auto">
            {problem.examples.map((example, idx) => (
              <div key={idx} className="bg-white p-3 rounded border border-gray-200">
                <p className="text-sm font-mono">
                  <strong>Input:</strong> {example.input || 'N/A'}
                </p>
                <p className="text-sm font-mono">
                  <strong>Output:</strong> {example.output || 'N/A'}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Submission Button */}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || disabled || !code.trim()}
        size="lg"
        className="w-full text-lg h-12"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Submitting...
          </>
        ) : disabled ? (
          'Battle not started'
        ) : (
          'Submit Code'
        )}
      </Button>

      {/* Info Alert */}
      {disabled && (
        <Alert variant="outline" className="flex gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Battle not started yet</p>
            <p className="text-sm">Wait for battle to start or join an existing battle to begin coding.</p>
          </div>
        </Alert>
      )}
    </div>
  );
}
