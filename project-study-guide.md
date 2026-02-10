# 🧊 냉장고를 비워라 (Empty the Fridge) - MSA 프로젝트 완전 정복 가이드

---

## 1. 프로젝트 한 줄 요약

> **"사용자가 냉장고 속 식재료를 등록하면, 유통기한/재고 알림을 받고, AI가 레시피를 추천해주는 서비스"**

이 프로젝트는 **MSA (Microservice Architecture)** + **DDD (Domain-Driven Design)** + **CQRS** 패턴으로 설계되었습니다.

---

## 2. 먼저 알아야 할 핵심 개념: "왜 이 순서로 흘러가는가?"

당신이 알고 있는 흐름: `클라이언트 → 서버 → 컨트롤러 → 서비스 → 레파지토리 → DB`

이것을 **식당에 비유**해서 설명하겠습니다.

```
🧑 손님(Client) : "김치찌개 주세요!" (HTTP 요청)
    ↓
🚪 안내데스크(Gateway) : "네, 한식 코너로 안내해드릴게요" (라우팅)
    ↓
👨‍🍳 주방장(Controller) : "김치찌개 주문 들어왔습니다!" (요청 접수)
    ↓
📋 조리팀장(Service) : "재료 확인하고, 레시피대로 만들자" (비즈니스 로직)
    ↓
🗄️ 창고관리(Repository) : "김치, 돼지고기, 두부 꺼내왔습니다" (DB 접근)
    ↓
📦 창고(DB) : 실제 재료가 저장된 곳 (데이터 저장소)
```

### 왜 이렇게 나누는가?

**핵심 이유: "각자 자기 일만 한다" (관심사의 분리)**

| 계층 | 역할 | 비유 | 왜 필요한가? |
|------|------|------|------------|
| **Controller** | HTTP 요청/응답만 처리 | 카운터 직원 | 주문을 받고 음식을 전달만 함. 요리는 안 함 |
| **Service** | 비즈니스 로직 처리 | 조리사 | 실제 요리(로직)를 담당. 재료가 어디 있는지는 모름 |
| **Repository** | DB 접근만 담당 | 창고 관리자 | 재료(데이터)를 꺼내고 넣기만 함. 요리법은 모름 |
| **Entity** | DB 테이블과 1:1 매핑 | 재료 자체 | 김치, 두부 등 실제 데이터의 모양(구조) |
| **DTO** | 계층 간 데이터 전달 | 주문서/영수증 | 필요한 정보만 담아서 전달하는 봉투 |

---

## 3. 프로젝트 전체 구조 (큰 그림)

```
                          [클라이언트 (브라우저/앱)]
                                    │
                                    ▼
                        ┌──────────────────────┐
                        │  Gateway Server:8000  │  ← 모든 요청의 입구 (경비원+안내원)
                        │  - JWT 검증           │
                        │  - URL 라우팅          │
                        └──────────┬───────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                     │
              ▼                    ▼                     ▼
    ┌─────────────────┐ ┌──────────────────┐ ┌──────────────────────┐
    │ User Service    │ │ Recipe Service   │ │ Ingredient-Stock     │
    │ :포트 동적      │ │ :포트 동적       │ │ Service :포트 동적   │
    │                 │ │                  │ │                      │
    │ - 회원가입      │ │ - 레시피 CRUD    │ │ - 식재료 재고 관리    │
    │ - 로그인/로그아웃│ │ - AI 레시피 추천 │ │ - 폐기 이력          │
    │ - 회원정보 수정  │ │ - 음식 관리      │ │ - 통계               │
    │ - JWT 발급      │ │                  │ │ - 알림 생성          │
    └────────┬────────┘ └───────┬──────────┘ └──────────┬───────────┘
             │                  │                        │
             ▼                  ▼                        ▼
         [User DB]         [Recipe DB]          [Ingredient DB]

    ┌──────────────────┐
    │ Notification     │  ← Ingredient-Stock에서 Feign Client로 호출
    │ Service          │
    │ - 알림 저장/조회  │
    └──────────────────┘

    ┌──────────────────┐     ┌──────────────────┐
    │ Eureka Server    │     │ Config Server    │
    │ :8761            │     │ :8888            │
    │ (서비스 전화번호부)│     │ (설정 중앙관리)   │
    └──────────────────┘     └──────────────────┘
```

