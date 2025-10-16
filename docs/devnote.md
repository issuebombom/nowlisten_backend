# DEV NOTE

## ExceptionFilter

```typescript
export class BusinessException extends Error {
  public readonly id: string;
  public readonly timestamp: Date;

  constructor(
    public readonly domain: ErrorDomain,
    public readonly message: string,
    public readonly apiMessage: string, // 내부 로깅 시 에러를 명확히 규격하기 위함 (ex. 도메인.세부영역.에러타입)
    public readonly status: HttpStatus,
  ) {
    super(message);
    this.id = BusinessException.genId();
    this.timestamp = new Date();
  }

  private static genId(length = 12): string {
    const p = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return [...Array(length)].reduce(
      (a) => a + p[Math.floor(Math.random() * p.length)],
      '',
    );
  }
}
```

기본적으로 Nestjs 프레임워크에서 발생하는 예외는 HttpException 클래스를 기반으로 처리된다.  
ExceptionFilter를 사용하는 목적은 예외 발생 시 기본적으로 구성된 응답 body(statusCode, message, error)를 커스터마이징하기 위함이다.  
해당 프로젝트에서는 BusinessException 클래스를 따로 만들어 응답 body에 id와 domain, timestamp 항목을 추가한 것이 특징이다.  
id와 domain은 예외 발생 출처(서비스)를 빠르게 추적하기 위함에 있다. 기본 HttpException은 예외 발생 근원지를 찾기 어렵다.  
또한 서비스에 의도적으로 설정한 BusinessException 외 예상치 못한 HttpException이 발생하더라도 가로채어 응답 body가 커스텀 양식을 따르도록 한다.

```typescript
export enum ErrorDomain {
  Generic = 'generic',
  Auth = 'auth',
  User = 'user',
  Workspace = 'workspace',
  Channel = 'channel',

  ...
}

```

도메인명은 enum으로 관리하며 서비스 예외처리 외 Internal server error나 기타 예상치 못한 HttpException에 대해서는 generic으로 정의한다.

```typescript
if (exception instanceof BusinessException) {
  status = exception.status;
  errorResponseBody = {
    id: exception.id,
    domain: exception.domain,
    message: exception.message,
    status: exception.status,
    timestamp: exception.timestamp,
  };
} else if (exception instanceof HttpException) {
  status = exception.getStatus();
  errorResponseBody = new BusinessException(
    ErrorDomain.Generic,
    exception.message,
    exception.message, // 일반 메시지를 동일하게 apiMessage로 전송
    exception.getStatus(),
  );
} else {
  status = HttpStatus.INTERNAL_SERVER_ERROR;
  errorResponseBody = new BusinessException(
    ErrorDomain.Generic,
    `Internal server error: ${exception.message}`,
    'Internal server error',
    HttpStatus.INTERNAL_SERVER_ERROR,
  );
}
```

서비스 개발 과정에서 개발자가 설정한 예외는 BusinessException 인스턴스로 정의한다.  
기타 HttpException 또는 Error 발생에 있어서도 일관된 body를 출력할 수 있도록 if, else로 처리한다.

## Swagger 명세 설정

### 설정 및 Basic Auth 설정

```typescript
// Middleware
app.use('/api-docs', (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization || '';
  const [authType, credentials] = auth.split(' ');

  // 초기 접근, 입력값이 없을 경우
  if (authType !== 'Basic' || !credentials) {
    res.setHeader('WWW-Authenticate', 'Basic');
    return res.status(401).end('Authentication required');
  }

  // 입력값 디코딩
  const [username, password] = Buffer.from(credentials, 'base64')
    .toString()
    .split(':');

  // ID, PW 불일치 시
  if (username !== SWAGGER_ID || password !== SWAGGER_PW) {
    return res.status(401).end('Invalid credentials');
  }

  // 통과
  next();
});
```

Nestjs의 Swagger 기본 설정법은 공식 문서에 나와있어 참조했다.  
API 명세 접근에 대한 간단한 인증 절차를 미들웨어로 추가했으며 HTTP Basic Auth 기능을 적용했다.  
접속 시 클라이언트에서 Auth 헤더에 담을 사용자 이름과 비밀번호를 입력 받아 Base64로 인코딩한다.  
백엔드에서 해당 값을 디코딩하여 env에 기록한 SWAGGER_ID, SWAGGER_PW와 비교 확인하는 방식을 취했다.  
성공하면 브라우저를 종료하기 전까지 로그인이 유지된다. (쿠키, 로컬스토리지 활용 X)

### 공통 dto의 활용

