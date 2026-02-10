import { useState } from "react";

const flows = {
  signup: {
    title: "회원가입 흐름",
    emoji: "📝",
    steps: [
      { layer: "Client", code: 'POST /api/v1/user-service/users\n{\n  "userId": "testuser01",\n  "password": "Test1234!",\n  "nickname": "테스터"\n}', desc: "사용자가 회원가입 정보를 입력하고 전송합니다", color: "#6366f1" },
      { layer: "Gateway :8000", code: 'Path=/api/v1/user-service/**\n→ RewritePath → /users\n→ lb://USER-SERVICE (Eureka에서 주소 찾기)\n\nJwtFilter: 토큰 없음 → Pass-through', desc: "URL 패턴을 분석하고 User Service로 라우팅합니다. 회원가입은 토큰 불필요", color: "#8b5cf6" },
      { layer: "Controller", code: '@PostMapping("/users")\npublic ResponseEntity register(\n  @Valid @RequestBody UserCreateRequest req\n) {\n  userCommandService.registUser(req);\n  return ResponseEntity.status(201)\n    .body(ApiResponse.success(null));\n}', desc: "JSON → DTO 변환, 유효성 검증 후 Service에게 위임합니다", color: "#ec4899" },
      { layer: "Service", code: '@Transactional\npublic void registUser(UserCreateRequest req) {\n  // 1. 중복검증 (DomainService)\n  userDomainService.validateValue(req);\n  // 2. DTO → Entity 변환\n  User user = modelMapper.map(req, User.class);\n  // 3. 비밀번호 암호화\n  user.setEncodedPassword(\n    passwordEncoder.encode(req.getPassword())\n  );\n  // 4. DB 저장\n  userRepository.save(user);\n}', desc: "비즈니스 로직: 중복체크 → 변환 → 암호화 → 저장", color: "#f59e0b" },
      { layer: "Repository", code: 'public interface JpaUserRepository\n  extends JpaRepository<User, Long> {\n  // save(user) 호출 시 자동으로:\n  // INSERT INTO user\n  //   (user_id, user_pwd, ...)\n  //   VALUES (?, ?, ...)\n}', desc: "JPA가 Entity를 분석해서 자동으로 INSERT SQL을 생성/실행합니다", color: "#10b981" },
      { layer: "DB (MySQL)", code: 'INSERT INTO user\n  (user_id, user_pwd, user_nickname,\n   user_email, user_phonenum, ...)\nVALUES\n  ("testuser01", "$2a$10$K7L...",\n   "테스터", "test@email.com", ...)', desc: "실제 데이터가 MySQL user 테이블에 저장됩니다", color: "#06b6d4" },
    ]
  },
  login: {
    title: "로그인 → JWT 발급 흐름",
    emoji: "🔐",
    steps: [
      { layer: "Client", code: 'POST /api/v1/user-service/auth/login\n{\n  "userId": "testuser01",\n  "password": "Test1234!"\n}', desc: "아이디와 비밀번호를 전송합니다", color: "#6366f1" },
      { layer: "Gateway :8000", code: 'JWT 토큰 없음 → Pass-through\n→ User Service로 라우팅', desc: "로그인은 인증 전이므로 토큰 검증 없이 통과", color: "#8b5cf6" },
      { layer: "Controller", code: '@PostMapping("/auth/login")\npublic ResponseEntity login(\n  @RequestBody UserLoginRequest req\n) {\n  TokenResponse tokens = \n    userCommandService.login(req);\n  // refreshToken → HttpOnly 쿠키\n  // accessToken → 응답 Body\n  return buildTokenResponse(tokens);\n}', desc: "로그인 처리 후 토큰을 쿠키와 Body에 나눠서 반환합니다", color: "#ec4899" },
      { layer: "Service", code: '// 1. userId로 DB에서 사용자 조회\nUser user = userRepository\n  .findByUserId(req.getUserId());\n\n// 2. 비밀번호 일치 확인\npasswordEncoder.matches(\n  req.getPassword(), user.getPassword()\n);\n\n// 3. JWT 토큰 생성\nString accessToken = jwtTokenProvider\n  .createToken(userNo, userId, role);\nString refreshToken = jwtTokenProvider\n  .createRefreshToken(...);\n\n// 4. Refresh Token DB 저장\nuserAuthRepository.save(tokenEntity);', desc: "사용자 검증 → 비밀번호 매칭 → JWT 토큰 2개 생성", color: "#f59e0b" },
      { layer: "응답", code: '// HTTP Response\nBody: {\n  "accessToken": "eyJhbGciOi..."\n}\nSet-Cookie: refreshToken=eyJhbG...\n  HttpOnly; Path=/; Max-Age=7일', desc: "Access Token은 Body로, Refresh Token은 안전한 HttpOnly 쿠키로 반환", color: "#10b981" },
    ]
  },
  authRequest: {
    title: "인증된 요청 (식재료 등록)",
    emoji: "🥬",
    steps: [
      { layer: "Client", code: 'POST /api/v1/ingredient-stock-service\n     /ingredient-stock\nHeader: Authorization: Bearer eyJhbG...\n{\n  "ingredientStockName": "우유",\n  "ingredientStockExpiredAt": "2026-02-15",\n  "ingredientStockTotalQuantity": 1000,\n  "ingredientStockUnit": "ml"\n}', desc: "로그인 때 받은 Access Token을 헤더에 포함해서 요청합니다", color: "#6366f1" },
      { layer: "Gateway JWT Filter", code: '// 1. 토큰 추출\nString token = authHeader.substring(7);\n\n// 2. 토큰 검증 (위조? 만료?)\njwtTokenProvider.validateToken(token);\n\n// 3. 사용자 정보 추출\nLong userNo = getUserNoFromJWT(token);\nString userId = getUserIdFromJWT(token);\n\n// 4. ★ 헤더에 사용자 정보 추가\nrequest.mutate()\n  .header("X-User-Id", userId)\n  .header("X-User-No", userNo)\n  .header("X-User-Role", role);', desc: "Gateway가 JWT를 검증하고, 사용자 정보를 헤더에 담아 다음 서비스로 전달", color: "#8b5cf6" },
      { layer: "HeaderAuthFilter\n(Ingredient Service)", code: '// Gateway가 추가한 헤더 읽기\nString userId = request\n  .getHeader("X-User-Id");\nString userNo = request\n  .getHeader("X-User-No");\n\n// Spring Security 인증 객체 생성\nSecurityContextHolder\n  .getContext()\n  .setAuthentication(auth);\n// → @AuthenticationPrincipal로 접근 가능', desc: "Gateway가 검증한 정보를 신뢰하고 SecurityContext에 저장합니다", color: "#ec4899" },
      { layer: "Controller", code: '@PostMapping("/ingredient-stock")\npublic ResponseEntity regist(\n  @AuthenticationPrincipal String userNo,\n  @RequestBody IngredientStockCreateRequest req\n) {\n  // userNo = SecurityContext에서 자동 주입\n  return service.registIngredientStock(\n    userNo, req\n  );\n}', desc: "@AuthenticationPrincipal로 현재 로그인한 사용자 번호를 자동으로 가져옵니다", color: "#f59e0b" },
      { layer: "Service → Repository → DB", code: '// DTO → Entity 변환\nIngredientStock stock = \n  modelMapper.map(req, IngredientStock.class);\nstock.setUserNo(Long.parseLong(userNo));\n\n// DB 저장\nrepository.save(stock);\n// → INSERT INTO ingredient_stock ...', desc: "사용자 번호와 함께 식재료 정보를 DB에 저장합니다", color: "#10b981" },
    ]
  },
  interService: {
    title: "서비스 간 통신 (알림 생성)",
    emoji: "🔔",
    steps: [
      { layer: "Client", code: 'POST /api/v1/ingredient-stock-service\n     /ingredient-stock/notification\nHeader: Authorization: Bearer eyJhbG...', desc: "사용자가 '알림 설정' 버튼을 누릅니다", color: "#6366f1" },
      { layer: "Ingredient Service\n(Service 레이어)", code: '// 1. 내 식재료 전부 조회\nList<IngredientStock> stocks = \n  repository.findAllByUserNo(userNo);\n\n// 2. 유통기한 임박 필터링 (3일 이내)\nList<IngredientStock> expiringSoon = \n  domainService.filterExpiredSoonStock(stocks);\n\n// 3. 재고 부족 필터링 (20% 이하)\nList<IngredientStock> lowStock = \n  domainService.filterLowStock(stocks);', desc: "사용자의 식재료를 분석하여 알림이 필요한 항목을 추출합니다", color: "#8b5cf6" },
      { layer: "알림 메시지 생성", code: '// 유통기한 임박 알림\n"우유 유통기한이 2일 남음"\n"두부 유통기한이 1일 남음"\n\n// 재고 부족 알림\n"계란 재고가 3ea 남음"\n"간장 재고가 50ml 남음"', desc: "필터링된 식재료를 사람이 읽기 쉬운 알림 메시지로 변환합니다", color: "#ec4899" },
      { layer: "Feign Client\n(HTTP 호출)", code: '@FeignClient(\n  name="main-service",\n  url="http://localhost:8000"\n)\npublic interface NotificationServiceClient {\n  @PostMapping("/api/v1/main-service\n               /notifications")\n  void createNotifications(\n    @RequestBody List<NotificationCreateRequest> req\n  );\n}\n// 메서드 호출 → 자동으로 HTTP POST 발생!', desc: "Feign Client가 자바 메서드 호출을 HTTP 요청으로 자동 변환합니다", color: "#f59e0b" },
      { layer: "Notification Service", code: '// Notification Service의 Controller가\n// 요청을 받아서\n// → Service → Repository → DB 순서로\n// 알림을 저장합니다\n\nINSERT INTO notification\n  (user_no, notification_type_no,\n   notification_content)\nVALUES\n  (1, 1, "우유 유통기한이 2일 남음")', desc: "알림 서비스가 받은 데이터를 notification 테이블에 저장합니다", color: "#10b981" },
    ]
  },
  query: {
    title: "CQRS: 조회(Query) 흐름",
    emoji: "🔍",
    steps: [
      { layer: "Client", code: 'GET /api/v1/user-service/users/testuser01', desc: "특정 사용자의 정보를 조회합니다", color: "#6366f1" },
      { layer: "Controller (Query)", code: '@GetMapping("/users/{user_id}")\npublic ResponseEntity getUser(\n  @PathVariable("user_id") String userId\n) {\n  UserDetailResponse response = \n    userQueryService.getUser(userId);\n  return ResponseEntity.ok(\n    ApiResponse.success(response)\n  );\n}', desc: "Query 전용 Controller가 조회 요청을 처리합니다", color: "#8b5cf6" },
      { layer: "Service (Query)", code: '@Transactional(readOnly = true)\npublic UserDetailResponse getUser(String id) {\n  // MyBatis Mapper로 조회\n  UserDTO user = userMapper\n    .selectUserByUserId(id);\n  return UserDetailResponse.builder()\n    .user(user).build();\n}', desc: "readOnly 트랜잭션으로 성능 최적화, MyBatis로 직접 SQL 실행", color: "#ec4899" },
      { layer: "MyBatis Mapper", code: '// Java 인터페이스\n@Mapper\npublic interface UserMapper {\n  UserDTO selectUserByUserId(String userId);\n}\n\n// XML (실제 SQL)\n<select id="selectUserByUserId"\n  resultType="UserDTO">\n  SELECT user_no, user_id,\n    user_nickname, user_email\n  FROM user\n  WHERE user_id = #{userId}\n</select>', desc: "MyBatis가 XML에 작성된 SQL을 실행하고 결과를 DTO로 매핑합니다", color: "#f59e0b" },
      { layer: "Command vs Query 비교", code: '// Command (쓰기): JPA 사용\nuserRepository.save(user);\n→ JPA가 자동으로 SQL 생성\n→ Entity 객체 직접 조작\n\n// Query (읽기): MyBatis 사용\nuserMapper.selectUserByUserId(id);\n→ 개발자가 SQL 직접 작성\n→ 복잡한 JOIN, 통계에 유리', desc: "같은 DB를 접근하지만, 쓰기는 JPA, 읽기는 MyBatis로 분리한 것이 CQRS", color: "#10b981" },
    ]
  }
};

