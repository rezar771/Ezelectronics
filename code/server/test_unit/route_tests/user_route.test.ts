import { test, expect, jest ,beforeEach,afterEach,afterAll, describe} from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import Authenticator from "../../src/routers/auth"
import UserController from "../../src/controllers/userController"
import { Role, User } from "../../src/components/user"
import ErrorHandler from "../../src/helper"
import { error } from "console"
import {UserAlreadyExistsError , UserNotAdminError, UserNotFoundError, UnauthorizedUserError} from '../../src/errors/userError'
import { DateError } from "../../src/utilities"
const baseURL = "/ezelectronics"

//Example of a unit test for the POST ezelectronics/users route
//The test checks if the route returns a 200 success code
//The test also expects the createUser method of the controller to be called once with the correct parameters
jest.mock("../../src/controllers/userController")
jest.mock("../../src/routers/auth")

// beforeEach(() => {
//     jest.clearAllMocks();
// });
// afterEach(() => {
//     jest.resetAllMocks();  // Reset all mocks after each test
// });

let testAdmin = new User("admin", "admin", "admin", Role.ADMIN, "", "")
let testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "")

test("create user - 200", async () => {
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
////////////////////////////////////////////
test("create user - user already in db - 409", async () => {
    const testUser = {
        username: "test",
        name: "test",
        surname: "test",
        password: "test",
        role: "Manager"
    };

    // Mocking the `createUser` method to simulate a 409 conflict error
    jest.spyOn(UserController.prototype, "createUser").mockImplementationOnce(() => {
        const error = new UserAlreadyExistsError();  // Assuming you have a custom error for this scenario
        throw error;
    });

    const response = await request(app).post(baseURL + "/users").send(testUser);
    expect(response.status).toBe(409);
    expect(response.body.error).toBe("The username already exists");  // Ensure the error message matches your implementation
});

////////////////////////////////////////////

test("get all users", async () => {
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
////////////////////////////////////////////

test("get all users - user not admin - 401", async () => {
    //The route we are testing calls the getUsers method of the UserController and the isAdmin method of the Authenticator
    //We mock the 'getUsers' method to return an array of users, because we are not testing the UserController logic here (we assume it works correctly)
    jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce([testAdmin, testCustomer])
    jest.spyOn(Authenticator.prototype,"isLoggedIn").mockImplementationOnce((req, res, next) => (next())) //Mock the isLoggedIn method of the Authenticator
    //We mock the 'isAdmin' method to return the next function, because we are not testing the Authenticator logic here (we assume it works correctly)
    jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => res.status(401).json({error: "User is not admin", status: 401}))

    //We send a request to the route we are testing. We are in a situation where:
    //  - The user is an Admin (= the Authenticator logic is mocked to be correct)
    //  - The getUsers function returns an array of users (= the UserController logic is mocked to be correct)
    //We expect the 'getUsers' function to have been called, the route to return a 200 success code and the expected array
    const response = await request(app).get(baseURL + "/users")
    expect(response.status).toBe(401)
    expect(response.body.error).toBe("User is not admin");
})
///////////////////////////////////////////

let testCustomer2 = new User("customer", "customer", "Customer", Role.ADMIN, " ", " ");

test("It returns an array of users with a specific role", async () => {
    //The route we are testing calls the getUsersByRole method of the UserController, the isAdmin method of the Authenticator, and the param method of the express-validator
    //We mock the 'getUsersByRole' method to return an array of users, because we are not testing the UserController logic here (we assume it works correctly)
    jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValueOnce([testCustomer2])
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next());
    //We mock the 'isAdmin' method to return the next function, because we are not testing the Authenticator logic here (we assume it works correctly)
    jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
        return next();
    })
    //We mock the 'param' method of the express-validator to throw an error, because we are not testing the validation logic here (we assume it works correctly)
    jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
            isString: () => ({ isLength: () => ({}) }),
            isIn: () => ({ isLength: () => ({}) }),
        })),
    }))
    //We call the route with the mocked dependencies. We expect the 'getUsersByRole' function to have been called, the route to return a 200 success code and the expected array
    const response = await request(app).get(baseURL + "/users/roles/Admin")
    expect(response.status).toBe(200)
    expect(UserController.prototype.getUsersByRole).toHaveBeenCalled()
    expect(UserController.prototype.getUsersByRole).toHaveBeenCalledWith("Admin")
    expect(response.body).toEqual([testCustomer2])
})
///////////////////////////////////////////

