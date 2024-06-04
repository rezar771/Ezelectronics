import {test, expect, jest, describe, beforeAll, afterAll,beforeEach,afterEach} from "@jest/globals"
import ProductDAO from "../../src/dao/productDAO"
import db from "../../src/db/db"
import { Database, FULL } from "sqlite3"
import { ProductAlreadyExistsError, ProductNotFoundError ,LowProductStockError,EmptyProductStockError} from "../../src/errors/productError"
import { DateError } from "../../src/utilities"
jest.mock("../../src/db/db.ts");

// product used as test
const testProd ={
    model : "prodModel",
    category : "Smartphone",
    quantity : 10,
    details : "prodDetails",
    sellingPrice : 1,
    arrivalDate : "2024-05-25",}

describe("ProductDAO", () => {
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
//register products
    test("register product - production registration with success", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null)    // doesn't find any row, so return null
            return {} as Database
        });
        const mockRUN = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        });
        const product = new ProductDAO();
        const result = await product.registerProducts("prodModel", "Smartphone", 10, "prodDetails", 1, "2024-05-25")
        expect(result).toBe(undefined)
        expect(mockGET).toHaveBeenCalledTimes(1);
        expect(mockGET).toHaveBeenCalledWith(
            "SELECT * FROM products WHERE model = ?", ["prodModel"], expect.any(Function)
        );

        expect(mockRUN).toHaveBeenCalledTimes(1);
        expect(mockRUN).toHaveBeenCalled();
        const callArgs = mockRUN.mock.calls[0];
        expect(callArgs[0].replace(/\s+/g, ' ')).toBe("INSERT INTO products (model, category, quantity, details, sellingPrice, arrivalDate) VALUES (?, ?, ?, ?, ?, ?)");
        expect(callArgs[1]).toEqual(["prodModel", "Smartphone", 10, "prodDetails", 1, "2024-05-25"]);
        expect(typeof callArgs[2]).toBe('function');

        mockGET.mockRestore();
        mockRUN.mockRestore();
    });
    test("register product - product already exists", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, testProd)    // product already registered
            return {} as Database
        });

        const product = new ProductDAO();
        await expect(product.registerProducts("prodModel", "Smartphone", 1, "prodDetails", 1, "2024-05-25")).rejects.toThrow(ProductAlreadyExistsError)
        expect(mockGET).toHaveBeenCalledTimes(1);
        expect(mockGET).toHaveBeenCalledWith(
            "SELECT * FROM products WHERE model = ?", [testProd.model], expect.any(Function)
        )
        mockGET.mockRestore()
    })
    test("register product - product registration with null details", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null)
            return {} as Database
        });
        const mockRUN = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        });
        const product = new ProductDAO();
        const result = await product.registerProducts("prodModel", "Smartphone", 10, null, 1, "2024-05-25")
        expect(result).toBe(undefined)
        expect(mockGET).toHaveBeenCalledTimes(1);
        expect(mockGET).toHaveBeenCalledWith(
            "SELECT * FROM products WHERE model = ?", ["prodModel"], expect.any(Function)
        );

        expect(mockRUN).toHaveBeenCalledTimes(1);
        expect(mockRUN).toHaveBeenCalled();
        const callArgs = mockRUN.mock.calls[0];
        expect(callArgs[0].replace(/\s+/g, ' ')).toBe("INSERT INTO products (model, category, quantity, details, sellingPrice, arrivalDate) VALUES (?, ?, ?, ?, ?, ?)");
        expect(callArgs[1]).toEqual(["prodModel", "Smartphone", 10, null, 1, "2024-05-25"]);
        expect(typeof callArgs[2]).toBe('function');

        mockGET.mockRestore();
        mockRUN.mockRestore();
    });
    test("register product - product registration with null arrivalDate", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null)
            return {} as Database
        });
        const mockRUN = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        });
        const product = new ProductDAO();
        const result = await product.registerProducts("prodModel", "Smartphone", 10, "prodDetails", 1, null)
        expect(result).toBe(undefined)
        expect(mockGET).toHaveBeenCalledTimes(1);
        expect(mockGET).toHaveBeenCalledWith(
            "SELECT * FROM products WHERE model = ?", ["prodModel"], expect.any(Function)
        );

        expect(mockRUN).toHaveBeenCalledTimes(1);
        expect(mockRUN).toHaveBeenCalled();
        const callArgs = mockRUN.mock.calls[0];
        expect(callArgs[0].replace(/\s+/g, ' ')).toBe("INSERT INTO products (model, category, quantity, details, sellingPrice, arrivalDate) VALUES (?, ?, ?, ?, ?, ?)");
        expect(callArgs[1]).toEqual(["prodModel", "Smartphone", 10, "prodDetails", 1, expect.any(String)]);
        expect(typeof callArgs[2]).toBe('function');

        mockGET.mockRestore();
        mockRUN.mockRestore();
    });
    test("register product - throws DateError if arrivalDate is after the current date", async () => {
        const productDAO = new ProductDAO();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);
        await expect(productDAO.registerProducts("prodModel", "Smartphone", 10, "prodDetails", 1, futureDate.toISOString().slice(0, 10))).rejects.toThrow(DateError);
    });
    test("register product - handles database insertion error", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });
        const mockRUN = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("Insertion Error"));
            return {} as Database;
        });
        const productDAO = new ProductDAO();
        await expect(productDAO.registerProducts("prodModel", "Smartphone", 10, "prodDetails", 1, "2024-05-25")).rejects.toThrow("Insertion Error");

        mockGET.mockRestore();
        mockRUN.mockRestore();
    });
    test("register product - handles unexpected error in try-catch block", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            throw new Error("Unexpected Error");
        });
        const productDAO = new ProductDAO();
        await expect(productDAO.registerProducts("prodModel", "Smartphone", 10, "prodDetails", 1, "2024-05-25")).rejects.toThrow("Unexpected Error");

        mockGET.mockRestore();
    });
    test("register product - handles database retrieval error in db.get", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error("Retrieval Error"), null);
            return {} as Database;
        });

        const productDAO = new ProductDAO();
        await expect(productDAO.registerProducts("prodModel", "Smartphone", 10, "prodDetails", 1, "2024-05-25")).rejects.toThrow("Retrieval Error");

        mockGET.mockRestore();
    });
    test("change product quantity - handles database retrieval error in db.get", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error("Retrieval Error"), null);
            return {} as Database;
        });

        const productDAO = new ProductDAO();
        await expect(productDAO.changeProductQuantity("prodModel", 5, "2024-05-25")).rejects.toThrow("Retrieval Error");

        mockGET.mockRestore();
    });