export default function MSAFlowDiagram() {
  const [selectedFlow, setSelectedFlow] = useState("signup");
  const [activeStep, setActiveStep] = useState(0);

  const flow = flows[selectedFlow];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-1 text-white">
          🧊 냉장고를 비워라 - MSA 흐름 학습기
        </h1>
        <p className="text-center text-gray-400 text-sm mb-6">
          각 버튼을 눌러 요청 흐름을 단계별로 따라가보세요
        </p>

        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {Object.entries(flows).map(([key, f]) => (
            <button
              key={key}
              onClick={() => { setSelectedFlow(key); setActiveStep(0); }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedFlow === key
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {f.emoji} {f.title}
            </button>
          ))}
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{flow.emoji} {flow.title}</h2>
          <span className="text-sm text-gray-400">
            {activeStep + 1} / {flow.steps.length} 단계
          </span>
        </div>

        <div className="flex gap-1 mb-4">
          {flow.steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              className="flex-1 h-2 rounded-full transition-all"
              style={{
                backgroundColor: i <= activeStep ? flow.steps[i].color : "#374151",
                opacity: i === activeStep ? 1 : i < activeStep ? 0.5 : 0.3
              }}
            />
          ))}
        </div>

        <div className="space-y-3">
          {flow.steps.map((step, i) => {
            const isActive = i === activeStep;
            const isPast = i < activeStep;
            
            return (
              <div
                key={i}
                onClick={() => setActiveStep(i)}
                className={`rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? "border-opacity-60 shadow-lg"
                    : isPast
                    ? "border-gray-700 opacity-50"
                    : "border-gray-800 opacity-30"
                }`}
                style={{
                  borderColor: isActive ? step.color : undefined,
                  boxShadow: isActive ? `0 0 20px ${step.color}22` : undefined
                }}
              >
                <div className="flex items-center gap-3 p-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: step.color + "33", color: step.color }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm" style={{ color: isActive ? step.color : "#9ca3af" }}>
                      {step.layer}
                    </div>
                    {isActive && (
                      <div className="text-xs text-gray-400 mt-0.5">{step.desc}</div>
                    )}
                  </div>
                  {i < flow.steps.length - 1 && isActive && (
                    <div className="text-gray-500 text-lg flex-shrink-0">↓</div>
                  )}
                </div>
                
                {isActive && (
                  <div className="px-3 pb-3">
                    <pre className="bg-gray-900 rounded-lg p-3 text-xs overflow-x-auto border border-gray-800">
                      <code className="text-gray-300">{step.code}</code>
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-between mt-4">
          <button
            onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
            disabled={activeStep === 0}
            className="px-4 py-2 bg-gray-800 rounded-lg text-sm disabled:opacity-30 hover:bg-gray-700 transition-colors"
          >
            ← 이전 단계
          </button>
          <button
            onClick={() => setActiveStep(Math.min(flow.steps.length - 1, activeStep + 1))}
            disabled={activeStep === flow.steps.length - 1}
            className="px-4 py-2 bg-indigo-600 rounded-lg text-sm disabled:opacity-30 hover:bg-indigo-500 transition-colors"
          >
            다음 단계 →
          </button>
        </div>

        <div className="mt-8 p-4 bg-gray-900 rounded-xl border border-gray-800">
          <h3 className="font-semibold text-sm mb-3 text-gray-300">🏗️ 전체 아키텍처 한눈에</h3>
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            {[
              { name: "Eureka\n:8761", desc: "서비스 등록소", bg: "#1e1b4b" },
              { name: "Config\n:8888", desc: "설정 관리", bg: "#1e1b4b" },
              { name: "Gateway\n:8000", desc: "관문+JWT", bg: "#312e81" },
              { name: "", desc: "", bg: "transparent" },
              { name: "", desc: "", bg: "transparent" },
            ].map((s, i) => s.name ? (
              <div key={i} className="p-2 rounded-lg" style={{ backgroundColor: s.bg }}>
                <div className="font-mono text-indigo-300 whitespace-pre-line">{s.name}</div>
                <div className="text-gray-500 mt-1">{s.desc}</div>
              </div>
            ) : <div key={i}/>)}
          </div>
          <div className="flex items-center justify-center my-2 text-gray-600">
            ──── Gateway에서 각 서비스로 라우팅 ────
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {[
              { name: "User\nService", desc: "회원/인증", color: "#059669" },
              { name: "Recipe\nService", desc: "레시피/AI추천", color: "#d97706" },
              { name: "Ingredient\nService", desc: "재고/통계", color: "#dc2626" },
              { name: "Notification\nService", desc: "알림", color: "#7c3aed" },
            ].map((s, i) => (
              <div key={i} className="p-2 rounded-lg border" style={{ borderColor: s.color + "44", backgroundColor: s.color + "11" }}>
                <div className="font-mono whitespace-pre-line" style={{ color: s.color }}>{s.name}</div>
                <div className="text-gray-500 mt-1">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
