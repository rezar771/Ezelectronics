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


## Coverage white box

Report here the screenshot of coverage values obtained with jest-- coverage
