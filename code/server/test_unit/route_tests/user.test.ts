import { test, expect, jest ,beforeEach,afterEach,afterAll} from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import Authenticator from "../../src/routers/auth"
import UserController from "../../src/controllers/userController"
import { Role, User } from "../../src/components/user"
const baseURL = "/ezelectronics"

//Example of a unit test for the POST ezelectronics/users route
//The test checks if the route returns a 200 success code
//The test also expects the createUser method of the controller to be called once with the correct parameters
jest.mock("../../src/controllers/userController")
jest.mock("../../src/routers/auth")

beforeEach(() => {
    jest.clearAllMocks();
});
afterEach(() => {
    jest.resetAllMocks();  // Reset all mocks after each test
});

let testAdmin = new User("admin", "admin", "admin", Role.ADMIN, "", "")
let testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "")

test("It should return a 200 success code", async () => {
    const testUser = { //Define a test user object sent to the route
        username: "test",
        name: "test",
        surname: "test",
        password: "test",
        role: "Manager"
    }
    jest.spyOn(UserController.prototype, "createUser").mockResolvedValueOnce(true) //Mock the createUser method of the controller
    const response = await request(app).post(baseURL + "/users").send(testUser) //Send a POST request to the route
    expect(response.status).toBe(200) //Check if the response status is 200
    expect(UserController.prototype.createUser).toHaveBeenCalledTimes(1) //Check if the createUser method has been called once
    //Check if the createUser method has been called with the correct parameters
    expect(UserController.prototype.createUser).toHaveBeenCalledWith(testUser.username,
        testUser.name,
        testUser.surname,
        testUser.password,
        testUser.role)
})
test("It returns an array of users", async () => {
    //The route we are testing calls the getUsers method of the UserController and the isAdmin method of the Authenticator
    //We mock the 'getUsers' method to return an array of users, because we are not testing the UserController logic here (we assume it works correctly)
    jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce([testAdmin, testCustomer])
    jest.spyOn(Authenticator.prototype,"isLoggedIn").mockImplementationOnce((req, res, next) => (next())) //Mock the isLoggedIn method of the Authenticator
    //We mock the 'isAdmin' method to return the next function, because we are not testing the Authenticator logic here (we assume it works correctly)
    jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
        return next();
    })

    //We send a request to the route we are testing. We are in a situation where:
    //  - The user is an Admin (= the Authenticator logic is mocked to be correct)
    //  - The getUsers function returns an array of users (= the UserController logic is mocked to be correct)
    //We expect the 'getUsers' function to have been called, the route to return a 200 success code and the expected array
    const response = await request(app).get(baseURL + "/users")
    expect(response.status).toBe(200)
    expect(UserController.prototype.getUsers).toHaveBeenCalled()
    expect(response.body).toEqual([testAdmin, testCustomer])
})