```typescript
const OmitCreateUserReqDto = OmitType(CreateUserReqDto, ['password'] as const);

export class CreateUserResDto extends IntersectionType(
  OmitCreateUserReqDto,
  BaseResDto,
) {}
```

기본적으로 req, res 프로퍼티에 대한 명세는 dto파일에서 @ApiProperty 데코레이터로 명시하고 있다.  
그러나 POST 유저 생성에 대한 요청, 응답의 경우 응답 DTO가 요청 DTO와 중복되는 요소가 많아 코드 재사용성을 고민했고, 위 코드가 그 결과이다.  
Swagger 모듈의 OmitType 함수를 활용하여 ReqDto에서 password 필드를 제외한 Dto를 생성했다.  
또한 BaseEntity(id, createdAt, updatedAt 필드)에 맞춘 Dto인 BaseResDto를 덧붙였다.  
typescript가 기본적으로 다중 상속을 지원하지 않으므로 Swagger의 IntersectionType을 활용하여 두 DTO를 합쳤다.  
_(미적용: 가독성이 떨어짐)_

## class-transformer를 활용한 응답 body 필터링

```typescript
class User {
  id: string;
  name: string;
  password: string;
}

// CASE 1
const user = new User();
const { password, ...userWithoutPassword } = user;
return userWithoutPassword;

// CASE 2
const user = new User();
const userWithoutPassword = plainToInstance(CreateUserResDto, user, {
  excludeExtraneousValues: true,
});
return userWithoutPassword;

// CASE 3 (글로벌)
app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
```

유저 정보 조회 시 password를 제외하려는 의도에서 시작  
Swagger를 활용한 CreateUserResDto 생성은 API 명세에는 password 필드가 빠진 결과를 보여주지만 실제 동작에는 영향을 주지 않는다.  
위와 같이 유저 생성 POST 요청에 대한 응답에 password를 제외하기 위한 방법 중 처음에는 CASE 2를 선택했다.  
CASE 2는 class-transformer 모듈 의존성을 갖고있으며, MVP 단계의 서비스에 굳이 사용할 필요가 있을까라는 생각이 들었다.  
하지만 향후 응답값 노출 프로퍼티 선택이 dto에서 @Exclude, @Expose 데코레이터로 간단하고 직관적으로 적용할 수 있다는 장점이 있다.  
결론적으로 CASE 3를 적용하여 글로벌 인터셉터를 적용하였다.

## class-validator로 validation filter 설정

useGlobalPipe로 ValidationPipe를 설정하여 전역 validation 설정

```typescript
export const validationExceptionFilter = (errors: ValidationError[]) => {
  const invalidProperties = errors.flatMap((error) => error.property);
  const validationErrorMessages = errors.flatMap((error) =>
    Object.values(error.constraints),
  );

  return new BusinessException(
    ErrorDomain.Validation,
    `invalid property: ${invalidProperties.join(', ')}`,
    validationErrorMessages,
    HttpStatus.BAD_REQUEST,
  );
};

// 결과
{
    "apiMessage": [
        "name must be longer than or equal to 1 characters",
        "name should not be empty"
    ],
    "status": 400,
    "timestamp": "2025-08-23T08:15:13.736Z"
}
```

validationError에 대한 커스텀 필터를 설정하였다.  
class-validator는 발생한 모든 에러 메시지를 constrains에 key: value 형태로 담는다.  
에러가 발생한 필드에 대한 값은 property에 string 형태로 담긴다.  
위 사항을 토대로 BusinessException을 꾸려 예외 응답의 일관성을 유지한다.

## timestamp 저장 관련 이슈

TypeORM으로 createdAt 타입 설정을 'timestamp'로 할 경우 해당 시간의 출력 결과가 UTC에 -9시간이 적용되는 현상을 발견했다.

해당 문제의 원인을 정확히 이해하기 위해 timestamp, UTC, Date 클래스의 작동 방식에 대해 학습했다. 아래는 이해를 바탕으로 정리한 결과이다.

가령 현재 KST가 7/19 19:00일 경우 `new Date(Date.now())`의 결과는 7/19 10:00(UTC)가 된다. TypeORM으로 Postgres가 timestamp 설정일 경우(without time zone) 최종적으로 7/19 10:00값을 저장하는데 timezone에 대한 정보를 빼고 저장하므로 해당 시각이 UTC 기준이라는 정보를 잃게 된다.

