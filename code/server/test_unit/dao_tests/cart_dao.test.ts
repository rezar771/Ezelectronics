import { test, describe, expect, jest, afterEach     } from "@jest/globals"
import CartDao from "../../src/dao/cartDAO"
import { CartNotFoundError, EmptyCartError, ProductNotInCartError } from "../../src/errors/cartError";
import { ProductNotFoundError, ProductSoldError, EmptyProductStockError } from "../../src/errors/productError";
import db from "../../src/db/db";
import { Cart, ProductInCart } from "../../src/components/cart";
import { Category } from "../../src/components/product";
import { Role, User } from "../../src/components/user";


jest.mock("../../src/db/db", () => ({
    all: jest.fn(),
    get: jest.fn(),
    run: jest.fn(),
  }));

afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
});

let mockUser: User;
let Dao: CartDao;

beforeEach(() => {
    Dao = new CartDao();
    mockUser = { username: "testuser",
        name:"user",
        surname:"user",
        role:Role.CUSTOMER,
        address:"",
        birthdate:""
     };
  });



describe("get Cart", ()=>{
    test("should return an empty cart if no unpaid cart is found", async () => {
        (db.all as jest.Mock).mockImplementation((query: string, params: any[], callback: (err: Error | null, rows: any[]) => void) => {
            callback(null, []);
          });
    
        const cart = await Dao.getCart(mockUser);
    
        expect(cart).toEqual({
          customer: mockUser.username,
          paid: false,
          paymentDate: null,
          total: 0,
          products: [],
        });
      });

    test("should return a cart with products if an unpaid cart is found", async () => {
    (db.all as jest.Mock).mockImplementation((query: string, params: any[], callback: (err: Error | null, rows: any[]) => void) => {
      callback(null, [
        { customer: "testuser", model: "product1", cost: 100, amount: 2, paid: false },
        { customer: "testuser", model: "product2", cost: 50, amount: 1, paid: false },
      ]);
    });

    (db.get as jest.Mock).mockImplementation((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
      if (params[0] === "product1") {
        callback(null, { model: "product1", category: Category.SMARTPHONE, sellingPrice: 120 });
      } else if (params[0] === "product2") {
        callback(null, { model: "product2", category: Category.LAPTOP, sellingPrice: 70 });
      }
    });

    const cart = await Dao.getCart(mockUser);

    expect(cart).toEqual({
      customer: "testuser",
      paid: false,
      paymentDate: undefined,
      total: 250, // 100*2 + 50*1
      products: [
        new ProductInCart("product1", 2, Category.SMARTPHONE, 120),
        new ProductInCart("product2", 1, Category.LAPTOP, 70),
      ],
    });
  });

  test("should handle errors when fetching product details", async () => {
    (db.all as jest.Mock).mockImplementation((query: string, params: any[], callback: (err: Error | null, rows: any[]) => void) => {
      callback(null, [
        { customer: "testuser", model: "product1", cost: 100, amount: 2, paid: false },
      ]);
    });

    (db.get as jest.Mock).mockImplementation((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
      callback(new Error("Product details error"), null);
    });

    await expect(Dao.getCart(mockUser)).rejects.toThrow("Product details error");
  });
});

