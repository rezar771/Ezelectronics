import { test, expect, jest } from "@jest/globals"
import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import  { Request, Response, NextFunction } from "express";
import { User, Role } from "../../src/components/user"
 
jest.mock("../../src/dao/userDAO")

//Example of a unit test for the createUser method of the UserController
//The test checks if the method returns true when the DAO method returns true
//The test also expects the DAO method to be called once with the correct parameters

test("creating user", async () => {
    const testUser = { //Define a test user object
        username: "test",
        name: "test",
        surname: "test",
        password: "test",
        role: "Manager"
    }
    jest.spyOn(UserDAO.prototype, "createUser").mockResolvedValueOnce(true); //Mock the createUser method of the DAO
    const controller = new UserController(); //Create a new instance of the controller
    //Call the createUser method of the controller with the test user object
    const response = await controller.createUser(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role);

    //Check if the createUser method of the DAO has been called once with the correct parameters
    expect(UserDAO.prototype.createUser).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.createUser).toHaveBeenCalledWith(testUser.username,
        testUser.name,
        testUser.surname,
        testUser.password,
        testUser.role);
    expect(response).toBe(true); //Check if the response is true
});
///////////////////////////////////////////////

test("get all users", async () => {

    const mockUsers: User[] = [
        {
          username: 'john_doe',
          name: 'John',
          surname: 'Doe',
          role: Role.ADMIN,
          address: '123 Main St',
          birthdate: '1990-01-01',
        },
        // Add more mock users as needed
      ];
    
      jest.spyOn(UserDAO.prototype, 'getAllUsers').mockImplementation(() => {
        return Promise.resolve(mockUsers);
      });
    const controller = new UserController(); //Create a new instance of the controller

    //Call the createUser method of the controller with the test user object
    const response = await controller.getUsers();

    //Check if the createUser method of the DAO has been called once with the correct parameters
    expect(UserDAO.prototype.getAllUsers).toHaveBeenCalledTimes(1);
    expect(response).toBe(mockUsers); //Check if the response mockusers
});

///////////////////////////////////////////////

test("get users by role", async () => {

    const mockUsers: User[] = [
        {
          username: 'john_doe',
          name: 'John',
          surname: 'Doe',
          role: Role.ADMIN,
          address: '123 Main St',
          birthdate: '1990-01-01',
        },
        // Add more mock users as needed
      ];
    
      jest.spyOn(UserDAO.prototype, 'getUsersByRole').mockImplementation(() => {
        return Promise.resolve(mockUsers);
      });
    const controller = new UserController(); //Create a new instance of the controller

    //Call the createUser method of the controller with the test user object
    const response = await controller.getUsersByRole(Role.ADMIN);

    //Check if the createUser method of the DAO has been called once with the correct parameters
    expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledTimes(1);
    expect(response).toBe(mockUsers); //Check if the response mockusers
});
//////////////////////////////////////////////////

test("get users by username", async () => {
    const mockUser: User = {
        username: 'john_doe',
        name: 'John',
        surname: 'Doe',
        role: Role.ADMIN,
        address: '123 Main St',
        birthdate: '1990-01-01',
    };

    // Mock the getUserByUsername method
    jest.spyOn(UserDAO.prototype, 'getUserByUsername').mockImplementation((username: string) => {
        return Promise.resolve(mockUser);
    });

    const controller = new UserController(); // Create a new instance of the controller

    // Call the getUserByUsername method of the controller with the test username
    const response = await controller.getUserByUsername( mockUser, 'john_doe');

    // Check if the getUserByUsername method of the DAO has been called once
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
    // Check if the response is the mock user
    expect(response).toBe(mockUser);
});

//////////////////////////////////////////////////

test("delete a user", async () => {
    const mockUser: User = {
        username: 'john_doe',
        name: 'John',
        surname: 'Doe',
        role: Role.CUSTOMER,
        address: '123 Main St',
        birthdate: '1990-01-01',
    };

    // Mock the deleteUser method
    jest.spyOn(UserDAO.prototype, 'deleteUser').mockImplementation(( username: string) => {
        return Promise.resolve(true);
    });

    const controller = new UserController(); // Create a new instance of the controller

    // Call the deleteUser method of the controller with the test user and username
    const response = await controller.deleteUser(mockUser, 'john_doe');

    // Check if the deleteUser method of the DAO has been called once
    expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(1);
    // Check if the response is true
    expect(response).toBe(true);
});

//////////////////////////////////////////////////

test("delete all users", async () => {
    const mockUser: User = {
        username: 'john_doe',
        name: 'John',
        surname: 'Doe',
        role: Role.CUSTOMER,
        address: '123 Main St',
        birthdate: '1990-01-01',
    };

    // Mock the deleteUser method
    jest.spyOn(UserDAO.prototype, 'deleteAllUsers').mockImplementation(() => {
        return Promise.resolve(true);
    });

    const controller = new UserController(); // Create a new instance of the controller

    // Call the deleteUser method of the controller with the test user and username
    const response = await controller.deleteAll();

    // Check if the deleteUser method of the DAO has been called once
    expect(UserDAO.prototype.deleteAllUsers).toHaveBeenCalledTimes(1);
    // Check if the response is true
    expect(response).toBe(true);
});

//////////////////////////////////////////////////

test("update user info", async () => {
    const mockUser: User = {
        username: 'john_doe',
        name: 'John',
        surname: 'Doe',
        role: Role.CUSTOMER,
        address: '123 Main St',
        birthdate: '1990-01-01',
    };

    const updatedUser: User = {
        ...mockUser,
        name: 'John Updated',
        surname: 'Doe Updated',
        address: '456 Another St',
        birthdate: '1991-01-01',
    };

    // Mock the updateUserInfo method
    jest.spyOn(UserDAO.prototype, 'updateUserInfo').mockImplementation(() => {
        return Promise.resolve(updatedUser);
    });

    const controller = new UserController(); // Create a new instance of the controller

    // Call the updateUserInfo method of the controller with the test user and updated info
    const response = await controller.updateUserInfo(mockUser, 'John Updated', 'Doe Updated', '456 Another St', '1991-01-01', 'john_doe');

    // Check if the updateUserInfo method of the DAO has been called once
    expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledTimes(1);
    // Check if the response is the updated user
    expect(response).toEqual(updatedUser);
});