이 값을 TypeORM의 fineBy를 통해 조회할 경우 Date는 timezone이 없는 ISOString형태의 시간 정보를 받았으므로 timestamp 획득을 위해 해당 시간이 서버 로컬 타임임을 가정해서 -9:00을 가한다. 왜냐하면 new Date는 timezone 정보가 없는 ISOString을 받으면 timestamp를 구하기 위해 어떻게든 어느 현지 시각이라도 기준을 잡아야 되기 때문이다. 그래서 DB에 저장된 시각은 우리가 아는 UTC임에도 불구하고, 명시되어있지 않아 서버에서 KST로 착각하게 되어 UTC -9시간을 출력하게 되는 것이다.

해당 문제는 'timestamptz'설정으로 해결할 수 있는데 이는 timezone을 명시함을 의미한다. 이는 시간 문자열 끝에 +00, +09와 같이 표기하여 기준 지역 정보를 담는 것이다. 이렇게 되면 Date는 기준 지역이 명시되어 있으므로 추측할 필요없이 +00일 경우 UTC로, +09일 경우 KST(한국)으로 이해하고 timestamp를 출력하는 것이다.

결론적으로 DB에는 timestamp를 ISOString으로 전환한 값(UTC기준)이 저장되어야 하고 이는 그 값을 가져올 떄도 UTC 기준 시간이 그대로 출력되도록 하기 위한 조치이다.

### 📌 **check point**

기본적으로 timestamp 세계 공통 기준 경과시간을 표현하는 넘버다. 그 기준을 우리는 UTC라고 부른다. 그러니 Date.now()를 어느 나라에서 실행하든 동시에 출력했다면 거의 같은 값이 출력된다.

문제는 new Date를 할 때 고려해야할 점이 있다. Date는 timestamp값을 주면 UTC 기준 시간을 보기좋게 출력해주는 기능을 한다.  
그래서 timestamp 즉 number값을 건네주면 그걸 ISO8601형식의 시간 문자열(ex. "2025-07-20 07:43:17.745542" 등)으로 변환하여 보여준다.

하지만 만약 new Date("2025-07-20 07:43:17.745542")를 생성하면 어떻게 될까?  
new Date는 아까와 달리 문자열을 받았지만 이해할 수 있게 그것을 timestamp로 파싱해야한다. 그런데 timestamp로 파싱하기 위해서는 저 문자열이 어느 지역을 기준으로 한 시각인지를 먼저 알아야 한다. 그래야 UTC를 기준으로 얼마큼 -, + 시간을 해야할지 결정할 수 있고, 최종적으로 timestamp를 구할 수 있기 때문이다. (timestamp는 지역, 국가 상관 없이 고정된 절댓값임을 기억하자.)

하지만 "2025-07-20 07:43:17.745542"는 지역 정보가 명시되어 있지 않기 때문에 Date가 내부적으로 현재 코드가 돌아가는 이 서버의 국가를 기준으로 잡아버린다. timestamp를 구하려면 어떻게든 지역을 정해야 계산을 할 수 있기 때문이다. 그래서 결론적으로 현지가 한국일 경우 한국이 UTC보다 +09:00 시간이므로 이를 적용해 timestamp를 구하게 되는 것이고 결론적으로 실제 UTC 시간의 -9시간을 적용하는 오류가 발생하게된다.

그러므로 timestamptz(with timezone)으로 설정하면 ISOString이 "2025-07-20 06:21:46.030613+00"와 같은 형태를 갖게 된다. 문자열 끝에 +00이 UTC임을 명확히 명시한다. (한국 시간임을 명시할 경우 +09가 붙게 된다.)

이렇게 하면 Date가 해당 문자열을 받았을 때 따로 추측할 필요없이 기준 지역이 명시되어 있으므로 이를 따르게 되고, 결론적으로 보이는 문자열 그대로의 시각을 출력하게 된다.

최종 정리하자면 아래와 같다.

> - new Date(Date.now())로 UTC 시간 객체를 생성했다.
> - DB에 timestamp 타입인 필드에 저장할 때 ISO 8601 문자열 형태로 저장되는데 이 때 UTC 기준이라는 정보가 소실되었다.
> - 서버가 DB에서 문자열 시간을 꺼내왔을 때 timezone 정보가 없으니 서버 위치(KST)를 따라 해당 문자열이 KST 기준이라고 판단해버린다.
> - KST로 판단한 시간을 내부적으로 new Date에 집어넣는 순간 UTC로 변환하면서 -9시간 감소한다.
> - 최종적으로 GET의 response body에 UTC 시간의 -9시간 적용된 시간이 찍힌다.

DB에 timestamp로 저장하면 안될까?  
정확도 측면에서는 좋은 선택일 수 있으나 아래 이유로 채택하지 않는다.

- `WHERE 'created_at' > NOW() - INTERVAL '1 hour'`과 같은 쿼리 사용에 제약이 생긴다.
- 시각적으로 DB를 들여다봐야할 경우 timestamp는 전혀 와닿지 않는다.