describe("addToCart", () => {

    test("should add a product to a new cart if no unpaid cart exists", async () => {
        const productId = "product1";
    
        (db.get as jest.Mock).mockImplementation((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
          if (query.includes("SELECT * FROM products")) {
            callback(null, { model: productId, quantity: 10, sellingPrice: 100 });
          } else if (query.includes("SELECT cartId, amount FROM carts")) {
            callback(null, undefined);
          }
        });
    
        (db.run as jest.Mock).mockImplementation((query: string, params: any[], callback: (err: Error | null) => void) => {
          callback(null);
        });
    
        const result = await Dao.addToCart(mockUser, productId);
    
        expect(result).toBe(true);
        expect(db.get).toHaveBeenCalledTimes(2);
        expect(db.run).toHaveBeenCalledTimes(1);
      });
    
      test("should increase the amount of the product in the cart if already present", async () => {
        const productId = "product1";
    
        (db.get as jest.Mock).mockImplementation((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
          if (query.includes("SELECT * FROM products")) {
            callback(null, { model: productId, quantity: 10, sellingPrice: 100 });
          } else if (query.includes("SELECT cartId, amount FROM carts")) {
            callback(null, { cartId: "cart1", amount: 1 });
          } else if (query.includes("SELECT * FROM carts WHERE cartId")) {
            callback(null, { cartId: "cart1", model: productId });
          }
        });
    
        (db.run as jest.Mock).mockImplementation((query: string, params: any[], callback: (err: Error | null) => void) => {
          callback(null);
        });
    
        const result = await Dao.addToCart(mockUser, productId);
    
        expect(result).toBe(true);
        expect(db.get).toHaveBeenCalledTimes(3);
        expect(db.run).toHaveBeenCalledTimes(1);
      });
    
      test("should handle ProductNotFoundError if the product does not exist", async () => {
        const productId = "product1";
    
        (db.get as jest.Mock).mockImplementation((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
          if (query.includes("SELECT * FROM products")) {
            callback(null, undefined);
          }
        });
    
        await expect(Dao.addToCart(mockUser, productId)).rejects.toThrow(ProductNotFoundError);
        expect(db.get).toHaveBeenCalledTimes(1);
      });

      test("should handle ProductSoldError if the product is out of stock", async () => {
        const productId = "product1";
    
        (db.get as jest.Mock).mockImplementation((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
          if (query.includes("SELECT * FROM products")) {
            callback(null, { model: productId, quantity: 0, sellingPrice: 100 });
          }
        });
    
        await expect(Dao.addToCart(mockUser, productId)).rejects.toThrow(ProductSoldError);
        expect(db.get).toHaveBeenCalledTimes(1);
      });

      test("should handle database errors", async () => {
        const productId = "product1";
    
        (db.get as jest.Mock).mockImplementation((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
          callback(new Error("Database error"), null);
        });
    
        await expect(Dao.addToCart(mockUser, productId)).rejects.toThrow("Database error");
        expect(db.get).toHaveBeenCalledTimes(1);
      });
});