let testCustomer3 = new User("customer", "customer", "Customer", Role.CUSTOMER, " ", " ");

test("It returns an array of users with a specific role - user not admin - 401", async () => {
    //The route we are testing calls the getUsersByRole method of the UserController, the isAdmin method of the Authenticator, and the param method of the express-validator
    //We mock the 'getUsersByRole' method to return an array of users, because we are not testing the UserController logic here (we assume it works correctly)
    jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValueOnce([testCustomer3])
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next());
    //We mock the 'isAdmin' method to return the next function, because we are not testing the Authenticator logic here (we assume it works correctly)
    jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => res.status(401).json({error: "User is not admin", status: 401}))
    //We mock the 'param' method of the express-validator to throw an error, because we are not testing the validation logic here (we assume it works correctly)
    jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
            isString: () => ({ isLength: () => ({}) }),
            isIn: () => ({ isLength: () => ({}) }),
        })),
    }))
    //We call the route with the mocked dependencies. We expect the 'getUsersByRole' function to have been called, the route to return a 200 success code and the expected array
    const response = await request(app).get(baseURL + "/users/roles/CUSTOMER")
    expect(response.status).toBe(401)
    expect(response.body.error).toBe("User is not admin");
})
///////////////////////////////////////////

test("It should fail if the role is not valid", async () => {
    //In this case we are testing a scenario where the role parameter is not among the three allowed ones
    //We need the 'isAdmin' method to return the next function, because the route checks if the user is an Admin before validating the role
    jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {return next()});
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next());
    //We mock the 'param' method of the express-validator to throw an error, because we are not testing the validation logic here (we assume it works correctly)
    jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => {
            throw new Error("Invalid value");
        }),
    }));
    //We mock the 'validateRequest' method to receive an error and return a 422 error code, because we are not testing the validation logic here (we assume it works correctly)
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
        return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
    })
    //We call the route with dependencies mocked to simulate an error scenario, and expect a 422 code
    const response = await request(app).get(baseURL + "/users/roles/Invalid")
    expect(response.status).toBe(422)
})
//////////////////////////////////////////

let testAdmin2 = new User("username", "username", "username", Role.ADMIN, " ", " ");

test("It returns a user by username", async () => {
    //The route we are testing calls the getUsersByRole method of the UserController, the isAdmin method of the Authenticator, and the param method of the express-validator
    //We mock the 'getUsersByRole' method to return an array of users, because we are not testing the UserController logic here (we assume it works correctly)
    jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValueOnce(testAdmin2)
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next());
    //We mock the 'isAdmin' method to return the next function, because we are not testing the Authenticator logic here (we assume it works correctly)
    // jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
    //     return next();
    // })
    //We mock the 'param' method of the express-validator to throw an error, because we are not testing the validation logic here (we assume it works correctly)
    jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
            isString: () => ({ isLength: () => ({}) }),
            isIn: () => ({ isLength: () => ({}) }),
        })),
    }))
    //We call the route with the mocked dependencies. We expect the 'getUsersByRole' function to have been called, the route to return a 200 success code and the expected array
    const response = await request(app).get(baseURL + "/users/username")
    expect(response.status).toBe(200)
    expect(UserController.prototype.getUserByUsername).toHaveBeenCalled()
    expect(UserController.prototype.getUserByUsername).toHaveBeenCalledWith(undefined ,"username")
    expect(response.body).toEqual(testAdmin2)
})

//////////////////////////////////////////