## User Select 시 디폴트로 password 제외 설정

- user entity에서 패스워드 필드 옵션 설정에서 select: false로 간단히 해결
- 이렇게 할 경우 addSelect로 특별히 지정해야 출력이 됨

## Jwt Guard 설정

- 유저 자격에 따른 접근 권한을 확인할 떄 프론트에서 access 토큰을 Authorization으로 받는다.
- 이를 Guard로 설정하여 토큰 인증과 그에 따른 예외 처리를 한다.
- 예외 처리는 일관성 유지를 위해 BusinessException 형태가 적용되도록 한다.

## Refresh 토큰 관리

- next.js서버에서 세션 쿠키(refresh)를 생성했다고 가정했을 때 로그 아웃 시 자체적으로 세션 쿠키 제거가 가능함
- 하지만 내부적으로 refresh를 DB에 보관함으로써 토큰 탈취 시 해당 유저의 토큰을 삭제함으로써 대응 가능하도록 한다.
- 또한 정기적으로 DB에서 expired된 jti에 대한 삭제 cron을 설정한다. (토큰 검증 과정에서 expired 토큰은 예외처리 되므로 실시간 삭제 불필요)

## 구글(소셜) 로그인 시 access, refresh 토큰 프론트 전달 방법

소셜 로그인 인증 후 callback에서 프론트로 리다이렉트할 때 jwt 전달하지 않고(보안 취약성) 세션id와 같은 임시토큰을 전달하여 이를 기반으로 nextjs 서버에서 jwt를 백엔드에 따로 요청하도록 한다.

- callback에서 임시토큰 생성 후 메모리에 'social-login:임시토큰' = userId로 연결해 둔다. (redis, in-memory)
- nextjs 서버로 토큰과 네임스페이스('social-login')를 query에 담아 GET 요청(리다이렉트)한다.
- 프론트는 스트링쿼리로 받은 네임스페이스, 토큰을 body에 담아 jwt 획득을 위한 POST 요청을 서버로 보낸다.
- 서버는 메모리 get으로 임시 토큰 검증(userId 획득) 후 access, refresh를 생성 후 응답한다.
- 프론트는 받은 jwt를 쿠키로 등록한다.

## 패스워드 관련

- 패스워드 서비스를 따로 둠, 순환 참조 문제 해결
- 패스워드 밸리데이션 데코레이터를 따로 커스텀 -> 패스워드 규칙을 나중에라도 변경 가능하도록
- 패스워드 재설정 요청 시
  1. 재설정 페이지 링크를 담은 메일을 보냄 (임시 토큰 포함, 메모리에 토큰 저장)
  2. 이메일에서 링크 버튼 클릭 시 재설정 페이지 이동
  3. 프론트에서 페이지 만료(보여줄지 말지) 검증을 위해 백엔드 요청 with 임시 토큰
  4. 메모리 내 토큰 존재 유무로 만료 여부 파악
  5. 통과 시 재설정 페이지 노출
  6. 뉴 패스워드 작성 후 submit
  7. 토큰 검증, 유저 검증 후 패스워드 변경 적용

## 이메일 서비스 관련

- nodemailer로 AWS SES 전송
- SES의 전송 도메인 확인을 위해 테스트 도메인 구매
- nestjs-modules/mailer 패키지에 대한 신뢰가 떨어져 nodemailer만 사용

## 워크스페이스 생성 (이름 짓기)

- 예약어 금지 설정 (커스텀 데코레이터 생성 후 validation)

## TypeORM 옵션 설정을 활용한 커스텀 쿼리 로거(Logger) 작성

TypeORM의 AbstractLogger 클래스를 상속하여 쿼리 로깅 방식을 커스텀

- 기존: TypeORM 자체 로거 양식 적용
- 변경: Nest 양식을 준수하는 로거 적용 (통일성) + 가독성 향상

## 이메일 인증 코드 발송 및 검증 로직 관련

회원가입 시 입력한 이메일 기반 '인증번호 발송' 및 '인증 확인' 기능 구현

- 이메일 입력 후 '인증번호 발송' 클릭 시
  - 이메일 exists 검증
  - 임시 코드 생성 (6자리)
  - redis에 'email-verify:이메일' : 임시 코드 형태로 저장 (TTL: 5분)
  - 이메일 발송
- 인증 번호 입력 후 '인증 확인' 버튼 클릭 시
  - redis에서 'email-verify:이메일' Get하기 (만료확인 + 코드 일치)

## 워크스페이스 초대