describe("checkoutCart", ()=> {

  test("should throw CartNotFoundError if no unpaid cart is found", async () => {
    (db.get as jest.Mock).mockImplementation((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
      if (query.includes("SELECT * FROM carts WHERE customer")) {
        callback(null, null);
      }
    });

    await expect(Dao.checkoutCart(mockUser)).rejects.toThrow(CartNotFoundError);
    expect(db.get).toHaveBeenCalledTimes(1);
  });

  test("should throw EmptyCartError if the cart is empty", async () => {
    (db.get as jest.Mock).mockImplementation((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
      if (query.includes("SELECT * FROM carts WHERE customer")) {
        callback(null, { cartId: "cart1", customer: mockUser.username, model: null, paid: false });
      }
    });

    await expect(Dao.checkoutCart(mockUser)).rejects.toThrow(EmptyCartError);
    expect(db.get).toHaveBeenCalledTimes(1);
  });

  test("should handle database errors", async () => {
    (db.get as jest.Mock).mockImplementation((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
      callback(new Error("Database error"), null);
    });

    await expect(Dao.checkoutCart(mockUser)).rejects.toThrow("Database error");
    expect(db.get).toHaveBeenCalledTimes(1);
  });

  test("should checkout the cart successfully", async () => {
  (db.get as jest.Mock).mockImplementationOnce((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
      // First call to db.get (get the cart)
      callback(null, { cartId: "cart1", customer: mockUser.username, model: "product1", paid: false });
    }).mockImplementationOnce((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
      // Second call to db.get (check product quantity)
      callback(null, null);
    });

    (db.run as jest.Mock).mockImplementation((query: string, params: any[], callback: (err: Error | null) => void) => {
      // Calls to db.run (update cart and products)
      callback(null);
    });

    const result = await Dao.checkoutCart(mockUser);

    expect(result).toBe(true);
    expect(db.get).toHaveBeenCalledTimes(2);
    expect(db.run).toHaveBeenCalledTimes(2);
  });

  test("should throw EmptyProductStockError if any product in the cart has insufficient stock", async () => {
    (db.get as jest.Mock).mockImplementationOnce((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
      // First call to db.get (get the cart)
      callback(null, { cartId: "cart1", customer: mockUser.username, model: "product1", paid: false });
    }).mockImplementationOnce((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
      // Second call to db.get (check product quantity)
      callback(null, { model: "product1" });
    });

    await expect(Dao.checkoutCart(mockUser)).rejects.toThrow(EmptyProductStockError);
    expect(db.get).toHaveBeenCalledTimes(2);
  });

  test("should handle database errors when retrieving cart", async () => {
    (db.get as jest.Mock).mockImplementationOnce((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
      callback(new Error("Database error"), null);
    });

    await expect(Dao.checkoutCart(mockUser)).rejects.toThrow("Database error");
    expect(db.get).toHaveBeenCalledTimes(1);
  });

  test("should handle database errors when checking product quantity", async () => {
    (db.get as jest.Mock)
      .mockImplementationOnce((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
        callback(null, { cartId: "cart1", customer: "testuser", model: "product1", paid: false });
      })
      .mockImplementationOnce((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
        callback(new Error("Database error"), null);
      });

    await expect(Dao.checkoutCart(mockUser)).rejects.toThrow("Database error");
    expect(db.get).toHaveBeenCalledTimes(2);
  });

  test("should handle database errors when updating cart details", async () => {
    (db.get as jest.Mock)
      .mockImplementationOnce((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
        callback(null, { cartId: "cart1", customer: "testuser", model: "product1", paid: false });
      })
      .mockImplementationOnce((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
        callback(null, null); // No product with 0 quantity or higher quantity than available
      });

    (db.run as jest.Mock).mockImplementationOnce((query: string, params: any[], callback: (err: Error | null) => void) => {
      callback(new Error("Database error"));
    });

    await expect(Dao.checkoutCart(mockUser)).rejects.toThrow("Database error");
    expect(db.get).toHaveBeenCalledTimes(2);
    expect(db.run).toHaveBeenCalledTimes(1);
  });

  test("should handle database errors when updating product quantities", async () => {
    (db.get as jest.Mock)
      .mockImplementationOnce((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
        callback(null, { cartId: "cart1", customer: "testuser", model: "product1", paid: false });
      })
      .mockImplementationOnce((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
        callback(null, null); // No product with 0 quantity or higher quantity than available
      });

    (db.run as jest.Mock)
      .mockImplementationOnce((query: string, params: any[], callback: (err: Error | null) => void) => {
        callback(null);
      })
      .mockImplementationOnce((query: string, params: any[], callback: (err: Error | null) => void) => {
        callback(new Error("Database error"));
      });

    await expect(Dao.checkoutCart(mockUser)).rejects.toThrow("Database error");
    expect(db.get).toHaveBeenCalledTimes(2);
    expect(db.run).toHaveBeenCalledTimes(2);
  });
});

