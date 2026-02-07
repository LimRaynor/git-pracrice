# 1. 마크다운이란?

```jsx
Markdown은 텍스트 기반의 마크업언어로 2004년 초 존그루버에 의해 만들어졌으며 쉽게 읽을 수
있으며 HTML로 변환이 가능하다. 특수기호와 문자를 이용한 매우 간단한 구조의 문법을 사용하여
웹에서도 보다 빠르게 컨텐츠를 작성하고 보다 직관적으로 인식할 수 있다.

마크다운이 최근 각광받기 시작한 이유는 github덕분이다. github의 repository에 관한 정보를
기록하는 README.md는 github를 사용하는 사람이라면 누구나 가장 먼저 접하게 되는 마크다운 
문서였다.
```

---

## ***1. 헤더(Header)***

<aside>
💡

`#`기호를 사용하여 제목을 작성합니다. `#`의 개수에 따라 제목의 크기가 달라집니다.

</aside>

**결과:**

# H1 (가장 큰 제목)

## H2 (두 번째로 큰 제목)

### H3

### H4

### H5

### H6 (가장 작은 제목)

## 2. 강조(Emphasis)

<aside>
💡

```markdown
# H1 (가장 큰 제목)
## H2 (두 번째로 큰 제목)
### H3
#### H4
##### H5
###### H6 (가장 작은 제목)
```

텍스트를 굵게, 기울임 또는 취소선으로 강조할 수 있습니다.

</aside>

```markdown
*기울임* 또는 _기울임_  
**굵게** 또는 __굵게__  
~~취소선~~
```

**결과:**

*기울임* 또는 *기울임*

**굵게** 또는 **굵게**

~~취소선~~

## 3. 리스트(List)

<aside>
💡

순서없는 리스트(Unordered List)

`-`, `*`, `+` 를 사용하여 항목을 만듭니다.

</aside>

```markdown
- 항목 1
- 항목 2
  - 하위 항목 2.1
  - 하위 항목 2.2
* 항목 3
```

**결과:**

- 항목 1
- 항목 2
    - 하위 항목 2.1
    - 하위 항목 2.2
- 항목 3

<aside>
💡

순서 있는 리스트(Ordered List)

숫자와 점(`.`)을 사용합니다.

</aside>

```markdown
1. 첫 번째 항목
2. 두 번째 항목
   1. 하위 항목 2.1
   2. 하위 항목 2.2
3. 세 번째 항목
```

**결과:**

1. 첫 번째 항목
2. 두 번째 항목
    1. 하위 항목 2.1
    2. 하위 항목 2.2
3. 세 번째 항목

## 4. 링크(Link)

<aside>
💡

링크를 삽입하려면 `[링크 텍스트](URL)`형식을  사용합니다.

</aside>

```markdown
[Google](https://www.google.com)  
[Markdown Guide](https://www.markdownguide.org)

```

**결과:**

[Google](https://www.google.com/)

[Markdown Guide](https://www.markdownguide.org/)

## 5. 이미지(Images)

<aside>
💡

이미지를 삽입하려면 `![대체텍스트](이미지 URL)` 형식을 사용합니다.

</aside>

```markdown
![Markdown 로고](https://markdown-here.com/img/icon256.png)
```

**결과:**

![](https://markdown-here.com/img/icon256.png)

## 6. 코드(code)

- 인라인 코드(Inline Code)

<aside>
💡

백틱(`)으로 감싸서 인라인 코드를 표시합니다.

</aside>

```
`console.log("Hello, World!");`
```

**결과:**

`console.log("Hello, World!");`

- 코드블럭(Code Block)

<aside>
💡

백틱(```) 세 개를 사용하여 여러 줄의 코드를 작성할 수 있습니다.

</aside>

```
```javascript
function greet() {
    console.log("Hello, World!");
}
greet();
```

**결과:**

```jsx
function greet() {
    console.log("Hello, World!");
}
greet();
```

## 7. 수평선(Horizonatal Rule)

<aside>
💡

`---`, `***`,`___` 을 사용하여 수평선을 삽입합니다.

</aside>

**결과:**

---

(노션에서는 `---` 이거만 표시됨)

## 8. 표(Table)

<aside>
💡

파이프(`|`)와 대시(`-`)를 사용하여 표를 만듭니다.

</aside>

```
| 헤더1 | 헤더2 | 헤더3 |
|-------|-------|-------|
| 값1   | 값2   | 값3   |
| 값4   | 값5   | 값6   |
```

**결과:**

| 헤더1 | 헤더2 | 헤더3 |
| --- | --- | --- |
| 값1 | 값2 | 값3 |
| 값4 | 값5 | 값6 |

## 9. 체크박스(CheckList)

<aside>
💡

작업 목록을 만들려면 `[ ] 와` `[x]`를 사용합니다.

</aside>

```
- [x] 완료된 작업  
- [ ] 미완료 작업  
- [ ] 진행 중 작업

```

**결과:**

- [x]  완료된 작업
- [ ]  미완료 작업
- [ ]  진행 중 작업