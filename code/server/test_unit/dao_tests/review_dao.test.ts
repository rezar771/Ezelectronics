import { Database } from "sqlite3"
import {test, expect, jest, describe, beforeAll, afterAll,beforeEach,afterEach} from "@jest/globals";
import ReviewDAO from "../../src/dao/reviewDAO";
import db from "../../src/db/db";
import { User, Role } from "../../src/components/user";
import { ProductNotFoundError } from "../../src/errors/productError";
import { NoReviewProductError ,ExistingReviewError} from "../../src/errors/reviewError";
jest.mock("../../src/db/db.ts");

describe("reviewDAO", () => {
    beforeAll(() => {
        // Setup before all tests
    })

    afterAll(() => {
        // Cleanup after all tests
    })
    beforeEach(() => {
        jest.clearAllMocks();
    });
    afterEach(() => {
        jest.resetAllMocks();  // Reset all mocks after each test
    });
//add review : test if the product exists
    test("addReview should return undefined", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes("FROM products")) {
                callback(null, { count: 1 });
            } else if (sql.includes("FROM reviews")) {
                callback(null, { count: 0 });
            }
            return {} as Database;
        });

        const mockRUN = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });

        const reviewDAO = new ReviewDAO();
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "123 Test St", "2000-01-01");
        const result = await reviewDAO.addReview("testModel", user, 5, "Great product!");

        expect(result).toBeUndefined();
        expect(mockGET).toHaveBeenCalledTimes(2);
        expect(mockRUN).toHaveBeenCalledTimes(1);

        mockGET.mockRestore();
        mockRUN.mockRestore();
    });
    test("addReview should reject if there is a database error", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes("FROM products")) {
                callback(null, { count: 1 });
            } else if (sql.includes("FROM reviews")) {
                callback(null, { count: 0 });
            }
            return {} as Database;
        });

        const mockRUN = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"));
            return {} as Database;
        });

        const reviewDAO = new ReviewDAO();
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "123 Test St", "2000-01-01");

        await expect(reviewDAO.addReview("testModel", user, 5, "Great product!")).rejects.toThrow("Database error");

        expect(mockGET).toHaveBeenCalledTimes(2);
        expect(mockGET).toHaveBeenCalledWith(expect.any(String), ["testModel"], expect.any(Function));
        expect(mockGET).toHaveBeenCalledWith(expect.any(String), ["testModel", "testUser"], expect.any(Function));

        expect(mockRUN).toHaveBeenCalledTimes(1);
        expect(mockRUN.mock.calls[0][0].replace(/\s+/g, ' ').trim()).toBe("INSERT INTO reviews (model, user, score, date, comment) VALUES (?, ?, ?, ?, ?)");
        expect(mockRUN.mock.calls[0][1]).toEqual(["testModel", "testUser", 5, expect.any(String), "Great product!"]);
        expect(typeof mockRUN.mock.calls[0][2]).toBe('function');

        mockGET.mockRestore();
        mockRUN.mockRestore();
    });
    test("addReview should reject with ExistingReviewError if the review already exists", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes("FROM products")) {
                callback(null, { count: 1 });
            } else if (sql.includes("FROM reviews")) {
                callback(null, { count: 1 }); // Simulate existing review
            }
            return {} as Database;
        });

        const reviewDAO = new ReviewDAO();
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "123 Test St", "2000-01-01");

        await expect(reviewDAO.addReview("testModel", user, 5, "Great product!")).rejects.toThrow(ExistingReviewError);

        expect(mockGET).toHaveBeenCalledTimes(2);
        expect(mockGET).toHaveBeenCalledWith(expect.any(String), ["testModel"], expect.any(Function));
        expect(mockGET).toHaveBeenCalledWith(expect.any(String), ["testModel", "testUser"], expect.any(Function));

        mockGET.mockRestore();
    });
    test("addReview should reject if there is a database error when checking if the review exists", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes("FROM products")) {
                callback(null, { count: 1 });
            } else if (sql.includes("FROM reviews")) {
                callback(new Error("Database error"), null);
            }
            return {} as Database;
        });

        const reviewDAO = new ReviewDAO();
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "123 Test St", "2000-01-01");

        await expect(reviewDAO.addReview("testModel", user, 5, "Great product!")).rejects.toThrow("Database error");

        expect(mockGET).toHaveBeenCalledTimes(2);
        expect(mockGET).toHaveBeenCalledWith(expect.any(String), ["testModel"], expect.any(Function));
        expect(mockGET).toHaveBeenCalledWith(expect.any(String), ["testModel", "testUser"], expect.any(Function));

        mockGET.mockRestore();
    });
    test("addReview should reject with ProductNotFoundError if the product does not exist", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes("FROM products")) {
                callback(null, { count: 0 }); // Simulate product not found
            }
            return {} as Database;
        });

        const reviewDAO = new ReviewDAO();
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "123 Test St", "2000-01-01");

        await expect(reviewDAO.addReview("testModel", user, 5, "Great product!")).rejects.toThrow(ProductNotFoundError);

        expect(mockGET).toHaveBeenCalledTimes(1);
        expect(mockGET).toHaveBeenCalledWith(expect.any(String), ["testModel"], expect.any(Function));

        mockGET.mockRestore();
    });
    test("addReview should reject if there is a database error when checking if the product exists", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes("FROM products")) {
                callback(new Error("Database error"), null);
            }
            return {} as Database;
        });

        const reviewDAO = new ReviewDAO();
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "123 Test St", "2000-01-01");

        await expect(reviewDAO.addReview("testModel", user, 5, "Great product!")).rejects.toThrow("Database error");

        expect(mockGET).toHaveBeenCalledTimes(1);
        expect(mockGET).toHaveBeenCalledWith(expect.any(String), ["testModel"], expect.any(Function));

        mockGET.mockRestore();
    });
    test("addReview should reject if there is an error in the try block", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            throw new Error("Unexpected Error");
        });

        const reviewDAO = new ReviewDAO();
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "123 Test St", "2000-01-01");

        await expect(reviewDAO.addReview("testModel", user, 5, "Great product!")).rejects.toThrow("Unexpected Error");

        mockGET.mockRestore();
    });