### 각 서버의 역할 설명

**Eureka Server (전화번호부)** — 포트 8761
- 모든 마이크로서비스가 시작할 때 "나 여기 있어요!"라고 등록하는 곳
- Gateway가 "User Service 어디있지?" 하고 물어보면 주소를 알려줌

**Config Server (설정 중앙관리)** — 포트 8888
- 각 서비스의 설정파일(DB 주소, 비밀키 등)을 Git에서 가져와서 한 곳에서 관리
- 설정 바꿀 때 서비스를 재시작하지 않아도 됨

**Gateway Server (관문)** — 포트 8000
- 클라이언트의 모든 요청이 반드시 여기를 거침
- JWT 토큰을 검증하고, URL에 따라 적절한 서비스로 보내줌

---

## 4. 실제 요청 흐름 따라가기 (회원가입 예제)

가장 중요한 부분입니다. 실제 코드를 따라가며 흐름을 이해해봅시다.

### 4-1. 클라이언트가 회원가입 요청을 보냄

```
POST http://localhost:8000/api/v1/user-service/users
Content-Type: application/json

{
  "userId": "testuser01",
  "password": "Test1234!",
  "nickname": "테스터",
  "email": "test@email.com",
  "phoneNum": "01012345678",
  "birthdate": "1995-01-01"
}
```

### 4-2. Gateway Server가 요청을 받음

**application.yml (Gateway)**에서 라우팅 규칙을 봅시다:

```yaml
- id: user-service
  uri: lb://USER-SERVICE        # lb = Load Balancer (Eureka에서 주소 찾아서 보냄)
  predicates:
    - Path=/api/v1/user-service/**    # 이 URL 패턴이면
  filters:
    - RewritePath=/api/v1/user-service/(?<segment>.*), /${segment}  # URL을 변환
```

**무슨 일이 일어나는가?**
1. `/api/v1/user-service/users`로 요청이 들어옴
2. Gateway: "아, `/api/v1/user-service/**` 패턴이네? User Service로 보내야지"
3. URL 변환: `/api/v1/user-service/users` → `/users`
4. Eureka에게 물어봄: "USER-SERVICE 어디있어?" → "localhost:xxxx에 있어!"
5. 해당 주소의 `/users`로 요청을 전달

**JwtAuthenticationFilter.java (Gateway)** 도 동시에 동작합니다:
```java
// 회원가입은 토큰이 없어도 됨 → 그냥 통과
if (authHeader == null || !authHeader.startsWith("Bearer ")) {
    return chain.filter(exchange);  // 다음으로 넘김
}
```

### 4-3. User Service의 Controller가 요청을 받음

```java
@RestController                    // "나는 REST API 컨트롤러야"
@RequiredArgsConstructor           // final 필드를 자동으로 생성자 주입
public class UserCommandController {

    private final UserCommandService userCommandService;  // Service를 주입받음

    @PostMapping("/users")         // POST /users 요청이 오면 이 메서드 실행
    public ResponseEntity<ApiResponse<Void>> register(
        @Valid @RequestBody UserCreateRequest userCreateRequest
        // @RequestBody : JSON을 자바 객체로 변환
        // @Valid : 입력값 유효성 검증 (빈 값, 형식 등)
    ) {
        this.userCommandService.registUser(userCreateRequest);  // Service에게 일을 시킴
        return ResponseEntity.status(HttpStatus.CREATED)        // 201 Created 응답
                .body(ApiResponse.success(null));
    }
}
```

**컨트롤러가 하는 일:**
1. HTTP 요청을 받는다 (`@PostMapping`)
2. JSON 데이터를 자바 객체(DTO)로 변환한다 (`@RequestBody`)
3. 입력값을 검증한다 (`@Valid`)
4. **Service에게 실제 로직을 위임한다** (핵심!)
5. 결과를 HTTP 응답으로 만들어 반환한다 (`ResponseEntity`)