test("It returns a user by username - user not admin - 401", async () => {
    //The route we are testing calls the getUsersByRole method of the UserController, the isAdmin method of the Authenticator, and the param method of the express-validator
    //We mock the 'getUsersByRole' method to return an array of users, because we are not testing the UserController logic here (we assume it works correctly)
    jest.spyOn(UserController.prototype, "getUserByUsername").mockImplementationOnce(() => {
        const error = new UserNotAdminError();  // Assuming you have a custom error for this scenario
        throw error;
    });
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next());
    //We mock the 'isAdmin' method to return the next function, because we are not testing the Authenticator logic here (we assume it works correctly)
    //jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => res.status(401).json({error: "User is not admin", status: 401}))
    //We mock the 'param' method of the express-validator to throw an error, because we are not testing the validation logic here (we assume it works correctly)
    jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
            isString: () => ({ isLength: () => ({}) }),
            isIn: () => ({ isLength: () => ({}) }),
        })),
    }))
    //We call the route with the mocked dependencies. We expect the 'getUsersByRole' function to have been called, the route to return a 200 success code and the expected array
    const response = await request(app).get(baseURL + "/users/username")
    expect(response.status).toBe(401)
    expect(response.body.error).toBe("This operation can be performed only by an admin");
})

//////////////////////////////////////////

let testAdmin3 = new User("username", "username", "username", Role.CUSTOMER, " ", " ");

test("It returns a user by username - user not found - 404", async () => {
    //The route we are testing calls the getUsersByRole method of the UserController, the isAdmin method of the Authenticator, and the param method of the express-validator
    //We mock the 'getUsersByRole' method to return an array of users, because we are not testing the UserController logic here (we assume it works correctly)
    jest.spyOn(UserController.prototype, "getUserByUsername").mockImplementationOnce(() => {
        const error = new UserNotFoundError();  // Assuming you have a custom error for this scenario
        throw error;
    });
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next());
    //We mock the 'isAdmin' method to return the next function, because we are not testing the Authenticator logic here (we assume it works correctly)
    //jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => res.status(401).json({error: "User is not admin", status: 401}))
    //We mock the 'param' method of the express-validator to throw an error, because we are not testing the validation logic here (we assume it works correctly)
    jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
            isString: () => ({ isLength: () => ({}) }),
            isIn: () => ({ isLength: () => ({}) }),
        })),
    }))
    //We call the route with the mocked dependencies. We expect the 'getUsersByRole' function to have been called, the route to return a 200 success code and the expected array
    const response = await request(app).get(baseURL + "/users/username")
    expect(response.status).toBe(404)
    expect(response.body.error).toBe("The user does not exist");
})
//////////////////////////////////////////
test("delete a user", async () => {
    jest.spyOn(UserController.prototype, "deleteUser").mockResolvedValueOnce(true)
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next());
    //We mock the 'param' method of the express-validator to throw an error, because we are not testing the validation logic here (we assume it works correctly)
    jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
            isString: () => ({ isLength: () => ({}) }),
            isIn: () => ({ isLength: () => ({}) }),
        })),
    }))
    //We call the route with the mocked dependencies. We expect the 'getUsersByRole' function to have been called, the route to return a 200 success code and the expected array
    const response = await request(app).delete(baseURL + "/users/username")
    expect(response.status).toBe(200)
    expect(UserController.prototype.deleteUser).toHaveBeenCalled()
})

//////////////////////////////////////////

test("delete a user - 503", async () => {
    //The route we are testing calls the getUsersByRole method of the UserController, the isAdmin method of the Authenticator, and the param method of the express-validator
    //We mock the 'getUsersByRole' method to return an array of users, because we are not testing the UserController logic here (we assume it works correctly)
    jest.spyOn(UserController.prototype, "deleteUser").mockRejectedValueOnce(error);
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next());
    //We mock the 'isAdmin' method to return the next function, because we are not testing the Authenticator logic here (we assume it works correctly)
    jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
        return next();
    })

    const response = await request(app).delete(baseURL + "/users/username")
    expect(response.status).toBe(503)
    expect(UserController.prototype.deleteUser).toHaveBeenCalled()
})

