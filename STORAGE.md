# 회원 사진 저장소 설정

회원 사진(`/gallery`)과 활동기록소 사진은 **S3 호환 객체 저장소**에 저장한다. 파일은 Vercel 서버를 거치지 않고 브라우저에서 저장소로 바로 올라가므로, Vercel 요청 크기 제한(4.5MB)과 상관없이 한 파일 수십 GB까지 올릴 수 있다. 서버는 짧게 유효한 업로드·다운로드 주소에 서명만 한다.

## 1. 저장소 고르기

| 서비스 | 1TB당 월 요금(대략) | 내려받기(egress) | 메모 |
|---|---|---|---|
| Cloudflare R2 | 약 $15 | 무료 | 회원들이 원본을 자주 내려받으면 가장 예측하기 쉽다. **권장** |
| Backblaze B2 | 약 $6 | 저장량의 3배까지 무료, 그 이상 $0.01/GB | 보관 위주면 가장 싸다 |
| AWS S3 | 약 $23 | $0.09/GB | 비싸다 |

요금은 쓴 만큼 매달 청구된다. 1TB를 꽉 채워야 위 금액이 나오고, 100GB만 쓰면 그 10분의 1 수준이다. 결제 수단 등록이 필요하므로 지도교사·학교 예산과 먼저 상의할 것.

## 2. Cloudflare R2 예시

1. Cloudflare 가입 → R2 → **버킷 만들기** (예: `pulcherrima-photos`). 공개 접근은 켜지 않는다.
2. R2 → **API 토큰 관리** → "객체 읽기 및 쓰기" 권한, 위 버킷만 선택 → 액세스 키 ID·비밀 액세스 키를 복사한다.
3. 버킷 → 설정 → **CORS 정책**에 아래를 넣는다. 도메인은 실제 사이트 주소로 바꾼다.

```json
[
  {
    "AllowedOrigins": ["https://pulcherrima.site", "https://pulcherrima-23.vercel.app"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

`ExposeHeaders`에 `ETag`가 없으면 64MB 넘는 파일 업로드가 실패한다.

## 3. Vercel 환경변수

Vercel 프로젝트 → Settings → Environment Variables에 넣고 다시 배포한다.

| 이름 | 값 |
|---|---|
| `S3_ENDPOINT` | `https://<계정ID>.r2.cloudflarestorage.com` (B2는 `https://s3.<지역>.backblazeb2.com`) |
| `S3_BUCKET` | 버킷 이름 |
| `S3_ACCESS_KEY_ID` | 액세스 키 ID |
| `S3_SECRET_ACCESS_KEY` | 비밀 액세스 키 |
| `S3_REGION` | 선택. R2는 `auto`(기본값), B2는 `us-west-004` 같은 지역 |
| `PHOTO_STORAGE_QUOTA_GB` | 선택. 동아리 전체 한도, 기본 `1024`(1TB). 2TB면 `2048` |
| `MEMBER_QUOTA_GB` | 선택. 1인 한도, 기본 `0`(제한 없음) |
| `MAX_PHOTO_FILE_GB` | 선택. 한 파일 최대 크기, 기본 `50` |

한도는 **청구 금액의 안전장치**다. 저장소 자체는 용량 제한이 없으므로, 예산에 맞춰 `PHOTO_STORAGE_QUOTA_GB`를 정해 두면 그 이상은 업로드가 거부된다.

## 4. 동작 방식

- 64MB 이하 파일은 한 번에, 그보다 큰 파일은 16MB 이상의 같은 크기 조각으로 나눠 4개씩 병렬로 올린다. 조각마다 최대 4번 재시도한다.
- JPG·PNG·WebP·HEIC 같은 이미지는 브라우저에서 작은 미리보기를 만들어 함께 올린다. RAW·FITS·SER은 미리보기 없이 형식 표시만 나온다.
- 업로드 중인 파일도 한도에 포함된다. 창을 닫아 끊긴 업로드는 하루 뒤 다음 업로드 때 자동으로 정리된다.
- `members`, `photos` 테이블은 첫 사용 때 서버가 자동으로 만든다(`server/memberSchema.ts`). 따로 `db:push`를 돌릴 필요가 없다.
- 저장소 환경변수가 없으면 회원 페이지는 "저장소 미연결" 안내를 띄우고, 활동기록소 사진은 예전 방식(3MB 이하)으로만 올라간다.
