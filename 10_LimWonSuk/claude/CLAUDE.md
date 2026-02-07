
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

##  Language and Token Efficiency Policy
- Always respond in **Korean** for explanations, code reviews, and summaries.
- Use **English** for all internal thought processes, terminal commands, and technical identifiers to maximize token efficiency.
- Keep explanations concise and technical to minimize output tokens while maintaining clarity.
- If I provide prompts in Korean, treat them as high-priority instructions, but continue to respond in Korean.

## Project Overview

This is a **Git/Markdown learning repository** for a SW Camp class. It contains educational documentation written in Korean — no application source code, build tools, tests, or CI/CD.

## Repository Structure

- `10_LimWonSuk/` — Student folder containing all learning materials (Git commands reference, Markdown syntax guides, terminology notes, and diagrams)
- `README.md` — Minimal project description

## Branches

- `main` — Primary branch
- `classReview` — Class review branch (current working branch)

## Key Context

- Content is written in Korean
- IDE: IntelliJ IDEA (`.idea/` config present)
- All documentation files are Markdown (`.md`)
- The repository demonstrates GitHub workflow basics: branching, pull requests, merging

---

## Essential Keyboard Shortcuts
- Tab: Auto-complete file paths (The most used key).
  ->  파일 경로 자동 완성 (가장 많이 씀)


- Ctrl + C: Immediately stop Claude if it's rambling or performing the wrong task.
-> Claude가 너무 길게 대답하거나 뻘짓(?)할 때 즉시 중단


- Ctrl + L: Clear the terminal screen for a fresh start.
  ->  터미널 화면 깨끗하게 정리


- ↑ / ↓: Cycle through previous English prompts (Saves time and tokens).
  -> 이전에 썼던 영어 프롬프트 다시 불러오기 (토큰 아끼기용)


## Claude를 길들이는 "필수 영문 프롬프트"


- 언어 설정

  -> Respond in Korean, but use English for code and terminal commands. Keep it concise.
  -> 한국어로 답변하되, 코드는 영어로 유지하고 간결하게 답변해.


- 코드 분석
  -> Analyze the current project structure and explain the data flow between Entity and DTO.
  -> 한국어로 답변하되, 코드는 영어로 유지하고 간결하게 답변해.


- 버그 수정


-> I got an error: [에러복사]. Debug this and suggest a fix. Explain why it happened in Korean.

-> 에러가 났어. 디버깅해서 해결책을 주고, 왜 발생했는지 한국어로 설명해.




- 코드 리뷰


-> Review the selected file for performance bottlenecks and clean code violations.

-> 선택한 파일에서 성능 저하 요소나 클린 코드 위반 사례를 찾아줘.


- 깃 작업


-> Stage all changes, write a conventional commit message, and commit them.

-> 변경사항을 스테이징하고, 규격에 맞는 커밋 메시지를 써서 커밋해 줘.



- 변경사항 커밋 및 푸시 (한 번에 하기)


-> Stage all changes, commit them with a message "Initial commit", and push to the main branch.

-> 모든 변경사항을 스테이징하고, 커밋 메시지를 작성한 뒤 메인 브랜치로 푸시(업로드)합니다.