describe("getCustomerCarts", ()=> {
  test("should return all paid carts with their products", async () => {
    (db.all as jest.Mock).mockImplementation((query: string, params: any[], callback: (err: Error | null, rows: any[]) => void) => {
      if (query.includes("SELECT cartId, customer, paid, paymentDate, SUM(cost*amount) as totalCost")) {
        callback(null, [
          { cartId: "cart1", customer: "testuser", paid: true, paymentDate: "2023-01-01", totalCost: 200 },
          { cartId: "cart2", customer: "testuser", paid: true, paymentDate: "2023-02-01", totalCost: 300 }
        ]);
      } else if (query.includes("SELECT * FROM carts WHERE cartId")) {
        if (params[0] === "cart1") {
          callback(null, [
            { model: "product1", amount: 2, cost: 50 },
            { model: "product2", amount: 1, cost: 100 }
          ]);
        } else if (params[0] === "cart2") {
          callback(null, [
            { model: "product3", amount: 3, cost: 100 }
          ]);
        }
      }
    });

    (db.get as jest.Mock).mockImplementation((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
      if (query.includes("SELECT * FROM products WHERE model")) {
        if (params[0] === "product1") {
          callback(null, { model: "product1", category: Category.APPLIANCE, sellingPrice: 60 });
        } else if (params[0] === "product2") {
          callback(null, { model: "product2", category: Category.LAPTOP, sellingPrice: 120 });
        } else if (params[0] === "product3") {
          callback(null, { model: "product3", category: Category.SMARTPHONE, sellingPrice: 130 });
        }
      }
    });

    const result = await Dao.getCustomerCarts(mockUser);

    expect(result).toEqual([
      {
        customer: "testuser",
        paid: true,
        paymentDate: "2023-01-01",
        total: 200,
        products: [
          new ProductInCart("product1", 2, Category.APPLIANCE, 60),
          new ProductInCart("product2", 1, Category.LAPTOP, 120)
        ]
      },
      {
        customer: "testuser",
        paid: true,
        paymentDate: "2023-02-01",
        total: 300,
        products: [
          new ProductInCart("product3", 3, Category.SMARTPHONE, 130)
        ]
      }
    ]);
    expect(db.all).toHaveBeenCalledTimes(3);
    expect(db.get).toHaveBeenCalledTimes(3);
  });

  test("should handle database errors when retrieving carts", async () => {
    (db.all as jest.Mock).mockImplementation((query: string, params: any[], callback: (err: Error | null, rows: any[]) => void) => {
      callback(new Error("Database error"), null);
    });

    await expect(Dao.getCustomerCarts(mockUser)).rejects.toThrow("Database error");
    expect(db.all).toHaveBeenCalledTimes(1);
  });

  test("should handle database errors when retrieving products", async () => {
    (db.all as jest.Mock).mockImplementation((query: string, params: any[], callback: (err: Error | null, rows: any[]) => void) => {
      if (query.includes("SELECT cartId, customer, paid, paymentDate, SUM(cost*amount) as totalCost")) {
        callback(null, [
          { cartId: "cart1", customer: "testuser", paid: true, paymentDate: "2023-01-01", totalCost: 200 }
        ]);
      } else if (query.includes("SELECT * FROM carts WHERE cartId")) {
        callback(null, [
          { model: "product1", amount: 2, cost: 50 }
        ]);
      }
    });

    (db.get as jest.Mock).mockImplementation((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
      callback(new Error("Database error"), null);
    });

    await expect(Dao.getCustomerCarts(mockUser)).rejects.toThrow("Database error");
    expect(db.all).toHaveBeenCalledTimes(2);
    expect(db.get).toHaveBeenCalledTimes(1);
  });
});