> ❗ 컨트롤러는 절대 비즈니스 로직을 직접 처리하지 않습니다. "주문만 받고 조리사에게 전달"하는 역할입니다.

### 4-4. Service가 비즈니스 로직을 처리함

```java
@Service                           // "나는 비즈니스 로직 담당이야"
@RequiredArgsConstructor
public class UserCommandService {

    private final JpaUserRepository userRepository;      // DB 접근 도구
    private final ModelMapper modelMapper;               // 객체 변환 도구
    private final PasswordEncoder passwordEncoder;       // 비밀번호 암호화 도구
    private final UserDomainService userDomainService;   // 도메인 규칙 검증 도구

    @Transactional    // 이 메서드 안의 모든 DB 작업을 하나의 트랜잭션으로 묶음
                      // (중간에 에러나면 전부 롤백)
    public void registUser(UserCreateRequest userCreateRequest) {
        
        // 1단계: 중복 검증 (같은 아이디, 이메일 등이 이미 있는지 확인)
        this.userDomainService.validateValue(userCreateRequest);

        // 2단계: DTO → Entity 변환
        //   UserCreateRequest(클라이언트가 보낸 데이터)를 
        //   User(DB에 저장할 객체)로 변환
        User user = this.modelMapper.map(userCreateRequest, User.class);

        // 3단계: 비밀번호 암호화
        //   "Test1234!" → "$2a$10$K7L1OJ45..." (해독 불가능한 형태로 변환)
        user.setEncodedPassword(
            this.passwordEncoder.encode(userCreateRequest.getPassword())
        );

        // 4단계: DB에 저장 (Repository에게 위임)
        this.userRepository.save(user);
    }
}
```

**서비스가 하는 일:**
1. 비즈니스 규칙을 검증한다 (중복 체크)
2. 데이터를 가공한다 (암호화, 변환)
3. **Repository에게 DB 작업을 위임한다**
4. 트랜잭션을 관리한다 (성공하면 커밋, 실패하면 롤백)

### 4-5. DomainService가 비즈니스 규칙을 검증함

```java
@Service
@RequiredArgsConstructor
public class UserDomainService {

    private final JpaUserRepository userRepository;

    public void validateValue(UserCreateRequest userCreateRequest) {
        // 아이디 중복?
        if (userRepository.existsByUserId(userCreateRequest.getUserId())) {
            throw new IllegalStateException("이미 사용 중인 아이디입니다");
        }
        // 닉네임 중복?
        if (userRepository.existsByNickname(userCreateRequest.getNickname())) {
            throw new IllegalStateException("이미 사용 중인 닉네임입니다");
        }
        // 이메일 중복?
        if (userRepository.existsByEmail(userCreateRequest.getEmail())) {
            throw new IllegalStateException("이미 가입된 이메일입니다");
        }
        // ... 전화번호 중복 검사도 동일
    }
}
```

### 4-6. Repository가 DB와 통신함

```java
// 도메인 레이어의 인터페이스 (규칙만 정의)
public interface UserRepository {
    Optional<User> findByUserId(String userId);
    boolean existsByUserId(String userId);
    boolean existsByNickname(String nickname);
    // ...
}

// 인프라 레이어의 구현체 (실제 DB 접근)
public interface JpaUserRepository 
    extends JpaRepository<User, Long>,  // Spring Data JPA의 기본 CRUD 제공
            UserRepository {            // 위에서 정의한 커스텀 메서드 포함
    // 메서드 이름만으로 SQL이 자동 생성됨!
    // existsByUserId("testuser01") 
    //   → SELECT COUNT(*) FROM user WHERE user_id = 'testuser01'
}
```

**Repository가 하는 일:**
- `save(user)` → `INSERT INTO user (...) VALUES (...)`
- `findByUserId("test")` → `SELECT * FROM user WHERE user_id = 'test'`
- `existsByEmail("a@b.com")` → `SELECT COUNT(*) > 0 FROM user WHERE user_email = 'a@b.com'`

Spring Data JPA가 메서드 이름을 분석해서 자동으로 SQL을 만들어줍니다.

### 4-7. Entity (DB 테이블의 자바 표현)

