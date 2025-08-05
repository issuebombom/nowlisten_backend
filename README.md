# nowlisten_backend

## 목차

- [프로젝트 개요](#프로젝트-개요)
- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [실행 방법](#실행-방법)
- [API 명세](#api-명세)
- [고민한 점](#고민한-점)

## 프로젝트 개요

슬랙과 같은 업무 협업을 위한 서비스를 개인적으로 보유하고 싶어 시작한 프로젝트 입니다.  
`nowlisten_backend`는 `nowlisten` 프로젝트의 백엔드 API 서버입니다.  
NestJS 프레임워크를 기반으로 구축되었으며, PostgreSQL 데이터베이스와 연동하여 동작합니다.

<img width="2290" height="1072" alt="ERD" src="https://github.com/user-attachments/assets/9d89a479-9c12-4e94-91da-a23d4424a0ba" />


## 주요 기능

- **사용자 인증**: `auth` 모듈을 통해 JWT(Access/Refresh Token) 기반의 사용자 인증 기능을 제공합니다.
  - 회원가입, 로그인, 로그아웃 기능을 구현했습니다.
  - Access Token 만료 시 Refresh Token을 이용한 재발급 기능을 구현했습니다.
- **API 문서화**: `swagger` 설정을 통해 API 문서를 자동화하고, Basic Auth로 접근을 제어합니다.
- **데이터베이스**: `docker` 디렉토리의 `docker-compose-local.yaml` 파일을 통해 PostgreSQL 데이터베이스를 사용하며, TypeORM을 통해 데이터를 관리합니다.
- **에러 핸들링**: `BusinessException`을 커스텀하여 에러 발생 시 추적을 용이하게 하고, 전역 `ExceptionFilter`를 통해 일관된 형식의 에러 응답을 제공합니다.
- **로깅**: `winston`을 활용하여 `local`, `prod` 등 환경에 따라 다른 형식과 레벨로 로그를 기록합니다.
- **유효성 검사**: `class-validator`와 `ValidationPipe`를 이용해 전역 DTO 유효성을 검사하며, 커스텀 필터를 통해 명확한 에러 메시지를 반환합니다.
- **CORS**: `main.ts` 파일의 `enableCors` 설정을 통해 Origin Whitelist 기반의 CORS 정책을 적용하여 허용된 출처의 요청만 처리합니다.

## 기술 스택

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: Passport, JWT
- **Logging**: Winston
- **Validation**: class-validator, class-transformer

## 프로젝트 구조

```
/nowlisten_backend
├── .github/                  # GitHub Actions 워크플로우
├── docker/                   # Docker 관련 설정 (Dockerfile, docker-compose.yaml)
├── src/                      # 소스 코드
│   ├── auth/                 # 인증 관련 모듈 (컨트롤러, 서비스, DTO, 엔티티 등)
│   ├── common/               # 공통 모듈 및 유틸리티
│   ├── exception/            # 예외 처리 필터
│   ├── main.ts               # 애플리케이션 진입점
│   └── app.module.ts         # 루트 모듈
├── test/                     # 테스트 코드
├── .gitignore                # Git 무시 파일 목록
├── .prettierrc               # Prettier 설정
├── package.json              # 프로젝트 정보 및 의존성 관리
├── tsconfig.build.json       # TypeScript 빌드 설정
├── tsconfig.json             # TypeScript 설정
└── yarn.lock                 # Yarn 의존성 잠금 파일
```

## 실행 방법

1.  **저장소 복제**

    ```bash
    git clone https://github.com/issuebombom/nowlisten_backend.git
    cd nowlisten/nowlisten_backend
    ```

2.  **의존성 설치**

    ```bash
    yarn install
    ```

3.  **환경 변수 설정**

    `.env.local` 파일을 생성하고, `env.sample` 파일을 참고하여 환경 변수를 설정합니다.

    ```bash
    cp .env.local.example .env.local
    ```

4.  **데이터베이스 실행**

    Docker를 사용하여 PostgreSQL 데이터베이스를 실행합니다.

    ```bash
    make up ENV=local
    ```

5.  **애플리케이션 실행**

    ```bash
    make start ENV=local
    ```

## API 명세

애플리케이션 실행 후, `http://localhost:3001/api-docs`에서 API 문서를 확인할 수 있습니다.

## 고민한 점

### CORS 설정

CORS(Cross-Origin Resource Sharing)는 웹 브라우저에서 다른 출처(origin)의 리소스를 요청할 수 있도록 허용하는 보안 정책입니다. 기본적으로 브라우저는 보안상의 이유로 다른 출처의 요청을 차단하므로, 프론트엔드 개발을 위해 CORS 설정을 추가했습니다.

- `origin` 옵션을 통해 허용할 출처를 관리합니다.
- `methods` 옵션을 통해 허용할 HTTP 메서드를 지정합니다.
- `requestOrigin`이 없는 경우(e.g., Postman)와 `originWhiteList`에 포함된 경우, 로컬 환경(`http://127.0.0.1`, `http://localhost`)에서의 요청을 허용합니다.

### 로깅

`winston`을 사용하여 환경별로 다른 로깅 정책을 적용했습니다.

- **개발 환경 (`local`, `test`)**: `colorize`, `prettyPrint` 옵션을 사용하여 가독성을 높이고, `silly` 레벨로 모든 로그를 기록합니다.
- **프로덕션 환경 (`prod`)**: `info` 레벨 이상의 로그만 기록하며, 시각적 꾸밈 요소는 제외합니다.

### 예외 처리

NestJS의 기본 `HttpException`을 확장한 `BusinessException`을 정의하여 에러 추적을 용이하게 했습니다.

- **`BusinessException`**: `id`, `domain`, `message`, `timestamp` 등의 필드를 추가하여 에러 발생 시점과 원인을 명확히 파악할 수 있도록 했습니다.
- **`ExceptionFilter`**: `BusinessException` 외에 `HttpException`, `Error` 등 다양한 타입의 에러를 일관된 형식으로 처리합니다.

### DTO 최적화

`class-transformer`의 `OmitType`, `IntersectionType`을 활용하여 DTO 코드의 재사용성을 높였습니다.

- **`OmitType`**: 특정 필드를 제외한 DTO를 생성합니다. (e.g., `password`를 제외한 사용자 정보 DTO)
- **`IntersectionType`**: 여러 DTO를 조합하여 새로운 DTO를 생성합니다.

### 유효성 검사

`class-validator`와 `ValidationPipe`를 사용하여 DTO의 유효성을 검사하고, 커스텀 필터를 통해 명확한 에러 메시지를 반환합니다.

- `ValidationPipe`를 전역으로 적용하여 모든 요청에 대한 유효성 검사를 수행합니다.
- `validationExceptionFilter`를 통해 여러 유효성 검사 오류 중 우선순위가 높은 메시지를 선택하여 반환합니다.

### Timestamp 저장

데이터베이스에 시간을 저장할 때 발생할 수 있는 타임존 문제를 방지하기 위해 `timestamptz` 타입을 사용합니다.

- `timestamp` 타입은 타임존 정보 없이 시간만 저장하므로, 서버의 타임존에 따라 시간이 다르게 해석될 수 있습니다.
- `timestamptz` 타입은 타임존 정보를 함께 저장하여 UTC 기준으로 시간을 일관되게 관리합니다.

### 인증 아키텍처

Next.js와 같은 프론트엔드 프레임워크와의 연동을 고려하여, 백엔드는 상태 없이(stateless) JWT 발급 및 검증에만 집중하고, 프론트엔드(Next.js 서버)가 세션 쿠키를 관리하는 방식으로 역할을 분리했습니다.

- **백엔드**: JWT(Access/Refresh Token)를 발급하고, 유효성을 검증합니다.
- **프론트엔드**: 발급받은 토큰을 쿠키에 저장하고, 요청 시 헤더에 담아 전송합니다. Access Token 만료 시 Refresh Token을 사용하여 재발급을 요청합니다.