//____________________________________________________________________________________________________________________
//get review
    test("getProductReviews should return reviews for the product", async () => {
        const mockALL = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            if (sql.includes("FROM reviews")) {
                callback(null, [
                    { model: "testModel", user: "user1", score: 5, comment: "Great product!", date: "2024-01-01" },
                    { model: "testModel", user: "user2", score: 4, comment: "Good product!", date: "2024-01-02" }
                ]);
            }
            return {} as Database;
        });

        const reviewDAO = new ReviewDAO();
        const reviews = await reviewDAO.getProductReviews("testModel");

        expect(reviews).toEqual([
            { model: "testModel", user: "user1", score: 5, comment: "Great product!", date: "2024-01-01" },
            { model: "testModel", user: "user2", score: 4, comment: "Good product!", date: "2024-01-02" }
        ]);

        expect(mockALL).toHaveBeenCalledTimes(1);

        mockALL.mockRestore();
    });
    test("getProductReviews should reject if there is an error", async () => {
        const mockALL = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"), null);
            return {} as Database;
        });

        const reviewDAO = new ReviewDAO();
        await expect(reviewDAO.getProductReviews("testModel")).rejects.toThrow("Database error");

        expect(mockALL).toHaveBeenCalledTimes(1);
        expect(mockALL).toHaveBeenCalledWith(
            expect.any(String),
            ["testModel"],
            expect.any(Function)
        );

        mockALL.mockRestore();
    });
    test("getProductReviews should reject if there is an error in the try block", async () => {
        const mockALL = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            throw new Error("Database error"); // Simulate an error being thrown
            return {} as Database;
        });

        const reviewDAO = new ReviewDAO();

        await expect(reviewDAO.getProductReviews("testModel")).rejects.toThrow("Database error");

        expect(mockALL).toHaveBeenCalledTimes(1);
        expect(mockALL).toHaveBeenCalledWith(expect.any(String), ["testModel"], expect.any(Function));

        mockALL.mockRestore();
    });