```java
@Entity                    // "나는 DB 테이블과 연결된 객체야"
@Table(name = "user")      // "user 테이블이랑 연결해줘"
public class User {

    @Id                                          // 이 필드가 Primary Key
    @GeneratedValue(strategy = GenerationType.IDENTITY)  // 자동 증가 (AUTO_INCREMENT)
    private Long userNo;

    @Column(name = "user_id", unique = true, nullable = false)  
    // DB의 user_id 컬럼과 매핑, 유니크, NOT NULL
    private String userId;

    @Column(name = "user_pwd", nullable = false)
    private String password;

    // ... 나머지 필드들
    
    @Enumerated(EnumType.STRING)  // Enum을 문자열로 저장 (ACTIVE, INACTIVE)
    private UserStatus status = UserStatus.ACTIVE;
}
```

**Entity와 DB 테이블의 관계:**
```
Java Entity 필드          ↔    DB 테이블 컬럼
─────────────────────────────────────────────
private Long userNo       ↔    user_no INT AUTO_INCREMENT PK
private String userId     ↔    user_id VARCHAR(15) UNIQUE NOT NULL
private String password   ↔    user_pwd VARCHAR(100) NOT NULL
private UserStatus status ↔    status ENUM('ACTIVE','INACTIVE')
```

---

## 5. CQRS 패턴 이해하기

이 프로젝트의 특별한 점은 **CQRS (Command Query Responsibility Segregation)** 패턴입니다.

```
쉽게 말해: "쓰기(Command)와 읽기(Query)를 분리하자!"

                    ┌── Command (쓰기) ── JPA (Entity 직접 조작)
요청 ──→ Controller ┤
                    └── Query (읽기) ──── MyBatis (SQL 직접 작성)
```

### 왜 분리하는가?

**Command (생성/수정/삭제):** 데이터의 무결성이 중요 → JPA의 트랜잭션 관리가 유리
**Query (조회):** 성능이 중요, 복잡한 JOIN이 필요 → MyBatis의 직접 SQL이 유리

### 프로젝트의 패키지 구조 (User Service 예시)

```
user-service/
└── user/
    ├── command/                          ← 쓰기(CUD) 담당
    │   ├── application/
    │   │   ├── controller/
    │   │   │   ├── UserCommandController.java    ← 가입, 수정, 삭제
    │   │   │   └── UserAuthCommandController.java ← 로그인, 로그아웃
    │   │   ├── dto/
    │   │   │   ├── request/              ← 클라이언트 → 서버 (입력 데이터)
    │   │   │   │   ├── UserCreateRequest.java
    │   │   │   │   ├── UserLoginRequest.java
    │   │   │   │   └── UserUpdateRequest.java
    │   │   │   └── response/             ← 서버 → 클라이언트 (응답 데이터)
    │   │   │       └── TokenResponse.java
    │   │   └── service/
    │   │       └── UserCommandService.java       ← 비즈니스 로직
    │   ├── domain/
    │   │   ├── aggregate/                ← Entity (DB 테이블 매핑)
    │   │   │   ├── User.java
    │   │   │   ├── UserRole.java
    │   │   │   └── UserStatus.java
    │   │   ├── repository/               ← Repository 인터페이스 (규칙)
    │   │   │   └── UserRepository.java
    │   │   └── service/
    │   │       └── UserDomainService.java ← 도메인 규칙 검증
    │   └── infrastructure/
    │       └── repository/               ← Repository 구현체 (실제 DB)
    │           └── JpaUserRepository.java
    │
    └── query/                            ← 읽기(R) 담당
        ├── controller/
        │   └── UserQueryController.java  ← 회원 조회
        ├── dto/
        │   └── response/
        │       ├── UserDTO.java
        │       └── UserDetailResponse.java
        ├── mapper/
        │   └── UserMapper.java           ← MyBatis 매퍼 인터페이스
        └── service/
            └── UserQueryService.java
```

### Query 쪽의 MyBatis는 어떻게 동작하는가?

```java
// 1. Mapper 인터페이스 (Java)
@Mapper
public interface UserMapper {
    UserDTO selectUserByUserId(String userId);
}
```

