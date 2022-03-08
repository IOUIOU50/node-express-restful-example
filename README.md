# express-restful-api-example

[Notion에서 읽기](https://www.notion.so/API-Docs-2640c8fee19b430892a77a266add1074)

node.js를 활용한 restful api 백엔드 구축 프로젝트입니다.
주어진 요구사항은 아래와 같습니다.

* 책 정보를 삽입한다.
* 책 정보를 조회한다.
    - 책이 가지는 정보를 가지고 조회할 때, 정렬 가능해야한다.
* 책정보를 수정한다.
* 책정보를 삭제한다
    - 단, 책 정보를 생성한 사람만이 삭제가 가능하다

---

# API Spec

## 용어 기호 정의

* `<value>` : 결과를 받기 위해 반드시 입력해야하는 값
* `{value}` : optional. 결과를 받는데 있어 있어도 되고 없어도 되는 값
* `[value#1 | value#2 | ...]` : 2개 이상의 값중, 반드시 하나 필요

## URI 목록

| HTTP Method | URI | expected |
| --- | --- | --- |
| POST | / | post body에 담긴 직원의 
이름으로 jwt 발급 |
| POST | /book | post body에 담긴 book 정보로 새로운 자원 생성 |
| GET | /book | 모든 책 정보 요청 |
| GET | /book/<condition>/<value>
{?order=[asc|desc]} | params, query에 
해당하는 자원 요청. value와 query에
유효하지 않은 경로는 무시 |
| PATCH | /<serial> | serial에 해당하는 자원 
수정 요청 |
| DELETE | /<serial> | serial에 해당하는 자원 
삭제 |

---

# Resources specification

## book

| 이름 | 의미 | 자료형 | 고유성 |
| --- | --- | --- | --- |
| serial | 책에 부여하는 고유번호 | 숫자형 | O |
| title | 책 제목 | 문자열 | X |
| price | 책 가격 | 숫자형 | X |
| release | 출간일 | ‘yyyy-mm-dd’ 형식을 
따르는 문자열 | X |
| staff | 책 정보를 등록한 직원 | 문자열 | X |
| author | 저자 | 문자열 | X |
| publisher | 출판사 | 문자열 | X |
| category | 카테고리 | 문자열 | X |

---

# Request-Response Specifiaction

## POST “/”

api root 경로는 직원에 해당하는 자원을 생성

```jsx
// reqeust POST "/"

// headers
{}

// body
{
    staff: string // 등록하려는 사원의 이름
}
```

```jsx
// response

// success
201 Created
{
		staff: string // uuid
}

// client errors
// #1: empty or invalid attribute 'staff'
400 Bad Request
{
		message: "insufficient request data: recheck staff name."
}
```

---

## POST “/book”

책 자원을 생성

```jsx
// reqeust POST "/book"

// headers
{
	authorization: string
}

// body
{
    "title": string,
    "price": number,
    "release": 'yyyy-mm-dd',
    "author": string,
    "publisher": string,
    "category": string
}
```

```jsx
// response

// success
201 Created
{
    "serial": number,
    "bookInfo": {
        "title": string,
        "price": number,
        "release": 'yyyy-mm-dd',
        "author": string,
        "publisher": string,
        "category": string,
        "staff": string // staff 등록 시 부여된 uuid
    }
}

// client errors
// #1 header에 jwt를 추가하지 않음
403 Forbidden
{
		message: "invalid token: no authrozed token"
}

// #2 header에 jwt가 있으나 유효하지 않음
403 Forbidden
{
		message: "invalid token: no user matched token"
}

// #3 book 자원을 생성할 body의 정보가 충분하지 않음
400 Bad Reqeust
{
		message: "insufficient request data: need <insufficient data>"
}

// #4 중복된 book 자원을 생성하려 함
409 Conflict
{
		message: "resource already exist: diplciated book"
}

// #5 생성하려고 하는 클라이언트의 직원 정보가 없음 
400 Bad Request
{
		message: "insufficient request data: no matching staff. please register staff first."
}

// #6 일부 자원의 형식에 대한 규칙이 지켜지지 않음: price(가격), release(출간일)
400 Bad Reqeust
{
		message: ["insufficient request data: date format must be 'yyyy-mm-dd'"
							| "insufficient request data: price must be numeric"]
}
```

---

## GET “/book”

책 자원을 조회

```jsx
// request GET "/book"

// headers
{
		"authorization": string // signed jwt
}
```

```jsx
// response

// success
200 OK
[
		{
		    "serial": number,
		    "price": number,
		    "title": strinng,
		    "release": 'yyyy-mm-dd',
		    "author": string,
		    "publisher": string,
		    "category": string,
		    "staff": string
		}
		// ... more books
]
```

---

## GET “/book/<condition>/<value>{?order=[asc|desc]}”

검색 필터에 해당하는 책 자원을 조회

결과는 자원의 개수와 상관 없이 배열형태로 응답
→ `serial` 은 고유한 자원이기 때문에 오직 하나의 자원만 응답하지만 배열의 원소에 들어간 형태로 응답

올바르지 않은 condition은 client error지만
value가 올바르지 않더라도 `4xx client error` 를 응답하지 않고, `200 OK []` 와 같이 빈 배열을 응답

### condition

| condition | value | example |
| --- | --- | --- |
| serial | 숫자형 | /book/serial/1 |
| price | <숫자형>to<숫자형> | /book/price/10000to30000 |
| title | 문자열 | /book/title/프로그래밍 |
| release | <yyyy-mm-dd>to<yyyy-mm-dd> | /book/release/2019-01-01to2021-12-31 |
| staff | 문자열 | /book/staff/홍길동 |
| author | 문자열 | /book/author/철수 |
| publisher | 문자열 | /book/publisher/네모출판 |
| category | 문자열 | /book/category/기술 |

### order

`serial` 을 포함한 모든 uri에 `?order=asc` 또는 `?order=desc` 적용 가능

단, `serial` 은 오직 하나의 자원만 응답하기 때문에 적용 전 후 결과 변화 없음

```jsx
// request GET “/book/<condition>/<value>{?order=[asc|desc]}”
// ex #1) GET /book/author/martin?order=asc
// ex #2) GET /book/release/2019-01-01to2022-03-03?order=desc

// headers
{
		"authorization": string // signed jwt
}
```

```jsx
// response

// success
200 OK
[
		{
		    "serial": number,
		    "price": number,
		    "title": strinng,
		    "release": 'yyyy-mm-dd',
		    "author": string,
		    "publisher": string,
		    "category": string,
		    "staff": string
		}
		// ... more books
]

// client errors
// #1 유효하지 않은 검색 필터로 조회
404 Not Found
{
		message: "uri not found: no <condition> field"
}
```

---

## PATCH “/book/<serial>”

책 자원의 상태를 변경

```jsx
// reqeust PATCH "/book/<serial>"

// headers
{
		"authorization": string // signed jwt
}

// body
{
		"condition": "value"
		// ... more conditions
}
```

```jsx
// response

// success
204 No Content

// client errors
// #1 시리얼 번호에 해당하는 자원이 없음
404 Not Found
{
		message: "uri not found: no content on serial <serial>"
}

// #2 책의 serial 자체를 변경하려함 - serial은 고유불변의 데이터
400 Bad Request
{
		message: "insufficient request data: serial is unchangeable"
}

// #3 존재하지 않는 자원의 상태를 변경하려함
400 Bad Request
{
		message: "insufficient request data: <condition> is not exists"
}

// #4 일부 자원의 형식에 대한 규칙이 지켜지지 않음: price(가격), release(출간일)
400 Bad Reqeust
{
		message: ["insufficient request data: date format must be 'yyyy-mm-dd'"
							| "insufficient request data: price must be numeric"]
}
```

---

## DELETE “/book/<serial>”

책 자원을 삭제

```jsx
// reqeust PATCH "/book/<serial>"

// headers
{
		"authorization": string // signed jwt
}
```

```jsx
// response 

// success
204 No Content

// client errors
// #1 serial은 숫자로서의 의미를 가져야 함
400 Bad Reqeust
{
		message: "insufficient request data: price must be numeric"
}

// #2 시리얼 번호에 해당하는 자원이 없음
404 Not Found
{
		message: "uri not found: no content on serial <serial>"
}

// #3 책 자원을 삭제할 때에는 해당 자원을 생성한 직원만이 삭제 가능
403 Forbidden
{
		message: "invalid token: only a staff who created resource can delete the resource"
}
```
