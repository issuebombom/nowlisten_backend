# DEV NOTE

## CORS 설정

```typescript
// CORS OPTIONS
export const corsOptions = (env: string): CorsOptions => {
  return {
    origin: (requestOrigin, callback) => {
      if (
        !requestOrigin || // allow postman, same-origin etc.
        originWhiteList.includes(requestOrigin) ||
        checkLocalWhiteList(env, requestOrigin)
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  };
};

const allowedOrigins = {
  test: [],
  prod: [],
};

const originWhiteList = [...allowedOrigins.test, ...allowedOrigins.prod];

const checkLocalWhiteList = (env: string, requestOrigin: string) => {
  return (
    env === 'local' &&
    (requestOrigin.includes('http://127.0.0.1') ||
      requestOrigin.includes('http://localhost'))
  );
};
```

CORS(Cross-Origin Resource Sharing, 교차 출처 리소스 공유)는 웹 브라우저에서 다른 출처(origin)의 리소스를 요청할 수 있도록 허용해주는 보안 정책이다.  
기본적으로 브라우저는 보안상의 이유로 다른 출처(origin)의 요청을 차단한다. enableCORS설정은 이 제한을 완화하기 위한 설정이다.  
프론트엔드 허용을 위해서는 설정이 필수적이며 다른 출처(origin)의 리소스 요청 허용이 필요할 경우에 대비한다.  
origin이 전달되지 않는 경우 (postman), whitelist에 포함된 출처, 로컬 환경에 대해서 허용한다.

## Logging 설정(winston)

main.ts의 getNestOptions()으로 winston 로깅 패키지를 설정  
로컬, 테스트 환경에서만 colorize, pretty 출력이 적용되며, level은 최하위로 설정  
prod 환경에서는 info 레벨로 설정, 시각적 꾸밈 요소를 제외

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

Swagger를 활용한 CreateUserResDto 생성은 API 명세에는 password 필드가 빠진 결과를 보여주지만 실제 동작에는 영향을 주지 않는다.  
위와 같이 유저 생성 POST 요청에 대한 응답에 password를 제외하기 위한 방법 중 처음에는 CASE 2를 선택했다.  
CASE 2는 class-transformer 모듈 의존성을 갖고있으며, MVP 단계의 서비스에 굳이 사용할 필요가 있을까라는 생각이 들었다.  
하지만 향후 응답값 노출 프로퍼티 선택이 dto에서 @Exclude, @Expose 데코레이터로 간단하고 직관적으로 적용할 수 있다는 장점이 있다.  
결론적으로 CASE 3를 적용하여 글로벌 인터셉터를 적용했다.

## class-validator로 validation filter 설정

useGlobalPipe로 ValidationPipe를 설정하여 전역 validation 설정

```typescript
export const validationExceptionFilter = (errors: ValidationError[]) => {
  const firstValidationError = errors[0];
  // 방어 코드
  if (!firstValidationError) {
    return new BusinessException(
      ErrorDomain.Validation,
      'Validation failed, but no errors were provided',
      'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
  const invalidProperty = firstValidationError.property;
  const constraints = firstValidationError.constraints;
  // 에러메시지 출력 우선순위 선정을 위한 코드 (Length 에러 고정 포함 이슈)
  const apiMessage =
    constraints.isNotEmpty ||
    constraints.isString ||
    constraints.isNumber ||
    constraints.whitelistValidation ||
    Object.values(firstValidationError.constraints)[0];

  return new BusinessException(
    ErrorDomain.Validation,
    `invalid property: ${invalidProperty}`,
    apiMessage,
    HttpStatus.BAD_REQUEST,
  );
};
```

validationError에 대한 커스텀 필터를 설정하였다.  
class-validator는 발생한 모든 에러 메시지를 constrains에 배열로 모두 담아 보관하는 점에서 문제가 있다.

- 단순히 constrains 배열의 0 또는 -1번째 인덱싱으로 에러 메시지를 출력하면 다양한 validationError가 발생했더라도 하나씩만 클라이언트에 노출해서 유저가 순차적으로 에러를 해결하도록 유도하면 된다고 생각했다.
- 하지만 대부분의 검증 오류가 Length 검증 오류를 동반한다. (ex. IsString 검증 에러가 발생해도 Length 에러가 발생한 것으로 취급되는데, 이는 IsString 검증 에러로 인해 Length에 undefined가 전달되기 때문이다.)
- 결론적으로 IsString에 대한 에러 발생이 원인임에도 Length 오류 메시지가 전달될 가능성이 생긴다.
- 위 사항의 해결을 위해 검증 에러 apiMessage 전달에 우선순위를 매겨 에러 내역을 하나씩 출력하도록 하였다.

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