describe("removeProductFromCart", ()=> {

  test("should remove product from cart successfully when quantity is more than 1", async () => {
    (db.get as jest.Mock)
      .mockImplementationOnce((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
        // Check if the product exists
        callback(null, { model: "product1", category: "category1", sellingPrice: 100 });
      })
      .mockImplementationOnce((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
        // Check if the product is in the cart
        callback(null, { cartId: "cart1", amount: 2 });
      });

    (db.run as jest.Mock).mockImplementation((query: string, params: any[], callback: (err: Error | null) => void) => {
      callback.call({ changes: 1 }, null);
    });

    const result = await Dao.removeProductFromCart(mockUser, "product1");

    expect(result).toBe(true);
    expect(db.get).toHaveBeenCalledTimes(2);
    expect(db.run).toHaveBeenCalledTimes(1);
    expect(db.run).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE carts"),
      [1, "cart1", "testuser", "product1"],
      expect.any(Function)
    );
  });

  test("should remove product from cart successfully when quantity is 1", async () => {
    (db.get as jest.Mock)
      .mockImplementationOnce((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
        // Check if the product exists
        callback(null, { model: "product1", category: "category1", sellingPrice: 100 });
      })
      .mockImplementationOnce((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
        // Check if the product is in the cart
        callback(null, { cartId: "cart1", amount: 1 });
      });

    (db.run as jest.Mock).mockImplementation((query: string, params: any[], callback: (err: Error | null) => void) => {
      callback(null);
    });

    const result = await Dao.removeProductFromCart(mockUser, "product1");

    expect(result).toBe(true);
    expect(db.get).toHaveBeenCalledTimes(2);
    expect(db.run).toHaveBeenCalledTimes(1);
    expect(db.run).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM carts"),
      ["cart1", "testuser", "product1"],
      expect.any(Function)
    );
  });

  test("should throw ProductNotFoundError if the product does not exist", async () => {
    (db.get as jest.Mock).mockImplementation((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
      if (query.includes("SELECT * FROM products WHERE model")) {
        callback(null, null);
      }
    });

    await expect(Dao.removeProductFromCart(mockUser, "product1")).rejects.toThrow(ProductNotFoundError);
    expect(db.get).toHaveBeenCalledTimes(2);
  });

  test("should throw ProductNotInCartError if the product is not in the cart", async () => {
    (db.get as jest.Mock)
      .mockImplementationOnce((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
        // Check if the product exists
        callback(null, { model: "product1", category: "category1", sellingPrice: 100 });
      })
      .mockImplementationOnce((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
        // Check if the product is in the cart
        callback(null, null);
      });

    await expect(Dao.removeProductFromCart(mockUser, "product1")).rejects.toThrow(ProductNotInCartError);
    expect(db.get).toHaveBeenCalledTimes(2);
  });

  test("should handle database errors", async () => {
    (db.get as jest.Mock).mockImplementation((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
      callback(new Error("Database error"), null);
    });

    await expect(Dao.removeProductFromCart(mockUser, "product1")).rejects.toThrow("Database error");
    expect(db.get).toHaveBeenCalledTimes(2);
  });
})

describe("cleancart", ()=>{

  test("should clear the cart successfully when there are products in the cart", async () => {
    (db.run as jest.Mock).mockImplementation((query: string, params: any[], callback: (err: Error | null) => void) => {
      callback.call({ changes: 1 }, null); // Simulate a successful deletion
    });

    const result = await Dao.clearCart(mockUser);

    expect(result).toBe(true);
    expect(db.run).toHaveBeenCalledTimes(1);
    expect(db.run).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM carts"),
      ["testuser"],
      expect.any(Function)
    );
  });

  test("should throw CartNotFoundError if no unpaid cart is found for the user", async () => {
    (db.run as jest.Mock).mockImplementation((query: string, params: any[], callback: (err: Error | null) => void) => {
      callback.call({ changes: 0 }, null); // Simulate no rows affected
    });

    await expect(Dao.clearCart(mockUser)).rejects.toThrow(CartNotFoundError);
    expect(db.run).toHaveBeenCalledTimes(1);
  });

  test("should handle database errors", async () => {
    (db.run as jest.Mock).mockImplementation((query: string, params: any[], callback: (err: Error | null) => void) => {
      callback(new Error("Database error"));
    });

    await expect(Dao.clearCart(mockUser)).rejects.toThrow("Database error");
    expect(db.run).toHaveBeenCalledTimes(1);
  });
})

describe("deleteAllCarts", ()=>{

  test("should delete all carts successfully", async () => {
    (db.run as jest.Mock).mockImplementation((query: string, callback: (err: Error | null) => void) => {
      callback(null); // Simulate a successful deletion
    });

    const result = await Dao.deleteAllCarts();

    expect(result).toBe(true);
    expect(db.run).toHaveBeenCalledTimes(1);
    expect(db.run).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM carts"),
      expect.any(Function)
    );
  });

  test("should handle database errors", async () => {
    (db.run as jest.Mock).mockImplementation((query: string, callback: (err: Error | null) => void) => {
      callback(new Error("Database error")); // Simulate a database error
    });

    await expect(Dao.deleteAllCarts()).rejects.toThrow("Database error");
    expect(db.run).toHaveBeenCalledTimes(1);
  });
})