//____________________________________________________________________________________________________________________
// get products
    test("get products - get an existing product by category", async () => {
        // Mock the db.all method
        const mockALL = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
            callback(null, [testProd]);
            return {} as any; // TypeScript requires this cast to prevent type errors
        });

        const productDAO = new ProductDAO();
        const result = await productDAO.getProducts("category", "Smartphone", null);

        // Assertions
        expect(result).toBeDefined(); // Ensure the result is defined
        expect(Array.isArray(result)).toBe(true); // Ensure the result is an array
        expect(result.length).toBe(1); // Ensure the array has one element
        expect(result[0]).toEqual(testProd); // Ensure the result matches the mock product

        expect(mockALL).toHaveBeenCalledTimes(1);
        expect(mockALL).toHaveBeenCalledWith(
            "SELECT * FROM products WHERE category = 'Smartphone'",
            expect.any(Function)
        );

            mockALL.mockRestore();
        });
    test("get products - get an existing product by model", async () => {
        // Mock the db.all method
        const mockALL = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
            callback(null, [testProd]);
            return {} as any; // TypeScript requires this cast to prevent type errors
        });

        const productDAO = new ProductDAO();
        const result = await productDAO.getProducts("model", null, "prodModel");

        // Assertions
        expect(result).toBeDefined(); // Ensure the result is defined
        expect(Array.isArray(result)).toBe(true); // Ensure the result is an array
        expect(result.length).toBe(1); // Ensure the array has one element
        expect(result[0]).toEqual(testProd); // Ensure the result matches the mock product

        expect(mockALL).toHaveBeenCalledTimes(1);
        expect(mockALL).toHaveBeenCalledWith(
            "SELECT * FROM products WHERE model = 'prodModel'",
            expect.any(Function)
        );

        mockALL.mockRestore();
    });
    test("get products - category not found", async () => {
        const mockALL = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
            callback(null, null)
            return {} as Database
        })

        const product = new ProductDAO()
        const result = await product.getProducts("category", "nonexistingCategory", "prodModel")
        expect(result).toBe(null)
        expect(mockALL).toHaveBeenCalledTimes(1)
        expect(mockALL).toHaveBeenCalledWith(
            "SELECT * FROM products WHERE category = 'nonexistingCategory'",
            expect.any(Function)
        )
        mockALL.mockRestore()
    })
    test("get products - model not found", async () => {
        const mockALL = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
            callback(null, []);
            return {} as any; // TypeScript requires this cast to prevent type errors
        });

        const productDAO = new ProductDAO();

        await expect(productDAO.getProducts("model", null, "nonexistingModel")).rejects.toThrow(ProductNotFoundError);

        expect(mockALL).toHaveBeenCalledTimes(1);
        expect(mockALL).toHaveBeenCalledWith(
            "SELECT * FROM products WHERE model = 'nonexistingModel'",
            expect.any(Function)
        );

        mockALL.mockRestore();
    });
    test("get products - handles database retrieval error", async () => {
        const mockALL = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
            callback(new Error("Retrieval Error"));
            return {} as any;
        });

        const productDAO = new ProductDAO();
        await expect(productDAO.getProducts(null, null, null)).rejects.toThrow("Retrieval Error");

        mockALL.mockRestore();
    });
    test("get products - handles unexpected error in try-catch block", async () => {
        const mockALL = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
            throw new Error("Unexpected Error");
        });

        const productDAO = new ProductDAO();
        await expect(productDAO.getProducts(null, null, null)).rejects.toThrow("Unexpected Error");

        mockALL.mockRestore();
    });