//____________________________________________________________________________________________________________________
//delete review
    test("deleteReview should resolve if the review is deleted successfully", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes("SELECT model FROM products WHERE model = ?")) {
                callback(null, { model: "testModel" });
            } else if (sql.includes("SELECT model FROM reviews WHERE model = ? AND user = ?")) {
                callback(null, { model: "testModel", user: "testUser" });
            }
            return {} as Database;
        });

        const mockRUN = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback.call({ changes: 1 }, null); // Simulate the context with changes
            return {} as Database;
        });

        const reviewDAO = new ReviewDAO();
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "123 Test St", "2000-01-01");
        await expect(reviewDAO.deleteReview("testModel", user)).resolves.toBeUndefined();

        expect(mockGET).toHaveBeenCalledTimes(2);
        expect(mockRUN).toHaveBeenCalledTimes(1);

        mockGET.mockRestore();
        mockRUN.mockRestore();
    });
    test("deleteReview should reject if there is a database error when checking if the product exists", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes("FROM products")) {
                callback(new Error("Database error"), null);
            }
            return {} as Database;
        });

        const reviewDAO = new ReviewDAO();
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "123 Test St", "2000-01-01");

        await expect(reviewDAO.deleteReview("testModel", user)).rejects.toThrow("Database error");

        expect(mockGET).toHaveBeenCalledTimes(1);
        expect(mockGET).toHaveBeenCalledWith(expect.any(String), ["testModel"], expect.any(Function));

        mockGET.mockRestore();
    });
    test("deleteReview should reject with ProductNotFoundError error if the product does not exist", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes("FROM products")) {
                callback(null, null); // Simulate product not found
            }
            return {} as Database;
        });

        const reviewDAO = new ReviewDAO();
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "123 Test St", "2000-01-01");

        await expect(reviewDAO.deleteReview("testModel", user)).rejects.toThrow(ProductNotFoundError);

        expect(mockGET).toHaveBeenCalledTimes(1);
        expect(mockGET).toHaveBeenCalledWith(expect.any(String), ["testModel"], expect.any(Function));

        mockGET.mockRestore();
    });
    test("deleteReview should reject if there is a database error when checking if the review exists", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes("FROM products")) {
                callback(null, { model: "testModel" });
            } else if (sql.includes("FROM reviews")) {
                callback(new Error("Database error"), null);
            }
            return {} as Database;
        });

        const reviewDAO = new ReviewDAO();
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "123 Test St", "2000-01-01");

        await expect(reviewDAO.deleteReview("testModel", user)).rejects.toThrow("Database error");

        expect(mockGET).toHaveBeenCalledTimes(2);
        expect(mockGET).toHaveBeenCalledWith(expect.any(String), ["testModel"], expect.any(Function));
        expect(mockGET).toHaveBeenCalledWith(expect.any(String), ["testModel", "testUser"], expect.any(Function));

        mockGET.mockRestore();
    });
    test("deleteReview should reject with NoReviewProductError if the user has no review for the product", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes("FROM products")) {
                callback(null, { model: "testModel" });
            } else if (sql.includes("FROM reviews")) {
                callback(null, null);
            }
            return {} as Database;
        });
    
        const reviewDAO = new ReviewDAO();
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "123 Test St", "2000-01-01");
    
        await expect(reviewDAO.deleteReview("testModel", user)).rejects.toThrow(NoReviewProductError);
    
        expect(mockGET).toHaveBeenCalledTimes(2);
        expect(mockGET).toHaveBeenCalledWith(expect.any(String), ["testModel"], expect.any(Function));
        expect(mockGET).toHaveBeenCalledWith(expect.any(String), ["testModel", "testUser"], expect.any(Function));
    
        mockGET.mockRestore();
    });
    
    test("deleteReview should reject if there is a database error when deleting the review", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes("FROM products")) {
                callback(null, { model: "testModel" });
            } else if (sql.includes("FROM reviews")) {
                callback(null, { model: "testModel", user: "testUser" });
            }
            return {} as Database;
        });

        const mockRUN = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"));
            return {} as Database;
        });

        const reviewDAO = new ReviewDAO();
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "123 Test St", "2000-01-01");

        await expect(reviewDAO.deleteReview("testModel", user)).rejects.toThrow("Database error");

        expect(mockGET).toHaveBeenCalledTimes(2);
        expect(mockGET).toHaveBeenCalledWith(expect.any(String), ["testModel"], expect.any(Function));
        expect(mockGET).toHaveBeenCalledWith(expect.any(String), ["testModel", "testUser"], expect.any(Function));

        expect(mockRUN).toHaveBeenCalledTimes(1);
        expect(mockRUN).toHaveBeenCalledWith(expect.any(String), ["testModel", "testUser"], expect.any(Function));

        mockGET.mockRestore();
        mockRUN.mockRestore();
    });

