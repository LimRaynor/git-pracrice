# git 명령어

## git 상태확인 명령어

-git init == initialize (초기화)
현재 디렉토리Git저장소로 초기화 -> 여기서 git 저장소로 보네겠다

- git log 
 commit 내역 확인 

- git diff
변경 내용 비교

- git status
작업 디렉토리 상태확인


---

## git 액션 명령어


- git add
로컬 변경사항 -> 스테이지

- git add . == git add all
로컬 변경사항 -> 스테이지 (변경사항 전부다)

- git push 
로컬 변경사항 -> 원격

- git pull
원격 변경사항 -> 로컬 병합

- git branch
    브렌치 생성, 삭제, 확인

- git checkout
    브렌치 전환

- git merge
  현재브렌치에 병합

- git clone
  원격 저장소 복제 -> 로컬

- git remote add origin
    권격 저장소 추가
---

- git reset
  커밋 되돌리기
- 
  git show 커밋ID
- 특정 커밋 상세 확인 -> 해당 커밋에서 정확히 뭐가 바뀌었는지 볼 때

- git reflog 
모든 기록 확인 (안전장치) -> reset으로 지워버린 커밋까지 포함해 모든 HEAD 이동 기록 확인 (복구할 때 필수)