//____________________________________________________________________________________________________________________
// available products
    test("available products - get available products by category", async () => {
        const mockALL = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
            if (typeof callback === 'function') {
                callback(null, [
                    {
                        sellingPrice: 1,
                        model: "prodModel",
                        category: "Smartphone",
                        arrivalDate: "2024-05-25",
                        details: "prodDetails",
                        quantity: 1
                    }
                ]);
            }
            return {} as Database;
        });

        const productDAO = new ProductDAO();
        const result = await productDAO.getAvailableProducts("category", "Smartphone", null);

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(1);
        expect(result[0].model).toBe("prodModel");
        expect(mockALL).toHaveBeenCalledTimes(1);
        expect(mockALL).toHaveBeenCalledWith(
            "SELECT * FROM products WHERE quantity > 0 AND category = 'Smartphone'",
            expect.any(Function)
        );

        mockALL.mockRestore();
    });
    test("available products - get available products by model", async () => {
        const mockALL = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
            callback(null, [testProd]);
            return {} as any; // TypeScript requires this cast to prevent type errors
        });

        const productDAO = new ProductDAO();
        const result = await productDAO.getAvailableProducts("model", null, "prodModel");

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(1);
        expect(result[0].model).toBe("prodModel");
        expect(mockALL).toHaveBeenCalledTimes(1);
        expect(mockALL).toHaveBeenCalledWith(
            "SELECT * FROM products WHERE quantity > 0 AND model = 'prodModel'",
            expect.any(Function)
        );

        mockALL.mockRestore();
    });
    test("available products - category not found", async () => {
        const mockALL = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
            callback(null, []); // Return an empty array to simulate no products found
            return {} as any; // TypeScript requires this cast to prevent type errors
        });

        const productDAO = new ProductDAO();
        const result = await productDAO.getAvailableProducts("category", "nonexistingCategory", null);

        // Assertions
        expect(Array.isArray(result)).toBe(true); // Ensure the result is an array
        expect(result.length).toBe(0); // Ensure the array is empty

        expect(mockALL).toHaveBeenCalledTimes(1);
        expect(mockALL).toHaveBeenCalledWith(
            "SELECT * FROM products WHERE quantity > 0 AND category = 'nonexistingCategory'",
            expect.any(Function)
        );

        mockALL.mockRestore();
    });
    test("available products - model not found", async () => {
        const mockALL = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
            callback(null, []); // Return an empty array to simulate no products found
            return {} as any; // TypeScript requires this cast to prevent type errors
        });

        const productDAO = new ProductDAO();

        await expect(productDAO.getAvailableProducts("model", null, "nonexistingModel")).rejects.toThrow(ProductNotFoundError);

        expect(mockALL).toHaveBeenCalledTimes(1);
        expect(mockALL).toHaveBeenCalledWith(
            "SELECT * FROM products WHERE quantity > 0 AND model = 'nonexistingModel'",
            expect.any(Function)
        );

        mockALL.mockRestore();
    });
    test("available products - products not found", async () => {
        const mockALL = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
            callback(null, []);
            return {} as any; // TypeScript requires this cast to prevent type errors
        });

        const productDAO = new ProductDAO();

        await expect(productDAO.getAvailableProducts("model", null, "nonexistingModel")).rejects.toThrow(ProductNotFoundError);

        expect(mockALL).toHaveBeenCalledTimes(1);
        expect(mockALL).toHaveBeenCalledWith(
            "SELECT * FROM products WHERE quantity > 0 AND model = 'nonexistingModel'",
            expect.any(Function)
        );

        mockALL.mockRestore();
    });
    test("get available products - handles database retrieval error", async () => {
        const mockALL = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
            callback(new Error("Retrieval Error"));
            return {} as any;
        });

        const productDAO = new ProductDAO();
        await expect(productDAO.getAvailableProducts(null, null, null)).rejects.toThrow("Retrieval Error");

        mockALL.mockRestore();
    });
    test("get available products - handles unexpected error in try-catch block", async () => {
        const mockALL = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
            throw new Error("Unexpected Error");
        });

        const productDAO = new ProductDAO();
        await expect(productDAO.getAvailableProducts(null, null, null)).rejects.toThrow("Unexpected Error");

        mockALL.mockRestore();
    });