describe("getAllCarts", ()=>{

  test("should return all carts with their products", async () => {
    (db.all as jest.Mock)
      .mockImplementationOnce((query: string, callback: (err: Error | null, rows: any[]) => void) => {
        if (query.includes("SELECT cartId, customer, paid, paymentDate, SUM(cost*amount) as totalCost")) {
          callback(null, [
            { cartId: "cart1", customer: "user1", paid: true, paymentDate: "2023-01-01", totalCost: 200 },
            { cartId: "cart2", customer: "user2", paid: false, paymentDate: null, totalCost: 300 }
          ]);
        }
      })
      .mockImplementationOnce((query: string, params: any[], callback: (err: Error | null, rows: any[]) => void) => {
        if (query.includes("SELECT * FROM carts WHERE cartId")) {
          if (params[0] === "cart1") {
            callback(null, [
              { model: "product1", amount: 2, cost: 50 },
              { model: "product2", amount: 1, cost: 100 }
            ]);
          } else if (params[0] === "cart2") {
            callback(null, [
              { model: "product3", amount: 3, cost: 100 }
            ]);
          }
        }
      })
      .mockImplementationOnce((query: string, params: any[], callback: (err: Error | null, rows: any[]) => void) => {
        if (query.includes("SELECT * FROM carts WHERE cartId")) {
          if (params[0] === "cart2") {
            callback(null, [
              { model: "product3", amount: 3, cost: 100 }
            ]);
          }
        }
      });

    (db.get as jest.Mock)
      .mockImplementationOnce((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
        if (params[0] === "product1") {
          callback(null, { model: "product1", category: Category.APPLIANCE, sellingPrice: 60 });
        }
      })
      .mockImplementationOnce((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
        if (params[0] === "product2") {
          callback(null, { model: "product2", category: Category.LAPTOP, sellingPrice: 120 });
        }
      })
      .mockImplementationOnce((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
        if (params[0] === "product3") {
          callback(null, { model: "product3", category: Category.SMARTPHONE, sellingPrice: 130 });
        }
      });

    const result = await Dao.getAllCarts();

    expect(result).toEqual([
      {
        customer: "user1",
        paid: true,
        paymentDate: "2023-01-01",
        total: 200,
        products: [
          new ProductInCart("product1", 2, Category.APPLIANCE, 60),
          new ProductInCart("product2", 1, Category.LAPTOP, 120)
        ]
      },
      {
        customer: "user2",
        paid: false,
        paymentDate: null,
        total: 300,
        products: [
          new ProductInCart("product3", 3, Category.SMARTPHONE, 130)
        ]
      }
    ]);

    expect(db.all).toHaveBeenCalledTimes(3); // 1 call for getting carts + 2 calls for getting products of each cart
    expect(db.get).toHaveBeenCalledTimes(3); // 3 product fetches
  });

  test("should handle database errors when retrieving carts", async () => {
    (db.all as jest.Mock).mockImplementationOnce((query: string, callback: (err: Error | null, rows: any[]) => void) => {
      callback(new Error("Database error"), null);
    });

    await expect(Dao.getAllCarts()).rejects.toThrow("Database error");
    expect(db.all).toHaveBeenCalledTimes(1);
  });

  test("should handle database errors when retrieving products", async () => {
    (db.all as jest.Mock)
      .mockImplementationOnce((query: string, callback: (err: Error | null, rows: any[]) => void) => {
        if (query.includes("SELECT cartId, customer, paid, paymentDate, SUM(cost*amount) as totalCost")) {
          callback(null, [
            { cartId: "cart1", customer: "user1", paid: true, paymentDate: "2023-01-01", totalCost: 200 }
          ]);
        }
      })
      .mockImplementationOnce((query: string, params: any[], callback: (err: Error | null, rows: any[]) => void) => {
        if (query.includes("SELECT * FROM carts WHERE cartId")) {
          callback(null, [
            { model: "product1", amount: 2, cost: 50 }
          ]);
        }
      });

    (db.get as jest.Mock).mockImplementationOnce((query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
      callback(new Error("Database error"), null);
    });

    await expect(Dao.getAllCarts()).rejects.toThrow("Database error");
    expect(db.all).toHaveBeenCalledTimes(2);
    expect(db.get).toHaveBeenCalledTimes(1);
  });
});
