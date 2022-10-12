# Self Cloud Server

![](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)

-   참여자: 김동주 <<hepheir@gmail.com>>
-   기간: 2016-10-05[^date-started] ~ 2020-11-04[^date-ended]

[^date-started]: 본 서비스의 가장 오래된 배포 흔적을 이 날짜에 지인과의 카카오톡 대화 내용에서 확인함. 실제 개발기간을 고려하면 프로젝트 시작일은 더 이전일 것으로 추정됨.
[^date-ended]: 2e9fb483f83d044b1311eb265dadc36f51d68199 커밋을 기준으로 작성함.

# Summary

*Self Cloud Server*는 자신의 **로컬 디스크 일부를 클라우드 드라이브**로 사용할 수 있게 해주는 마이크로 서비스입니다.

Node.js를 더욱 심도있게 공부해보면서, 실제로 친구들과 파일 공유를 하는데 사용하는 것을 목표로 제작되었습니다. 개발 초창기였던 2016년도에는 **파일 탐색**과 **다운로드** 기능만 존재하였으나, 차츰 유지보수되어 **파일의 추가<sup>(업로드)</sup>와 제거**, **다중 파일 선택**, 그리고 **음원 스트리밍** 기능이 추가되었습니다.

# Service

![](/images/v1.1.0-screenshot.png)

# Changes

## 1.0.0

- 파일 탐색기 기능 추가
    - 상단에 현재 디렉터리 경로 표시
    - 현재 디렉터리 내 파일 표시
    - 현재 디렉터리 내 폴더 표시 및 진입
    - 파일 다운로드 (다운로드 스트림 지원)
    - 파일 다중 선택
    - 파일 업로드

- 음악 플레이어 기능 추가
    - 음원 파일 재생
    - 재생목록에 음원 추가 (한 개의 플레이리스트만 지원)

|                다중 파일 선택 시                |           음원 파일 재생 시           |
| :---------------------------------------------: | :-----------------------------------: |
| ![](/images/v1.0.0-multiple-files-selected.png) | ![](/images/v1.0.0-playing-music.png) |

## 1.1.0

- 파일 탐색기 기능 추가
    - 파일의 미디어 타입에 따라 다른 아이콘으로 표시 (파일/코드/영상/음원)

- 음악 플레이어 기능 추가
    - 디자인 개선
    - 아티스트 정보 표시
    - 플레이리스트 곡 번호 표시
    - 다중 플레이리스트 생성 가능

| 파일의 종류에 따라 알맞는 아이콘이 표시됨 |
| :---------------------------------------: |
|    ![](/images/v1.1.0-screenshot.png)     |