//____________________________________________________________________________________________________________________
// change quantity
    test("change quantity - product's quantity changed with success", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, testProd);    // return the selected product
            return {} as Database;
        });

        const mockRUN = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);   // no return value needed for run
            return {} as Database;
        });

        const product = new ProductDAO();
        const newQuantity = 2;
        const result = await product.changeProductQuantity("prodModel", newQuantity, "2024-05-27");
        expect(result).toBe(12);  // return the new specified quantity (10 + 2)
        expect(mockGET).toHaveBeenCalledTimes(1);
        expect(mockGET).toHaveBeenCalledWith(
            "SELECT * FROM products WHERE model = ?", [testProd.model], expect.any(Function)
        );
        expect(mockRUN).toHaveBeenCalledTimes(1);
        expect(mockRUN).toHaveBeenCalledWith(
            "UPDATE products SET quantity = ? WHERE model = ?", [12, "prodModel"], expect.any(Function)
        );
        mockGET.mockRestore();
        mockRUN.mockRestore();
    });
    test("change quantity - product not found", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback() // product not found
            return {} as Database
        })
        const product = new ProductDAO()
        const newQuantity = 2
        await expect(product.changeProductQuantity("prodModel", newQuantity, "2024-05-27")).rejects.toThrow(ProductNotFoundError)
        expect(mockGET).toHaveBeenCalledTimes(1)
        expect(mockGET).toHaveBeenCalledWith(
            "SELECT * FROM products WHERE model = ?", [testProd.model], expect.any(Function)
        )
        mockGET.mockRestore()
    })
    test("change quantity - change date before arrival date", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, testProd);    // arrivalDate: 2024-05-25
            return {} as any; // TypeScript requires this cast to prevent type errors
        });

        const productDAO = new ProductDAO();
        const newQuantity = 2;

        await expect(productDAO.changeProductQuantity("prodModel", newQuantity, "2024-05-23")).rejects.toThrow(DateError);

        mockGET.mockRestore();
    });
    test("change quantity - decrease product's quantity successfully", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, testProd);    // return the selected product
            return {} as Database;
        });

        const mockRUN = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);   // no return value needed for run
            return {} as Database;
        });

        const product = new ProductDAO();
        const newQuantity = -5;
        const result = await product.changeProductQuantity("prodModel", newQuantity, "2024-05-27");
        expect(result).toBe(5);  // return the new specified quantity (10 - 5)
        expect(mockGET).toHaveBeenCalledTimes(1);
        expect(mockGET).toHaveBeenCalledWith(
            "SELECT * FROM products WHERE model = ?", [testProd.model], expect.any(Function)
        );
        expect(mockRUN).toHaveBeenCalledTimes(1);
        expect(mockRUN).toHaveBeenCalledWith(
            "UPDATE products SET quantity = ? WHERE model = ?", [5, "prodModel"], expect.any(Function)
        );
        mockGET.mockRestore();
        mockRUN.mockRestore();
    });
    test("change quantity - set product's quantity to zero", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, testProd);    // return the selected product
            return {} as Database;
        });

        const mockRUN = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);   // no return value needed for run
            return {} as Database;
        });

        const product = new ProductDAO();
        const newQuantity = -10;
        const result = await product.changeProductQuantity("prodModel", newQuantity, "2024-05-27");
        expect(result).toBe(0);  // return the new specified quantity (10 - 10)
        expect(mockGET).toHaveBeenCalledTimes(1);
        expect(mockGET).toHaveBeenCalledWith(
            "SELECT * FROM products WHERE model = ?", [testProd.model], expect.any(Function)
        );
        expect(mockRUN).toHaveBeenCalledTimes(1);
        expect(mockRUN).toHaveBeenCalledWith(
            "UPDATE products SET quantity = ? WHERE model = ?", [0, "prodModel"], expect.any(Function)
        );
        mockGET.mockRestore();
        mockRUN.mockRestore();
    });
    test("change product quantity - throws DateError if changeDate is after the current date", async () => {
        const productDAO = new ProductDAO();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);
        await expect(productDAO.changeProductQuantity("prodModel", 5, futureDate.toISOString().slice(0, 10))).rejects.toThrow(DateError);
    });
    test("change product quantity - sets changeDate to today if not provided", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, testProd);
            return {} as Database;
        });
        const mockRUN = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });
        const productDAO = new ProductDAO();
        const result = await productDAO.changeProductQuantity("prodModel", 5, null);

        const today = new Date().toISOString().slice(0, 10);
        expect(mockRUN).toHaveBeenCalledWith(
            "UPDATE products SET quantity = ? WHERE model = ?", [15, "prodModel"], expect.any(Function)
        );

        mockGET.mockRestore();
        mockRUN.mockRestore();
    });
    test("change product quantity - handles database update error", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, testProd);
            return {} as Database;
        });
        const mockRUN = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("Update Error"));
            return {} as Database;
        });
        const productDAO = new ProductDAO();
        await expect(productDAO.changeProductQuantity("prodModel", 5, "2024-05-25")).rejects.toThrow("Update Error");

        mockGET.mockRestore();
        mockRUN.mockRestore();
    });
    test("change product quantity - handles unexpected error in try-catch block", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            throw new Error("Unexpected Error");
        });
        const productDAO = new ProductDAO();
        await expect(productDAO.changeProductQuantity("prodModel", 5, "2024-05-25")).rejects.toThrow("Unexpected Error");

        mockGET.mockRestore();
    });
