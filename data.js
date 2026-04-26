// 아침의 발견 — 카페 데이터
//
// ── 필드 설명 ──────────────────────────────────────────────────
// id        : 고유 번호 (숫자, 순서대로 증가)
// name      : 카페 이름
// nameEn    : 카페 영어 이름  예) "BONANZA COFFEE"
// address   : 주소
// lat / lng : 위도 / 경도 (네이버 지도에서 확인 가능)
// tags      : 오픈 시간 태그 + 식사 여부
//             오픈 시간: "open8" | "open9" | "open10"
//             간단한 식사 가능: "meal"  (없으면 생략)
//             예) tags: ["open9", "meal"]
// tagLabels : 화면에 표시할 태그 텍스트 배열 (tags 순서와 맞춤)
//             예) tagLabels: ["9시 오픈", "간단한 식사"]
// hours     : 영업 시간 문자열  예) "09:00 — 21:00"
// price     : 대표 메뉴 가격    예) "아메리카노 5,500원~"
// vanillaLattePrice : 아이스 바닐라 라떼 가격 (숫자, 원 단위)  예) 6000
// desc      : 한두 줄 설명
// img       : 카페 이미지 URL
// naverUrl  : 네이버 지도 링크
//
// ── 예시 (주석 해제 후 사용) ──────────────────────────────────
// {
//   id: 1,
//   name: "카페 이름",
//   address: "서울 종로구 ...",
//   lat: 37.5800,
//   lng: 126.9850,
//   tags: ["open8", "meal"],
//   tagLabels: ["8시 오픈", "간단한 식사"],
//   hours: "08:00 — 21:00",
//   price: "아메리카노 5,500원~",
//   desc: "카페 소개 문구",
//   img: "이미지 URL",
//   naverUrl: "https://map.naver.com/v5/search/카페+이름"
// },
// ─────────────────────────────────────────────────────────────

const CAFES = [
  {
    id: 1,
    name: "보난자 커피 군자로",
    nameEn: "BONANZA COFFEE",
    address: "서울 광진구 능동로 239-1 2동 1층",
    lat: 37.5516,
    lng: 127.0762,
    tags: ["open8", "meal"],
    tagLabels: ["8시 오픈", "간단한 식사"],
    hours: "08:30 — 21:00",
    price: "-",
    vanillaLattePrice: 6000,
    desc: "오전 8시 30분 오픈. 베를린 스페셜티 커피 브랜드.",
    img: "",
    naverUrl: "https://naver.me/xf5AOpXM"
  }
];