//____________________________________________________________________________________________________________________
//delete review of product

    test("deleteReviewsOfProduct should reject if there is a database error when checking if the product exists", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes("FROM products")) {
                callback(new Error("Database error"), null);
            }
            return {} as Database;
        });

        const reviewDAO = new ReviewDAO();

        await expect(reviewDAO.deleteReviewsOfProduct("testModel")).rejects.toThrow("Database error");

        expect(mockGET).toHaveBeenCalledTimes(1);
        expect(mockGET).toHaveBeenCalledWith(expect.any(String), ["testModel"], expect.any(Function));

        mockGET.mockRestore();
    });
    test("deleteReviewsOfProduct should reject with ProductNotFoundError if the product does not exist", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes("FROM products")) {
                callback(null, null); // Simulate product not found
            }
            return {} as Database;
        });

        const reviewDAO = new ReviewDAO();

        await expect(reviewDAO.deleteReviewsOfProduct("testModel")).rejects.toThrow(ProductNotFoundError);

        expect(mockGET).toHaveBeenCalledTimes(1);
        expect(mockGET).toHaveBeenCalledWith(expect.any(String), ["testModel"], expect.any(Function));

        mockGET.mockRestore();
    });
    test("deleteReviewsOfProduct should reject if there is a database error when deleting the reviews", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes("FROM products")) {
                callback(null, { model: "testModel" });
            }
            return {} as Database;
        });

        const mockRUN = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"));
            return {} as Database;
        });

        const reviewDAO = new ReviewDAO();

        await expect(reviewDAO.deleteReviewsOfProduct("testModel")).rejects.toThrow("Database error");

        expect(mockGET).toHaveBeenCalledTimes(1);
        expect(mockGET).toHaveBeenCalledWith(expect.any(String), ["testModel"], expect.any(Function));

        expect(mockRUN).toHaveBeenCalledTimes(1);
        expect(mockRUN).toHaveBeenCalledWith(expect.any(String), ["testModel"], expect.any(Function));

        mockGET.mockRestore();
        mockRUN.mockRestore();
    });
    test("deleteReviewsOfProduct should resolve if all reviews are deleted successfully", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes("SELECT model FROM products WHERE model = ?")) {
                callback(null, { model: "testModel" });
            }
            return {} as Database;
        });

        const mockRUN = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });

        const reviewDAO = new ReviewDAO();
        await expect(reviewDAO.deleteReviewsOfProduct("testModel")).resolves.toBeUndefined();

        expect(mockGET).toHaveBeenCalledTimes(1);
        expect(mockRUN).toHaveBeenCalledTimes(1);

        mockGET.mockRestore();
        mockRUN.mockRestore();
    });
    test("deleteAllReviews should resolve if all reviews are deleted successfully", async () => {
        const mockRUN = jest.spyOn(db, "run").mockImplementation((sql, callback) => {
            if (typeof callback === 'function') {
                callback(null);
            }
            return {} as Database;
        });

        const reviewDAO = new ReviewDAO();
        await expect(reviewDAO.deleteAllReviews()).resolves.toBeUndefined();

        expect(mockRUN).toHaveBeenCalledTimes(1);
        expect(mockRUN.mock.calls[0][0].replace(/\s+/g, ' ').trim()).toBe("DELETE FROM reviews");
        expect(typeof mockRUN.mock.calls[0][1]).toBe('function');

        mockRUN.mockRestore();
    });

});
test("deleteAllReviews should reject if there is a database error when deleting the reviews", async () => {
    const runMock = jest.spyOn(db, 'run').mockImplementation((sql, callback) => {
        callback(new Error("Database error"));
            return {} as Database;
      });
  
      const reviewDAO = new ReviewDAO();
      await expect(reviewDAO.deleteAllReviews()).rejects.toThrow('Database error');
  
      // Restore the original function after the test
      runMock.mockRestore();
});