//____________________________________________________________________________________________________________________
// sell product
    test("sellProduct - sell a product with success", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, testProd);
            return {} as any;
        });

        const mockRUN = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as any;
        });

        const productDAO = new ProductDAO();
        const sellingQuantity = 1;
        const result = await productDAO.sellProduct("prodModel", sellingQuantity, "2024-05-27");

        expect(result).toBe(9); // The expected quantity should be the remaining quantity

        expect(mockGET).toHaveBeenCalledTimes(1);
        expect(mockGET).toHaveBeenCalledWith(
            "SELECT * FROM products WHERE model = ?",
            ["prodModel"],
            expect.any(Function)
        );

        expect(mockRUN).toHaveBeenCalledTimes(1);
        expect(mockRUN).toHaveBeenCalledWith(
            "UPDATE products SET quantity = ? WHERE model = ?",
            [9, "prodModel"],
            expect.any(Function)
        );

        mockGET.mockRestore();
        mockRUN.mockRestore();
    });
    test("sellProduct - product not found", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null)
            return {} as Database
        })

        const product = new ProductDAO()
        const sellingQuantity = 2
        await expect (product.sellProduct("prodModel", sellingQuantity, "2024-05-27")).rejects.toThrow(ProductNotFoundError)
        expect(mockGET).toHaveBeenCalledTimes(1)
        expect(mockGET).toHaveBeenCalledWith(
            "SELECT * FROM products WHERE model = ?", [testProd.model], expect.any(Function)
        )
        mockGET.mockRestore()
    })
    test("sellProduct - selling date before arrival date", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, testProd)    // arrivalDate: 2024-05-25
            return {} as Database
        })

        const product = new ProductDAO()
        await expect (product.sellProduct("prodModel", 2, "2024-05-23")).rejects.toThrow(DateError)
        expect(mockGET).toHaveBeenCalledTimes(1)
        expect(mockGET).toHaveBeenCalledWith(
            "SELECT * FROM products WHERE model = ?", [testProd.model], expect.any(Function)
        )
        mockGET.mockRestore()
    })
    test("sellProduct - selected quantity more than available quantity", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, testProd)    // quantity: 10
            return {} as Database
        })

        const product = new ProductDAO()
        await expect (product.sellProduct("prodModel", 12, "2024-05-27")).rejects.toThrow(LowProductStockError)
        expect(mockGET).toHaveBeenCalledTimes(1)
        expect(mockGET).toHaveBeenCalledWith(
            "SELECT * FROM products WHERE model = ?", [testProd.model], expect.any(Function)
        )
        mockGET.mockRestore()
        jest.clearAllMocks()
    })
    test("sellProduct - sell all units of a product", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, testProd);
            return {} as any;
        });

        const mockRUN = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as any;
        });

        const productDAO = new ProductDAO();
        const sellingQuantity = 10;
        const result = await productDAO.sellProduct("prodModel", sellingQuantity, "2024-05-27");

        expect(result).toBe(0); // The expected quantity should be the remaining quantity

        expect(mockGET).toHaveBeenCalledTimes(1);
        expect(mockGET).toHaveBeenCalledWith(
            "SELECT * FROM products WHERE model = ?",
            ["prodModel"],
            expect.any(Function)
        );

        expect(mockRUN).toHaveBeenCalledTimes(1);
        expect(mockRUN).toHaveBeenCalledWith(
            "UPDATE products SET quantity = ? WHERE model = ?",
            [0, "prodModel"],
            expect.any(Function)
        );

        mockGET.mockRestore();
        mockRUN.mockRestore();
    });
    test("sellProduct - sell product with quantity zero", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { ...testProd, quantity: 0 });
            return {} as any;
        });

        const productDAO = new ProductDAO();
        await expect(productDAO.sellProduct("prodModel", 5, "2024-05-27")).rejects.toThrow(EmptyProductStockError);

        expect(mockGET).toHaveBeenCalledTimes(1);
        expect(mockGET).toHaveBeenCalledWith(
            "SELECT * FROM products WHERE model = ?",
            ["prodModel"],
            expect.any(Function)
        );

        mockGET.mockRestore();
    });
    test("sell product - throws DateError if sellingDate is after the current date", async () => {
        const productDAO = new ProductDAO();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);
        await expect(productDAO.sellProduct("prodModel", 5, futureDate.toISOString().slice(0, 10))).rejects.toThrow(DateError);
    });
    test("sell product - handles database update error", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, testProd);
            return {} as Database;
        });
        const mockRUN = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("Update Error"));
            return {} as Database;
        });
        const productDAO = new ProductDAO();
        await expect(productDAO.sellProduct("prodModel", 5, "2024-05-25")).rejects.toThrow("Update Error");

        mockGET.mockRestore();
        mockRUN.mockRestore();
    });
    test("sell product - handles database update error", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, testProd);
            return {} as Database;
        });
        const mockRUN = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("Update Error"));
            return {} as Database;
        });
        const productDAO = new ProductDAO();
        await expect(productDAO.sellProduct("prodModel", 5, "2024-05-25")).rejects.toThrow("Update Error");

        mockGET.mockRestore();
        mockRUN.mockRestore();
    });
    test("sell product - handles unexpected error in try-catch block", async () => {
        const mockGET = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            throw new Error("Unexpected Error");
        });
        const productDAO = new ProductDAO();
        await expect(productDAO.sellProduct("prodModel", 5, "2024-05-25")).rejects.toThrow("Unexpected Error");

        mockGET.mockRestore();
    });