```xml
<!-- 2. Mapper XML (SQL 직접 작성) -->
<!-- 파일위치: resources/mappers/user/User.xml -->
<mapper namespace="com.ohgiraffers.userservice.user.query.mapper.UserMapper">
    <select id="selectUserByUserId" 
            resultType="com.ohgiraffers.userservice.user.query.dto.response.UserDTO">
        SELECT
            user_no,
            user_id,
            user_pwd,
            user_nickname,
            user_email
        FROM user
        WHERE user_id = #{userId}
    </select>
</mapper>
```

**흐름:** UserMapper 인터페이스의 메서드를 호출하면 → 같은 이름의 XML SQL이 실행되고 → 결과가 UserDTO 객체로 변환됩니다.

---

## 6. JWT 인증 흐름 (로그인 → 인증된 요청)

이 프로젝트에서 가장 복잡하지만 중요한 흐름입니다.

### 6-1. 로그인 과정

```
1. 클라이언트: POST /api/v1/user-service/auth/login
   {"userId": "testuser01", "password": "Test1234!"}
        │
        ▼
2. Gateway: JWT 토큰 없음 → 그냥 통과 → User Service로 전달
        │
        ▼
3. UserAuthCommandController.login()
        │
        ▼
4. UserCommandService.login()
   - DB에서 userId로 사용자 조회
   - 비밀번호 일치 확인 (암호화 비교)
   - JWT Access Token 생성 (30분 유효)
   - JWT Refresh Token 생성 (7일 유효)
   - Refresh Token을 DB에 저장
        │
        ▼
5. 응답:
   - Body: { accessToken: "eyJhbG..." }
   - Cookie: refreshToken=eyJhbG... (HttpOnly, 브라우저 자동 저장)
```

### 6-2. 로그인 후 인증이 필요한 요청 (예: 식재료 등록)

```
1. 클라이언트: POST /api/v1/ingredient-stock-service/ingredient-stock
   Header: "Authorization: Bearer eyJhbG..."  (Access Token 포함)
        │
        ▼
2. Gateway의 JwtAuthenticationFilter 동작:
   a) "Bearer eyJhbG..." 에서 토큰 추출
   b) 토큰 유효성 검증 (위조? 만료?)
   c) 토큰에서 사용자 정보 추출 (userNo, userId, role)
   d) ★ 새로운 헤더를 추가해서 다음 서비스로 전달:
      X-User-Id: testuser01
      X-User-Role: USER
      X-User-No: 1
        │
        ▼
3. Ingredient-Stock Service의 HeaderAuthenticationFilter 동작:
   a) X-User-Id, X-User-Role, X-User-No 헤더를 읽음
   b) Gateway가 이미 검증했으므로 이 정보를 신뢰
   c) Spring Security의 인증 객체(SecurityContext)에 저장
        │
        ▼
4. IngredientStockCommandController:
   @AuthenticationPrincipal String userNo  ← SecurityContext에서 자동 주입
   → 이 사용자의 식재료를 등록
```

**핵심 포인트:**
- Gateway에서 JWT를 한 번만 검증하고, 이후 서비스들은 **헤더에 담긴 정보를 신뢰**합니다
- 각 마이크로서비스는 JWT를 직접 검증하지 않아도 됩니다
- `@AuthenticationPrincipal`로 현재 로그인한 사용자 정보를 쉽게 가져올 수 있습니다

---

## 7. 마이크로서비스 간 통신 (Feign Client)

서비스들끼리는 어떻게 소통할까요? **Feign Client**를 사용합니다.

### 예시: 식재료 재고 서비스 → 알림 서비스

```
[식재료 재고 서비스]                         [알림 서비스]
유통기한 임박 식재료 발견!
  → Feign Client로 알림 생성 요청 ──HTTP──→ 알림 저장
```

