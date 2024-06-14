# Test Report

<The goal of this document is to explain how the application was tested, detailing how the test cases were defined and what they cover>

# Contents

- [Test Report](#test-report)
- [Contents](#contents)
- [Dependency graph](#dependency-graph)
- [Integration approach](#integration-approach)
- [Tests](#tests)
- [Coverage](#coverage)
  - [Coverage of FR](#coverage-of-fr)
  - [Coverage white box](#coverage-white-box)

# Dependency graph

     <report the here the dependency graph of EzElectronics>

# Integration approach

    <Write here the integration sequence you adopted, in general terms (top down, bottom up, mixed) and as sequence

    (ex: step1: unit A, step 2: unit A+B, step 3: unit A+B+C, etc)>

    <Some steps may  correspond to unit testing (ex step1 in ex above)>

    <One step will  correspond to API testing, or testing unit route.js>

# Tests

<in the table below list the test cases defined For each test report the object tested, the test level (API, integration, unit) and the technique used to define the test case (BB/ eq partitioning, BB/ boundary, WB/ statement coverage, etc)> <split the table if needed>

| Test case name | Object(s) tested | Test level | Technique used |
| :------------: | :--------------: | :--------: | :------------: |
|Product routes  | Product routes   |       Unit |   BB/ boundary |
|Product controller|Product controller|Unit|	BB/ eq partitioning|
|Product DAO|Product DAO|Unit|WB/ statement coverage|
|Review routes|Review routes|Unit|BB/ boundary|
|Review controller|Review controller|Unit|BB/ eq partitioning|
|Review DAO|Review DAO|Unit|WB/ statement coverage|
|Product|Product|Integration|	BB/ boundary|
|Review|Review|Integration|BB/ eq partitioning|

/////////////////////////////////////////////////////////////////////

| Test case name                      | Object(s) tested              | Test level   | Technique used                               |
| :---------------------------------: | :---------------------------: | :----------: | :------------------------------:             |
| creating user                       | createUser method, UserDAO     | Unit         | WB/statement coverage                       |
| get all users                       | getUsers method, UserDAO       | Unit         | WB/statement coverage                       |
| get users by role                   | getUsersByRole method, UserDAO | Unit         | WB/statement coverage                       |
| get users by username               | getUserByUsername method, UserDAO | Unit     | WB/statement coverage                        |
| delete a user                       | deleteUser method, UserDAO     | Unit         | WB/statement coverage                       |
| delete all users                    | deleteAllUsers method, UserDAO | Unit         | WB/statement coverage                       | 
| update user info                    | updateUserInfo method, UserDAO | Unit         | WB/statement coverage                       |
| create user - 200                   | POST /users route, UserController | Integration | BB/equivalence partitioning               |
| create user - user already in db - 409 | POST /users route, UserController | Integration | BB/boundary value analysis             |
| get all users - route               | GET /users route, UserController | Integration | BB/equivalence partitioning                |
| get all users - user not admin - 401 | GET /users route, Authenticator | Integration | BB/boundary value analysis                 |
| get users by role - route           | GET /users/roles/:role route, UserController | Integration | BB/equivalence partitioning    |
| get users by role - user not admin - 401 | GET /users/roles/:role route, Authenticator | Integration | BB/boundary value analysis |
| get user by username - route        | GET /users/:username route, UserController | Integration | BB/equivalence partitioning      |
| get user by username - user not admin - 401 | GET /users/:username route, Authenticator | Integration | BB/boundary value analysis|
| delete a user - route               | DELETE /users/:username route, UserController | Integration | BB/equivalence partitioning   |
| delete all users - route            | DELETE /users route, UserController | Integration | BB/equivalence partitioning             |
| update a user - route               | PATCH /users/:username route, UserController | Integration | BB/equivalence partitioning    |
| update a user - user not found - 404 | PATCH /users/:username route, UserController | Integration | BB/boundary value analysis    |
| login                               | POST /sessions route, Authenticator | Integration | BB/equivalence partitioning             |
| get current session                 | GET /sessions/current route, Authenticator | Integration | BB/equivalence partitioning      |
| logout                              | DELETE /sessions/current route, Authenticator | Integration | BB/equivalence partitioning   |



# Coverage

## Coverage of FR

<Report in the following table the coverage of functional requirements and scenarios(from official requirements) >

| Functional Requirement or scenario | Test(s) |
| :--------------------------------: | :-----: |
FR3.1	|ProductControllerTest, ProductDaoTest
FR3.2	|ProductControllerTest, ProductDaoTest
FR3.3	|ProductControllerTest, ProductDaoTest
FR3.4	|ProductRoutesTest, ProductControllerTest
FR3.4.1|ProductRoutesTest, ProductControllerTest
FR3.5	|ProductRoutesTest, ProductControllerTest
FR3.5.1|	ProductRoutesTest, ProductControllerTest
FR3.7	|ProductControllerTest, ProductDaoTest
FR3.8	|ProductControllerTest, ProductDaoTest
FR4.1	|ReviewControllerTest, ReviewDaoTest
FR4.2	|ReviewRoutesTest, ReviewControllerTest
FR4.3	|ReviewControllerTest, ReviewDaoTest
FR4.4	|ReviewControllerTest, ReviewDaoTest
FR4.5|	ReviewControllerTest, ReviewDaoTest

/////////////////////////////////////////////////////////////////////

| Functional Requirement or scenario       | Test(s)                                                                                  |
| :--------------------------------------: | :-------------------------------------------------------------------------------------: |
| Creating a user                          | `creating user`, `create user - 200`, `create user - user already in db - 409`          |
| Retrieving all users                     | `get all users`, `get all users - route`, `get all users - user not admin - 401`        |
| Retrieving users by role                 | `get users by role`, `get users by role - route`, `get users by role - user not admin - 401` |
| Retrieving a user by username            | `get users by username`, `get user by username - route`, `get user by username - user not admin - 401` |
| Deleting a user                          | `delete a user`, `delete a user - route`, `delete a user - 503`                         |
| Deleting all users                       | `delete all users`, `delete all users - route`                                          |
| Updating user info                       | `update user info`, `update a user`, `update a user - user not found - 404`, `update a user - username does not match - 401`, `update a user - birthdate error - 400` |
| User login                               | `login`, `POST ezelectronics/sessions`                                                  |
| Getting current user session             | `get current session`, `GET ezelectronics/sessions/current`                             |
| Logging out                              | `logout`, `DELETE ezelectronics/sessions/current`                                       |


## Coverage white box

Report here the screenshot of coverage values obtained with jest-- coverage