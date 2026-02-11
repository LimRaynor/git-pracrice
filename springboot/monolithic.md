# monolithic type

- 모놀리식 구조는 모든 비즈니스(계산) 로직이 
하나의 프로젝트 구조에 들어있어서

클라이언트 에게 요청이 들어오면 
controller -> service -> repository 순으로 요청에대해 진행되고
하나로 통합된 DB를 사용하는 구조이기 때문에
수정사항이 생기면 전체를 다시 수정해야하는 특징


새프젝파서 controller -> service -> repository ---> DB
흐름 구조대로 만들어보자!