이메일 기반 워크스페이스 초대 이메일 발송

- Invitation 테이블 도입, 초대 정보를 데이터베이스 테이블로 관리한다.
- 이메일 입력 후 초대 버튼 클릭 시 레코드 생성 및 이메일 발송
  - 액티브 유저인가 + 초대 권한 검증
  - 초대하려는 워크스페이스가 활성화 상태인가
  - 초대 토큰 생성, 초대 일자 생성, 초대일자 기반 초대 만료일자 생성
  - 초대 이메일 발송
    - 이벤트 발행으로 이메일 전송

## 워크스페이스 초대 링크 접속 및 승인

- 초대 링크 접속 시 처리 흐름
  - 초대 링크 만료일 및 상태 체크
  - 초대 링크의 접속자가 초대 대상자가 맞는지 확인
  - 초대한 워크스페이스가 현재 유효한지 확인
  - 초대자의 자격 증명 확인
  - 위 사항 모두 통과 시 링크 접속 가능
- 초대 페이지에서 초대 승인 시 처리 흐름
  - 워크스페이스 내에서 사용할 닉네임 받기
  - 링크 접속 시 확인했던 검증 과정을 그대로 다시 거침
  - 트랜잭션
    - 초대 링크의 상태를 invited에서 accepted로 수정
    - 워크스페이스 신규 멤버 등록

## 멤버 권한 설정

```typescript
export enum RolePermission {
  // 워크스페이스 관리
  WORKSPACE_INVITE_MEMBER = 1 << 0, // 1
  WORKSPACE_REMOVE_MEMBER = 1 << 1, // 2
  WORKSPACE_MANAGE_SETTINGS = 1 << 2, // 4
  WORKSPACE_MANAGE_BILLING = 1 << 3, // 8
  WORKSPACE_MANAGE_APPS = 1 << 4, // 16
  WORKSPACE_MANAGE_CHANNELS = 1 << 5, // 32
  ...
}

export const WorkspaceRolePermission: Record<WorkspaceRole, number> = {
  [WorkspaceRole.OWNER]:
    RolePermission.WORKSPACE_ALL_PERMISSION |
    RolePermission.CHANNEL_ALL_PERMISSION |
    RolePermission.MESSAGE_ALL_PERMISSION,
    ...
}

// 권한체크 예시
const userGrade = WorkspaceRolePermission[WorkspaceRole.OWNER]
const requiredRole =
  RolePermission.WORKSPACE_INVITE_MEMBER |
  RolePermission.WORKSPACE_REMOVE_MEMBER

if ((userGrade & requiredRole) === requiredRole) {
  console.log('권한 있음');
}
```

- 비트 연산을 활용해 각 권한에 점수를 부여하고 요구되는 권한 중 하나라도 포함되지 않을 경우 통과되지 못하도록 설정
- 빠르게 권한 추가 및 변경 시 있도록 구성함
- 서비스 중 권한 변경 시 서버를 내려야 하는 상황이기 때문에 권한을 DB로 관리할 필요가 있어보임

## 향후 Nextjs로 프론트 구현을 위한 간단 정리

- Nextjs는 폴더가 곧 url이 된다.
- page.js가 html을 구성하여 브라우저에 UI를 출력하는 역할을 한다.
- app폴더 내 api 폴더를 두어 서버 역할(백엔드 역할)을 부여할 수 있다. 그래서 page.js에서 fetch로 api 폴더에 접근할 수 있어 사실상 nextjs만으로 풀스텍 구현이 가능하다.
- 컴포넌트를 서버 컴포넌트 vs 클라이언트 컴포넌트로 구별한다.
  - 클라이언트 컴포넌트는 동적 구현을 위한 상태 관리(useState 등)를 적용할 경우 'use client'로 적용
  - 그 외 html 완성 및 랜더링은 서버 컴포넌트(nextjs의 디폴트 설정)로 구현한다.
- Route Handler vs Server Action
  - nextjs 13에서 서버 액션이 도입되었다. 이는 api폴더로 fetch를 날려 데이터 요청을 하는 route 방식과 달리 직접 데이터 관련 로직 함수를 수행하는 방식이다.
  - Route Handler는 fetch를 날리는 방식 vs 필요한 로직 함수를 직접 실행시키는 방식
  - nestjs와 같은 백엔드 서버가 있다고 가정했을 때 Route Handler는 일종의 프록시 역할을 하게 된다. 즉 nextjs는 nestjs에 도달하기 위해 fetch를 두 번 날리게 된다.
  - 서버 액션은 nestjs에 fetch를 날리는 함수 자체를 실행하는 것이므로 request는 한 번으로 끝난다.
