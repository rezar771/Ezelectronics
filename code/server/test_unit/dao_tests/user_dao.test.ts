import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"
import UserDAO from "../../src/dao/userDAO"
import crypto from "crypto"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { Role, User } from "../../src/components/user"
import { UserAlreadyExistsError, UserNotFoundError, UserIsAdminError, UnauthorizedUserError } from "../../src/errors/userError"
import { DateError } from "../../src/utilities"

jest.mock("crypto")
jest.mock("../../src/db/db.ts")

describe("UserDAO Tests", () => {
    let userDAO: UserDAO;

    beforeAll(() => {
        userDAO = new UserDAO();
    });

    afterAll(() => {
        jest.clearAllMocks();
    });

    test("createUser - should resolve true", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });
        const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
            return Buffer.from("salt");
        });
        const mockScryptSync = jest.spyOn(crypto, "scryptSync").mockImplementation((password, salt, keylen) => {
            return Buffer.from("hashedPassword");
        });

        const result = await userDAO.createUser("username", "name", "surname", "password", "role");
        expect(result).toBe(true);

        mockRandomBytes.mockRestore();
        mockDBRun.mockRestore();
        mockScryptSync.mockRestore();
    });

    test("createUser - should throw UserAlreadyExistsError", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            const error = new Error("UNIQUE constraint failed: users.username");
            callback(error);
            return {} as Database;
        });

        await expect(userDAO.createUser("username", "name", "surname", "password", "role"))
            .rejects
            .toThrow(UserAlreadyExistsError);

        mockDBRun.mockRestore();
    });

    test("createUser - should reject on other errors", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            const error = new Error("Some other error");
            callback(error);
            return {} as Database;
        });

        await expect(userDAO.createUser("username", "name", "surname", "password", "role"))
            .rejects
            .toThrow("Some other error");

        mockDBRun.mockRestore();
    });

    test("getIsUserAuthenticated - should resolve true", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, {
                username: 'username',
                password: Buffer.from('hashedPassword').toString('hex'),
                salt: 'salt'
            });
            return {} as Database;
        });
        const mockScryptSync = jest.spyOn(crypto, "scryptSync").mockImplementation((password, salt, keylen) => {
            return Buffer.from("hashedPassword");
        });
        const mockTimingSafeEqual = jest.spyOn(crypto, "timingSafeEqual").mockImplementation((a, b) => {
            return true;
        });

        const result = await userDAO.getIsUserAuthenticated("username", "password");
        expect(result).toBe(true);

        mockDBGet.mockRestore();
        mockScryptSync.mockRestore();
        mockTimingSafeEqual.mockRestore();
    });

    test("getIsUserAuthenticated - should resolve false", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        const result = await userDAO.getIsUserAuthenticated("username", "password");
        expect(result).toBe(false);

        mockDBGet.mockRestore();
    });

    test("getIsUserAuthenticated - should reject on error", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error("Some error"), null);
            return {} as Database;
        });

        await expect(userDAO.getIsUserAuthenticated("username", "password"))
            .rejects
            .toThrow("Some error");

        mockDBGet.mockRestore();
    });

    test("getUserByUsername - should resolve user object", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, {
                username: 'username',
                name: 'John',
                surname: 'Doe',
                role: 'ADMIN',
                address: '123 Main St',
                birthdate: '1990-01-01'
            });
            return {} as Database;
        });

        const result = await userDAO.getUserByUsername("username");
        expect(result).toEqual({
            username: 'username',
            name: 'John',
            surname: 'Doe',
            role: 'ADMIN',
            address: '123 Main St',
            birthdate: '1990-01-01'
        });

        mockDBGet.mockRestore();
    });

    test("getUserByUsername - should throw UserNotFoundError", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        await expect(userDAO.getUserByUsername("username"))
            .rejects
            .toThrow(UserNotFoundError);

        mockDBGet.mockRestore();
    });

    test("getUserByUsername - should reject on error", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error("Some error"), null);
            return {} as Database;
        });

        await expect(userDAO.getUserByUsername("username"))
            .rejects
            .toThrow("Some error");

        mockDBGet.mockRestore();
    });

    test("getAllUsers - should resolve user array", async () => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
            callback(null, [
                {
                    username: 'username1',
                    name: 'John',
                    surname: 'Doe',
                    role: 'ADMIN',
                    address: '123 Main St',
                    birthdate: '1990-01-01'
                },
                {
                    username: 'username2',
                    name: 'Jane',
                    surname: 'Smith',
                    role: 'USER',
                    address: '456 Elm St',
                    birthdate: '1985-05-15'
                }
            ]);
            return {} as Database;
        });

        const result = await userDAO.getAllUsers();
        expect(result).toEqual([
            {
                username: 'username1',
                name: 'John',
                surname: 'Doe',
                role: 'ADMIN',
                address: '123 Main St',
                birthdate: '1990-01-01'
            },
            {
                username: 'username2',
                name: 'Jane',
                surname: 'Smith',
                role: 'USER',
                address: '456 Elm St',
                birthdate: '1985-05-15'
            }
        ]);

        mockDBAll.mockRestore();
    });

    test("getAllUsers - should reject on error", async () => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
            callback(new Error("Some error"), null);
            return {} as Database;
        });

        await expect(userDAO.getAllUsers())
            .rejects
            .toThrow("Some error");

        mockDBAll.mockRestore();
    });

    test("getUsersByRole - should resolve user array", async () => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [
                {
                    username: 'username1',
                    name: 'John',
                    surname: 'Doe',
                    role: 'ADMIN',
                    address: '123 Main St',
                    birthdate: '1990-01-01'
                },
                {
                    username: 'username2',
                    name: 'Jane',
                    surname: 'Smith',
                    role: 'ADMIN',
                    address: '456 Elm St',
                    birthdate: '1985-05-15'
                }
            ]);
            return {} as Database;
        });

        const result = await userDAO.getUsersByRole('ADMIN');
        expect(result).toEqual([
            {
                username: 'username1',
                name: 'John',
                surname: 'Doe',
                role: 'ADMIN',
                address: '123 Main St',
                birthdate: '1990-01-01'
            },
            {
                username: 'username2',
                name: 'Jane',
                surname: 'Smith',
                role: 'ADMIN',
                address: '456 Elm St',
                birthdate: '1985-05-15'
            }
        ]);

        mockDBAll.mockRestore();
    });

    test("getUsersByRole - should reject on error", async () => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error("Some error"), null);
            return {} as Database;
        });

        await expect(userDAO.getUsersByRole('ADMIN'))
            .rejects
            .toThrow("Some error");

        mockDBAll.mockRestore();
    });

    test("deleteUser - should resolve true", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { role: 'USER' });
            return {} as Database;
        });
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });

        const result = await userDAO.deleteUser("username");
        expect(result).toBe(true);

        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });

    test("deleteUser - should throw UserNotFoundError", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        await expect(userDAO.deleteUser("username"))
            .rejects
            .toThrow(UserNotFoundError);

        mockDBGet.mockRestore();
    });

    test("deleteUser - should reject on error", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error("Some error"), null);
            return {} as Database;
        });

        await expect(userDAO.deleteUser("username"))
            .rejects
            .toThrow("Some error");

        mockDBGet.mockRestore();
    });

    test("deleteUser - should reject on delete error", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { role: 'USER' });
            return {} as Database;
        });
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("Some delete error"));
            return {} as Database;
        });

        await expect(userDAO.deleteUser("username"))
            .rejects
            .toThrow("Some delete error");

        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });

    test("deleteAllUsers - should resolve true", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, callback) => {
            if (typeof callback === 'function') {
                callback(null);
            }
            return {} as Database;
        });

        const result = await userDAO.deleteAllUsers();
        expect(result).toBe(true);

        mockDBRun.mockRestore();
    });

    test("deleteAllUsers - should reject on error", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, callback) => {
            if (typeof callback === 'function') {
                callback(new Error("Some error"));
            }
            return {} as Database;
        });

        await expect(userDAO.deleteAllUsers())
            .rejects
            .toThrow("Some error");

        mockDBRun.mockRestore();
    });

    test("updateUserInfo - should resolve updated user", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { role: Role.ADMIN, username: 'username1' });
            return {} as Database;
        });
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });

        const user = new User("username1", "oldName", "oldSurname", Role.CUSTOMER, "oldAddress", "1980-01-01");
        const result = await userDAO.updateUserInfo(user, "newName", "newSurname", "newAddress", "1990-01-01", "username1");

        expect(result).toEqual({
            username: 'username1',
            name: 'newName',
            surname: 'newSurname',
            role: Role.CUSTOMER,
            address: 'newAddress',
            birthdate: '1990-01-01'
        });

        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });

    test("updateUserInfo - should throw UserNotFoundError", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        const user = new User("username1", "oldName", "oldSurname", Role.CUSTOMER, "oldAddress", "1980-01-01");
        await expect(userDAO.updateUserInfo(user, "newName", "newSurname", "newAddress", "1990-01-01", "username1"))
            .rejects
            .toThrow(UserNotFoundError);

        mockDBGet.mockRestore();
    });

    test("updateUserInfo - should reject on error", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error("Some error"), null);
            return {} as Database;
        });

        const user = new User("username1", "oldName", "oldSurname", Role.CUSTOMER, "oldAddress", "1980-01-01");
        await expect(userDAO.updateUserInfo(user, "newName", "newSurname", "newAddress", "1990-01-01", "username1"))
            .rejects
            .toThrow("Some error");

        mockDBGet.mockRestore();
    });

    test("updateUserInfo - should throw UserIsAdminError", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { role: Role.ADMIN, username: 'username1' });
            return {} as Database;
        });

        const user = new User("username1", "oldName", "oldSurname", Role.ADMIN, "oldAddress", "1980-01-01");
        await expect(userDAO.updateUserInfo(user, "newName", "newSurname", "newAddress", "1990-01-01", "username2"))
            .rejects
            .toThrow(UserIsAdminError);

        mockDBGet.mockRestore();
    });

    test("updateUserInfo - should reject on error during update", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { role: Role.ADMIN, username: 'username1' });
            return {} as Database;
        });
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("Some update error"));
            return {} as Database;
        });

        const user = new User("username1", "oldName", "oldSurname", Role.CUSTOMER, "oldAddress", "1980-01-01");
        await expect(userDAO.updateUserInfo(user, "newName", "newSurname", "newAddress", "1990-01-01", "username1"))
            .rejects
            .toThrow("Some update error");

        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });

    test("updateUserInfo - should throw DateError", async () => {
        const user = new User("username1", "oldName", "oldSurname", Role.CUSTOMER, "oldAddress", "1980-01-01");
        await expect(userDAO.updateUserInfo(user, "newName", "newSurname", "newAddress", "2090-01-01", "username1"))
            .rejects
            .toThrow(DateError);
    });

    test("updateUserInfo - should resolve updated user after handling UserIsAdminError", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { role: Role.CUSTOMER, username: 'username1' });
            return {} as Database;
        });
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });

        const user = new User("username1", "oldName", "oldSurname", Role.CUSTOMER, "oldAddress", "1980-01-01");
        const result = await userDAO.updateUserInfo(user, "newName", "newSurname", "newAddress", "1990-01-01", "username1");

        expect(result).toEqual({
            username: 'username1',
            name: 'newName',
            surname: 'newSurname',
            role: Role.CUSTOMER,
            address: 'newAddress',
            birthdate: '1990-01-01'
        });

        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });
});
