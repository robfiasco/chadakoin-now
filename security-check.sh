#!/bin/bash

echo "Running security checks..."

if command -v gitleaks >/dev/null 2>&1; then
  echo "Checking secrets with gitleaks"
  gitleaks detect --source .
fi

echo "Checking dependencies"
npm audit --audit-level=high

if command -v semgrep >/dev/null 2>&1; then
  echo "Running semgrep"
  semgrep --config=auto
fi

echo "Security checks complete"