//////////////////////////////////////////
test("delete all users", async () => {
    jest.spyOn(UserController.prototype, "deleteAll").mockResolvedValueOnce(true)
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next());
    //We mock the 'param' method of the express-validator to throw an error, because we are not testing the validation logic here (we assume it works correctly)
    jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
            isString: () => ({ isLength: () => ({}) }),
            isIn: () => ({ isLength: () => ({}) }),
        })),
    }))
    //We call the route with the mocked dependencies. We expect the 'getUsersByRole' function to have been called, the route to return a 200 success code and the expected array
    const response = await request(app).delete(baseURL + "/users")
    expect(response.status).toBe(200)
    expect(UserController.prototype.deleteAll).toHaveBeenCalled()
})

//////////////////////////////////////////
test("update a user", async () => {
    const testUser = { //Define a test user object sent to the route
        User,
        username: "test",
        name: "test",
        surname: "test",
        role: Role.CUSTOMER,
        address: 'test',
        birthdate: '1234-12-12'
    }
    jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValueOnce(testUser) //Mock the createUser method of the controller
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {next()});
    jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
            isString: () => ({ isLength: () => ({}) }),
            isIn: () => ({ isLength: () => ({}) }),
        })),
    }))

    const response = await request(app).patch(baseURL + "/users/username").send(testUser)
    expect(response.status).toBe(200) //Check if the response status is 200
    expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(1) //Check if the createUser method has been called once
  
})
//////////////////////////////////////////
test("update a user - user not found - 404", async () => {
    const testUser = {
        username: "test",
        name: "test",
        surname: "test",
        role: Role.CUSTOMER,
        address: 'test',
        birthdate: '1234-12-12'
    };

    // Mocking the `updateUserInfo` method to simulate a 404 Not Found error
    jest.spyOn(UserController.prototype, "updateUserInfo").mockImplementationOnce(() => {
        throw new UserNotFoundError(); 
    });

    // Mocking isLoggedIn method
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next());

    // Mocking express-validator
    jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
            isString: () => ({ isLength: () => ({}) }),
            isIn: () => ({ isLength: () => ({}) }),
        })),
    }));

    const response = await request(app).patch(baseURL + "/users/test").send(testUser);
    expect(response.status).toBe(404); // Check if the response status is 404
    expect(response.body.error).toBe("The user does not exist"); // Ensure the error message matches your implementation
});
//////////////////////////////////////////

test("update a user - username does not match - 401", async () => {
    const testUser = {
        username: "test",
        name: "test",
        surname: "test",
        role: Role.CUSTOMER,
        address: 'test',
        birthdate: '1234-12-12'
    };

    // Mock the `updateUserInfo` method to throw an UnauthorizedUserError if the username does not match
    jest.spyOn(UserController.prototype, "updateUserInfo").mockImplementationOnce((user) => {
            throw new UnauthorizedUserError();
    });

    // Mock the `isLoggedIn` middleware
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
        req.user = { username: "loggedInUsername" }; // Mock the logged-in user
        next();
    });

    // Mocking express-validator
    jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
            isString: () => ({ isLength: () => ({}) }),
            isIn: () => ({ isLength: () => ({}) }),
        })),
    }));

    const response = await request(app).patch(baseURL + "/users/test").send(testUser);
    expect(response.status).toBe(401); // Check if the response status is 401
    expect(response.body.error).toBe("You cannot access the information of other users"); // Ensure the error message matches your implementation
});

//////////////////////////////////////////

test("update a user - user not found - 404", async () => {
    const testUser = {
        username: "test",
        name: "test",
        surname: "test",
        role: Role.CUSTOMER,
        address: 'test',
        birthdate: '1234-12-12'
    };

    // Mocking the `updateUserInfo` method to simulate a 404 Not Found error
    jest.spyOn(UserController.prototype, "updateUserInfo").mockImplementationOnce(() => {
        throw new DateError(); 
    });

    // Mocking isLoggedIn method
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next());
    

    // Mocking express-validator
    jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
            isString: () => ({ isLength: () => ({}) }),
            isIn: () => ({ isLength: () => ({}) }),
        })),
    }));

    const response = await request(app).patch(baseURL + "/users/test").send(testUser);
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Input date is not compatible with the current date");
});