//____________________________________________________________________________________________________________________
// delete all products
    test("deleteAllProducts - delete all products with success", async () => {
        const mockRUN = jest.spyOn(db, "run").mockImplementation(function (sql, callback) {
            callback.call({ changes: 1 }, null); // Ensure `this` context has `changes`
            return {} as any; // Mock the result
        });

        const productDAO = new ProductDAO();
        const result = await productDAO.deleteAllProducts();

        expect(result).toBe(true);
        expect(mockRUN).toHaveBeenCalledTimes(1);
        expect(mockRUN).toHaveBeenCalledWith(
            "DELETE FROM products",
            expect.any(Function)
        );

        mockRUN.mockRestore();
        jest.clearAllMocks();
    });
    test("delete all products - handles database deletion error", async () => {
        const mockRUN = jest.spyOn(db, "run").mockImplementation((sql, callback) => {
            callback(new Error("Deletion Error"));
            return {} as any;
        });

        const productDAO = new ProductDAO();
        await expect(productDAO.deleteAllProducts()).rejects.toThrow("Deletion Error");

        mockRUN.mockRestore();
    });
    test("delete all products - returns false if no products were deleted", async () => {
        const mockRUN = jest.spyOn(db, "run").mockImplementation(function (sql, callback) {
            callback.call({ changes: 0 }, null); // Simulate no rows affected
            return {} as any;
        });

        const productDAO = new ProductDAO();
        const result = await productDAO.deleteAllProducts();
        expect(result).toBe(false);

        mockRUN.mockRestore();
    });
    test("delete all products - handles unexpected error in try-catch block", async () => {
        const mockRUN = jest.spyOn(db, "run").mockImplementation((sql, callback) => {
            throw new Error("Unexpected Error");
        });

        const productDAO = new ProductDAO();
        await expect(productDAO.deleteAllProducts()).rejects.toThrow("Unexpected Error");

        mockRUN.mockRestore();
    });
