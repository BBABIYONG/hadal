# 하달의 너머 — Beyond the Hadal

정적 사이트입니다. 빌드 과정 없이 그대로 배포합니다.

- `index.html` — 뼈대
- `assets/style.css`, `assets/app.js` — 디자인과 화면 그리기
- `data.json` — 사이트 내용(캐릭터·일지·기록·송신소). 글을 고칠 때는 이 파일만 바꾸면 됩니다.
- 이미지는 `images/` 폴더에 넣고 data.json에 경로를 적습니다.


## data.json 작성법

작품 하나 = `works` 안의 항목 하나. 캐릭터는 그 안의 `characters`에 넣습니다.

```json
{
  "id": "tsuji",              // 주소에 쓰임 (#/works/tsuji/makoto)
  "public": true,             // false면 사이트에서 숨김
  "code": "HD-001",
  "title": "작품 제목",
  "tagline": "한 줄 소개",
  "status": "open",           // open 송출 중 / prep 조율 중 / hold 두절
  "badge": "19+ · SAFE",      // 카드에 붙는 표시 (없으면 adult:true → 19)
  "platform": "크랙",
  "links": [                  // 버전마다 버튼 하나. url이 비면 soon 문구가 뜸
    { "label": "19+", "url": "https://..." },
    { "label": "세이프", "url": "", "soon": "송출 예정" }
  ],
  "thumb": "images/xxx.webp",
  "tags": ["태그"],
  "date": "2026-11-14",
  "characters": [{
    "id": "makoto", "public": true,
    "name": "이름", "en": "ENGLISH NAME",
    "role": "한두 줄 소개",
    "img": "images/xxx.webp",          // 비우면 PORTRAIT / NO SIGNAL 자리표시
    "profile": [{ "k": "나이", "v": "27" }],
    "about": "본문 (빈 줄로 문단, **굵게**, > 인용)",
    "tmi": ["NOTES 탭 항목"],
    "gallery": [{ "src": "images/xxx.webp", "cap": "설명" }],
    "prompts": { "character": "", "outfit": "" }   // 둘 다 비면 PROMPT 탭 숨김
  }],
  "lore": ["pink"]            // lore 문서 id
}
```

캐릭터 없이 작품만 있으면 작품 자체가 한 장으로 뜹니다.