```java
// Ingredient-Stock Service에 있는 Feign Client 인터페이스
@FeignClient(
    name = "main-service",                    // 호출할 서비스 이름
    url = "http://localhost:8000",            // Gateway 주소
    configuration = FeignClientConfig.class   // 인증 토큰 전달 설정
)
public interface NotificationServiceClient {

    @PostMapping("/api/v1/main-service/notifications")
    void createNotifications(@RequestBody List<NotificationCreateRequest> requests);
    // 이 인터페이스만 정의하면 실제 HTTP 호출 코드는 자동 생성됨!
}
```

**Feign Client란?**
- 다른 서비스의 API를 마치 로컬 메서드처럼 호출할 수 있게 해주는 도구
- `notificationServiceClient.createNotifications(...)` 호출 → 실제로는 HTTP POST 요청이 발생
- RestTemplate처럼 HTTP 코드를 직접 작성할 필요가 없음

---

## 8. 각 마이크로서비스 상세 분석

### 8-1. User Service (회원 서비스)

**담당 기능:** 회원 가입, 로그인/로그아웃, 회원 정보 수정, 회원 탈퇴, 회원 조회

**주요 API:**

| 메서드 | URL | 기능 | 인증 필요 |
|--------|-----|------|----------|
| POST | /users | 회원가입 | ❌ |
| POST | /auth/login | 로그인 | ❌ |
| POST | /auth/logout | 로그아웃 | ✅ |
| GET | /users/{user_id} | 회원 조회 | ❌ |
| GET | /users/myinfo | 내 정보 조회 | ✅ |
| PATCH | /users | 회원 정보 수정 | ✅ |
| PATCH | /users/password | 비밀번호 변경 | ✅ |
| DELETE | /users | 회원 탈퇴 (Soft Delete) | ✅ |

**특이사항:**
- 회원 탈퇴는 실제 삭제가 아닌 **Soft Delete** (status를 INACTIVE로 변경)
- 비밀번호는 `BCrypt`로 암호화 저장

### 8-2. Ingredient-Stock Service (식재료 재고 서비스)

**담당 기능:** 식재료 등록/수정, 폐기 이력, 유통기한 알림, 통계

**주요 API:**

| 메서드 | URL | 기능 |
|--------|-----|------|
| POST | /ingredient-stock | 식재료 등록 |
| PATCH | /ingredient-stock | 식재료 수량 수정 |
| POST | /ingredient-stock/notification | 유통기한 알림 생성 |
| GET | /ingredient-stock | 재고 목록 조회 |
| POST | /disposal | 폐기 등록 |
| GET | /statistics/... | 각종 통계 조회 |

**알림 생성 흐름 (가장 복잡한 로직):**
```
1. 사용자가 "알림 설정" 버튼 클릭
2. IngredientStockCommandService.setIngredientStockNotice() 실행
3. 사용자의 모든 식재료 조회
4. 유통기한 임박 식재료 필터링 (3일 이내)
5. 재고 부족 식재료 필터링 (20% 이하)
6. 필터링 결과를 알림 메시지로 변환
   예: "우유 유통기한이 2일 남음"
   예: "계란 재고가 3ea 남음"
7. Feign Client로 Notification Service에 알림 생성 요청
```

### 8-3. Recipe Service (레시피 서비스)

**담당 기능:** 레시피 CRUD, 음식 관리, AI 레시피 추천

**핵심 기능 - AI 레시피 추천:**
```java
@Service
public class RecipeRecommendService {
    private final ChatClient chatClient;  // Spring AI의 ChatClient

    public RecommendRecipeResponse getRecipeRecommendation(RecipeRecommendRequest request) {
        return chatClient.prompt()
            .system(s -> s.text(systemPromptResource))  // "당신은 전문 요리사입니다..."
            .user(u -> u.text(userPromptResource)        // "재료: 감자, 양파, 당근..."
                .params(Map.of(
                    "dishName", request.getDishName(),
                    "ingredients", request.getIngredients(),
                    // ...
                ))
            )
            .call()
            .entity(RecommendRecipeResponse.class);  // AI 응답을 자바 객체로 자동 변환
    }
}
```

### 8-4. Notification Service (알림 서비스)

**담당 기능:** 알림 저장, 알림 목록 조회, 알림 읽음 처리

---

## 9. 자주 등장하는 어노테이션 사전

