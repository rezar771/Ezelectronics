import db from "../db/db";
import { randomUUID } from "crypto";
import { User } from "../components/user";
import { Cart, ProductInCart } from "../components/cart";
import {
  ProductNotFoundError,
  EmptyProductStockError,
} from "../errors/productError";
import {
  CartNotFoundError,
  EmptyCartError,
  ProductNotInCartError,
} from "../errors/cartError";
/**
 * A class that implements the interaction with the database for all cart-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class CartDAO {
  getCart(user: User): Promise<Cart> {
    return new Promise<Cart>((resolve, reject) => {
      try {
        const customer = user.username;
        const getCartSql = `SELECT * FROM carts WHERE customer = ? AND paid = 'false'`;

        db.all(getCartSql, [customer], (err: Error | null, rows: any[]) => {
          if (err) {
            reject(err);
            return;
          }

          if (!rows || rows.length === 0) {
            // If there is no unpaid cart, return an empty cart
            const emptyCart: Cart = {
              customer: user.username,
              paid: false,
              paymentDate: null,
              total: 0,
              products: [],
            };
            resolve(emptyCart);
          } else {
            const cart: Cart = {
              customer: rows[0].customer,
              paid: rows[0].paid,
              paymentDate: rows[0].paymentDate,
              total: 0,
              products: [],
            };

            const productsSql = `SELECT * FROM products WHERE model = ?`;
            const productsPromises: Promise<ProductInCart>[] = [];

            for (let i = 0; i < rows.length; i++) {
              const productPromise = new Promise<ProductInCart>(
                (resolve, reject) => {
                  db.get(
                    productsSql,
                    [rows[i].model],
                    (err: Error | null, productRow: any) => {
                      if (err) {
                        reject(err);
                        return;
                      }

                      cart.total += rows[i].cost * rows[i].amount;

                      const product = new ProductInCart(
                        productRow.model,
                        rows[i].amount,
                        productRow.category,
                        productRow.sellingPrice
                      );
                      resolve(product);
                    }
                  );
                }
              );
              productsPromises.push(productPromise);
            }
            Promise.all(productsPromises)
              .then((products) => {
                cart.products = products;
                resolve(cart);
              })
              .catch((err) => {
                reject(err);
              });
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  addToCart(user: User, productId: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        const customer = user.username;

        // Check if the product exists
        const checkProductSql = `SELECT * FROM products WHERE model = ?`;

        db.get(
          checkProductSql,
          [productId],
          (err: Error | null, productRow: any) => {
            if (err) {
              reject(err);
              return;
            }

            if (!productRow) {
              // If the product doesn't exist, return a 404 error
              reject(new ProductNotFoundError());
              return;
            }

            if (productRow.quantity === 0) {
              // If the product's quantity is 0, return a 409 error
              reject(new EmptyProductStockError());
              return;
            }

            // Check if there is an unpaid cart for the user
            const checkCartSql = `SELECT cartId, amount FROM carts WHERE customer = ? AND paid = 'false'`;

            db.get(
              checkCartSql,
              [customer],
              (err: Error | null, cartRow: any) => {
                if (err) {
                  reject(err);
                  return;
                }

                if (!cartRow) {
                  // If there is no unpaid cart, create a new one and add the product
                  const uuid: string = randomUUID();
                  const insertCartSql = `INSERT INTO carts (cartId,customer, model, paid, amount, cost)
                        VALUES (?,?, ?, 'false', 1, ?)`;

                  db.run(
                    insertCartSql,
                    [uuid, customer, productId, productRow.sellingPrice],
                    (err: Error | null) => {
                      if (err) {
                        reject(err);
                        return;
                      }
                      resolve(true);
                    }
                  );
                } else {
                  // If there is an unpaid cart, check if the product is already in the cart
                  const cartId = cartRow.cartId;
                  const checkProductInCartSql = `SELECT * FROM carts WHERE cartId = ? AND model = ? AND customer = ?`;

                  db.get(
                    checkProductInCartSql,
                    [cartId, productId, customer],
                    (err: Error | null, productInCartRow: any) => {
                      if (err) {
                        reject(err);
                        return;
                      }

                      if (!productInCartRow) {
                        // If the product is not in the cart, add it
                        const insertProductSql = `INSERT INTO carts (cartId, customer, model, paid, amount, cost)
                                VALUES (?, ?, ?, 'false', 1, ?)`;

                        db.run(
                          insertProductSql,
                          [
                            cartId,
                            customer,
                            productId,
                            productRow.sellingPrice,
                          ],
                          (err: Error | null) => {
                            if (err) {
                              reject(err);
                              return;
                            }
                            resolve(true);
                          }
                        );
                      } else {
                        // If the product is already in the cart, increase its amount by one
                        const updateAmountSql = `UPDATE carts
                                SET amount = amount + 1
                                WHERE cartId = ? AND model = ? AND customer = ?`;

                        db.run(
                          updateAmountSql,
                          [cartId, productId, customer],
                          (err: Error | null) => {
                            if (err) {
                              reject(err);
                              return;
                            }
                            resolve(true);
                          }
                        );
                      }
                    }
                  );
                }
              }
            );
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }
  checkoutCart(user: User): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        const customer = user.username;

        // Query to retrieve the unpaid cart for the user
        const getCartSql = `SELECT * FROM carts WHERE customer = ? AND paid = 'false'`;

        db.get(getCartSql, [customer], (err: Error | null, cartRow: any) => {
          if (err) {
            reject(err);
            return;
          }

          if (!cartRow) {
            // If there is no unpaid cart, return a 404 error
            reject(new CartNotFoundError());
            return;
          }

          // Check if the cart contains products
          if (!cartRow.model) {
            // If the cart is empty, return a 400 error
            reject(new EmptyCartError());
            return;
          }

          // Check if any product in the cart has 0 available quantity
          const checkQuantitySql = `SELECT * FROM carts
                WHERE cartId = ? AND (amount > (SELECT quantity FROM products WHERE model = carts.model) OR (SELECT quantity FROM products WHERE model = carts.model) = 0)`;

          db.get(
            checkQuantitySql,
            [cartRow.cartId],
            (err: Error | null, productRow: any) => {
              if (err) {
                reject(err);
                return;
              }

              if (productRow) {
                // If any product in the cart has 0 available quantity or higher quantity than available, return a 409 error
                reject(new EmptyProductStockError());
                return;
              }

              // Update cart details
              const currentDate = new Date().toISOString().split("T")[0]; // Get current date in YYYY-MM-DD format
              const updateCartSql = `UPDATE carts
                    SET paid = 'true', paymentDate = ?
                    WHERE cartId = ?`;

              db.run(
                updateCartSql,
                [currentDate, cartRow.cartId],
                function (err: Error | null) {
                  if (err) {
                    reject(err);
                    return;
                  }
                  // Update product quantities
                  const updateProductSql = `UPDATE products
                  SET quantity = quantity - (SELECT amount FROM carts WHERE cartId = ? AND model = products.model)
                  WHERE model IN (SELECT model FROM carts WHERE cartId = ?)`;

                  db.run(
                    updateProductSql,
                    [cartRow.cartId, cartRow.cartId],
                    (err: Error | null) => {
                      if (err) {
                        reject(err);
                        return;
                      }

                      resolve(true);
                    }
                  );
                }
              );
            }
          );
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  getCustomerCarts(user: User): Promise<Cart[]> {
    return new Promise<Cart[]>((resolve, reject) => {
      try {
        const customer = user.username;
        const customerCarts: Cart[] = [];
        // Query to retrieve paid carts for the customer
        const getCustomerCartsSql = `
                SELECT cartId, customer, paid, paymentDate, SUM(cost*amount) as totalCost
                FROM carts
                WHERE customer = ? AND paid = 'true'
                GROUP BY cartId
            `;

        db.all(
          getCustomerCartsSql,
          [customer],
          (err: Error | null, cartRows: any[]) => {
            if (err) {
              reject(err);
              return;
            }

            const cartPromises = cartRows.map((cartRow: any) => {
              return new Promise<void>((resolve, reject) => {
                const cart: Cart = {
                  customer: cartRow.customer,
                  paid: cartRow.paid,
                  paymentDate: cartRow.paymentDate,
                  total: 0,
                  products: [],
                };

                const getCartProductsSql = `SELECT * FROM carts WHERE cartId=? AND customer = ? AND paid = 'true'`;
                db.all(
                  getCartProductsSql,
                  [cartRow.cartId, customer],
                  (err: Error | null, rows: any[]) => {
                    if (err) {
                      reject(err);
                      return;
                    }

                    const productPromises = rows.map((row: any) => {
                      return new Promise<void>((resolve, reject) => {
                        const productsSql = `SELECT * FROM products WHERE model = ?`;
                        db.get(
                          productsSql,
                          [row.model],
                          (err: Error | null, productRow: any) => {
                            if (err) {
                              reject(err);
                              return;
                            }

                            const product = new ProductInCart(
                              productRow.model,
                              row.amount,
                              productRow.category,
                              productRow.sellingPrice
                            );
                            cart.total += row.cost * row.amount;
                            cart.products.push(product);
                            resolve();
                          }
                        );
                      });
                    });

                    Promise.all(productPromises)
                      .then(() => {
                        customerCarts.push(cart);
                        resolve();
                      })
                      .catch((err) => {
                        reject(err);
                      });
                  }
                );
              });
            });

            Promise.all(cartPromises)
              .then(() => {
                resolve(customerCarts);
              })
              .catch((err) => {
                reject(err);
              });
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  removeProductFromCart(user: User, product: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        const customer = user.username;
        // Check if the product exists
        const checkProductSql = `SELECT * FROM products WHERE model = ?`;

        db.get(
          checkProductSql,
          [product],
          (err: Error | null, productRow: any) => {
            if (err) {
              reject(err);
              return;
            }

            if (!productRow) {
              // If the product doesn't exist, return a 404 error
              reject(new ProductNotFoundError());
              return;
            }
          }
        );
        // Query to check if the product is in the cart
        const checkProductInCartSql = `SELECT *
            FROM carts
            WHERE customer = ? AND model = ? AND paid = 'false' `;
        db.get(
          checkProductInCartSql,
          [customer, product],
          (err: Error | null, cartRow: any) => {
            if (err) {
              reject(err);
              return;
            }

            if (!cartRow) {
              // Return a 404 error if the product is not in the cart
              reject(new ProductNotInCartError());
              return;
            }

            const newAmount = cartRow.amount - 1;

            // Update the cart to remove one unit of the product
            const updateCartSql = `UPDATE carts
                SET amount = ?
                WHERE cartId = ? AND customer = ? AND model = ? AND paid = 'false'`;
            if (newAmount === 0) {
              // If the new amount is 0, delete the product from the cart
              const deleteProductFromCartSql = `DELETE FROM carts WHERE cartId = ? AND customer = ? AND model = ? AND paid = 'false'`;
              db.run(
                deleteProductFromCartSql,
                [cartRow.cartId, customer, product],
                function (err: Error | null) {
                  if (err) {
                    reject(err);
                    return;
                  }
                  resolve(true);
                }
              );
            } else {
              // Otherwise, update the amount
              db.run(
                updateCartSql,
                [newAmount, cartRow.cartId, customer, product],
                function (err: Error | null) {
                  if (err) {
                    reject(err);
                    return;
                  }

                  // Check if any row has been updated
                  if (this.changes === 0) {
                    // Return a 404 error if no row has been updated (product not found in the cart)
                    reject(new ProductNotInCartError());
                    return;
                  }

                  // Product successfully removed from the cart
                  resolve(true);
                }
              );
            }
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  clearCart(user: User): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        const customer = user.username;

        // Query to delete all products from the cart
        const clearCartSql = `DELETE FROM carts
            WHERE customer = ? AND paid = 'false'`;
        db.run(clearCartSql, [customer], function (err: Error | null) {
          if (err) {
            reject(err);
            return;
          }

          // Check if any row has been deleted
          if (this.changes === 0) {
            // Return a 404 error if no row has been deleted (no unpaid cart for the user)
            reject(new CartNotFoundError());
            return;
          }

          // Cart successfully cleared
          resolve(true);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  deleteAllCarts(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        // Query to delete all carts
        const deleteAllCartsSql = `
            DELETE FROM carts
        `;
        db.run(deleteAllCartsSql, function (err: Error | null) {
          if (err) {
            reject(err);
            return;
          }

          // Cart successfully deleted
          resolve(true);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  getAllCarts(): Promise<Cart[]> {
    return new Promise<Cart[]>((resolve, reject) => {
      try {
        // Query to retrieve all carts
        const getAllCartsSql = `
            SELECT cartId, customer, paid, paymentDate, SUM(cost*amount) as totalCost
            FROM carts
            GROUP BY cartId
        `;
        db.all(getAllCartsSql, (err: Error | null, rows: any[]) => {
          if (err) {
            reject(err);
            return;
          }

          const getCartProductsSql = `SELECT model,amount,cost
                            FROM carts
                            WHERE cartId = ? AND customer = ? `;

          const customerCarts: Cart[] = rows.map((cartRow: any) => {
            // Map each row to a Cart object
            const cart: Cart = {
              customer: cartRow.customer,
              paid: cartRow.paid,
              paymentDate: cartRow.paymentDate,
              total: cartRow.totalCost,
              products: [], // Array to store products for this cart
            };
            db.all(
              getCartProductsSql,
              [cartRow.cartId, cartRow.customer],
              (err: Error | null, productRows: any[]) => {
                if (err) {
                  reject(err);
                  return;
                }
                // Map each product row to a ProductInCart object and push it to the products array of the cart
                const getCategoryProductsSql = `SELECT category
                            FROM products
                            WHERE model = ?`;
                productRows.forEach((productRow: any) => {
                  db.get(
                    getCategoryProductsSql,
                    [productRow.model],
                    (err: Error | null, categoryRow: any) => {
                      if (err) {
                        reject(err);
                        return;
                      }
                      const product: ProductInCart = {
                        model: productRow.model,
                        quantity: productRow.amount,
                        category: categoryRow,
                        price: productRow.cost,
                      };
                      cart.products.push(product);
                    }
                  );
                });
              }
            );
            return cart;
          });

          resolve(customerCarts);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default CartDAO;