//____________________________________________________________________________________________________________________
// delete product
    test("deleteProduct - delete a product with success", async () => {
        const mockRUN = jest.spyOn(db, "run").mockImplementation(function (sql, params, callback) {
            callback.call({ changes: 1 }, null); // Ensure `this` context has `changes`
            return {} as any;
        });

        const productDAO = new ProductDAO();
        const result = await productDAO.deleteProduct("prodModel");

        expect(result).toBe(true);
        expect(mockRUN).toHaveBeenCalledTimes(1);
        expect(mockRUN).toHaveBeenCalledWith(
            "DELETE FROM products WHERE model = ?",
            ["prodModel"],
            expect.any(Function)
        );

        mockRUN.mockRestore();
        jest.clearAllMocks();
    });
    test("deleteProduct - product not found", async () => {
        const mockRUN = jest.spyOn(db, "run").mockImplementation(function (sql, params, callback) {
            callback.call({ changes: 0 }, null); // Simulate no changes made
            return {} as any;
        });

        const productDAO = new ProductDAO();

        await expect(productDAO.deleteProduct("prodModel")).rejects.toThrow(ProductNotFoundError);

        expect(mockRUN).toHaveBeenCalledTimes(1);
        expect(mockRUN).toHaveBeenCalledWith(
            "DELETE FROM products WHERE model = ?",
            ["prodModel"],
            expect.any(Function)
        );

        mockRUN.mockRestore();
        jest.clearAllMocks();
    });
    test("delete product - handles database deletion error", async () => {
        const mockRUN = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("Deletion Error"));
            return {} as any;
        });

        const productDAO = new ProductDAO();
        await expect(productDAO.deleteProduct("prodModel")).rejects.toThrow("Deletion Error");

        mockRUN.mockRestore();
    });
    test("delete product - handles unexpected error in try-catch block", async () => {
        const mockRUN = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            throw new Error("Unexpected Error");
        });

        const productDAO = new ProductDAO();
        await expect(productDAO.deleteProduct("prodModel")).rejects.toThrow("Unexpected Error");

        mockRUN.mockRestore();
    });
});