```java
// === 클래스 레벨 ===
@RestController       // 이 클래스는 REST API 컨트롤러 (JSON 반환)
@Service             // 이 클래스는 비즈니스 로직 담당
@Entity              // 이 클래스는 DB 테이블과 매핑
@Component           // 스프링이 관리하는 일반 빈(객체)
@RequiredArgsConstructor  // final 필드를 자동으로 생성자 주입

// === 메서드 레벨 (Controller) ===
@GetMapping("/url")    // GET 요청 처리
@PostMapping("/url")   // POST 요청 처리
@PatchMapping("/url")  // PATCH 요청 처리 (부분 수정)
@DeleteMapping("/url") // DELETE 요청 처리

// === 파라미터 레벨 ===
@RequestBody          // JSON → 자바 객체 변환
@PathVariable         // URL의 {변수} 값 추출
@AuthenticationPrincipal  // 현재 로그인한 사용자 정보 추출
@Valid                // 입력값 유효성 검증 실행

// === Entity 필드 레벨 ===
@Id                   // Primary Key
@GeneratedValue       // 자동 증가
@Column(name="...")   // DB 컬럼명 매핑
@Enumerated           // Enum 타입 매핑

// === Service 레벨 ===
@Transactional        // 트랜잭션 관리 (실패 시 롤백)
@Transactional(readOnly = true)  // 읽기 전용 트랜잭션 (성능 최적화)
```

---

## 10. DTO vs Entity 구분하기

```
[클라이언트]  ←── DTO ──→  [Controller]  ←── DTO ──→  [Service]  ←── Entity ──→  [Repository] ←→ [DB]
                                                         ↑
                                                    여기서 변환!
                                                   DTO ↔ Entity
```

**왜 DTO와 Entity를 분리하는가?**

Entity에는 비밀번호 같은 민감한 정보가 있습니다. 클라이언트에게 Entity를 그대로 보내면 비밀번호가 노출됩니다. 그래서 필요한 정보만 담은 DTO를 따로 만들어서 전달합니다.

```java
// Entity (DB의 모든 정보)
User {
    userNo, userId, password, nickname, email, 
    phoneNum, birthdate, status, role, createdAt...
}

// Request DTO (클라이언트 → 서버: 필요한 것만)
UserCreateRequest {
    userId, password, nickname, email, phoneNum, birthdate
}

// Response DTO (서버 → 클라이언트: 안전한 것만)
UserDTO {
    userNo, id, nickname, email, phoneNum, birthdate, role
    // ⚠️ password는 절대 포함하지 않음!
}
```

---

## 11. 전체 흐름 요약도

```
[사용자가 브라우저에서 버튼 클릭]
          │
          ▼
[HTTP 요청 발생]  POST /api/v1/user-service/users + JSON 데이터
          │
          ▼
[Gateway Server]  ① JWT 검증 → ② URL 분석 → ③ 해당 서비스로 라우팅
          │
          ▼
[Controller]  ④ 요청 접수 → JSON을 DTO 객체로 변환 → Service 호출
          │
          ▼
[Service]  ⑤ 비즈니스 로직 실행 (검증, 암호화, 변환 등) → Repository 호출
          │
          ▼
[Repository]  ⑥ DB에 SQL 실행 (INSERT, SELECT 등)
          │
          ▼
[DB]  ⑦ 데이터 저장/조회 → 결과 반환
          │
          ▼
(역순으로 올라감)
[Repository] → [Service] → [Controller] → [Gateway] → [클라이언트 화면에 결과 표시]
```

---

## 12. 학습 순서 추천

1. **User Service의 회원가입 흐름**을 처음부터 끝까지 따라가세요 (가장 단순)
2. **User Service의 로그인 흐름**으로 JWT 인증을 이해하세요
3. **Ingredient-Stock Service의 식재료 등록**으로 인증된 요청 흐름을 이해하세요
4. **알림 생성 흐름**으로 서비스 간 통신(Feign Client)을 이해하세요
5. **Recipe Service의 AI 추천**으로 외부 API 연동을 이해하세요
6. **Query 쪽 코드**로 MyBatis와 CQRS 패턴을 이해하세요
